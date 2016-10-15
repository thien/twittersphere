// load dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//initiate express
app.use(express.static('public'));
var port = 8080;

app.get("/", function(req, res) {
	res.sendFile(__dirname);
});

http.listen(port, function(){
	console.log("Server up on http://localhost:%s", port);
});
