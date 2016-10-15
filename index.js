"use strict";
// load dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var util = require('util');
var twitter = require('twitter');
var st = require('./twitter_key.js');

// Language API 

var language = require('@google-cloud/language')({
  projectId: 'coolproject11-146512',
  keyFilename: './googlecompute.json'
});

// load necessary variables for system
var instructionsStack = [];

//initiate express
app.use(express.static('public'));
var port = 8080;
var twit = new twitter(st.s());
//getting tweets from a twitter user
function getTweets(user){
	var params = {screen_name: user, count: 30, include_rts: 'false'};
        function twittercallback(error, tweets, response) {
                var tweet_texts = [];
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
	}
	twit.get('statuses/user_timeline', params, twittercallback);
}

//detect sentiment
function processTweets(tweets, callback) {
    console.log(tweets);
    var sentiments;
    for (var i = 0; i < tweets.length; i++) {
        language.detectSentiment(tweets[i].text,function(err,sentiment,apiResponse) {
            console.log(tweets[i]+" sent: "+sentiment);
        });
    }
    callback(sentiments);
}

app.get("/", function(req, res) {
    res.sendFile(__dirname);
});

app.get("/([a-zA-z0-9]*)",function(req,res){
    res.send("user.html");
});

http.listen(port, function(){
	console.log("Server up on http://localhost:%s", port);
});