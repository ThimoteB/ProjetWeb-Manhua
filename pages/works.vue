<template>
	<div class="max-w-6xl mx-auto px-4 py-12 space-y-10">
		<header class="space-y-3">
			<h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
				{{ t("works.title") }}
			</h1>
			<p class="text-gray-600 dark:text-gray-300 max-w-2xl">
				{{ t("home.heroSubtitle") }}
			</p>
		</header>

		<section class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 p-6 shadow-lg space-y-6">
			<form class="grid gap-4 md:grid-cols-[2fr,1fr,auto] items-end" @submit.prevent>
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("common.search") }}</span>
					<input
						v-model="search"
						type="search"
						:placeholder="t('works.searchPlaceholder')"
						class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
					/>
				</label>

				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("works.statusFilter") }}</span>
					<select
						v-model="status"
						class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
					>
						<option value="all">{{ t("common.all") }}</option>
						<option v-for="option in statusOptions" :key="option.value" :value="option.value">
							{{ t(`statuses.${option.value}`) }}
						</option>
					</select>
				</label>

				<div class="flex gap-2">
					<button type="button" class="btn-primary" @click="applyFilters">{{ t("common.search") }}</button>
					<button type="button" class="btn-secondary" @click="resetFilters">{{ t("common.reset") }}</button>
				</div>
			</form>

			<div v-if="toast.message" :class="toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'" class="rounded-lg border px-3 py-2 text-sm">
				{{ toast.message }}
			</div>

			<div v-if="pending" class="flex justify-center py-12">
				<span class="text-sm text-gray-500">{{ t("common.loading") }}</span>
			</div>

			<div v-else-if="works.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
				{{ t("works.empty") }}
			</div>

			<div v-else class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				<article
					v-for="work in works"
					:key="work.id"
					class="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/70 p-5 shadow-sm"
				>
					<div class="flex gap-4">
						<img
							v-if="work.coverUrl"
							:src="work.coverUrl"
							:alt="work.title"
							class="h-28 w-20 rounded-md object-cover shadow"
						/>
						<div class="flex-1 space-y-3">
							<div class="flex items-start gap-2">
								<div class="flex-1 space-y-1">
									<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ work.title }}</h3>
									<p v-if="work.originalTitle" class="text-sm text-gray-500 dark:text-gray-400">
										{{ work.originalTitle }}
									</p>
									<p class="text-xs font-medium uppercase tracking-wide text-emerald-600">
										{{ t(`statuses.${work.status}`) }}
									</p>
								</div>
								<div class="shrink-0">
									<ClientOnly>
										<button
											v-if="canModerateWork"
											type="button"
											class="btn-secondary border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/70 dark:text-red-200 dark:hover:bg-red-900/30"
											:disabled="isDeleting(work.id)"
											@click="deleteWork(work)"
										>
											<span v-if="isDeleting(work.id)" class="animate-pulse">{{ t("common.loading") }}</span>
											<span v-else>{{ t("common.delete") }}</span>
										</button>
									</ClientOnly>
								</div>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
								{{ work.synopsis || "" }}
							</p>
						</div>
					</div>
					<div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
						<div>
							<span class="font-medium text-emerald-600">{{ t("works.averageRating") }}</span>
							<span v-if="work.avgRating">{{ work.avgRating }}/10 ({{ work.ratingCount }})</span>
							<span v-else>—</span>
						</div>
						<div>
							<span class="font-medium text-emerald-600">{{ t("works.entries") }}</span>
							<span>{{ work.entryCount }}</span>
						</div>
					</div>
					<ClientOnly>
						<button 
							v-if="!userLibraryWorkIds.has(work.id)"
							class="btn-primary w-full text-sm" 
							@click="addToLibrary(work)"
						>
							{{ t("works.addToLibrary") }}
						</button>
						<button 
							v-else
							class="btn-secondary w-full text-sm border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950" 
							@click="confirmRemoveFromLibrary(work)"
						>
							{{ t("works.removeFromLibrary") }}
						</button>
					</ClientOnly>
				</article>
			</div>

			<div v-if="totalPages > 1" class="flex items-center justify-between pt-4 text-sm text-gray-500 dark:text-gray-400">
				<button class="btn-secondary" :disabled="page === 1" @click="changePage(-1)">←</button>
				<span>{{ page }} / {{ totalPages }}</span>
				<button class="btn-secondary" :disabled="page === totalPages" @click="changePage(1)">→</button>
			</div>
		</section>

		<ClientOnly>
			<section class="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/60 p-6 shadow-lg">
				<div class="space-y-2 mb-4">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ t("works.createTitle") }}</h2>
					<p class="text-sm text-emerald-900/80 dark:text-emerald-100/70">{{ t("works.createSubtitle") }}</p>
				</div>
				<p v-if="!canCreateWork" class="rounded-lg border border-emerald-200/70 dark:border-emerald-800/70 bg-white/80 dark:bg-gray-950/50 px-4 py-3 text-sm text-emerald-900/80 dark:text-emerald-100/80">
					{{ t("works.createLoginHint") }}
				</p>
				<form v-else class="grid gap-4 md:grid-cols-2" @submit.prevent="createWork">
					<label class="flex flex-col gap-2">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("works.formTitle") }}</span>
						<input
							v-model="newWork.title"
							required
							class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
						/>
					</label>

					<label class="flex flex-col gap-2">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("works.formOriginalTitle") }}</span>
						<input
							v-model="newWork.originalTitle"
							class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
						/>
					</label>

					<label class="flex flex-col gap-2">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("works.formStatus") }}</span>
						<select
							v-model="newWork.status"
							required
							class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
						>
							<option v-for="option in statusOptions" :key="option.value" :value="option.value">
								{{ t(`statuses.${option.value}`) }}
							</option>
						</select>
					</label>

					<label class="flex flex-col gap-2 md:col-span-2">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("works.formCover") }}</span>
						<input
							v-model="newWork.coverUrl"
							type="url"
							placeholder="https://example.com/image.jpg"
							class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
						/>
					</label>

					<label class="flex flex-col gap-2 md:col-span-2">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("works.formSynopsis") }}</span>
						<textarea
							v-model="newWork.synopsis"
							rows="4"
							class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
						></textarea>
					</label>

					<div class="md:col-span-2 flex gap-3">
						<button type="submit" class="btn-primary" :disabled="creating">
							<span v-if="creating" class="animate-pulse">{{ t("common.loading") }}</span>
							<span v-else>{{ t("works.formSubmit") }}</span>
						</button>
						<button type="button" class="btn-secondary" @click="resetNewWork">{{ t("common.reset") }}</button>
					</div>
				</form>
			</section>
		</ClientOnly>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useAppSession } from "~/composables/useAppSession";

