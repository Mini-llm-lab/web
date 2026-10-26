<script lang="ts">
	import gsap from 'gsap';
	import { X, Plus } from '@lucide/svelte';
	import ConversationList from '#lib/components/ConversationList.svelte';
	import StatusBar from '#lib/components/StatusBar.svelte';
	import { ui, setDrawer } from '#lib/stores/ui.svelte';
	import { createNewConversation, selectConversation } from '#lib/stores/conversations.svelte';
	import { pickModelId } from '#lib/chat/generation.svelte';

	let { children }: { children?: import('svelte').Snippet } = $props();

	let panel = $state<HTMLElement | null>(null);
	let overlay = $state<HTMLElement | null>(null);

	const isDesktop = (): boolean => globalThis.matchMedia('(min-width: 768px)').matches;
	let wasOpen = false;

	function applyDrawer(open: boolean): void {
		if (!panel || !overlay || isDesktop()) return;
		if (open) {
			gsap.set(overlay, { display: 'block' });
			gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2 });
			gsap.fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.25, ease: 'power2.out' });
		} else if (wasOpen) {
			gsap.to(overlay, {
				opacity: 0,
				duration: 0.2,
				delay: 0.05,
				onComplete: () => gsap.set(overlay, { display: 'none' })
			});
			gsap.to(panel, { xPercent: -100, duration: 0.25, ease: 'power2.in' });
		}
		wasOpen = open;
	}

	$effect(() => {
		applyDrawer(ui.drawerOpen);
	});

	$effect(() => {
		if (!panel || !overlay) return;
		if (isDesktop()) {
			gsap.set(panel, { xPercent: 0 });
			gsap.set(overlay, { display: 'none', opacity: 0 });
		} else {
			gsap.set(panel, { xPercent: ui.drawerOpen ? 0 : -100 });
			wasOpen = ui.drawerOpen;
		}
		const query = globalThis.matchMedia('(min-width: 768px)');
		const onChange = () => {
			if (!panel || !overlay) return;
			if (query.matches) {
				setDrawer(false);
				gsap.set(panel, { xPercent: 0 });
				gsap.set(overlay, { display: 'none', opacity: 0 });
			} else {
				gsap.set(panel, { xPercent: ui.drawerOpen ? 0 : -100 });
				wasOpen = ui.drawerOpen;
			}
		};
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	});

	function closeDrawer(): void {
		setDrawer(false);
	}

	function startNewConversation(): void {
		const modelId = pickModelId() ?? 'minillm-150m';
		const conversation = createNewConversation(modelId);
		selectConversation(conversation.id);
		closeDrawer();
	}
</script>

<div class="flex h-dvh overflow-hidden bg-bg">
	<aside
		bind:this={panel}
		class="fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-line bg-surface md:static md:z-auto"
	>
		<div class="flex items-center gap-2 px-4 pt-4 pb-3">
			<span
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-white shadow-sm"
				aria-hidden="true">M</span
			>
			<span class="text-[15px] font-semibold tracking-tight text-ink">Mini Web</span>
			<button
				type="button"
				class="ml-auto rounded-md p-1.5 text-ink-soft hover:bg-surface-2 md:hidden"
				aria-label="Close menu"
				onclick={closeDrawer}
			>
				<X size={18} />
			</button>
		</div>
		<div class="px-3 pb-3">
			<button
				type="button"
				class="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong active:scale-[0.98]"
				onclick={startNewConversation}
			>
				<Plus size={16} />
				New chat
			</button>
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
			<ConversationList onnavigate={closeDrawer} />
		</div>
		<div class="border-t border-line px-2 py-2">
			<StatusBar />
		</div>
	</aside>

	<button
		type="button"
		bind:this={overlay}
		aria-label="Close menu"
		class="fixed inset-0 z-30 bg-black/40 md:hidden"
		style="display: none; opacity: 0;"
		onclick={closeDrawer}
	></button>

	<div class="flex min-w-0 flex-1 flex-col">
		<main class="flex min-h-0 flex-1 flex-col">
			{@render children?.()}
		</main>
	</div>
</div>
