/*
auth.ts
Ce fichier centralise la gestion de l'authentification et des sessions côté backend.
Il fournit des fonctions utilitaires pour récupérer l'utilisateur courant, vérifier les rôles des users,
créer et détruire les sessions, et manipuler les cookies de session.
*/

import {
	createError,
	deleteCookie,
	getCookie,
	H3Event,
	setCookie,
} from "h3";
import { randomBytes } from "node:crypto";
import db from "./db";

export type DbUser = {
	id: number;
	username: string;
	email: string | null;
	is_admin: number;
	created_at: string;
};

type DbUserRow = DbUser & {
	session_token: string | null;
	session_expires_at: string | null;
};

const SESSION_COOKIE = "manhua_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 1 semaine

/*
Préparation des différents statements SQL utiles 
Plus tard il suffira de les appeler avec .get() / .run() / .all() avec des datas
*/

const getUserByIdStmt = db.prepare<[number], DbUser>(
	"SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?"
);

const getUserBySessionStmt = db.prepare<[string], DbUserRow>(
	`SELECT id, username, email, is_admin, created_at, session_token, session_expires_at
	 FROM users
	 WHERE session_token = ?
	   AND session_expires_at IS NOT NULL
	   AND session_expires_at > datetime('now')`
);

const updateSessionStmt = db.prepare<[string, string, number]>(
	"UPDATE users SET session_token = ?, session_expires_at = ? WHERE id = ?"
);

const clearSessionByIdStmt = db.prepare<[number]>(
	"UPDATE users SET session_token = NULL, session_expires_at = NULL WHERE id = ?"
);

const clearSessionByTokenStmt = db.prepare<[string]>(
	"UPDATE users SET session_token = NULL, session_expires_at = NULL WHERE session_token = ?"
);

// Cette fonction retire les champs sensibles (session_token) d'un DbUserRow
function sanitizeUser(row: DbUserRow): DbUser {
	return {
		id: row.id,
		username: row.username,
		email: row.email,
		is_admin: row.is_admin,
		created_at: row.created_at,
	};
}

// Récupère le token de session depuis le cookie ou le header
function getSessionToken(event: H3Event): string | null {
	const cookieToken = getCookie(event, SESSION_COOKIE);
	if (cookieToken) return cookieToken;

	const header = event.node.req.headers["x-session-token"];
	if (!header) return null;

	const headerValue = Array.isArray(header) ? header[0] : header;
	return headerValue ?? null;
}

// Récupère l'utilisateur courant selon le token de session
export function getCurrentUser(event: H3Event): DbUser | null {
	const token = getSessionToken(event);
	if (token) {
		const sessionUser = getUserBySessionStmt.get(token);
		if (sessionUser) {
			return sanitizeUser(sessionUser);
		}
	}

	const header = event.node.req.headers["x-user-id"];
	if (header) {
		const id = Number(Array.isArray(header) ? header[0] : header);
		if (Number.isInteger(id)) {
			const user = getUserByIdStmt.get(id);
			if (user) return user;
		}
	}

	return null;
}

// Dans le front, permet d'assurer qu'un user est authentifié
export function requireUser(event: H3Event): DbUser {
	const user = getCurrentUser(event);
	if (!user) {
		throw createError({ statusCode: 401, statusMessage: "Authentication required" });
	}
	return user;
}

// Dans le front, permet d'assurer qu'un user est admin
export function requireAdmin(event: H3Event): DbUser {
	const user = requireUser(event);
	if (user.is_admin !== 1) {
		throw createError({ statusCode: 403, statusMessage: "Admin privileges required" });
	}
	return user;
}

// Vérifie que l'user est bien le priopriétaire de la ressource ou un admin
export function assertOwnerOrAdmin(event: H3Event, ownerId: number): DbUser {
	const user = requireUser(event);
	if (user.id !== ownerId && user.is_admin !== 1) {
		throw createError({ statusCode: 403, statusMessage: "Insufficient permissions" });
	}
	return user;
}

// Créee la session pour un user et set le cookie de session et enregistre en BDD
export function createSession(event: H3Event, userId: number) {
	const token = randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
	updateSessionStmt.run(token, expiresAt, userId);
	setCookie(event, SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: Math.floor(SESSION_DURATION_MS / 1000),
	});
	return token;
}

// Détruit la session en nettoyant le cookie et la BDD
export function destroySession(event: H3Event, userId?: number) {
	const token = getSessionToken(event);
	if (token) {
		clearSessionByTokenStmt.run(token);
	}
	if (userId) {
		clearSessionByIdStmt.run(userId);
	}
	deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

export function getUserById(id: number): DbUser | null {
	return getUserByIdStmt.get(id) ?? null;
}
