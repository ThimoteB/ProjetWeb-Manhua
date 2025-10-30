import bcrypt from "bcryptjs";
import { createError, defineEventHandler, getQuery, readBody } from "h3";
import type { H3Event } from "h3";
import db from "../../utils/db";
import { getCurrentUser, requireAdmin } from "../../utils/auth";

type DbUser = {
	id: number;
	username: string;
	email: string | null;
	is_admin: number;
	created_at: string;
};

type PublicUser = {
	id: number;
	username: string;
	email: string | null;
	isAdmin: boolean;
	createdAt: string;
};

const baseSelect = `
	SELECT id, username, email, is_admin, created_at
	FROM users
	WHERE (:search = '' OR username LIKE :pattern OR email LIKE :pattern)
	ORDER BY created_at DESC
	LIMIT :limit OFFSET :offset
`;

const listStmt = db.prepare<[
	{ search: string; pattern: string; limit: number; offset: number }
], DbUser>(baseSelect);

const countStmt = db.prepare<[
	{ search: string; pattern: string }
], { total: number }>(`
	SELECT COUNT(*) AS total
	FROM users
	WHERE (:search = '' OR username LIKE :pattern OR email LIKE :pattern)
`);

const insertStmt = db.prepare<[
	string,
	string | null,
	number,
	string
]>("INSERT INTO users (username, email, is_admin, password_hash) VALUES (?, ?, ?, ?)");

function mapUser(row: DbUser): PublicUser {
	return {
		id: row.id,
		username: row.username,
		email: row.email,
		isAdmin: row.is_admin === 1,
		createdAt: row.created_at,
	};
}

export default defineEventHandler(async (event: H3Event) => {
	const method = event.method;

	if (method === "GET") {
		const query = getQuery(event);
		const search = typeof query.search === "string" ? query.search.trim() : "";
		const limit = Math.min(parseInt(query.limit as string, 10) || 20, 50);
		const page = Math.max(parseInt(query.page as string, 10) || 1, 1);
		const offset = (page - 1) * limit;

		const params = {
			search,
			pattern: search ? `%${search}%` : "",
			limit,
			offset,
		};

		const users = listStmt.all(params).map(mapUser);
		const { total } = countStmt.get(params) ?? { total: 0 };

		return {
			data: users,
			pagination: {
				page,
				limit,
				total,
			},
		};
	}

	if (method === "POST") {
		requireAdmin(event);
		const body = await readBody<{
			username?: string;
			email?: string;
			password?: string;
			isAdmin?: boolean;
		}>(event);
		const username = body?.username?.trim();
		if (!username) {
			throw createError({ statusCode: 400, statusMessage: "Username is required." });
		}
		if (username.length < 2) {
			throw createError({ statusCode: 400, statusMessage: "Username must be at least 2 characters." });
		}

		const password = body?.password?.trim();
		if (!password || password.length < 8) {
			throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters." });
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const requester = getCurrentUser(event);
		const wantsAdmin = body?.isAdmin === true;
		const isAdminFlag = wantsAdmin && requester?.is_admin === 1 ? 1 : 0;

		try {
			const result = insertStmt.run(
				username,
				body?.email?.trim() || null,
				isAdminFlag,
				passwordHash
			);

			return mapUser({
				id: Number(result.lastInsertRowid),
				username,
				email: body?.email?.trim() || null,
				is_admin: isAdminFlag,
				created_at: new Date().toISOString(),
			});
		} catch (error: any) {
			if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
				throw createError({ statusCode: 409, statusMessage: "Username or email already exists." });
			}
			throw error;
		}
	}

	throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
