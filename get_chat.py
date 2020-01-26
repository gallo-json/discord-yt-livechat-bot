# Puthon code (I modified it a bit) from a commenter https://stackoverflow.com/questions/57263074/cant-get-live-chat-from-stream-i-do-not-own
# Uses Google quotas and they run out quickly, but it works (at least for 5 minutes or so)

import requests
import json

with open('bot_settings.json') as f:
        bot_settings = json.load(f)

API_KEY = bot_settings["YT_API"]
channelID = 'UCxEgOKuI-n-WOJaNcisHvSg' # Random youtube channel that is currently broadcasting a youtube livestream

try:
        params = {
                'part': 'id',
                'key': API_KEY,
                'channelId': channelID,
                'eventType': 'live',
                'type': 'video',
                'order': 'viewCount',
                'fields': 'items(id(videoId))'
                }

        url = 'https://www.googleapis.com/youtube/v3/search'
        r = requests.get(url, headers=None, params=params).json()

        # When all the quotas are used, no request possible
        vID = r.get('items')[0]['id']['videoId'] # vID = r.get('items')[0].get('id').get('videoId')

        params = {
                'part': 'liveStreamingDetails,statistics,snippet',
                'key': API_KEY,
                'id': vID,
                'fields': 'items(id,liveStreamingDetails(activeLiveChatId,concurrentViewers,actualStartTime),' + \
                        'snippet(channelId,channelTitle,description,liveBroadcastContent,publishedAt,thumbnails,title),statistics)'
                }

        url = 'https://www.googleapis.com/youtube/v3/videos'
        r = requests.get(url, headers=None, params=params).json()


        streamData = dict(r.get('items')[0])

        chatID = streamData['liveStreamingDetails']['activeLiveChatId']


        params = {
                'part': 'snippet',
                'key': API_KEY,
                'liveChatId': chatID,
                'maxResults': 2000
                }

        url = 'https://www.googleapis.com/youtube/v3/liveChat/messages'

        while True:
                messages = requests.get(url, headers=None, params=params).json()
                for i in range(len(messages['items'])):
                        print(messages['items'][i]['snippet']['displayMessage'])

except TypeError or KeyError:
        print('All your google quotas have been used!')
