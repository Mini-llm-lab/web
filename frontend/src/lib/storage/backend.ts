export class StorageUnavailableError extends Error {
	constructor() {
		super('localStorage is unavailable');
		this.name = 'StorageUnavailableError';
	}
}

export class StorageWriteError extends Error {
	constructor(
		public cause: unknown,
		public quota: boolean
	) {
		super('localStorage write failed');
		this.name = 'StorageWriteError';
	}
}

export interface KeyValueBackend {
	persistent: boolean;
	get(key: string): string | null;
	set(key: string, value: string): void;
	remove(key: string): void;
}

export class MemoryBackend implements KeyValueBackend {
	readonly persistent = false;
	#data = new Map<string, string>();

	get(key: string): string | null {
		return this.#data.get(key) ?? null;
	}

	set(key: string, value: string): void {
		this.#data.set(key, value);
	}

	remove(key: string): void {
		this.#data.delete(key);
	}
}

export class LocalStorageBackend implements KeyValueBackend {
	readonly persistent = true;

	#window(): Storage {
		const storage = globalThis.localStorage;
		if (!storage) throw new StorageUnavailableError();
		return storage;
	}

	get(key: string): string | null {
		try {
			return this.#window().getItem(key);
		} catch {
			throw new StorageUnavailableError();
		}
	}

	set(key: string, value: string): void {
		const storage = this.#window();
		try {
			storage.setItem(key, value);
		} catch (error) {
			throw new StorageWriteError(error, isQuotaError(error));
		}
	}

	remove(key: string): void {
		try {
			this.#window().removeItem(key);
		} catch {
			throw new StorageUnavailableError();
		}
	}
}

function isQuotaError(error: unknown): boolean {
	return (
		error instanceof DOMException &&
		(error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
	);
}

export function openStorage(): KeyValueBackend {
	try {
		const backend = new LocalStorageBackend();
		const probe = '__miniweb_probe__';
		backend.set(probe, '1');
		backend.remove(probe);
		return backend;
	} catch {
		return new MemoryBackend();
	}
}
