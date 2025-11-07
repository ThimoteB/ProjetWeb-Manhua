<!--
index.vue
Page d'accueil du site :
- Affiche le titre, le sous-titre, les statistiques (œuvres, bibliothèque, utilisateurs)
- Propose l'accès au catalogue, à la bibliothèque, et à l'authentification (login/register)
- Met en avant les dernières œuvres ajoutées
-->
<template>
	<div>
		<section class="bg-gradient-to-br from-emerald-500/10 via-white dark:via-gray-950 to-transparent">
			<div class="max-w-6xl mx-auto px-4 py-16 grid gap-12 lg:grid-cols-[1.6fr,1fr]">
				<div class="space-y-8">
					<h1 class="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
						{{ t("home.heroTitle") }}
					</h1>

					<p class="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
						{{ t("home.heroSubtitle") }}
					</p>

					<div class="grid gap-4 md:grid-cols-3">
						<div class="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white/80 dark:bg-emerald-950/40 p-5 shadow-sm">
							<p class="text-xs uppercase tracking-wide text-emerald-600 font-semibold">{{ t("home.statsWorks") }}</p>
							<p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{{ stats.works }}</p>
						</div>
						<div class="rounded-xl border border-emerald-200/40 dark:border-emerald-900/30 bg-white/70 dark:bg-gray-950/40 p-5 shadow-sm">
							<p class="text-xs uppercase tracking-wide text-emerald-600 font-semibold">{{ t("home.statsLibrary") }}</p>
							<p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{{ stats.library }}</p>
						</div>
						<div class="rounded-xl border border-emerald-200/40 dark:border-emerald-900/30 bg-white/70 dark:bg-gray-950/40 p-5 shadow-sm">
							<p class="text-xs uppercase tracking-wide text-emerald-600 font-semibold">{{ t("home.statsUsers") }}</p>
							<p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
								{{ stats.users ?? "–" }}
							</p>
						</div>
					</div>

					<div class="flex flex-wrap gap-3">
						<NuxtLink to="/works" class="btn-primary">{{ t("home.ctaCatalog") }}</NuxtLink>
						<ClientOnly>
							<NuxtLink
								v-if="currentUser"
								to="/library"
								class="btn-secondary"
							>
								{{ t("home.ctaLibrary") }}
							</NuxtLink>
							<NuxtLink v-else to="#auth" class="btn-secondary">
								{{ t("home.loginTitle") }}
							</NuxtLink>
						</ClientOnly>
					</div>

					<section aria-labelledby="latest-works" class="space-y-4">
						<div class="flex items-center justify-between">
							<h2 id="latest-works" class="text-xl font-semibold text-gray-900 dark:text-gray-100">
								{{ t("home.latestWorks") }}
							</h2>
							<NuxtLink to="/works" class="text-sm text-emerald-600 hover:text-emerald-500">
								{{ t("home.ctaCatalog") }} →
							</NuxtLink>
						</div>
						<div class="grid gap-4 md:grid-cols-3">
							<article
								v-for="work in featuredWorks"
								:key="work.id"
								class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/50 p-4 shadow-sm"
							>
								<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
									{{ work.title }}
								</h3>
								<p v-if="work.originalTitle" class="text-sm text-gray-500 dark:text-gray-400">
									{{ work.originalTitle }}
								</p>
								<p class="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
									{{ work.synopsis || "" }}
								</p>
								<p class="mt-4 text-xs font-medium text-emerald-600">
									{{ t(`statuses.${work.status}`) }}
								</p>
							</article>
						</div>
					</section>
				</div>

				<div id="auth" class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 p-6 shadow-xl backdrop-blur">
					<ClientOnly>
						<div v-if="currentUser" class="space-y-4">
							<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
								{{ t("common.welcome") }}, {{ currentUser.username }}
							</h2>
							<p class="text-sm text-gray-600 dark:text-gray-300">
								{{ t("home.alreadyLogged", { username: currentUser.username }) }}
							</p>
							<div class="flex gap-3">
								<NuxtLink to="/library" class="btn-primary">{{ t("home.ctaLibrary") }}</NuxtLink>
								<NuxtLink to="/works" class="btn-secondary">{{ t("home.ctaCatalog") }}</NuxtLink>
							</div>
						</div>
						<div v-else>
							<div class="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-1 text-sm">
								<button
									class="flex-1 rounded-full px-3 py-2 font-medium transition"
									:class="activeTab === 'login' ? 'bg-white dark:bg-gray-800 shadow text-emerald-600' : 'text-gray-500'"
									@click="switchTab('login')"
								>
									{{ t("home.tabLogin") }}
								</button>
								<button
									class="flex-1 rounded-full px-3 py-2 font-medium transition"
									:class="activeTab === 'register' ? 'bg-white dark:bg-gray-800 shadow text-emerald-600' : 'text-gray-500'"
									@click="switchTab('register')"
								>
									{{ t("home.tabRegister") }}
								</button>
							</div>

							<form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
								<div v-if="feedback.message" :class="feedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'" class="rounded-lg border px-3 py-2 text-sm">
									{{ feedback.message }}
								</div>

								<div class="space-y-2">
									<label v-if="activeTab === 'login'" class="text-sm font-medium text-gray-700 dark:text-gray-200">
										{{ t("home.identifier") }}
										<input
											v-model="loginForm.identifier"
											type="text"
											required
											class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
										/>
									</label>

									<template v-else>
										<label class="text-sm font-medium text-gray-700 dark:text-gray-200">
											{{ t("home.username") }}
											<input
												v-model="registerForm.username"
												type="text"
												required
												minlength="2"
												class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
											/>
										</label>

										<label class="text-sm font-medium text-gray-700 dark:text-gray-200">
											{{ t("home.email") }}
											<input
												v-model="registerForm.email"
												type="email"
												class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
											/>
										</label>
									</template>
								</div>

								<label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
									{{ t("home.password") }}
									<input
										v-model="passwordModel"
										type="password"
										required
										minlength="8"
										class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
									/>
								</label>

								<button class="btn-primary w-full" :disabled="pending">
									<span v-if="pending" class="animate-pulse">{{ t("common.loading") }}</span>
									<span v-else>
										{{ activeTab === "login" ? t("home.loginAction") : t("home.registerAction") }}
									</span>
								</button>

								<p class="text-xs text-gray-500 dark:text-gray-400">
									{{ activeTab === "login" ? t("home.switchToRegister") : t("home.switchToLogin") }}
								</p>
							</form>
						</div>
					</ClientOnly>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
