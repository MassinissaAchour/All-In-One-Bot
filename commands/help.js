const Discord = require('discord.js');
const config = require('../config.json');
const help = require('../help.json');
const embeds = require('../embeds.js');

exports.run = function(client, message, args, guildConfig, tools) {

    // create an Embed message
    let exampleEmbed = embeds.simpleEmbed('#0099ff', guildConfig.bot_name, 'Multi-function bot', 'Help', help.bots, guildConfig);

    message.channel.send(exampleEmbed);
};
