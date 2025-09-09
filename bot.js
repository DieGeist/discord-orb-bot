const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
            personality: 'skeptical',
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

// Adventure system data
const adventures = {
    start: {
        text: "🌙 **THE MISKATONIC LIBRARY** 🌙\n\nYou enter the abandoned university library at midnight. Moonlight filters through dusty windows, casting eerie shadows between the towering bookshelves. A leather-bound tome lies open on a reading table, its pages fluttering despite the still air. Strange symbols seem to writhe on the visible pages.\n\n**What do you do?**",
        choices: [
            { id: 'read_book', text: 'Read the mysterious book', emoji: '📖' },
            { id: 'explore_stacks', text: 'Explore the book stacks', emoji: '🔍' },
            { id: 'leave_immediately', text: 'Leave immediately', emoji: '🚪' }
        ]
    },
    
    read_book: {
        text: "📖 **THE FORBIDDEN TEXT** 📖\n\nYou lean over the ancient tome. The words are written in multiple languages - Latin, Greek, and symbols that hurt to look at directly. As you read, you learn about mathematical proofs that reality is unstable, formulas that describe the geometry of dreams.\n\n*Your vision blurs. The room seems to shift around you.*\n\n**Sanity Loss: -8**\n\nSudenly, you hear footsteps echoing from the basement. Slow. Deliberate. Coming closer.",
        sanity: -8,
        favor: 15,
        choices: [
            { id: 'continue_reading', text: 'Keep reading despite the danger', emoji: '📚' },
            { id: 'investigate_footsteps', text: 'Follow the sound downstairs', emoji: '👂' },
            { id: 'hide_in_stacks', text: 'Hide among the bookshelves', emoji: '🙈' }
        ]
    },
    
    explore_stacks: {
        text: "🔍 **INTO THE STACKS** 🔍\n\nYou venture deeper into the library. The shelves seem to stretch impossibly high, filled with books that shouldn't exist. Titles like 'The King in Yellow,' 'Cultes des Goules,' and 'The Pnakotic Manuscripts' line the shelves.\n\n*You feel watched.*\n\n**Sanity Loss: -3**\n\nA book falls from a high shelf behind you, landing with a thunderous crash that echoes unnaturally long.",
        sanity: -3,
        favor: 8,
        choices: [
            { id: 'examine_fallen_book', text: 'Examine the fallen book', emoji: '📙' },
            { id: 'look_up_at_shelves', text: 'Look up at the towering shelves', emoji: '👀' },
            { id: 'run_to_exit', text: 'Run toward the exit', emoji: '🏃' }
        ]
    },
    
    leave_immediately: {
        text: "🚪 **RETREAT TO SAFETY** 🚪\n\nWisdom prevails over curiosity. You back toward the entrance, never taking your eyes off the mysterious tome. As you reach the door, you swear you see the pages turn on their own.\n\n*Sometimes, discretion is the better part of valor.*\n\n**Sanity Restored: +5**\n\nBut as you step outside, you notice your shadow has... changed. It seems longer, and occasionally moves independently.",
        sanity: 5,
        favor: 2,
        choices: [
            { id: 'examine_shadow', text: 'Look closer at your shadow', emoji: '👥' },
            { id: 'go_home_quickly', text: 'Head home immediately', emoji: '🏠' },
            { id: 'return_to_library', text: 'Go back into the library', emoji: '↩️' }
        ]
    },
    
    continue_reading: {
        text: "📚 **DEEPER KNOWLEDGE** 📚\n\nYou continue reading despite the approaching footsteps. The text reveals the true nature of angles and dimensions. You learn that π is not what mathematicians think it is. You discover that counting to infinity is not only possible, but dangerous.\n\n*Your mind reels with impossible truths.*\n\n**Sanity Loss: -15**\n**Favor Gained: +25**\n\nThe footsteps stop directly behind you. You can feel cold breath on your neck, but you dare not look up from the pages.",
        sanity: -15,
        favor: 25,
        choices: [
            { id: 'turn_around', text: 'Turn around slowly', emoji: '↩️' },
            { id: 'keep_reading_ignore', text: 'Keep reading, ignore whatever is behind you', emoji: '📖' },
            { id: 'close_book_run', text: 'Slam the book shut and run', emoji: '💨' }
        ]
    },
    
    investigate_footsteps: {
        text: "👂 **INTO THE BASEMENT** 👂\n\nYou follow the sound down a staircase you don't remember seeing before. The basement stretches impossibly far, filled with filing cabinets that reach into darkness. Each drawer is labeled with what appear to be names... including yours.\n\n*The footsteps have stopped.*\n\n**Sanity Loss: -12**\n**Favor Gained: +20**\n\nYou realize you can no longer hear your own footsteps, though you're still walking.",
        sanity: -12,
        favor: 20,
        choices: [
            { id: 'find_your_file', text: 'Find the file with your name', emoji: '🗂️' },
            { id: 'examine_other_files', text: 'Look at other files', emoji: '📋' },
            { id: 'flee_basement', text: 'Run back upstairs', emoji: '⬆️' }
        ]
    },
    
    turn_around: {
        text: "↩️ **THE WATCHER REVEALED** ↩️\n\nYou turn around slowly. Behind you stands a figure in a library coat, but where its face should be is a swirling void filled with distant stars. It nods approvingly at the book in your hands.\n\n'*You may keep it,*' it says without moving its mouth. '*You'll need it for what's coming.*'\n\nThe figure fades away like smoke. You are alone again... or are you?\n\n**🏆 ADVENTURE COMPLETE: The Librarian's Gift**\n**Final Sanity Change: -5**\n**Final Favor: +30**",
        sanity: -5,
        favor: 30,
        ending: 'watcher_gift',
        achievement: 'The Librarian\\'s Gift'
    },
    
    find_your_file: {
        text: "🗂️ **YOUR DOSSIER** 🗂️\n\nYou find the drawer with your name. Inside is a thick file containing photographs of you from times you don't remember, conversations you never had, and a detailed psychological profile that knows you better than you know yourself.\n\nThe last page is tomorrow's date with a single word: '*Ready.*'\n\n**🏆 ADVENTURE COMPLETE: Self-Discovery**\n**Final Sanity Change: -20**\n**Final Favor: +40**",
        sanity: -20,
        favor: 40,
        ending: 'self_discovery',
        achievement: 'Know Thyself'
    },
    
    go_home_quickly: {
        text: "🏠 **FALSE SAFETY** 🏠\n\nYou hurry home and lock the door behind you. But as you turn on the lights, you see that every book in your house has been replaced with copies of the tome from the library.\n\n*They were waiting for you.*\n\n**🏆 ADVENTURE COMPLETE: No Escape**\n**Final Sanity Change: -10**\n**Final Favor: +15**",
        sanity: -10,
        favor: 15,
        ending: 'no_escape',
        achievement: 'There Is No Escape'
    }
};

