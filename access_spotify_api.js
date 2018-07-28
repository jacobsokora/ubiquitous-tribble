var accessToken = '';
var userId = '';
var currTrackName = '';
var currTrackNum = 0;
var trackId = 'spotify:track:6rPO02ozF3bM7NnOV4h6s2'; //deeeespaaaacito
var api_enabled = false; //this flag checks that the asynchronous call to grab the user ID has been completed
var partyPlaylist = '';

accessToken = getToken();
getUserID();
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
    return params.access_token;
}

//grabs authorized user's ID
function getUserID()
{
    $.ajax({
       url: 'https://api.spotify.com/v1/me',
       headers: {
           'Authorization': 'Bearer ' + accessToken
       },
       success: function(response) {
            api_enabled = true; //allow addSongToQueue to be used
            // populatePlaylists(response["id"]); //I dislike putting this function call here but can't figure out how to avoid it
            userId = response["id"]; 
            makePartyPlaylist();
       }
    });
}

function makePartyPlaylist() {
    $.ajax({
        url: 'https://api.spotify.com/v1/me/playlists?limit=50',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(response) {
            for (let playlist of response.items) {
                if (playlist.name == "Spotify Party Queue") {
                    partyPlaylist = playlist.id;
                    return;
                }
            }
            $.post({
                url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    name: 'Spotify Party Queue'
                }),
                success: function(response) {
                    partyPlaylist = response["id"];
                }
            });
        }
    });
}

function addSongToPartyPlaylist(track_id) {
    if (api_enabled && partyPlaylist.length != 0) {
        $.post({
            url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + partyPlaylist + '/tracks?uris=' + track_id,
            headers: {
               'Authorization': 'Bearer ' + accessToken
            },
            success: function(response) {
                //play if not already playing
                playSomeMusic(track_id);
            }
        });
    }
}

function playSomeMusic(added_track) {
    if (api_enabled) {
        $.ajax({
            url: 'https://api.spotify.com/v1/me/player',
            headers: {
               'Authorization': 'Bearer ' + accessToken
            },
            success: function(response) {
                if (!response.is_playing) {
                    $.ajax({
                        type: 'PUT',
                        url: 'https://api.spotify.com/v1/me/player/play',
                        headers: {
                            'Authorization': 'Bearer ' + accessToken
                        },
                        data: JSON.stringify({
                            context_uri: 'spotify:user:' + userId + ':playlist:' + partyPlaylist,
                            offset: {
                                uri: added_track
                            }
                        })
                    });
                }
            }
        });
    }
}

// //kicks off the series of API calls needed to enqueue a song
// //first AJAX call checks if a song is currently playing and if so, grabs the song's position in playlist then starts the rest of the API calls
// function addSongToQueue(track_id)
// {
//     if(api_enabled == true)
//     {
//         $.ajax({
//             url: 'https://api.spotify.com/v1/me/player/currently-playing',
//             headers: {
//                'Authorization': 'Bearer ' + accessToken
//             },
//             success: function(response) {
//                 if(response != null) //if song found to be playing
//                 {
//                     currTrackName = response.item["name"];
//                 }
                
//                 getPlaylist(userId, track_id);
//             },
//             error: function(xhr, status, error) 
//             {
//                 alert(xhr.responseText);
//             }
//         });
//     }
// }

// //grabs the Test Playlist's ID
// function getPlaylist(user_id, track_id)
// {
//     var playlistId = '';
    
//     //this call grabs the ID of the playlist 'Test Playlist', if it exists
//     $.ajax({
//        url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists',
//        headers: {
//            'Authorization': 'Bearer ' + accessToken
//        },
//        success: function(response) {
//             for(playlist in response.items)
//             {
//                 if(response.items[playlist]["name"] == $("#playlist-selection").val())
//                 {
//                     playlistId = response.items[playlist]["id"];
//                 }
//             }
            
//             if(playlistId != '')
//             {
                
//                 getPosInPlaylist(user_id, playlistId, track_id);
                
//             }
//             else
//             {
//                 alert("Playlist could not be found.");
//             }
//        }
//     });
// }

// //gets the position of the current song playing in the Test Playlist if it exists
// function getPosInPlaylist(user_id, playlist_id, track_id)
// {
//     //grabs current playlist, loops through it to find the position of the current song in that playlist
//     $.ajax({
//         url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
//         headers: {
//            'Authorization': 'Bearer ' + accessToken
//         },
//         success: function(response) {
            
