const Discord = require('discord.js');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const config = require('../config.json');
const help = require('../help.json');

var guilds = {};

var Tiers = {"UNRANKED" : 0, "BRONZE": 0, "SILVER": 1, "GOLD": 2, "PLATINUM" : 3, "DIAMOND" : 4, "MASTER" : 5, "GRANDMASTERMASTER" : 6, "CHALLENGER" : 7};
Object.freeze(Tiers);

var Ranks = {"I": 3, "II": 2, "III": 1, "IV" : 0};
Object.freeze(Ranks);

var Regions = {"na" : 'na1', "euw" : 'euw1', "eune": 'eun1', "jp": 'jp1', "kr": 'kr1', "lan" : 'la1', "las" : 'la2', "oce" : 'oc1', "tr" : 'tr1', "ru" : 'ru1'};
Object.freeze(Regions);


// Tournament functionality

// Command listener
exports.run = function(client, message, args, tools) {

    //init the list of servers that the bot is connected
    if (!guilds[message.guild.id]) {
        guilds[message.guild.id] = {
            nbTeams : null,
            nbPlayersPerTeam : null,
            registration : false,
            players : [],
            unverifiedPlayers : [],
            teams : [],
            msgCollectors : [],
            channel : null
        };
    }

    //pull the command
    var command = args.shift().toLowerCase();

    if (command.toLowerCase() === "start") {
        startCommand(message, args);
    }else if (command.toLowerCase() === "cancel"){
        cancelCommand(message);
    }else if (command.toLowerCase() === "register"){
        registerCommand(message, args);
    }else if (command.toLowerCase() === "unregister"){
        unregisterCommand(message, args);
    }else if (command.toLowerCase() === "registered"){
        registeredCommand(message);
    }else if (command.toLowerCase() === "status"){
        statusCommand(message);
    }else if( command.toLowerCase() === "help" ){
        helpCommand(message);
    }
};

////////////////Commands/////////////////////

// start nbTeams] [nbPlayersPerTeam] : Starts a tournament with the specified size.
function startCommand(message, args) {
    if ( !hasTournamentPerms(message) ){
        message.reply("You do not have the permissions to do this. Please contact a Technician !");
        return;
    }

    //pull args
    guilds[message.guild.id].nbTeams = args.shift();
    guilds[message.guild.id].nbPlayersPerTeam = args.shift();
    guilds[message.guild.id].channel = message.channel;


    //verify args
    if ( guilds[message.guild.id].nbTeams != null && guilds[message.guild.id].nbPlayersPerTeam != null ) {
        if ( isNaN(guilds[message.guild.id].nbTeams) || isNaN(guilds[message.guild.id].nbPlayersPerTeam)) {
            message.reply("Arguments have to be numbers.");
            return;
        }
    }else{
        message.reply("Missing arguments. Command : start nbTeams nbPlayersPerTeam");
        return;
    }

    if ( guilds[message.guild.id].registration ){
        message.reply("There is already a tournament running on this server. Please cancel it before creating a new one.");
        return;
    }

    //start the registrations
    guilds[message.guild.id].registration = true;
    //reset the tournament
    guilds[message.guild.id].players = [];
    guilds[message.guild.id].unverifiedPlayers = [];
    guilds[message.guild.id].teams = [];
    guilds[message.guild.id].msgCollectors = [];

    // create an Embed message
    var exampleEmbed = simpleEmbed('#0099ff', 'Inhouse', 'Small scale tournament', 'Registrations', "The registration process has started." +
        " We are waiting for " + (guilds[message.guild.id].nbPlayersPerTeam * guilds[message.guild.id].nbTeams) + " players to register." +
        " To enter the inhouse please type the command " + config.prefix + "tournament register <YOUR-REGION> <YOUR-IGN>." +
        " Please use the IGN of your highest ranked account even if you're not going to play on it.");

    //send the message, react to it, wait for reactions.
    message.channel.send(exampleEmbed).then(onReaction);
}

// cancel : Cancels the current tournament.
function cancelCommand(message) {
    if ( !hasTournamentPerms(message) ){
        message.reply("You do not have the permissions to do this. Please contact a Technician !");
        return;
    }

    guilds[message.guild.id].nbTeams = null;
    guilds[message.guild.id].nbPlayersPerTeam = null;
    guilds[message.guild.id].players = [];
    guilds[message.guild.id].unverifiedPlayers = [];
    guilds[message.guild.id].teams = [];
    guilds[message.guild.id].registration = false;

    for (var key in guilds[message.guild.id].msgCollectors )
        guilds[message.guild.id].msgCollectors[key].stop();
    guilds[message.guild.id].msgCollectors = [];

    message.channel.send("The tournament has been canceled.");
}

