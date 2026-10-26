import { consumeSSEStream } from './sse';
import { ApiError, type ChatParams, type ModelInfo, type StreamOutcome } from './types';

const DEFAULT_BASE_URL = 'http://localhost:8080';

type ApiBaseCarrier = { __MINIWEB_API_BASE__?: string };

export function apiBaseUrl(): string {
	const fromEnv = (import.meta.env.PUBLIC_API_BASE_URL as string | undefined)?.trim();
	if (fromEnv) return fromEnv.replace(/\/$/, '');
	const injected = (globalThis as ApiBaseCarrier).__MINIWEB_API_BASE__;
	if (typeof injected === 'string' && injected.length > 0) return injected.replace(/\/$/, '');
	return DEFAULT_BASE_URL;
}

export async function fetchModels(signal?: AbortSignal): Promise<ModelInfo[]> {
	let response: Response;
	try {
		response = await fetch(`${apiBaseUrl()}/api/models`, { signal });
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') throw error;
		throw new ApiError('network', 'Unable to load the model list.');
	}
	if (!response.ok) {
		throw new ApiError('http_error', 'The server returned an error.', response.status);
	}
	const payload = (await response.json()) as { models?: unknown };
	if (!payload || !Array.isArray(payload.models)) {
		throw new ApiError('stream_error', 'Invalid models response.');
	}
	return payload.models.filter(isModelInfo);
}

function isModelInfo(value: unknown): value is ModelInfo {
	if (typeof value !== 'object' || value === null) return false;
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.id === 'string' &&
		typeof candidate.name === 'string' &&
		typeof candidate.parameters === 'string' &&
		typeof candidate.contextTokens === 'number' &&
		typeof candidate.available === 'boolean'
	);
}

export interface ChatStreamHandlers {
	onStart?: (requestId: string) => void;
	onDelta: (text: string) => void;
}

export async function streamChat(
	request: ChatParams,
	handlers: ChatStreamHandlers,
	signal?: AbortSignal
): Promise<StreamOutcome> {
	let response: Response;
	try {
		response = await fetch(`${apiBaseUrl()}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request),
			signal
		});
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') return 'aborted';
		throw new ApiError('network', 'Unable to reach the server.');
	}

	if (!response.ok) {
		const code = await extractErrorCode(response);
		throw new ApiError(code, 'The request was rejected by the server.', response.status);
	}
	if (!response.body) {
		throw new ApiError('stream_error', 'The response stream is unavailable.');
	}

	try {
		return await consumeParsedEvents(response.body, handlers);
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') return 'aborted';
		if (error instanceof ApiError) throw error;
		throw new ApiError('stream_error', 'The connection was interrupted during generation.');
	}
}

class SseProtocolError extends ApiError {
	constructor(code: string, message: string) {
		super(code, message);
		this.name = 'SseProtocolError';
	}
}

async function consumeParsedEvents(
	body: ReadableStream<Uint8Array>,
	handlers: ChatStreamHandlers
): Promise<StreamOutcome> {
	let outcome: StreamOutcome | null = null;
	await consumeSSEStream(body, (event) => {
		if (outcome) return;
		switch (event.name) {
			case 'start': {
				const requestId = parseJsonFields(event.data).requestId;
				if (typeof requestId === 'string') handlers.onStart?.(requestId);
				break;
			}
			case 'delta': {
				const text = parseJsonFields(event.data).text;
				if (typeof text === 'string') handlers.onDelta(text);
				break;
			}
			case 'done':
				outcome = 'done';
				break;
			case 'error': {
				const fields = parseJsonFields(event.data);
				throw new SseProtocolError(
					typeof fields.code === 'string' ? fields.code : 'generation_failed',
					typeof fields.message === 'string' ? fields.message : 'Generation failed.'
				);
			}
		}
	});
	return outcome ?? 'aborted';
}

function parseJsonFields(data: string): Record<string, unknown> {
	try {
		const parsed: unknown = JSON.parse(data);
		return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
	} catch {
		return {};
	}
}

async function extractErrorCode(response: Response): Promise<string> {
	try {
		const payload = (await response.json()) as { error?: { code?: unknown } };
		const code = payload?.error?.code;
		if (typeof code === 'string') return code;
	} catch {
		return 'http_error';
	}
	return 'http_error';
}
