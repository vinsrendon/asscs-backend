import pg from 'pg'
import Pool from 'pg-pool'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to PostgreSQL successfully!');
  release();
});

// USERS
export async function getUsers(){
    const result = await pool.query(`SELECT * FROM user_info ui JOIN users u ON u.uid=ui.uid `)
    return result.rows
}

export async function registerUser(email,pass){     
    const conn = await pool.connect()

    try {
        await conn.query('BEGIN');

        const userResult = await conn.query(`
            INSERT INTO users (uid, email, password, role, status, created_at) 
            VALUES (DEFAULT, $1, $2, $3, $4,DEFAULT) RETURNING uid`, 
            [email, pass, 'PENDING', 'PENDING'])

        const newUserId = userResult.rows[0].uid

        await conn.query(`
            INSERT INTO user_info (uid, fname, lname)
            VALUES ($1, $2, $3)`, 
            [newUserId, '', ''])

        await conn.query('COMMIT');
    } catch (err) {
        await conn.query('ROLLBACK');
        throw err
    } finally {
        conn.release()
    }
}

export default pool;