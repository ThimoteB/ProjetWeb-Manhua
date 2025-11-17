/*
session.get.ts
Endpoint GET pour récupérer l'utilisateur courant selon la session.
Renvoie l'objet user si connecté, sinon null.
*/
import { defineEventHandler } from "h3";
import { getCurrentUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
	const user = await getCurrentUser(event);
	return { user };
});
