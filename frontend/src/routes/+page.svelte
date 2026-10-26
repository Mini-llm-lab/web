<script lang="ts">
	import ChatHeader from '#lib/components/ChatHeader.svelte';
	import MessagesView from '#lib/components/MessagesView.svelte';
	import Composer from '#lib/components/Composer.svelte';
	import Welcome from '#lib/components/Welcome.svelte';
	import { activeConversation } from '#lib/stores/conversations.svelte';
	import { stopGeneration, isGenerating } from '#lib/chat/generation.svelte';

	const conversation = $derived(activeConversation());
	const generating = $derived(!!conversation && isGenerating(conversation.id));

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape' && generating) {
			stopGeneration();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if conversation}
	<ChatHeader />
	<MessagesView />
	<Composer />
{:else}
	<ChatHeader />
	<Welcome />
	<Composer />
{/if}
