const jwt = require('jsonwebtoken');


// ключ для генерации/проверки токена
const secretKey = 'test_secret_key_dgs57g8r1sgd';

// генерация токена
module.exports.generateAccessToken = function (id, login) {
    // данные, закодированные в токене
    payload = {
        id,
        login,
    };
    return jwt.sign(payload, secretKey);    // время жизни токена пока не настроено
};

// middleware для проверки токена, приходящего с клиента
module.exports.decodeAccessToken = function (request, response, next) {
    try {
        const token = request.cookies.token.split(' ')[1];
        decodedToken = jwt.verify(token, secretKey);
        next();
    } catch (error) {
        response.status(401).json({ message: 'Пользователь не авторизован' });
    }
};
