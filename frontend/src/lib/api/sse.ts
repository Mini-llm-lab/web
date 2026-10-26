import type { SseEventHandler } from './types';

export class SSEParser {
	#buffer = '';
	#eventName = '';
	#dataLines: string[] = [];

	constructor(private onEvent: SseEventHandler) {}

	feed(chunk: string): void {
		this.#buffer += chunk;
		let separatorIndex = this.#findSeparator();
		while (separatorIndex) {
			const block = this.#buffer.slice(0, separatorIndex.start);
			this.#consumeBlock(block);
			this.#buffer = this.#buffer.slice(separatorIndex.end).replace(/^\r?\n/, '');
			separatorIndex = this.#findSeparator();
		}
	}

	finish(): void {
		if (this.#buffer.trim() !== '') {
			this.#consumeBlock(this.#buffer);
			this.#buffer = '';
		}
	}

	#findSeparator(): { start: number; end: number } | null {
		const lf = this.#buffer.indexOf('\n\n');
		const crlf = this.#buffer.indexOf('\r\n\r\n');
		if (crlf !== -1 && (lf === -1 || crlf + 2 < lf)) {
			return { start: crlf, end: crlf + 4 };
		}
		if (lf !== -1) {
			return { start: lf, end: lf + 2 };
		}
		return null;
	}

	#consumeBlock(block: string): void {
		for (const line of block.split(/\r?\n/)) {
			if (line === '' || line.startsWith(':')) continue;
			const colonIndex = line.indexOf(':');
			const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
			let value = colonIndex === -1 ? '' : line.slice(colonIndex + 1);
			if (value.startsWith(' ')) value = value.slice(1);
			if (field === 'event') {
				this.#eventName = value;
			} else if (field === 'data') {
				this.#dataLines.push(value);
			}
		}
		if (this.#dataLines.length > 0 || this.#eventName) {
			this.onEvent({ name: this.#eventName || 'message', data: this.#dataLines.join('\n') });
		}
		this.#eventName = '';
		this.#dataLines = [];
	}
}

export async function consumeSSEStream(
	stream: ReadableStream<Uint8Array>,
	onEvent: SseEventHandler
): Promise<void> {
	const reader = stream.getReader();
	const decoder = new TextDecoder('utf-8');
	const parser = new SSEParser(onEvent);
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			parser.feed(decoder.decode(value, { stream: true }));
		}
		parser.feed(decoder.decode());
		parser.finish();
	} finally {
		reader.releaseLock();
	}
}
