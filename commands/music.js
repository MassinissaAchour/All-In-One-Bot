const config = require('../config.json');
const help = require('../help.json');
const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const getYouTubeID = require("get-youtube-id");
const request = require("request");
const fetchVideoInfo = require("youtube-info");


var guilds = {};
var PlayMode = { "normal" : 0, "repeat" : 1, "playlist" : 2 };

// Music functionality

// Command listener
exports.run = function(client, message, args, tools) {

    if (!guilds[message.guild.id]) {
        guilds[message.guild.id] = {
            queue: [],
            queueNames: [],
            isPlaying: false,
            dispatcher: null,
            voiceChannel: null,
            skipReq: 0,
            skippers: [],
            playMode: PlayMode.normal
        };
    }
    var command = args.shift().toLowerCase();

    if (command.toLowerCase() === "play") {
        playCommand(message, args);
    }else if (command.toLowerCase() === "skip") {
        skipCommand(message);
    } else if (command.toLowerCase() === "queue") {
        queueCommand(message);
    } else if (command.toLowerCase() === "purge") {
       purgeCommand(message);
    } else if (command.toLowerCase() === "mode") {
        modeCommand(message);
    }else if( command.toLowerCase() === "disconnect" ){
        disconnectCommand(message);
    }else if( command.toLowerCase() === "help" ){
        helpCommand(message);
    }
};

////////////////Commands/////////////////////

// play [url/song name] : plays a song from a youtube URL or uses the search functionality on youtube with the song name
function playCommand(message, args) {
    if (message.member.voiceChannel || guilds[message.guild.id].voiceChannel != null) {
        if (guilds[message.guild.id].queue.length > 0 || guilds[message.guild.id].isPlaying) {
            getID(args, function (id, type) {
                if (type === 'id'){
                    guilds[message.guild.id].queue.push(id);
                    fetchVideoInfo(id, function (err, videoInfo) {
                        if (err) throw new Error(err);
                        message.reply(" added to queue: **" + videoInfo.title + "**");
                        guilds[message.guild.id].queueNames.push(videoInfo.title);
                    });
                }else if (type === 'playlist'){
                    playlistItemsListByPlaylistId(id, function(ids) {
                        for (var  i = 0 ; i < ids.length ; i++){
                            guilds[message.guild.id].queue.push(ids[i].id);
                            message.channel.send("Adding : **" + ids[i].title + "**");
                            guilds[message.guild.id].queueNames.push(ids[i].title);
                        }
                    });
                }
            });
        } else {
            guilds[message.guild.id].isPlaying = true;
            getID(args, function (id, type) {
                if (type === 'id'){
                    guilds[message.guild.id].queue.push(id);
                    playMusic(id, message);
                    fetchVideoInfo(id, function (err, videoInfo) {
                        if (err) throw new Error(err);
                        guilds[message.guild.id].queueNames.push(videoInfo.title);
                        message.reply(" now playing: **" + videoInfo.title + "**");
                    });
                }else if (type === 'playlist'){
                    playlistItemsListByPlaylistId(id, function(ids) {
                        for (var  i = 0 ; i < ids.length ; i++){
                            guilds[message.guild.id].queue.push(ids[i].id);

                            if ( i === 0 ){
                                playMusic(ids[i].id, message);
                                message.reply(" now playing: **" + ids[i].title + "**");
                            }else{
                                message.channel.send("Adding : **" + ids[i].title + "**");
                            }
                            guilds[message.guild.id].queueNames.push(ids[i].title);
                        }
                    });
                }
            });
        }
    } else {
        message.reply(" you need to be in a voice channel!");
    }
}

