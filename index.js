"use strict";
// load dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');
var twitter = require('twitter');
var st = require('./twitter_key.js');

// load necessary variables for system
var instructionsStack = [];

// Language API

var language = require('@google-cloud/language')({
  projectId: 'coolproject11-146512',
  keyFilename: './googlecompute.json'
});


//initiate express
app.use(express.static('public'));
var port = 8080;
var twit = new twitter(st.s());


//getting tweets from a twitter user
function getTweets(user,socket){
	var params = {screen_name: user, count: 30, include_rts: 'false'};
	twit.get('statuses/user_timeline', params, function(error, tweets, response) {
		var tweet_texts = []; //array containing the
		if (!error) {
			for (var i = 0; i < tweets.length; i++) {
			    // console.log(tweets[i].text); //this gets the results of the tweets
			    tweet_texts.push(tweets[i].text);
			}
		} else {
			console.log(error);
			tweet_texts.push(error);
			tweet_texts.push("found nada");
		}
		// return tweet_texts;
		if (tweet_texts){
			var sentiments;
		    for (var i = 0; i < tweet_texts.length; i++) {
		    	var tweeter = tweets[i].text;
                        socket.emit('tweet', {tweet})
                        language.detectSentiment(tweeter,function(err,sentiment,apiResponse) {
                            socket.emit('sentiment', {sentiment})
                        });
		    }
		}
	});
}

app.get("/", function(req, res) {
	res.sendFile(__dirname);
});

app.get("/([a-zA-Z0-9]*)", function(req, res) {
	res.sendFile("user.html");
});

http.listen(port, function(){
	console.log("Server up on http://localhost:%s", port);
});

io.on('connection', function (socket) {
    console.log('client ' + socket.id + ' has joined the server');

    socket.on('query', function (query) {
        console.log('Queried, text is: ',query.document.content);
        socket.emit('query-response', { "response": "recieved" });
    });

    socket.on('disconnect', function() {
        //remove it from connections list
        console.log('client ' + socket.id + ' has dropped the server');
    });
    socket.on('interrogate', function(username) {
        getTweets(username,socket);
    });
});
