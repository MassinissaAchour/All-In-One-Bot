const Discord = require('discord.js');
const config = require('./config.json');

const client = new Discord.Client({
   token: config.token,
   autorun: true
});

client.on('ready', function () {
    console.log('Ready! ' + client.user.username + ' - (' + client.user.id + ')');
});


// Message listener
// Redirects the message to the according bot functionality
client.on('message', function (message) {

    var msg = message.content.toUpperCase(); //content
    var args = message.content.slice(config.prefix.length).trim().split(' ');

    var cmd = args.shift().toLowerCase();

    if(!msg.startsWith(config.prefix.toUpperCase())) return;
    if(message.author.bot) return;

    try{
        var commandFile = require('./commands/'+cmd+'.js');
        commandFile.run(client, message, args);
    }catch(e) {
        console.log(e.message);
    }finally {
        console.log(message.author.tag +' ran the command ' + cmd);
    }
});

// Turn on
client.login(config.token);
