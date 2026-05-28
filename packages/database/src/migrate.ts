import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { Pool } from 'pg'

export async function runMigrations(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const migrationsDir = join(__dirname, 'migrations')
  const files = (await readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    )
    if (rows.length > 0) continue

    const sql = await readFile(join(migrationsDir, file), 'utf-8')
    await pool.query(sql)
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
    console.log(`Migration applied: ${file}`)
  }
}

// CLI entrypoint — only runs when invoked directly via tsx
const databaseUrl = process.env.DATABASE_URL
if (databaseUrl) {
  const pool = new Pool({ connectionString: databaseUrl })
  runMigrations(pool)
    .then(() => {
      console.log('All migrations complete.')
      return pool.end()
    })
    .catch((err: Error) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}
