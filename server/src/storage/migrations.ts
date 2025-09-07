import { Pool } from 'pg';

export class Migrations {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  private async initMigrationsTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        migration_datetime TEXT
      );
    `);

    const result = await this.pool.query('SELECT version FROM migrations');
    if (result.rows.length === 0) {
      const now = new Date().toISOString();
      await this.pool.query('INSERT INTO migrations (version, migration_datetime) VALUES (0, $1)', [now]);
    } else {
      // Add migration_datetime column if it doesn't exist
      await this.pool.query('ALTER TABLE migrations ADD COLUMN IF NOT EXISTS migration_datetime TEXT;');
    }
  }

  private async getCurrentVersion(): Promise<number> {
    const result = await this.pool.query('SELECT version FROM migrations');
    return result.rows[0]?.version || 0;
  }

  private async updateVersion(version: number): Promise<void> {
    const now = new Date().toISOString();
    await this.pool.query('UPDATE migrations SET version = $1, migration_datetime = $2', [version, now]);
  }

  private migrations = [
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        url TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        last_message_datetime TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );`,
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        text TEXT NOT NULL,
        role TEXT NOT NULL,
        date_time TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      );`,
      `CREATE TABLE IF NOT EXISTS frontend_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        input TEXT NOT NULL,
        role TEXT NOT NULL,
        date_time TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      );`,
    ],
    [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS url TEXT;',
      'ALTER TABLE messages DROP COLUMN IF EXISTS internal;',
    ],
    ['ALTER TABLE users RENAME COLUMN url TO hostname;'],
    [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT;',
      'ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TEXT;',
      'UPDATE users SET created_at = NOW()::TEXT WHERE created_at IS NULL;',
      'UPDATE conversations SET created_at = NOW()::TEXT WHERE created_at IS NULL;',
      "DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = 'undefined' OR user_id IS NULL);",
      "DELETE FROM frontend_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = 'undefined' OR user_id IS NULL);",
      "DELETE FROM conversations WHERE user_id = 'undefined' OR user_id IS NULL;",
      "DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = 'undefined');",
      "DELETE FROM frontend_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = 'undefined');",
      "DELETE FROM conversations WHERE user_id = 'undefined';",
      "DELETE FROM users WHERE id = 'undefined' OR id IS NULL;",
    ],
    [
      'DELETE FROM users WHERE id NOT IN (SELECT DISTINCT user_id FROM conversations WHERE user_id IS NOT NULL);',
    ],
    [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT;',
      'ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TEXT;',
      "UPDATE users SET created_at = NOW()::TEXT WHERE created_at IS NULL OR created_at = '';",
      "UPDATE conversations SET created_at = NOW()::TEXT WHERE created_at IS NULL OR created_at = '';",
    ],
  ];

  async runMigrations(): Promise<void> {
    await this.initMigrationsTable();
    const currentVersion = await this.getCurrentVersion();
    console.log(`Current Version ${currentVersion}.`);

    for (let i = currentVersion; i < this.migrations.length; i += 1) {
      const migration = this.migrations[i];
      for (let j = 0; j < migration.length; j += 1) {
        await this.pool.query(migration[j]);
      }
      await this.updateVersion(i + 1);
    }

    console.log(`Database is up to date (version ${this.migrations.length})`);
  }
}
