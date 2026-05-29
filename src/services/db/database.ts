import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

async function getDB(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:ai_novel_agent.db");
    await createTables(db);
    await runMigrations(db);
  }
  return db;
}

async function createTables(database: Database): Promise<void> {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      chapter_order INTEGER NOT NULL,
      summary TEXT DEFAULT '',
      word_goal INTEGER DEFAULT 5000,
      status TEXT DEFAULT 'draft',
      notes TEXT DEFAULT '',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      traits TEXT DEFAULT '[]',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS world_settings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS _schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
}

interface Migration {
  version: number;
  sql: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: [
      `CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        traits TEXT DEFAULT '[]',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,
    ],
  },
  {
    version: 2,
    sql: [
      `CREATE TABLE IF NOT EXISTS world_settings (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT '',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )`,
    ],
  },
  {
    version: 3,
    sql: [],
  },
];

export async function checkSchemaVersion(database: Database): Promise<number> {
  try {
    const rows = await database.select<{ version: number }[]>(
      "SELECT COALESCE(MAX(version), 0) as version FROM _schema_version",
    );
    return rows[0]?.version ?? 0;
  } catch {
    return 0;
  }
}

async function runMigrations(database: Database): Promise<void> {
  const currentVersion = await checkSchemaVersion(database);
  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);
  pending.sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    if (migration.version === 3) {
      // v3: Add new columns to chapters (PRAGMA-based, backward compat)
      const existing = await database.select<{ name: string }[]>(
        "PRAGMA table_info(chapters)",
      );
      if (existing.length > 0) {
        const columns = new Set(existing.map((row) => row.name));
        if (!columns.has("summary")) {
          await database.execute("ALTER TABLE chapters ADD COLUMN summary TEXT DEFAULT ''");
        }
        if (!columns.has("word_goal")) {
          await database.execute("ALTER TABLE chapters ADD COLUMN word_goal INTEGER DEFAULT 5000");
        }
        if (!columns.has("status")) {
          await database.execute("ALTER TABLE chapters ADD COLUMN status TEXT DEFAULT 'draft'");
        }
        if (!columns.has("notes")) {
          await database.execute("ALTER TABLE chapters ADD COLUMN notes TEXT DEFAULT ''");
        }
      }
    } else {
      for (const sql of migration.sql) {
        await database.execute(sql);
      }
    }
    await database.execute(
      "INSERT INTO _schema_version (version, applied_at) VALUES ($1, datetime('now'))",
      [migration.version],
    );
  }
}

export async function execQuery(sql: string, params?: unknown[]): Promise<void> {
  const database = await getDB();
  await database.execute(sql, params);
}

export async function runQuery(sql: string, params?: unknown[]): Promise<void> {
  const database = await getDB();
  await database.execute(sql, params);
}

export async function getRows<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const database = await getDB();
  return database.select<T[]>(sql, params);
}