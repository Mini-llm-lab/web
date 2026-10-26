import { streamChat } from '#lib/api/client';
import { ApiError, type ChatMessageParam } from '#lib/api/types';
import {
	appendMessage,
	appendToMessage,
	dropTrailingAssistantMessages,
	finishMessage,
	setConversationModel
} from '#lib/stores/conversations.svelte';
import { modelsStore, resolveModel } from '#lib/stores/models.svelte';
import { createMessage } from '#lib/storage/conversations';
import type { StoredConversation } from '#lib/storage/types';

export const generationStore = $state({
	conversationId: null as string | null,
	controller: null as AbortController | null
});

export function isGenerating(conversationId: string): boolean {
	return generationStore.conversationId === conversationId && generationStore.controller !== null;
}

export function stopGeneration(): void {
	generationStore.controller?.abort();
}

export function pickModelId(): string | null {
	const model = resolveModel(modelsStore.selectedId);
	if (model && model.available) return model.id;
	const fallback = modelsStore.list.find((candidate) => candidate.available);
	return fallback?.id ?? null;
}

export function sendMessage(conversation: StoredConversation, text: string): void {
	if (generationStore.controller) return;
	const trimmed = text.trim();
	if (!trimmed) return;
	const modelId = pickModelId();
	if (!modelId) return;
	appendMessage(conversation.id, createMessage('user', trimmed));
	runGeneration(conversation, modelId);
}

export function retryLastGeneration(conversation: StoredConversation): void {
	if (generationStore.controller) return;
	const modelId = pickModelId();
	if (!modelId) return;
	dropTrailingAssistantMessages(conversation.id);
	runGeneration(conversation, modelId);
}

function activeModelContextTokens(modelId: string): number {
	return resolveModel(modelId)?.contextTokens ?? 512;
}

function runGeneration(conversation: StoredConversation, modelId: string): void {
	const payloadMessages = historyFor(conversation, modelId);
	if (payloadMessages.length === 0 || payloadMessages.at(-1)?.role !== 'user') {
		return;
	}
	const placeholder = createMessage('assistant', '');
	appendMessage(conversation.id, placeholder);
	setConversationModel(conversation.id, placeholder.id, modelId);

	const controller = new AbortController();
	generationStore.conversationId = conversation.id;
	generationStore.controller = controller;

	runStream(controller, conversation, placeholder, {
		model: modelId,
		messages: payloadMessages,
		max_tokens: 512,
		contextTokens: activeModelContextTokens(modelId)
	});
}

interface StreamParams {
	model: string;
	messages: ChatMessageParam[];
	max_tokens: number;
	contextTokens: number;
}

async function runStream(
	controller: AbortController,
	conversation: StoredConversation,
	placeholder: ReturnType<typeof createMessage>,
	params: StreamParams
): Promise<void> {
	try {
		const outcome = await streamChat(
			{ model: params.model, messages: params.messages, max_tokens: params.max_tokens },
			{
				onDelta: (text) => {
					if (controller.signal.aborted) return;
					appendToMessage(conversation.id, placeholder.id, text);
				}
			},
			controller.signal
		);
		const partial = findMessage(conversation, placeholder.id)?.content ?? '';
		if (outcome === 'done' && partial.trim() === '') {
			finishMessage(conversation.id, placeholder.id, 'error', 'empty_response');
			return;
		}
		finishMessage(conversation.id, placeholder.id, outcome === 'done' ? 'complete' : 'aborted');
	} catch (error) {
		if (error instanceof ApiError) {
			finishMessage(conversation.id, placeholder.id, 'error', error.code);
		} else {
			finishMessage(conversation.id, placeholder.id, 'error', 'generation_failed');
		}
	} finally {
		generationStore.conversationId = null;
		generationStore.controller = null;
	}
}

function findMessage(conversation: StoredConversation, messageId: string) {
	return conversation.messages.find((message) => message.id === messageId) ?? null;
}

export function historyFor(conversation: StoredConversation, modelId: string): ChatMessageParam[] {
	const maxChars = activeModelContextTokens(modelId) * 4;
	const history: ChatMessageParam[] = [];
	let total = 0;
	for (let index = conversation.messages.length - 1; index >= 0; index--) {
		const message = conversation.messages[index];
		if (
			message.role === 'assistant' &&
			(message.status === 'error' || message.status === 'aborted')
		) {
			continue;
		}
		total += message.content.length;
		if (total > maxChars) break;
		history.unshift({ role: message.role, content: message.content });
	}
	return history;
}
