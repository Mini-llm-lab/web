<script lang="ts">
	import { ChevronDown, AlertTriangle } from '@lucide/svelte';
	import { gsap } from 'gsap';
	import { modelsStore, selectModel } from '#lib/stores/models.svelte';

	let { compact = false }: { compact?: boolean } = $props();

	let open = $state(false);
	let menu = $state<HTMLElement | null>(null);
	let button = $state<HTMLElement | null>(null);

	const selected = $derived(modelsStore.list.find((model) => model.id === modelsStore.selectedId));

	function toggle(): void {
		if (!open) {
			gsap.fromTo(
				menu,
				{ opacity: 0, y: -4, scaleY: 0.96 },
				{
					opacity: 1,
					y: 0,
					scaleY: 1,
					duration: 0.16,
					ease: 'power2.out',
					transformOrigin: 'top center'
				}
			);
		}
		open = !open;
	}

	function choose(id: string, available: boolean): void {
		if (!available) return;
		selectModel(id);
		close();
	}

	function close(): void {
		open = false;
	}

	function onWindowClick(event: MouseEvent): void {
		if (!open) return;
		const target = event.target as Node;
		if (menu?.contains(target) || button?.contains(target)) return;
		close();
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') close();
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class="relative">
	{#if modelsStore.status === 'loading'}
		<span
			class="inline-flex h-8 items-center gap-2 rounded-lg border border-line px-3 text-[13px] text-ink-faint"
		>
			Chargement des modèles…
		</span>
	{:else if modelsStore.status === 'error'}
		<span
			class="inline-flex h-8 items-center gap-2 rounded-lg border border-dashed border-danger/40 bg-danger-soft px-3 text-[13px] text-danger"
		>
			<AlertTriangle size={14} />
			Serveur injoignable
		</span>
	{:else if selected}
		<button
			type="button"
			bind:this={button}
			class="inline-flex {compact
				? 'h-8'
				: 'h-9'} max-w-[240px] items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-2"
			aria-haspopup="listbox"
			aria-expanded={open}
			onclick={toggle}
		>
			<span class="h-1.5 w-1.5 shrink-0 rounded-full {selected.available ? 'bg-ok' : 'bg-danger'}"
			></span>
			<span class="truncate">{selected.name}</span>
			<span class="shrink-0 text-[11px] font-normal text-ink-faint">{selected.parameters}</span>
			<ChevronDown size={14} class="shrink-0 text-ink-faint" />
		</button>
	{:else}
		<span
			class="inline-flex h-8 items-center rounded-lg border border-line px-3 text-[13px] text-ink-faint"
			>Aucun modèle</span
		>
	{/if}

	{#if open}
		<ul
			bind:this={menu}
			class="absolute top-full right-0 z-50 mt-1 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
			role="listbox"
			aria-label="Choisir un modèle"
		>
			{#each modelsStore.list as model (model.id)}
				<li>
					<button
						type="button"
						role="option"
						aria-selected={model.id === modelsStore.selectedId}
						class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] {model.id ===
						modelsStore.selectedId
							? 'bg-accent-soft text-ink'
							: 'text-ink-soft'} {model.available
							? 'hover:bg-surface-2'
							: 'cursor-not-allowed opacity-50'}"
						onclick={() => choose(model.id, model.available)}
					>
						<span
							class="h-1.5 w-1.5 shrink-0 rounded-full {model.available ? 'bg-ok' : 'bg-danger'}"
						></span>
						<span class="min-w-0 flex-1 truncate">
							<span class="font-medium text-ink">{model.name}</span>
							{#if !model.available}
								<span class="block text-[11px] text-ink-faint">Bientôt disponible</span>
							{/if}
						</span>
						<span class="shrink-0 text-[11px] text-ink-faint"
							>{model.parameters} · {model.contextTokens} ctx</span
						>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
