/*
[id].ts
Endpoint pour accéder/modifier/supprimer une entrée précise de la bibliothèque.
L'id de l'entrée est injecté via le nom du fichier ([id].ts) grâce au routing Nuxt/Nitro.
Vérifie les droits d'accès (admin ou propriétaire).
*/
import { createError, defineEventHandler, readBody } from "h3";
import type { H3Event } from "h3";
import db from "../../utils/db";
import { assertOwnerOrAdmin } from "../../utils/auth";

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
	username: string;
}

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
		username: row.username,
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
		},
	};
}

export default defineEventHandler(async (event: H3Event) => {
	const method = event.method;
	const id = Number(event.context.params?.id);

	if (!Number.isInteger(id)) {
		throw createError({ statusCode: 400, statusMessage: "Invalid id." });
	}

	const entry = await new Promise<LibraryRow | undefined>((resolve) => {
		db.get(
			`SELECT le.id, le.user_id, le.work_id, le.status, le.progress, le.rating, le.review, le.updated_at, w.title AS work_title, w.cover_url AS work_cover_url, w.status AS work_status, u.username FROM library_entries le JOIN works w ON w.id = le.work_id JOIN users u ON u.id = le.user_id WHERE le.id = ?`,
			[id],
			(err, row: LibraryRow) => resolve(err || !row ? undefined : row)
		);
	});
	if (!entry) {
		throw createError({ statusCode: 404, statusMessage: "Library entry not found." });
	}

	if (method === "GET") {
		await assertOwnerOrAdmin(event, entry.user_id);
		return mapRow(entry);
	}

	if (method === "PATCH" || method === "PUT") {
		await assertOwnerOrAdmin(event, entry.user_id);
		const body = await readBody<{
			status?: string;
			progress?: number;
			rating?: number | null;
			review?: string | null;
		}>(event);

		const status = body?.status ?? entry.status;
		if (!allowedStatuses.has(status)) {
			throw createError({ statusCode: 400, statusMessage: "Invalid status." });
		}

		const progress = Math.max(Number.isFinite(body?.progress) ? Number(body?.progress) : entry.progress, 0);

		let rating: number | null = entry.rating;
		if (body?.rating !== undefined) {
			if (body.rating === null) {
				rating = null;
			} else {
				const value = Number(body.rating);
				if (!Number.isInteger(value) || value < 1 || value > 10) {
					throw createError({ statusCode: 400, statusMessage: "Rating must be between 1 and 10." });
				}
				rating = value;
			}
		}

		const review =
			body?.review === undefined ? entry.review : body.review?.trim() || null;

		await new Promise<void>((resolve, reject) => {
			db.run(
				"UPDATE library_entries SET status = ?, progress = ?, rating = ?, review = ?, updated_at = datetime('now') WHERE id = ?",
				[status, progress, rating, review, id],
				(err) => err ? reject(err) : resolve()
			);
		});
		
		const updated = await new Promise<LibraryRow>((resolve, reject) => {
			db.get(
				`SELECT le.id, le.user_id, le.work_id, le.status, le.progress, le.rating, le.review, le.updated_at, w.title AS work_title, w.cover_url AS work_cover_url, w.status AS work_status, u.username FROM library_entries le JOIN works w ON w.id = le.work_id JOIN users u ON u.id = le.user_id WHERE le.id = ?`,
				[id],
				(err, row: LibraryRow) => {
					if (err || !row) reject(err || new Error("Entry not found"));
					else resolve(row);
				}
			);
		});
		return mapRow(updated);
	}

	if (method === "DELETE") {
		await assertOwnerOrAdmin(event, entry.user_id);
		await new Promise<void>((resolve, reject) => {
			db.run("DELETE FROM library_entries WHERE id = ?", [id], (err) => err ? reject(err) : resolve());
		});
		return { success: true };
	}

	throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
