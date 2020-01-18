/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
module.exports = {
    getActiveLiveChatId : function (auth) {
        var service = google.youtube('v3');
        service.videos.list({
            auth: auth,
            part: 'snippet,contentDetails,statistics,liveStreamingDetails',
            id: 'EEIk7gwjgIM' // Random Livechat
        }, function(err, getLiveChatId) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return;
                }
                var video = getLiveChatId.data.items;
                var info = 'This videos ID is ' + video[0].id + ' Its title is ' + video[0].snippet.title + ' and it has ' + video[0].statistics.viewCount + 
                ' views currenly. The number of likes are ' + video[0].statistics.likeCount + ' and the chat id is ' + video[0].liveStreamingDetails.activeLiveChatId;
                if (video.length == 0) {
                    console.log('No channel found.');
                } else {
                    console.log(info);
                    return video[0].liveStreamingDetails.activeLiveChatId;
                }
            });
    }

};