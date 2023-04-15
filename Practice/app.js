const express = require('express');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt_methods = require('./jwt_methods.js');


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
    host: 'localhost',
    user: 'root',
    password: 'Ckj:ysqg@hjkm215',
    database: 'node_auth',
});

// парсеры для данных
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// отправка статических данных
app.use('/login', express.static(__dirname + '/public'));

// обработчики get-запросов
app.get('/login', function (request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

app.get('/home', jwt_methods.decodeAccessToken, function (request, response) {
    console.log(request.cookies); //для отладки
    response.sendFile(__dirname + '/views/home.html');
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

start_server();
