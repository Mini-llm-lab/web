import {
	createConversation,
	createMessage,
	loadConversations,
	saveConversations,
	titleFromMessage
} from '#lib/storage/conversations';
import { openStorage, type KeyValueBackend } from '#lib/storage/backend';
import type { StoredConversation, StoredMessage } from '#lib/storage/types';

let backend: KeyValueBackend | null = null;

export const conversationsStore = $state({
	list: [] as StoredConversation[],
	activeId: null as string | null,
	loaded: false,
	persistent: true,
	corrupted: false
});

export function initConversations(): void {
	if (backend) return;
	backend = openStorage();
	const result = loadConversations(backend);
	conversationsStore.list = result.conversations;
	conversationsStore.persistent = result.persistent;
	conversationsStore.corrupted = result.corrupted;
	conversationsStore.loaded = true;
	if (result.conversations.length > 0) {
		conversationsStore.activeId = mostRecent().id;
	}
}

function mostRecent(): StoredConversation {
	return sortedConversations()[0];
}

export function sortedConversations(): StoredConversation[] {
	return [...conversationsStore.list].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function activeConversation(): StoredConversation | null {
	if (!conversationsStore.activeId) return null;
	return conversationsStore.list.find((item) => item.id === conversationsStore.activeId) ?? null;
}

export function createNewConversation(modelId: string): StoredConversation {
	const conversation = createConversation(modelId);
	conversationsStore.list.push(conversation);
	conversationsStore.activeId = conversation.id;
	save();
	return conversation;
}

export function selectConversation(id: string): void {
	conversationsStore.activeId = id;
}

export function closeConversation(): void {
	conversationsStore.activeId = null;
}

export function renameConversation(conversationId: string, title: string): void {
	const conversation = find(conversationId);
	if (!conversation) return;
	const trimmed = title.replace(/\s+/g, ' ').trim().slice(0, 80);
	conversation.title = trimmed || titleFromMessage(conversation.messages.at(0)?.content ?? '');
	conversation.updatedAt = Date.now();
	save();
}

export function deleteConversation(conversationId: string): void {
	const index = conversationsStore.list.findIndex((item) => item.id === conversationId);
	if (index === -1) return;
	conversationsStore.list.splice(index, 1);
	if (conversationsStore.activeId === conversationId) {
		conversationsStore.activeId = conversationsStore.list.length > 0 ? mostRecent().id : null;
	}
	save();
}

export function appendMessage(conversationId: string, message: StoredMessage): void {
	const conversation = find(conversationId);
	if (!conversation) return;
	conversation.messages.push(message);
	conversation.updatedAt = Date.now();
	if (conversation.title === 'Nouvelle conversation' && message.role === 'user') {
		conversation.title = titleFromMessage(message.content);
	}
	save();
}

export function appendToMessage(conversationId: string, messageId: string, token: string): void {
	const message = findMessage(conversationId, messageId);
	if (!message) return;
	message.content += token;
	save();
}

export function finishMessage(
	conversationId: string,
	messageId: string,
	status: StoredMessage['status'],
	errorCode?: string
): void {
	const message = findMessage(conversationId, messageId);
	if (!message) return;
	message.status = status;
	message.errorCode = errorCode;
	const conversation = find(conversationId);
	if (conversation) conversation.updatedAt = Date.now();
	save();
}

export function setConversationModel(
	conversationId: string,
	messageId: string,
	modelId: string
): void {
	const message = findMessage(conversationId, messageId);
	if (message && message.role === 'assistant') {
		message.modelId = modelId;
	}
	const conversation = find(conversationId);
	if (conversation) conversation.modelId = modelId;
}

export function dropTrailingAssistantMessages(conversationId: string): void {
	const conversation = find(conversationId);
	if (!conversation) return;
	while (conversation.messages.length > 0) {
		const last = conversation.messages.at(-1);
		if (!last || last.role === 'user') break;
		conversation.messages.pop();
	}
	conversation.updatedAt = Date.now();
	save();
}

export { createMessage };

function find(conversationId: string): StoredConversation | null {
	return conversationsStore.list.find((item) => item.id === conversationId) ?? null;
}

function findMessage(conversationId: string, messageId: string): StoredMessage | null {
	return find(conversationId)?.messages.find((message) => message.id === messageId) ?? null;
}

function save(): void {
	if (!backend) {
		conversationsStore.persistent = false;
		return;
	}
	try {
		saveConversations(backend, conversationsStore.list);
		conversationsStore.persistent = true;
	} catch {
		conversationsStore.persistent = false;
	}
}
