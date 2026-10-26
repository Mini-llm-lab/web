export interface ModelInfo {
	id: string;
	name: string;
	parameters: string;
	contextTokens: number;
	available: boolean;
}

export interface ChatMessageParam {
	role: 'user' | 'assistant';
	content: string;
}

export interface ChatParams {
	model: string;
	messages: ChatMessageParam[];
	max_tokens?: number;
	temperature?: number;
}

export type StreamOutcome = 'done' | 'aborted';

export class ApiError extends Error {
	constructor(
		public code: string,
		message: string,
		public status: number = 0
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export type SseEventHandler = (event: { name: string; data: string }) => void;

export const ERROR_MESSAGES: Record<string, string> = {
	not_configured:
		"Ce modèle n'a pas encore de backend d'inférence connecté. La génération n'est pas disponible pour le moment.",
	generation_failed: 'La génération a échoué. Réessayez dans un instant.',
	rate_limited: 'Trop de requêtes. Attendez quelques secondes avant de renvoyer un message.',
	invalid_request: 'Requête refusée par le serveur.',
	invalid_messages: 'La conversation dépasse les limites acceptées par ce modèle.',
	unknown_model: 'Ce modèle est inconnu du serveur.',
	empty_response: "Le modèle n'a renvoyé aucun contenu.",
	network: 'Impossible de joindre le serveur. Vérifiez que le backend est lancé.',
	http_error: 'Le serveur a répondu avec une erreur inattendue.',
	stream_error: 'La connexion a été interrompue pendant la génération.'
};

export function friendlyMessage(code: string, fallback: string): string {
	return ERROR_MESSAGES[code] ?? fallback;
}
