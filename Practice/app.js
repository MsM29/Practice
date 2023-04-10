const express = require('express');
const mysql = require('mysql');

const port = 8080;
const app = express(); // объект приложения

// запуск сервера
function start_server() {
    try {
        app.listen(port, () => console.log(`server started at  http://localhost:${port}/login`));
    } catch (error) {
        console.log(error);
    }
}

// данные для подключения к mysql
const pool = mysql.createPool({
	host     : 'localhost',
	user     : 'root',
	password : 'Ckj:ysqg@hjkm215',
	database : 'node_auth'
});

// парсеры для данных
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// отправка статических данных
app.use('/login', express.static(__dirname + '/public'));

// обработка post-запроса на авторизацию
app.post('/login', function (request, response) {
    try {
        const login = request.body.login;
        const hash = request.body.password;

        pool.query('SELECT * FROM accounts WHERE login = ?', login,
        function(error, results, fields) {
			if (error) throw error;

            // если results не содержит данных
            if (results.length < 1) {
                return response.send('user_not_found');
            }

            if (results[0].hash == hash) {
                return response.send('success_auth');
            } else {
                return response.send('wrong_password');
            }
		});
    } catch (error) {
        console.log(error);
    }
});

start_server();
