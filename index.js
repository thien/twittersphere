"use strict";
// load dependencies
var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');
var twitter = require('twitter');
var async = require('async');
var sentiment = require('sentiment');
var tweet_query;
// load necessary variables for system
var instructionsStack = [];

// keys
var twi = {};

// twitter
try {
  var k = JSON.parse(fs.readFileSync('twitter_key.json', 'utf8'));
  twi = {
    consumer_key: k.consumer_key,
    consumer_secret: k.consumer_secret,
    access_token_key: k.access_token_key,
    access_token_secret: k.access_token_secret
    }
} catch (err) {
    // secret file isn't found.
    console.log(err);
    twi = {
    consumer_key: process.env.tw_cs_key,
    consumer_secret: process.env.tw_cs_sec,
    access_token_key: process.env.tw_ac_key,
    access_token_secret: process.env.tw_ac_sec
    }
}



//initiate express
app.use(express.static('public'));
var port =  process.env.PORT || 3000;
var twit = new twitter(twi);


//getting tweets and sentiments from a twitter user
function getTweets(user,socket){
    var params = {screen_name: user, count: 100, include_rts: 'false'};
    twit.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error) {
        	// console.log(tweets[0]);
        	socket.emit('twitter_user_details', tweets[0]);
        	// console.log(tweets[0].user.profile_image_url);
            async.each(tweets,function(tweet) {
                socket.emit('tweet', tweet);
                // console.log(tweet.text);
                var r1 = sentiment(tweet.text);
                socket.emit('sentiment', {"id": tweet.id, "response": r1});
            });
        } else {
            console.log(error);
        }
    });
}

app.get("/", function(req, res) {
	res.sendFile(__dirname);
});

app.get("/([a-zA-Z0-9]*)", function(req, res) {
	res.sendFile(__dirname+"/public/user.html");
});

// parameter middleware that will run before the next routes
app.param('name', function(req, res, next, name) {
	res.sendFile(__dirname+"/public/user.html");
    // check if the user with that name exists
    // do some validations
    // add -dude to the name
    // var modified = name + '-dude';

    // save name to the request
    req.name = name;

    next();
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
