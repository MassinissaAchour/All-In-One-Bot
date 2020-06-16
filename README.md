# All In One Bot!  

For Discord lovers, bots are a big part of a good server. They can be useful, entertaining or just fun. But it's also very annoying to have multiple bots on the same server. They need to install each one of the bots on the server separately. They need to remember the prefix for each one of them. They need to setup permissions and roles for each one of them. It becomes very annoying overall to manage that many bots at the same time. 
  
All In One Bot is a Discord bot with multiple functionalities. Whether you want to play music or organize a tournament, all you need is this bot. No more prefix management on your server. All the functionalities in one installation.  
  

# Functionalities  
  
The bot currently contains these functionalities :  
  
**Music** : A music player that joins Discord calls and plays music from Youtube. The player can be fed a youtube URL or just a song name that will be searched through youtube. The player can queue up songs and play songs on repeat or entire queues on repeat.  
  
**Tournament** : A tournament organisation helper for League Of Legends. An admin needs to use the start command on a text channel with the team sizes and number of teams. An announcement will be made and registrations will be open. Players can either type a command to register or react to the announcement. Once they have reacted to the announcement a direct message will be sent to them by the bot with registration instructions. Players can register with accounts from any League of Legends server. Once the max number of players has been reached, the bot creates balanced teams by using each player's solo queue rank with the Riot Games API.  
  
**Soundboard** : The soundboard acts the same way as the music player but without the URL and search functionalities. A set on sound bits can be setup in the [Soundeffects]([https://github.com/MassinissaAchour/All-In-One-Bot/blob/master/soundeffects.json](https://github.com/MassinissaAchour/All-In-One-Bot/blob/master/soundeffects.json)) json file in this format `"name" : "youtube-id"`  
  
## Music

**Commands**  

`music play [Youtube URL]`  
Plays a youtube video's audio.  
  
`music play [song name to search]`  
Searches on youtube and plays the first matching video's audio.  
  
`music skip`  
Vote to skip the current song.  
  
`music queue`  
Lists the queued songs  
  
`music mode [repeat|playlist|normal]`  
Chose a mode for the bot. Repeat plays a song on loop. Playlist plays the current queue in a loop.  
  
`music purge`  
Stops the current music and empties the queue.  
  
`music disconnect`  
Disconnects the bot from a voice chat.  
  

## Tournament  

**Commands**  
`tournament start [nbTeams] [nbPlayersPerTeam]`  
Starts a tournament with the specified size.  
  
`tournament register [REGION] [IGN]`  
Registers you to the tournament and associates you to your League Of Legends account.  
  
`tournament unregister`  
Unregisters you from the current tournament.  
  
`tournament unregister [IGN|discordName]`  
Unregisters the user from the current tournament.  
  
`tournament registered`  
Shows the list of the currently registered players.  
  
`tournament status`  
Shows the status of the tournament (open/closed and how many players are registered/how many left to complete).  
  
`tournament cancel`  
Cancels the current tournament.  
  
  
## Soundboard  

**Commands**  

`soundboard [Sound Name]`  
Plays the selected sound clip in your voice chat. 
  
`soundboard list`  
Lists all the available sound clips.  
  
## Moderation tools  

**Commands**  

`mod purge`  
removes the last 100 messages in the text channel.  
  
`mod purge [amount]`  
removes X messages in the text channel.  
  
`mod purge [@mention]`  
removes the last 100 messages by a specific member in the text channel.  
  
`mod purge [amount][@mention]`  
removes X messages in the text channel by a specific member.  
  
## Karaoke  

**Commands**  

`karaoke [song name]`  
Searches for the song using the Genius API and prints it's lyrics in the text channel.  
  
# What's next?  

## New functionalities  
  
**Activity recorder**  
A system that records the sserver members' activity and makes it fun with a rewarding system.  
It could be something like gaining experience points when being active and leveling up. Certain levels unlock roles that could give new permissions like the ability to use certain functionalities of the bot.  


##  Improvements  

**Music**  
- Play music from Spotify too.  
- Pause and resume a song.  

**Tournament**  
- The bot should generate the tournament links and send direct messages to the players.  
- We should be able to change the tournament size during registrations without canceling the current tournament.  

**Soundboard**  
- Make a command that adds a sound to the sound bank without having to go through changing the json file.  

**Moderation tools**  
Some moderation tools would be useful. Some of the functions could be :  
- **Black listed words** : The bot will automatically delete black listed words (like the n-word) and give a warning/mute/ban the author of the message.  

**Karaoke**  
- **Pair with the music functionality** : Join a voice channel and play the karaoke version of the song.  
