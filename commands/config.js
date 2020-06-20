const Discord = require('discord.js');
const config = require('../config.json');
const help = require('../help.json');


exports.run = function(client, message, args, guildConfig, tools) {

    let command = args.shift().toLowerCase();

    if (command.toLowerCase() === "prefix")
        prefixCommand(message, args, guildConfig);
    else if (command.toLowerCase() === "name")
        nameCommand(message, args, guildConfig);
};


////////////////Commands/////////////////////

// prefix [prefix] : sets a new prefix for the bot (needs ADMINISTRATOR permission)
function prefixCommand(message, args, guildConfig) {
    if (!message.member.hasPermission('MANAGE_MESSAGES')){
        message.reply('You do not have the permissions to manage messages.');
        return;
    }

    guildConfig.prefix = args.shift().toLowerCase();
    guildConfig.save().then(() => {message.reply('The prefix for the bot has been changed to '+ guildConfig.prefix +'.');})
}

// name : prints the current name of the bot.
// name [bot name] : sets a new name to the bot (needs MANAGE_GUILD permission)
function nameCommand(message, args, guildConfig) {
    if (!message.member.hasPermission('MANAGE_GUILD')){
        message.reply('You do not have the permissions to manage messages.');
        return;
    }

    let name = args.join(' ');
    if (name === ''){
        message.reply("The current name of the bot is \'" + guildConfig.bot_name + '\'.');
    }else{
        guildConfig.bot_name = args.join(' ');
        guildConfig.save().then(() => {message.reply('The name of the bot has been changed to '+ guildConfig.bot_name +'.');});
    }
}