const { t } = useI18n();
const session = useAppSession();
const currentUser = computed(() => session.user.value);
const canCreateWork = computed(() => Boolean(currentUser.value));
const canModerateWork = computed(() => currentUser.value?.is_admin === 1);

// Récupération de la bibliothèque de l'utilisateur pour savoir quelles œuvres sont déjà ajoutées
const { data: libraryData, refresh: refreshLibrary } = await useLazyAsyncData<{ workId: number; id: number }[]>(
	"user-library-works",
	async () => {
		if (!currentUser.value) return [];
		const entries = await $fetch<any[]>("/api/library", { credentials: "include" });
		return entries.map(entry => ({ workId: entry.workId, id: entry.id }));
	},
	{ watch: [() => currentUser.value?.id], server: false, default: () => [] }
);

const userLibraryWorkIds = computed(() => new Set((libraryData.value ?? []).map(entry => entry.workId)));

const search = ref("");
type StatusFilter = StatusValue | "all";
const status = ref<StatusFilter>("all");
const page = ref(1);
const limit = 9;

type WorkItem = {
	id: number;
	title: string;
	originalTitle: string | null;
	status: string;
	coverUrl: string | null;
	synopsis: string | null;
	avgRating: number | null;
	ratingCount: number;
	entryCount: number;
	createdBy: number | null;
	createdAt: string;
	updatedAt: string;
};

type WorksListResponse = {
	data: WorkItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
};

type StatusValue = "ongoing" | "completed" | "hiatus";
const statusOptions: Array<{ value: StatusValue }> = [
	{ value: "ongoing" },
	{ value: "completed" },
	{ value: "hiatus" },
];

const toast = reactive<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

const { data: worksResponse, pending, refresh } = await useLazyAsyncData<WorksListResponse>(
	"works-list",
	() =>
		$fetch<WorksListResponse>("/api/works", {
			query: {
				page: page.value,
				limit,
				search: search.value.trim() || undefined,
				status: status.value === "all" ? undefined : status.value,
			},
			credentials: "include",
		}),
	{
		watch: [page, search, status],
		default: () => ({ data: [], pagination: { page: 1, limit, total: 0 } }),
	}
);

