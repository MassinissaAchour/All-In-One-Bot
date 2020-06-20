const Discord = require('discord.js');
const config = require('./config.json');
const Sequelize = require('sequelize');

const client = new Discord.Client({
    token: config.token,
    autorun: true
});

// [alpha]
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});

// [beta]
const Tags = sequelize.define('tags', {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    description: Sequelize.TEXT,
    username: Sequelize.STRING,
    usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
});



client.on('ready', function () {
    console.log('Ready! ' + client.user.username + ' - (' + client.user.id + ')');
    Tags.sync();
});


client.on('message', async message => {
    if (message.content.startsWith(config.prefix)) {
        const input = message.content.slice(config.prefix.length).split(' ');
        const command = input.shift();
        const commandArgs = input.join(' ');

        if (command === 'addtag') {
            // [delta]
            const splitArgs = commandArgs.split(' ');
            const tagName = splitArgs.shift();
            const tagDescription = splitArgs.join(' ');

            try {
                // equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
                const tag = await Tags.create({
                    name: tagName,
                    description: tagDescription,
                    username: message.author.username,
                });
                return message.reply(`Tag ${tag.name} added.`);
            }
            catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError') {
                    return message.reply('That tag already exists.');
                }
                return message.reply('Something went wrong with adding a tag.');
            }
        } else if (command === 'tag') {
            // [epsilon]
            const tagName = commandArgs;

            // equivalent to: SELECT * FROM tags WHERE name = 'tagName' LIMIT 1;
            const tag = await Tags.findOne({ where: { name: tagName } });
            if (tag) {
                // equivalent to: UPDATE tags SET usage_count = usage_count + 1 WHERE name = 'tagName';
                tag.increment('usage_count');
                return message.channel.send(tag.get('description'));
            }
            return message.reply(`Could not find tag: ${tagName}`);
        } else if (command === 'edittag') {
            // [zeta]
            const splitArgs = commandArgs.split(' ');
            const tagName = splitArgs.shift();
            const tagDescription = splitArgs.join(' ');

            // equivalent to: UPDATE tags (descrption) values (?) WHERE name='?';
            const affectedRows = await Tags.update({ description: tagDescription }, { where: { name: tagName } });
            if (affectedRows > 0) {
                return message.reply(`Tag ${tagName} was edited.`);
            }
            return message.reply(`Could not find a tag with name ${tagName}.`);
        } else if (command === 'taginfo') {
            // [theta]
            const tagName = commandArgs;

            // equivalent to: SELECT * FROM tags WHERE name = 'tagName' LIMIT 1;
            const tag = await Tags.findOne({ where: { name: tagName } });
            if (tag) {
                return message.channel.send(`${tagName} was created by ${tag.username} at ${tag.createdAt} and has been used ${tag.usage_count} times.`);
            }
            return message.reply(`Could not find tag: ${tagName}`);
        } else if (command === 'showtags') {
            // [lambda]
            // equivalent to: SELECT name FROM tags;
            const tagList = await Tags.findAll({ attributes: ['name'] });
            const tagString = tagList.map(t => t.name).join(', ') || 'No tags set.';
            return message.channel.send(`List of tags: ${tagString}`);
        } else if (command === 'removetag') {
            // [mu]
            const tagName = commandArgs;
            // equivalent to: DELETE from tags WHERE name = ?;
            const rowCount = await Tags.destroy({ where: { name: tagName } });
            if (!rowCount) return message.reply('That tag did not exist.');

            return message.reply('Tag deleted.');
        }
    }
});

client.login(config.token);