// register [REGION] [IGN] : Registers you to the tournament and associates you to your League Of Legends account.
function registerCommand(message, args) {
    var region = args.shift();
    var ign = args.join(' ');

    if( region == null || ign == null ){
        message.reply("Missing arguments. Please enter your Region and IGN.");
        return;
    }

    //try to register the player
    register(ign, region, message, message.guild);
}

// unregister : Unregisters you from the current tournament.
// (Admin) unregister [ign] : Unregisters the player from the current tournament.
function unregisterCommand(message, args) {
    //fuse args to make IGN
    var ign = args.shift();
    var arg;
    while ( (arg = args.shift()) != null ){
        ign += " " + arg;
    }
    if ( ign != null ){
        for ( var key in guilds[message.guild.id].players){
            if( guilds[message.guild.id].players[key].author === ign || guilds[message.guild.id].players[key].ign === ign){
                guilds[message.guild.id].players.splice(key, 1);
                message.reply("Unregistered");

                if ( guilds[message.guild.id].registration === false ) {
                    guilds[message.guild.id].registration = true;
                    message.channel.send("Registrations have been reopened !");
                }
                return;
            }
        }
        message.reply("This user is not registered");
    }else{
        for ( var key in guilds[message.guild.id].players){
            if( guilds[message.guild.id].players[key].author === message.author.tag ){
                guilds[message.guild.id].players.splice(key, 1);
                message.reply("Unregistered");

                if ( guilds[message.guild.id].registration === false ) {
                    guilds[message.guild.id].registration = true;
                    message.channel.send("Registrations have been reopened !");
                }

                return;
            }
        }

        for ( var key in guilds[message.guild.id].unverifiedPlayers) {
            if (guilds[message.guild.id].unverifiedPlayers[key].author === message.author.tag) {
                guilds[message.guild.id].unverifiedPlayers.splice(key, 1);
                message.reply("You have been removed from the unverified players list.");
                return;
            }
        }
        message.reply("You are not registered.");
    }
}

// registered : Shows the list of the currently registered players.
function registeredCommand(message) {
    var playerListEmbed = listPlayersEmbed('#0099ff', 'Registrations', 'List of registered players', sortPlayers(guilds[message.guild.id].players));
    guilds[message.guild.id].channel.send(playerListEmbed);
}

// status : Shows the status of the tournament (open/closed and how many players are registered/how many left to complete).
function statusCommand(message) {
    if ( !guilds[message.guild.id].registration ){
        message.reply("Registrations are closed.");
        return;
    }
    var print = "Players : " + guilds[message.guild.id].players.length + "/" + (guilds[message.guild.id].nbPlayersPerTeam * guilds[message.guild.id].nbTeams) ;
    message.channel.send(print);
}

// help : Shows the list of commands and a description.
function helpCommand(message) {
    // create an Embed message
    var exampleEmbed = simpleEmbed('#0099ff', config.bot_name, 'Tournament bot', 'Commands', help.tournament);
    message.channel.send(exampleEmbed);
}




////////////////NEED TO DOCUMENT THIS MORE/////////////////////

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onerror = function(error) {
        console.log(error.toString())
    };

    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send();
    return xmlHttp.responseText;
}

function simpleEmbed(color, title, description, fieldTitle, fieldContent)
{
    var embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addField(fieldTitle, fieldContent)
        .setTimestamp()
        .setFooter(config.bot_name +' - by NA Locoboy', 'https://i.imgur.com/wSTFkRM.png');
    return embed
}

function listTeams(guild){
    var teamsEmbed = listTeamsEmbed('#0099ff', 'Matchmaking', 'The teams', guilds[guild.id].teams);
    guilds[guild.id].channel.send(teamsEmbed);
}

function listPlayersEmbed(color, title, description, players)
{
    var embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter(config.bot_name + ' - by NA Locoboy', 'https://i.imgur.com/wSTFkRM.png');

    for ( var key in players){
        if ( players[key].nickname == null )
            embed.addField(players[key].author, players[key].ign + " ( " + players[key].tier + " " + players[key].rank + " )" );
        else
            embed.addField(players[key].nickname + " ( " + players[key].author + " )", players[key].ign + " ( " + players[key].tier + " " + players[key].rank + " )" );
    }
    return embed;
}

