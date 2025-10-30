import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import dotenv from "dotenv";

const dbPath = join(process.cwd(), "server", "data", "manhua.sqlite");
const dir = dirname(dbPath);

if (!existsSync(dir)) {
	mkdirSync(dir, { recursive: true });
}

dotenv.config();

const db = new Database(dbPath);
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

const userColumns = (db.prepare("PRAGMA table_info(users)").all() as Array<{
	name: string;
}>).map((column) => column.name);

if (!userColumns.includes("password_hash")) {
	db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
}

if (!userColumns.includes("session_token")) {
	db.exec("ALTER TABLE users ADD COLUMN session_token TEXT");
}

if (!userColumns.includes("session_expires_at")) {
	db.exec("ALTER TABLE users ADD COLUMN session_expires_at TEXT");
}

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
		"INSERT INTO works (title, original_title, status, synopsis, created_by) VALUES (?, ?, ?, ?, ?)"
	);

	insertWork.run(
		"Solo Leveling",
		"나 혼자만 레벨업",
		"completed",
		"Sung Jin-Woo, un chasseur faible, obtient le pouvoir de devenir plus fort sans limites.",
		adminId
	);

	insertWork.run(
		"Omniscient Reader",
		"전지적 독자 시점",
		"ongoing",
		"Kim Dok-Ja connaît un roman par cœur. Lorsque l'histoire devient réalité, il doit survivre.",
		adminId
	);
}


const clearExpiredSessionsStmt = db.prepare(
	"UPDATE users SET session_token = NULL, session_expires_at = NULL WHERE session_expires_at IS NOT NULL AND session_expires_at < datetime('now')"
);

clearExpiredSessionsStmt.run();

export default db;
