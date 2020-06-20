const config = require('../config.json');
const help = require('../help.json');
const Discord = require('discord.js');
const ytdlDiscord = require("ytdl-core-discord");
const Sounds = require('../soundeffects.json');


let guilds = {};

// Soundboard functionality

// Command listener
exports.run = function(client, message, args, guildConfig, tools) {

    if (!guilds[message.guild.id]) {
        guilds[message.guild.id] = {
            queue: [],
            isPlaying: false,
            dispatcher: null,
            voiceChannel: null
        };
    }

    let command = args.shift().toLowerCase();

    if( command === "help" ){
        helpCommand(message);
    }else if( command === "list" ){
        listCommand(message);
    }else if(command === "play"){
        playCommand(message, args);

    }
};

////////////////Commands/////////////////////

// play [sound name] : plays a sound from the soundboard
function playCommand(message, args) {
    if (message.member.voice.channel || guilds[message.guild.id].voiceChannel != null) {
        let soundName = args.join(' ').toLowerCase();

        if (guilds[message.guild.id].queue.length > 0 || guilds[message.guild.id].isPlaying) {
            if( soundName in Sounds )
                guilds[message.guild.id].queue.push(Sounds[soundName]);
            else
                message.reply(" no sound effect found !");
        }else{
            if( soundName in Sounds ){
                guilds[message.guild.id].isPlaying = true;
                guilds[message.guild.id].queue.push(Sounds[soundName]);
                playSound(Sounds[soundName], message);
            } else {
                message.reply(" no sound effect found !");
            }
        }
    } else {
        message.reply(" you need to be in a voice channel!");
    }
}


// list : Shows the list of available sound bits.
function listCommand(message){
    // create an Embed message
    let list = "";
    for ( let soundName in Sounds){
        list += soundName + "\n";
    }

    let exampleEmbed = simpleEmbed('#0099ff', config.bot_name, 'Soundboard bot', 'Sounds', list);
    message.channel.send(exampleEmbed);
}

// help : Shows the list of commands and a description.
function helpCommand(message) {
    // create an Embed message
    let exampleEmbed = simpleEmbed('#0099ff', config.bot_name, 'Soundboard bot', 'Commands', help.soundboard);
    message.channel.send(exampleEmbed);
}


////////////////Youtube API methods/////////////////////

function playSound(id, message) {
    guilds[message.guild.id].voiceChannel = message.member.voice.channel;

    guilds[message.guild.id].voiceChannel.join().then(async function(connection) {
        if ( !guilds[message.guild.id].isPlaying )
            return;

        stream = await ytdlDiscord("https://www.youtube.com/watch?v=" + id, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        guilds[message.guild.id].dispatcher = connection.play(stream, { type: 'opus' });
        guilds[message.guild.id].dispatcher.on('finish', function() {
            guilds[message.guild.id].queue.shift();
            if (guilds[message.guild.id].queue.length === 0) {
                guilds[message.guild.id].queue = [];
                guilds[message.guild.id].isPlaying = false;
                guilds[message.guild.id].dispatcher.end();
                guilds[message.guild.id].voiceChannel.leave();
                guilds[message.guild.id].voiceChannel = null;
            } else {
                setTimeout(function() {
                    playSound(guilds[message.guild.id].queue[0], message);
                }, 50);
            }
        });
    });
}


function simpleEmbed(color, title, description, fieldTitle, fieldContent)
{
    return  new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addField(fieldTitle, fieldContent)
        .setTimestamp()
        .setFooter(config.bot_name +' - by NA Locoboy', 'https://i.imgur.com/wSTFkRM.png');
}