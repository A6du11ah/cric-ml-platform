const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// const cors = require('cors');

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

app.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'join.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
  