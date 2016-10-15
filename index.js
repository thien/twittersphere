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
function getTweets(user){
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
					console.log(tweeter);
			        language.detectSentiment(tweeter,function(err,sentiment,apiResponse) {
			            console.log(sentiment);
			        });
		    }
		}
	});
}

app.get("/", function(req, res) {
	res.sendFile(__dirname);
});

http.listen(port, function(){
	console.log("Server up on http://localhost:%s", port);
});

io.on('connection', function (socket) {
	console.log('client ' + socket.id + ' has joined the server');


	socket.on('instruction', function(instructionPackage){
		var Instruction = JSON.parse(instructionPackage);
		//append socket id so we can process it according to player.
		Instruction.id = socket.id;
		instructionsStack.push(Instruction);
	});


    socket.on('query', function (query) {
        console.log('Queried, text is: ',query.document.content);
        socket.emit('query-response', { "response": "recieved" });
    });

    socket.on('disconnect', function() {
		//remove it from connections list
		console.log('client ' + socket.id + ' has dropped the server');
	});
});

