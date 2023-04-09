const mysql = require('mysql');

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'maksfromtg_2002',
	database : 'nodelogin'
});


app.post('/login', function(request, response) {
	let username = request.body.username;
	let password = request.body.password;
	if (username && password) {
		connection.query(`SELECT * FROM accounts WHERE username = '${username}' AND password = '${password}'`,  function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				response.redirect('/home');
			} else {
				response.send('Неверный логин или/и пароль!');
			}			
			response.end();
		});
	} else {
		response.send('Введите логин и пароль!');
		response.end();
	}
});
