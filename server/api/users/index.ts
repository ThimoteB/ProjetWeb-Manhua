
/*
index.ts
Ce fichier gère les opérations principales sur les utilisateurs :
- Récupération paginée et filtrée (GET)
- Création d'un nouvel utilisateur (POST, admin uniquement)
Les paramètres de recherche (username, email, pagination) sont extraits de la query string.
Le mot de passe est hashé à la création.
*/

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

		const pattern = search ? `%${search}%` : "";
		
		const users = await new Promise<DbUser[]>((resolve) => {
			const whereClause = search ? "WHERE username LIKE ? OR email LIKE ?" : "";
			const queryParams = search ? [pattern, pattern, limit, offset] : [limit, offset];
			const sql = `SELECT id, username, email, is_admin, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
			
			db.all(sql, queryParams, (err, rows: DbUser[]) => resolve(err || !rows ? [] : rows));
		});
		
		const { total } = await new Promise<{ total: number }>((resolve) => {
			const whereClause = search ? "WHERE username LIKE ? OR email LIKE ?" : "";
			const queryParams = search ? [pattern, pattern] : [];
			const sql = `SELECT COUNT(*) AS total FROM users ${whereClause}`;
			
			db.get(sql, queryParams, (err, row: {total: number}) => resolve(err || !row ? {total: 0} : row));
		});
		
		const mappedUsers = users.map(mapUser);

		return {
			data: mappedUsers,
			pagination: {
				page,
				limit,
				total,
			},
		};
	}

	if (method === "POST") {
		await requireAdmin(event);
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

		const requester = await getCurrentUser(event);
		const wantsAdmin = body?.isAdmin === true;
		const isAdminFlag = wantsAdmin && requester?.is_admin === 1 ? 1 : 0;

		try {
			const insertedId = await new Promise<number>((resolve, reject) => {
				db.run(
					"INSERT INTO users (username, email, is_admin, password_hash) VALUES (?, ?, ?, ?)",
					[username, body?.email?.trim() || null, isAdminFlag, passwordHash],
					function(err) {
						if (err) reject(err);
						else resolve(this.lastID);
					}
				);
			});

			return mapUser({
				id: insertedId,
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
