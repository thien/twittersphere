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

fs = require('fs'); //loads file

//initiate express
app.use(express.static('public'));
var port = 8080;
var twit = new twitter(st.s());

class Connections {
	constructor(){
		//list that contains players online
		this.player_list = [];
	};
	addPlayer(player){
		this.player_list.push(player);
	}
	findPlayer(playerid){
		return this.player_list.filter(function (element) {
			return element.id === playerid;
		})[0];
	}
	listPlayers(){
		// bugged
		// console.log("currently online");
		// for (i = 0; i < this.player_list.length; i++) {
		//     console.log(this.player_list[i].id);
		// }
	}
	listPlayersOnline(){
		io.sockets.emit("players_online", this.noPlayers());
	}
	noPlayers(){
		return this.player_list.length;
	}
	sendPlayerList(){
		return this.player_list;
	}
	removePlayerFromList(socket_id){
		this.player_list = this.player_list.filter(
			function(player){
				return player.id !== socket_id;
			}
		);
	}
}

class player {
	constructor(id, socket){
		//generate random name.
		this.name = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
		this.socket = socket;
		this.id = id;
	}
	sendTweetPosts(){
		this.socket.emit("send_counter_value", this.counter);
	}
	sendPlayerProperties(){
		this.socket.emit("player_properties", this.name);
	}
	sendTweetResults(tweets){
		console.log("w576yq349857teu0trihuisgojrfdhjar436t");
		console.log(tweets);
		this.socket.emit("tweet_results", tweets);
	}
}

//initialise connections
var conn = new Connections();

//getting tweets from a twitter user
function getTweets(user){
	var params = {screen_name: user, count: 30, include_rts: 'false'};
	twit.get('statuses/user_timeline', params, function(error, tweets, response) {
		var tweet_texts = [];
		if (!error) {
			for (i = 0; i < tweets.length; i++) {
			    console.log(tweets[i].text); //this gets the results of the tweets
			    tweet_texts.push(tweets[i].text);
			}
		} else {
			console.log(error);
			tweet_texts.push(error);
			tweet_texts.push("found nada");
		}
		return tweet_texts;
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

	//initialise player class
	var socket_player = new player(socket.id, socket);
	socket_player.sendPlayerProperties();

	//add player to connections
	conn.addPlayer(socket_player);

	//print players
	conn.listPlayers();
	conn.listPlayersOnline();

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
		conn.removePlayerFromList(socket.id);
		//print players
		conn.listPlayers();
		conn.listPlayersOnline();
	});
});

//function to parse and manage controls of the inputs
function Control(){
	while (instructionsStack.length != 0){
		// console.log("Instruction execeuting");
		var Instruction = instructionsStack.pop();
		usr = conn.findPlayer(Instruction.id);
		switch(Instruction.instruction) {
		   	case "CLOCK":
		   		k = getTweets(Instruction.val);
		   		usr.sendTweetResults(k);
		   		console.log("tweets sent");
		   		break;
		    default:
				break;
		}
	}
};

setInterval(Control, 1);