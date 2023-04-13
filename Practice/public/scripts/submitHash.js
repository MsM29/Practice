const md5 = require('md5');

// функция отправляет данные в виде json с помощью post
async function sendData(data) {
    return await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
    });
}

// из формы достаются данные и преобразуются в json для отправки
function serializeForm(form) {
    const { elements } = form;
    const array = Array.from(elements);

    return JSON.stringify({
        login: array[0].value,
        password: array[1].value,
    });
}

// функция хеширования
function hashData(dataJSON) {
    let parseData = JSON.parse(dataJSON);
    const hash = md5(parseData.password);
    parseData.password = hash;
    return JSON.stringify(parseData);
}

// обработка ответа от сервера
function inputResult(responseFromServer) {
    if (responseFromServer === 'success_auth') {
        alert('Успешная авторизация!');
    } else if (responseFromServer === 'wrong_password') {
        document.getElementById('warning').innerHTML = 'Неверный пароль';
    } else {
        document.getElementById('warning').innerHTML = 'Пользователя не существует';
    }
}

// обработчик события submit
async function handleSubmit(event) {
    //прерываем автоматическую передачу данных из формы
    event.preventDefault();

    const dataJson = serializeForm(event.target);
    const hashJSON = hashData(dataJson);

    //отправка данных
    const response = await sendData(hashJSON);

    let responseFromServer = (await response.text()).toString();
    inputResult(responseFromServer);
}

const form = document.getElementById('login-form');
// начинаем прослушивать событие отправки данных из формы
form.addEventListener('submit', handleSubmit);
