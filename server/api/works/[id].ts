
/*
[id].ts
Ce fichier gère les opérations sur une oeuvre individuelle (GET, PATCH/PUT, DELETE).
L'identifiant de l'oeuvre est récupéré automatiquement via le nom du fichier ([id].ts) grâce au système de routing de Nuxt/Nitro :
- L'URL /api/works/42 va injecter 42 dans event.context.params.id
On utilise des statements SQL pour récupérer, mettre à jour ou supprimer l'oeuvre, ainsi que pour lister les 10 derniers avis.
Certaines opérations nécessitent d'être admin.
*/

import { createError, defineEventHandler, readBody } from "h3";
import type { H3Event } from "h3";
import db from "../../utils/db";
import { requireAdmin } from "../../utils/auth";

interface WorkDetailsRow {
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

interface ReviewRow {
	id: number;
	user_id: number;
	username: string;
	rating: number | null;
	review: string | null;
	status: string;
	progress: number;
	updated_at: string;
}

// Transforme une ligne SQL en objet JS plus lisible côté front
function mapWork(row: WorkDetailsRow) {
   return {
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
   };
}


export default defineEventHandler(async (event: H3Event) => {
   const method = event.method;
   // L'id de l'oeuvre est injecté automatiquement par le nom du fichier ([id].ts)
   const id = Number(event.context.params?.id);

   if (!Number.isInteger(id)) {
	   throw createError({ statusCode: 400, statusMessage: "Invalid id." });
   }

   const work = await new Promise<WorkDetailsRow | undefined>((resolve) => {
	   db.get(
		   `SELECT
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
		   WHERE w.id = ?
		   GROUP BY w.id`,
		   [id],
		   (err, row: WorkDetailsRow) => resolve(err || !row ? undefined : row)
	   );
   });
   if (!work) {
	   throw createError({ statusCode: 404, statusMessage: "Work not found." });
   }

   // GET : détails de l'oeuvre + 10 derniers avis
   if (method === "GET") {
	   const reviews = await new Promise<ReviewRow[]>((resolve) => {
		   db.all(
			   `SELECT
				   le.id,
				   le.user_id,
				   u.username,
				   le.rating,
				   le.review,
				   le.status,
				   le.progress,
				   le.updated_at
			   FROM library_entries le
			   JOIN users u ON u.id = le.user_id
			   WHERE le.work_id = ?
			   ORDER BY le.updated_at DESC
			   LIMIT 10`,
			   [id],
			   (err, rows: ReviewRow[]) => resolve(err || !rows ? [] : rows)
		   );
	   });
	   const mappedReviews = reviews.map((row: ReviewRow) => ({
		   id: row.id,
		   userId: row.user_id,
		   username: row.username,
		   rating: row.rating,
		   review: row.review,
		   status: row.status,
		   progress: row.progress,
		   updatedAt: row.updated_at,
	   }));

	   return {
		   ...mapWork(work),
		   reviews: mappedReviews,
	   };
   }

   // PATCH/PUT : mise à jour de l'oeuvre (admin uniquement)
   if (method === "PATCH" || method === "PUT") {
	   await requireAdmin(event);
	   const body = await readBody<{
		   title?: string;
		   originalTitle?: string | null;
		   status?: string;
		   coverUrl?: string | null;
		   synopsis?: string | null;
	   }>(event);

	   const title = body?.title?.trim() || work.title;
	   const originalTitle =
		   body?.originalTitle === undefined ? work.original_title : body.originalTitle?.trim() || null;
	   const statusValue = body?.status ?? work.status;
	   if (!["ongoing", "completed", "hiatus"].includes(statusValue)) {
		   throw createError({ statusCode: 400, statusMessage: "Invalid status." });
	   }

	   const coverUrl = body?.coverUrl === undefined ? work.cover_url : body.coverUrl?.trim() || null;
	   const synopsis = body?.synopsis === undefined ? work.synopsis : body.synopsis?.trim() || null;

	   await new Promise<void>((resolve, reject) => {
		   db.run(
			   "UPDATE works SET title = ?, original_title = ?, status = ?, cover_url = ?, synopsis = ?, updated_at = datetime('now') WHERE id = ?",
			   [title, originalTitle, statusValue, coverUrl, synopsis, id],
			   (err) => err ? reject(err) : resolve()
		   );
	   });
	   
	   const updated = await new Promise<WorkDetailsRow | undefined>((resolve) => {
		   db.get(
			   `SELECT w.id, w.title, w.original_title, w.status, w.cover_url, w.synopsis, w.created_by, w.created_at, w.updated_at, AVG(le.rating) AS avg_rating, COUNT(le.rating) AS rating_count, COUNT(le.id) AS entry_count FROM works w LEFT JOIN library_entries le ON le.work_id = w.id WHERE w.id = ? GROUP BY w.id`,
			   [id],
			   (err, row: WorkDetailsRow) => resolve(err || !row ? undefined : row)
		   );
	   });
	   
	   const updatedReviews = await new Promise<ReviewRow[]>((resolve) => {
		   db.all(
			   `SELECT le.id, le.user_id, u.username, le.rating, le.review, le.status, le.progress, le.updated_at FROM library_entries le JOIN users u ON u.id = le.user_id WHERE le.work_id = ? ORDER BY le.updated_at DESC LIMIT 10`,
			   [id],
			   (err, rows: ReviewRow[]) => resolve(err || !rows ? [] : rows)
		   );
	   });
	   
	   return {
		   ...mapWork(updated!),
		   reviews: updatedReviews.map((row: ReviewRow) => ({
			   id: row.id,
			   userId: row.user_id,
			   username: row.username,
			   rating: row.rating,
			   review: row.review,
			   status: row.status,
			   progress: row.progress,
			   updatedAt: row.updated_at,
		   })),
	   };
   }

   // DELETE : suppression de l'oeuvre (admin uniquement)
   if (method === "DELETE") {
	   await requireAdmin(event);
	   await new Promise<void>((resolve, reject) => {
		   db.run("DELETE FROM works WHERE id = ?", [id], (err) => err ? reject(err) : resolve());
	   });
	   return { success: true };
   }

   throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
