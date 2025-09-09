const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Simple HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('The Watchers are always listening...');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
});

// Data storage functions
const dataFile = path.join(__dirname, 'cultistData.json');
const serverDataFile = path.join(__dirname, 'serverData.json');

function loadData(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (error) {
        console.error(`Error loading data from ${file}:`, error);
    }
    return {};
}

function saveData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error saving data to ${file}:`, error);
    }
}

function getCultistData(userId) {
    const allData = loadData(dataFile);
    if (!allData[userId]) {
        allData[userId] = {
            artifacts: [],
            questionsAsked: 0,
            lastRitual: 0,
            sanity: 100,
            favor: 0,
            encounters: 0,
            achievements: [],
            personality: 'skeptical', // skeptical, curious, devoted, mad
            lastSeen: Date.now(),
            totalMentions: 0
        };
        saveData(dataFile, allData);
    }
    return allData[userId];
}

function updateCultistData(userId, newData) {
    const allData = loadData(dataFile);
    allData[userId] = { ...allData[userId], ...newData };
    saveData(dataFile, allData);
}

function getServerData(serverId) {
    const allData = loadData(serverDataFile);
    if (!allData[serverId]) {
        allData[serverId] = {
            totalMentions: 0,
            lastEvent: 0,
            eventLevel: 0,
            cursedUsers: {},
            prophecies: [],
            serverSanity: 100
        };
        saveData(serverDataFile, allData);
    }
    return allData[serverId];
}

function updateServerData(serverId, newData) {
    const allData = loadData(serverDataFile);
    allData[serverId] = { ...allData[serverId], ...newData };
    saveData(serverDataFile, allData);
}

// Artifact system with Delta Green theme
const artifactTypes = {
    common: [
        'Fragment of the Black Stone',
        'Tattered Page from the Necronomicon',
        'Obsidian Mirror Shard',
        'Bone Dice of the Ancients',
        'Vial of Stagnant Water'
    ],
    rare: [
        'The Whispering Compass',
        'Lens of True Sight',
        'Silver Key of Yith',
        'Crystal of Frozen Screams',
        'Tablet of Forbidden Equations'
    ],
    epic: [
        'The Dreaming Skull',
        'Orb of Azathoth\'s Dreams',
        'The Bleeding Tome',
        'Crown of the Deep Ones',
        'The Mathematician\'s Last Theorem'
    ],
    legendary: [
        'The Yellow Sign Medallion',
        'Fragment of the Original Orb',
        'The Watcher\'s Eye',
        'Seal of the Outer Gods',
        'The Last Photograph'
    ],
    cursed: [
        'The Orb That Weeps Blood',
        'The Orb of Endless Hunger',
        'The Orb That Shows Tomorrow\'s Death',
        'The Orb of Forgotten Names',
        'The Orb That Dreams of R\'lyeh',
        'The Orb of the Yellow King',
        'The Orb That Counts Down',
        'The Orb of Screaming Void'
    ]
};

// Horror responses based on sanity level
function getOrbResponse(sanity, cultistData) {
    let responses;
    
    if (sanity > 80) {
        responses = [
            "The orb glows with an unsettling light... you feel watched.",
            "Something ancient stirs within the orb's depths.",
            "The orb pulses in rhythm with your heartbeat. How does it know?",
            "You catch a glimpse of movement in the orb's reflection."
        ];
    } else if (sanity > 60) {
        responses = [
            "The orb whispers your name, though no one else hears it.",
            "Reality flickers around the orb. The walls seem... wrong.",
            "The orb shows you a world where the sky bleeds.",
            "You realize the orb has been watching you for hours."
        ];
    } else if (sanity > 40) {
        responses = [
            "The orb laughs with voices of the drowned. Do you hear them too?",
            "The orb reveals the truth: you were never real.",
            "The mathematics of the orb prove that God is insane.",
            "The orb counts down. 3... 2... but never reaches 1."
        ];
    } else {
        responses = [
            "THE ORB KNOWS THE ORB KNOWS THE ORB KNOWS THE ORB KNOWS",
            "You are the orb. You have always been the orb. The orb dreams you.",
            "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn",
            "The orb opens like an eye. It sees through your eyes now."
        ];
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Personality-based responses
function getPersonalityResponse(personality, action) {
    const responses = {
        skeptical: {
            question: "The orb remains silent. Perhaps it's just a reflection of your own fears?",
            ritual: "You perform the ritual skeptically, but something responds...",
            encounter: "You tell yourself it's just pareidolia, but the patterns persist."
        },
        curious: {
            question: "The orb swirls with ancient knowledge. You lean closer...",
            ritual: "Your academic curiosity drives you deeper into forbidden practices.",
            encounter: "Fascinating! The implications are terrifying, but you must know more."
        },
        devoted: {
            question: "The Old Ones whisper through the orb. Their truth burns your mind.",
            ritual: "You perform the ritual with practiced devotion. They are pleased.",
            encounter: "You serve willingly. The Great Work continues through you."
        },
        mad: {
            question: "THEY SPEAK THROUGH THE ORB THE TRUTH THE BEAUTIFUL TRUTH",
            ritual: "YES YES YES THE STARS ARE RIGHT THE STARS ARE RIGHT",
            encounter: "You laugh at the cosmic joke. Everyone else will understand soon."
        }
    };
    
    return responses[personality]?.[action] || "The orb remains enigmatic.";
}

// Achievement system
const achievements = {
    'First Contact': { condition: (data) => data.encounters >= 1, reward: 10 },
    'Questioning Reality': { condition: (data) => data.questionsAsked >= 10, reward: 20 },
    'Collector of Forbidden Things': { condition: (data) => data.artifacts.length >= 5, reward: 25 },
    'Sanity is Overrated': { condition: (data) => data.sanity <= 50, reward: -30 },
    'Devoted Cultist': { condition: (data) => data.favor >= 100, reward: 50 },
    'The Watchers\' Favorite': { condition: (data) => data.questionsAsked >= 50, reward: 75 },
    'Artifact Hoarder': { condition: (data) => data.artifacts.length >= 20, reward: 100 },
    'Madness Incarnate': { condition: (data) => data.sanity <= 10, reward: -100 },
    'One with the Void': { condition: (data) => data.favor >= 500, reward: 200 }
};

function checkAchievements(userId, cultistData) {
    const newAchievements = [];
    
    for (const [name, achievement] of Object.entries(achievements)) {
        if (!cultistData.achievements.includes(name) && achievement.condition(cultistData)) {
            cultistData.achievements.push(name);
            cultistData.favor += achievement.reward;
            newAchievements.push({ name, reward: achievement.reward });
        }
    }
    
    if (newAchievements.length > 0) {
        updateCultistData(userId, cultistData);
    }
    
    return newAchievements;
}

// Event system
function triggerRandomEvent(serverId, cultistId) {
    const events = [
        { name: "The Watchers Stir", effect: "sanity", value: -5, message: "The air grows thick. Something vast turns its attention to this place." },
        { name: "Blessed by Madness", effect: "favor", value: 10, message: "The Old Ones smile upon your devotion. Reality bends slightly in your favor." },
        { name: "Cosmic Insight", effect: "sanity", value: -10, message: "You glimpse the true nature of reality. You wish you hadn't." },
        { name: "Dark Favor", effect: "favor", value: 25, message: "The entities beyond approve. Their dark blessing flows through you." },
        { name: "Moment of Clarity", effect: "sanity", value: 15, message: "For a brief moment, the world makes sense again." }
    ];
    
    if (Math.random() < 0.1) { // 10% chance
        const event = events[Math.floor(Math.random() * events.length)];
        const cultistData = getCultistData(cultistId);
        
        if (event.effect === 'sanity') {
            cultistData.sanity = Math.max(0, Math.min(100, cultistData.sanity + event.value));
        } else if (event.effect === 'favor') {
            cultistData.favor += event.value;
        }
        
        updateCultistData(cultistId, cultistData);
        return event;
    }
    
    return null;
}

// Create client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Define comprehensive slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('orb')
        .setDescription('Commune with the ancient orbs and eldritch artifacts')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ritual')
                .setDescription('Perform a ritual to seek forbidden artifacts')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('collection')
                .setDescription('View your cursed artifact collection')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('question')
                .setDescription('Ask the orbs for eldritch wisdom')
                .addStringOption(option =>
                    option
                        .setName('query')
                        .setDescription('What forbidden knowledge do you seek?')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription('View your investigator profile and sanity')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sacrifice')
                .setDescription('Offer another soul to the Old Ones')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('The unfortunate soul to sacrifice')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('curse')
                .setDescription('Bestow a minor curse upon someone')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('Target for your malevolent blessing')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('prophecy')
                .setDescription('Receive a dark prophecy about the server\'s future')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('See who has fallen deepest into madness')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View server-wide cosmic horror statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('adventure')
                .setDescription('Begin a choose-your-own eldritch adventure')
        ),
];

// Adventure system
const adventures = [
    {
        id: 'library',
        start: "You enter the abandoned Miskatonic University library. Dust motes dance in shafts of pale light. You notice a book on the floor, its pages fluttering despite no wind. Do you:",
        choices: [
            { text: "📖 Read the book", next: 'read_book', sanity: -10, flavor: "The words burn themselves into your mind..." },
            { text: "🚪 Leave immediately", next: 'flee_library', sanity: 5, flavor: "Wisdom is knowing when to retreat..." },
            { text: "🔍 Investigate further", next: 'investigate', sanity: -5, flavor: "Curiosity leads you deeper..." }
        ]
    },
    {
        id: 'read_book',
        start: "The text speaks of mathematical proofs that reality is unstable. Your vision blurs as impossible geometries fill your mind. Suddenly, you hear footsteps approaching through the library.",
        choices: [
            { text: "😱 Hide behind the shelves", next: 'hide', sanity: -3, flavor: "You cower in the shadows..." },
            { text: "👁️ Continue reading", next: 'continue_reading', sanity: -15, flavor: "Knowledge has a price..." }
        ]
    }
];

client.once('ready', async () => {
    console.log(`The Watcher stirs... Logged in as ${client.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('The rituals are prepared. Commands are ready.');
    } catch (error) {
        console.error('The ritual failed:', error);
    }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'orb') {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const serverId = interaction.guild?.id || 'dm';
        const cultistData = getCultistData(userId);
        const serverData = getServerData(serverId);
        
        // Random event chance
        const event = triggerRandomEvent(serverId, userId);
        
        switch (subcommand) {
            case 'ritual':
                const now = Date.now();
                const cooldown = 2 * 60 * 60 * 1000; // 2 hours
                
                if (now - cultistData.lastRitual < cooldown) {
                    const timeLeft = Math.ceil((cooldown - (now - cultistData.lastRitual)) / (60 * 1000));
                    await interaction.reply(`🕯️ The cosmic energies are still settling. The stars will be right again in ${timeLeft} minutes.`);
                    return;
                }
                
                // Perform ritual
                const rarity = getRarityByFavor(cultistData.favor);
                const artifact = getRandomArtifact(rarity);
                
                cultistData.artifacts.push(artifact);
                cultistData.lastRitual = now;
                cultistData.favor += getRarityFavor(artifact.rarity);
                cultistData.sanity -= getSanityLoss(artifact.rarity);
                cultistData.sanity = Math.max(0, cultistData.sanity);
                
                updateCultistData(userId, cultistData);
                
                const achievements = checkAchievements(userId, cultistData);
                
                let response = `🕯️ **RITUAL COMPLETE** 🕯️\n\n`;
                response += `**${artifact.rarity.toUpperCase()} ARTIFACT ACQUIRED:**\n`;
                response += `🔮 **${artifact.name}**\n`;
                response += `💀 *Sanity: ${cultistData.sanity}/100*\n`;
                response += `👁️ *Favor: ${cultistData.favor}*\n\n`;
                response += `*${getPersonalityResponse(cultistData.personality, 'ritual')}*`;
                
                if (achievements.length > 0) {
                    response += `\n\n🏆 **ACHIEVEMENT UNLOCKED:**\n`;
                    achievements.forEach(ach => {
                        response += `• ${ach.name} (${ach.reward > 0 ? '+' : ''}${ach.reward} favor)\n`;
                    });
                }
                
                if (event) {
                    response += `\n\n⚡ **${event.name}:** *${event.message}*`;
                }
                
                await interaction.reply(response);
                break;
                
            case 'collection':
                if (cultistData.artifacts.length === 0) {
                    await interaction.reply("📜 Your collection is empty. The Old Ones have not yet blessed you with their gifts. Use `/orb ritual` to seek artifacts.");
                    return;
                }
                
                const embed = new EmbedBuilder()
                    .setTitle(`🔮 ${interaction.user.displayName}'s Occult Collection`)
                    .setDescription(`*${cultistData.artifacts.length} artifacts of forbidden knowledge*`)
                    .setColor(0x8B0000);
                
                // Group artifacts by rarity
                const groupedArtifacts = {};
                cultistData.artifacts.forEach(artifact => {
                    if (!groupedArtifacts[artifact.rarity]) {
                        groupedArtifacts[artifact.rarity] = {};
                    }
                    groupedArtifacts[artifact.rarity][artifact.name] = 
                        (groupedArtifacts[artifact.rarity][artifact.name] || 0) + 1;
                });
                
                Object.entries(groupedArtifacts).forEach(([rarity, artifacts]) => {
                    const artifactList = Object.entries(artifacts)
                        .map(([name, count]) => `• ${name} ${count > 1 ? `(×${count})` : ''}`)
                        .join('\n');
                    embed.addFields({ name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Artifacts`, value: artifactList, inline: true });
                });
                
                await interaction.reply({ embeds: [embed] });
                break;
                
            case 'question':
                const question = interaction.options.getString('query');
                cultistData.questionsAsked += 1;
                cultistData.sanity -= Math.floor(Math.random() * 5) + 1; // 1-5 sanity loss
                cultistData.sanity = Math.max(0, cultistData.sanity);
                
                updateCultistData(userId, cultistData);
                
                const personalityResponse = getPersonalityResponse(cultistData.personality, 'question');
                
                let questionResponse = `*You ask: "${question}"*\n\n`;
                questionResponse += `${personalityResponse}\n\n`;
                questionResponse += `💀 *Sanity: ${cultistData.sanity}/100*\n`;
                questionResponse += `*Questions asked: ${cultistData.questionsAsked}*`;
                
                if (event) {
                    questionResponse += `\n\n⚡ **${event.name}:** *${event.message}*`;
                }
                
                await interaction.reply(questionResponse);
                break;
                
            case 'profile':
                const personalityEmoji = {
                    skeptical: '🤔',
                    curious: '📚',
                    devoted: '🙏',
                    mad: '🤪'
                };
                
                const profileEmbed = new EmbedBuilder()
                    .setTitle(`${personalityEmoji[cultistData.personality]} Investigator Profile: ${interaction.user.displayName}`)
                    .setDescription(`*${cultistData.personality.charAt(0).toUpperCase() + cultistData.personality.slice(1)} researcher of the occult*`)
                    .addFields(
                        { name: '💀 Sanity', value: `${cultistData.sanity}/100`, inline: true },
                        { name: '👁️ Favor of the Old Ones', value: cultistData.favor.toString(), inline: true },
                        { name: '🔮 Artifacts Collected', value: cultistData.artifacts.length.toString(), inline: true },
                        { name: '❓ Questions Asked', value: cultistData.questionsAsked.toString(), inline: true },
                        { name: '👻 Encounters', value: cultistData.encounters.toString(), inline: true },
                        { name: '🏆 Achievements', value: cultistData.achievements.length.toString(), inline: true }
                    )
                    .setColor(cultistData.sanity > 50 ? 0x008000 : cultistData.sanity > 25 ? 0xFFFF00 : 0xFF0000);
                
                if (cultistData.achievements.length > 0) {
                    profileEmbed.addFields({ name: '🏆 Unlocked Achievements', value: cultistData.achievements.join('\n'), inline: false });
                }
                
                await interaction.reply({ embeds: [profileEmbed] });
                break;
                
            case 'sacrifice':
                const target = interaction.options.getUser('target');
                const targetData = getCultistData(target.id);
                
                const sacrificeMessages = [
                    `🩸 ${interaction.user.displayName} offers ${target.displayName} to the hungering void...`,
                    `⚡ The Old Ones consider the offering of ${target.displayName}. They are... amused.`,
                    `🕯️ ${target.displayName} feels a chill as ${interaction.user.displayName} whispers their name to ancient powers.`,
                    `👁️ The Watchers turn their gaze upon ${target.displayName}. Sleep will not come easily tonight.`
                ];
                
                cultistData.favor += 5;
                targetData.sanity -= Math.floor(Math.random() * 10) + 5;
                targetData.sanity = Math.max(0, targetData.sanity);
                
                updateCultistData(userId, cultistData);
                updateCultistData(target.id, targetData);
                
                const sacrificeMessage = sacrificeMessages[Math.floor(Math.random() * sacrificeMessages.length)];
                await interaction.reply(sacrificeMessage);
                break;
                
            case 'curse':
                const curseTarget = interaction.options.getUser('target');
                const curses = [
                    `May your coffee always be lukewarm and your WiFi perpetually slow.`,
                    `May you always feel like someone is walking behind you.`,
                    `May you forever lose your keys at the most inconvenient moments.`,
                    `May you always feel like you're forgetting something important.`,
                    `May your phone battery die at 23% forever.`
                ];
                
                const curse = curses[Math.floor(Math.random() * curses.length)];
                await interaction.reply(`🌙 ${interaction.user.displayName} bestows a minor curse upon ${curseTarget.displayName}:\n\n*"${curse}"*\n\n*The Old Ones chuckle softly in the void.*`);
                break;
                
            case 'prophecy':
                const prophecies = [
                    "The stars whisper of a great reckoning coming to this server...",
                    "In seven days, someone here will discover a truth they wish they hadn't...",
                    "The next full moon will bring madness to the most curious among you...",
                    "A message will arrive that changes everything. But from whom?",
                    "The number 23 will become significant. Watch for it.",
                    "Someone among you carries a secret that the Old Ones covet...",
                    "The next person to mention 'dreams' will have their dreams become... interesting."
                ];
                
                const prophecy = prophecies[Math.floor(Math.random() * prophecies.length)];
                
                serverData.prophecies.push({
                    text: prophecy,
                    date: Date.now(),
                    prophet: interaction.user.id
                });
                
                updateServerData(serverId, serverData);
                
                await interaction.reply(`🌙 **PROPHECY RECEIVED** 🌙\n\n*The orbs swirl with visions of possible futures...*\n\n**"${prophecy}"**\n\n*The prophecy has been recorded in the server's grimoire.*`);
                break;
                
            case 'leaderboard':
                const allData = loadData(dataFile);
                const cultists = Object.entries(allData)
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => b.favor - a.favor)
                    .slice(0, 10);
                
                const leaderboardEmbed = new EmbedBuilder()
                    .setTitle('🏆 The Most Favored by the Old Ones')
                    .setDescription('*Those who have delved deepest into forbidden knowledge*')
                    .setColor(0x4B0082);
                
                let leaderboard = '';
                for (let i = 0; i < Math.min(cultists.length, 10); i++) {
                    const cultist = cultists[i];
                    const user = await client.users.fetch(cultist.id).catch(() => ({ username: 'Unknown Cultist' }));
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔸';
                    leaderboard += `${medal} **${user.username}**\n`;
                    leaderboard += `   └ Favor: ${cultist.favor} | Sanity: ${cultist.sanity}/100 | Artifacts: ${cultist.artifacts.length}\n\n`;
                }
                
                leaderboardEmbed.setDescription(leaderboard || '*No cultists have been blessed yet...*');
                
                await interaction.reply({ embeds: [leaderboardEmbed] });
                break;
                
            case 'stats':
                const totalCultists = Object.keys(loadData(dataFile)).length;
                const totalMentions = serverData.totalMentions;
                const avgSanity = totalCultists > 0 ? 
                    Object.values(loadData(dataFile)).reduce((sum, cultist) => sum + cultist.sanity, 0) / totalCultists : 100;
                
                const statsEmbed = new EmbedBuilder()
                    .setTitle('📊 Server Occult Statistics')
                    .setDescription('*The cosmic horror metrics of this realm*')
                    .addFields(
                        { name: '👥 Active Investigators', value: totalCultists.toString(), inline: true },
                        { name: '🔮 Total Orb Mentions', value: totalMentions.toString(), inline: true },
                        { name: '💀 Average Sanity', value: avgSanity.toFixed(1), inline: true },
                        { name: '📜 Recorded Prophecies', value: serverData.prophecies.length.toString(), inline: true },
                        { name: '🌙 Server Sanity Level', value: serverData.serverSanity.toString(), inline: true },
                        { name: '⚡ Event Level', value: serverData.eventLevel.toString(), inline: true }
                    )
                    .setColor(0x2F4F4F);
                
                await interaction.reply({ embeds: [statsEmbed] });
                break;
                
            case 'adventure':
                const adventure = adventures[Math.floor(Math.random() * adventures.length)];
                
                let adventureResponse = `🌙 **ELDRITCH ADVENTURE** 🌙\n\n${adventure.start}\n\n**Choose your action:**\n`;
                
                adventure.choices.forEach((choice, index) => {
                    adventureResponse += `${choice.text}\n`;
                });
                
                adventureResponse += `\n*Your choices have consequences...*`;
                
                await interaction.reply(adventureResponse);
                break;
        }
    }
});

