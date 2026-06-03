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
        
        console.log(`Starting individual API additions for ${humanMembers.size} members to thread: ${thread.name}`);

        // 3. The Slow & Steady Loop (API Method)
        for (const [memberId, member] of humanMembers) {
            
            // This forces Discord to update the roster (and generates the green arrow)
            await thread.members.add(memberId);
            addedCount++;
            
            // Pause for 300 milliseconds between each addition to avoid Cloudflare blocks
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Print progress every 50 members so you know it isn't frozen
            if (addedCount % 50 === 0) {
                console.log(`...Progress: Added ${addedCount} members.`);
            }
        }
        
        console.log('\x1b[32m', `🎉 Complete Success: Safely added ${addedCount} members to the thread!`, '\x1b[0m');
        process.exit(0);

    } catch (error) {
        console.log('\x1b[31m', `🚨 BLOCK/ERROR CAUGHT: ${error.message}`, '\x1b[0m');
        console.log('\x1b[33m', `⚠️ INTERRUPTED: But successfully added ${addedCount} members before failing.`, '\x1b[0m');
        process.exit(0); 
    }
});

client.login(token);
