<template>
	<div class="max-w-6xl mx-auto px-4 py-12 space-y-10">
		<header class="space-y-3">
			<h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
				{{ t("library.title") }}
			</h1>
			<p class="text-gray-600 dark:text-gray-300 max-w-2xl">
				{{ t("library.subtitle") }}
			</p>
		</header>

		<ClientOnly>
			<div v-if="!currentUser" class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/70 p-6 text-center text-gray-600 dark:text-gray-300">
				{{ t("library.loginPrompt") }}
			</div>
			<div v-else class="space-y-6">
				<div class="flex items-center justify-between">
					<NuxtLink to="/works" class="btn-secondary text-sm">{{ t("home.ctaCatalog") }}</NuxtLink>
					<button class="btn-primary text-sm" :disabled="pending" @click="refreshEntries">
						{{ t("common.refresh") }}
					</button>
				</div>

				<div v-if="toast.message" :class="toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'" class="rounded-lg border px-3 py-2 text-sm">
					{{ toast.message }}
				</div>

				<div v-if="pending" class="flex justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
					{{ t("common.loading") }}
				</div>

				<div v-else-if="entries.length === 0" class="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-950/50 p-10 text-center text-gray-500 dark:text-gray-400">
					{{ t("library.empty") }}
				</div>

				<div v-else class="grid gap-6 md:grid-cols-2">
					<article
						v-for="entry in entries"
						:key="entry.id"
						class="relative flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/70 p-5 shadow-sm"
					>
						<div class="flex items-start gap-4">
							<img
								v-if="entry.work.coverUrl"
								:src="entry.work.coverUrl"
								:alt="entry.work.title"
								class="h-28 w-20 rounded-md object-cover shadow"
							/>
							<div class="flex-1 space-y-1">
								<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ entry.work.title }}</h2>
								<p class="text-xs uppercase tracking-wide text-emerald-600">
									{{ t(`statuses.${entry.work.status}`) }}
								</p>
								<p v-if="entry.work.synopsis" class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
									{{ entry.work.synopsis }}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{{ formattedDate(entry.updatedAt) }}
								</p>
							</div>
						</div>

						<div v-if="editingEntryId !== entry.id" class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
							<p>
								<strong>{{ t("library.userStatus") }}:</strong>
								{{ t(`statuses.${entry.status}`) }}
							</p>
							<p>
								<strong>{{ t("library.progress") }}:</strong>
								{{ entry.progress }}
							</p>
							<p>
								<strong>{{ t("library.rating") }}:</strong>
								{{ entry.rating ?? "—" }}
							</p>
							<p>
								<strong>{{ t("library.review") }}:</strong>
								<span>&nbsp;</span>
								<span>{{ entry.review || "—" }}</span>
							</p>
						</div>

						<form v-else class="space-y-3 text-sm" @submit.prevent="saveEntry(entry.id)">
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
								{{ t("works.formStatus") }}
								<select
									v-model="editForm.status"
									class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
								>
									<option v-for="option in libraryStatuses" :key="option" :value="option">
										{{ t(`statuses.${option}`) }}
									</option>
								</select>
							</label>

							<label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
								{{ t("library.progress") }}
								<input
									v-model.number="editForm.progress"
									type="number"
									min="0"
									class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
								/>
							</label>

							<label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
								{{ t("library.rating") }} (1-10)
								<input
									:value="editForm.rating ?? ''"
									type="number"
									min="1"
									max="10"
									step="1"
									class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
									@input="onRatingInput"
								/>
							</label>

							<label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
								{{ t("library.review") }}
								<textarea
									v-model="editForm.review"
									rows="3"
									class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
								></textarea>
							</label>

							<div class="flex gap-2">
								<button type="submit" class="btn-primary" :disabled="actionPending">
									{{ t("library.saveChanges") }}
								</button>
								<button type="button" class="btn-secondary" @click="cancelEditing">{{ t("library.cancel") }}</button>
							</div>
						</form>

						<div v-if="editingEntryId !== entry.id" class="flex gap-3 text-sm">
							<button class="btn-secondary" @click="startEdit(entry)">{{ t("library.editEntry") }}</button>
							<button class="btn-secondary" @click="removeEntry(entry.id)">{{ t("library.removeEntry") }}</button>
						</div>
					</article>
				</div>
			</div>
		</ClientOnly>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useAppSession } from "~/composables/useAppSession";

