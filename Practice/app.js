const express = require('express');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt_methods = require('./jwt_methods.js');
const multer = require('multer');
const fs = require('fs');
const md5 = require('md5');

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
app.use('/home', express.static(__dirname + '/uploads'));

// обработчики get-запросов
app.get('/login', function (request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

app.get('/home', jwt_methods.decodeAccessToken, function (request, response) {
    try {
        if (request.headers['get-file-names'] == 'true') {
            const filenames = fs.readdirSync(__dirname + '/uploads');
            response.send(JSON.stringify(filenames));
        } else {
            response.cookie('login', request.user.login);
            response.sendFile(__dirname + '/views/home.html');
        }
    } catch (error) {
        console.log(error);
    }
});

// обработка post-запроса на авторизацию
app.post('/login', function (request, response) {
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
                    response.cookie('token', `Bearer ${token}`);
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
app.post('/log-out', function (request, response) {
    response.clearCookie('token');
    response.clearCookie('login');
    response.redirect('/login');
});

// настройка параметров сохранения файлов
const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf8'
        );
        cb(
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
app.post('/upload', jwt_methods.decodeAccessToken, function (req, res) {
    let filedata = req.file;
    if (!filedata) res.send('Ошибка при загрузке файла');
    else 
    {
        //фиксируем загрузку файла в бд
        pool.query(
            'INSERT INTO uploaded_files (user_id, original_name, loading_time, hash) VALUES (?, ?, ?, ?);',
            [req.user.id, filedata.originalname, new Date().toLocaleDateString() + ' ' +new Date().toLocaleTimeString().replace(/:/g, '.'),md5(fs.readFileSync(filedata.path,'utf-8'))],
            // callback для отладки
            function (error, results, fields) {      
                if (error) {
                    console.log('Ошибка записи в uploaded_files');
                    console.log(error);
                }
                console.log('Загрузка файла зафиксирована');
            }
        );
        res.send('Файл загружен');
    }
});

//фиксируем скачивание файла в бд
app.post('/download', jwt_methods.decodeAccessToken, function(request, response){
    const filename= request.body.filename
    date = new Date().toISOString().slice(0, -14) +
        ' ' +
        new Date().toLocaleTimeString();
       console.log(filename, date)
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

}
)

start_server();
