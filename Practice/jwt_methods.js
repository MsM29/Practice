const jwt = require('jsonwebtoken');


// ключ для генерации/проверки токена
const secretKey = 'test_secret_key_dgs57g8r1sgd';

// генерация токена
module.exports.generateAccessToken = function (id, login, user_group) {
    // данные, закодированные в токене
    payload = {
        id,
        login,
        user_group
    };
    return jwt.sign(payload, secretKey);    // время жизни токена пока не настроено
};

// middleware для проверки токена, приходящего с клиента
module.exports.decodeAccessToken = function (request, response, next) {
    try {
        const token = request.cookies.token.split(' ')[1];
        decodedToken = jwt.verify(token, secretKey);
        request.user = decodedToken;
        console.log('decoded token: ', decodedToken)
        next();
    } catch (error) {
        response.status(401).json({ message: 'Пользователь не авторизован' });
    }
};
