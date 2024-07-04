const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');


const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    user: 'user',
    host: 'localhost',
    database: 'cric-ml-database',
    password: '1234',
    port: '5432',
});

app.use(bodyParser.json());

// const cors = require('cors');

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-pages', 'dummyProfile.html'));
});

app.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'join.html'));
});


//API points 

app.post('/api/createUser', async (req, res) => {
    const { email, user_name, picture_ref, user_role, provider } = req.body;
    const member_since = new Date(); 
    const is_banned = false; 

    try {
        // Check if user already exists
        const userCheckResult = await pool.query('SELECT email FROM users WHERE email = $1', [email]);

        if (userCheckResult.rows.length > 0) {
            // User already exists
            res.status(200).json({ message: 'User already exists' });
        } else {
            // Insert new user
            const result = await pool.query(
                'INSERT INTO users (email, user_name, picture_ref, is_banned, user_role, provider, member_since) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [email, user_name, picture_ref, is_banned, user_role, provider, member_since]
            );
            res.status(201).json(result.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/users/getUser', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/users/updatePicture', async (req, res) => {
    const { email, picture_ref } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET picture_ref = $1 WHERE email = $2 RETURNING *',
            [picture_ref, email]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/users/updateName', async (req, res) => {
    const { email, user_name } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET user_name = $1 WHERE email = $2 RETURNING *',
            [user_name, email]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
  