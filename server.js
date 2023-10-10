const express = require('express');
const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pg = require('pg');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const PORT = 8081;


//env variables
const DB_DATABASE = process.env.DATABASE;
const DB_USER = process.env.USER;
const DB_PASSWORD = process.env.PASS;
const DB_HOST = process.env.HOST;
const DB_PORT = process.env.PORT;


const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));
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


const Client = new pg.Client({
    host: DB_HOST,
    user: DB_USER,
    password: 'NouNou23',
    port: DB_PORT,
    database: DB_DATABASE
});

Client.connect()

// const todayDate = new Date().toISOString().slice(0, 10);
// const query = {
//     text: 'INSERT INTO users(last_login, name, email, password) VALUES($1, $2, $3, $4)',
//     values: [todayDate, 'brianc', 'brian.m.carlson@gmail.com', 'test'],
// }

// Pool.query(query, (err, res) => {
//     if (err) {
//         console.log(err.stack)
//     } else {
//         console.log('done')
//     }
// })


const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.json({ Error: 'Access Denied' });
    jwt.verify(token, process.env.JWT_KEY, (err, result) => {
        if (err) return res.json({ Error: 'token is not okey' });
        req.name = result.name;
        next();
    });
};


// Routes

//home route

app.get('/', verifyUser, (req, res) => {
    return res.json({ Status: 'Success', name: req.name });
});

app.get('/login', verifyUser, (req, res) => {
    return res.json({ Status: 'Success', name: req.name });
})

app.get('/register', verifyUser, (req, res) => {
    return res.json({ Status: 'Success', name: req.name });
})


//register route

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
            return res.status(200).json({ Status: 'Success' });
        })
    });

});

//login route

app.post('/api/login', (req, res) => {
    //querry database for email
    const querry = {
        text: 'SELECT * FROM users WHERE email = $1',
        values: [req.body.email]
    };

    //querring database and sending sql request
    Pool.query(querry, (err, result) => {
        if (err) return res.status(500).json({ Error: err }); //if error return error
        if (result.rows.length < 1) return res.json({ Error: 'No account found' }); //if no account found return error

        bcrypt.compare(req.body.password.toString(), result.rows[0].password, (err, response) => {
            if (err) return res.status(401).json({ Error: 'Password compare error' }); //if error return error for compare

            if (response) {
                const name = result.rows[0].name;
                const email = result.rows[0].email;
                const token = jwt.sign({ name, email }, process.env.JWT_KEY, { expiresIn: '1d' }); //create token for cookie
                res.cookie('token', token); //set cookie
                const date = new Date().toISOString().slice(0, 10);
                values = [date, email];
                const query = {
                    text: 'UPDATE users SET last_login = $1 WHERE email = $2',
                    values: values
                };
                Pool.query(query, (err, result) => {
                    if (err) return res.status(500).json({ Error: err });
                });
                return res.status(200).json({ Status: 'Success' }); //if password match return success
            }else {
                return res.json({ Error: 'Password Not match' });
            }
        });
    });
});

// logout route

app.get('/api/logout', (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({ Status: 'Success' });
})

// delete account route

app.get('/api/delete', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ Error: 'Access Denied' });
    jwt.verify(token, process.env.JWT_KEY, (err, result) => {
        if (err) return res.json({ Error: 'token is not okey' });
        req.email = result.email;
    });

    const query = {
        text: 'DELETE FROM users WHERE email = $1',
        values: [req.email]
    }
    Pool.query(query, (err, result) => {
        if (err) return res.status(500).json({ Error: err });
    });

    res.clearCookie('token');
    return res.status(200).json({ Status: 'Success' });
})


// forgot password route

app.post('/forgot-password', (req, res) => {
    const {email} = req.body;
    const query = {
        text: 'SELECT * FROM users WHERE email = $1',
        values: [email]
    }
    Pool.query(query, (err, result) => {
        console.log(result.length);
        if(err) {
            return res.send({Status: "User not existed"})
        }
        if (result.rows.length < 1) {
            return res.send({Status: "User doesn't exist"});
        }
        const token = jwt.sign({id: email}, process.env.JWT_KEY, {expiresIn: "1d"})
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: 'noureddine.api@gmail.com',
              pass: 'jdmgfgjsanlphqlv'
            }
          });
          
          var mailOptions = {
            from: 'noureddine.api@gmail.com',
            to: email,
            subject: 'Reset Password Link',
            text: `http://localhost:3000/reset_password/${email}/${token}`
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              return res.send({Status: "Success"})
            }
          });
    })
})

//reset password route

app.post('/reset-password/:email/:token', (req, res) => {
    const {email, token} = req.params
    const {password} = req.body

    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if(err) {
            return res.json({Status: "Error with token"})
        } else {
            bcrypt.hash(password, 10)
            .then(hash => {
                const query = {
                    text: "UPDATE users SET password = $1  WHERE email = $2",
                    values: [hash, email]
                };

                Pool.query(query, (err, result) => {
                    if(err) {
                        return res.send({Status: "User not existed"})
                    }
                    return res.send({Status: "Success"});
                })

            })
            .catch(err => res.send({Status: err}))
        }
    })
})