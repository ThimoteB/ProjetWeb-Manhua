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

const getStmt = db.prepare<[number], DbUser>(
	"SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?"
);

const updateStmt = db.prepare<[
	string | null,
	number,
	number
]>("UPDATE users SET email = ?, is_admin = ? WHERE id = ?");

const updatePasswordStmt = db.prepare<[
	string,
	number
]>("UPDATE users SET password_hash = ? WHERE id = ?");

const deleteStmt = db.prepare<[number]>("DELETE FROM users WHERE id = ?");

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

	const existing = getStmt.get(id);
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
			requireAdmin(event);
			nextIsAdmin = body.isAdmin ? 1 : 0;
		}

		assertOwnerOrAdmin(event, existing.id);

		if (body?.password !== undefined) {
			const trimmed = body.password?.trim() ?? "";
			if (trimmed.length < 8) {
				throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters." });
			}
			const passwordHash = await bcrypt.hash(trimmed, 10);
			updatePasswordStmt.run(passwordHash, id);
		}

		updateStmt.run(nextEmail, nextIsAdmin, id);
		return mapUser({ ...existing, email: nextEmail, is_admin: nextIsAdmin });
	}

	if (method === "DELETE") {
		requireAdmin(event);
		const result = deleteStmt.run(id);
		if (result.changes === 0) {
			throw createError({ statusCode: 500, statusMessage: "Failed to delete user." });
		}
		return { success: true };
	}

	throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
