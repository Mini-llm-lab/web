<script lang="ts">
	import { Menu } from '@lucide/svelte';
	import { toggleDrawer } from '#lib/stores/ui.svelte';
	import { activeConversation } from '#lib/stores/conversations.svelte';

	const conversation = $derived(activeConversation());
</script>

<header class="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2 sm:px-5">
	<button
		type="button"
		class="rounded-md border border-line bg-surface p-2 text-ink-soft md:hidden"
		aria-label="Ouvrir le menu"
		onclick={toggleDrawer}
	>
		<Menu size={18} />
	</button>
	<div class="min-w-0 flex-1">
		<h1 class="truncate text-[14px] font-medium text-ink" title={conversation?.title ?? 'Mini Web'}>
			{conversation?.title ?? 'Mini Web'}
		</h1>
	</div>
</header>
