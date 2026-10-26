<script lang="ts">
	import { Copy, Check, RotateCcw, AlertTriangle, Square } from '@lucide/svelte';
	import gsap from 'gsap';
	import { renderMarkdown } from '#lib/markdown/render';
	import { friendlyMessage } from '#lib/api/types';
	import { resolveModel } from '#lib/stores/models.svelte';
	import { retryLastGeneration } from '#lib/chat/generation.svelte';
	import type { StoredConversation, StoredMessage } from '#lib/storage/types';

	let {
		conversation,
		message,
		streaming = false
	}: { conversation: StoredConversation; message: StoredMessage; streaming?: boolean } = $props();

	const pageLoadedAt = Date.now();
	let container = $state<HTMLElement | null>(null);
	let markdownBody = $state<HTMLElement | null>(null);
	let copied = $state(false);
	let throttledContent = $state('');

	const isUser = $derived(message.role === 'user');
	const isAssistant = $derived(message.role === 'assistant');
	const isError = $derived(message.status === 'error');
	const isAborted = $derived(message.status === 'aborted');
	const isStreaming = $derived(streaming && message.status === undefined);
	const modelName = $derived(
		resolveModel(message.modelId ?? conversation.modelId)?.name ?? 'Mini-LLM'
	);

	$effect(() => {
		const content = message.content;
		if (!isStreaming) {
			throttledContent = content;
			return;
		}
		const timer = setTimeout(() => (throttledContent = content), 70);
		return () => clearTimeout(timer);
	});

	const rendered = $derived.by(() => {
		const content = isStreaming ? throttledContent : message.content;
		if (!isAssistant || isError) return '';
		return renderMarkdown(content);
	});

	$effect(() => {
		void rendered;
		decorateCodeBlocks();
	});

	$effect(() => {
		if (container && message.createdAt > pageLoadedAt) {
			gsap.fromTo(
				container,
				{ opacity: 0, y: 10 },
				{ opacity: 1, y: 0, duration: 0.28, ease: 'power1.out', clearProps: 'all' }
			);
		}
	});

	function decorateCodeBlocks(): void {
		const root = markdownBody;
		if (!root) return;
		for (const pre of Array.from(root.querySelectorAll('pre'))) {
			const parent = pre.parentElement;
			if (parent?.classList.contains('codeblock')) continue;
			const wrapper = document.createElement('div');
			wrapper.className = 'codeblock';
			const head = document.createElement('div');
			head.className = 'codeblock-head';
			const language = pre.querySelector('code')?.className.match(/language-([A-Za-z0-9_-]+)/)?.[1];
			if (language) {
				const label = document.createElement('span');
				label.className = 'codeblock-lang';
				label.textContent = language;
				head.append(label);
			}
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'codeblock-copy';
			button.setAttribute('data-code-copy', '');
			button.textContent = 'Copy';
			head.append(button);
			pre.replaceWith(wrapper);
			wrapper.append(head, pre);
		}
	}

	function onMarkdownClick(event: MouseEvent): void {
		const target = event.target as HTMLElement | null;
		const button = target?.closest('button[data-code-copy]');
		const pre = target?.closest('pre');
		if (!button || !pre) return;
		const text = pre.querySelector('code')?.textContent ?? pre.textContent ?? '';
		navigator.clipboard
			.writeText(text)
			.then(() => {
				button.textContent = 'Copied!';
				gsap.fromTo(button, { opacity: 0.4 }, { opacity: 1, duration: 0.25 });
				setTimeout(() => (button.textContent = 'Copy'), 1400);
			})
			.catch(() => {});
	}

	async function copyAll(): Promise<void> {
		try {
			await navigator.clipboard.writeText(message.content);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			copied = false;
		}
	}
</script>

<div
	bind:this={container}
	class="group flex w-full {isUser ? 'justify-end' : 'justify-start'} px-4 sm:px-6"
	data-role={message.role}
>
	<div class="w-full max-w-3xl min-w-0">
		{#if isUser}
			<div class="flex justify-end">
				<div
					class="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap text-white"
				>
					{message.content}
				</div>
			</div>
		{:else if isError}
			<div class="max-w-3xl rounded-xl border border-danger/30 bg-danger-soft px-4 py-3">
				<div class="flex items-start gap-2.5">
					<AlertTriangle size={16} class="mt-0.5 shrink-0 text-danger" />
					<div class="min-w-0 flex-1">
						{#if message.content}
							<p class="text-[13px] leading-relaxed whitespace-pre-wrap text-danger">
								{message.content}
							</p>
						{:else}
							<p class="text-[13px] font-medium text-danger">
								{friendlyMessage(message.errorCode ?? 'generation_failed', 'Generation failed.')}
							</p>
						{/if}
						<button
							type="button"
							class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-danger px-2.5 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
							onclick={() => retryLastGeneration(conversation)}
						>
							<RotateCcw size={13} />
							Retry
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="relative">
				<div class="flex items-baseline gap-2">
					<span
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[10px] font-bold text-accent-strong"
						aria-hidden="true">{modelName.slice(0, 2).toUpperCase()}</span
					>
					<span class="text-[12px] font-medium text-ink-faint">{modelName}</span>
					{#if isStreaming}
						<span
							class="inline-block h-3.5 w-0.5 animate-pulse rounded bg-accent"
							aria-hidden="true"
						></span>
					{/if}
					{#if isAborted}
						<span
							class="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-faint"
						>
							<Square size={9} />
							Stopped
						</span>
					{/if}
				</div>
				{#if rendered}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						bind:this={markdownBody}
						class="prose prose-sm mt-1.5 ml-8 max-w-none wrap-break-word prose-zinc dark:prose-invert prose-a:text-accent-strong prose-code:before:hidden prose-code:after:hidden prose-pre:mt-3 prose-pre:bg-surface-2"
						onclick={onMarkdownClick}
						onkeydown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								onMarkdownClick(event as unknown as MouseEvent);
							}
						}}
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html rendered}
					</div>
				{:else if isStreaming}
					<p class="mt-1 ml-8 text-[13px] text-ink-faint">
						Generating<span class="dots">…</span>
					</p>
				{/if}
				{#if !isStreaming && message.content}
					<button
						type="button"
						class="absolute top-0 right-0 rounded-md p-1.5 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-2 hover:text-ink"
						aria-label="Copy message"
						onclick={copyAll}
					>
						{#if copied}<Check size={14} class="text-ok" />{:else}<Copy size={14} />{/if}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
