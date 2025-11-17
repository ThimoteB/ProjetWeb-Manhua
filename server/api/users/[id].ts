
/*
[id].ts
Ce fichier gère les opérations sur un utilisateur individuel (GET, PATCH/PUT, DELETE).
L'identifiant de l'utilisateur est récupéré automatiquement via le nom du fichier ([id].ts) grâce au système de routing de Nuxt/Nitro :
	- L'URL /api/users/42 va injecter 42 dans event.context.params.id
Certaines opérations nécessitent d'être admin, d'autres autorisent le propriétaire ou un admin.
Le mot de passe est hashé lors de la modification.
*/

import bcrypt from "bcryptjs";
import { createError, defineEventHandler, readBody } from "h3";
import type { H3Event } from "h3";
import db from "../../utils/db";
import { assertOwnerOrAdmin, requireAdmin } from "../../utils/auth";

type DbUser = {
	id: number;
	username: string;
	email: string | null;
	is_admin: number;
	created_at: string;
};

function mapUser(row: DbUser) {
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
	const id = Number(event.context.params?.id);

	if (!Number.isInteger(id)) {
		throw createError({ statusCode: 400, statusMessage: "Invalid id." });
	}

	const existing = await new Promise<DbUser | undefined>((resolve) => {
		db.get(
			"SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?",
			[id],
			(err, row: DbUser) => resolve(err || !row ? undefined : row)
		);
	});
	if (!existing) {
		throw createError({ statusCode: 404, statusMessage: "User not found." });
	}

	if (method === "GET") {
		return mapUser(existing);
	}

	if (method === "PATCH" || method === "PUT") {
		const body = await readBody<{
			email?: string | null;
			isAdmin?: boolean;
			password?: string;
		}>(event);

		let nextEmail = body?.email === undefined ? existing.email : body.email?.trim() || null;
		let nextIsAdmin = existing.is_admin;

		if (body?.isAdmin !== undefined) {
			await requireAdmin(event);
			nextIsAdmin = body.isAdmin ? 1 : 0;
		}

		await assertOwnerOrAdmin(event, existing.id);

		if (body?.password !== undefined) {
			const trimmed = body.password?.trim() ?? "";
			if (trimmed.length < 8) {
				throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters." });
			}
			const passwordHash = await bcrypt.hash(trimmed, 10);
			await new Promise<void>((resolve, reject) => {
				db.run("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id], (err) => err ? reject(err) : resolve());
			});
		}

		await new Promise<void>((resolve, reject) => {
			db.run("UPDATE users SET email = ?, is_admin = ? WHERE id = ?", [nextEmail, nextIsAdmin, id], (err) => err ? reject(err) : resolve());
		});
		return mapUser({ ...existing, email: nextEmail, is_admin: nextIsAdmin });
	}

	if (method === "DELETE") {
		await requireAdmin(event);
		const changes = await new Promise<number>((resolve, reject) => {
			db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
				if (err) reject(err);
				else resolve(this.changes);
			});
		});
		if (changes === 0) {
			throw createError({ statusCode: 500, statusMessage: "Failed to delete user." });
		}
		return { success: true };
	}

	throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
