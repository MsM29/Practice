const button = document.getElementById('update-button');
const fileUploader = document.getElementById('file-uploader');
const pathList = document.getElementById('pathList');

// прослушиваем событие нажатия на кнопку обновления списка файлов
button.addEventListener('click', getFileNames);

// получение списка файлов на сервере
async function getFileNames() {
    await fetch('/home', {
        method: 'GET',
        headers: {
            'Get-File-Names': 'true',
        },
    }).then((response) => {
        response.json().then((data) => {
            loading(Object.values(data));
        });
    });
}

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
        let path = document.createElement('a');
        path.innerHTML = `<li><a href='./${filename}' download>${filename}</a></li><br>`;
        pathList.appendChild(path);
    });
}