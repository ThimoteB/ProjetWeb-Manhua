<template>
	<div class="max-w-6xl mx-auto px-4 py-12 space-y-10">
		<header class="space-y-3">
			<h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
				{{ t("admin.title") }}
			</h1>
			<p class="text-gray-600 dark:text-gray-300 max-w-2xl">
				{{ t("admin.subtitle") }}
			</p>
		</header>

		<ClientOnly>
			<div v-if="!canAccess" class="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/80 dark:bg-red-950/40 p-6 text-sm text-red-700 dark:text-red-200">
				{{ t("admin.restricted") }}
			</div>
			<div v-else class="space-y-8">
				<section class="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/60 p-6 shadow-lg">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t("admin.createTitle") }}</h2>
					<form class="grid gap-4 md:grid-cols-2" @submit.prevent="createUser">
						<label class="flex flex-col gap-2">
							<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("home.username") }}</span>
							<input
								v-model="form.username"
								required
								minlength="2"
								class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
							/>
						</label>

						<label class="flex flex-col gap-2">
							<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("home.email") }}</span>
							<input
								v-model="form.email"
								type="email"
								class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
							/>
						</label>

						<label class="flex flex-col gap-2">
							<span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("admin.formPassword") }}</span>
							<input
								v-model="form.password"
								type="password"
								required
								minlength="8"
								class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
							/>
						</label>

						<label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
							<input v-model="form.isAdmin" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
							<span>{{ t("admin.formIsAdmin") }}</span>
						</label>

						<div class="md:col-span-2 flex gap-3">
							<button type="submit" class="btn-primary" :disabled="creating">
								<span v-if="creating" class="animate-pulse">{{ t("common.loading") }}</span>
								<span v-else>{{ t("common.submit") }}</span>
							</button>
							<button type="button" class="btn-secondary" @click="resetForm">{{ t("common.reset") }}</button>
						</div>
					</form>
				</section>

				<section class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 p-6 shadow-lg space-y-6">
					<div class="flex flex-wrap items-center gap-3">
						<label class="flex-1 min-w-[200px]">
							<span class="block text-sm font-medium text-gray-700 dark:text-gray-200">{{ t("common.search") }}</span>
							<input
								v-model="search"
								type="search"
								:placeholder="t('admin.searchPlaceholder')"
								class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
							/>
						</label>
						<button class="btn-secondary text-sm" :disabled="pending" @click="refreshUsers">{{ t("common.refresh") }}</button>
					</div>

					<div v-if="toast.message" :class="toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'" class="rounded-lg border px-3 py-2 text-sm">
						{{ toast.message }}
					</div>

					<div v-if="pending" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
						{{ t("common.loading") }}
					</div>

					<div v-else class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
							<thead class="bg-gray-50 dark:bg-gray-900">
								<tr>
									<th class="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{{ t("admin.tableUsername") }}</th>
									<th class="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{{ t("admin.tableEmail") }}</th>
									<th class="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{{ t("admin.tableRole") }}</th>
									<th class="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{{ t("admin.tableCreatedAt") }}</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 dark:divide-gray-800">
								<tr v-for="user in users" :key="user.id" class="bg-white dark:bg-gray-950">
									<td class="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{{ user.username }}</td>
									<td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ user.email || '—' }}</td>
									<td class="px-4 py-2">
										<span
											class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
											:class="user.isAdmin ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'"
										>
											{{ user.isAdmin ? t("admin.roleAdmin") : t("admin.roleReader") }}
										</span>
									</td>
									<td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ formattedDate(user.createdAt) }}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div v-if="totalPages > 1" class="flex items-center justify-between pt-4 text-sm text-gray-500 dark:text-gray-400">
						<button class="btn-secondary" :disabled="page === 1" @click="changePage(-1)">←</button>
						<span>{{ page }} / {{ totalPages }}</span>
						<button class="btn-secondary" :disabled="page === totalPages" @click="changePage(1)">→</button>
					</div>
				</section>
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
const canAccess = computed(() => currentUser.value?.is_admin === 1);

const toast = reactive<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
const creating = ref(false);
const search = ref("");
const page = ref(1);
const limit = 10;

const form = reactive({ username: "", email: "", password: "", isAdmin: false });

const statusMessage = (type: "success" | "error", message: string) => {
	toast.type = type;
	toast.message = message;
	setTimeout(() => {
		toast.type = null;
		toast.message = "";
	}, 3000);
};

type UserRecord = {
	id: number;
	username: string;
	email: string | null;
	isAdmin: boolean;
	createdAt: string;
};

type UsersResponse = {
	data: UserRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
};

const { data: usersResponse, pending, refresh } = await useLazyAsyncData<UsersResponse>(
	"admin-users",
	async () => {
		if (!canAccess.value) {
			return { data: [], pagination: { page: 1, limit, total: 0 } };
		}
		return await $fetch<UsersResponse>("/api/users", {
			query: {
				page: page.value,
				limit,
				search: search.value.trim() || undefined,
			},
			credentials: "include",
		});
	},
	{ watch: [canAccess, page, search], server: false, default: () => ({ data: [], pagination: { page: 1, limit, total: 0 } }) }
);

const users = computed(() => usersResponse.value?.data ?? []);
const pagination = computed(() => usersResponse.value?.pagination ?? { page: 1, limit, total: 0 });
const totalPages = computed(() => Math.max(1, Math.ceil(pagination.value.total / pagination.value.limit)));

const resetForm = () => {
	form.username = "";
	form.email = "";
	form.password = "";
	form.isAdmin = false;
};

const createUser = async () => {
	creating.value = true;
	try {
		await $fetch("/api/users", {
			method: "POST",
			credentials: "include",
			body: {
				username: form.username.trim(),
				email: form.email?.trim() || null,
				password: form.password,
				isAdmin: form.isAdmin,
			},
		});
		statusMessage("success", t("admin.created"));
		resetForm();
		refresh();
	} catch (error: any) {
		if (error?.statusCode === 409) {
			statusMessage("error", t("messages.formError"));
		} else {
			statusMessage("error", t("messages.unexpectedError"));
		}
	} finally {
		creating.value = false;
	}
};

const refreshUsers = () => {
	refresh();
};

const changePage = (direction: number) => {
	const next = page.value + direction;
	if (next >= 1 && next <= totalPages.value) {
		page.value = next;
	}
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
