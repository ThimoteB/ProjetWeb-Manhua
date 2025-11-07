<template>
	<div class="min-h-screen flex flex-col bg-white dark:bg-gray-950">
		<header class="sticky top-0 z-50 border-b border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
			<div class="max-w-6xl mx-auto flex flex-wrap items-center gap-3 px-4 py-4">
				<NuxtLink
					to="/"
					class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
				>
					<span>MyManhuaList</span>
				</NuxtLink>

				<nav class="flex-1 flex flex-wrap items-center gap-2 text-sm">
					<NuxtLink
						v-for="link in visibleLinks"
						:key="link.to"
						:to="link.to"
						class="nav-link"
						:class="{ 'nav-link-active': route.path === link.to }"
					>
						{{ link.label }}
					</NuxtLink>
				</nav>

				<div class="flex items-center gap-2">
					<ThemeToggle />
					<LanguageToggle />
					<ClientOnly>
						<div v-if="currentUser" class="flex items-center gap-2">
							<span class="font-medium text-sm text-gray-800 dark:text-gray-100">{{ currentUser.username }}</span>
							<button
								class="btn-secondary"
								:disabled="logoutPending"
								@click="handleLogout"
							>
								{{ t("common.logout") }}
							</button>
						</div>
						<NuxtLink v-else to="/" class="btn-primary text-sm">
							{{ t("common.login") }}
						</NuxtLink>
					</ClientOnly>
				</div>
			</div>
		</header>

		<main class="flex-1">
			<slot />
		</main>

		<footer class="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
			<div class="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 dark:text-gray-300 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<strong class="font-medium text-gray-800 dark:text-gray-100">{{ t("footer.credits") }}</strong>
					<p class="mt-1">Raku · {{ t("footer.school") }}</p>
				</div>
				<div>
					<strong class="font-medium text-gray-800 dark:text-gray-100">{{ t("footer.contact") }}</strong>
					<p class="mt-1">thimote.bois@ensiie.eu</p>
				</div>
				<div class="text-xs text-gray-500 dark:text-gray-400">
					© {{ new Date().getFullYear() }} — {{ t("footer.rights") }}
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup lang="ts">
// Script principal du layout par défaut :
// - Gère l'affichage du header, du footer et la navigation principale
// - Permet la gestion de la session utilisateur et du logout
import { computed, onMounted, ref } from "vue";

const route = useRoute();
import { useAppSession } from "~/composables/useAppSession";

const { t } = useI18n();
const session = useAppSession();
const logoutPending = ref(false);
const currentUser = computed(() => session.user.value);

const links = computed(() => [
	{ to: "/", label: t("nav.home"), requiresAuth: false },
	{ to: "/works", label: t("nav.works"), requiresAuth: false },
	{ to: "/library", label: t("nav.library"), requiresAuth: true },
	{ to: "/admin", label: t("nav.admin"), requiresAdmin: true },
]);

const visibleLinks = computed(() =>
	links.value.filter((link) => {
		if (link.requiresAdmin) {
			return currentUser.value?.is_admin === 1;
		}
		if (link.requiresAuth) {
			return Boolean(currentUser.value);
		}
		return true;
	})
);

const ensureSession = async () => {
	try {
		await session.refresh();
	} catch (error) {
		console.error("Failed to refresh session", error);
	}
};

if (process.server) {
	await ensureSession();
} else {
	onMounted(() => {
		if (!session.initialized.value) {
			ensureSession();
		}
	});
}

const handleLogout = async () => {
	logoutPending.value = true;
	try {
		await session.logout();
	} catch (error) {
		console.error("Logout failed", error);
	} finally {
		logoutPending.value = false;
	}
};
</script>
