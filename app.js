const botSettings = require("./bot_settings.json");
const Discord = require("discord.js")
const client = new Discord.Client();

let date = new Date();

var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'discord-yt-livechat-bot.json';

client.on('ready', () => {
  console.log(`${client.user.tag} is ready to roll!`);
});

client.on('message', msg => {
  function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  }

  if (!msg.content.startsWith(botSettings.prefix)) return;

  const args = msg.content.slice(1).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  var pst = new Date(date.getTime() -100 * 60 * 1000);

  if (command == 'keyword') {
    if (!args.length) {
      msg.reply('You forgot to type the video ID!')
    } if (args.length == 0) {
      msg.reply('You forgot to type your keyword(s)!')
    }

    let videoID = args[0];
    let keyword = args[1].toLowerCase();
    let keyword2 = args[2].toLowerCase();

    // Load client secrets from a local file (client_secret.json)
    fs.readFile('client_secret.json', async function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the YouTube API.
      authorize(JSON.parse(content), getActiveLiveChatId);
      while (true) {
        await sleep(5000);
        authorize(JSON.parse(content), getLiveChat);
      }
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
            console.log(errorMessage, err);
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
        if (err.code != 'EEXIST') throw err;
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
          part: 'snippet,liveStreamingDetails',
          id: videoID // Random Livechat
      }).catch(() => {
        console.log('All your Google Quotas have been used for today! They renew at 12:00 PM PST (' + (24 - pst.getHours()) + ':' + pst.getMinutes() + ' hours left!)');
      });
      var video = getLiveChatId.data.items;
      if (video.length == 0) {
        console.log('No video found.');
      } else {
        if (video[0].liveStreamingDetails.actualEndTime == null) { // If the livestream is still active
          return video[0].liveStreamingDetails.activeLiveChatId; 
        } else {
          return;
        }                  
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
          console.log('Error while trying to retrieve access token:', err);
          return;
        }
        var chat = liveChat.data.items;
        if (chat.length == 0) {
          console.log('No livechat found.');
        } else {
            if (chat[chat.length-1]['snippet']['displayMessage'].indexOf(keyword) != -1) {
              msg.reply(keyword + ' has been said in the chat!');
            } else if (chat[chat.length-1]['snippet']['displayMessage'].indexOf(keyword2) != -1) {
              msg.reply(keyword2 + ' has been said in the chat!');
            }
        }
      });
    }
  } else if (command == 'help') {
    msg.reply("Type '!keyword' followed by the video ID and up to 2 keywords to get notified when those keywords get said in chat!")
  }
})

client.login(botSettings.token);