async function getFileNames() {
     await fetch('/home', {
        method: 'GET',
        headers: {
            'Get-File-Names': 'true',
        }
    }).then( response => {
        response.json().then( data => {
            loading(Object.values(data))
            console.log(typeof(Object.values(data)));
        });
        }
    );
}

const button = document.getElementById('update-button');
button.addEventListener('click', getFileNames);

const fileUploader = document.getElementById('file-uploader');
const pathList = document.getElementById('pathList');

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
function loading(filenames)
{
    removeAllChildNodes(pathList)
    filenames.forEach((filename) => {
        let path = document.createElement('a');
        path.innerHTML = `<a href='uploads/${filename}' download>${filename}</a><br>`;
        pathList.appendChild(path);
    })
}
loading()