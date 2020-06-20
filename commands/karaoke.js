const genius = require('genius-lyrics-api');
const Discord = require('discord.js');
const config = require('../config.json');
const help = require('../help.json');



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
                let embedMessage = simpleEmbed('#0099ff', config.bot_name, 'Karaoke bot', searchResult[0].title , lyrics, song.albumArt);
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

function simpleEmbed(color, title, description, fieldTitle, fieldContents, imageURL)
{
    let embed =  new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addField(fieldTitle, fieldContents[0])
        .setImage(imageURL)
        .setTimestamp()
        .setFooter(config.bot_name +' - by Massinissa Achour', 'https://i.imgur.com/wSTFkRM.png');

    for(let i = 0 ; i < fieldContents.length ; i++){
        if (i === 0)
            continue;
        embed.addField('-', fieldContents[i]);
    }
    return embed;
}

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