// skip : Votes to skip the current song. Majority needed. Admin skips without majority.
function skipCommand(message) {
    if (guilds[message.guild.id].skippers.indexOf(message.author.id) === -1) {
        guilds[message.guild.id].skippers.push(message.author.id);
        guilds[message.guild.id].skipReq++;
        if (guilds[message.guild.id].skipReq >= Math.ceil((guilds[message.guild.id].voiceChannel.members.array().length - 1) / 2)) {
            skip_song(message);
            message.reply(" your skip has been acknowledged. Skipping now!");
        }else if( hasMusicAdminPerms(message)){
            skip_song(message);
            message.reply(" your skip has been acknowledged as an Admin. Skipping now!");
        } else {
            var frac = Math.ceil((guilds[message.guild.id].voiceChannel.members.array().length - 1) / 2) - guilds[message.guild.id].skipReq;
            message.reply(" your skip has been acknowledged. You need " + frac + "  more skip votes!");
        }
    } else {
        message.reply(" you already voted to skip!");
    }
}

// queue : Shows the list of queued up songs.
function queueCommand(message) {
    if ( guilds[message.guild.id].voiceChannel == null ){
        message.reply(" The bot isn't connected to any channel.");
        return;
    }

    var message2 = "```";
    if (guilds[message.guild.id].queueNames.length === 0)
        message2 += " Empty queue ";

    for (var i = 0; i < guilds[message.guild.id].queueNames.length; i++) {
        var temp = (i + 1) + ": " + guilds[message.guild.id].queueNames[i] + (i === 0 ? "**(Current Song)**" : "") + "\n";
        if ((message2 + temp).length <= 2000 - 3) {
            message2 += temp;
        } else {
            message2 += "```";
            message.channel.send(message2);
            message2 = "```";
        }
    }
    message2 += "```";
    message.channel.send(message2);

    if ( guilds[message.guild.id].playMode === PlayMode.repeat ){
        message2 = "``` The song is currently on repeat ! ```";
        message.channel.send(message2);
    } else if ( guilds[message.guild.id].playMode === PlayMode.playlist ){
        message2 = "``` The queue is currently on repeat ! ```";
        message.channel.send(message2);
    }
}

// purge : purges the song queue.
function purgeCommand(message) {
    if ( guilds[message.guild.id].voiceChannel == null ){
        message.reply(" The bot isn't connected to any channel.");
        return;
    }

    guilds[message.guild.id].skipReq = 0;
    guilds[message.guild.id].skippers = [];
    guilds[message.guild.id].queue = [];
    guilds[message.guild.id].queueNames = [];
    guilds[message.guild.id].dispatcher.end();
    guilds[message.guild.id].isPlaying = false;

    message.channel.send("Queue purged !");
}

// mode [normal/repeat/playlist/] : Sets a reading mode for the queue.
function modeCommand(message) {
    var mode = args.shift().toLowerCase();
    if (mode.toLowerCase() === "repeat") {
        guilds[message.guild.id].playMode = PlayMode.repeat;
        message.reply(" changed the play mode to Repeat !");
    } else if (mode.toLowerCase() === "playlist") {
        guilds[message.guild.id].playMode = PlayMode.playlist;
        message.reply(" changed the play mode to Playlist !");
    } else if (mode.toLowerCase() === "normal") {
        guilds[message.guild.id].playMode = PlayMode.normal;
        message.reply(" changed the play mode to Queue !");
    }else{
        var msg = "";
        if ( guilds[message.guild.id].playMode === PlayMode.repeat )
            msg = "The song is currently on repeat mode !";
        else if ( guilds[message.guild.id].playMode === PlayMode.playlist )
            msg = "The queue is currently on repeat mode !";
        else if ( guilds[message.guild.id].playMode === PlayMode.normal )
            msg = "The queue is currently on normal mode !";
        msg += "\nPlease chose between repeat, playlist and normal.";
        message.reply(msg);
    }
}

// disconnect : Disconnects the bot from a voice channel.
function disconnectCommand(message) {
    if (guilds[message.guild.id].voiceChannel != null){
        guilds[message.guild.id].isPlaying = false;
        guilds[message.guild.id].dispatcher.end();
        guilds[message.guild.id].voiceChannel.leave();
        guilds[message.guild.id].voiceChannel = null;
    }else {
        message.reply(" The bot isn't connected to any channel.");
    }
}