//             currTrackNum = response.items.findIndex(obj => obj.track.name==currTrackName);
//             addSong(user_id, playlist_id, track_id, currTrackNum+1); //add song after current song
//         },
//         error: function(xhr, status, error) 
//         {
//             alert(xhr.responseText);
//         }
//     });
// }

// //adds the song with the specificed track ID to the position after the current playing song (beginning of the playlist if no song is playing)
// function addSong(user_id, playlist_id, track_id, track_position)
// {
//     //POST request that adds the track specified by trackId to the 'Test Playlist'
//     $.post({
//         url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + partyPlaylist + '/tracks?uris=' + track_id + '&position=' + track_position,
//         headers: {
//             'Authorization': 'Bearer ' + accessToken
//         },
//         success: function(response) {
//             if(track_position != 0)
//             {
//                 alert("Song successfully added to queue.");
//             }
//             else
//             {
//                 alert("No song currently playing. Song added to beginning of playlist.");
//             }
//         },
//         //error code if POST fails
//         error: function(xhr, status, error) {
//             alert(xhr.responseText);
//         }
//     });
// }

function search(ele) {
    var query = ele.value;
        $.ajax({
           url: 'https://api.spotify.com/v1/search?type=track&query=' + query,
           headers: {
               'Authorization': 'Bearer ' + accessToken
           },
           success: function(response) {
                var resultsContainer = document.getElementById("results-container");
                while (resultsContainer.firstChild) {
                    resultsContainer.removeChild(resultsContainer.firstChild);
                }
                var table = document.createElement("table");
                for (var i = 0; i < response.tracks.items.length; i++) {
                    var row = document.createElement("tr");
                    var albumArt = document.createElement("td");
                    var albumImage = document.createElement("img");
                    var images = response.tracks.items[i].album.images;
                    albumImage.src = images[images.length - 1].url;
                    albumArt.appendChild(albumImage);
                    var nameData = document.createElement("td");
                    var internal = response.tracks.items[i].name + " - ";
                    for (var j = 0; j < response.tracks.items[i].artists.length; j++) {
                        internal += response.tracks.items[i].artists[j].name + ", ";
                    }
                    internal = internal.substring(0, internal.length - 2);
                    var trackID = "spotify:track:" + response.tracks.items[i].id;
                    nameData.innerHTML = internal;
                    var button = document.createElement("td");
                    button.innerHTML = "<button onclick=\"addSongToPartyPlaylist('" + trackID + "')\">Add</button>";
                    row.appendChild(albumArt);
                    row.appendChild(nameData);
                    row.appendChild(button);
                    table.appendChild(row);
                }
                document.getElementById("results-container").appendChild(table);
                // trackID = response.tracks.items[0]["id"];
                // alert("Attempting to add \"" + response.tracks.items[0]["name"] + "\" to queue.");
                // var rebuiltID = "spotify:track:" + trackID;
                // addSongToQueue(rebuiltID);
           }
        });
}

function getQueueTracks() {
      $.ajax({
           url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + partyPlaylist + '/tracks',
           headers: {
               'Authorization': 'Bearer ' + accessToken
           },
           success: function(response) {
               var list = document.getElementById('queue-list');
               for (var i = 0; i < response.items.length; i++) {
                   var song = response.items[i].track["name"];

                    var entry = document.createElement('li');
                    entry.appendChild(document.createTextNode(song));
                    list.appendChild(entry);
               }
           }
     });
}

// function populatePlaylists(user_id)
// {
//     $(document).ready(function() {
//         $.ajax({
//            url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists',
//            headers: {
//                'Authorization': 'Bearer ' + accessToken
//            },
//            success: function(response) {
//                 var i = 0;
//                 for(playlist in response.items)
//                 {   
//                     if(response.items[playlist]["public"] == true)
//                     {
//                         var playlistName = response.items[playlist]["name"];
//                         $('#playlist-selection').append($('<option></option>').val(playlistName).html(playlistName));
//                     }
//                     i++;
//                 }
//                 if(i == 0)
//                 {
//                     alert("No public playlists found for this user. Please add a public playlist to your Spotify account to make a party playlist.");   
//                 }
//            }
//         });
//     });
// }
