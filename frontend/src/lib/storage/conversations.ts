import type { StoredConversation, StoredMessage } from './types';
import { StorageUnavailableError, type KeyValueBackend } from './backend';

export const SCHEMA_VERSION = 1;
const STORE_KEY = 'miniweb:conversations';
const VERSION_KEY = 'miniweb:schema-version';

export interface LoadResult {
	conversations: StoredConversation[];
	persistent: boolean;
	corrupted: boolean;
}

export function createId(): string {
	if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
	const bytes = new Uint8Array(16);
	globalThis.crypto.getRandomValues(bytes);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createMessage(role: StoredMessage['role'], content: string): StoredMessage {
	const now = Date.now();
	return {
		id: createId(),
		role,
		content,
		createdAt: now,
		status: role === 'user' ? 'complete' : undefined
	};
}

export function createConversation(modelId: string): StoredConversation {
	const now = Date.now();
	return {
		id: createId(),
		title: 'New chat',
		createdAt: now,
		updatedAt: now,
		modelId,
		messages: []
	};
}

export function titleFromMessage(content: string): string {
	const normalized = content.replace(/\s+/g, ' ').trim();
	if (!normalized) return 'New chat';
	return normalized.length > 48 ? `${normalized.slice(0, 48).trimEnd()}…` : normalized;
}

export function loadConversations(kv: KeyValueBackend): LoadResult {
	const persistent = kv.persistent;
	try {
		const raw = kv.get(STORE_KEY);
		if (raw === null) {
			return { conversations: [], persistent, corrupted: false };
		}
		const version = parseVersion(kv.get(VERSION_KEY));
		const conversations = migrate(JSON.parse(raw), version);
		return { conversations, persistent, corrupted: false };
	} catch (error) {
		if (error instanceof StorageUnavailableError) {
			return { conversations: [], persistent: false, corrupted: false };
		}
		return { conversations: [], persistent, corrupted: true };
	}
}

export function saveConversations(kv: KeyValueBackend, conversations: StoredConversation[]): void {
	const serialized = JSON.stringify({ version: SCHEMA_VERSION, conversations });
	kv.set(VERSION_KEY, String(SCHEMA_VERSION));
	kv.set(STORE_KEY, serialized);
}

export function clearConversations(kv: KeyValueBackend): void {
	kv.remove(STORE_KEY);
	kv.remove(VERSION_KEY);
}

type Unknown = Record<string, unknown>;

function parseVersion(raw: string | null): number {
	const parsed = Number.parseInt(raw ?? '', 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function migrate(data: unknown, version: number): StoredConversation[] {
	if (!Array.isArray(data)) {
		const legacy = data as Unknown | null;
		const legacyList = legacy?.conversations;
		if (Array.isArray(legacyList))
			return normalizeConversations(legacyList, Math.max(version, SCHEMA_VERSION));
		return [];
	}
	return normalizeConversations(data, version);
}

function normalizeConversations(items: unknown[], version: number): StoredConversation[] {
	const result: StoredConversation[] = [];
	for (const item of items) {
		const conversation = normalizeConversation(item, version);
		if (conversation) result.push(conversation);
	}
	return result;
}

function normalizeConversation(item: unknown, version: number): StoredConversation | null {
	if (!isRecord(item)) return null;
	const id = typeof item.id === 'string' && item.id ? item.id : null;
	const modelId = typeof item.modelId === 'string' && item.modelId ? item.modelId : null;
	if (!id || !modelId) return null;
	const updatedAtRaw = toPositiveInt(item.updatedAt);
	const createdAt = toPositiveInt(item.createdAt) ?? updatedAtRaw ?? Date.now();
	const title = typeof item.title === 'string' && item.title.trim() ? item.title : 'New chat';
	const messages = normalizeMessages(item.messages, modelId);
	if (version < SCHEMA_VERSION) {
		for (const message of messages) {
			message.status ??= 'complete';
		}
	}
	return {
		id,
		title: title.slice(0, 80),
		createdAt,
		updatedAt: updatedAtRaw ?? createdAt,
		modelId,
		messages
	};
}

function normalizeMessages(raw: unknown, defaultModelId: string): StoredMessage[] {
	if (!Array.isArray(raw)) return [];
	const result: StoredMessage[] = [];
	for (const item of raw) {
		if (!isRecord(item)) continue;
		const role = item.role;
		if (role !== 'user' && role !== 'assistant') continue;
		const content = typeof item.content === 'string' ? item.content : null;
		if (content === null) continue;
		const createdAt = toPositiveInt(item.createdAt);
		if (!createdAt) continue;
		const message: StoredMessage = {
			id: typeof item.id === 'string' && item.id ? item.id : createId(),
			role,
			content,
			createdAt,
			status: parseStatus(item.status) ?? (role === 'user' ? 'complete' : undefined)
		};
		if (role === 'assistant') {
			message.modelId = typeof item.modelId === 'string' ? item.modelId : defaultModelId;
		} else if (typeof item.modelId === 'string') {
			message.modelId = item.modelId;
		}
		const errorCode = typeof item.errorCode === 'string' ? item.errorCode : undefined;
		if (errorCode) message.errorCode = errorCode;
		result.push(message);
	}
	return result;
}

function parseStatus(raw: unknown): StoredMessage['status'] | undefined {
	if (raw === 'complete' || raw === 'aborted' || raw === 'error') return raw;
	return undefined;
}

function isRecord(value: unknown): value is Unknown {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPositiveInt(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}
