const express = require('express');
const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pg = require('pg');
const bcrypt = require('bcrypt');
const PORT =  process.env.PORT | 8081;


//env variables
const DB_DATABASE = process.env.DB_DATABASE;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// connect to database

const Pool = new pg.Pool({
    host: DB_HOST,
    user: DB_USER,
    password: 'NouNou23',
    port: DB_PORT,
    database: DB_DATABASE
});

Pool.connect()


// const query = {
//     text: 'INSERT INTO users(id, name, email, password) VALUES($1, $2, $3, $4)',
//     values: [1, 'brianc', 'brian.m.carlson@gmail.com', 'test'],
// }

// Pool.query(query, (err, res) => {
//     if (err) {
//         console.log(err.stack)
//     } else {
//         console.log('done')
//     }
// })


// Routes

app.post('/api/register', (req, res) => {

    bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err });

        const todayDate = new Date().toISOString().slice(0, 10);
        const values = [todayDate , req.body.name, req.body.email, hash];

        const query = {
            text: 'INSERT INTO users(last_login, name, email, password) VALUES($1, $2, $3, $4)',
            values: values
        };

        Pool.query(query, (err, result) => {
            if (err) return res.status(500).json({ Error: err });
            return res.status(200).json({ Success: 'Success' });
        })
    });

    

    
});

