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

// Retire les champs sensibles (token, expiration) pour exposer un utilisateur côté front
function sanitizeUser(row: DbUserRow): DbUser {
	return {
		id: row.id,
		username: row.username,
		email: row.email,
		is_admin: row.is_admin,
		created_at: row.created_at,
	};
}

// Récupère le token de session depuis le cookie ou le header (utilisé pour authentifier l'utilisateur)
function getSessionToken(event: H3Event): string | null {
	const cookieToken = getCookie(event, SESSION_COOKIE);
	if (cookieToken) return cookieToken;

	const header = event.node.req.headers["x-session-token"];
	if (!header) return null;

	const headerValue = Array.isArray(header) ? header[0] : header;
	return headerValue ?? null;
}

// Retourne l'utilisateur courant si le token de session est valide, sinon null (asynchrone)
export async function getCurrentUser(event: H3Event): Promise<DbUser | null> {
	const token = getSessionToken(event);
	if (token) {
		const sessionUser = await new Promise<DbUserRow | undefined>((resolve) => {
			db.get(
				`SELECT id, username, email, is_admin, created_at, session_token, session_expires_at
				 FROM users
				 WHERE session_token = ?
				   AND session_expires_at IS NOT NULL
				   AND session_expires_at > datetime('now')`,
				[token],
				(err, row: DbUserRow) => {
					resolve(err || !row ? undefined : row);
				}
			);
		});
		
		if (sessionUser) {
			return sanitizeUser(sessionUser);
		}
	}

	const header = event.node.req.headers["x-user-id"];
	if (header) {
		const id = Number(Array.isArray(header) ? header[0] : header);
		if (Number.isInteger(id)) {
			const user = await new Promise<DbUser | undefined>((resolve) => {
				db.get(
					"SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?",
					[id],
					(err, row: DbUser) => {
						resolve(err || !row ? undefined : row);
					}
				);
			});
			if (user) return user;
		}
	}

	return null;
}

// Lance une erreur si aucun utilisateur n'est authentifié (utilisé pour sécuriser les endpoints)
export async function requireUser(event: H3Event): Promise<DbUser> {
	const user = await getCurrentUser(event);
	if (!user) {
		throw createError({ statusCode: 401, statusMessage: "Authentication required" });
	}
	return user;
}

// Lance une erreur si l'utilisateur n'est pas admin (sécurise les routes admin)
export async function requireAdmin(event: H3Event): Promise<DbUser> {
	const user = await requireUser(event);
	if (user.is_admin !== 1) {
		throw createError({ statusCode: 403, statusMessage: "Admin privileges required" });
	}
	return user;
}

// Vérifie que l'utilisateur est soit le propriétaire de la ressource, soit admin
export async function assertOwnerOrAdmin(event: H3Event, ownerId: number): Promise<DbUser> {
	const user = await requireUser(event);
	if (user.id !== ownerId && user.is_admin !== 1) {
		throw createError({ statusCode: 403, statusMessage: "Insufficient permissions" });
	}
	return user;
}

// Créee la session pour un user et set le cookie de session et enregistre en BDD
export function createSession(event: H3Event, userId: number) {
	const token = randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
	db.run("UPDATE users SET session_token = ?, session_expires_at = ? WHERE id = ?", [token, expiresAt, userId]);
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
		db.run("UPDATE users SET session_token = NULL, session_expires_at = NULL WHERE session_token = ?", [token]);
	}
	if (userId) {
		db.run("UPDATE users SET session_token = NULL, session_expires_at = NULL WHERE id = ?", [userId]);
	}
	deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

export async function getUserById(id: number): Promise<DbUser | null> {
	return new Promise<DbUser | null>((resolve) => {
		db.get(
			"SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?",
			[id],
			(err, row: DbUser) => {
				resolve(err || !row ? null : row);
			}
		);
	});
}
