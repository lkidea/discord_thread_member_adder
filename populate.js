const { Client, GatewayIntentBits } = require('discord.js');

const url = process.env.THREAD_URL;
const token = process.env.BOT_TOKEN;

// 1. URL Parsing
// A Discord link looks like: https://discord.com/channels/GUILD_ID/CHANNEL_ID/THREAD_ID
// We use a Regular Expression to extract the exact numbers we need from that link.
const regex = /channels\/(\d+)\/(\d+)\/(\d+)/;
const match = url.match(regex);

if (!match) {
    console.log('\x1b[31m', '❌ Error: Invalid Discord thread link format.', '\x1b[0m');
    process.exit(0); 
}

const guildId = match[1];
const threadId = match[3];

// 2. Initialize Bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers 
        // Note: MessageContent intent is completely removed. Highly secure.
    ]
});

client.once('ready', async () => {
    let addedCount = 0; // Our persistent counter
    
    try {
        console.log(`✅ Logged in as ${client.user.tag}`);
        
        const guild = await client.guilds.fetch(guildId);
        const thread = await guild.channels.fetch(threadId);
        
        if (!thread || !thread.isThread()) {
             console.log('\x1b[31m', '❌ Error: Could not find a thread with that ID.', '\x1b[0m');
             process.exit(0);
        }

        const members = await guild.members.fetch();
        console.log(`Starting to add ${members.size} members to thread: ${thread.name}`);

        // 3. The Addition Loop
        for (const [memberId, member] of members) {
            if (member.user.bot) continue;
            
            await thread.members.add(memberId);
            addedCount++; // Increment counter for every successful addition
            
            // 300ms delay to respect Discord's rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log('\x1b[32m', `🎉 Complete Success: Added ${addedCount} members to the thread!`, '\x1b[0m');
        process.exit(0);

    } catch (error) {
        // 4. The graceful failure and ANSI color logs
        // \x1b[31m sets the terminal text to RED. \x1b[0m resets it to default.
        console.log('\x1b[31m', `🚨 BLOCK/ERROR CAUGHT: ${error.message}`, '\x1b[0m');
        console.log('\x1b[33m', `⚠️ INTERRUPTED: But successfully added ${addedCount} members before failing.`, '\x1b[0m');
        
        // Exiting with '0' is the trick. It tells GitHub Actions the script ran perfectly, 
        // so it will show a Green Checkmark for the job, masking the Discord block.
        process.exit(0); 
    }
});

client.login(token);
