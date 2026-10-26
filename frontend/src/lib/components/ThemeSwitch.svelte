<script lang="ts">
	import { Sun, Moon, Monitor } from '@lucide/svelte';
	import { settings, setThemeMode, type ThemeMode } from '#lib/stores/settings.svelte';

	const options: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
		{ mode: 'light', label: 'Light', icon: Sun },
		{ mode: 'dark', label: 'Dark', icon: Moon },
		{ mode: 'system', label: 'System', icon: Monitor }
	];
</script>

<div
	class="flex items-center gap-0.5 rounded-lg border border-line bg-bg p-0.5"
	role="radiogroup"
	aria-label="Theme"
>
	{#each options as option (option.mode)}
		<button
			type="button"
			role="radio"
			aria-checked={settings.mode === option.mode}
			class="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[12px] {settings.mode ===
			option.mode
				? 'bg-surface text-ink shadow-sm'
				: 'text-ink-faint hover:text-ink-soft'}"
			onclick={() => setThemeMode(option.mode)}
		>
			<option.icon size={13} />
			<span class="sr-only">{option.label}</span>
		</button>
	{/each}
</div>
