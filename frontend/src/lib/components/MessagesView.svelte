<script lang="ts">
	import MessageItem from '#lib/components/MessageItem.svelte';
	import { activeConversation } from '#lib/stores/conversations.svelte';
	import { generationStore } from '#lib/chat/generation.svelte';

	let scroller = $state<HTMLElement | null>(null);
	let nearBottom = $state(true);

	const conversation = $derived(activeConversation());
	const messages = $derived(conversation?.messages ?? []);
	const lastMessage = $derived(messages.at(-1));
	const lastIsStreaming = $derived(
		!!lastMessage &&
			lastMessage.role === 'assistant' &&
			lastMessage.status === undefined &&
			generationStore.conversationId === conversation?.id
	);

	function onScroll(): void {
		if (!scroller) return;
		const gap = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
		nearBottom = gap < 140;
	}

	$effect(() => {
		if (!lastIsStreaming) return;
		void lastMessage?.content.length;
		if (!nearBottom || !scroller) return;
		scroller.scrollTo({ top: scroller.scrollHeight });
	});

	$effect(() => {
		const length = messages.length;
		if (length === 0 || !nearBottom || !scroller) return;
		scroller.scrollTo({ top: scroller.scrollHeight });
	});
</script>

<div
	bind:this={scroller}
	class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
	onscroll={onScroll}
>
	{#if conversation}
		<div class="mx-auto flex w-full max-w-3xl flex-col gap-5 py-6">
			{#each conversation.messages as message, index (message.id)}
				<MessageItem
					{conversation}
					{message}
					streaming={lastIsStreaming && index === conversation.messages.length - 1}
				/>
			{/each}
		</div>
	{/if}
</div>