// Regular message handling with enhanced personality
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    
    if (message.content.toLowerCase().includes('orb')) {
        const userId = message.author.id;
        const serverId = message.guild?.id || 'dm';
        const cultistData = getCultistData(userId);
        const serverData = getServerData(serverId);
        
        // Update mention counts
        cultistData.totalMentions += 1;
        cultistData.encounters += 1;
        serverData.totalMentions += 1;
        
        // Update personality based on behavior
        if (cultistData.totalMentions > 50 && cultistData.sanity < 30) {
            cultistData.personality = 'mad';
        } else if (cultistData.favor > 100) {
            cultistData.personality = 'devoted';
        } else if (cultistData.questionsAsked > 20) {
            cultistData.personality = 'curious';
        }
        
        updateCultistData(userId, cultistData);
        updateServerData(serverId, serverData);
        
        const response = getOrbResponse(cultistData.sanity, cultistData);
        message.channel.send(response);
        
        // Check for achievements
        const achievements = checkAchievements(userId, cultistData);
        if (achievements.length > 0) {
            setTimeout(() => {
                let achMessage = `🏆 ${message.author.displayName} has unlocked:\n`;
                achievements.forEach(ach => {
                    achMessage += `• **${ach.name}** (${ach.reward > 0 ? '+' : ''}${ach.reward} favor)\n`;
                });
                message.channel.send(achMessage);
            }, 2000);
        }
    }
});

// Helper functions
function getRarityByFavor(favor) {
    if (favor < 50) return Math.random() < 0.6 ? 'common' : 'rare';
    if (favor < 150) return Math.random() < 0.4 ? 'common' : Math.random() < 0.7 ? 'rare' : 'epic';
    if (favor < 300) return Math.random() < 0.2 ? 'rare' : Math.random() < 0.6 ? 'epic' : 'legendary';
    return Math.random() < 0.1 ? 'cursed' : 'legendary';
}

function getRandomArtifact(rarity) {
    const artifacts = artifactTypes[rarity];
    const name = artifacts[Math.floor(Math.random() * artifacts.length)];
    return { name, rarity };
}

function getRarityFavor(rarity) {
    const favorMap = { common: 5, rare: 15, epic: 30, legendary: 60, cursed: 100 };
    return favorMap[rarity] || 5;
}

function getSanityLoss(rarity) {
    const sanityMap = { common: 2, rare: 5, epic: 8, legendary: 12, cursed: 20 };
    return sanityMap[rarity] || 2;
}

client.login(process.env.DISCORD_TOKEN);