const button = document.getElementById('update-button');
const fileUploader = document.getElementById('file-uploader');
const pathList = document.getElementById('pathList');
const logOutButton = document.getElementById('log-out');
const uploadForm = document.getElementById('upload-form');
const contextMenu = document.getElementById('context-menu');
const processingButton = document.getElementById('processing-button');

let currentFile; // запоминает файл, для которого было вызвано меню

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
        let downloadFile = document.createElement('div');
        downloadFile.className = 'download-file';
        downloadFile.innerHTML = 
        `<li>
            <a href="./${filename}" download onclick='sendFilename("${filename}")'>
                ${filename}
            </a>
        </li>
        <button class="show-context-menu" type="button"></button>`;
        
        pathList.appendChild(downloadFile);
        const button = downloadFile.childNodes[2];   // добавленная выше в innerHTML кнопка 
        button.onclick = (event) => showContextMenu(event);

        // показываем кнопку при наведении курсора на ссылку, затем скрываем
        downloadFile.addEventListener('mouseover', () => {
            button.style.display = 'inline-block';
            currentFile = downloadFile.childNodes[0].childNodes[1].text.trim();
        })
        downloadFile.addEventListener('mouseout', () => {
            button.style.display = 'none';
        })
    });
}

// обработчик для кнопки в контекстном меню
processingButton.addEventListener('click', async () => {
    await fetch('/processing', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({filename: currentFile})
    });
})

// показать контекстное меню
function showContextMenu(event) {
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.display = 'block';
}

// скрываем меню, когда курсор с него уходит
processingButton.addEventListener('mouseout', () => contextMenu.style.display = 'none');

//получение логина пользователя
const login = document.cookie
    .split("; ")
    .find((row) => row.startsWith("login="))
    .split("=")[1]
    .replace('%40', '@');
document.getElementById('current-user').innerHTML = login;