// Store active adventures
const activeAdventures = new Map();

// Function to create adventure buttons
function createAdventureButtons(choices) {
    const rows = [];
    let currentRow = new ActionRowBuilder();
    
    choices.forEach((choice, index) => {
        const button = new ButtonBuilder()
            .setCustomId(`adventure_${choice.id}`)
            .setLabel(choice.text)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(choice.emoji);
        
        currentRow.addComponents(button);
        
        if ((index + 1) % 5 === 0 || index === choices.length - 1) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
    });
    
    return rows;
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
    
    if (Math.random() < 0.1) {
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

// Handle all interactions (slash commands AND buttons)
client.on('interactionCreate', async interaction => {
    // Handle adventure buttons
    if (interaction.isButton() && interaction.customId.startsWith('adventure_')) {
        const userId = interaction.user.id;
        const choiceId = interaction.customId.replace('adventure_', '');
        
        if (!activeAdventures.has(userId)) {
            await interaction.reply({
                content: "🌙 You don't have an active adventure. Use `/orb adventure` to start one!",
                ephemeral: true
            });
            return;
        }
        
        const adventure = activeAdventures.get(userId);
        const nextNode = adventures[choiceId];
        
        if (!nextNode) {
            await interaction.reply({
                content: "🌙 Something went wrong with your adventure. Please start a new one.",
                ephemeral: true
            });
            activeAdventures.delete(userId);
            return;
        }
        
        // Update cultist data
        const cultistData = getCultistData(userId);
        if (nextNode.sanity) {
            cultistData.sanity = Math.max(0, Math.min(100, cultistData.sanity + nextNode.sanity));
            adventure.totalSanityChange += nextNode.sanity;
        }
        if (nextNode.favor) {
            cultistData.favor += nextNode.favor;
            adventure.totalFavorChange += nextNode.favor;
        }
        
        updateCultistData(userId, cultistData);
        
        // Create response embed
        const embed = new EmbedBuilder()
            .setTitle('🔮 ELDRITCH ADVENTURE 🔮')
            .setDescription(nextNode.text)
            .setColor(nextNode.ending ? 0x8B0000 : 0x4B0082)
            .addFields(
                { name: '💀 Current Sanity', value: `${cultistData.sanity}/100`, inline: true },
                { name: '👁️ Current Favor', value: cultistData.favor.toString(), inline: true }
            );
        
        if (nextNode.sanity) {
            embed.addFields({
                name: nextNode.sanity > 0 ? '💚 Sanity Gained' : '💀 Sanity Lost',
                value: Math.abs(nextNode.sanity).toString(),
                inline: true
            });
        }
        
        // Check if this is an ending
        if (nextNode.ending) {
            embed.setFooter({ text: `Adventure completed in ${Math.floor((Date.now() - adventure.startTime) / 1000)} seconds` });
            
            // Award achievement if specified
            if (nextNode.achievement && !cultistData.achievements.includes(nextNode.achievement)) {
                cultistData.achievements.push(nextNode.achievement);
                updateCultistData(userId, cultistData);
                
                embed.addFields({
                    name: '🏆 Achievement Unlocked!',
                    value: nextNode.achievement,
                    inline: false
                });
            }
            
            activeAdventures.delete(userId);
            
            await interaction.update({
                embeds: [embed],
                components: []
            });
        } else {
            adventure.currentNode = choiceId;
            activeAdventures.set(userId, adventure);
            
            const buttons = createAdventureButtons(nextNode.choices);
            embed.setFooter({ text: 'The story continues... choose your next action.' });
            
            await interaction.update({
                embeds: [embed],
                components: buttons
            });
        }
        return;
    }
    
    // Handle slash commands
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'orb') {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const serverId = interaction.guild?.id || 'dm';
        const cultistData = getCultistData(userId);
        const serverData = getServerData(serverId);
        
        const event = triggerRandomEvent(serverId, userId);
        
        switch (subcommand) {
            case 'adventure':
                if (activeAdventures.has(userId)) {
                    await interaction.reply({
                        content: "🌙 You are already on an eldritch journey. Complete your current adventure first!",
                        ephemeral: true
                    });
                    return;
                }
                
                const startNode = adventures.start;
                const embed = new EmbedBuilder()
                    .setTitle('🔮 ELDRITCH ADVENTURE 🔮')
                    .setDescription(startNode.text)
                    .setColor(0x4B0082)
                    .addFields(
                        { name: '💀 Current Sanity', value: `${cultistData.sanity}/100`, inline: true },
                        { name: '👁️ Current Favor', value: cultistData.favor.toString(), inline: true }
                    )
                    .setFooter({ text: 'Choose wisely... your decisions have consequences.' });
                
                const buttons = createAdventureButtons(startNode.choices);
                
                activeAdventures.set(userId, {
                    currentNode: 'start',
                    startTime: Date.now(),
                    totalSanityChange: 0,
                    totalFavorChange: 0
                });
                
                await interaction.reply({
                    embeds: [embed],
                    components: buttons
                });
                break;
                
            case 'ritual':
                const now = Date.now();
                const cooldown = 2 * 60 * 60 * 1000;
                
                if (now - cultistData.lastRitual < cooldown) {
                    const timeLeft = Math.ceil((cooldown - (now - cultistData.lastRitual)) / (60 * 1000));
                    await interaction.reply(`🕯️ The cosmic energies are still settling. The stars will be right again in ${timeLeft} minutes.`);
                    return;
                }
                
                const rarity = getRarityByFavor(cultistData.favor);
                const artifact = getRandomArtifact(rarity);
                
                cultistData.artifacts.push(artifact);
                cultistData.lastRitual = now;
                cultistData.favor += getRarityFavor(artifact.rarity);
                cultistData.sanity -= getSanityLoss(artifact.rarity);
                cultistData.sanity = Math.max(0, cultistData.sanity);
                
                updateCultistData(userId, cultistData);
                
                const achievementsEarned = checkAchievements(userId, cultistData);
                
                let response = `🕯️ **RITUAL COMPLETE** 🕯️\n\n`;
                response += `**${artifact.rarity.toUpperCase()} ARTIFACT ACQUIRED:**\n`;
                response += `🔮 **${artifact.name}**\n`;
                response += `💀 *Sanity: ${cultistData.sanity}/100*\n`;
                response += `👁️ *Favor: ${cultistData.favor}*\n\n`;
                response += `*${getPersonalityResponse(cultistData.personality, 'ritual')}*`;
                
                if (achievementsEarned.length > 0) {
                    response += `\n\n🏆 **ACHIEVEMENT UNLOCKED:**\n`;
                    achievementsEarned.forEach(ach => {
                        response += `• ${ach.name} (${ach.reward > 0 ? '+' : ''}${ach.reward} favor)\n`;
                    });
                }
                
                if (event) {
                    response += `\n\n⚡ **${event.name}:** *${event.message}*`;
                }
                
                await interaction.reply(response);
                break;
                
            // ... (rest of your existing slash command cases stay the same)
            case 'collection':
                if (cultistData.artifacts.length === 0) {
                    await interaction.reply("📜 Your collection is empty. The Old Ones have not yet blessed you with their gifts. Use `/orb ritual` to seek artifacts.");
                    return;
                }
                
                const collectionEmbed = new EmbedBuilder()
                    .setTitle(`🔮 ${interaction.user.displayName}'s Occult Collection`)
                    .setDescription(`*${cultistData.artifacts.length} artifacts of forbidden knowledge*`)
                    .setColor(0x8B0000);
                
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
                    collectionEmbed.addFields({ name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Artifacts`, value: artifactList, inline: true });
                });
                
                await interaction.reply({ embeds: [collectionEmbed] });
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
                
            // Add other cases as needed...
            default:
                await interaction.reply("🌙 *The orb whispers: This ritual is not yet ready...*");
        }
    }
});

// Regular message handling
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    
    if (message.content.toLowerCase().includes('orb')) {
        const userId = message.author.id;
        const serverId = message.guild?.id || 'dm';
        const cultistData = getCultistData(userId);
        const serverData = getServerData(serverId);
        
        cultistData.totalMentions += 1;
        cultistData.encounters += 1;
        serverData.totalMentions += 1;
        
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
        
        const achievementsEarned = checkAchievements(userId, cultistData);
        if (achievementsEarned.length > 0) {
            setTimeout(() => {
                let achMessage = `🏆 ${message.author.displayName} has unlocked:\n`;
                achievementsEarned.forEach(ach => {
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