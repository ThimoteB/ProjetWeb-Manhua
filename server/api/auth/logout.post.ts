/*
logout.post.ts
Endpoint POST pour la déconnexion utilisateur.
Nécessite d'être authentifié, détruit la session en cours.
*/
import { defineEventHandler } from "h3";
import { destroySession, requireUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	destroySession(event, user.id);
	return { success: true };
});
