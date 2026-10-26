<script lang="ts">
	import ChatHeader from '#lib/components/ChatHeader.svelte';
	import MessagesView from '#lib/components/MessagesView.svelte';
	import PromptBar from '#lib/components/PromptBar.svelte';
	import Welcome from '#lib/components/Welcome.svelte';
	import {
		activeConversation,
		createNewConversation,
		selectConversation
	} from '#lib/stores/conversations.svelte';
	import { modelsStore, selectModel } from '#lib/stores/models.svelte';
	import {
		stopGeneration,
		isGenerating,
		sendMessage,
		pickModelId
	} from '#lib/chat/generation.svelte';

	const conversation = $derived(activeConversation());
	const generating = $derived(!!conversation && isGenerating(conversation.id));
	const models = $derived(
		modelsStore.list.map((model) => ({
			key: model.id,
			name: model.name,
			tag: model.parameters
		}))
	);

	const handleStop = (): void => {
		stopGeneration();
	};

	const handleSend = (text: string, detail: { model?: { key: string } }): void => {
		if (detail.model?.key) selectModel(detail.model.key);
		let target = activeConversation();
		if (!target) {
			target = createNewConversation(detail.model?.key ?? pickModelId() ?? 'minillm-150m');
			selectConversation(target.id);
		}
		sendMessage(target, text);
	};

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
	<PromptBar
		placeholder="Ask anything…"
		{models}
		defaultModel={modelsStore.selectedId}
		background="var(--surface)"
		color="var(--ink)"
		menuBackground="var(--surface-2)"
		width={900}
		maxRows={5}
		busy={generating}
		onStop={handleStop}
		onSend={handleSend}
	/>
{:else}
	<ChatHeader />
	<Welcome />
	<PromptBar
		placeholder="Ask anything…"
		{models}
		defaultModel={modelsStore.selectedId}
		background="var(--surface)"
		color="var(--ink)"
		menuBackground="var(--surface-2)"
		width={900}
		maxRows={5}
		busy={generating}
		onStop={handleStop}
		onSend={handleSend}
	/>
{/if}
