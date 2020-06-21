const Discord = require('discord.js');
const config = require('../config.json');
const help = require('../help.json');


exports.run = function(client, message, args, guildConfig, tools) {

    let command = args.shift().toLowerCase();

    if (command.toLowerCase() === "prefix")
        prefixCommand(message, args, guildConfig);
    else if (command.toLowerCase() === "name")
        nameCommand(client, message, args, guildConfig);
    else if (command.toLowerCase() === "role")
        roleCommand(client, message, args, guildConfig);
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
function nameCommand(client, message, args, guildConfig) {
    if (!message.member.hasPermission('MANAGE_GUILD')){
        message.reply('You do not have the permissions to manage messages.');
        return;
    }

    let name = args.join(' ');
    if (!name){
        message.reply("The current name of the bot is \'" + guildConfig.bot_name + '\'.');
    }else{
        guildConfig.bot_name = args.join(' ');
        message.guild.members.fetch(client.user.id).then(function(botGuildMember){
            botGuildMember.setNickname(guildConfig.bot_name).then();
        });
        guildConfig.save().then(() => {message.reply('The name of the bot has been changed to '+ guildConfig.bot_name +'.');});
    }
}

// role [music|tournament] [id] : prints the current name of the bot.
// role [music|tournament] : prints the current name of the bot.
function roleCommand(client, message, args, guildConfig) {
    if (!message.member.hasPermission('MANAGE_GUILD')){
        message.reply('You do not have the permissions to manage messages.');
        return;
    }
    let roleCommand = args.shift().toLowerCase();
    let id = args.shift();
    if (!id){
        let roleID = '';
        if (roleCommand === 'music')
            roleID = guildConfig.role_music;
        else if (roleCommand === 'tournament')
            roleID = guildConfig.role_tournament;
        message.guild.roles.fetch(roleID).then(function (role){
            message.reply('The admin role for the '+ roleCommand +' functionality is '+ role.name +'.');
        } );
    }else{
        message.guild.roles.fetch(id).then(function (role){
            if (roleCommand === 'music')
                guildConfig.role_music = role.id;
            else if (roleCommand === 'tournament')
                guildConfig.role_tournament = role.id;
            guildConfig.save().then(() => {message.reply('The admin role for the '+ roleCommand +' functionality has been changed to '+ role.name +'.');});
        } );
    }
}
