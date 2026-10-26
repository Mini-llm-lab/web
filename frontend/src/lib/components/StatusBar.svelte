<script lang="ts">
	import { AlertTriangle, RotateCcw } from '@lucide/svelte';
	import { conversationsStore } from '#lib/stores/conversations.svelte';
	import { loadModels, modelsStore } from '#lib/stores/models.svelte';
	import ThemeSwitch from '#lib/components/ThemeSwitch.svelte';

	const warning = $derived.by(() => {
		if (!conversationsStore.persistent) {
			return "Stockage local indisponible : l'historique ne survivra pas au rechargement.";
		}
		if (conversationsStore.corrupted) {
			return 'Historique local corrompu : il a été réinitialisé.';
		}
		return '';
	});
</script>

<div class="flex flex-col gap-2">
	{#if modelsStore.status === 'error'}
		<button
			type="button"
			class="flex items-center gap-2 rounded-lg border border-dashed border-danger/40 bg-danger-soft px-2.5 py-2 text-left text-[12px] text-danger hover:brightness-95"
			onclick={() => loadModels()}
		>
			<AlertTriangle size={14} class="shrink-0" />
			<span class="flex-1">Serveur injoignable.</span>
			<RotateCcw size={14} class="shrink-0" />
		</button>
	{/if}
	{#if warning}
		<p
			class="rounded-lg bg-surface-2 px-2.5 py-2 text-[12px] leading-snug text-amber-600 dark:text-amber-400"
		>
			{warning}
		</p>
	{/if}
	<ThemeSwitch />
</div>
