/*
db.ts
Ce fichier gère l'initialisation et l'accès à la base de données SQLite du projet.
Il crée les tables (users, works, library_entries), insère aussi un jeu de données de base.
et exporte l'instance de la base pour les autres modules backend.
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import dotenv from "dotenv";

const dbPath = join(process.cwd(), "server", "data", "manhua.sqlite");
// Chemin vers la base SQLite locale
const dir = dirname(dbPath);

if (!existsSync(dir)) {
	// Crée le dossier data si besoin
	mkdirSync(dir, { recursive: true });
}

dotenv.config();

const db = new Database(dbPath);
// Active le mode WAL pour la robustesse et les clés étrangères
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL UNIQUE,
	email TEXT UNIQUE,
	is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
	password_hash TEXT,
	session_token TEXT,
	session_expires_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS works (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	original_title TEXT,
	status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
	cover_url TEXT,
	synopsis TEXT,
	created_by INTEGER,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS library_entries (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	work_id INTEGER NOT NULL,
	status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'reading', 'completed', 'on_hold', 'dropped')),
	progress INTEGER NOT NULL DEFAULT 0,
	rating INTEGER CHECK (rating BETWEEN 1 AND 10),
	review TEXT,
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
	UNIQUE(user_id, work_id)
);
`);

const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users").get() as
	| { count: number }
	| undefined;
if (!userCountRow || userCountRow.count === 0) {
	const insertUser = db.prepare(
		"INSERT INTO users (username, email, is_admin, password_hash) VALUES (?, ?, ?, ?)"
	);

	const defaultAdminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10);
	const defaultReaderPassword = bcrypt.hashSync(process.env.READER_PASSWORD || "reader123", 10);

	const adminId = insertUser.run("admin", "admin@example.com", 1, defaultAdminPassword)
		.lastInsertRowid as number;
	insertUser.run("reader", "reader@example.com", 0, defaultReaderPassword);

	const insertWork = db.prepare(
		"INSERT INTO works (title, original_title, status, cover_url, synopsis, created_by) VALUES (?, ?, ?, ?, ?, ?)"
	);

	insertWork.run(
		"Solo Leveling",
		"na honjaman level up",
		"completed",
		"https://m.media-amazon.com/images/I/81jS951SgDL._AC_UF1000,1000_QL80_.jpg",
		"Sung Jin-Woo, un chasseur faible, obtient le pouvoir de devenir plus fort sans limites.",
		adminId
	);

	insertWork.run(
		"Omniscient Reader",
		"jeonjijeok dokja sijom",
		"ongoing",
		"https://cdn.myanimelist.net/images/manga/2/238873.jpg",
		"Kim Dok-Ja connaît un roman par cœur. Lorsque l'histoire devient réalité, il doit survivre.",
		adminId
	);

	insertWork.run(
		"Bungou Stray Dogs",
		"bungou stray dogs",
		"ongoing",
		"https://cdn.myanimelist.net/images/anime/3/79409.jpg",
		"Atsushi Nakajima rejoint une agence de détectives aux pouvoirs surnaturels pour combattre la mafia.",
		adminId
	);
	insertWork.run(
		"The Seven Deadly Sins",
		"nanatsu no taizai",
		"completed",
		"https://cdn.myanimelist.net/images/anime/8/65409.jpg",
		"Les légendaires chevaliers déchus luttent pour sauver le royaume de Liones de la tyrannie.",
		adminId
	);
	insertWork.run(
		"Demonic Emperor",
		"mo huang da di",
		"ongoing",
		"https://i.redd.it/73q2n8iikoaa1.jpg",
		"Après avoir été trahi, un empereur démoniaque renaît dans le corps d'un serviteur et cherche vengeance.",
		adminId
	);
	insertWork.run(
		"Nano Machine",
		"nano machine",
		"ongoing",
		"https://cdn.myanimelist.net/images/manga/1/312579.jpg",
		"Un orphelin reçoit une nanomachine du futur, bouleversant sa destinée dans un monde d'arts martiaux.",
		adminId
	);
	insertWork.run(
		"Shadow Slave",
		"shadow slave",
		"ongoing",
		"https://m.media-amazon.com/images/I/515fsT6ty4L._UF1000,1000_QL80_.jpg",
		"Sunny, esclave dans un monde cauchemardesque, lutte pour survivre et découvrir la vérité sur son passé.",
		adminId
	);
	insertWork.run(
		"Tower of God",
		"kami no tou",
		"ongoing",
		"https://cdn.myanimelist.net/images/manga/2/223694.jpg",
		"Bam gravit la mystérieuse Tour pour retrouver son amie Rachel, affrontant des épreuves mortelles.",
		adminId
	);
	insertWork.run(
		"Blue Lock",
		"blue lock",
		"ongoing",
		"https://cdn.myanimelist.net/images/anime/1258/126929.jpg",
		"Des jeunes footballeurs s'affrontent dans un centre d'entraînement impitoyable pour devenir le meilleur attaquant du Japon.",
		adminId
	);
	insertWork.run(
		"Jujutsu Kaisen",
		"jujutsu kaisen",
		"ongoing",
		"https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
		"Yuji Itadori rejoint une école d'exorcistes pour combattre des fléaux surnaturels et sauver ses amis.",
		adminId
	);
	insertWork.run(
		"Lookism",
		"lookism",
		"ongoing",
		"https://cdn.myanimelist.net/images/manga/2/208866.jpg",
		"Park Hyung Suk découvre qu'il peut changer d'apparence chaque matin, explorant les inégalités sociales et la violence scolaire.",
		adminId
	);
	insertWork.run(
		"The Beginning After the End",
		"the beginning after the end",
		"ongoing",
		"https://a.storyblok.com/f/178900/1061x1500/b26eaae18f/the-beginning-after-the-end-key-visual.jpg/m/filters:quality(95)format(webp)",
		"Un roi puissant se réincarne dans un nouveau monde magique, cherchant une seconde chance et la paix.",
		adminId
	);
}


const clearExpiredSessionsStmt = db.prepare(
	"UPDATE users SET session_token = NULL, session_expires_at = NULL WHERE session_expires_at IS NOT NULL AND session_expires_at < datetime('now')"
);

clearExpiredSessionsStmt.run();

export default db;
