const express = require('express');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt_methods = require('./jwt_methods.js');
const multer = require('multer');
const fs = require('fs');
const md5 = require('md5');
const { request } = require('http');
const { log } = require('console');

const port = 8080;
const app = express(); // объект приложения

// запуск сервера
function start_server() {
    try {
        app.listen(port, () => {
            console.log(`server started at  http://localhost:${port}/login`);
            console.log(`home page:  http://localhost:${port}/home`);
        });
    } catch (error) {
        console.log(error);
    }
}

// данные для подключения к mysql (удалённый сервер на db4free.net)
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
app.use('/home', express.static(__dirname + '/file_storage'));

// обработчики get-запросов
app.get('/login', (request, response) => {
    response.sendFile(__dirname + '/views/index.html');
});

app.get('/home', jwt_methods.decodeAccessToken, (request, response) => {
    try {
        response.cookie('login', request.user.login);
        response.sendFile(__dirname + '/views/home.html');
    } catch (error) {
        console.log(error);
    }
});

// обработка запроса на получение списка файлов
app.get('/get-filenames', jwt_methods.decodeAccessToken, (request, response) => {
    try {
        const filenames = fs.readdirSync(__dirname + '/file_storage/uploads')
            .concat(fs.readdirSync(__dirname + '/file_storage/processed'));
        response.send(JSON.stringify(filenames));
    } catch (error) {
        console.log(error);
    }
});

// обработка post-запроса на авторизацию
app.post('/login', (request, response) => {
    try {
        const login = request.body.login;
        const hash = request.body.password;

        // проверка пользователя по бд
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
                    date =
                        new Date().toISOString().slice(0, -14) +
                        ' ' +
                        new Date().toLocaleTimeString();

                    // фиксируем время успешной авторизации в бд
                    pool.query(
                        'INSERT INTO auth_statistics (id, login, auth_time) VALUES (?, ?, ?);',
                        [results[0].id, results[0].login, date],
                        // callback для отладки
                        function (error, results, fields) {
                            if (error) {
                                console.log('Ошибка записи в auth_statistics');
                                console.log(error);
                            }
                            console.log('Попытка авторизации зафиксирована');
                        }
                    );

                    // генерация токена
                    const token = jwt_methods.generateAccessToken(
                        results[0].id,
                        results[0].login,
                        results[0].user_group
                    );

                    // запись токена в куки и отправка сообщения об успешной авторизации
                    console.log('Авторизация пройдена');
                    response.cookie('token', `Bearer ${token}`, {
                        httpOnly: true
                    });
                    return response.json({
                        message: 'success_auth',
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

// log-out
app.post('/log-out', (request, response) => {
    response.clearCookie('token');
    response.clearCookie('login');
    response.redirect('/login');
});

// настройка параметров сохранения файлов
const storageConfig = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, './file_storage/uploads');
    },
    filename: (request, file, callback) => {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf8'
        );
        callback(
            null,
            new Date().toLocaleDateString() +
                ' ' +
                new Date().toLocaleTimeString().replace(/:/g, '.') +
                ' ' +
                file.originalname
        );
    },
});

app.use(multer({ storage: storageConfig }).single('filedata'));

// проверка загрузки файлов
app.post('/upload', jwt_methods.decodeAccessToken, (request, response) => {
    let filedata = request.file;
    if (!filedata) response.json({ message: 'Ошибка при загрузке файла!' });
    else {
        //фиксируем загрузку файла в бд
        date =
            new Date().toISOString().slice(0, -14) +
            ' ' +
            new Date().toLocaleTimeString();

        pool.query(
            'INSERT INTO uploaded_files (user_id, original_name, loading_time, hash) VALUES (?, ?, ?, ?);',
            [
                request.user.id,
                filedata.originalname,
                date,
                md5(fs.readFileSync(filedata.path, 'utf-8')),
            ],
            // callback для отладки
            function (error, results, fields) {
                if (error) {
                    console.log('Ошибка записи в uploaded_files');
                    console.log(error);
                }
                console.log('Загрузка файла зафиксирована');
            }
        );
        response.json({ message: 'Файл загружен' });
    }
});

//фиксируем скачивание файла в бд
app.post('/download', jwt_methods.decodeAccessToken, (request, response) => {
    const filename= request.body.filename
    date = new Date().toISOString().slice(0, -14) +
        ' ' +
        new Date().toLocaleTimeString();

       pool.query(
        'INSERT INTO downloaded_files (user_id, filename, download_time, is_processed) VALUES (?, ?, ?, ?);',
        [request.user.id, filename, date, false],
        // callback для отладки
        function (error, results, fields) {      
            if (error) {
                console.log('Ошибка записи в downloaded_files');
                console.log(error);
            }
            console.log('Скачивание файла зафиксировано');
        }
    );
});

app.post('/processing', jwt_methods.decodeAccessToken, (request, response) => {
    console.log(request.body.filename)
    response.sendStatus(200)
})


// обработка запроса на получение статистики (пока без статистики)
app.get('/get-statistics', jwt_methods.decodeAccessToken, (request, response) => {
    try {
        if (request.user.user_group === 'A') {
            const message = 'Статистика для группы A'
            response.send(JSON.stringify(message));
        }
        else {
            const message = 'Статистика для группы B'
            response.send(JSON.stringify(message));
        }
    } catch (error) {
        console.log(error);
    }
});

start_server();
