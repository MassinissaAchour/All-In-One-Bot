const Discord = require('discord.js');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const config = require('../config.json');
const help = require('../help.json');
const embeds = require('../embeds.js');

let guilds = {};

let Tiers = {"UNRANKED" : 0, "IRON": 0, "BRONZE": 1, "SILVER": 2, "GOLD": 3, "PLATINUM" : 4, "DIAMOND" : 5, "MASTER" : 6, "GRANDMASTERMASTER" : 7, "CHALLENGER" : 8};
Object.freeze(Tiers);

let Ranks = {"I": 3, "II": 2, "III": 1, "IV" : 0};
Object.freeze(Ranks);

let Regions = {"na" : 'na1', "euw" : 'euw1', "eune": 'eun1', "jp": 'jp1', "kr": 'kr1', "lan" : 'la1', "las" : 'la2', "oce" : 'oc1', "tr" : 'tr1', "ru" : 'ru1'};
Object.freeze(Regions);


// Tournament functionality

// Command listener
exports.run = function(client, message, args, guildConfig, tools) {

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
    let command = args.shift().toLowerCase();

    if (command.toLowerCase() === "start") {
        startCommand(message, args, guildConfig);
    }else if (command.toLowerCase() === "cancel"){
        cancelCommand(message, guildConfig);
    }else if (command.toLowerCase() === "register"){
        registerCommand(message, args, guildConfig);
    }else if (command.toLowerCase() === "unregister"){
        unregisterCommand(message, args);
    }else if (command.toLowerCase() === "registered"){
        registeredCommand(message, guildConfig);
    }else if (command.toLowerCase() === "status"){
        statusCommand(message);
    }else if( command.toLowerCase() === "help" ){
        helpCommand(message, guildConfig);
    }
};

////////////////Commands/////////////////////

