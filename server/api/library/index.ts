/*
index.ts
Endpoint GET pour récupérer la bibliothèque d'un utilisateur (liste des œuvres suivies).
Endpoint POST pour ajouter une œuvre à la bibliothèque.
Vérifie les droits d'accès (admin ou propriétaire).
*/
import { createError, defineEventHandler, getQuery, readBody } from "h3";
import type { H3Event } from "h3";
import db from "../../utils/db";
import { requireUser } from "../../utils/auth";

interface LibraryRow {
	id: number;
	user_id: number;
	work_id: number;
	status: string;
	progress: number;
	rating: number | null;
	review: string | null;
	updated_at: string;
	work_title: string;
	work_cover_url: string | null;
	work_status: string;
	work_synopsis: string | null;
}

const listStmt = db.prepare<[
	{ userId: number }
], LibraryRow>(`
	SELECT
		le.id,
		le.user_id,
		le.work_id,
		le.status,
		le.progress,
		le.rating,
		le.review,
		le.updated_at,
		w.title AS work_title,
		w.cover_url AS work_cover_url,
		w.status AS work_status,
		w.synopsis AS work_synopsis
	FROM library_entries le
	JOIN works w ON w.id = le.work_id
	WHERE le.user_id = :userId
	ORDER BY le.updated_at DESC
`);

const insertStmt = db.prepare<[
	number,
	number,
	string,
	number,
	number | null,
	string | null
]>(
	"INSERT INTO library_entries (user_id, work_id, status, progress, rating, review) VALUES (?, ?, ?, ?, ?, ?)"
);

const getEntryStmt = db.prepare<[
	number,
	number
], LibraryRow>(`
	SELECT
		le.id,
		le.user_id,
		le.work_id,
		le.status,
		le.progress,
		le.rating,
		le.review,
		le.updated_at,
		w.title AS work_title,
		w.cover_url AS work_cover_url,
		w.status AS work_status,
		w.synopsis AS work_synopsis
	FROM library_entries le
	JOIN works w ON w.id = le.work_id
	WHERE le.user_id = ? AND le.id = ?
`);

const workExistsStmt = db.prepare("SELECT id FROM works WHERE id = ?");

const allowedStatuses = new Set([
	"planning",
	"reading",
	"completed",
	"on_hold",
	"dropped",
]);

function mapRow(row: LibraryRow) {
	return {
		id: row.id,
		userId: row.user_id,
		workId: row.work_id,
		status: row.status,
		progress: row.progress,
		rating: row.rating,
		review: row.review,
		updatedAt: row.updated_at,
		work: {
			id: row.work_id,
			title: row.work_title,
			coverUrl: row.work_cover_url,
			status: row.work_status,
			synopsis: row.work_synopsis,
		},
	};
}

export default defineEventHandler(async (event: H3Event) => {
	const method = event.method;

	if (method === "GET") {
		const actor = requireUser(event);
		const query = getQuery(event);
		let userId = actor.id;

		if (query.userId !== undefined) {
			const requestedId = Number(query.userId);
			if (!Number.isInteger(requestedId)) {
				throw createError({ statusCode: 400, statusMessage: "Invalid user id." });
			}
			if (actor.is_admin === 1) {
				userId = requestedId;
			} else if (requestedId !== actor.id) {
				throw createError({ statusCode: 403, statusMessage: "Cannot view another user's library." });
			}
		}

		return listStmt.all({ userId }).map(mapRow);
	}

	if (method === "POST") {
		const actor = requireUser(event);
		const body = await readBody<{
			workId?: number;
			status?: string;
			progress?: number;
			rating?: number | null;
			review?: string | null;
		}>(event);

		const workId = Number(body?.workId);
		if (!Number.isInteger(workId)) {
			throw createError({ statusCode: 400, statusMessage: "Invalid work id." });
		}

		if (!workExistsStmt.get(workId)) {
			throw createError({ statusCode: 404, statusMessage: "Work not found." });
		}

		const status = body?.status ?? "planning";
		if (!allowedStatuses.has(status)) {
			throw createError({ statusCode: 400, statusMessage: "Invalid status." });
		}

		let rating: number | null = null;
		if (body?.rating !== undefined && body.rating !== null) {
			const value = Number(body.rating);
			if (!Number.isInteger(value) || value < 1 || value > 10) {
				throw createError({ statusCode: 400, statusMessage: "Rating must be between 1 and 10." });
			}
			rating = value;
		}

		const progress = Math.max(Number.isFinite(body?.progress) ? Number(body?.progress) : 0, 0);

		let insertedId: number | null = null;
		try {
			const result = insertStmt.run(
				actor.id,
				workId,
				status,
				progress,
				rating,
				body?.review?.trim() || null
			);
			insertedId = Number(result.lastInsertRowid);
		} catch (error: any) {
			if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
				throw createError({ statusCode: 409, statusMessage: "Work already in library." });
			}
			throw error;
		}

		const entry = insertedId !== null ? getEntryStmt.get(actor.id, insertedId) : null;
		return entry ? mapRow(entry) : null;
	}

	throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
