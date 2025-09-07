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
    "The orb regards you in silence... and hunger.",
    "Whispers spiral within the orb, too faint to be human.",
    "The orb trembles, as if remembering something older than time.",
    "You feel the orb’s gaze — though it has no eyes.",
    "The orb hums in frequencies that shake your bones.",
    "The orb does not glow... it *breathes*.",
    "A crack forms across the orb, leaking shadows instead of light.",
    "The orb reveals nothing... and in that nothing, everything.",
    "The orb spins slowly, dragging reality with it.",
    "You sense the orb is aware of your true name.",
    "The orb pulses in time with your heartbeat — until it doesn’t.",
    "The orb reflects not your face, but something watching from behind it.",
    "The orb glistens wetly, as if alive.",
    "The orb rolls a fraction closer, though you did not touch it.",
    "From deep within the orb, something scratches to get out.",
    "The orb offers comfort... but you know it is lying.",
    "The orb is older than stars, and far less forgiving.",
    "The orb thirsts.",
    "In the orb’s light, shadows move the wrong way.",
    "The orb speaks in silence louder than screams.",

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