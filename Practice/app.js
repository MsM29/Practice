const express = require('express');
const fs = require('fs');

const port = 8080;
const app = express(); // объект приложения
let users; // список пользователей

// запуск сервера
function start_server() {
    try {
        users = JSON.parse(fs.readFileSync('users/user_list.json', 'utf8'));
        app.listen(port, () => console.log(`server started at  http://localhost:${port}/login`));
    } catch (error) {
        console.log(error);
    }
}

// парсеры для данных
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// отправка статических данных
app.use('/login', express.static(__dirname + '/public'));

// обработка post
app.post('/login', function (request, response) {
    try {
        // поиск по json
        let login = request.body.login;
        let password = request.body.password;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (user.login == login) {
                if (user.hash == password) {
                    return response.send('success_auth');
                } else {
                    return response.send('wrong_password');
                }
            }
        }
        return response.send('user_not_found');
    } catch (error) {
        console.log(error);
    }
});

start_server();
