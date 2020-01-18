# Puthon code (I modified it a bit) from a commenter https://stackoverflow.com/questions/57263074/cant-get-live-chat-from-stream-i-do-not-own
# Uses Google quotas and they run out quickly, but it works (at least for 5 minutes or so)

import requests
import json

API_KEY = 'AIzaSyDlMaJmuTy3nTAw3E_I7SvOzPTqPFA0wyw'
channelID = 'UCxEgOKuI-n-WOJaNcisHvSg' # Random youtube channel that is currently broadcasting a youtube livestream


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

# vID = r.get('items')[0].get('id').get('videoId')
vID = r.get('items')[0]['id']['videoId']

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

def print_message():
        try:
                while True:
                        messages = requests.get(url, headers=None, params=params).json()
                        for i in range(len(messages['items'])):
                                print(messages['items'][i]['snippet']['displayMessage'])
        except KeyError or TypeError:
                print('All your google quotas have been used!')
                

print_message()