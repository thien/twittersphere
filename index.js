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
var tweet_query;
// load necessary variables for system
var instructionsStack = [];

// Language API

var google_api_keys = {
    "type": process.env.go_type,
    "project_id": process.env.go_pr_id,
    "private_key_id": process.env.go_priv_key_id,
    "private_key": process.env.go_comp_pr_key,
    "client_email": process.env.go_cli_email,
    "client_id": process.env.go_client_id,
    "auth_uri": process.env.go_auth_uri,
    "token_uri": process.env.go_tok_uri,
    "auth_provider_x509_cert_url": process.env.go_auth_provi,
    "client_x509_cert_url": process.env.go_glient_x509
}

var twi = {};

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

var language = require('@google-cloud/language')({
    projectId: 'coolproject11-146512',
    keyFilename: './googlecompute.json',
    credentials: google_api_keys
});

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
                language.annotate(tweet.text,function(err,sentiment,apiResponse) {
                    // console.log(apiResponse.documentSentiment);
                    socket.emit('sentiment', {"id": tweet.id, "response": apiResponse})
                });
            });
            // return tweet_texts;
            /*for (var i = 0; i < tweets.length; i++) {
                var tweet = tweets[i].text;
                var id = tweets[i].id;
                socket.emit('tweet', {"id": id, "text": tweets[i].text})
                language.annotate(tweets[i].text,options,function(err,sentiment,apiResponse) {
                    socket.emit('sentiment', {"id": id, "response": apiResponse})
                });
            }*/
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
