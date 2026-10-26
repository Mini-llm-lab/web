<script lang="ts">
	import { Pencil, Check, X, Trash2 } from '@lucide/svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import {
		conversationsStore,
		sortedConversations,
		renameConversation,
		deleteConversation,
		selectConversation
	} from '#lib/stores/conversations.svelte';

	let { onnavigate }: { onnavigate?: () => void } = $props();

	let renamingId = $state<string | null>(null);
	let draftTitle = $state('');
	let confirmingDeleteId = $state<string | null>(null);
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;

	const conversations = $derived(sortedConversations());

	function startRename(id: string, currentTitle: string): void {
		renamingId = id;
		draftTitle = currentTitle;
	}

	function commitRename(id: string): void {
		renameConversation(id, draftTitle);
		renamingId = null;
	}

	function cancelRename(): void {
		renamingId = null;
	}

	function requestDelete(id: string): void {
		if (confirmingDeleteId === id) {
			deleteConversation(id);
			confirmingDeleteId = null;
			return;
		}
		confirmingDeleteId = id;
		if (confirmTimer) clearTimeout(confirmTimer);
		confirmTimer = setTimeout(() => (confirmingDeleteId = null), 3000);
	}
</script>

{#if conversations.length === 0}
	<p class="px-2 py-4 text-[13px] text-ink-faint">No conversations yet.</p>
{:else}
	<Sidebar.Menu>
		{#each conversations as conversation (conversation.id)}
			<Sidebar.MenuItem class="group/menu-item relative">
				{#if renamingId === conversation.id}
					<div class="flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1.5">
						<input
							class="w-full min-w-0 rounded-md border border-line bg-surface px-2 py-1 text-[13px] text-ink outline-none focus:border-accent"
							bind:value={draftTitle}
							maxlength={80}
							aria-label="New title"
							onkeydown={(event) => {
								event.stopPropagation();
								if (event.key === 'Enter') commitRename(conversation.id);
								else if (event.key === 'Escape') cancelRename();
							}}
							onblur={() => commitRename(conversation.id)}
						/>
						<button
							type="button"
							class="rounded p-1 text-ink-soft hover:text-ink"
							aria-label="Confirm title"
							onclick={() => commitRename(conversation.id)}
						>
							<Check size={14} />
						</button>
						<button
							type="button"
							class="rounded p-1 text-ink-soft hover:text-ink"
							aria-label="Cancel"
							onclick={cancelRename}
						>
							<X size={14} />
						</button>
					</div>
				{:else}
					<Sidebar.MenuButton
						isActive={conversation.id === conversationsStore.activeId}
						title={conversation.title}
						onclick={() => {
							selectConversation(conversation.id);
							onnavigate?.();
						}}
					>
						<span class="truncate">{conversation.title}</span>
					</Sidebar.MenuButton>
					<span
						data-sidebar="menu-action"
						class="absolute top-1.5 right-1 flex gap-0.5 opacity-0 transition-opacity group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100"
					>
						{#if confirmingDeleteId === conversation.id}
							<button
								type="button"
								class="rounded-md bg-danger px-1.5 py-1 text-[10px] font-medium text-white"
								onclick={() => requestDelete(conversation.id)}
							>
								Confirm
							</button>
						{:else}
							<button
								type="button"
								class="rounded-md p-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
								aria-label="Rename conversation"
								onclick={() => startRename(conversation.id, conversation.title)}
							>
								<Pencil size={13} />
							</button>
							<button
								type="button"
								class="rounded-md p-1 text-ink-faint hover:bg-danger-soft hover:text-danger"
								aria-label="Delete conversation"
								onclick={() => requestDelete(conversation.id)}
							>
								<Trash2 size={13} />
							</button>
						{/if}
					</span>
				{/if}
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
{/if}
