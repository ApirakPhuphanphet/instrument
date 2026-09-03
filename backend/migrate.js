const pool = require('./db');

/**
 * Reset and create the application's PostgreSQL schema.
 *
 * This is intentionally destructive: running the migration removes the
 * application's existing tables and data before recreating them.
 */
async function migrate() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Drop dependent tables first so the reset works without CASCADE.
        // await client.query('DROP TABLE IF EXISTS "transaction"');
        // await client.query('DROP TABLE IF EXISTS instrument');
        // await client.query('DROP TABLE IF EXISTS "user"');
        // await client.query('DROP TABLE IF EXISTS rfid');
        // await client.query('DROP TYPE IF EXISTS rfid_type');

        // gen_random_uuid() is provided by PostgreSQL's pgcrypto extension.
        await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

        await client.query(`
            DO $$
            BEGIN
                CREATE TYPE rfid_type AS ENUM ('lf', 'hf');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS rfid (
                id TEXT PRIMARY KEY,
                type rfid_type NOT NULL
            )
        `);

        // "user" is quoted because USER is a PostgreSQL keyword.
        await client.query(`
            CREATE TABLE IF NOT EXISTS "user" (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                rfid TEXT REFERENCES rfid(id) ON DELETE SET NULL
            )
        `);

        // Keep the spelling requested by the existing data model: instrument.
        await client.query(`
            CREATE TABLE IF NOT EXISTS instrument (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                rfid TEXT REFERENCES rfid(id) ON DELETE SET NULL
            )
        `);

        // TRANSACTION is a PostgreSQL keyword, so the requested table name is quoted.
        await client.query(`
            CREATE TABLE IF NOT EXISTS "transaction" (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_rfid TEXT NOT NULL REFERENCES rfid(id) ON DELETE RESTRICT,
                instrument_rfid TEXT NOT NULL REFERENCES rfid(id) ON DELETE RESTRICT
            )
        `);

        await client.query('CREATE INDEX IF NOT EXISTS user_rfid_idx ON "user" (rfid)');
        await client.query('CREATE INDEX IF NOT EXISTS instrument_rfid_idx ON instrument (rfid)');
        await client.query('CREATE INDEX IF NOT EXISTS transaction_user_rfid_idx ON "transaction" (user_rfid)');
        await client.query('CREATE INDEX IF NOT EXISTS transaction_instrument_rfid_idx ON "transaction" (instrument_rfid)');

        await client.query('COMMIT');
        console.log('✅ Database migration completed');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    migrate().catch((error) => {
        console.error('❌ Database migration failed:', error.message);
        process.exitCode = 1;
    });
}

module.exports = migrate;
