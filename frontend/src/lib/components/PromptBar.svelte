<script module lang="ts">
	type IconSvgElement = readonly (readonly [string, Record<string, string | number>])[];
	type CSSProperties = Record<string, string | number | undefined | null>;
	import type { Snippet } from 'svelte';
	const File02Icon: readonly (readonly [string, Record<string, string | number>])[] = [
		[
			'path',
			{
				d: 'M8 17H16',
				stroke: 'currentColor',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'stroke-width': '1.5',
				key: '0'
			}
		],
		[
			'path',
			{
				d: 'M8 13H12',
				stroke: 'currentColor',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'stroke-width': '1.5',
				key: '1'
			}
		],
		[
			'path',
			{
				d: 'M13 2.5V3C13 5.82843 13 7.24264 13.8787 8.12132C14.7574 9 16.1716 9 19 9H19.5M20 10.6569V14C20 17.7712 20 19.6569 18.8284 20.8284C17.6569 22 15.7712 22 12 22C8.22876 22 6.34315 22 5.17157 20.8284C4 19.6569 4 17.7712 4 14V9.45584C4 6.21082 4 4.58831 4.88607 3.48933C5.06508 3.26731 5.26731 3.06508 5.48933 2.88607C6.58831 2 8.21082 2 11.4558 2C12.1614 2 12.5141 2 12.8372 2.11401C12.9044 2.13772 12.9702 2.165 13.0345 2.19575C13.3436 2.34355 13.593 2.593 14.0919 3.09188L18.8284 7.82843C19.4065 8.40649 19.6955 8.69552 19.8478 9.06306C20 9.4306 20 9.83935 20 10.6569Z',
				stroke: 'currentColor',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'stroke-width': '1.5',
				key: '2'
			}
		]
	];
	const Cancel01Icon: readonly (readonly [string, Record<string, string | number>])[] = [
		[
			'path',
			{
				d: 'M18 6L6.00081 17.9992M17.9992 18L6 6.00085',
				stroke: 'currentColor',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'stroke-width': '1.5',
				key: '0'
			}
		]
	];
	const Tick02Icon: readonly (readonly [string, Record<string, string | number>])[] = [
		[
			'path',
			{
				d: 'M5 14L8.5 17.5L19 6.5',
				stroke: 'currentColor',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'stroke-width': '1.5',
				key: '0'
			}
		]
	];
	const ArrowDown01Icon: readonly (readonly [string, Record<string, string | number>])[] = [
		[
			'path',
			{
				d: 'M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9',
				stroke: 'currentColor',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'stroke-width': '1.5',
				key: '0'
			}
		]
	];
	export interface PromptBarSource {
		key: string;
		name: string;
		description?: string;
		icon?: Snippet | string | number | null | IconSvgElement;
		attach?: boolean;
	}
	export interface PromptBarCommand {
		key: string;
		name: string;
		description?: string;
	}
	export interface PromptBarModel {
		key: string;
		name: string;
		tag?: string;
	}
	export interface PromptBarSendDetail {
		attachments: string[];
		model?: PromptBarModel;
	}
	export interface PromptBarProps {
		placeholder?: string;
		sources?: PromptBarSource[];
		commands?: PromptBarCommand[];
		models?: PromptBarModel[];
		defaultModel?: string;
		busy?: boolean;
		onSend?: (text: string, detail: PromptBarSendDetail) => void;
		onStop?: () => void;
		onAttach?: () => string | string[] | void | Promise<string | string[] | void>;
		background?: string;
		color?: string;
		menuBackground?: string;
		width?: number;
		radius?: number;
		maxRows?: number;
		morphDuration?: number;
		squash?: number;
		tilt?: number;
		pressScale?: number;
		className?: string;
	}
	type Row = {
		key: string;
		name: string;
		description?: string;
		tag?: string;
		icon?: Snippet | string | number | null | IconSvgElement;
		attach?: boolean;
	};
	type Token = { kind: 'at' | 'slash'; query: string; start: number };
	type Latest = Pick<PromptBarProps, 'onSend' | 'onStop' | 'onAttach'>;
	interface SendGlyphProps {
		busy: boolean;
		morphDuration: number;
		squash: number;
		tilt: number;
	}
	const ARROW_UP = [12, 4.5, 18.5, 11, 14.25, 11, 14.25, 19.5, 9.75, 19.5, 9.75, 11, 5.5, 11];
	const SQUARE = [12, 6, 18, 6, 18, 12, 18, 18, 6, 18, 6, 12, 6, 6];
	const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
	const LINE = 22;
	const mix = (a: number, b: number, t: number) => a + (b - a) * t;
	const pathAt = (a: number[], b: number[], t: number) => {
		let d = '';
		for (let i = 0; i < a.length; i += 2) {
			d += `${i ? 'L' : 'M'}${mix(a[i], b[i], t).toFixed(2)} ${mix(a[i + 1], b[i + 1], t).toFixed(2)}`;
		}
		return `${d}Z`;
	};
	const parseToken = (draft: string): Token | null => {
		const m = /(^|\s)([@/])([\w-]*)$/.exec(draft);
		if (!m) return null;
		return {
			kind: m[2] === '@' ? 'at' : 'slash',
			query: m[3].toLowerCase(),
			start: m.index + m[1].length
		};
	};

	function css(value: CSSProperties | undefined): string {
		const unitless =
			/^(opacity|zIndex|fontWeight|lineHeight|flex|flexGrow|flexShrink|order|scale|aspectRatio|strokeWidth|strokeDashoffset|strokeDasharray|fillOpacity|strokeOpacity|stopOpacity|pathLength)$/;
		return Object.entries(value ?? {})
			.filter(([, v]) => v !== undefined && v !== null)
			.map(([key, value]) => {
				const name = key.startsWith('--')
					? key
					: key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
				return (
					name +
					':' +
					(typeof value === 'number' && value !== 0 && !key.startsWith('--') && !unitless.test(key)
						? value + 'px'
						: value)
				);
			})
			.join(';');
	}
