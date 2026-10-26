import { fetchModels } from '#lib/api/client';
import { ApiError, type ModelInfo } from '#lib/api/types';

export const modelsStore = $state({
	list: [] as ModelInfo[],
	status: 'idle' as 'idle' | 'loading' | 'ready' | 'error',
	errorCode: '' as string,
	errorMessage: '' as string,
	selectedId: '' as string
});

export function resolveModel(id: string): ModelInfo | null {
	return modelsStore.list.find((model) => model.id === id) ?? null;
}

export function defaultModelId(): string {
	const available = modelsStore.list.filter((model) => model.available);
	if (available.length === 0) return modelsStore.list[0]?.id ?? '';
	return available[0].id;
}

export async function loadModels(): Promise<void> {
	modelsStore.status = 'loading';
	try {
		modelsStore.list = await fetchModels();
		modelsStore.status = 'ready';
		if (!modelsStore.selectedId || !resolveModel(modelsStore.selectedId)?.available) {
			modelsStore.selectedId = defaultModelId();
		}
	} catch (error) {
		modelsStore.status = 'error';
		modelsStore.errorCode = error instanceof ApiError ? error.code : 'network';
		modelsStore.errorMessage =
			error instanceof ApiError ? error.message : 'Unable to load the model list.';
	}
}

export function selectModel(id: string): boolean {
	const model = resolveModel(id);
	if (!model || !model.available) return false;
	modelsStore.selectedId = id;
	return true;
}
