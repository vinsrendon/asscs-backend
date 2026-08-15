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
    const result = await pool.query(`SELECT * FROM users_info ui JOIN users u ON u.uid=ui.uid `)
    return result.rows
}

export async function registerUser(fname,mname,lname,course,role,phone,email,password){     
    const conn = await pool.connect()

    try {
        await conn.query('BEGIN');

        const userResult = await conn.query(`
            INSERT INTO users(email, password, role, status) 
            VALUES ($1, $2, $3, $4) RETURNING uid`, 
            [email, password, role, 'PENDING'])

        const newUserId = userResult.rows[0].uid

        await conn.query(`
            INSERT INTO users_info(uid, fname, mname, lname, course, phone)
            VALUES ($1, $2, $3, $4, $5, $6)`, 
            [newUserId, fname,mname,lname,course,phone])

        await conn.query('COMMIT');
    } catch (err) {
        await conn.query('ROLLBACK');
        throw err        
    } finally {
        conn.release()
    }
}

export async function loginUser(user){    
    const result = await pool.query('SELECT * from public.users WHERE email = $1',[user])
    return result.rows
}

export async function getUserById(uid){    
    const result = await pool.query(`SELECT * FROM users_info ui JOIN users u ON u.uid=ui.uid WHERE u.uid = $1`,[uid])    
    return result.rows
}

export default pool;