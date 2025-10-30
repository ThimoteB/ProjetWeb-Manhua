import { createError, defineEventHandler, getQuery, readBody } from "h3";
import type { H3Event } from "h3";
import db from "../../utils/db";
import { requireUser } from "../../utils/auth";

interface WorkRow {
	id: number;
	title: string;
	original_title: string | null;
	status: string;
	cover_url: string | null;
	synopsis: string | null;
	created_by: number | null;
	created_at: string;
	updated_at: string;
	avg_rating: number | null;
	rating_count: number;
	entry_count: number;
}

const listStmt = db.prepare<[
	{ search: string; pattern: string; status?: string; limit: number; offset: number }
], WorkRow>(`
	SELECT
		w.id,
		w.title,
		w.original_title,
		w.status,
		w.cover_url,
		w.synopsis,
		w.created_by,
		w.created_at,
		w.updated_at,
		AVG(le.rating) AS avg_rating,
		COUNT(le.rating) AS rating_count,
		COUNT(le.id) AS entry_count
	FROM works w
	LEFT JOIN library_entries le ON le.work_id = w.id
	WHERE (:search = '' OR w.title LIKE :pattern OR w.original_title LIKE :pattern)
		AND (:status IS NULL OR w.status = :status)
	GROUP BY w.id
	ORDER BY w.title COLLATE NOCASE
	LIMIT :limit OFFSET :offset
`);

const countStmt = db.prepare<[
	{ search: string; pattern: string; status?: string }
], { total: number }>(`
	SELECT COUNT(*) AS total
	FROM works
	WHERE (:search = '' OR title LIKE :pattern OR original_title LIKE :pattern)
		AND (:status IS NULL OR status = :status)
`);

const insertStmt = db.prepare<[
	string,
	string | null,
	string,
	string | null,
	string | null,
	number | null
]>(
	"INSERT INTO works (title, original_title, status, cover_url, synopsis, created_by) VALUES (?, ?, ?, ?, ?, ?)"
);

export default defineEventHandler(async (event: H3Event) => {
	const method = event.method;

	if (method === "GET") {
		const query = getQuery(event);
		const search = typeof query.search === "string" ? query.search.trim() : "";
		const status = typeof query.status === "string" ? query.status.trim() : undefined;
		const limit = Math.min(parseInt(query.limit as string, 10) || 20, 50);
		const page = Math.max(parseInt(query.page as string, 10) || 1, 1);
		const offset = (page - 1) * limit;

		const params = {
			search,
			pattern: search ? `%${search}%` : "",
			status,
			limit,
			offset,
		};

		const rows = listStmt.all(params);
		const { total } = countStmt.get(params) ?? { total: 0 };

		return {
			data: rows.map((row: WorkRow) => ({
				id: row.id,
				title: row.title,
				originalTitle: row.original_title,
				status: row.status,
				coverUrl: row.cover_url,
				synopsis: row.synopsis,
				createdBy: row.created_by,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
				avgRating: row.avg_rating ? Number(row.avg_rating.toFixed(2)) : null,
				ratingCount: row.rating_count,
				entryCount: row.entry_count,
			})),
			pagination: {
				page,
				limit,
				total,
			},
		};
	}

	if (method === "POST") {
		const requester = requireUser(event);
		const body = await readBody<{
			title?: string;
			originalTitle?: string;
			status?: string;
			coverUrl?: string;
			synopsis?: string;
			createdBy?: number | null;
		}>(event);

		const title = body?.title?.trim();
		if (!title) {
			throw createError({ statusCode: 400, statusMessage: "Title is required." });
		}

		const statusValue = body?.status ?? "ongoing";
		if (!["ongoing", "completed", "hiatus"].includes(statusValue)) {
			throw createError({ statusCode: 400, statusMessage: "Invalid status." });
		}

		let createdBy: number | null = requester.id;
		if (requester.is_admin === 1 && body?.createdBy !== undefined) {
			if (body.createdBy === null) {
				createdBy = null;
			} else {
				const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(body.createdBy);
				if (!userExists) {
					throw createError({ statusCode: 404, statusMessage: "Creator user not found." });
				}
				createdBy = Number(body.createdBy);
			}
		}

		const result = insertStmt.run(
			title,
			body?.originalTitle?.trim() || null,
			statusValue,
			body?.coverUrl?.trim() || null,
			body?.synopsis?.trim() || null,
			createdBy
		);

		const insertedId = Number(result.lastInsertRowid);
		const createdWork = db.prepare<[
			number
		], WorkRow>(
			`SELECT w.*, NULL AS avg_rating, 0 AS rating_count, 0 AS entry_count FROM works w WHERE w.id = ?`
		).get(insertedId);

		return {
			id: insertedId,
			title,
			originalTitle: createdWork?.original_title ?? null,
			status: statusValue,
			coverUrl: createdWork?.cover_url ?? null,
			synopsis: createdWork?.synopsis ?? null,
			createdBy,
			createdAt: createdWork?.created_at,
			updatedAt: createdWork?.updated_at,
			avgRating: null,
			ratingCount: 0,
			entryCount: 0,
		};
	}

	throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
