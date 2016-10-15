// load dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');
var twitter = require('twitter');
var st = require('./twitter_key.js');


fs = require('fs'); //loads file

//initiate express
app.use(express.static('public'));
var port = 8080;


var twit = new twitter(st.s());




var params = {screen_name: 'nodejs', include_rts: 'false'};
twit.get('statuses/user_timeline', params, function(error, tweets, response) {
	if (!error) {
		for (i = 0; i < tweets.length; i++) {
		    console.log(tweets[i].text);
		}
	} else {
		console.log(error);
	}
});

app.get("/", function(req, res) {
	res.sendFile(__dirname);
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