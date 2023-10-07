const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pg = require('pg');
const PORT =  process.env.PORT | 3000;

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const Pool = new pg.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: 'NouNou23',
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
});

Pool.connect();