function listTeamsEmbed(color, title, description, teams)
{
    var embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter(config.bot_name + ' - by NA Locoboy', 'https://i.imgur.com/wSTFkRM.png');

    for ( var team in teams ){
        var teamRank = 0;
        var playersList = "";
        var sortedTeam = sortPlayers(teams[team]);
        for ( var player in sortedTeam ) {
            playersList += sortedTeam[player].ign + " ( " + sortedTeam[player].tier + " " + sortedTeam[player].rank + " )\n";
            teamRank += calcRankingPoints(sortedTeam[player]);
        }
        var points = Math.floor(teamRank / sortedTeam.length);
        var tier = Math.floor(points / 5);
        var rank = points % 5;

        embed.addField("Team " + (Number(team) + 1 ) + " (AVG RNK " + fromValueToTier(tier) + " " + fromValueToRank(rank) +  " )", playersList );
    }

    return embed;
}

function onReaction (registrationMessage) {
    const filter = function (reaction, user) {
        return ['👍'].includes(reaction.emoji.name) && !user.bot ;
    };

    registrationMessage.react("👍");
    var collector = registrationMessage.createReactionCollector(filter, { time: 1800000 });
    collector.on('collect', function (reaction, collector) {
        //check if registrations are open
        if ( !guilds[registrationMessage.guild.id].registration ){
            return;
        }

        var user = reaction.users.last();

        //check if the player is registered
        if ( isRegistered(registrationMessage.guild, user) )
            return;

        //check if the player is waiting for registeration confirmation
        if ( isUnverified(registrationMessage.guild, user ) ){
            user.send("You are already on the unverified list. Please enter your IGN to register.");
            return;
        }

        //pull out his nickname
        var nickname = registrationMessage.guild.members.get(user.id).nickname;

        //push the player in the unverified players list
        guilds[registrationMessage.guild.id].unverifiedPlayers.push({author : user.tag, nickname : nickname});

        //send him a DM and wait for an answer
        user.send("Please enter the region of your highest ranked account followed by the IGN (ex : NA Acorntopper). You have 1 minute.").then(function (askIgnMsg) {
            onDM(askIgnMsg, registrationMessage, user)
        });
    });
}

function onDM(askIgnMsg, registrationMessage, user) {
    const msgFilter = function (m) { return true };
    const msgCollector = askIgnMsg.channel.createMessageCollector(msgFilter, { time: 60000 });

    msgCollector.on('collect', function (msg) {
        if ( msg.author === askIgnMsg.author)
            return;

        // separate region and ign
        var message = msg.content.trim().split(' ');
        var region = message.shift();
        var ign = message.join(' ');

        //try to register him
        if ( register( ign, region, msg, registrationMessage.guild ) )
            msgCollector.stop();
    });

    msgCollector.on('end', function (collected) {
        if ( !isRegistered(registrationMessage.guild, user) ){
            if ( !guilds[registrationMessage.guild.id].registration ){
                user.send("Registrations have been closed.")
            }else{
                //remove from unverified players list if found
                for ( var key in guilds[registrationMessage.guild.id].unverifiedPlayers)
                    if (guilds[registrationMessage.guild.id].unverifiedPlayers[key].author === user.tag)
                        guilds[registrationMessage.guild.id].unverifiedPlayers.splice(key, 1);
                user.send("Delay ended. You have been removed from the unverified players list.")
            }
        }
    });
    guilds[registrationMessage.guild.id].msgCollectors.push(msgCollector);
}


