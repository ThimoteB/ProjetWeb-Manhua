import bcrypt from "bcryptjs";
import { createError, defineEventHandler, readBody } from "h3";
import db from "../../utils/db";
import { createSession, getUserById } from "../../utils/auth";

type RegisterPayload = {
	username?: string;
	email?: string;
	password?: string;
};

const insertUserStmt = db.prepare<[
	string,
	string | null,
	string
]>("INSERT INTO users (username, email, is_admin, password_hash) VALUES (?, ?, 0, ?)");

export default defineEventHandler(async (event) => {
	const body = await readBody<RegisterPayload>(event);
	const username = body?.username?.trim();
	const email = body?.email?.trim() || null;
	const password = body?.password?.trim();

	if (!username) {
		throw createError({ statusCode: 400, statusMessage: "Username is required." });
	}
	if (username.length < 2) {
		throw createError({ statusCode: 400, statusMessage: "Username must be at least 2 characters." });
	}

	if (!password || password.length < 8) {
		throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters." });
	}

	const passwordHash = await bcrypt.hash(password, 10);

	try {
		const result = insertUserStmt.run(username, email, passwordHash);
		const userId = Number(result.lastInsertRowid);
		createSession(event, userId);
		const user = getUserById(userId);
		return {
			user,
		};
	} catch (error: any) {
		if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
			throw createError({ statusCode: 409, statusMessage: "Username or email already exists." });
		}
		throw error;
	}
});
