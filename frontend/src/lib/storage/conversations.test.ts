import { describe, expect, it } from 'vitest';
import { MemoryBackend } from './backend';
import {
	SCHEMA_VERSION,
	createId,
	createMessage,
	createConversation,
	loadConversations,
	migrate,
	saveConversations,
	titleFromMessage
} from './conversations';
import type { StoredConversation } from './types';

describe('MemoryBackend', () => {
	it('stores and retrieves values', () => {
		const backend = new MemoryBackend();
		backend.set('key', 'value');
		expect(backend.get('key')).toBe('value');
		backend.remove('key');
		expect(backend.get('key')).toBeNull();
	});
});

describe('createConversation / createMessage', () => {
	it('creates a conversation with stable shape', () => {
		const conversation = createConversation('minillm-40m');
		expect(conversation.title).toBe('New chat');
		expect(conversation.modelId).toBe('minillm-40m');
		expect(conversation.messages).toEqual([]);
		expect(typeof conversation.id).toBe('string');
		expect(conversation.createdAt).toBeGreaterThan(0);
	});

	it('creates unique ids', () => {
		const ids = new Set(Array.from({ length: 200 }, () => createId()));
		expect(ids.size).toBe(200);
	});

	it('creates user messages as complete, assistant messages without status', () => {
		expect(createMessage('user', 'salut').status).toBe('complete');
		expect(createMessage('assistant', '').status).toBeUndefined();
	});

	it('derives a bounded title from the first message', () => {
		expect(titleFromMessage('Bonjour')).toBe('Bonjour');
		expect(titleFromMessage('  du   text   sur   plusieurs    espaces ')).toBe(
			'du text sur plusieurs espaces'
		);
		const long = 'a'.repeat(100);
		expect(titleFromMessage(long).length).toBeLessThanOrEqual(49);
		expect(titleFromMessage(long).endsWith('…')).toBe(true);
	});
});

describe('save / load round trip', () => {
	it('persists and reloads conversations', () => {
		const backend = new MemoryBackend();
		const conversation: StoredConversation = {
			id: 'c1',
			title: 'Titre',
			createdAt: 1000,
			updatedAt: 2000,
			modelId: 'minillm-70m',
			messages: [
				{ id: 'm1', role: 'user', content: 'salut', createdAt: 1100, status: 'complete' },
				{
					id: 'm2',
					role: 'assistant',
					content: 'bonjour',
					createdAt: 1200,
					status: 'aborted',
					modelId: 'minillm-70m'
				}
			]
		};
		saveConversations(backend, [conversation]);
		const result = loadConversations(backend);
		expect(result.corrupted).toBe(false);
		expect(result.conversations).toEqual([conversation]);
	});
});

describe('corrupted storage', () => {
	it('returns an empty list with corrupted flag on invalid JSON', () => {
		const backend = new MemoryBackend();
		backend.set('miniweb:schema-version', String(SCHEMA_VERSION));
		backend.set('miniweb:conversations', '{not-json');
		const result = loadConversations(backend);
		expect(result.corrupted).toBe(true);
		expect(result.conversations).toEqual([]);
	});

	it('returns empty list when the payload is not an array', () => {
		const backend = new MemoryBackend();
		backend.set('miniweb:schema-version', String(SCHEMA_VERSION));
		backend.set('miniweb:conversations', '{"weird": true}');
		const result = loadConversations(backend);
		expect(result.conversations).toEqual([]);
	});

	it('filters out malformed entries instead of crashing', () => {
		const backend = new MemoryBackend();
		backend.set('miniweb:schema-version', String(SCHEMA_VERSION));
		backend.set(
			'miniweb:conversations',
			JSON.stringify([
				{ id: 'ok', title: 'T', createdAt: 1, updatedAt: 2, modelId: 'minillm-40m', messages: [] },
				{ broken: true },
				'string item',
				{ id: 'no-model', title: 'T', createdAt: 1 }
			])
		);
		const result = loadConversations(backend);
		expect(result.conversations).toHaveLength(1);
		expect(result.conversations[0].id).toBe('ok');
	});

	it('assigns defaults when fields are missing', () => {
		const backend = new MemoryBackend();
		backend.set('miniweb:schema-version', String(SCHEMA_VERSION));
		backend.set(
			'miniweb:conversations',
			JSON.stringify([
				{
					id: 'c',
					modelId: 'minillm-40m',
					messages: [{ role: 'user', content: 'a', createdAt: 5 }]
				}
			])
		);
		const result = loadConversations(backend);
		expect(result.conversations[0].title).toBe('New chat');
		expect(result.conversations[0].messages[0].id).toBeTruthy();
		expect(result.conversations[0].messages[0].status).toBe('complete');
	});
});

describe('migrations', () => {
	it('migrates a version-0 payload with missing statuses and ids', () => {
		const legacy = [
			{
				id: 'c1',
				title: 'Ancienne',
				createdAt: 10,
				updatedAt: 20,
				modelId: 'minillm-40m',
				messages: [
					{ role: 'user', content: 'question', createdAt: 11 },
					{ role: 'assistant', content: 'réponse', createdAt: 12 }
				]
			}
		];
		const migrated = migrate(legacy, 0);
		expect(migrated[0].messages.every((message) => message.status === 'complete')).toBe(true);
		expect(migrated[0].messages.every((message) => message.id)).toBe(true);
		expect(migrated[0].title).toBe('Ancienne');
	});

	it('keeps v1 payloads untouched', () => {
		const payload = [
			{ id: 'c1', title: 'T', createdAt: 1, updatedAt: 1, modelId: 'minillm-40m', messages: [] }
		];
		expect(migrate(payload, SCHEMA_VERSION)).toEqual(payload);
	});

	it('supports the wrapped legacy format with a conversations key', () => {
		const wrapped = {
			conversations: [
				{ id: 'c1', title: 'T', createdAt: 1, updatedAt: 1, modelId: 'minillm-40m', messages: [] }
			]
		};
		expect(migrate(wrapped, SCHEMA_VERSION)).toEqual(wrapped.conversations);
	});
});
