const { exec } = require("child_process");

module.exports.start = function(name) {
    extension = name.split('.').pop()
    allowedExtensions = ['jpg', 'jpeg', 'png', 'svg']

    if (!allowedExtensions.includes(extension)) {
        throw new Error('Ошибка обработки файла');
    }

    inputPath = `./file_storage/uploads/'${name}'`
    outputPath = `./file_storage/processed/'processed ${name.replace(extension, 'pdf')}'` 

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
    });

}

