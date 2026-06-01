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

        const members = await guild.members.fetch();
        const humanMembers = members.filter(m => !m.user.bot);
        
        // Convert to standard mention format
        const mentions = humanMembers.map(m => `<@${m.id}>`);
        
        console.log(`Starting silent Ghost-Ping bulk-add for ${mentions.length} members to thread: ${thread.name}`);

        // 3. The Ghost Ping Chunking Loop
        // We use groups of 40 to stay safely under Discord's anti-spam mention limits
        const chunkSize = 40; 

        for (let i = 0; i < mentions.length; i += chunkSize) {
            const chunk = mentions.slice(i, i + chunkSize);
            
            // Combine @silent with the mentions
            const messageContent = `@silent ${chunk.join(' ')}`;

            // Send the message (this pulls them into the thread securely)
            const sentMessage = await thread.send({ content: messageContent });

            // INSTANTLY delete the message to wipe the red dot and keep the chat clean
            await sentMessage.delete();
            
            addedCount += chunk.length;
            console.log(`...Chunk processed: Added ${addedCount}/${mentions.length} members.`);
            
            // Pause for 1.5 seconds so Discord doesn't rate-limit our send/delete actions
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        console.log('\x1b[32m', `🎉 Complete Success: Ghost-pinged ${addedCount} members into the thread!`, '\x1b[0m');
        process.exit(0);

    } catch (error) {
        console.log('\x1b[31m', `🚨 BLOCK/ERROR CAUGHT: ${error.message}`, '\x1b[0m');
        console.log('\x1b[33m', `⚠️ INTERRUPTED: But successfully processed ${addedCount} members before failing.`, '\x1b[0m');
        process.exit(0); 
    }
});

client.login(token);
