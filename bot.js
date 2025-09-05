const { Client, GatewayIntentBits } = require('discord.js');

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
    "A mystical orb materializes in response to your call!"
];

// Function to get a random sentence
function getRandomOrbSentence() {
    const randomIndex = Math.floor(Math.random() * orbSentences.length);
    return orbSentences[randomIndex];
}

// When the client is ready, run this code
client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

// Listen for messages
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

const { Client, GatewayIntentBits } = require('discord.js');
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
    "A mystical orb materializes in response to your call!"
];

// Function to get a random sentence
function getRandomOrbSentence() {
    const randomIndex = Math.floor(Math.random() * orbSentences.length);
    return orbSentences[randomIndex];
}

// When the client is ready, run this code
client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

// Listen for messages
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