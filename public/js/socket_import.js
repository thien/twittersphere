// $( function() {
//     $( document ).tooltip();
//   } );
var socket = io();
var tweets = [];
var sentiment = [];
var allData = [];
var userdata = {};
var loads = 0;
socket.on('tweet', function (response) {
    tweets.push(response);
});
socket.on('sentiment', function (response) {
    sentiment.push(response);
});
socket.on('twitter_user_details', function(response){
    userdata = response.user.description;
// $('cover-image').css('background-image', 'url(' + response.user.profile_banner_url + ')');
    document.getElementById("cover-image").style.backgroundImage = "url('"+ response.user.profile_banner_url+"')";
    document.getElementById("twitter-profile-pic").style.backgroundImage = "url('"+ response.user.profile_image_url+"')";
    // document.getElementById("alpha_goods").innerHTML = JSON.stringify(response, null, "\t");
    // document.getElementById("alpha_goods").innerHTML.appendChild = JSON.stringify(response, null, "\t");
    document.getElementById("user_desc").innerHTML = '"'+response.user.description+'"';
    document.getElementById("toggle").innerHTML = "Switch to VisualView (" + loads +")";
    console.log(response.user.profile_banner_url);
    console.log(response.user.profile_image_url);
});
function checkStacks() {
    if (tweets.length > 0 && sentiment.length > 0) {
        var found = false;
        for (var i = 0; i < tweets.length; i++) {
            if (tweets[0].id == sentiment[i].id) {
                found = true;
                var response = sentiment[i];
                response.mentions = tweets[0].entities.user_mentions;
                // console.log(response);
                allData.push(response);
                var tmp = sentiment[0];
                sentiment[0] = sentiment[i];
                sentiment[i] = tmp;
            }
        }
        if (found && sentiment[0].response && tweets[0]) {
            loads = loads + 1;
            document.getElementById("toggle").innerHTML = "Switch to VisualView (" + loads +")";
            var score0 = sentiment[0].response.score * sentiment[0].response.comparative*10;
            var tweetlink = "http://twitter.com/"+tweets[0].user.screen_name+"/status/"+tweets[0].id_str;
            var html_tweetlink = '<a href="'+tweetlink+'">link</a>';
            $("#table_data").find('tbody')
            .append($('<tr>'))
            .append($('<td>').append(html_tweetlink).hide().fadeIn(200))
            .append($('<td>').text(tweets[0].text).hide().fadeIn(200))
            .append($('<td>').append(listMentions(tweets[0].entities.user_mentions)).hide().fadeIn(200))
            // .append($('<td>').text(sentiment[0].response.documentSentiment.polarity.toFixed(2)).hide().fadeIn(200))
            // .append($('<td>').text(sentiment[0].response.documentSentiment.magnitude.toFixed(2)).hide().fadeIn(200))
            .append($('<td>').text(score0.toFixed(1)).hide().fadeIn(200))
            tweets = tweets.splice(1,tweets.length);
            sentiment = sentiment.splice(1,sentiment.length);
            //console.log(tweets);
        }
    }
}
function listMentions(data){
    var k = [];
    for (var i = 0; i < data.length; i++){
        k.push("<a id='tweetlink' href=\""+data[i].screen_name+"\">"+data[i].screen_name+"</a> ");
    }
    return k;
}
setInterval(checkStacks,100);
