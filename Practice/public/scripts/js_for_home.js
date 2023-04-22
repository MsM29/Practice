const button = document.getElementById('update-button');
const fileUploader = document.getElementById('file-uploader');
const pathList = document.getElementById('pathList');
const logOutButton = document.getElementById('log-out');
const uploadForm = document.getElementById('upload-form');

// получение списка файлов на сервере
button.addEventListener('click', async () => {
    await fetch('/home', {
        method: 'GET',
        headers: {
            'Get-File-Names': 'true',
        },
    })
    .then(response =>  response.json())
    .then(data => loading(Object.values(data)));
});

// log-out
logOutButton.addEventListener('click', async () => {
    await fetch('/log-out', {
        method: 'POST'
    })
    .then(() => window.location.pathname = '/login');
});

// отправка файла на сервер
uploadForm.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(event.target)
    await fetch('/upload', {
        method: 'POST', 
        body: formData
    })
    .then(response => response.json())
    .then(data => alert(data.message));
})

// очищаем список файлов на странице
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

// вставка ссылок для загрузки файлов на страницу
function loading(filenames) {
    removeAllChildNodes(pathList);
    filenames.forEach((filename) => {
        let listItem = document.createElement('li');
        listItem.className = 'download-file';
        listItem.innerHTML = `<a href='./${filename}' download onclick="sendFilename('${filename}')">${filename}</a>`;
        pathList.appendChild(listItem);
    });
}

//получение логина пользователя
const login = document.cookie
    .split("; ")
    .find((row) => row.startsWith("login="))
    .split("=")[1]
    .replace('%40', '@');
document.getElementById('current-user').innerHTML = login;
