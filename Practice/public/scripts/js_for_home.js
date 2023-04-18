const button = document.getElementById('update-button');
const fileUploader = document.getElementById('file-uploader');
const pathList = document.getElementById('pathList');

button.addEventListener('click', getFileNames);

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

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function loading(filenames) {
    removeAllChildNodes(pathList);
    filenames.forEach((filename) => {
        let path = document.createElement('a');
        path.innerHTML = `<li><a href='./${filename}' download>${filename}</a></li><br>`;
        pathList.appendChild(path);
    });
}

const droparea = document.querySelector(".drop-container")
const submit= document.querySelector(".buttons-in-flexbox")

droparea.addEventListener("dragover", (e) => {
    e.preventDefault()
    droparea.classList.add("hover")
})

droparea.addEventListener("dragleave", () => {
    droparea.classList.remove("hover")
})

droparea.addEventListener("drop",(e)=>{
    e.preventDefault();
    const file = e.dataTransfer.files[0]
// fetch("/upload",{
//     method: "POST",
//     headers: {
//         'Content-Type': 'multipart/form-data',
//     },
//     body: file
})
    
    // const type = file.type
    // submit.file=file
    // console.log(submit.file)
// })