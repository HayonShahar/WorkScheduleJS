const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

const secretKey = 'secretKey';

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'WorkSchedule',
    port: 3307
});

conn.connect((err) => {
    if (err) {
        console.error('Error: ' + err);
        return;
    }
    console.log('Connected to SQL');
});

app.post('/api/register', (req, res) => {
    const { id, name, lastName, phone, mail, password, jobPlace } = req.body;
    const date = new Date();
    console.log(id);
    console.log(name);
    console.log(lastName);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const currentDate = `${year}/${month}/${day}`

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).send('Error hashing password');
            return;
        }

        conn.query(`INSERT INTO adminUser (id, name, last_name, phone, mail, password, job_place, date, is_admin) VALUES ('${id}', '${name}', '${lastName}', '${phone}', '${mail}', '${hashedPassword}', '${jobPlace}', '${currentDate}', '1')`, (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                res.status(500).send('Error inserting user');
                return;
            }

            const token = jwt.sign({ mail: mail, jobPlace: jobPlace }, secretKey);
            res.send({ token, result });
        });
    });
});

app.get('/api/allUesres', (req, res) => {
    conn.query(`SELECT * FROM adminUser`, (err, result) => {
        if (err) {
            console.error('allUesresError: ' + err);
            return;
        }

    res.send(result);
    });
});

app.get('/api/login', (req, res) => {
    const { mail, jobPlace, password } = req.query;
    console.log(mail);
    console.log(jobPlace);
    console.log(password);

    conn.query(`SELECT * FROM adminUser WHERE mail = '${mail}' UNION SELECT * FROM employees WHERE job_place = '${jobPlace}'`, (err, result) => {
        if (err) {
            console.error('LoginError: ' + err);
            return;
        }

        if (result.length > 0) {
            const user = result[0];
            console.log(user.password);
            bcrypt.compare(password, user.password, (compareErr, compareResult) => {
                if (compareErr) {
                    console.log('111')
                    console.error('Error comparing passwords:', compareErr);
                    return;
                }

                const token = jwt.sign({ mail: mail, jobPlace: jobPlace }, secretKey);
                res.send({ user, token });
            });
        } else {
            res.status(404).send('No matching email found');
        }
    });
});


app.get('/api/mainTable', (req, res) => {
    const week = 'Week'+req.query.id;
    const token = req.query.token;
    
    const decodedToken = jwt.decode(token, { complete: true });

    const jobPlace = decodedToken.payload.jobPlace;

    conn.query(`SELECT * FROM morning_shift WHERE id = '${jobPlace+week}' UNION ALL SELECT * FROM evening_shift WHERE id = '${jobPlace+week}' UNION ALL SELECT * FROM supervisor_shift WHERE id = '${jobPlace+week}' UNION ALL SELECT * FROM night_shift WHERE id = '${jobPlace+week}';`, (err, result) => {
        if (err) {
            console.error('Error: ' + err);
            return;
        }
        console.log(result);
        res.send(result);
    });
});

app.post('/api/addEmployee', (req,res) => {
    const employee = req.body;
    console.log(employee.date);

    const decodedToken = jwt.decode(employee.token, { complete: true });

    const jobPlace = decodedToken.payload.jobPlace;

    conn.query(`INSERT INTO employees (id, name, last_name, phone, mail, password, job_place, date, is_admin) VALUES (${employee.id}, '${employee.name}', '${employee.last_name}', '${employee.phone}', '${employee.mail}', '${employee.password}', '${jobPlace}', '${employee.date}', ${0})`, (err, result) => {
        if (err) {
            console.error('Error: ' + err);
            return;
        }
        res.send(result);
    });
});

app.get('/api/getEmployees', (req, res) => {
    const token = req.query.token;

    const decodedToken = jwt.decode(token, { complete: true });

    const payload = decodedToken.payload;

    conn.query(`SELECT * FROM adminUser UNION SELECT * FROM employees`, (err, result) => {
        if (err) {
            console.error('Error: ' + err);
            return;
        }
    
        res.send({result, payload});
    });
});

app.post('/api/passworsValid', (req, res) => {
    const { mail, jobPlace, password } = req.body;
    console.log(mail, jobPlace, password);

    conn.query(`SELECT * FROM adminUser WHERE mail = '${mail}' UNION SELECT * FROM employees WHERE job_place = '${jobPlace}'`, (err, result) => {
        if (err) {
            console.error('LoginError:', err);
            res.status(500).send({ error: 'Database query error' });
            return;
        }

        if (result.length > 0) {
            const user = result[0];
            bcrypt.compare(password, user.password, (compareErr, compareResult) => {
                if (compareErr) {
                    console.error('Error comparing passwords:', compareErr);
                    res.status(500).send({ error: 'Password comparison error' });
                    return;
                }

                if (!compareResult) {
                    res.status(401).send({ error: 'Invalid password' });
                    return;
                } else {
                    const token = jwt.sign({ mail, jobPlace }, secretKey);
                    res.send({ user, token });
                }
            });
        } else {
            res.status(404).send({ error: 'No matching email found' });
        }
    });
});


