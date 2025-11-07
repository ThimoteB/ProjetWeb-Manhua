/*
login.post.ts
Endpoint POST pour la connexion utilisateur.
Permet de s'authentifier via username ou email + mot de passe.
Crée la session si les identifiants sont valides.
*/
import bcrypt from "bcryptjs";
import { createError, defineEventHandler, readBody } from "h3";
import db from "../../utils/db";
import { createSession, getUserById } from "../../utils/auth";

type LoginPayload = {
	identifier?: string;
	password?: string;
};

const getByIdentifierStmt = db.prepare<[
	string,
	string
], {
	id: number;
	username: string;
	email: string | null;
	is_admin: number;
	created_at: string;
	password_hash: string | null;
}>(
	`SELECT id, username, email, is_admin, created_at, password_hash
	 FROM users
	 WHERE username = ? OR email = ?
	 LIMIT 1`
);

export default defineEventHandler(async (event) => {
	const body = await readBody<LoginPayload>(event);
	const identifier = body?.identifier?.trim();
	const password = body?.password || "";

	if (!identifier) {
		throw createError({ statusCode: 400, statusMessage: "Username or email is required." });
	}

	if (password.length === 0) {
		throw createError({ statusCode: 400, statusMessage: "Password is required." });
	}

	const record = getByIdentifierStmt.get(identifier, identifier);
	if (!record || !record.password_hash) {
		throw createError({ statusCode: 401, statusMessage: "Invalid credentials." });
	}

	const isValid = await bcrypt.compare(password, record.password_hash);
	if (!isValid) {
		throw createError({ statusCode: 401, statusMessage: "Invalid credentials." });
	}

	createSession(event, record.id);

	const user = getUserById(record.id);
	return {
		user,
	};
});
