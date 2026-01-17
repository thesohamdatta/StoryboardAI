const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
    connectionString: 'postgresql://storyboard:storyboard_dev@localhost:5432/storyboard_db'
});

async function seed() {
    await client.connect();

    try {
        // Check if user exists
        const check = await client.query("SELECT * FROM users WHERE email = 'demo@example.com'");
        if (check.rows.length > 0) {
            console.log('Demo user already exists');
            return;
        }

        const hash = await bcrypt.hash('password123', 10);
        const res = await client.query(
            `INSERT INTO users (id, email, name, role, password_hash) 
       VALUES ('550e8400-e29b-41d4-a716-446655440001', 'demo@example.com', 'Demo User', 'editor', $1) 
       RETURNING email`,
            [hash]
        );
        console.log('Created demo user:', res.rows[0].email);
        console.log('Password: password123');
    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        await client.end();
    }
}

seed();
