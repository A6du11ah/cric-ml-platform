const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const { execFile } = require('child_process');
require('dotenv').config();
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

const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());

// const cors = require('cors');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(path.join(__dirname, 'files')));


/////////////////////////////////////////////// PAGE REDIRECTIONS ///////////////////////////////////////////////////////////////////

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-pages', 'dummyProfile.html'));
});

app.get('/upload-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-pages', 'dummy-video-upload.html'));
});


app.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'join.html'));
});


/////////////////////////////////////////////// API ENDPOINTS  ///////////////////////////////////////////////////////////////////

app.post('/upload-video', upload.single('video'), (req, res) => {
    try {
        const { video_title, description, ispublic, creation_date, video_length, video_size, video_format, user_id, video_file_ref, video_file_name } = req.body;

        const scriptPath = path.join(__dirname, 'analyze_video.py');
        const videoPathInStorage = video_file_ref;
        const analytic_json_dummy = path.join(__dirname, 'files');
        const userVideoPath = user_id + " posted " + video_title;

        execFile('python', [scriptPath, userVideoPath, video_title, description, ispublic, creation_date, video_length, video_size, video_format, user_id, videoPathInStorage, analytic_json_dummy], async (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing Python script:', error);
                console.error('stderr:', stderr);
                return res.status(500).send({ message: 'Error analyzing video' });
            }

            let result, analytic_json, reJSON;
            try {
                result = JSON.parse(stdout);
                analytic_json = JSON.stringify(result);
                reJSON = JSON.parse(analytic_json);

                console.log(reJSON);

                const videoData = {
                    video_title,
                    description,
                    ispublic,
                    creation_date,
                    video_length,
                    video_size,
                    video_format,
                    user_id,
                    video_file_ref: videoPathInStorage,
                    analytic_json: analytic_json,
                    video_file_name
                };

                try {
                    const dbResult = await pool.query(
                        'INSERT INTO videos (video_title, description, ispublic, creation_date, video_length, video_size, video_format, user_id, video_file_ref, video_file_name, analytic_json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *', 
                        [video_title, description, ispublic, creation_date, video_length, video_size, video_format, user_id, video_file_ref, video_file_name, analytic_json]
                    );
                    return res.status(201).json(dbResult.rows[0]);
                } catch (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }
            } catch (parseError) {
                console.error('Error parsing JSON output from Python script:', parseError);
                console.error('stdout:', stdout);
                return res.status(500).send({ message: 'Error parsing analysis result' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error uploading file' });
    }
});




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

app.delete('/delete-video', async (req, res) => {
    const { filePath, videoId } = req.body;

    try {
        const deleteResult = await pool.query('DELETE FROM videos WHERE video_id = $1 RETURNING *', [videoId]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Video not found in the database' });
        }

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Error deleting video' });
    }
});


app.get('/videos/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query('SELECT * FROM videos WHERE user_id = $1', [userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});



// API endpoint to get environment variables
app.get('/api/env', async (req, res) => {
    const envVariables = {
        API_KEY: process.env.API_KEY,
        AUTH_DOMAIN: process.env.AUTH_DOMAIN,
        DATABASE_URL: process.env.DATABASE_URL,
        PROJECT_ID: process.env.PROJECT_ID,
        STORAGE_BUCKET: process.env.STORAGE_BUCKET,
        MESSAGING_SENDER_ID: process.env.MESSAGING_SENDER_ID,
        APP_ID: process.env.APP_ID,
        MEASUREMENT_ID: process.env.MEASUREMENT_ID
    };
    res.status(200).json(envVariables);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
