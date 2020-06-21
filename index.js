const Discord = require('discord.js');
const config = require('./config.json');
const Sequelize = require('sequelize');

const client = new Discord.Client({
   token: config.token,
   autorun: true
});

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});


/////////// TABLES / ORM OBJECTS /////////////
const Configs = sequelize.define('configs', {
    id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        primaryKey: true
    },
    bot_name:  {
        type: Sequelize.STRING,
        defaultValue: "All In One Bot",
        allowNull: false,
    },
    prefix:  {
        type: Sequelize.STRING,
        defaultValue: "!",
        allowNull: false,
    },
    role_tournament:  {
        type: Sequelize.STRING,
        defaultValue: ""
    },
    role_music:  {
        type: Sequelize.STRING,
        defaultValue: ""
    }
});


client.on('ready', function () {
    Configs.sync().then(function () {
        client.guilds.cache.forEach( async function (guild) {
            const guildConfig = await Configs.findOne({ where: { id: guild.id } });
            if (!guildConfig) {
                try {
                    const config = await Configs.create({
                        id: guild.id
                    });
                    return console.log(`Guild config file created ${config.id} added.`);
                }
                catch (e) {
                    if (e.name === 'SequelizeUniqueConstraintError')
                        return console.log('That guild config already exists.');
                    return console.log('Something went wrong with adding a Guild config.');
                }
            }else{
                console.log('Connected to ' + guild.name + ' : ' + guild.memberCount + ' members.');
            }
        });
    });
    console.log('Ready! ' + client.user.username + ' - (' + client.user.id + ')');
});


// Message listener
// Redirects the message to the according bot functionality
client.on('message', async function (message) {
    const guildConfig = await Configs.findOne({ where: { id: message.guild.id } });

    let msg = message.content.toUpperCase(); //content
    let args = message.content.slice(guildConfig.prefix.length).trim().split(' ');

    let cmd = args.shift().toLowerCase();

    if(!msg.startsWith(guildConfig.prefix.toUpperCase())) return;
    if(message.author.bot) return;

    try{
        let commandFile = require('./commands/'+cmd+'.js');
        commandFile.run(client, message, args, guildConfig);
    }catch(e) {
        console.log(e.message);
    }finally {
        console.log(message.author.tag +' ran the command ' + cmd);
    }
});

// Turn on
client.login(config.token);