function register(ign, region, message, guild)
{
    //check if registrations are open
    if ( !guilds[guild.id].registration ){
        message.reply("Registrations are closed.");
        return;
    }

    for ( var key in guilds[guild.id].players){
         if( guilds[guild.id].players[key].author === message.author.tag ){
             message.reply("You have already been registered.");
             return false;
         }else
            if ( guilds[guild.id].players[key].ign === ign ){
            message.reply("That IGN has already been registered.");
            return false;

        }
    }

    //chose region
    var regionName = regionSelect(region);

    // check ign and rank
    var result = httpGet('https://' + regionName + '.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + encodeURIComponent(ign) + '?api_key=' + config.riot_api_key);
    var player = JSON.parse( result );

    if ( player.id === undefined ){
        message.reply("Account not found.");
        return false;
    }

    result = httpGet('https://' + regionName + '.api.riotgames.com/lol/league/v4/entries/by-summoner/' + player.id + '?api_key=' + config.riot_api_key);
    var queues = JSON.parse( result );

    var rank = "V";
    var tier = "UNRANKED";

    for (var key in queues ){
        if ( queues[key].queueType === 'RANKED_SOLO_5x5' ){
            rank = queues[key].rank;
            tier = queues[key].tier;
        }
    }

    var nickname = guild.members.get(message.author.id).nickname;

    //remove from unverified players list if found
    for ( var key in guilds[guild.id].unverifiedPlayers)
        if (guilds[guild.id].unverifiedPlayers[key].author === message.author.tag)
            guilds[guild.id].unverifiedPlayers.splice(key, 1);


    guilds[guild.id].players.push({author : message.author.tag, nickname : nickname, ign : ign, tier : tier, rank : rank});

    message.reply("You have successfully been registered as " + ign + ".");

    if ( guilds[guild.id].players.length === guilds[guild.id].nbPlayersPerTeam * guilds[guild.id].nbTeams ){
        guilds[guild.id].channel.send("Registrations complete !");
        guilds[guild.id].registration = false;
        guilds[guild.id].unverifiedPlayers = [];

        for (var key in guilds[guild.id].msgCollectors )
            guilds[guild.id].msgCollectors[key].stop();
        guilds[guild.id].msgCollectors = [];

        var teams = matchmake(guilds[guild.id].players, guilds[guild.id].nbTeams, guilds[guild.id].nbPlayersPerTeam);
        guilds[guild.id].teams = teams;

        for ( var team in teams ){
            console.log(teams[team]);
        }

        listTeams(guild);

    }
    return true;
}

function isRegistered(guild, user ){
    for ( var key in guilds[guild.id].players)
        if( guilds[guild.id].players[key].author === user.tag )
            return true;
    return false
}

function isUnverified(guild, user){
    for ( var key in guilds[guild.id].unverifiedPlayers)
        if( guilds[guild.id].unverifiedPlayers[key].author === user.tag )
            return true;
    return false;
}

function calcRankingPoints(player){
    var points = Tiers[player.tier] * 4 + Ranks[player.rank];
    if ( Tiers[player.tier] === Tiers.CHALLENGER)
        points -= 8;
    else if ( Tiers[player.tier] === Tiers.GRANDMASTERMASTER)
        points -= 4;
    else if ( Tiers[player.tier] === Tiers.MASTER)
        points -= 4;
    return points;
}

function fromValueToTier(tier){
    var tierName = "";
    Object.keys(Tiers).some(function (k) {
        if (Tiers[k] === tier) {
            tierName = k.toString();
            return true;
        }
    });
    return tierName;

}

function fromValueToRank(rank){
    var rankName = "";
    Object.keys(Ranks).some(function (k) {
        if (Ranks[k] === rank) {
            rankName = k.toString();
            return true;
        }
    });
    return rankName;
}

function sortPlayers(players) {
    return players.sort(function(a, b){
        return calcRankingPoints(b) - calcRankingPoints(a);
    });
}

function regionSelect(region){
    var regionName = 'na1';

    if (Regions[region.toLowerCase()] != null)
        return Regions[region.toLowerCase()];

    return regionName;
}

function hasTournamentPerms(message) {
    for (var  i = 0 ; i < config.roles_tournament.length ; i++)
        if ( message.member.roles.find('id', config.roles_tournament[i]) != null )
            return true;
    return false;
}

function matchmake(players, nbTeams, nbPlayersPerTeam) {
    console.log("Matchmaking Started : ");

    players = sortPlayers(players);

    var teams = [];
    for(var j = 0; j < nbTeams; j++) {
        teams.push([]);
    }

    var left = true;
    var leftPerTeam = nbPlayersPerTeam;
    //var twoByTwo = true;

    var i = 0;

    console.log("Need to fill : " + leftPerTeam + " players per team.");
    while ( leftPerTeam >= 0 ){

        if ( leftPerTeam === 0 ){
            console.log("DONE");
            return teams;
        }

        console.log("Left to fill : " + leftPerTeam + " players per team.");

        console.log("ENTERED one by one :" + teams.length);
        if ( left ){
            for ( var team in teams ){
                console.log("Placed");
                teams[team].push(players[i]);
                i++;
            }
        }else{
            for ( var team in teams ){
                console.log("Placed");
                teams[teams.length - 1 - team].push(players[i]);
                i++;
            }
        }
        console.log("minus one");
        leftPerTeam -= 1;
        left = !left;
    }
    return [];

}