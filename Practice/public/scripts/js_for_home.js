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
    .then(data => console.log(data));
})

// очищаем список файлов на странице
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
let files=[];
// вставка ссылок для загрузки файлов на страницу
function loading(filenames) {
    removeAllChildNodes(pathList);
    filenames.forEach((filename) => {
        let path = document.createElement('a');
        path.innerHTML = `<li><a class='download_file' href='./${filename}' download onclick="a('${filename}')">${filename}</a></li><br>`;
        pathList.appendChild(path);
    });
    files = document.getElementsByClassName('download_file')
}

//получение логина пользователя
const login = document.cookie
    .split("; ")
    .find((row) => row.startsWith("login="))
    .split("=")[1]
    .replace('%40', '@');
document.getElementById('current-user').innerHTML = login;
