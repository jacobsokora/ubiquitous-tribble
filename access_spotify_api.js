var accessToken = '';
var userId = '';
var currTrackName = '';
var currTrackNum = 0;
var trackId = 'spotify:track:6rPO02ozF3bM7NnOV4h6s2'; //deeeespaaaacito

getToken();
populatePlaylists();

//this bit grabs the access token out of the url, which returned from the authorization in spotify_auth
function getToken()
{
    if(window.location.hash)
    {
        var hash = window.location.hash.substring(1);
        var params = {}
        //this is some crazy JS wizard shit I found on stackoverflow
        hash.split('&').map(hk => {
          let temp = hk.split('='); 
            params[temp[0]] = temp[1] 
        });
    }
    accessToken = params.access_token;
}


//kicks off the series of API calls needed to enqueue a song
//first AJAX call checks if a song is currently playing and if so, grabs the song's position in playlist then starts the rest of the API calls
function addSongToQueue(track_id)
{
    $.ajax({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: function(response) {
            if(response != null) //if song found to be playing
            {
                currTrackName = response.item["name"];
            }
            
            getUserID(track_id);
        },
        error: function(xhr, status, error) 
        {
            alert(xhr.responseText);
        }
    });
}

//grabs authorized user's ID
function getUserID(track_id)
{
    $.ajax({
       url: 'https://api.spotify.com/v1/me',
       headers: {
           'Authorization': 'Bearer ' + accessToken
       },
       success: function(response) {
            userId = response["id"];            
            getPlaylist(userId, track_id);
            
       }
    });
}

//grabs the Test Playlist's ID
function getPlaylist(user_id, track_id)
{
    var playlistId = '';
    
    //this call grabs the ID of the playlist 'Test Playlist', if it exists
    $.ajax({
       url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists',
       headers: {
           'Authorization': 'Bearer ' + accessToken
       },
       success: function(response) {
            for(playlist in response.items)
            {
                if(response.items[playlist]["name"] == "Test Playlist")
                {
                    playlistId = response.items[playlist]["id"];
                }
            }
            
            if(playlistId != '')
            {
                
                getPosInPlaylist(user_id, playlistId, track_id);
                
            }
            else
            {
                alert("No public playlist called Test PLaylist found. Please make sure the playlist is set to public.");
            }
       }
    });
}

//gets the position of the current song playing in the Test Playlist if it exists
function getPosInPlaylist(user_id, playlist_id, track_id)
{
    //grabs current playlist, loops through it to find the position of the current song in that playlist
    $.ajax({
        url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: function(response) {
            
            currTrackNum = response.items.findIndex(obj => obj.track.name==currTrackName);
            addSong(user_id, playlist_id, track_id, currTrackNum+1); //add song after current song
        },
        error: function(xhr, status, error) 
        {
            alert(xhr.responseText);
        }
    });
}

//adds the song with the specificed track ID to the position after the current playing song (beginning of the playlist if no song is playing)
function addSong(user_id, playlist_id, track_id, track_position)
{
    //POST request that adds the track specified by trackId to the 'Test Playlist'
    $.post({
        url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + playlist_id + '/tracks?uris=' + track_id + '&position=' + track_position,
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(response) {
            if(track_position != 0)
            {
                alert("Song successfully added to queue.");
            }
            else
            {
                alert("No song currently playing. Song added to beginning of playlist.");
            }
        },
        //error code if POST fails
        error: function(xhr, status, error) {
            alert(xhr.responseText);
        }
    });
}

function search(ele) {
    if(event.key === 'Enter') {
        var query = ele.value;
        $.ajax({
           url: 'https://api.spotify.com/v1/search?type=track&limit=1&query=' + query,
           headers: {
               'Authorization': 'Bearer ' + accessToken
           },
           success: function(response) {
                trackID = response.tracks.items[0]["id"];
                alert("Attempting to add \"" + response.tracks.items[0]["name"] + "\" to queue.");
                var rebuiltID = "spotify:track:" + trackID;
                addSongToQueue(rebuiltID);
           }
        });
    }
}

function populatePlaylists()
{
    /*var opt = "<option value=\"test\">Test</option>";
    $("#playlist-selection").append(opt);
    $("h1").append("TEST");*/
}