// Script principal de la page d'accueil :
// - Gère l'affichage des statistiques, la connexion et l'inscription
// - Permet le changement d'onglet et la récupération des œuvres mises en avant
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAppSession } from "~/composables/useAppSession";

type WorkSummary = {
	id: number;
	title: string;
	originalTitle: string | null;
	synopsis: string | null;
	status: string;
};

type WorksResponse = {
	data: WorkSummary[];
	pagination: {
		total: number;
	};
};

const { t } = useI18n();
const session = useAppSession();
const currentUser = computed(() => session.user.value);

const activeTab = ref<"login" | "register">("login");
const pending = ref(false);
const feedback = reactive<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

const loginForm = reactive({ identifier: "", password: "" });
const registerForm = reactive({ username: "", email: "", password: "" });

const passwordModel = computed({
	get: () => (activeTab.value === "login" ? loginForm.password : registerForm.password),
	set: (value: string) => {
		if (activeTab.value === "login") {
			loginForm.password = value;
		} else {
			registerForm.password = value;
		}
	},
});

const stats = reactive<{ works: number; library: number; users: number | null }>({
	works: 0,
	library: 0,
	users: null,
});

const { data: worksData } = await useFetch<WorksResponse>("/api/works", {
	query: {
		limit: 3,
	},
	credentials: "include",
});

const featuredWorks = computed(() => worksData.value?.data ?? []);

const switchTab = (next: "login" | "register") => {
	activeTab.value = next;
	feedback.type = null;
	feedback.message = "";
};

const refreshStats = async () => {
	stats.works = worksData.value?.pagination.total ?? 0;

	if (currentUser.value) {
		try {
			const entries = await $fetch<any[]>("/api/library", {
				credentials: "include",
			});
			stats.library = entries.length;
		} catch (error) {
			console.error("Failed to load library stats", error);
			stats.library = 0;
		}
	} else {
		stats.library = 0;
	}

	if (currentUser.value?.is_admin === 1) {
		try {
			const usersResponse = await $fetch<{ pagination: { total: number } }>("/api/users", {
				query: { limit: 1 },
				credentials: "include",
			});
			stats.users = usersResponse.pagination.total;
		} catch (error) {
			console.error("Failed to load user stats", error);
			stats.users = null;
		}
	} else {
		stats.users = null;
	}
};

const handleSubmit = async () => {
	pending.value = true;
	feedback.type = null;
	feedback.message = "";
	session.clearError();

	try {
		if (activeTab.value === "login") {
			await session.login(loginForm.identifier.trim(), loginForm.password);
			feedback.type = "success";
			feedback.message = t("home.loginSuccess");
		} else {
			await session.register({
				username: registerForm.username.trim(),
				email: registerForm.email?.trim() || null,
				password: registerForm.password,
			});
			feedback.type = "success";
			feedback.message = t("home.registerSuccess");
		}
		await refreshStats();
	} catch (error: any) {
		feedback.type = "error";
		feedback.message = error?.message ?? t("messages.unexpectedError");
	} finally {
		pending.value = false;
	}
};

watch(worksData, () => {
	stats.works = worksData.value?.pagination.total ?? stats.works;
});

watch(
	() => currentUser.value?.id,
	() => {
		refreshStats();
	}
);

onMounted(() => {
	refreshStats();
});
</script>
