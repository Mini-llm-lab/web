<script lang="ts">
	import { Check, Sun, Moon, Monitor } from '@lucide/svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { settings, setThemeMode, type ThemeMode } from '#lib/stores/settings.svelte';

	const themeOptions: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
		{ mode: 'light', label: 'Light', icon: Sun },
		{ mode: 'dark', label: 'Dark', icon: Moon },
		{ mode: 'system', label: 'System', icon: Monitor }
	];
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
			>
				<span
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-white"
					aria-hidden="true">M</span
				>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-[13px] font-medium text-ink">Mini</span>
					<span class="block truncate text-[11px] text-ink-faint">Local workspace</span>
				</span>
			</button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content side="top" align="start" sideOffset={6} class="w-52">
		{#each themeOptions as option (option.mode)}
			<DropdownMenu.Item class="flex items-center gap-2" onSelect={() => setThemeMode(option.mode)}>
				<option.icon size={14} />
				<span>{option.label}</span>
				{#if settings.mode === option.mode}
					<Check size={14} class="ml-auto text-accent" />
				{/if}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
