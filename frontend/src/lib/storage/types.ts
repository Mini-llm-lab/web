export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'complete' | 'aborted' | 'error';

export interface StoredMessage {
	id: string;
	role: MessageRole;
	content: string;
	createdAt: number;
	status?: MessageStatus;
	modelId?: string;
	errorCode?: string;
}

export interface StoredConversation {
	id: string;
	title: string;
	createdAt: number;
	updatedAt: number;
	modelId: string;
	messages: StoredMessage[];
}
