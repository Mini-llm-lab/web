<script lang="ts">
	import { SendHorizontal, Square, CornerDownLeft } from '@lucide/svelte';
	import gsap from 'gsap';
	import { activeConversation } from '#lib/stores/conversations.svelte';
	import { isGenerating, sendMessage, stopGeneration } from '#lib/chat/generation.svelte';

	const conversation = $derived(activeConversation());
	const busy = $derived(!!conversation && isGenerating(conversation.id));

	let draft = $state('');
	let textarea = $state<HTMLTextAreaElement | null>(null);
	let sendButton = $state<HTMLButtonElement | null>(null);

	const canSend = $derived(!!conversation && draft.trim().length > 0 && !busy);

	$effect(() => {
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
	});

	function submit(): void {
		if (!canSend || !conversation) return;
		const text = draft;
		draft = '';
		sendMessage(conversation, text);
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			submit();
		}
	}

	function onMainAction(): void {
		if (busy) {
			if (sendButton) {
				gsap.fromTo(sendButton, { scale: 0.9 }, { scale: 1, duration: 0.18, ease: 'power2.out' });
			}
			stopGeneration();
			return;
		}
		submit();
	}
</script>

<div class="shrink-0 border-t border-line bg-surface px-4 py-3 sm:px-6">
	<form class="mx-auto w-full max-w-3xl" onsubmit={(event) => event.preventDefault()}>
		<div
			class="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-sm focus-within:border-accent/50"
		>
			<textarea
				bind:this={textarea}
				bind:value={draft}
				onkeydown={onKeydown}
				placeholder={conversation
					? 'Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)'
					: 'Démarrez une conversation pour écrire un message'}
				rows={1}
				disabled={!conversation}
				aria-label="Message"
				class="max-h-[200px] w-full resize-none bg-transparent px-2 py-1.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-faint disabled:opacity-60"
			></textarea>
			<div class="flex items-center justify-between gap-2">
				<kbd class="flex items-center gap-1 text-[11px] text-ink-faint">
					<CornerDownLeft size={11} />
					Entrée pour envoyer
				</kbd>
				<button
					type="button"
					bind:this={sendButton}
					class="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors {busy
						? 'bg-ink text-surface hover:opacity-90'
						: canSend
							? 'bg-accent text-white hover:bg-accent-strong'
							: 'cursor-not-allowed bg-surface-2 text-ink-faint'}"
					aria-label={busy
						? 'Arrêter la génération'
						: canSend
							? 'Envoyer le message'
							: 'Écrivez un message pour l’envoyer'}
					onclick={onMainAction}
				>
					{#if busy}
						<Square size={14} />
						Arrêter
					{:else}
						<SendHorizontal size={15} />
						Envoyer
					{/if}
				</button>
			</div>
		</div>
		<p class="mx-auto mt-2 max-w-3xl text-center text-[11px] text-ink-faint">
			Les modèles Mini-LLM sont de très petits modèles expérimentaux : leurs réponses peuvent être
			incorrectes.
		</p>
	</form>
</div>
