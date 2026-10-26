<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import AppSidebar from '#lib/components/app-sidebar.svelte';
	import SidebarToggle from '#lib/components/sidebar-toggle.svelte';
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

<Sidebar.Provider class="relative h-dvh overflow-hidden bg-bg">
	<AppSidebar />
	<SidebarToggle />
	<main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
		{@render children()}
	</main>
</Sidebar.Provider>
