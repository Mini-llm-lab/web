<script lang="ts">
	import { Sparkles } from '@lucide/svelte';
	import { animateWelcomeStack } from '#lib/utils/motion';
	import { createNewConversation, selectConversation } from '#lib/stores/conversations.svelte';
	import { sendMessage } from '#lib/chat/generation.svelte';
	import { modelsStore } from '#lib/stores/models.svelte';

	const suggestions = [
		'Explain what a tokenizer is in three simple sentences.',
		'Write a grocery list for a pasta dinner for four people.',
		'Give me five name ideas for a small notes app.',
		'Write a short poem about autumn rain.'
	];

	let container = $state<HTMLElement | null>(null);

	$effect(() => {
		if (container) animateWelcomeStack(container);
	});

	function ask(text: string): void {
		const modelId = modelsStore.selectedId || modelsStore.list[0]?.id;
		if (!modelId) return;
		const conversation = createNewConversation(modelId);
		selectConversation(conversation.id);
		sendMessage(conversation, text);
	}
</script>

<div class="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10">
	<div bind:this={container} class="flex w-full max-w-xl flex-col items-center text-center">
		<span
			class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-sm"
		>
			<Sparkles size={26} />
		</span>
		<h1 class="text-2xl font-semibold tracking-tight text-ink">Mini Web</h1>
		<p class="mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">
			Chat with your Mini-LLM models, live. Pick a model and ask your first question.
		</p>

		<div class="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
			{#each suggestions as suggestion (suggestion)}
				<button
					type="button"
					class="rounded-xl border border-line bg-surface px-4 py-3 text-left text-[13px] leading-snug text-ink-soft transition-colors hover:border-accent/40 hover:text-ink"
					onclick={() => ask(suggestion)}
				>
					{suggestion}
				</button>
			{/each}
		</div>
		<p class="mt-6 text-[12px] text-ink-faint">
			{#if modelsStore.status === 'ready'}
				{modelsStore.list.filter((model) => model.available).length} model(s) available right now.
			{:else}
				Your conversations are saved in this browser.
			{/if}
		</p>
	</div>
</div>
