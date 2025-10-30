import type { Ref } from "vue";

export type SessionUser = {
	id: number;
	username: string;
	email: string | null;
	is_admin: number;
	created_at: string;
};

type SessionError = {
	message: string;
	statusCode?: number;
};

type SessionState = {
	user: Ref<SessionUser | null>;
	loading: Ref<boolean>;
	initialized: Ref<boolean>;
	error: Ref<string | null>;
	refresh: (force?: boolean) => Promise<void>;
	login: (identifier: string, password: string) => Promise<void>;
	register: (payload: { username: string; email: string | null; password: string }) => Promise<void>;
	logout: () => Promise<void>;
	clearError: () => void;
};

const ERROR_TRANSLATIONS: Array<[string, string, string]> = [
	["Invalid credentials", "messages.invalidCredentials", "Identifiants invalides"],
	["Username or email is required", "messages.usernameRequired", "Le nom d'utilisateur ou l'email est requis"],
	["Password is required", "messages.passwordRequired", "Le mot de passe est requis"],
	["Unexpected error", "messages.unexpectedError", "Erreur inattendue"],
];

function createNormalizeError(t?: (key: string) => string) {
	const translateMessage = (rawMessage: string): string => {
		for (const [needle, i18nKey, fallback] of ERROR_TRANSLATIONS) {
			if (rawMessage.includes(needle)) {
				return t ? t(i18nKey) : fallback;
			}
		}
		return rawMessage;
	};

	return function normalizeError(error: unknown): SessionError {
		if (error instanceof Error) {
			return { 
				message: translateMessage(error.message) 
			};
		}
		if (error && typeof error === "object") {
			const apiError = error as { statusMessage?: string; message?: string; statusCode?: number };
			const rawMessage = apiError.statusMessage || apiError.message || "Unexpected error";
			
			return {
				message: translateMessage(rawMessage),
				statusCode: apiError.statusCode,
			};
		}
		return { 
			message: t ? t("messages.unexpectedError") : "Erreur inattendue" 
		};
	};
}

export function useAppSession(): SessionState {

	let t: ((key: string) => string) | undefined;
	try {
		const i18n = useI18n();
		t = i18n.t;
	} catch {
		t = undefined;
	}
	
	const user = useState<SessionUser | null>("session:user", () => null);
	const loading = useState<boolean>("session:loading", () => false);
	const initialized = useState<boolean>("session:initialized", () => false);
	const error = useState<string | null>("session:error", () => null);

	const normalizeError = createNormalizeError(t);

	const fetchWithSession = async <T>(url: string, options: Record<string, unknown> = {}): Promise<T> => {
		const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;
		const response = await $fetch(url, {
			credentials: "include",
			headers,
			...options,
		});
		return response as T;
	};

	const refresh = async (force = false) => {
		if (initialized.value && !force) {
			return;
		}

		loading.value = true;
		try {
			const data = await fetchWithSession<{ user: SessionUser | null }>("/api/auth/session");
			user.value = data?.user ?? null;
			error.value = null;
		} catch (err) {
			user.value = null;
			error.value = normalizeError(err).message;
		} finally {
			loading.value = false;
			initialized.value = true;
		}
	};

	const login = async (identifier: string, password: string) => {
		loading.value = true;
		error.value = null;
		try {
			const data = await fetchWithSession<{ user: SessionUser | null }>("/api/auth/login", {
				method: "POST",
				body: { identifier, password },
			});
			user.value = data?.user ?? null;
		} catch (err) {
			console.log("Erreur login brute:", err);
			const normalized = normalizeError(err);
			console.log("Erreur normalisée:", normalized);
			error.value = normalized.message;
			throw new Error(normalized.message);
		} finally {
			loading.value = false;
			initialized.value = true;
		}
	};

	const register = async (payload: { username: string; email: string | null; password: string }) => {
		loading.value = true;
		error.value = null;
		try {
			const data = await fetchWithSession<{ user: SessionUser | null }>("/api/auth/register", {
				method: "POST",
				body: payload,
			});
			user.value = data?.user ?? null;
		} catch (err) {
			const normalized = normalizeError(err);
			error.value = normalized.message;
			throw new Error(normalized.message);
		} finally {
			loading.value = false;
			initialized.value = true;
		}
	};

	const logout = async () => {
		loading.value = true;
		error.value = null;
		try {
			await fetchWithSession("/api/auth/logout", {
				method: "POST",
			});
			user.value = null;
		} catch (err) {
			const normalized = normalizeError(err);
			error.value = normalized.message;
			throw new Error(normalized.message);
		} finally {
			loading.value = false;
		}
	};

	const clearError = () => {
		error.value = null;
	};

	return {
		user,
		loading,
		initialized,
		error,
		refresh,
		login,
		register,
		logout,
		clearError,
	};
}
