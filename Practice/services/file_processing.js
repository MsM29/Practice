const { exec } = require("child_process");
const bd = require('./bd_operations');


module.exports.start = function(id, name) {
    extension = name.split('.').pop()
    allowedExtensions = ['jpg', 'jpeg', 'png', 'svg']

    if (!allowedExtensions.includes(extension)) {
        throw new Error('Ошибка обработки файла');
    }
    inputPath = `./file_storage/uploads/"${name}"`
    newname = `processed ${name.replace(extension, 'pdf')}`
    outputPath = `./file_storage/processed/"${newname}"` 

    exec(`convert ${inputPath} ${outputPath}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            throw new Error('Ошибка обработки файла');
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            throw new Error('Ошибка обработки файла');
        }
        console.log('Файл обработан');
        bd.fixProcessing(id, newname)
    });
}

