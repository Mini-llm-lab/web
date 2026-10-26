<script lang="ts">
	import { Plus, X } from '@lucide/svelte';
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
	<Sidebar.Header class="gap-2 px-3 pt-2 pb-3">
		<div class="flex h-8 items-center gap-2 pl-10">
			<span
				class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[12px] font-bold text-white shadow-sm"
				aria-hidden="true">M</span
			>
			<span class="text-[14px] font-semibold tracking-tight text-ink">Mini Web</span>
			<button
				type="button"
				class="ml-auto rounded-md p-1.5 text-ink-soft hover:bg-surface-2 md:hidden"
				aria-label="Close menu"
				onclick={() => sidebar.setOpenMobile(false)}
			>
				<X size={18} />
			</button>
		</div>
		<button
			type="button"
			class="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-surface-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-border active:scale-[0.98]"
			onclick={startNewChat}
		>
			<Plus size={15} />
			New chat
		</button>
	</Sidebar.Header>
	<Sidebar.Content
		class="[scrollbar-width:thin] overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
	>
		<Sidebar.Group>
			<Sidebar.GroupLabel
				class="pt-1 text-[11px] font-medium tracking-wider text-ink-faint uppercase"
				>Conversations</Sidebar.GroupLabel
			>
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
