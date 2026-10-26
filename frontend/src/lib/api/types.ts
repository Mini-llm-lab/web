export interface ModelInfo {
	id: string;
	name: string;
	parameters: string;
	contextTokens: number;
	available: boolean;
}

export interface ChatMessageParam {
	role: 'user' | 'assistant';
	content: string;
}

export interface ChatParams {
	model: string;
	messages: ChatMessageParam[];
	max_tokens?: number;
	temperature?: number;
}

export type StreamOutcome = 'done' | 'aborted';

export class ApiError extends Error {
	constructor(
		public code: string,
		message: string,
		public status: number = 0
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export type SseEventHandler = (event: { name: string; data: string }) => void;

export const ERROR_MESSAGES: Record<string, string> = {
	not_configured:
		'This model has no inference backend connected yet. Generation is not available at the moment.',
	generation_failed: 'Generation failed. Try again in a moment.',
	rate_limited: 'Too many requests. Wait a few seconds before sending another message.',
	invalid_request: 'The request was rejected by the server.',
	invalid_messages: 'The conversation exceeds the limits accepted by this model.',
	unknown_model: 'This model is unknown to the server.',
	empty_response: 'The model returned no content.',
	network: 'Unable to reach the server. Check that the backend is running.',
	http_error: 'The server returned an unexpected error.',
	stream_error: 'The connection was interrupted during generation.'
};

export function friendlyMessage(code: string, fallback: string): string {
	return ERROR_MESSAGES[code] ?? fallback;
}
