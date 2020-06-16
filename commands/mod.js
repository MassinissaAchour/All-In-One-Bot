const Discord = require('discord.js');
const config = require('../config.json');
const help = require('../help.json');


exports.run = function(client, message, args, tools) {


    //pull the command
    let command = args.shift().toLowerCase();

    if (command.toLowerCase() === "purge") {
        purgeCommand(message);
    }

};

// purge [amount][@mention] : removes X messages in the text channel by a specific member.
// purge [amount] : removes X messages in the text channel.
// purge [@mention] : removes the last 100 messages by a specific member in the text channel.
// purge : removes the last 100 messages in the text channel.
function purgeCommand(message) {
    if (!message.member.hasPermission('MANAGE_MESSAGES')){
        message.reply('You do not have the permissions to manage messages.');
        return;
    }

    let user = message.mentions.users.first();
    if (!user && message.mentions.roles.first()){
        message.reply('Please mention a user. Not a role or bot.');
        return;
    }

    // Parse Amount
    const amount = !!parseInt(message.content.split(' ')[1]) ? parseInt(message.content.split(' ')[1]) : parseInt(message.content.split(' ')[2]);

    // Get messages and filter by user ID
    message.channel.messages.fetch({ limit: 100 }).then(function(messages){
        if (user){
            const msgFilter = function (m) { return m.author.id === user.id };
            messages = messages.filter(msgFilter);
        }
        if (amount)
            messages = messages.array().slice(0, amount);
        message.channel.bulkDelete(messages).catch(function(error){
            //message.reply('Messages older than 14 days cannot be deleted in bulk. (Discord won\'t let that happen)');
            messages.forEach(function(message){message.delete();});
            console.log(error.stack)
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
        .setFooter(config.bot_name +' - by Massinissa Achoru', 'https://i.imgur.com/wSTFkRM.png');
}