</script>

<script lang="ts">
	import { untrack, onMount } from 'svelte';
	import { animate, motionValue } from 'motion';
	let {
		placeholder = 'Ask anything',
		sources = [],
		commands = [],
		models = [],
		defaultModel = '',
		busy = false,
		onSend,
		onStop,
		onAttach,
		background = '#3A312A',
		color = '#F5EFE9',
		menuBackground = '#493D33',
		width = 400,
		radius = 16,
		maxRows = 5,
		morphDuration = 240,
		squash = 0.12,
		tilt = 8,
		pressScale = 0.96,
		className = ''
	}: PromptBarProps = $props();

	const hasMenus = $derived(sources.length > 0 || commands.length > 0);

	let reduce = $state(false);
	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduce = media.matches;
		const change = () => {
			reduce = media.matches;
		};
		media.addEventListener('change', change);
		return () => media.removeEventListener('change', change);
	});
	const rootRef = { current: untrack(() => null) as HTMLDivElement | null };
	const inputRef = { current: untrack(() => null) as HTMLTextAreaElement | null };
	const glowRef = { current: untrack(() => null) as HTMLSpanElement | null };
	const rowRefs = { current: untrack(() => []) as (HTMLButtonElement | null)[] };
	const lastOpen = { current: untrack(() => null) as string | null };
	const latest = { current: untrack(() => ({})) as Latest };
	$effect.pre(() => {
		latest.current = { onSend, onStop, onAttach };
	});
	let draft = $state(untrack(() => ''));
	function setDraft(nextState: typeof draft | ((previous: typeof draft) => typeof draft)) {
		draft = typeof nextState === 'function' ? nextState(draft) : nextState;
	}
	let attachments = $state<string[]>(untrack(() => []));
	function setAttachments(
		nextState: typeof attachments | ((previous: typeof attachments) => typeof attachments)
	) {
		attachments = typeof nextState === 'function' ? nextState(attachments) : nextState;
	}
	let modelKey = $state(untrack(() => defaultModel));
	function setModelKey(
		nextState: typeof modelKey | ((previous: typeof modelKey) => typeof modelKey)
	) {
		modelKey = typeof nextState === 'function' ? nextState(modelKey) : nextState;
	}
	let plusOpen = $state(untrack(() => false));
	function setPlusOpen(
		nextState: typeof plusOpen | ((previous: typeof plusOpen) => typeof plusOpen)
	) {
		plusOpen = typeof nextState === 'function' ? nextState(plusOpen) : nextState;
	}
	let modelOpen = $state(untrack(() => false));
	function setModelOpen(
		nextState: typeof modelOpen | ((previous: typeof modelOpen) => typeof modelOpen)
	) {
		modelOpen = typeof nextState === 'function' ? nextState(modelOpen) : nextState;
	}
	let dismissed = $state(untrack(() => false));
	function setDismissed(
		nextState: typeof dismissed | ((previous: typeof dismissed) => typeof dismissed)
	) {
		dismissed = typeof nextState === 'function' ? nextState(dismissed) : nextState;
	}
	let active = $state(untrack(() => 0));
	function setActive(nextState: typeof active | ((previous: typeof active) => typeof active)) {
		active = typeof nextState === 'function' ? nextState(active) : nextState;
	}
	let pressed = $state(untrack(() => false));
	function setPressed(nextState: typeof pressed | ((previous: typeof pressed) => typeof pressed)) {
		pressed = typeof nextState === 'function' ? nextState(pressed) : nextState;
	}
	const model = $derived(models.find((m) => m.key === modelKey) ?? models[0]);
	const token = $derived(hasMenus && !dismissed ? parseToken(draft) : null);
	const open = $derived(plusOpen ? 'at' : (token?.kind ?? (modelOpen ? 'model' : null)));
	const query = $derived(plusOpen ? '' : (token?.query ?? ''));
	const list: Row[] = $derived.by(() => {
		if (open === 'at') return sources.filter((s) => s.name.toLowerCase().includes(query));
		if (open === 'slash')
			return commands.filter((c) => c.name.replace(/^\//, '').toLowerCase().startsWith(query));
		if (open === 'model') return models;
		return [];
	});
	const cursor = $derived(Math.min(active, Math.max(0, list.length - 1)));
	const canSend = $derived(draft.trim().length > 0 || attachments.length > 0);
	const armed = $derived(busy || canSend);
	const focusInput = () => inputRef.current?.focus({ preventScroll: true });
	const closeMenus = () => {
		setPlusOpen(false);
		setModelOpen(false);
	};
	$effect(() => {
		const currentOpen = open;
		const currentCursor = cursor;
		const currentList = list;
		return untrack(() => {
			const glow = glowRef.current;
			if (!glow || !currentOpen) return;
			const row = rowRefs.current[currentCursor];
			if (!row || currentList.length === 0) {
				glow.style.opacity = '0';
				return;
			}
			const fresh = lastOpen.current !== currentOpen;
			lastOpen.current = currentOpen;
			if (fresh) glow.style.transition = 'none';
			glow.style.top = `${row.offsetTop}px`;
			glow.style.height = `${row.offsetHeight}px`;
			glow.style.opacity = '1';
			if (fresh) {
				void glow.offsetHeight;
				glow.style.transition = '';
			}
		});
	});
	$effect(() => {
		const currentOpen = open;
		return untrack(() => {
			if (!currentOpen) lastOpen.current = null;
		});
	});
	$effect(() => {
		const flags = [plusOpen, modelOpen];
		return untrack(() => {
			if (!flags[0] && !flags[1]) return undefined;
			const onDown = (e: globalThis.PointerEvent) => {
				if (!rootRef.current?.contains(e.target as Node)) closeMenus();
			};
			document.addEventListener('pointerdown', onDown);
			return () => document.removeEventListener('pointerdown', onDown);
		});
	});
	$effect(() => {
		const currentDraft = draft;
		const currentMaxRows = maxRows;
		return untrack(() => {
			const el = inputRef.current;
			if (!el) return;
			el.style.height = '0px';
			const max = LINE * currentMaxRows;
			el.style.height = `${Math.min(el.scrollHeight, max)}px`;
			el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
			if (el.value !== currentDraft) el.value = currentDraft;
		});
	});
	const pick = (row: Row) => {
		if (open === 'model') {
			setModelKey(row.key);
			setModelOpen(false);
			focusInput();
			return;
		}
		const head = token ? draft.slice(0, token.start) : draft;
		if (row.attach) {
			setDraft(head);
			Promise.resolve(latest.current.onAttach?.()).then((files) => {
				if (!files) return;
				setAttachments((a) => [...a, ...(Array.isArray(files) ? files : [files])]);
			});
		} else if (open === 'at') {
			setDraft(`${head}@${row.name} `);
		} else {
			setDraft(`${head}${row.name} `);
		}
		setPlusOpen(false);
		setDismissed(false);
		focusInput();
	};
	const send = () => {
		if (!canSend || busy) return;
		latest.current.onSend?.(draft.trim(), { attachments, model });
		setDraft('');
		setAttachments([]);
		setDismissed(false);
		closeMenus();
		focusInput();
	};
	const onKeyDown = (e: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) => {
		if (open && list.length) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				active = (cursor + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length;
				return;
			}
			if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
				e.preventDefault();
				pick(list[cursor]);
				return;
			}
		}
		if (e.key === 'Escape') {
			if (open) {
				e.preventDefault();
				setDismissed(true);
				closeMenus();
			}
			return;
		}
		if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			send();
		}
	};
	const down = (e: PointerEvent & { currentTarget: HTMLButtonElement }) => {
		if (e.button !== 0 || !armed) return;
		setPressed(true);
	};
	const up = () => setPressed(false);

	function sendGlyph(node: SVGSVGElement, data: SendGlyphProps & { reduce: boolean }) {
		const t = motionValue(data.busy ? 1 : 0);
		let direction = data.busy ? 1 : -1;
		let controls: ReturnType<typeof animate> | undefined;
		const off = t.on('change', (v) => {
			node.querySelector('path')?.setAttribute('d', pathAt(ARROW_UP, SQUARE, v));
			const goo = data.reduce ? 0 : Math.sin(v * Math.PI);
			const sx = 1 - data.squash * goo;
			node.style.transform = goo
				? `rotate(${direction * data.tilt * goo}deg) scale(${sx}, ${1 / sx})`
				: '';
		});
		return {
			update(next: typeof data) {
				data = next;
				direction = data.busy ? 1 : -1;
				controls?.stop();
				controls = animate(
					t,
					data.busy ? 1 : 0,
					data.reduce ? { duration: 0 } : { duration: data.morphDuration / 1000, ease: EASE_IN_OUT }
				);
			},
			destroy() {
				controls?.stop();
				off();
				t.destroy();
			}
		};
	}