app.delete('/api/deleteEmployee', (req,res) => {
    const {id} = req.body;

    conn.query(`DELETE FROM employees WHERE employees.id = ${id}`, (err, result) => {
        if (err) {
            console.error('Error: ' + err);
            return;
        }
        res.send(result);
    })
});

app.post('/api/saveMorningShift', (req, res) => {
    const token = req.body.token;
    const week = req.body.id;
    const sunday = req.body['sunday[]'];
    const monday = req.body['monday[]'];
    const tuesday = req.body['tuesday[]'];
    const wednesday = req.body['wednesday[]'];
    const thursday = req.body['thursday[]'];
    const friday = req.body['friday[]'];
    const saturday = req.body['saturday[]'];

    const decodedToken = jwt.decode(token, { complete: true });

    const jobPlace = decodedToken.payload.jobPlace;
    
    conn.query(`INSERT INTO morning_shift (id, sunday, monday, tuesday, wednesday, thursday, friday, saturday, job_place) VALUES ('${jobPlace+week}', '${sunday}', '${monday}', '${tuesday}', '${wednesday}', '${thursday}', '${friday}', '${saturday}', '${jobPlace}') ON DUPLICATE KEY UPDATE sunday = VALUES(sunday), monday = VALUES(monday), tuesday = VALUES(tuesday), wednesday = VALUES(wednesday), thursday = VALUES(thursday), friday = VALUES(friday), saturday = VALUES(saturday), job_place = VALUES(job_place)`, (err, result) => {
        if (err) {
            console.error('Error saving morning shift:', err);
            return;
        }
        res.send('Morning shift data saved successfully!');
    });
});

app.post('/api/saveEveningShift', (req, res) => {
    const token = req.body.token;
    const week = req.body.id;
    const sunday = req.body['sunday[]'];
    const monday = req.body['monday[]'];
    const tuesday = req.body['tuesday[]'];
    const wednesday = req.body['wednesday[]'];
    const thursday = req.body['thursday[]'];
    const friday = req.body['friday[]'];
    const saturday = req.body['saturday[]'];

    const decodedToken = jwt.decode(token, { complete: true });

    const jobPlace = decodedToken.payload.jobPlace;
    
    conn.query(`INSERT INTO evening_shift (id, sunday, monday, tuesday, wednesday, thursday, friday, saturday, job_place) VALUES ('${jobPlace+week}', '${sunday}', '${monday}', '${tuesday}', '${wednesday}', '${thursday}', '${friday}', '${saturday}', '${jobPlace}') ON DUPLICATE KEY UPDATE sunday = VALUES(sunday), monday = VALUES(monday), tuesday = VALUES(tuesday), wednesday = VALUES(wednesday), thursday = VALUES(thursday), friday = VALUES(friday), saturday = VALUES(saturday), job_place = VALUES(job_place)`, (err, result) => {
        if (err) {
            console.error('Error saving evening shift:', err);
            return;
        }
        res.send('Evening shift data saved successfully!');
    });
});

app.post('/api/saveNightShift', (req, res) => {
    const token = req.body.token;
    const week = req.body.id;
    const sunday = req.body['sunday[]'];
    const monday = req.body['monday[]'];
    const tuesday = req.body['tuesday[]'];
    const wednesday = req.body['wednesday[]'];
    const thursday = req.body['thursday[]'];
    const friday = req.body['friday[]'];
    const saturday = req.body['saturday[]'];

    const decodedToken = jwt.decode(token, { complete: true });

    const jobPlace = decodedToken.payload.jobPlace;
    
    conn.query(`INSERT INTO night_shift (id, sunday, monday, tuesday, wednesday, thursday, friday, saturday, job_place) VALUES ('${jobPlace+week}', '${sunday}', '${monday}', '${tuesday}', '${wednesday}', '${thursday}', '${friday}', '${saturday}', '${jobPlace}') ON DUPLICATE KEY UPDATE sunday = VALUES(sunday), monday = VALUES(monday), tuesday = VALUES(tuesday), wednesday = VALUES(wednesday), thursday = VALUES(thursday), friday = VALUES(friday), saturday = VALUES(saturday), job_place = VALUES(job_place)`, (err, result) => {
        if (err) {
            console.error('Error saving night shift:', err);
            return;
        }
        res.send('Night shift data saved successfully!');
    });
});

