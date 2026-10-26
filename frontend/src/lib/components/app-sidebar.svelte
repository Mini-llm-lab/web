<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import ConversationList from '#lib/components/ConversationList.svelte';
	import StatusBar from '#lib/components/StatusBar.svelte';
	import SidebarAccount from '#lib/components/sidebar-account.svelte';
	import { closeConversation } from '#lib/stores/conversations.svelte';

	const sidebar = Sidebar.useSidebar();

	function startNewChat(): void {
		closeConversation();
		sidebar.setOpenMobile(false);
	}

	function closeMobile(): void {
		sidebar.setOpenMobile(false);
	}
</script>

<Sidebar.Root collapsible="offcanvas">
	<Sidebar.Header class="gap-3 p-3">
		<div class="flex items-center gap-2">
			<Sidebar.Trigger class="text-ink-soft hover:text-ink" />
			<span
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-white shadow-sm"
				aria-hidden="true">M</span
			>
			<span class="text-[15px] font-semibold tracking-tight text-ink">Mini Web</span>
		</div>
		<button
			type="button"
			class="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong active:scale-[0.98]"
			onclick={startNewChat}
		>
			<Plus size={16} />
			New chat
		</button>
	</Sidebar.Header>
	<Sidebar.Content class="overflow-y-auto px-2">
		<Sidebar.Group>
			<Sidebar.GroupLabel>Conversations</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<ConversationList onnavigate={closeMobile} />
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="gap-2 px-2 py-2">
		<StatusBar />
		<SidebarAccount />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
