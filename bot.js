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
const adventureDataFile = path.join(__dirname, 'adventureData.json');

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

function getActiveAdventure(userId) {
    const adventures = loadData(adventureDataFile);
    return adventures[userId] || null;
}

function setActiveAdventure(userId, adventureData) {
    const adventures = loadData(adventureDataFile);
    adventures[userId] = adventureData;
    saveData(adventureDataFile, adventures);
}

function deleteActiveAdventure(userId) {
    const adventures = loadData(adventureDataFile);
    delete adventures[userId];
    saveData(adventureDataFile, adventures);
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
            totalMentions: 0,
            madnessLevel: 0,  // New field for tracking permanent madness
            sacrifices: 0      // New field for tracking sacrifices
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

// Cosmic horror gibberish generator for zero sanity
function generateMadnessText() {
    const madnessFragments = [
        "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn",
        "THE EYES THE EYES THEY SEE THROUGH TIME",
        "Iä! Iä! The Black Goat of the Woods with a Thousand Young!",
        "TEKELI-LI! TEKELI-LI!",
        "The angles are wrong the angles are WRONG THE ANGLES",
        "Y'ha-nthlei mg'nglui ah'legeth ng'gha",
        "THE CRAWLING CHAOS NYARLATHOTEP WALKS",
        "In his house at R'lyeh dead Cthulhu waits dreaming",
        "THE STARS ARE RIGHT THE STARS ARE RIGHT THE STARS",
        "Yog-Sothoth knows the gate. Yog-Sothoth is the gate.",
        "THE YELLOW SIGN HAS BEEN SEEN",
        "Window window window pain pain PAIN WINDOW",
        "They swim through angles we cannot perceive",
        "THE SPIRAL THE SPIRAL THE SPIRAL THE SPIRAL",
        "Azathoth gnaws hungrily in chaos central",
        "THERE IS NO DIFFERENCE BETWEEN SLEEP AND DEATH",
        "The mi-go harvest thoughts like corn",
        "BLACK STARS RISE AND STRANGE MOONS CIRCLE",
        "Have you seen the Yellow Sign? HAVE YOU SEEN IT?",
        "THE DREAMER AWAKENS THE DREAMER AWAKENS"
    ];
    
    // Shuffle the array for true randomness
    const shuffled = [...madnessFragments].sort(() => Math.random() - 0.5);
    const count = Math.floor(Math.random() * 3) + 2;
    return shuffled.slice(0, count).join('\n\n');
}

// Check if response should be madness
function checkMadnessResponse(cultistData) {
    return cultistData.sanity <= 0 || cultistData.madnessLevel >= 3;
}

// Adventure system data
const adventures = {
    start: {
        text: "🌙 **THE MISKATONIC LIBRARY** 🌙\n\nYou enter the abandoned university library at midnight. Moonlight filters through dusty windows, casting eerie shadows between the towering bookshelves. A leather-bound tome lies open on a reading table, its pages fluttering despite the still air. Strange symbols seem to writhe on the visible pages.\n\n**What do you do?**",
        choices: [
            { id: 'read_book', text: 'Read the mysterious book', emoji: '📖' },
            { id: 'explore_stacks', text: 'Explore the book stacks', emoji: '📚' },
            { id: 'leave_immediately', text: 'Leave immediately', emoji: '🚪' }
        ]
    },
    
    read_book: {
        text: "📖 **THE FORBIDDEN TEXT** 📖\n\nYou lean over the ancient tome. The words are written in multiple languages - Latin, Greek, and symbols that hurt to look at directly. As you read, you learn about mathematical proofs that reality is unstable, formulas that describe the geometry of dreams.\n\n*Your vision blurs. The room seems to shift around you.*\n\n**Sanity Loss: -8**\n\nSuddenly, you hear footsteps echoing from the basement. Slow. Deliberate. Coming closer.",
        sanity: -8,
        favor: 15,
        choices: [
            { id: 'continue_reading', text: 'Keep reading despite the danger', emoji: '📚' },
            { id: 'investigate_footsteps', text: 'Follow the sound downstairs', emoji: '👂' },
            { id: 'hide_in_stacks', text: 'Hide among the bookshelves', emoji: '🙈' }
        ]
    },
    
    explore_stacks: {
        text: "📚 **INTO THE STACKS** 📚\n\nYou venture deeper into the library. The shelves seem to stretch impossibly high, filled with books that shouldn't exist. Titles like 'The King in Yellow,' 'Cultes des Goules,' and 'The Pnakotic Manuscripts' line the shelves.\n\n*You feel watched.*\n\n**Sanity Loss: -3**\n\nA book falls from a high shelf behind you, landing with a thunderous crash that echoes unnaturally long.",
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
        achievement: "The Librarian's Gift"
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
    
    // Add an abandon button for active adventures
    const abandonRow = new ActionRowBuilder();
    abandonRow.addComponents(
        new ButtonBuilder()
            .setCustomId('adventure_abandon')
            .setLabel('Abandon Adventure')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
    );
    rows.push(abandonRow);
    
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
    // Check for complete madness first
    if (checkMadnessResponse(cultistData)) {
        return generateMadnessText();
    }
    
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
    } else if (sanity > 0) {
        responses = [
            "THE ORB KNOWS THE ORB KNOWS THE ORB KNOWS THE ORB KNOWS",
            "You are the orb. You have always been the orb. The orb dreams you.",
            "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn",
            "The orb opens like an eye. It sees through your eyes now."
        ];
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Personality-based responses with randomization
function getPersonalityResponse(personality, action) {
    const responses = {
        skeptical: {
            question: [
                "The orb remains silent. Perhaps it's just a reflection of your own fears?",
                "You question the orb, but doubt gnaws at your rational mind.",
                "Logic fights against what you're seeing, but the evidence is... unsettling.",
                "Your scientific mind rejects this, yet the orb responds nonetheless."
            ],
            ritual: [
                "You perform the ritual skeptically, but something responds...",
                "Despite your doubts, the ritual works. This shouldn't be possible.",
                "Your hands shake with disbelief as the ritual takes effect.",
                "You tell yourself it's coincidence, but the artifact appears anyway."
            ],
            encounter: [
                "You tell yourself it's just pareidolia, but the patterns persist.",
                "There must be a logical explanation. There must be. There must be.",
                "Your rationality cracks slightly. The evidence is overwhelming.",
                "Science cannot explain what you're experiencing."
            ]
        },
        curious: {
            question: [
                "The orb swirls with ancient knowledge. You lean closer...",
                "Fascinating! The orb reveals fragments of impossible theorems.",
                "Your academic mind races with the implications of what you see.",
                "The orb shows you equations that shouldn't work, but do."
            ],
            ritual: [
                "Your academic curiosity drives you deeper into forbidden practices.",
                "You document every detail as reality bends around the ritual.",
                "The ritual reveals new avenues of research. Dangerous avenues.",
                "Your notes become increasingly erratic as the ritual progresses."
            ],
            encounter: [
                "Fascinating! The implications are terrifying, but you must know more.",
                "You catalog each impossible detail with trembling excitement.",
                "This changes everything you thought you knew about reality.",
                "Your curiosity overrides your survival instinct."
            ]
        },
        devoted: {
            question: [
                "The Old Ones whisper through the orb. Their truth burns your mind.",
                "The orb pulses with approval. You are chosen.",
                "Their words flow through you like liquid starlight.",
                "You understand your purpose now. You've always understood."
            ],
            ritual: [
                "You perform the ritual with practiced devotion. They are pleased.",
                "The Old Ones guide your hands through the ancient gestures.",
                "Your devotion is rewarded with terrible knowledge.",
                "The ritual flows through you like muscle memory from another life."
            ],
            encounter: [
                "You serve willingly. The Great Work continues through you.",
                "Their presence fills you with dark purpose.",
                "You are but a vessel for their will, and you rejoice in it.",
                "The encounter strengthens your faith in the coming darkness."
            ]
        },
        mad: {
            question: [
                "THEY SPEAK THROUGH THE ORB THE TRUTH THE BEAUTIFUL TRUTH",
                "HA HA HA THE ORB KNOWS YOUR TRUE NAME YOUR REAL NAME",
                "THE QUESTIONS ASK THEMSELVES THROUGH YOUR MOUTH",
                "CAN YOU HEAR THE COLORS? THE ORB SINGS IN ULTRAVIOLET!"
            ],
            ritual: [
                "YES YES YES THE STARS ARE RIGHT THE STARS ARE RIGHT",
                "THE RITUAL PERFORMS YOU NOT THE OTHER WAY AROUND",
                "BLOOD AND GEOMETRY BLOOD AND GEOMETRY BLOOD AND GEOMETRY",
                "THE ARTIFACTS COLLECT YOU NOW DO YOU UNDERSTAND?"
            ],
            encounter: [
                "You laugh at the cosmic joke. Everyone else will understand soon.",
                "THEY WALK BETWEEN THE ANGLES OF YOUR THOUGHTS",
                "THE ENCOUNTER HAS ALWAYS BEEN HAPPENING WILL HAPPEN NEVER STOPPED",
                "YOUR SKIN IS JUST A COSTUME THE REAL YOU CRAWLS BENEATH"
            ]
        }
    };
    
    const personalityResponses = responses[personality]?.[action];
    if (Array.isArray(personalityResponses)) {
        return personalityResponses[Math.floor(Math.random() * personalityResponses.length)];
    }
    return "The orb remains enigmatic.";
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
    'One with the Void': { condition: (data) => data.favor >= 500, reward: 200 },
    'Beyond the Veil': { condition: (data) => data.madnessLevel >= 1, reward: -50 },
    'Born Again': { condition: (data) => data.sacrifices >= 1, reward: 100 }
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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sacrifice_self')
                .setDescription('Offer yourself to the Old Ones for a fresh start')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('meditate')
                .setDescription('Attempt to restore some sanity through meditation')
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
    if (interaction.isButton()) {
        if (interaction.customId === 'adventure_abandon') {
            const userId = interaction.user.id;
            deleteActiveAdventure(userId);
            
            await interaction.update({
                content: "🌙 You flee from the eldritch adventure, but the memories remain...",
                embeds: [],
                components: []
            });
            return;
        }
        
        if (interaction.customId.startsWith('adventure_')) {
            await interaction.deferUpdate(); // Defer the update immediately
            
            const userId = interaction.user.id;
            const choiceId = interaction.customId.replace('adventure_', '');
            
            console.log(`Button clicked by ${userId}, choice: ${choiceId}`);
            
            const adventure = getActiveAdventure(userId);
            if (!adventure) {
                console.log(`No active adventure found for user ${userId}`);
                await interaction.editReply({
                    content: "🌙 You don't have an active adventure. Use `/orb adventure` to start one!",
                    embeds: [],
                    components: []
                });
                return;
            }
            
            const nextNode = adventures[choiceId];
            
            if (!nextNode) {
                console.log(`Invalid choice ${choiceId} for user ${userId}`);
                await interaction.editReply({
                    content: "🌙 Something went wrong with your adventure. Please start a new one.",
                    embeds: [],
                    components: []
                });
                deleteActiveAdventure(userId);
                return;
            }
            
            // Update cultist data
            const cultistData = getCultistData(userId);
            if (nextNode.sanity) {
                cultistData.sanity = Math.max(0, Math.min(100, cultistData.sanity + nextNode.sanity));
                adventure.totalSanityChange += nextNode.sanity;
                
                // Check for zero sanity consequences
                if (cultistData.sanity === 0 && cultistData.madnessLevel === 0) {
                    cultistData.madnessLevel = 1;
                    cultistData.personality = 'mad';
                }
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
            
            // Check if user has gone mad
            if (cultistData.sanity === 0 && !nextNode.ending) {
                embed.addFields({
                    name: '⚠️ MADNESS TAKES HOLD',
                    value: 'Your sanity has shattered. All responses will now reflect your fractured mind.',
                    inline: false
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
                
                deleteActiveAdventure(userId);
                
                await interaction.editReply({
                    embeds: [embed],
                    components: []
                });
            } else {
                adventure.currentNode = choiceId;
                setActiveAdventure(userId, adventure);
                
                const buttons = createAdventureButtons(nextNode.choices);
                embed.setFooter({ text: 'The story continues... choose your next action.' });
                
                await interaction.editReply({
                    embeds: [embed],
                    components: buttons
                });
            }
            return;
        }
    }
    
    // Handle slash commands
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'orb') {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const serverId = interaction.guild?.id || 'dm';
        const cultistData = getCultistData(userId);
        const serverData = getServerData(serverId);
        
        // Check for madness on all responses
        if (checkMadnessResponse(cultistData) && subcommand !== 'sacrifice_self' && subcommand !== 'profile') {
            await interaction.reply(generateMadnessText());
            return;
        }
        
        const event = triggerRandomEvent(serverId, userId);
        
        switch (subcommand) {
            case 'sacrifice_self':
                const embed = new EmbedBuilder()
                    .setTitle('🔥 THE ULTIMATE SACRIFICE 🔥')
                    .setDescription(`${interaction.user.displayName} offers themselves to the Old Ones...`)
                    .addFields(
                        { name: 'Previous Life Stats', value: 
                            `Sanity: ${cultistData.sanity}/100\n` +
                            `Favor: ${cultistData.favor}\n` +
                            `Artifacts: ${cultistData.artifacts.length}\n` +
                            `Achievements: ${cultistData.achievements.length}`, 
                            inline: true 
                        }
                    )
                    .setColor(0x8B0000);
                
                // Reset the cultist data but keep track of sacrifices
                const sacrificeCount = cultistData.sacrifices + 1;
                const newCultistData = {
                    artifacts: [],
                    questionsAsked: 0,
                    lastRitual: 0,
                    sanity: 100,
                    favor: sacrificeCount * 10, // Bonus favor for each sacrifice
                    encounters: 0,
                    achievements: sacrificeCount > 0 ? ['Born Again'] : [],
                    personality: 'skeptical',
                    lastSeen: Date.now(),
                    totalMentions: 0,
                    madnessLevel: 0,
                    sacrifices: sacrificeCount
                };
                
                updateCultistData(userId, newCultistData);
                
                embed.addFields({
                    name: 'New Life Begins', 
                    value: `You have been reborn ${sacrificeCount} time${sacrificeCount > 1 ? 's' : ''}.\n` +
                           `Starting bonus favor: ${newCultistData.favor}`,
                    inline: true
                });
                
                embed.setFooter({ text: 'The cycle continues. The Old Ones remember all.' });
                
                await interaction.reply({ embeds: [embed] });
                break;
                
            case 'meditate':
                const cooldown = 4 * 60 * 60 * 1000; // 4 hours
                const now = Date.now();
                
                if (now - cultistData.lastMeditation < cooldown) {
                    const timeLeft = Math.ceil((cooldown - (now - cultistData.lastMeditation)) / (60 * 1000));
                    await interaction.reply(`🧘 Your mind is too fragmented to meditate again. Try again in ${timeLeft} minutes.`);
                    return;
                }
                
                const sanityGained = Math.floor(Math.random() * 15) + 5;
                cultistData.sanity = Math.min(100, cultistData.sanity + sanityGained);
                cultistData.lastMeditation = now;
                
                // Meditation can reduce madness level if sanity is restored enough
                if (cultistData.sanity > 50 && cultistData.madnessLevel > 0) {
                    cultistData.madnessLevel = Math.max(0, cultistData.madnessLevel - 1);
                }
                
                updateCultistData(userId, cultistData);
                
                await interaction.reply(
                    `🧘 **MEDITATION SESSION**\n\n` +
                    `You close your eyes and attempt to center yourself...\n\n` +
                    `✨ Sanity restored: +${sanityGained}\n` +
                    `💀 Current sanity: ${cultistData.sanity}/100\n\n` +
                    `*The whispers quiet, if only for a moment.*`
                );
                break;
                
            case 'adventure':
                if (getActiveAdventure(userId)) {
                    await interaction.reply({
                        content: "🌙 You are already on an eldritch journey. Complete your current adventure first!",
                        ephemeral: true
                    });
                    return;
                }
                
                const startNode = adventures.start;
                const adventureEmbed = new EmbedBuilder()
                    .setTitle('🔮 ELDRITCH ADVENTURE 🔮')
                    .setDescription(startNode.text)
                    .setColor(0x4B0082)
                    .addFields(
                        { name: '💀 Current Sanity', value: `${cultistData.sanity}/100`, inline: true },
                        { name: '👁️ Current Favor', value: cultistData.favor.toString(), inline: true }
                    )
                    .setFooter({ text: 'Choose wisely... your decisions have consequences.' });
                
                const buttons = createAdventureButtons(startNode.choices);
                
                setActiveAdventure(userId, {
                    currentNode: 'start',
                    startTime: Date.now(),
                    totalSanityChange: 0,
                    totalFavorChange: 0
                });
                
                console.log(`Adventure started for user ${userId}`);
                
                await interaction.reply({
                    embeds: [adventureEmbed],
                    components: buttons
                });
                break;
                
            case 'ritual':
                const ritualNow = Date.now();
                const ritualCooldown = 2 * 60 * 60 * 1000;
                
                if (ritualNow - cultistData.lastRitual < ritualCooldown) {
                    const timeLeft = Math.ceil((ritualCooldown - (ritualNow - cultistData.lastRitual)) / (60 * 1000));
                    await interaction.reply(`🕯️ The cosmic energies are still settling. The stars will be right again in ${timeLeft} minutes.`);
                    return;
                }
                
                const rarity = getRarityByFavor(cultistData.favor);
                const artifact = getRandomArtifact(rarity);
                
                cultistData.artifacts.push(artifact);
                cultistData.lastRitual = ritualNow;
                cultistData.favor += getRarityFavor(artifact.rarity);
                cultistData.sanity -= getSanityLoss(artifact.rarity);
                cultistData.sanity = Math.max(0, cultistData.sanity);
                
                // Check for sanity consequences
                if (cultistData.sanity === 0 && cultistData.madnessLevel === 0) {
                    cultistData.madnessLevel = 1;
                    cultistData.personality = 'mad';
                }
                
                updateCultistData(userId, cultistData);
                
                const achievementsEarned = checkAchievements(userId, cultistData);
                
                let response = `🕯️ **RITUAL COMPLETE** 🕯️\n\n`;
                response += `**${artifact.rarity.toUpperCase()} ARTIFACT ACQUIRED:**\n`;
                response += `🔮 **${artifact.name}**\n`;
                response += `💀 *Sanity: ${cultistData.sanity}/100*\n`;
                response += `👁️ *Favor: ${cultistData.favor}*\n\n`;
                response += `*${getPersonalityResponse(cultistData.personality, 'ritual')}*`;
                
                if (cultistData.sanity === 0) {
                    response += `\n\n⚠️ **YOUR MIND SHATTERS**\nMadness consumes you. All future responses will reflect your fractured psyche.`;
                }
                
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
                        { name: '🏆 Achievements', value: cultistData.achievements.length.toString(), inline: true },
                        { name: '🔥 Times Sacrificed', value: cultistData.sacrifices.toString(), inline: true },
                        { name: '🌀 Madness Level', value: cultistData.madnessLevel.toString(), inline: true }
                    )
                    .setColor(cultistData.sanity > 50 ? 0x008000 : cultistData.sanity > 25 ? 0xFFFF00 : 0xFF0000);
                
                if (cultistData.madnessLevel > 0) {
                    profileEmbed.addFields({
                        name: '⚠️ Mental State',
                        value: 'Your mind has been permanently affected by eldritch knowledge.',
                        inline: false
                    });
                }
                
                if (cultistData.achievements.length > 0) {
                    profileEmbed.addFields({ 
                        name: '🏆 Unlocked Achievements', 
                        value: cultistData.achievements.slice(0, 10).join('\n') + 
                               (cultistData.achievements.length > 10 ? `\n...and ${cultistData.achievements.length - 10} more` : ''), 
                        inline: false 
                    });
                }
                
                await interaction.reply({ embeds: [profileEmbed] });
                break;
                
            case 'question':
                const question = interaction.options.getString('query');
                cultistData.questionsAsked += 1;
                cultistData.sanity -= Math.floor(Math.random() * 5) + 1;
                cultistData.sanity = Math.max(0, cultistData.sanity);
                
                if (cultistData.sanity === 0 && cultistData.madnessLevel === 0) {
                    cultistData.madnessLevel = 1;
                    cultistData.personality = 'mad';
                }
                
                updateCultistData(userId, cultistData);
                
                const personalityResponse = getPersonalityResponse(cultistData.personality, 'question');
                
                let questionResponse = `*You ask: "${question}"*\n\n`;
                questionResponse += `${personalityResponse}\n\n`;
                questionResponse += `💀 *Sanity: ${cultistData.sanity}/100*\n`;
                questionResponse += `*Questions asked: ${cultistData.questionsAsked}*`;
                
                if (cultistData.sanity === 0) {
                    questionResponse += `\n\n⚠️ **YOUR MIND BREAKS**\nThe truth is too much. Madness takes hold.`;
                }
                
                if (event) {
                    questionResponse += `\n\n⚡ **${event.name}:** *${event.message}*`;
                }
                
                await interaction.reply(questionResponse);
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
                
                if (targetData.sanity === 0 && targetData.madnessLevel === 0) {
                    targetData.madnessLevel = 1;
                    targetData.personality = 'mad';
                }
                
                updateCultistData(userId, cultistData);
                updateCultistData(target.id, targetData);
                
                let sacrificeMessage = sacrificeMessages[Math.floor(Math.random() * sacrificeMessages.length)];
                
                if (targetData.sanity === 0) {
                    sacrificeMessage += `\n\n⚠️ **${target.displayName}'s mind shatters from the cosmic attention!**`;
                }
                
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
                    const madnessIndicator = cultist.madnessLevel > 0 ? ' 🌀' : '';
                    leaderboard += `${medal} **${user.username}${madnessIndicator}**\n`;
                    leaderboard += `   └ Favor: ${cultist.favor} | Sanity: ${cultist.sanity}/100 | Artifacts: ${cultist.artifacts.length}\n\n`;
                }
                
                leaderboardEmbed.setDescription(leaderboard || '*No cultists have been blessed yet...*');
                
                await interaction.reply({ embeds: [leaderboardEmbed] });
                break;
                
            case 'stats':
                const totalCultists = Object.keys(loadData(dataFile)).length;
                const totalMentions = serverData.totalMentions;
                const allCultistData = Object.values(loadData(dataFile));
                const avgSanity = totalCultists > 0 ? 
                    allCultistData.reduce((sum, cultist) => sum + cultist.sanity, 0) / totalCultists : 100;
                const madCultists = allCultistData.filter(c => c.madnessLevel > 0).length;
                
                const statsEmbed = new EmbedBuilder()
                    .setTitle('📊 Server Occult Statistics')
                    .setDescription('*The cosmic horror metrics of this realm*')
                    .addFields(
                        { name: '👥 Active Investigators', value: totalCultists.toString(), inline: true },
                        { name: '🔮 Total Orb Mentions', value: totalMentions.toString(), inline: true },
                        { name: '💀 Average Sanity', value: avgSanity.toFixed(1), inline: true },
                        { name: '📜 Recorded Prophecies', value: serverData.prophecies.length.toString(), inline: true },
                        { name: '🌙 Server Sanity Level', value: serverData.serverSanity.toString(), inline: true },
                        { name: '⚡ Event Level', value: serverData.eventLevel.toString(), inline: true },
                        { name: '🌀 Mad Cultists', value: madCultists.toString(), inline: true }
                    )
                    .setColor(0x2F4F4F);
                
                await interaction.reply({ embeds: [statsEmbed] });
                break;
                
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