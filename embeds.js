const Discord = require('discord.js');


function simpleEmbed(color, title, description, fieldTitle, fieldContent, guildConfig)
{
    return new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addField(fieldTitle, fieldContent)
        .setTimestamp()
        .setFooter(guildConfig.bot_name +' - by NA Locoboy', 'https://i.imgur.com/wSTFkRM.png');
}


function listPlayersEmbed(color, title, description, players, guildConfig)
{
    let embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter(guildConfig.bot_name + ' - by NA Locoboy', 'https://i.imgur.com/wSTFkRM.png');

    for ( let key in players){
        if ( players[key].nickname == null )
            embed.addField(players[key].author, players[key].ign + " ( " + players[key].tier + " " + players[key].rank + " )" );
        else
            embed.addField(players[key].nickname + " ( " + players[key].author + " )", players[key].ign + " ( " + players[key].tier + " " + players[key].rank + " )" );
    }
    return embed;
}

function listTeamsEmbed(color, title, description, teams, guildConfig)
{
    let embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter(guildConfig.bot_name + ' - by NA Locoboy', 'https://i.imgur.com/wSTFkRM.png');

    for ( let team in teams ){
        let teamRank = 0;
        let playersList = "";
        let sortedTeam = sortPlayers(teams[team]);
        for ( let player in sortedTeam ) {
            playersList += sortedTeam[player].ign + " ( " + sortedTeam[player].tier + " " + sortedTeam[player].rank + " )\n";
            teamRank += calcRankingPoints(sortedTeam[player]);
        }
        let points = Math.floor(teamRank / sortedTeam.length);
        let tier = Math.floor(points / Object.keys(Ranks).length);
        let rank = points % Object.keys(Ranks).length;

        embed.addField("Team " + (Number(team) + 1 ) + " (AVG RNK " + fromValueToTier(tier) + " " + fromValueToRank(rank) +  " )", playersList );
    }

    return embed;
}

module.exports.simpleEmbed = simpleEmbed;
module.exports.listPlayersEmbed = listPlayersEmbed;
module.exports.listTeamsEmbed = listTeamsEmbed;