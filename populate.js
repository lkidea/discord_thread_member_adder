const { Client, GatewayIntentBits } = require('discord.js');

const url = process.env.THREAD_URL;
const token = process.env.BOT_TOKEN;

// 1. URL Parsing
const regex = /channels\/(\d+)\/(\d+)/;
const match = url.match(regex);

if (!match) {
    console.log('\x1b[31m', '❌ Error: Invalid Discord thread link format.', '\x1b[0m');
    process.exit(0); 
}

const guildId = match[1];
const threadId = match[2];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers 
    ]
});

client.once('ready', async () => {
    let addedCount = 0;
    
    try {
        console.log(`✅ Logged in as ${client.user.tag}`);
        
        const guild = await client.guilds.fetch(guildId);
        const thread = await guild.channels.fetch(threadId);
        
        if (!thread || !thread.isThread()) {
             console.log('\x1b[31m', '❌ Error: Could not find a thread with that ID.', '\x1b[0m');
             process.exit(0);
        }

        // Fetch members and filter out other bots
        const members = await guild.members.fetch();
        const humanMembers = members.filter(m => !m.user.bot);
        
        // Convert the user list into an array of mention strings: "<@USER_ID>"
        const mentions = humanMembers.map(m => `<@${m.id}>`);
        
        console.log(`Starting silent bulk-add for ${mentions.length} members to thread: ${thread.name}`);

        // 3. The Bulk Chunking Loop
        // We put 80 mentions in one message to stay safely under the 2000 character limit
        const chunkSize = 80; 

        for (let i = 0; i < mentions.length; i += chunkSize) {
            const chunk = mentions.slice(i, i + chunkSize);
            const messageContent = chunk.join(' ');

            // Send the message SILENTLY
            const sentMessage = await thread.send({
                content: messageContent,
                // THIS IS THE MAGIC SPELL: It completely disables the ping, red dot, and yellow highlight
                allowedMentions: { parse: [] } 
            });

            // Instantly delete our own message to keep the thread clean
            await sentMessage.delete();
            
            addedCount += chunk.length;
            console.log(`...Chunk processed: Added ${addedCount}/${mentions.length} members.`);
            
            // Pause for 1.5 seconds between sending messages to respect Discord's rate limits
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        console.log('\x1b[32m', `🎉 Complete Success: Silently added ${addedCount} members to the thread!`, '\x1b[0m');
        process.exit(0);

    } catch (error) {
        console.log('\x1b[31m', `🚨 BLOCK/ERROR CAUGHT: ${error.message}`, '\x1b[0m');
        console.log('\x1b[33m', `⚠️ INTERRUPTED: But successfully added ${addedCount} members before failing.`, '\x1b[0m');
        process.exit(0); 
    }
});

client.login(token);
