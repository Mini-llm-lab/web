<script lang="ts">
	import ChatHeader from '#lib/components/ChatHeader.svelte';
	import MessagesView from '#lib/components/MessagesView.svelte';
	import PromptBar from '#lib/components/PromptBar.svelte';
	import Prism from '#lib/components/Prism.svelte';
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
	<div class="pb-6">
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
	</div>
{:else}
	<ChatHeader />
	<div class="relative min-h-0 flex-1">
		<div class="absolute inset-0 overflow-hidden" aria-hidden="true">
			<Prism timeScale={0.5} />
		</div>
		<div class="relative z-10 flex h-full flex-col justify-center px-4 pb-6">
			<div class="mb-6 flex items-center justify-center gap-4">
				<span
					class="flex h-13 w-13 items-center justify-center rounded-2xl bg-accent shadow-sm"
					aria-hidden="true"
				>
					<span class="h-6 w-6 rounded-full bg-gradient-to-br from-white/80 to-white/30"></span>
				</span>
				<h1 class="text-3xl font-semibold tracking-tight text-ink">Mini</h1>
			</div>
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
		</div>
	</div>
{/if}
