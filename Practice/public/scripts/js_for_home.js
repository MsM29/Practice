const updateFileButton = document.getElementById('update-file-button');
const fileUploader = document.getElementById('file-uploader');
const pathList = document.getElementById('pathList');
const logOutButton = document.getElementById('log-out');
const uploadForm = document.getElementById('upload-form');
const contextMenu = document.getElementById('context-menu');
const processingButton = document.getElementById('processing-button');
const updateStatisticsButton = document.getElementById('update-statistics-button')
const statisticsList = document.getElementById('statisticsList')
let currentFile; // запоминает файл, для которого было вызвано меню

// получение списка файлов на сервере
updateFileButton.addEventListener('click', async () => {
    await fetch('/get-filenames')
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
        let folder = 'uploads';
        if (filename.slice(0, 9) == 'processed') {
            folder = 'processed';
        }

        let downloadFile = document.createElement('div');
        downloadFile.className = 'download-file';
        downloadFile.innerHTML = 
        `<li>
            <a href="./${folder}/${filename}" download onclick='sendFilename("${filename}")'>
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
    })
    .then(response => response.json())
    .then(data => alert(data.message))
})

// показать контекстное меню
function showContextMenu(event) {
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.display = 'block';
}

// скрываем меню, когда курсор с него уходит
processingButton.addEventListener('mouseout', () => contextMenu.style.display = 'none');

//получение статистики (пока без статистики)
updateStatisticsButton.addEventListener('click', async () => {
    await fetch('/get-statistics')
    .then(response =>  response.json())
    .then(data => plug(data));
});

//втсавка статистики на страницу (пока без статистики)
function plug(message){
    removeAllChildNodes(statisticsList);
    let statistics = document.createElement('div');
    statistics.className = 'statistics';
    statistics.innerHTML = message
    statisticsList.appendChild(statistics);
}

//получение логина пользователя
const login = document.cookie
    .split("; ")
    .find((row) => row.startsWith("login="))
    .split("=")[1]
    .replace('%40', '@');
document.getElementById('current-user').innerHTML = login;

