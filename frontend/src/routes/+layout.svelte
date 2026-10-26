<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import { initConversations } from '#lib/stores/conversations.svelte';
	import { initSettings } from '#lib/stores/settings.svelte';
	import { loadModels } from '#lib/stores/models.svelte';
	import type { LayoutProps } from './$types';

	initSettings();
	initConversations();
	loadModels();

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Mini Web — chat Mini-LLM</title>
</svelte:head>

<Sidebar>
	{@render children()}
</Sidebar>
