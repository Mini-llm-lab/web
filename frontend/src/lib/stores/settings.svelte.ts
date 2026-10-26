export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'miniweb:theme';

const mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? null;

export const settings = $state({
	mode: 'system' as ThemeMode,
	persistent: true,
	storageWarning: ''
});

function systemPrefersDark(): boolean {
	return mediaQuery?.matches ?? false;
}

export function initSettings(storage?: Storage | null): void {
	const backend = storage === undefined ? safeStorage() : storage;
	if (!backend) {
		settings.persistent = false;
		settings.storageWarning =
			"Stockage indisponible : le thème et l'historique ne seront pas conservés.";
		return;
	}
	try {
		const stored = backend.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') settings.mode = stored;
	} catch {
		settings.persistent = false;
	}
	applyMode(settings.mode);
}

function safeStorage(): Storage | null {
	try {
		globalThis.localStorage?.getItem('__probe__');
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

export function setThemeMode(mode: ThemeMode): void {
	settings.mode = mode;
	applyMode(mode);
	try {
		globalThis.localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		settings.persistent = false;
	}
}

export function applyMode(mode: ThemeMode): void {
	const dark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
	document.documentElement.classList.toggle('dark', dark);
}

if (mediaQuery) {
	mediaQuery.addEventListener('change', () => {
		if (settings.mode === 'system') applyMode('system');
	});
}