const works = computed(() => worksResponse.value?.data ?? []);
const pagination = computed(() => worksResponse.value?.pagination ?? { page: 1, limit, total: 0 });
const totalPages = computed(() => Math.max(1, Math.ceil(pagination.value.total / pagination.value.limit)));

const showToast = (type: "success" | "error", message: string) => {
	toast.type = type;
	toast.message = message;
	setTimeout(() => {
		toast.type = null;
		toast.message = "";
	}, 3500);
};

const applyFilters = () => {
	page.value = 1;
	refresh();
};

const resetFilters = () => {
	search.value = "";
	status.value = "all";
	page.value = 1;
	refresh();
};

const changePage = (direction: number) => {
	const next = page.value + direction;
	if (next >= 1 && next <= totalPages.value) {
		page.value = next;
	}
};

const addToLibrary = async (work: WorkItem) => {
	if (!currentUser.value) {
		showToast("error", t("messages.loginRequired"));
		return;
	}

	try {
		await $fetch("/api/library", {
			method: "POST",
			credentials: "include",
			body: {
				workId: work.id,
				status: "planning",
			},
		});
		showToast("success", t("works.libraryAdded"));
		refreshLibrary(); // Actualiser la liste de la bibliothèque
	} catch (error: any) {
		if (error?.statusCode === 409) {
			showToast("error", t("works.alreadyAdded"));
		} else {
			showToast("error", t("messages.unexpectedError"));
		}
	}
};

const confirmRemoveFromLibrary = async (work: WorkItem) => {
	if (!currentUser.value) {
		showToast("error", t("messages.loginRequired"));
		return;
	}

	const confirmed = confirm(`Êtes-vous sûr de vouloir retirer "${work.title}" de votre bibliothèque ?`);
	if (!confirmed) return;

	try {
		// Trouver l'ID de l'entrée dans la bibliothèque
		const libraryEntry = libraryData.value?.find(entry => entry.workId === work.id);
		if (!libraryEntry) {
			showToast("error", "Entrée introuvable dans la bibliothèque");
			return;
		}

		await $fetch(`/api/library/${libraryEntry.id}`, {
			method: "DELETE",
			credentials: "include",
		});
		
		showToast("success", "Œuvre retirée de la bibliothèque");
		refreshLibrary(); // Actualiser la liste de la bibliothèque
	} catch (error: any) {
		showToast("error", t("messages.unexpectedError"));
	}
};

const newWork = reactive({
	title: "",
	originalTitle: "",
	status: "ongoing" as StatusValue,
	coverUrl: "",
	synopsis: "",
});

const creating = ref(false);
const deletingId = ref<number | null>(null);

const resetNewWork = () => {
	newWork.title = "";
	newWork.originalTitle = "";
	newWork.status = "ongoing";
	newWork.coverUrl = "";
	newWork.synopsis = "";
};

const createWork = async () => {
	const title = newWork.title.trim();
	if (!currentUser.value) {
		showToast("error", t("messages.loginRequired"));
		return;
	}

	if (!title) {
		showToast("error", t("messages.formError"));
		return;
	}

	creating.value = true;
	try {
		await $fetch("/api/works", {
			method: "POST",
			credentials: "include",
			body: {
				title,
				originalTitle: newWork.originalTitle.trim() || undefined,
				status: newWork.status,
				coverUrl: newWork.coverUrl.trim() || undefined,
				synopsis: newWork.synopsis.trim() || undefined,
			},
		});
		showToast("success", t("works.createdSuccess"));
		resetNewWork();
		page.value = 1;
		refresh();
	} catch (error) {
		console.error(error);
		showToast("error", t("messages.unexpectedError"));
	} finally {
		creating.value = false;
	}
};

const isDeleting = (id: number) => deletingId.value === id;

const deleteWork = async (work: WorkItem) => {
	if (!currentUser.value || currentUser.value.is_admin !== 1) {
		showToast("error", t("messages.adminRequired"));
		return;
	}

	if (typeof window !== "undefined") {
		const confirmed = window.confirm(t("works.deleteConfirm", { title: work.title }));
		if (!confirmed) {
			return;
		}
	}

	deletingId.value = work.id;
	try {
		await $fetch(`/api/works/${work.id}`, {
			method: "DELETE",
			credentials: "include",
		});
		showToast("success", t("works.deletedSuccess"));
		if (works.value.length === 1 && page.value > 1) {
			page.value -= 1;
		}
		refresh();
	} catch (error) {
		console.error(error);
		showToast("error", t("messages.unexpectedError"));
	} finally {
		deletingId.value = null;
	}
};
</script>
