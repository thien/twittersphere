// load dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//initiate express
app.use(express.static('public'));
var port = 8080;

app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

http.listen(port, function(){
	console.log("Server up on http://localhost:%s", port);
});

io.on('connection', function (socket) {
    var socketid = socket.id;
    socket.on('query', function (query) {
        console.log('Queried, text is: ',query.document.content);
        socket.emit('query-response', { "response": "recieved" });
    });
});