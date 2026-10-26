export const ui = $state({ drawerOpen: false });

export function setDrawer(open: boolean): void {
	ui.drawerOpen = open;
}

export function toggleDrawer(): void {
	ui.drawerOpen = !ui.drawerOpen;
}
