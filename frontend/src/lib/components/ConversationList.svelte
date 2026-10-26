<script lang="ts">
	import { Pencil, Check, X, Trash2 } from '@lucide/svelte';
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
	<p class="px-2 py-4 text-[13px] text-ink-faint">Aucune conversation pour le moment.</p>
{:else}
	<ul class="flex flex-col gap-0.5 py-1" role="list">
		{#each conversations as conversation (conversation.id)}
			{@const active = conversation.id === conversationsStore.activeId}
			<li class="group relative">
				{#if renamingId === conversation.id}
					<div class="flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1.5">
						<input
							class="w-full min-w-0 rounded-md border border-line bg-surface px-2 py-1 text-[13px] text-ink outline-none focus:border-accent"
							bind:value={draftTitle}
							maxlength={80}
							aria-label="Nouveau titre"
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
							aria-label="Valider le titre"
							onclick={() => commitRename(conversation.id)}
						>
							<Check size={14} />
						</button>
						<button
							type="button"
							class="rounded p-1 text-ink-soft hover:text-ink"
							aria-label="Annuler"
							onclick={cancelRename}
						>
							<X size={14} />
						</button>
					</div>
				{:else}
					<button
						type="button"
						class="flex w-full items-center gap-1 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors {active
							? 'bg-accent-soft text-ink'
							: 'text-ink-soft hover:bg-surface-2'}"
						onclick={() => {
							selectConversation(conversation.id);
							onnavigate?.();
						}}
					>
						<span class="min-w-0 flex-1 truncate" title={conversation.title}
							>{conversation.title}</span
						>
					</button>
					<span
						class="absolute top-1.5 right-1 flex gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
					>
						{#if confirmingDeleteId === conversation.id}
							<button
								type="button"
								class="rounded-md bg-danger px-1.5 py-1 text-[10px] font-medium text-white"
								onclick={() => requestDelete(conversation.id)}
							>
								Confirmer
							</button>
						{:else}
							<button
								type="button"
								class="rounded-md p-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
								aria-label="Renommer la conversation"
								onclick={() => startRename(conversation.id, conversation.title)}
							>
								<Pencil size={13} />
							</button>
							<button
								type="button"
								class="rounded-md p-1 text-ink-faint hover:bg-danger-soft hover:text-danger"
								aria-label="Supprimer la conversation"
								onclick={() => requestDelete(conversation.id)}
							>
								<Trash2 size={13} />
							</button>
						{/if}
					</span>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
