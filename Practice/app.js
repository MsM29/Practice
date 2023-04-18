const express = require('express');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt_methods = require('./jwt_methods.js');
const multer  = require("multer");
const fs = require("fs");

const port = 8080;
const app = express(); // объект приложения

// запуск сервера
function start_server() {
    try {
        app.listen(port, () =>
            console.log(`server started at  http://localhost:${port}/login`)
        );
    } catch (error) {
        console.log(error);
    }
}

// данные для подключения к mysql
const pool = mysql.createPool({
    host: 'db4free.net',
    user: 'jar_jar_binks',
    password: 'sith_lord',
    database: 'node_auth',
});

// парсеры для данных
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// отправка статических данных
app.use('/login', express.static(__dirname + '/public'));
app.use('/home', express.static(__dirname + '/public'));

// обработчики get-запросов
app.get('/login', function (request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

app.get('/home', jwt_methods.decodeAccessToken, function (request, response) {
    try {

        if(request.headers['get-file-names']=='true')
        {
            const filenames = fs.readdirSync(__dirname+'/uploads');
            response.send(JSON.stringify(filenames))
            }
        else{
            response.sendFile(__dirname + '/views/home.html');
        }
    }
    catch (error) {
        console.log(error)
    }
});

// обработка post-запроса на авторизацию
app.post('/login', function (request, response) {
    try {
        const login = request.body.login;
        const hash = request.body.password;

        pool.query(
            'SELECT * FROM accounts WHERE login = ?',
            login,
            function (error, results, fields) {
                if (error) throw error;

                // если results не содержит данных
                if (results.length < 1) {
                    return response.json({ message: 'user_not_found' });
                }

                // если пользователь найден и хеши паролей совпали
                if (results[0].hash == hash) {
                    const token = jwt_methods.generateAccessToken(
                        results[0].id,
                        results[0].login
                    );
                    response.cookie('token', `Bearer ${token}`);
                    return response.json({
                        message: 'success_auth',
                        token: token,
                    });
                } else {
                    return response.json({ message: 'wrong_password' });
                }
            }
        );
    } catch (error) {
        console.log(error);
    }
});

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "uploads");
    },
    filename: (req, file, cb) =>{
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
        cb(null, new Date().toDateString()+'-'+new Date().getHours().toString()+'.'+new Date().getMinutes().toString()+'.'+new Date().getSeconds().toString()+'.'+new Date().getMilliseconds().toString()+'-'+file.originalname);
        }
});

app.use(multer({storage:storageConfig}).single("filedata"));
app.post("/upload", function (req, res) {
   
    let filedata = req.file;
    if(!filedata)
        res.send("Ошибка при загрузке файла");
    else
        res.send("Файл загружен");
});

start_server();
