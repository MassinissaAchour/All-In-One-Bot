const genius = require('genius-lyrics-api');
const Discord = require('discord.js');
const config = require('../config.json');
const help = require('../help.json');
const embeds = require('../embeds.js');



exports.run = function(client, message, args, guildConfig, tools) {
    let options = {
        apiKey: config.genius_api,
        title: args,
        artist: '',
        optimizeQuery: true
    };

    genius.searchSong(options).then(function(searchResult){
        let id = searchResult[0].id;
        genius.getSongById(id, config.genius_api).then(function(song){
            genius.getLyrics(song.url).then(function(lyrics){
                lyrics = splitter(lyrics, 1000);
                let embedMessage = embeds.simpleEmbed('#0099ff', guildConfig.bot_name, 'Karaoke bot', searchResult[0].title , lyrics[0], song.albumArt, guildConfig);

                for(let i = 0 ; i < lyrics.length ; i++){
                    if (i === 0)
                        continue;
                    embedMessage.addField('-', lyrics[i]);
                }

                message.channel.send(embedMessage);
            }).catch(function(e) {
                console.error(e.message);
            });
        }).catch(function(e) {
            console.error(e.message);
        });
    }).catch(function(e) {
        console.error(e.message);
    });
};

function splitter(str, l){
    let strs = [];
    while(str.length > l){
        let pos = str.substring(0, l).lastIndexOf(' ');
        pos = pos <= 0 ? l : pos;
        strs.push(str.substring(0, pos));
        let i = str.indexOf(' ', pos)+1;
        if(i < pos || i > pos+l)
            i = pos;
        str = str.substring(i);
    }
    strs.push(str);
    return strs;
}