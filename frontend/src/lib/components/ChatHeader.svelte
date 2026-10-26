<script lang="ts">
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { activeConversation } from '#lib/stores/conversations.svelte';

	const conversation = $derived(activeConversation());
</script>

<header class="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2 sm:px-5">
	<Sidebar.Trigger class="text-ink-soft hover:text-ink" />
	<div class="min-w-0 flex-1">
		<h1 class="truncate text-[14px] font-medium text-ink" title={conversation?.title ?? 'Mini Web'}>
			{conversation?.title ?? 'Mini Web'}
		</h1>
	</div>
</header>