app.delete('/api/deleteNightShift', (req,res) => {
    const id = req.body.id;
    const token = req.body.token;

    console.log(id)
    console.log(token)

    const decodedToken = jwt.decode(token, { complete: true });

    const jobPlace = decodedToken.payload.jobPlace;

    conn.query(`DELETE FROM night_shift WHERE id = '${jobPlace+id}'`, (err, result) => {
        if (err) {
            console.error('ErrorDelete: ' + err);
            return;
        }
        res.send(result);
    })
});

app.post('/api/saveSupervisorShift', (req, res) => {
    const token = req.body.token;
    const week = req.body.id;
    const arrayData0 = req.body['arrayData[0][]'];
    const arrayData1 = req.body['arrayData[1][]'];
    const arrayData2 = req.body['arrayData[2][]'];
    const arrayData3 = req.body['arrayData[3][]'];
    const arrayData4 = req.body['arrayData[4][]'];
    const arrayData5 = req.body['arrayData[5][]'];
    const arrayData6 = req.body['arrayData[6][]'];

    const decodedToken = jwt.decode(token, { complete: true });

    const jobPlace = decodedToken.payload.jobPlace;
    
    conn.query(`INSERT INTO supervisor_shift (id, sunday, monday, tuesday, wednesday, thursday, friday, saturday, job_place) VALUES ('${jobPlace+week}', '${arrayData0}', '${arrayData1}', '${arrayData2}', '${arrayData3}', '${arrayData4}', '${arrayData5}', '${arrayData6}', '${jobPlace}') ON DUPLICATE KEY UPDATE sunday = VALUES(sunday), monday = VALUES(monday), tuesday = VALUES(tuesday), wednesday = VALUES(wednesday), thursday = VALUES(thursday), friday = VALUES(friday), saturday = VALUES(saturday), job_place = VALUES(job_place)`, (err, result) => {
        if (err) {
            console.error('Error saving supervisor shift:', err);
            return;
        }
        res.send('Supervisor shift data saved successfully!');
    });
});

app.post('/api/workAvailability', (req,res) => {
    const id = req.body.id;
    const name = req.body.name;
    const last_name = req.body.last_name;
    const job_place = req.body.job_place;
    const phone = req.body.phone;
    const mail = req.body.mail
    const available = req.body.available;
    const unavailable = req.body.unavailable;

    console.log(mail);

    conn.query(`INSERT INTO WorkAvailability (id, name, last_name, job_place, phone, mail, availability, unavailability) VALUES (${id}, '${name}', '${last_name}', '${job_place}', '${phone}', '${mail}', '${available}', '${unavailable}') 
    ON DUPLICATE KEY UPDATE name = '${name}', last_name = '${last_name}', job_place = '${job_place}', phone = '${phone}', mail = '${mail}', availability = '${available}', unavailability = '${unavailable}' `, (err, result) => {
        if (err) {
            console.error('Error: ' + err);
            return;
        }
        res.send(result);
    });
});

app.get('/api/getWorkAvailability', (req, res) => {

    conn.query(`SELECT * FROM WorkAvailability`, (err, result) => {
        if (err) {
            console.error('Error: ' + err);
            return;
        }
        res.send(result);
    })
});

app.post('/api/editProfile', (req,res) => {
    const {id, rank, name, lastName, phone, mail, password} = req.body;

    console.log(id, rank, name, lastName, mail, phone, password);

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).send('Error hashing password');
            return;
        }

        if(rank === 'Manager'){
            conn.query(`UPDATE adminUser SET name = '${name}', last_name = '${lastName}', phone = '${phone}', mail = '${mail}', password = '${hashedPassword}', is_admin = '1' WHERE id = '${id}';`, (err, result) => {
                if (err) {
                    console.error('Error: ' + err);
                    return;
                }
        
                res.send(result);
            });
        }else{
            conn.query(`UPDATE employees SET name = '${name}', last_name = '${lastName}', phone = '${phone}', mail = '${mail}', password = '${hashedPassword}', is_admin = '0' WHERE id = '${id}';`, (err, result) => {
                if (err) {
                    console.error('Error: ' + err);
                    return;
                }
        
                res.send(result);
            });
        }
    });
});


app.listen(8080, console.log('Listening to 8080'));


// const decodedToken = jwt.decode(token, { complete: true });

// console.log('Decoded Token:', decodedToken);