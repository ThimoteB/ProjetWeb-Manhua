
/*
index.ts
Ce fichier gère les opérations principales sur la liste des oeuvres (works) :
- Récupération paginée et filtrée (GET)
- Création d'une nouvelle oeuvre (POST)
Il utilise des requêtes SQL préparées pour la recherche, le comptage et l'insertion.
Les paramètres de recherche (titre, statut, pagination) sont extraits de la query string.
L'utilisateur doit être authentifié pour créer une oeuvre.
*/

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

export default defineEventHandler(async (event: H3Event) => {
   const method = event.method;

   // GET : liste paginée et filtrée des oeuvres
   if (method === "GET") {
	   /*
	   Recherche et pagination :
	   - search : filtre sur le titre ou le titre original (LIKE)
	   - status : filtre sur le statut (ongoing, completed, hiatus)
	   - limit/page : pagination
		Pour permettre d'avoir une barre de recherche dynamique dans mon frontend
	   */
	   const query = getQuery(event);
	   const search = typeof query.search === "string" ? query.search.trim() : "";
	   const status = typeof query.status === "string" ? query.status.trim() : undefined;
	   const limit = Math.min(parseInt(query.limit as string, 10) || 20, 50);
	   const page = Math.max(parseInt(query.page as string, 10) || 1, 1);
	   const offset = (page - 1) * limit;

	   const pattern = search ? `%${search}%` : "";
	   
	   const rows = await new Promise<WorkRow[]>((resolve) => {
		   const whereClause = [];
		   const queryParams: any[] = [];
		   
		   if (search) {
			   whereClause.push("(w.title LIKE ? OR w.original_title LIKE ?)");
			   queryParams.push(pattern, pattern);
		   }
		   if (status) {
			   whereClause.push("w.status = ?");
			   queryParams.push(status);
		   }
		   
		   const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";
		   const sql = `SELECT w.id, w.title, w.original_title, w.status, w.cover_url, w.synopsis, w.created_by, w.created_at, w.updated_at, AVG(le.rating) AS avg_rating, COUNT(le.rating) AS rating_count, COUNT(le.id) AS entry_count FROM works w LEFT JOIN library_entries le ON le.work_id = w.id ${whereSQL} GROUP BY w.id ORDER BY w.title COLLATE NOCASE LIMIT ? OFFSET ?`;
		   queryParams.push(limit, offset);
		   
		   db.all(sql, queryParams, (err, rows: WorkRow[]) => resolve(err || !rows ? [] : rows));
	   });
	   
	   const { total } = await new Promise<{ total: number }>((resolve) => {
		   const whereClause = [];
		   const queryParams: any[] = [];
		   
		   if (search) {
			   whereClause.push("(title LIKE ? OR original_title LIKE ?)");
			   queryParams.push(pattern, pattern);
		   }
		   if (status) {
			   whereClause.push("status = ?");
			   queryParams.push(status);
		   }
		   
		   const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";
		   const sql = `SELECT COUNT(*) AS total FROM works ${whereSQL}`;
		   
		   db.get(sql, queryParams, (err, row: {total: number}) => resolve(err || !row ? {total: 0} : row));
	   });

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

   // POST : création d'une nouvelle oeuvre
   if (method === "POST") {
	   /*
	   Création d'une oeuvre :
	   - Vérifie que l'utilisateur est authentifié
	   - Vérifie la validité des champs (titre obligatoire, statut autorisé)
	   */
	   const requester = await requireUser(event);
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
			   const userExists = await new Promise<any>((resolve) => {
				   db.get("SELECT id FROM users WHERE id = ?", [body.createdBy], (err, row) => resolve(err || !row ? null : row));
			   });
			   if (!userExists) {
				   throw createError({ statusCode: 404, statusMessage: "Creator user not found." });
			   }
			   createdBy = Number(body.createdBy);
		   }
	   }

	   const insertedId = await new Promise<number>((resolve, reject) => {
		   db.run(
			   "INSERT INTO works (title, original_title, status, cover_url, synopsis, created_by) VALUES (?, ?, ?, ?, ?, ?)",
			   [title, body?.originalTitle?.trim() || null, statusValue, body?.coverUrl?.trim() || null, body?.synopsis?.trim() || null, createdBy],
			   function(err) {
				   if (err) reject(err);
				   else resolve(this.lastID);
			   }
		   );
	   });

	   const createdWork = await new Promise<WorkRow | undefined>((resolve) => {
		   db.get(
			   `SELECT w.*, NULL AS avg_rating, 0 AS rating_count, 0 AS entry_count FROM works w WHERE w.id = ?`,
			   [insertedId],
			   (err, row: WorkRow) => resolve(err || !row ? undefined : row)
		   );
	   });

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