// help : Shows the list of commands and a description.
function helpCommand(message) {
    // create an Embed message
    var exampleEmbed = simpleEmbed('#0099ff', config.bot_name, 'Music bot', 'Commands', help.music);
    message.channel.send(exampleEmbed);
}


////////////////Youtube API methods/////////////////////

function isYoutube(str){
    return str.toLowerCase().indexOf("youtube.com") > -1;
}

function isYoutubePlaylist(str){
    return str.toLowerCase().indexOf("youtube.com") > -1 && str.toLowerCase().indexOf("list=") > -1;
}

function skip_song(message) {
    guilds[message.guild.id].dispatcher.end();
}

function playMusic(id, message) {
    guilds[message.guild.id].voiceChannel = message.member.voiceChannel;

    guilds[message.guild.id].voiceChannel.join().then(function(connection) {
        if ( !guilds[message.guild.id].isPlaying )
            return;

        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        guilds[message.guild.id].skispReq = 0;
        guilds[message.guild.id].skippers = [];


        guilds[message.guild.id].dispatcher = connection.playStream(stream);
        guilds[message.guild.id].dispatcher.on('end', function() {
            guilds[message.guild.id].skipReq = 0;
            guilds[message.guild.id].skippers = [];
            //loop the playlist
            if ( guilds[message.guild.id].playMode === PlayMode.playlist ){
                var current = guilds[message.guild.id].queue.shift();
                var currentName = guilds[message.guild.id].queueNames.shift();
                guilds[message.guild.id].queue.push(current);
                guilds[message.guild.id].queueNames.push(currentName);
                setTimeout(function() {
                    playMusic(guilds[message.guild.id].queue[0], message);
                }, 1000);
            }else if( guilds[message.guild.id].playMode === PlayMode.repeat ){
                setTimeout(function() {
                    playMusic(guilds[message.guild.id].queue[0], message);
                }, 1000);
            }else{
                guilds[message.guild.id].queue.shift();
                guilds[message.guild.id].queueNames.shift();
                if (guilds[message.guild.id].queue.length === 0) {
                    guilds[message.guild.id].queue = [];
                    guilds[message.guild.id].queueNames = [];
                    guilds[message.guild.id].isPlaying = false;
                } else {
                    setTimeout(function() {
                        playMusic(guilds[message.guild.id].queue[0], message);
                    }, 1000);
                }
            }
        });
    });
}

function getID(str, cb) {
    if( isYoutubePlaylist(str[0]) ){
        cb(getYouTubePlaylistID(str[0]), 'playlist');
    }else if (isYoutube(str[0]) ) {
        cb(getYouTubeID(str), 'id');
    } else {
        search_video(str, function(id) {
            cb(id, 'id');
        });
    }
}

function getYouTubePlaylistID(str){
    return str.substring(str.indexOf("list=") + 5);
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + config.yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        if (!json.items[0]) callback("3_-a9nVZYjk");
        else {
            callback(json.items[0].id.videoId);
        }
    });
}

function playlistItemsListByPlaylistId(playlistID, callback) {
    var list = [];
    request("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails" +
        "&maxResults=25" +
        "&playlistId=" + playlistID + "&key=" + config.yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        if (!json.items[0]) list.push("3_-a9nVZYjk");
        else {
            for (var  i = 0 ; i < json.items.length ; i++)
                list.push({id : json.items[i].contentDetails.videoId, title : json.items[i].snippet.title});
        }
        callback(list);
    });

}

function simpleEmbed(color, title, description, fieldTitle, fieldContent)
{
    return  new Discord.RichEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addField(fieldTitle, fieldContent)
        .setTimestamp()
        .setFooter(config.bot_name +' - by NA Locoboy', 'https://i.imgur.com/wSTFkRM.png');
}


function hasMusicAdminPerms(message) {
    for (var  i = 0 ; i < config.roles_music_admins.length ; i++)
        if ( message.member.roles.find('id', config.roles_music_admins[i]) != null )
            return true;
    return false;
}