const { t, locale } = useI18n();
const session = useAppSession();
const currentUser = computed(() => session.user.value);

const libraryStatuses = ["planning", "reading", "completed", "on_hold", "dropped"] as const;

type LibraryEntry = {
	id: number;
	userId: number;
	workId: number;
	status: string;
	progress: number;
	rating: number | null;
	review: string | null;
	updatedAt: string;
	work: {
		id: number;
		title: string;
		coverUrl: string | null;
		status: string;
		synopsis: string | null;
	};
};

const toast = reactive<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
const editingEntryId = ref<number | null>(null);
const actionPending = ref(false);

const editForm = reactive<{ status: string; progress: number; rating: number | null; review: string }>(
	{ status: "reading", progress: 0, rating: null, review: "" }
);

const { data: libraryData, pending, refresh } = await useLazyAsyncData<LibraryEntry[]>(
	"library-entries",
	async () => {
		if (!currentUser.value) {
			return [];
		}
		return await $fetch<LibraryEntry[]>("/api/library", {
			credentials: "include",
		});
	},
	{ watch: [() => currentUser.value?.id], server: false, default: () => [] }
);

const entries = computed(() => libraryData.value ?? []);

const showToast = (type: "success" | "error", message: string) => {
	toast.type = type;
	toast.message = message;
	setTimeout(() => {
		toast.type = null;
		toast.message = "";
	}, 3000);
};

const refreshEntries = () => {
	refresh();
};

const startEdit = (entry: LibraryEntry) => {
	editingEntryId.value = entry.id;
	editForm.status = entry.status;
	editForm.progress = entry.progress;
	editForm.rating = entry.rating ?? null;
	editForm.review = entry.review ?? "";
};

const cancelEditing = () => {
	editingEntryId.value = null;
};

const saveEntry = async (entryId: number) => {
	if (!currentUser.value) {
		showToast("error", t("messages.loginRequired"));
		return;
	}
	actionPending.value = true;
	try {
		await $fetch(`/api/library/${entryId}`, {
			method: "PATCH",
			credentials: "include",
			body: {
				status: editForm.status,
				progress: Number.isFinite(editForm.progress) ? editForm.progress : 0,
				rating: editForm.rating,
				review: editForm.review.trim() ? editForm.review.trim() : null,
			},
		});
		showToast("success", t("library.updated"));
		editingEntryId.value = null;
		refresh();
	} catch (error) {
		console.error(error);
		showToast("error", t("messages.unexpectedError"));
	} finally {
		actionPending.value = false;
	}
};

const removeEntry = async (entryId: number) => {
	if (!currentUser.value) {
		showToast("error", t("messages.loginRequired"));
		return;
	}
	actionPending.value = true;
	try {
		await $fetch(`/api/library/${entryId}`, {
			method: "DELETE",
			credentials: "include",
		});
		showToast("success", t("library.removed"));
		refresh();
	} catch (error) {
		console.error(error);
		showToast("error", t("messages.unexpectedError"));
	} finally {
		actionPending.value = false;
	}
};

const onRatingInput = (event: Event) => {
	const value = (event.target as HTMLInputElement).value;
	if (value === "") {
		editForm.rating = null;
		return;
	}
	const numeric = Number(value);
	if (Number.isNaN(numeric)) {
		editForm.rating = null;
		return;
	}
	const clamped = Math.max(1, Math.min(10, Math.round(numeric)));
	editForm.rating = clamped;
};

const formattedDate = (date: string) => {
	try {
		return new Intl.DateTimeFormat(locale.value, {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(new Date(date));
	} catch (error) {
		return date;
	}
};
</script>
