const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const jwtMethods = require('./services/jwt_methods');
const processing = require('./services/file_processing');
const bd = require('./services/bd_operations');

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

app.get('/home', jwtMethods.decodeAccessToken, (request, response) => {
    try {
        response.cookie('login', request.user.login);
        response.sendFile(__dirname + '/views/home.html');
    } catch (error) {
        console.log(error);
    }
});

// обработка запроса на получение списка файлов
app.get('/get-filenames', jwtMethods.decodeAccessToken, (request, response) => {
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

        bd.checkAuth(login, hash, bdResponse => {
            if (bdResponse.message == 'success_auth') {
                // генерация токена
                const token = jwtMethods.generateAccessToken(
                    bdResponse.id,
                    bdResponse.login,
                    bdResponse.user_group
                );
                // запись токена в куки и отправка сообщения об успешной авторизации
                console.log('Авторизация пройдена');
                response.cookie('token', `Bearer ${token}`, {
                    httpOnly: true
                });
                response.json({ message: 'success_auth'})
            }
            else response.json(bdResponse);
        })    
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
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
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
app.post('/upload', jwtMethods.decodeAccessToken, (request, response) => {
    const filedata = request.file;
    const id = request.user.id;

    if (!filedata) response.json({ message: 'Ошибка при загрузке файла!' });
    else {
        response.json({ message: 'Файл загружен' });
        bd.fixUpload(id, filedata);
    }
});

//фиксируем скачивание файла в бд
app.post('/download', jwtMethods.decodeAccessToken, (request, response) => {
    const filename= request.body.filename
    const id = request.user.id;
    bd.fixDownload(id, filename);
    response.sendStatus(200);
});

// обработка запроса на конвертацию файлов
app.post('/processing', jwtMethods.decodeAccessToken, (request, response) => {
    try {
        processing.start(request.body.filename);
        response.json({ message: 'Файл конвертирован и сохранён на сервере'});
    } catch (error) {
        response.json({ message: 'Ошибка конвертации! Поддерживаемые форматы: jpeg, jpg, png, svg'});
    }
})

// обработка запроса на получение статистики (пока без статистики)
app.get('/get-statistics', jwtMethods.decodeAccessToken, (request, response) => {
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
