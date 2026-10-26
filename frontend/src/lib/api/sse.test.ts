import { describe, expect, it } from 'vitest';
import { SSEParser, consumeSSEStream } from './sse';

function collect(): { parser: SSEParser; events: Array<{ name: string; data: string }> } {
	const events: Array<{ name: string; data: string }> = [];
	const parser = new SSEParser((event) => events.push(event));
	return { parser, events };
}

function readable(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
	let index = 0;
	return new ReadableStream<Uint8Array>({
		pull(controller) {
			if (index < chunks.length) {
				controller.enqueue(chunks[index]);
				index++;
				return;
			}
			controller.close();
		}
	});
}

const encoder = new TextEncoder();

describe('SSEParser', () => {
	it('parses basic events', () => {
		const { parser, events } = collect();
		parser.feed('event: start\ndata: {"requestId":"abc"}\n\n');
		expect(events).toEqual([{ name: 'start', data: '{"requestId":"abc"}' }]);
	});

	it('emits message as default event name', () => {
		const { parser, events } = collect();
		parser.feed('data: plain\n\n');
		expect(events).toEqual([{ name: 'message', data: 'plain' }]);
	});

	it('buffers events split across arbitrary chunk boundaries', () => {
		const { parser, events } = collect();
		const full = 'event: delta\ndata: {"text":"Bonjour le monde"}\n\n';
		for (let i = 0; i < full.length; i += 3) {
			parser.feed(full.slice(i, i + 3));
		}
		expect(events).toHaveLength(1);
		expect(events[0]).toEqual({ name: 'delta', data: '{"text":"Bonjour le monde"}' });
	});

	it('handles multiple events in a single chunk', () => {
		const { parser, events } = collect();
		parser.feed(
			'event: delta\ndata: {"text":"Bonjour"}\n\nevent: delta\ndata: {"text":" !"}\n\nevent: done\ndata: {"finishReason":"stop"}\n\n'
		);
		expect(events.map((event) => event.name)).toEqual(['delta', 'delta', 'done']);
	});

	it('buffers a trailing partial event until next feed', () => {
		const { parser, events } = collect();
		parser.feed('event: delta\ndata: {"text":"Bon');
		expect(events).toHaveLength(0);
		parser.feed('jour"}\n\n');
		expect(events).toHaveLength(1);
		expect(events[0].data).toBe('{"text":"Bonjour"}');
	});

	it('accepts CRLF line endings and separators', () => {
		const { parser, events } = collect();
		parser.feed('event: delta\r\ndata: {"text":"ok"}\r\n\r\n');
		expect(events).toEqual([{ name: 'delta', data: '{"text":"ok"}' }]);
	});

	it('handles a separator split across chunks', () => {
		const { parser, events } = collect();
		parser.feed('event: delta\ndata: {"text":"a"}\n');
		expect(events).toHaveLength(0);
		parser.feed('\n');
		expect(events).toHaveLength(1);
	});

	it('joins multiple data lines', () => {
		const { parser, events } = collect();
		parser.feed('event: delta\ndata: {"text":\ndata: "x"}\n\n');
		expect(events).toEqual([{ name: 'delta', data: '{"text":\n"x"}' }]);
	});

	it('strips a single leading space after the colon only', () => {
		const { parser, events } = collect();
		parser.feed('data:  deux espaces\n\n');
		expect(events[0].data).toBe(' deux espaces');
	});

	it('ignores comment lines', () => {
		const { parser, events } = collect();
		parser.feed(': keep-alive\n\n');
		expect(events).toHaveLength(0);
	});

	it('handles unicode text split across string chunks', () => {
		const { parser, events } = collect();
		parser.feed('event: delta\ndata: {"text":"caf');
		parser.feed('é ☕ héllo"}\n\n');
		expect(events).toHaveLength(1);
		expect(events[0].data).toBe('{"text":"café ☕ héllo"}');
	});
});

describe('consumeSSEStream', () => {
	it('reads a stream of arbitrary byte chunks without losing events', async () => {
		const payload =
			'event: start\ndata: {"requestId":"r1"}\n\nevent: delta\ndata: {"text":"héllo"}\n\nevent: done\ndata: {"finishReason":"stop"}\n\n';
		const bytes = encoder.encode(payload);
		const chunks: Uint8Array[] = [];
		let cursor = 0;
		for (const size of [5, 1, 30, 7, 2, 41, 3, 64, 64, 64]) {
			if (cursor >= bytes.length) break;
			chunks.push(bytes.slice(cursor, cursor + size));
			cursor += size;
		}
		const events: Array<{ name: string; data: string }> = [];
		await consumeSSEStream(readable(chunks), (event) => events.push(event));
		expect(events.map((event) => event.name)).toEqual(['start', 'delta', 'done']);
		expect(events[1].data).toBe('{"text":"héllo"}');
	});

	it('handles a chunk boundary inside a multibyte utf-8 sequence', async () => {
		const bytes = encoder.encode('event: delta\ndata: {"text":"𝕏𝕐 emoji 🧑‍🚀 ok"}\n\n');
		const splitInsideEmoji = bytes.indexOf(encoder.encode('🧑')[2]);
		const head = bytes.slice(0, splitInsideEmoji);
		const tail = bytes.slice(splitInsideEmoji);
		const events: Array<{ name: string; data: string }> = [];
		await consumeSSEStream(readable([head, tail]), (event) => events.push(event));
		expect(events[0].data).toBe('{"text":"𝕏𝕐 emoji 🧑‍🚀 ok"}');
	});
});
