const Discord = require('discord.js');
const config = require('../config.json');
const help = require('../help.json');

exports.run = function(client, message, args, tools) {

    // create an Embed message
    var exampleEmbed = simpleEmbed('#0099ff', config.bot_name, 'Multi-function bot', 'Help', help.bots);

    message.channel.send(exampleEmbed);
};

function simpleEmbed(color, title, description, fieldTitle, fieldContent)
{
    return  new Discord.RichEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addField(fieldTitle, fieldContent)
        .setTimestamp()
        .setFooter(config.bot_name +' - by Massinissa Achoru', 'https://i.imgur.com/wSTFkRM.png');
}