</script>

{#snippet iconSvg(
	shapes: readonly (readonly [string, Record<string, string | number>])[],
	size: number | string,
	strokeWidth: number,
	fill: string = 'none'
)}<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		{fill}
		stroke="currentColor"
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		>{#each shapes as [tag, attributes], i (i)}<svelte:element
				this={tag}
				{...attributes}
			/>{/each}</svg
	>{/snippet}
<div
	bind:this={rootRef.current}
	class={`group relative mx-auto w-[min(var(--pb-w),100%)] text-[14px] leading-5.5 text-(--pb-ink) ${className ? ` ${className}` : ''}`}
	style={css({
		'--pb-bg': background,
		'--pb-ink': color,
		'--pb-menu': menuBackground,
		'--pb-w': `${width}px`,
		'--pb-radius': `${radius}px`,
		'--pb-press': pressScale
	} as CSSProperties)}
>
	{#if open}<div
			class="absolute inset-x-0 bottom-[calc(100%+8px)] z-2 origin-bottom animate-[prompt-bar-pop_180ms_cubic-bezier(0.23,1,0.32,1)_both] rounded-xl p-1 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.08)] [background:var(--pb-menu)] data-[kind=model]:right-auto data-[kind=model]:w-50 data-[kind=model]:origin-bottom-left motion-reduce:animate-none"
			role="listbox"
			aria-label={open === 'at' ? 'Sources' : open === 'slash' ? 'Commands' : 'Models'}
			data-kind={open}
		>
			{#each list as row, i (row.key)}<button
					bind:this={rowRefs.current[i]}
					type="button"
					role="option"
					aria-selected={i === cursor}
					class="relative z-1 flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-2 text-left text-inherit outline-none [-webkit-tap-highlight-color:transparent] [font:inherit]"
					onmousedown={(e) => e.preventDefault()}
					onpointerenter={() => (active = i)}
					onclick={() => pick(row)}
				>
					<span class="flex-none text-[13px] font-medium">{row.name}</span>
					{#if row.description}<span
							class="min-w-0 flex-auto truncate text-[12px] text-[color-mix(in_srgb,var(--pb-ink)_55%,transparent)]"
						>
							{row.description}
						</span>{/if}
					{#if open === 'model'}
						<span
							class="ml-auto flex-none text-[11px] text-[color-mix(in_srgb,var(--pb-ink)_55%,transparent)]"
						>
							{row.tag}
						</span>
						<span
							class="inline-flex w-4 flex-none justify-center opacity-0 data-on:opacity-100"
							data-on={row.key === model?.key ? '' : undefined}
						>
							{@render iconSvg(Tick02Icon, 13, 2.5)}
						</span>
					{/if}
				</button>{/each}
			{#if list.length === 0}<div
					class="flex h-9 items-center px-2 text-[12px] text-[color-mix(in_srgb,var(--pb-ink)_55%,transparent)]"
				>
					No matches for “{query}”
				</div>{/if}
		</div>{/if}
	<div
		class="relative isolate flex cursor-text flex-col gap-2 rounded-(--pb-radius) p-3 [background:var(--pb-bg)]"
		role="presentation"
		onpointerdown={(e) => {
			if (e.target === e.currentTarget || e.target === inputRef.current) closeMenus();
		}}
		onclick={focusInput}
	>
		{#if attachments.length > 0}<div class="flex flex-wrap gap-1.5">
				{#each attachments as file, i (file)}<span
						class="inline-flex h-6.5 animate-[prompt-bar-pop_200ms_cubic-bezier(0.23,1,0.32,1)_both] items-center gap-1.5 rounded-lg pr-1 pl-2 text-[12px] [background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] motion-reduce:animate-none"
					>
						{@render iconSvg(File02Icon, 12, 2)}
						<span class="max-w-36 truncate">{file}</span>
						<button
							type="button"
							class="inline-grid h-4.5 w-4.5 cursor-pointer place-items-center rounded-[5px] border-0 bg-transparent p-0 text-inherit opacity-60 outline-none [transition:opacity_120ms_ease,background-color_120ms_ease] hover:opacity-100 hover:[background:color-mix(in_srgb,var(--pb-ink)_10%,transparent)]"
							aria-label={`Remove ${file}`}
							onclick={() => setAttachments((a) => a.filter((_, j) => j !== i))}
						>
							{@render iconSvg(Cancel01Icon, 10, 2.5)}
						</button>
					</span>{/each}
			</div>{/if}
		<textarea
			bind:this={inputRef.current}
			class="block w-full resize-none border-0 bg-transparent p-0 {hasMenus
				? ''
				: 'pl-2'} text-[14px] leading-5.5 wrap-anywhere text-inherit outline-none [font:inherit] placeholder:text-[color-mix(in_srgb,var(--pb-ink)_45%,transparent)] pointer-coarse:text-[16px]"
			rows={1}
			value={draft}
			{placeholder}
			aria-label="Prompt"
			oninput={(e) => {
				setDraft(e.currentTarget.value);
				setDismissed(false);
				closeMenus();
				setActive(0);
			}}
			onfocus={closeMenus}
			onkeydown={onKeyDown}></textarea>
		<div class="flex items-center gap-1">
			{#if hasMenus}<button
					type="button"
					class="inline-grid h-7 w-7 flex-none cursor-pointer touch-manipulation place-items-center rounded-lg border-0 bg-transparent p-0 text-[color-mix(in_srgb,var(--pb-ink)_60%,transparent)] outline-none select-none [-webkit-tap-highlight-color:transparent] [font:inherit] [transition:background-color_150ms_ease,color_150ms_ease,transform_160ms_cubic-bezier(0.23,1,0.32,1)] active:transform-[scale(0.94)] data-on:text-(--pb-ink) data-on:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] motion-reduce:active:transform-none [@media(hover:hover)_and_(pointer:fine)]:hover:text-(--pb-ink) [@media(hover:hover)_and_(pointer:fine)]:hover:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)]"
					aria-label="Add files and sources"
					aria-expanded={plusOpen}
					data-on={plusOpen ? '' : undefined}
					onmousedown={(e) => e.preventDefault()}
					onclick={() => {
						setModelOpen(false);
						setActive(0);
						setPlusOpen((v) => !v);
						focusInput();
					}}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						aria-hidden="true"><path d="M12 4V20M20 12H4" /></svg
					>
				</button>{/if}
			{#if models.length > 0}<button
					type="button"
					class="inline-flex h-7 flex-none cursor-pointer touch-manipulation items-center gap-1 rounded-lg border-0 bg-transparent px-2 text-[12px] font-medium text-[color-mix(in_srgb,var(--pb-ink)_70%,transparent)] outline-none select-none [-webkit-tap-highlight-color:transparent] [font:inherit] [transition:background-color_150ms_ease,color_150ms_ease] data-on:text-(--pb-ink) data-on:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)] [@media(hover:hover)_and_(pointer:fine)]:hover:text-(--pb-ink) [@media(hover:hover)_and_(pointer:fine)]:hover:[background:color-mix(in_srgb,var(--pb-ink)_8%,transparent)]"
					aria-label="Choose model"
					aria-expanded={modelOpen}
					data-on={modelOpen ? '' : undefined}
					onmousedown={(e) => e.preventDefault()}
					onclick={() => {
						setPlusOpen(false);
						setActive(Math.max(0, models.indexOf(model)));
						setModelOpen((v) => !v);
						focusInput();
					}}
				>
					<span>{model.name}</span>
					{@render iconSvg(ArrowDown01Icon, 12, 2.4)}
				</button>{/if}
			<span class="flex-auto"></span>
			<button
				type="button"
				class="relative inline-grid h-7 w-7 flex-none cursor-pointer touch-manipulation place-items-center rounded-lg border-0 p-0 text-[color-mix(in_srgb,var(--pb-ink)_55%,var(--pb-bg))] outline-none select-none [-webkit-tap-highlight-color:transparent] [background:color-mix(in_srgb,var(--pb-ink)_12%,var(--pb-bg))] [font:inherit] [transition:background-color_200ms_ease,color_200ms_ease,transform_160ms_cubic-bezier(0.23,1,0.32,1)] disabled:cursor-default data-armed:text-(--pb-bg) data-armed:ring-1 data-armed:ring-[color-mix(in_srgb,var(--pb-ink)_25%,transparent)] data-armed:[background:var(--pb-ink)] data-pressed:transform-[scale(var(--pb-press))] motion-reduce:data-pressed:transform-none"
				disabled={!armed}
				aria-label={busy ? 'Stop' : 'Send'}
				data-armed={armed ? '' : undefined}
				data-pressed={pressed ? '' : undefined}
				onmousedown={(e) => e.preventDefault()}
				onpointerdown={down}
				onpointerup={up}
				onpointercancel={up}
				onpointerleave={up}
				onclick={() => {
					if (busy) latest.current.onStop?.();
					else send();
				}}
			>
				<svg
					use:sendGlyph={{ busy, morphDuration, squash, tilt, reduce }}
					class="block h-4 w-4 origin-center"
					viewBox="0 0 24 24"
					aria-hidden="true"
					fill="currentColor"
					stroke="currentColor"
					stroke-width="2"
					stroke-linejoin="round"><path d={pathAt(ARROW_UP, SQUARE, busy ? 1 : 0)} /></svg
				>
			</button>
		</div>
	</div>
</div>

<style>
	@keyframes -global-prompt-bar-pop {
		from {
			opacity: 0;
			transform: translateY(4px) scale(0.98);
		}
	}
</style>
