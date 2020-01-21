/*
const botSettings = require("./bot_settings.json");
const Discord = require("discord.js")
const client = new Discord.Client();
*/

var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'discord-yt-livechat-bot.json';

// Load client secrets from a local file (client_secret.json)
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  authorize(JSON.parse(content), getActiveLiveChatId);
  authorize(JSON.parse(content), getLiveChat);
});


function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}


function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}


function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

async function getActiveLiveChatId(auth) {
  var service = google.youtube('v3');
  var getLiveChatId = await service.videos.list({
      auth: auth,
      part: 'snippet,contentDetails,statistics,liveStreamingDetails',
      id: 'EEIk7gwjgIM' // Random Livechat
  }).catch((err) => {console.log("error: "+err)});
  var video = getLiveChatId.data.items;
  var info = 'This videos ID is ' + video[0].id + ' Its title is ' + video[0].snippet.title + ' and it has ' + video[0].statistics.viewCount + 
  ' views currenly. The number of likes are ' + video[0].statistics.likeCount + ' and the chat id is ' + video[0].liveStreamingDetails.activeLiveChatId;
  if (video.length == 0) {
    console.log('No channel found.');
  } else {
    console.log(info);
    return video[0].liveStreamingDetails.activeLiveChatId;                    
  }
}

async function getLiveChat(auth) {
  var service = google.youtube('v3');
  service.liveChatMessages.list({
    auth: auth,
    part: 'snippet',
    liveChatId: await getActiveLiveChatId(auth)
  }, function(err, liveChat) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var chat = liveChat.data.items;
    if (chat.length == 0) {
      console.log('No channel found.');
    } else {
      console.log(chat);
    }
  });
}