// start nbTeams] [nbPlayersPerTeam] : Starts a tournament with the specified size.
function startCommand(message, args, guildConfig) {
    if ( !hasTournamentPerms(message, guildConfig) ){
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
    let exampleEmbed = embeds.simpleEmbed('#0099ff', 'Inhouse', 'Small scale tournament', 'Registrations', "The registration process has started." +
        " We are waiting for " + (guilds[message.guild.id].nbPlayersPerTeam * guilds[message.guild.id].nbTeams) + " players to register." +
        " To enter the inhouse please type the command " + guildConfig.prefix + "tournament register <YOUR-REGION> <YOUR-IGN>." +
        " Please use the IGN of your highest ranked account even if you're not going to play on it.", guildConfig);

    //send the message, react to it, wait for reactions.
    message.channel.send(exampleEmbed).then(onReaction);
}

// cancel : Cancels the current tournament.
function cancelCommand(message, guildConfig) {
    if ( !hasTournamentPerms(message, guildConfig) ){
        message.reply("You do not have the permissions to do this. Please contact a Technician !");
        return;
    }

    guilds[message.guild.id].nbTeams = null;
    guilds[message.guild.id].nbPlayersPerTeam = null;
    guilds[message.guild.id].players = [];
    guilds[message.guild.id].unverifiedPlayers = [];
    guilds[message.guild.id].teams = [];
    guilds[message.guild.id].registration = false;

    for (let key in guilds[message.guild.id].msgCollectors )
        guilds[message.guild.id].msgCollectors[key].stop();
    guilds[message.guild.id].msgCollectors = [];

    message.channel.send("The tournament has been canceled.");
}

// register [REGION] [IGN] : Registers you to the tournament and associates you to your League Of Legends account.
function registerCommand(message, args, guildConfig) {
    let region = args.shift();
    let ign = args.join(' ');

    if( region == null || ign == null ){
        message.reply("Missing arguments. Please enter your Region and IGN.");
        return;
    }

    //try to register the player
    register(ign, region, message, message.guild, guildConfig);
}

// unregister : Unregisters you from the current tournament.
// (Admin) unregister [ign] : Unregisters the player from the current tournament.
function unregisterCommand(message, args) {
    //fuse args to make IGN
    let ign = args.shift();
    let arg;
    while ( (arg = args.shift()) != null ){
        ign += " " + arg;
    }
    if ( ign != null ){
        for ( let key in guilds[message.guild.id].players){
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
        for ( let key in guilds[message.guild.id].players){
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

        for ( let key in guilds[message.guild.id].unverifiedPlayers) {
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
function registeredCommand(message, guildConfig) {
    let playerListEmbed = embeds.listPlayersEmbed('#0099ff', 'Registrations', 'List of registered players', sortPlayers(guilds[message.guild.id].players), guildConfig);
    guilds[message.guild.id].channel.send(playerListEmbed);
}

// status : Shows the status of the tournament (open/closed and how many players are registered/how many left to complete).
function statusCommand(message) {
    if ( !guilds[message.guild.id].registration ){
        message.reply("Registrations are closed.");
        return;
    }
    let print = "Players : " + guilds[message.guild.id].players.length + "/" + (guilds[message.guild.id].nbPlayersPerTeam * guilds[message.guild.id].nbTeams) ;
    message.channel.send(print);
}

// help : Shows the list of commands and a description.
function helpCommand(message, guildConfig) {
    // create an Embed message
    let exampleEmbed = embeds.simpleEmbed('#0099ff', guildConfig.bot_name, 'Tournament bot', 'Commands', help.tournament, guildConfig);
    message.channel.send(exampleEmbed);
}


////////////////NEED TO DOCUMENT THIS MORE/////////////////////

function httpGet(theUrl)
{
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onerror = function(error) {
        console.log(error.toString())
    };

    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send();
    return xmlHttp.responseText;
}

function listTeams(guild, guildConfig){
    let teamsEmbed = embeds.listTeamsEmbed('#0099ff', 'Matchmaking', 'The teams', guilds[guild.id].teams, guildConfig);
    guilds[guild.id].channel.send(teamsEmbed);
}

function onReaction (registrationMessage) {
    const filter = function (reaction, user) {
        return ['👍'].includes(reaction.emoji.name) && !user.bot ;
    };

    registrationMessage.react("👍");
    let collector = registrationMessage.createReactionCollector(filter, { time: 1800000 });
    collector.on('collect', function (reaction, collector) {
        //check if registrations are open
        if ( !guilds[registrationMessage.guild.id].registration ){
            return;
        }

        let user = reaction.users.cache.last();

        //check if the player is registered
        if ( isRegistered(registrationMessage.guild, user) )
            return;

        //check if the player is waiting for registeration confirmation
        if ( isUnverified(registrationMessage.guild, user ) ){
            user.send("You are already on the unverified list. Please enter your IGN to register.");
            return;
        }

        //pull out his nickname
        let nickname = registrationMessage.guild.members.cache.get(user.id).nickname;

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
        let message = msg.content.trim().split(' ');
        let region = message.shift();
        let ign = message.join(' ');

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
                for ( let key in guilds[registrationMessage.guild.id].unverifiedPlayers)
                    if (guilds[registrationMessage.guild.id].unverifiedPlayers[key].author === user.tag)
                        guilds[registrationMessage.guild.id].unverifiedPlayers.splice(key, 1);
                user.send("Delay ended. You have been removed from the unverified players list.")
            }
        }
    });
    guilds[registrationMessage.guild.id].msgCollectors.push(msgCollector);
}


function register(ign, region, message, guild, guildConfig)
{
    //check if registrations are open
    if ( !guilds[guild.id].registration ){
        message.reply("Registrations are closed.");
        return;
    }

    for ( let key in guilds[guild.id].players){
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
    let regionName = regionSelect(region);

    // check ign and rank
    let result = httpGet('https://' + regionName + '.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + encodeURIComponent(ign) + '?api_key=' + config.riot_api_key);
    let player = JSON.parse( result );

    if ( player.id === undefined ){
        message.reply("Account not found.");
        return false;
    }

    result = httpGet('https://' + regionName + '.api.riotgames.com/lol/league/v4/entries/by-summoner/' + player.id + '?api_key=' + config.riot_api_key);
    let queues = JSON.parse( result );

    let rank = "V";
    let tier = "UNRANKED";

    for (let key in queues ){
        if ( queues[key].queueType === 'RANKED_SOLO_5x5' ){
            rank = queues[key].rank;
            tier = queues[key].tier;
        }
    }

    let nickname = guild.members.cache.get(message.author.id).nickname;
    //remove from unverified players list if found
    for ( let key in guilds[guild.id].unverifiedPlayers)
        if (guilds[guild.id].unverifiedPlayers[key].author === message.author.tag)
            guilds[guild.id].unverifiedPlayers.splice(key, 1);


    guilds[guild.id].players.push({author : message.author.tag, nickname : nickname, ign : ign, tier : tier, rank : rank});

    message.reply("You have successfully been registered as " + ign + ".");

    if ( guilds[guild.id].players.length === guilds[guild.id].nbPlayersPerTeam * guilds[guild.id].nbTeams ){
        guilds[guild.id].channel.send("Registrations complete !");
        guilds[guild.id].registration = false;
        guilds[guild.id].unverifiedPlayers = [];

        for (let key in guilds[guild.id].msgCollectors )
            guilds[guild.id].msgCollectors[key].stop();
        guilds[guild.id].msgCollectors = [];

        let teams = matchmake(guilds[guild.id].players, guilds[guild.id].nbTeams, guilds[guild.id].nbPlayersPerTeam);
        guilds[guild.id].teams = teams;

        for ( let team in teams ){
            console.log(teams[team]);
        }

        listTeams(guild, guildConfig);

    }
    return true;
}

function isRegistered(guild, user ){
    for ( let key in guilds[guild.id].players)
        if( guilds[guild.id].players[key].author === user.tag )
            return true;
    return false
}

function isUnverified(guild, user){
    for ( let key in guilds[guild.id].unverifiedPlayers)
        if( guilds[guild.id].unverifiedPlayers[key].author === user.tag )
            return true;
    return false;
}

function calcRankingPoints(player){
    let points = Tiers[player.tier] * Object.keys(Ranks).length + Ranks[player.rank];
    if ( Tiers[player.tier] === Tiers.CHALLENGER)
        points -= Object.keys(Ranks).length * 3;
    else if ( Tiers[player.tier] === Tiers.GRANDMASTERMASTER)
        points -= Object.keys(Ranks).length * 2;
    else if ( Tiers[player.tier] === Tiers.MASTER)
        points -= Object.keys(Ranks).length;
    return points;
}

function fromValueToTier(tier){
    let tierName = "";
    Object.keys(Tiers).some(function (k) {
        if (Tiers[k] === tier) {
            tierName = k.toString();
            return true;
        }
    });
    return tierName;

}

function fromValueToRank(rank){
    let rankName = "";
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
    let regionName = 'na1';

    if (Regions[region.toLowerCase()] != null)
        return Regions[region.toLowerCase()];

    return regionName;
}

function hasTournamentPerms(message, guildConfig) {
    return message.member.roles.cache.has(guildConfig.role_tournament);
}

function matchmake(players, nbTeams, nbPlayersPerTeam) {
    console.log("Matchmaking Started : ");

    players = sortPlayers(players);

    let teams = [];
    for(let j = 0; j < nbTeams; j++) {
        teams.push([]);
    }

    let left = true;
    let leftPerTeam = nbPlayersPerTeam;
    //var twoByTwo = true;

    let i = 0;

    console.log("Need to fill : " + leftPerTeam + " players per team.");
    while ( leftPerTeam >= 0 ){

        if ( leftPerTeam === 0 ){
            console.log("DONE");
            return teams;
        }

        console.log("Left to fill : " + leftPerTeam + " players per team.");

        console.log("ENTERED one by one :" + teams.length);
        if ( left ){
            for ( let team in teams ){
                console.log("Placed");
                teams[team].push(players[i]);
                i++;
            }
        }else{
            for ( let team in teams ){
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