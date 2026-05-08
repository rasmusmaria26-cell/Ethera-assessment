import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

console.log("Testing connection to:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const client = await pool.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Time from DB:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("Connection failed:", err.message);
    if (err.cause) console.error("Cause:", err.cause.message);
  } finally {
    await pool.end();
  }
}

test();
