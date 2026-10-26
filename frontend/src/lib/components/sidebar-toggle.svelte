<script lang="ts">
	import { PanelLeft } from '@lucide/svelte';
	import { useSidebar } from '#lib/components/ui/sidebar/index.js';

	const sidebar = useSidebar();
</script>

<button
	type="button"
	class="fixed top-2 left-3 z-20 flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
	aria-label="Toggle Sidebar"
	onclick={() => sidebar.toggle()}
>
	<PanelLeft size={18} aria-hidden="true" />
</button>
