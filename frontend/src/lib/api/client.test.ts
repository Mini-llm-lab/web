import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { streamChat, fetchModels, apiBaseUrl } from './client';
import { ApiError } from './types';

const encoder = new TextEncoder();

function sseResponse(events: string[]): Response {
	const payload = events.join('');
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoder.encode(payload));
			controller.close();
		}
	});
	return new Response(stream, {
		status: 200,
		headers: { 'Content-Type': 'text/event-stream' }
	});
}

const fetchMock = vi.fn();

beforeEach(() => {
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	fetchMock.mockReset();
});

describe('apiBaseUrl', () => {
	it('defaults to the local backend', () => {
		expect(apiBaseUrl()).toBe('http://localhost:8080');
	});
});

describe('fetchModels', () => {
	it('maps the payload to model infos', async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					models: [
						{
							id: 'minillm-40m',
							name: 'MiniLLM-40M',
							parameters: '40M',
							contextTokens: 1024,
							available: true
						},
						{
							id: 'minillm-70m',
							name: 'MiniLLM-70M',
							parameters: '70M',
							contextTokens: 512,
							available: false
						}
					]
				}),
				{ status: 200 }
			)
		);
		const models = await fetchModels();
		expect(models).toHaveLength(2);
		expect(models[0].name).toBe('MiniLLM-40M');
		expect(models[1].available).toBe(false);
	});

	it('throws a network ApiError on failure', async () => {
		fetchMock.mockRejectedValue(new TypeError('failed to fetch'));
		await expect(fetchModels()).rejects.toMatchObject({ code: 'network' });
	});

	it('filters malformed entries', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ models: [{ id: 'x' }, null] }), { status: 200 })
		);
		const models = await fetchModels();
		expect(models).toHaveLength(0);
	});
});

describe('streamChat', () => {
	it('dispatches start, delta and done', async () => {
		fetchMock.mockResolvedValue(
			sseResponse([
				'event: start\ndata: {"requestId":"r1"}\n\n',
				'event: delta\ndata: {"text":"Bonjour"}\n\n',
				'event: delta\ndata: {"text":" !"}\n\n',
				'event: done\ndata: {"finishReason":"stop"}\n\n'
			])
		);
		const deltas: string[] = [];
		let requestId = '';
		const outcome = await streamChat(
			{ model: 'minillm-40m', messages: [{ role: 'user', content: 'salut' }] },
			{ onStart: (id) => (requestId = id), onDelta: (text) => deltas.push(text) }
		);
		expect(outcome).toBe('done');
		expect(requestId).toBe('r1');
		expect(deltas.join('')).toBe('Bonjour !');
	});

	it('maps an SSE error event to an ApiError with its code', async () => {
		fetchMock.mockResolvedValue(
			sseResponse([
				'event: start\ndata: {}\n\n',
				'event: error\ndata: {"code":"not_configured","message":"aucun backend"}\n\n'
			])
		);
		await expect(
			streamChat({ model: 'm', messages: [{ role: 'user', content: 'x' }] }, { onDelta: () => {} })
		).rejects.toMatchObject({ code: 'not_configured', message: 'aucun backend' });
	});

	it('treats a missing done event as aborted', async () => {
		fetchMock.mockResolvedValue(sseResponse(['event: start\ndata: {}\n\n']));
		const outcome = await streamChat({ model: 'm', messages: [] }, { onDelta: () => {} });
		expect(outcome).toBe('aborted');
	});

	it('returns aborted when the fetch is aborted', async () => {
		fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));
		const outcome = await streamChat({ model: 'm', messages: [] }, { onDelta: () => {} });
		expect(outcome).toBe('aborted');
	});

	it('surfaces HTTP error codes from the JSON error payload', async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({ error: { code: 'unknown_model', message: 'Unknown model.' } }),
				{
					status: 400
				}
			)
		);
		const error = await streamChat({ model: 'm', messages: [] }, { onDelta: () => {} }).catch(
			(caught) => caught
		);
		expect(error).toBeInstanceOf(ApiError);
		expect((error as ApiError).code).toBe('unknown_model');
	});

	it('falls back to a generic http_error for non JSON responses', async () => {
		fetchMock.mockResolvedValue(new Response('oops', { status: 502 }));
		const error = await streamChat({ model: 'm', messages: [] }, { onDelta: () => {} }).catch(
			(caught) => caught
		);
		expect((error as ApiError).code).toBe('http_error');
	});

	it('throws network ApiError when fetch rejects', async () => {
		fetchMock.mockRejectedValue(new TypeError('fetch failed'));
		await expect(
			streamChat({ model: 'm', messages: [] }, { onDelta: () => {} })
		).rejects.toMatchObject({ code: 'network' });
	});
});
