const Discord = require('discord.js');
const config = require('../config.json');
const help = require('../help.json');


exports.run = function(client, message, args, guildConfig, tools) {

    //pull the command
    let command = args.shift().toLowerCase();

    if (command.toLowerCase() === "joined")
        joinedCommand(message);
    else if (command.toLowerCase() === "members")
        membersCommand(message);


};

// joined [@memtion] : Prints the join date of a mentioned member.
function joinedCommand(message) {
    let user = message.mentions.users.first();

    if ( user != null ){
        message.reply("Joined : " + message.guild.members.cache.get(user.id).joinedAt );
        return;
    }
    message.reply("Couldn't find the user" );

}

// members : Prints the amount of members on the server.
function membersCommand(message) {
    message.reply("There are " + message.guild.members.cache.array().length + " members on the server.");
}
