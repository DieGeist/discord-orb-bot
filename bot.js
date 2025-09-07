const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const http = require('http');

// Simple HTTP server to prevent Render from sleeping (optional)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
});

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Array of random sentences to choose from
const orbSentences = [
    "The orb glows with mysterious energy! ✨",
    "Behold, the ancient orb has been summoned!",
    "The orb whispers secrets of the cosmos...",
    "A shimmering orb appears before you! 🔮",
    "The orb pulses with otherworldly power!",
    "You have awakened the orb from its slumber...",
    "The orb's light pierces through the darkness!",
    "Legend speaks of this very orb! 🌟",
    "The orb hums with arcane magic!",
    "A mystical orb materializes in response to your call!",
    "The orb regards you in silence... and hunger.",
    "Whispers spiral within the orb, too faint to be human.",
    "The orb trembles, as if remembering something older than time.",
    "You feel the orb's gaze — though it has no eyes.",
    "The orb hums in frequencies that shake your bones.",
    "The orb does not glow... it *breathes*.",
    "A crack forms across the orb, leaking shadows instead of light.",
    "The orb reveals nothing... and in that nothing, everything.",
    "The orb spins slowly, dragging reality with it.",
    "You sense the orb is aware of your true name.",
    "The orb pulses in time with your heartbeat — until it doesn't.",
    "The orb reflects not your face, but something watching from behind it.",
    "The orb glistens wetly, as if alive.",
    "The orb rolls a fraction closer, though you did not touch it.",
    "From deep within the orb, something scratches to get out.",
    "The orb offers comfort... but you know it is lying.",
    "The orb is older than stars, and far less forgiving.",
    "The orb thirsts.",
    "In the orb's light, shadows move the wrong way.",
    "The orb speaks in silence louder than screams.",
];

// Specific responses for slash commands
const summonResponses = [
    "🔮 **The air crackles as an orb materializes before you, pulsing with ancient power...**",
    "⚫ **From the void, an orb emerges, its surface rippling like black water...**",
    "✨ **A brilliant orb descends from the shadows, its light both beautiful and terrible...**",
    "🌟 **You have called, and the orb has answered. It regards you with interest...**",
    "💀 **The orb appears with the sound of distant screaming. It seems... pleased.**"
];

const gazeResponses = [
    "👁️ *You peer into the orb's depths and see... yourself, but wrong. So very wrong.*",
    "🌌 *The orb shows you glimpses of tomorrow's regrets and yesterday's forgotten sins.*",
    "⚡ *Lightning flashes in the orb's core, revealing a truth you weren't ready to know.*",
    "🕳️ *The orb gazes back, and for a moment, you forget who you are.*",
    "🔥 *In the orb's reflection, you see flames that have not yet been lit.*"
];

const whisperResponses = [
    "*The orb whispers*: \"They know what you did last Tuesday...\"",
    "*The orb hisses softly*: \"The shadows grow longer when you're not watching...\"",
    "*The orb murmurs*: \"Your reflection has been acting strange lately...\"",
    "*The orb breathes*: \"Three steps behind you, always three steps...\"",
    "*The orb confides*: \"The old gods remember your name, mortal...\""
];

const questionResponses = [
    "🔮 The orb swirls ominously... **\"Perhaps. But at what cost?\"**",
    "⚫ The orb darkens... **\"The answer lies in the spaces between your fears.\"**",
    "✨ The orb flickers... **\"Ask instead what the question costs you.\"**",
    "🌟 The orb pulses... **\"Yes, but you will not like when.\"**",
    "💀 The orb grins without a mouth... **\"The answer is behind you.\"**",
    "👁️ The orb considers... **\"What makes you think you want to know?\"**",
    "🕳️ The orb yawns... **\"Certainty is the enemy of wisdom.\"**"
];

// Function to get a random sentence
function getRandomOrbSentence() {
    const randomIndex = Math.floor(Math.random() * orbSentences.length);
    return orbSentences[randomIndex];
}

function getRandomResponse(responses) {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

// Define slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('orb')
        .setDescription('Interact with the mysterious orb')
        .addSubcommand(subcommand =>
            subcommand
                .setName('summon')
                .setDescription('Summon an orb with dramatic flair')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('gaze')
                .setDescription('Peer into the orb\'s mysterious depths')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whisper')
                .setDescription('Listen to the orb\'s dark secrets')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('question')
                .setDescription('Ask the orb a question')
                .addStringOption(option =>
                    option
                        .setName('query')
                        .setDescription('What do you wish to know?')
                        .setRequired(true)
                )
        ),
];

// When the client is ready, run this code
client.once('ready', async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('Started refreshing application (/) commands.');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'orb') {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'summon':
                await interaction.reply(getRandomResponse(summonResponses));
                break;
                
            case 'gaze':
                await interaction.reply(getRandomResponse(gazeResponses));
                break;
                
            case 'whisper':
                await interaction.reply(getRandomResponse(whisperResponses));
                break;
                
            case 'question':
                const question = interaction.options.getString('query');
                const response = getRandomResponse(questionResponses);
                await interaction.reply(`You ask: *"${question}"*\n\n${response}`);
                break;
        }
    }
});

// Listen for messages (existing functionality)
client.on('messageCreate', (message) => {
    // Ignore messages from bots (including this bot itself)
    if (message.author.bot) return;
    
    // Check if the message content contains "orb" or "Orb"
    if (message.content.toLowerCase().includes('orb')) {
        // Send a random orb sentence
        const randomSentence = getRandomOrbSentence();
        message.channel.send(randomSentence);
    }
});

// Login to Discord with your bot's token from environment variable
client.login(process.env.DISCORD_TOKEN);