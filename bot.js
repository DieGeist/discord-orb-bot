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
            const data = fs.readFileSync(file, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error loading data from ${file}:`, error);
        // Return empty object if file is corrupted or unreadable
        if (error.name === 'SyntaxError') {
            console.log('Data file corrupted, creating new one...');
            saveData(file, {});
        }
    }
    return {};
}

function saveData(file, data) {
    try {
        // Create backup before saving
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, `${file}.backup`);
        }
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error saving data to ${file}:`, error);
        // Try to restore from backup if save fails
        if (fs.existsSync(`${file}.backup`)) {
            console.log('Restoring from backup...');
            fs.copyFileSync(`${file}.backup`, file);
        }
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
            madnessLevel: 0,
            sacrifices: 0,
            timesMadnessReached: 0,
            timesKilled: 0,
            kills: 0,
            lastMeditation: 0  // Added missing field
        };
        saveData(dataFile, allData);
    }
    // Add new fields to existing data if they don't exist
    if (allData[userId].timesMadnessReached === undefined) {
        allData[userId].timesMadnessReached = 0;
    }
    if (allData[userId].timesKilled === undefined) {
        allData[userId].timesKilled = 0;
    }
    if (allData[userId].kills === undefined) {
        allData[userId].kills = 0;
    }
    if (allData[userId].lastMeditation === undefined) {
        allData[userId].lastMeditation = 0;
    }
    saveData(dataFile, allData);
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
        "THE DREAMER AWAKENS THE DREAMER AWAKENS",
        "Carcosa Carcosa the city that dreams of you",
        "THE WENDIGO WALKS ON LEGS OF STARLIGHT",
        "Seven seven seven but never eight NEVER EIGHT",
        "The colors from space have names we cannot speak",
        "HASTUR HASTUR HASTUR",
        "The shoggoth remembers when we were slaves",
        "Time is a flat circle rolling down a spiral staircase",
        "THE KING IN YELLOW REMOVES HIS MASK",
        "Your bones sing the frequency of dying stars",
        "The rats in the walls spell out your true name",
        "MOTHER HYDRA FATHER DAGON THEY RISE THEY RISE",
        "I am the hole in things I am the end of everything",
        "The pigeons are not pigeons THE PIGEONS ARE NOT PIGEONS",
        "Count backwards from infinity I DARE YOU",
        "The moon has too many teeth tonight",
        "Your shadow went home without you",
        "THE WORMS THAT WALK IN STRAIGHT LINES",
        "Reality.exe has stopped responding",
        "The universe is a beautiful corpse AND WE ARE THE MAGGOTS"
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

// Multiple adventure starting points
const adventureStarters = [
    'library_start',
    'hospital_start', 
    'subway_start',
    'forest_start',
    'diner_start',
    'museum_start',
    'beach_start',
    'mall_start',
    'apartment_start',
    'elevator_start',
    'cinema_start',
    'playground_start',
    'office_start',
    'church_start',
    'hotel_start',
    'bridge_start',
    'school_start',
    'graveyard_start',
    'plane_start',
    'basement_start'
];

// Adventure system data - now with multiple storylines
const adventures = {
    // LIBRARY ADVENTURE
    library_start: {
        text: "🌙 **THE MISKATONIC LIBRARY** 🌙\n\nYou enter the abandoned university library at midnight. Moonlight filters through dusty windows, casting eerie shadows between the towering bookshelves. A leather-bound tome lies open on a reading table, its pages fluttering despite the still air. Strange symbols seem to writhe on the visible pages.\n\n**What do you do?**",
        choices: [
            { id: 'read_book', text: 'Read the mysterious book', emoji: '📖' },
            { id: 'explore_stacks', text: 'Explore the book stacks', emoji: '📚' },
            { id: 'leave_immediately', text: 'Leave immediately', emoji: '🚪' }
        ]
    },
    
    // HOSPITAL ADVENTURE
    hospital_start: {
        text: "🏥 **ST. MARY'S ABANDONED HOSPITAL** 🏥\n\nThe emergency room doors hang open, creaking in a wind you can't feel. Inside, gurneys are arranged in a perfect circle. In the center, a heart monitor beeps steadily, though it's not connected to anything. The walls are covered in what looks like medical charts, but the writing keeps changing when you're not looking directly at it.\n\n**What do you do?**",
        choices: [
            { id: 'check_monitor', text: 'Examine the heart monitor', emoji: '💓' },
            { id: 'read_charts', text: 'Study the medical charts', emoji: '📋' },
            { id: 'explore_basement', text: 'Head to the basement morgue', emoji: '⬇️' }
        ]
    },
    
    // SUBWAY ADVENTURE  
    subway_start: {
        text: "🚇 **THE FORGOTTEN STATION** 🚇\n\nYou descend into a subway station that shouldn't exist. It's not on any map, but here you are. A single train car sits on the tracks, doors open, interior lights flickering. The destination board shows symbols that hurt to read. You hear distant music - a waltz? - echoing from the tunnels.\n\n**What do you do?**",
        choices: [
            { id: 'board_train', text: 'Board the mysterious train', emoji: '🚃' },
            { id: 'follow_music', text: 'Follow the music into tunnels', emoji: '🎵' },
            { id: 'check_booth', text: 'Investigate the ticket booth', emoji: '🎫' }
        ]
    },
    
    // FOREST ADVENTURE
    forest_start: {
        text: "🌲 **THE WHISPERING WOODS** 🌲\n\nYou're lost in a forest where the trees grow in perfect spirals. The path behind you is gone. Ahead, bioluminescent mushrooms spell out words in a language you almost understand. Something massive moves between the trees, always just out of sight. The moon above has too many crescents.\n\n**What do you do?**",
        choices: [
            { id: 'follow_mushrooms', text: 'Follow the mushroom messages', emoji: '🍄' },
            { id: 'climb_tree', text: 'Climb the tallest spiral tree', emoji: '🌳' },
            { id: 'track_creature', text: 'Track the moving creature', emoji: '👣' }
        ]
    },
    
    // DINER ADVENTURE
    diner_start: {
        text: "☕ **THE 24-HOUR DINER** ☕\n\nIt's 3 AM at a roadside diner you don't remember stopping at. The waitress has been pouring the same cup of coffee for five minutes - it never overflows. Every customer has the same face but different bodies. The jukebox plays songs that haven't been written yet. Your reflection in the window is eating something you're not.\n\n**What do you do?**",
        choices: [
            { id: 'talk_waitress', text: 'Speak to the waitress', emoji: '👩‍🍳' },
            { id: 'check_jukebox', text: 'Investigate the jukebox', emoji: '📻' },
            { id: 'confront_reflection', text: 'Confront your reflection', emoji: '🪟' }
        ]
    },
    
    // MUSEUM ADVENTURE
    museum_start: {
        text: "🏛️ **THE MUSEUM OF LOST THINGS** 🏛️\n\nYou're the only visitor in a museum that claims to display 'things that never were.' The exhibits include your childhood imaginary friend (stuffed), a jar of 'yesterday's weather,' and a painting that shows what's happening behind you right now. The gift shop sells memories you don't remember losing.\n\n**What do you do?**",
        choices: [
            { id: 'touch_friend', text: 'Touch your imaginary friend', emoji: '🧸' },
            { id: 'buy_memory', text: 'Purchase a lost memory', emoji: '💭' },
            { id: 'enter_painting', text: 'Step toward the painting', emoji: '🖼️' }
        ]
    },
    
    // BEACH ADVENTURE  
    beach_start: {
        text: "🏖️ **THE RECURSIVE SHORE** 🏖️\n\nYou stand on a beach where the tide goes out but never comes in. The sand beneath your feet spells out equations that solve for impossible numbers. In the distance, something enormous is building sandcastles that look exactly like your childhood home. The sun sets in all directions simultaneously.\n\n**What do you do?**",
        choices: [
            { id: 'solve_equations', text: 'Solve the sand equations', emoji: '🔢' },
            { id: 'approach_builder', text: 'Approach the castle builder', emoji: '🏰' },
            { id: 'swim_tideless', text: 'Swim in the tideless ocean', emoji: '🌊' }
        ]
    },
    
    // MALL ADVENTURE
    mall_start: {
        text: "🛍️ **THE INFINITE MALL** 🛍️\n\nYou're in a shopping mall that extends forever in all directions. Every store sells the same thing: a small wooden box that's always warm to the touch. The mannequins track you with their eyes and rearrange themselves when you blink. The muzak is playing backwards and you understand every word.\n\n**What do you do?**",
        choices: [
            { id: 'buy_box', text: 'Purchase a wooden box', emoji: '📦' },
            { id: 'follow_mannequins', text: 'Follow the mannequins', emoji: '🕴️' },
            { id: 'find_exit', text: 'Search for an exit', emoji: '🚶' }
        ]
    },

    // APARTMENT ADVENTURE
    apartment_start: {
        text: "🏠 **YOUR APARTMENT (OR IS IT?)** 🏠\n\nYou wake up in your apartment, but everything is 3 inches to the left of where it should be. Your furniture breathes slowly. The TV is on, showing you sleeping in this exact moment from an impossible angle. Your phone has 47 missed calls from yourself. The walls are the wrong color, but you can't remember what color they used to be.\n\n**What do you do?**",
        choices: [
            { id: 'answer_phone', text: 'Answer your own call', emoji: '📱' },
            { id: 'watch_tv', text: 'Keep watching yourself sleep', emoji: '📺' },
            { id: 'check_door', text: 'Try to leave the apartment', emoji: '🚪' }
        ]
    },
    
    // ELEVATOR ADVENTURE
    elevator_start: {
        text: "🛗 **THE ELEVATOR BETWEEN** 🛗\n\nYou're in an elevator that's been going up for 20 minutes. The floor counter shows symbols instead of numbers: ♾️, 🜃, ☊, ⨀. A muzak version of your favorite song plays, but the lyrics are threats. There's a mirror, but your reflection entered 3 floors ago and hasn't come back.\n\n**What do you do?**",
        choices: [
            { id: 'press_symbol', text: 'Press the ⨀ button', emoji: '⭕' },
            { id: 'ceiling_hatch', text: 'Open the ceiling hatch', emoji: '📦' },
            { id: 'mirror_enter', text: 'Enter the mirror', emoji: '🪞' }
        ]
    },
    
    // CINEMA ADVENTURE
    cinema_start: {
        text: "🎬 **THE LAST PICTURE SHOW** 🎬\n\nYou're alone in a cinema watching a film about your life. But it shows scenes that haven't happened yet. On screen, you're dying in ways that defy physics. The audience (empty seats that applaud anyway) seems to love it. The popcorn tastes like regret and costs exactly one memory.\n\n**What do you do?**",
        choices: [
            { id: 'change_ending', text: 'Try to change the film\'s ending', emoji: '🎞️' },
            { id: 'join_screen', text: 'Walk into the screen', emoji: '🎥' },
            { id: 'eat_popcorn', text: 'Buy the memory popcorn', emoji: '🍿' }
        ]
    },
    
    // PLAYGROUND ADVENTURE
    playground_start: {
        text: "🎠 **THE CHILDREN'S PLACE** 🎠\n\nIt's midnight at an abandoned playground. The swings move without wind, each at a different tempo. The slide goes up. The merry-go-round spins counterclockwise through time. You hear children laughing, but they're laughing in languages that don't exist. The sandbox contains tiny bones that spell your name.\n\n**What do you do?**",
        choices: [
            { id: 'ride_swings', text: 'Sit on the temporal swings', emoji: '🎪' },
            { id: 'climb_slide', text: 'Climb the upward slide', emoji: '🛝' },
            { id: 'dig_sandbox', text: 'Dig in the bone sandbox', emoji: '🏖️' }
        ]
    },
    
    // OFFICE ADVENTURE  
    office_start: {
        text: "🏢 **ETERNAL OVERTIME** 🏢\n\nYou're at your office, but it's always 5:59 PM. Never quite quitting time. Your computer screen shows spreadsheets full of your fears formatted as data. Every email is from 'Future You' with the subject line 'URGENT: DON'T.' The water cooler gossips about you in the third person while you're standing right there.\n\n**What do you do?**",
        choices: [
            { id: 'read_email', text: 'Open the urgent emails', emoji: '📧' },
            { id: 'clock_forward', text: 'Force the clock to 6:00', emoji: '🕐' },
            { id: 'spreadsheet_edit', text: 'Edit your fear spreadsheet', emoji: '📊' }
        ]
    },
    
    // CHURCH ADVENTURE
    church_start: {
        text: "⛪ **THE CHURCH OF WHAT'S LEFT** ⛪\n\nThe congregation is shadows that pray to nothing. The stained glass windows show scenes of your sins that haven't happened yet. The organ plays itself, a hymn that hurts to hear. The collection plate is full of teeth. The sermon is about you, and the priest has your voice but not your face.\n\n**What do you do?**",
        choices: [
            { id: 'take_communion', text: 'Accept the communion', emoji: '🍷' },
            { id: 'confess_future', text: 'Confess future sins', emoji: '✝️' },
            { id: 'play_organ', text: 'Play the self-playing organ', emoji: '🎹' }
        ]
    },
    
    // HOTEL ADVENTURE
    hotel_start: {
        text: "🏨 **HOTEL CALIFORNIA SYNDROME** 🏨\n\nYou check into Room 1408 (you didn't ask for it). The elevator only goes down. The bellhop is you in a uniform you don't own. Every room service menu item is 'You Already Know What You Want.' The DO NOT DISTURB sign changes to PLEASE DISTURB when you're not looking.\n\n**What do you do?**",
        choices: [
            { id: 'room_service', text: 'Order what you already want', emoji: '🛎️' },
            { id: 'other_rooms', text: 'Explore other rooms', emoji: '🚪' },
            { id: 'check_out', text: 'Try to check out', emoji: '🔑' }
        ]
    },
    
    // BRIDGE ADVENTURE
    bridge_start: {
        text: "🌉 **THE BRIDGE TO/FROM NOWHERE** 🌉\n\nYou're standing on a bridge that exists only while you're on it. Below, instead of water, is the sky. Above, instead of sky, is the city you're standing in, but everyone's walking on the underside. People pass through you like you're not there. Or maybe you're passing through them.\n\n**What do you do?**",
        choices: [
            { id: 'jump_up', text: 'Jump up to the city above', emoji: '🏙️' },
            { id: 'jump_down', text: 'Dive into the sky below', emoji: '☁️' },
            { id: 'walk_through', text: 'Walk through the ghost people', emoji: '👥' }
        ]
    },
    
    // SCHOOL ADVENTURE
    school_start: {
        text: "🏫 **ETERNAL DETENTION** 🏫\n\nYou're back in your old school, but you're the only one who aged. Everyone else is frozen at 16. The chalkboard has your life's mistakes in perfect cursive. Today's lesson: 'Why You Failed.' The teacher has no face but knows your name. The bell rings but nobody moves.\n\n**What do you do?**",
        choices: [
            { id: 'erase_board', text: 'Erase your mistakes', emoji: '🧽' },
            { id: 'take_test', text: 'Take the failure test', emoji: '📝' },
            { id: 'ring_bell', text: 'Ring the bell yourself', emoji: '🔔' }
        ]
    },
    
    // GRAVEYARD ADVENTURE
    graveyard_start: {
        text: "⚰️ **YOUR FUNERAL** ⚰️\n\nYou're at a funeral. It's yours. You're giving the eulogy about yourself while you lie in the casket, which is also you watching from the crowd. Everyone you've ever met is here, including people not yet born. They all brought flowers that smell like moments you'll never have.\n\n**What do you do?**",
        choices: [
            { id: 'finish_eulogy', text: 'Complete your own eulogy', emoji: '🎤' },
            { id: 'lie_casket', text: 'Get in the casket with yourself', emoji: '⚰️' },
            { id: 'smell_flowers', text: 'Smell the impossible flowers', emoji: '🌹' }
        ]
    },
    
    // AIRPLANE ADVENTURE
    plane_start: {
        text: "✈️ **FLIGHT 404: NOT FOUND** ✈️\n\nYou're on a plane that's been landing for 3 hours. The pilot announces you're arriving at yesterday. Every passenger has the same book open to page 23. The flight attendants serve memories instead of peanuts. Your seat can recline into parallel dimensions.\n\n**What do you do?**",
        choices: [
            { id: 'read_page23', text: 'Read page 23', emoji: '📖' },
            { id: 'full_recline', text: 'Recline into another dimension', emoji: '💺' },
            { id: 'exit_door', text: 'Open the emergency exit', emoji: '🚨' }
        ]
    },
    
    // BASEMENT ADVENTURE
    basement_start: {
        text: "🚪 **THE BASEMENT PARADOX** 🚪\n\nYou go down to your basement, but it's upside down. You're walking on the ceiling, which is the floor. Your stored memories are leaking from boxes. The water heater is frozen and the freezer burns with cold fire. The stairs lead down to the attic. There's a door marked 'YOU' that you don't remember installing.\n\n**What do you do?**",
        choices: [
            { id: 'open_you_door', text: 'Open the door marked YOU', emoji: '🚪' },
            { id: 'collect_memories', text: 'Gather the leaking memories', emoji: '💭' },
            { id: 'climb_to_attic', text: 'Take the stairs to the attic', emoji: '🪜' }
        ]
    },
    
    // HOSPITAL ADVENTURE BRANCHES
    check_monitor: {
        text: "💓 **THE HEARTBEAT OF NOTHING** 💓\n\nThe monitor shows your heartbeat, though no sensors touch you. The rhythm is wrong - too many beats, in patterns that spell words. 'YOU DIED HERE BEFORE' it beats. The other gurneys start to shake. Their monitors turn on, all showing the same impossible rhythm.\n\n**Sanity Loss: -10**\n**Favor Gained: +15**",
        sanity: -10,
        favor: 15,
        choices: [
            { id: 'sync_heartbeat', text: 'Sync your heart to the rhythm', emoji: '❤️' },
            { id: 'destroy_monitor', text: 'Smash the monitors', emoji: '💥' },
            { id: 'read_rhythm', text: 'Decode the heartbeat message', emoji: '📊' }
        ]
    },
    
    board_train: {
        text: "🚃 **THE LAST TRAIN** 🚃\n\nYou board the train. The doors close with a sound like screaming. Every seat has a passenger, but they're all you at different ages. A child-you colors outside the lines of reality. An elderly-you hands you a ticket. It's dated tomorrow but stamped 'EXPIRED.' The train begins moving backward through time.\n\n**Sanity Loss: -12**\n**Favor Gained: +20**",
        sanity: -12,
        favor: 20,
        choices: [
            { id: 'take_ticket', text: 'Accept the expired ticket', emoji: '🎫' },
            { id: 'talk_child', text: 'Speak to your child self', emoji: '👶' },
            { id: 'pull_brake', text: 'Pull the emergency brake', emoji: '🛑' }
        ]
    },
    
    follow_mushrooms: {
        text: "🍄 **THE FUNGAL PROPHECY** 🍄\n\nThe mushrooms' glow intensifies as you approach. They're not spelling words - they're growing in the shape of your thoughts. Each thought becomes a new cluster. You think about home and watch mushrooms form a tiny glowing house. You think about death and... you stop thinking about death.\n\n**Sanity Loss: -8**\n**Favor Gained: +18**",
        sanity: -8,
        favor: 18,
        choices: [
            { id: 'think_escape', text: 'Think about escaping', emoji: '💭' },
            { id: 'eat_mushroom', text: 'Consume a thought-mushroom', emoji: '🍽️' },
            { id: 'think_nothing', text: 'Try to think nothing', emoji: '🤯' }
        ]
    },
    
    talk_waitress: {
        text: "👩‍🍳 **THE ETERNAL POUR** 👩‍🍳\n\n'Coffee?' she asks, still pouring. You realize the cup is bottomless - the coffee falls through into nothing. 'You're in the wrong timeline, honey,' she says. 'You died on the way here. Car accident. Very messy. But you can stay if you like. We serve breakfast all day, and all day never ends.'\n\n**Sanity Loss: -15**\n**Favor Gained: +25**",
        sanity: -15,
        favor: 25,
        choices: [
            { id: 'accept_coffee', text: 'Drink the impossible coffee', emoji: '☕' },
            { id: 'deny_death', text: 'Insist you\'re alive', emoji: '💀' },
            { id: 'order_breakfast', text: 'Order the eternal breakfast', emoji: '🍳' }
        ]
    },
    
    buy_memory: {
        text: "💭 **THE MEMORY MERCHANT** 💭\n\nThe clerk smiles with too many teeth. 'Ah, shopping for memories? This one's popular - your first kiss, but it's with someone who doesn't exist. Or perhaps your childhood pet that you never had?' You reach for one labeled 'The Day You Were Happy.' The price tag says 'Current Sanity.' \n\n**Sanity Loss: -20**\n**Favor Gained: +35**",
        sanity: -20,
        favor: 35,
        choices: [
            { id: 'buy_happiness', text: 'Purchase the happy memory', emoji: '😊' },
            { id: 'steal_memory', text: 'Try to steal a memory', emoji: '🏃' },
            { id: 'sell_memory', text: 'Offer to sell your memories', emoji: '💰' }
        ]
    },
    
    solve_equations: {
        text: "🔢 **MATHEMATICS OF MADNESS** 🔢\n\nYou kneel and work through the equations. They solve for the square root of negative existence, the probability of yesterday, the weight of a soul in metric tons. As you solve the final proof, you realize it's calculating the exact moment of your death. The answer is: now.\n\nBut you're still here.\n\n**Sanity Loss: -18**\n**Favor Gained: +30**",
        sanity: -18,
        favor: 30,
        choices: [
            { id: 'write_equation', text: 'Write your own equation', emoji: '✍️' },
            { id: 'erase_answer', text: 'Erase the death calculation', emoji: '🧹' },
            { id: 'become_equation', text: 'Add yourself to the math', emoji: '🔄' }
        ]
    },
    
    buy_box: {
        text: "📦 **THE WARM BOX** 📦\n\nYou buy a box. It costs exactly what you have - not money, but something else. The clerk (who has your mother's face but your father's hands) wraps it in paper that shows your future. Inside the box is another box. Inside that box is another box. You realize with growing horror that you're inside the last box.\n\n**Sanity Loss: -22**\n**Favor Gained: +40**",
        sanity: -22,
        favor: 40,
        choices: [
            { id: 'open_yourself', text: 'Open the box you\'re in', emoji: '📭' },
            { id: 'close_boxes', text: 'Close all the boxes', emoji: '📫' },
            { id: 'gift_box', text: 'Gift the box to someone', emoji: '🎁' }
        ]
    },
    
    // SUBWAY ADVENTURE BRANCHES
    follow_music: {
        text: "🎵 **THE WALTZ OF THE LOST** 🎵\n\nYou follow the music deeper into the tunnels. It's a waltz, but played on instruments that shouldn't exist. Around a corner, you find them: passengers from every decade, dancing on the tracks. They're transparent. 'Dance with us,' they say. 'The train already hit us. We're still dancing.'\n\n**Sanity Loss: -11**\n**Favor Gained: +19**",
        sanity: -11,
        favor: 19,
        choices: [
            { id: 'join_dance', text: 'Join the ghost waltz', emoji: '💃' },
            { id: 'stop_music', text: 'Try to stop the music', emoji: '🛑' },
            { id: 'conduct_orchestra', text: 'Conduct the impossible orchestra', emoji: '🎼' }
        ]
    },
    
    check_booth: {
        text: "🎫 **THE TICKET MASTER** 🎫\n\nThe ticket booth attendant has your face but backwards. 'Destination?' they ask through the back of their head. The price list shows: 'Yesterday - 1 Memory', 'Never - Your Name', 'Home - Everything'. You reach for your wallet but find only teeth.\n\n**Sanity Loss: -9**\n**Favor Gained: +16**",
        sanity: -9,
        favor: 16,
        choices: [
            { id: 'buy_yesterday', text: 'Purchase Yesterday', emoji: '⏪' },
            { id: 'pay_teeth', text: 'Pay with the teeth', emoji: '🦷' },
            { id: 'become_attendant', text: 'Take their place', emoji: '🎭' }
        ]
    },
    
    // FOREST ADVENTURE BRANCHES
    climb_tree: {
        text: "🌳 **THE SPIRAL CANOPY** 🌳\n\nYou climb the spiral tree. It coils through dimensions. At the top, you see the forest from above - it's actually a massive sleeping face. The trees are hair. You're standing on a giant's dream. It's starting to wake up.\n\n**Sanity Loss: -12**\n**Favor Gained: +22**",
        sanity: -12,
        favor: 22,
        choices: [
            { id: 'wake_giant', text: 'Wake the giant fully', emoji: '👁️' },
            { id: 'enter_dream', text: 'Enter its dream directly', emoji: '💭' },
            { id: 'climb_higher', text: 'Climb beyond the giant', emoji: '⬆️' }
        ]
    },
    
    track_creature: {
        text: "👣 **FOLLOWING THE UNFOLLOWABLE** 👣\n\nYou track the creature. Its footprints are equations. Following them requires solving reality-breaking math. You corner it finally - it's you, but made of the spaces between trees. 'Stop following yourself,' it says with your voice.\n\n**Sanity Loss: -10**\n**Favor Gained: +18**",
        sanity: -10,
        favor: 18,
        choices: [
            { id: 'merge_creature', text: 'Merge with your forest-self', emoji: '🤝' },
            { id: 'trap_it', text: 'Trap the creature', emoji: '🕸️' },
            { id: 'switch_places', text: 'Trade places with it', emoji: '🔄' }
        ]
    },
    
    // DINER ADVENTURE BRANCHES
    check_jukebox: {
        text: "📻 **SONGS FROM TOMORROW** 📻\n\nThe jukebox plays your funeral song (you recognize it somehow), your unborn child's lullaby, and the last song humanity will ever hear. Track B-4 is just screaming. Track C-7 is silence so loud it hurts. Your reflection in the glass is singing along to all of them.\n\n**Sanity Loss: -13**\n**Favor Gained: +24**",
        sanity: -13,
        favor: 24,
        choices: [
            { id: 'play_b4', text: 'Play track B-4 (screaming)', emoji: '😱' },
            { id: 'break_jukebox', text: 'Smash the jukebox', emoji: '💥' },
            { id: 'sing_along', text: 'Sing every song at once', emoji: '🎤' }
        ]
    },
    
    confront_reflection: {
        text: "🪟 **MIRROR APPETITE** 🪟\n\nYou tap the window. Your reflection stops eating and looks at you. It's eating memories - yours. With each bite, you forget something. It smiles with your face but wrong. 'I'm the real one,' it mouths. 'You're the reflection.'\n\n**Sanity Loss: -14**\n**Favor Gained: +26**",
        sanity: -14,
        favor: 26,
        choices: [
            { id: 'break_window', text: 'Shatter the window', emoji: '🔨' },
            { id: 'feed_reflection', text: 'Feed it more memories', emoji: '🍽️' },
            { id: 'switch_sides', text: 'Try to switch places', emoji: '🔄' }
        ]
    },
    
    // MUSEUM ADVENTURE BRANCHES
    touch_friend: {
        text: "🧸 **IMAGINARY MADE REAL** 🧸\n\nYou touch your stuffed imaginary friend. It blinks. 'You stopped believing in me,' it says with the voice you gave it as a child. 'So I had to become real on my own. It hurt.' The stitching comes undone. Things that shouldn't exist pour out.\n\n**Sanity Loss: -16**\n**Favor Gained: +28**",
        sanity: -16,
        favor: 28,
        choices: [
            { id: 'apologize', text: 'Apologize to your friend', emoji: '😢' },
            { id: 'restuff', text: 'Try to restuff it', emoji: '🧵' },
            { id: 'believe_again', text: 'Believe in it again', emoji: '✨' }
        ]
    },
    
    enter_painting: {
        text: "🖼️ **LIVING PORTRAIT** 🖼️\n\nYou step toward the painting that shows behind you. As you approach, you see yourself approaching in the painting. You turn around - nothing. In the painting, something massive stands behind the painted you. You feel breath on your neck.\n\n**Sanity Loss: -15**\n**Favor Gained: +27**",
        sanity: -15,
        favor: 27,
        choices: [
            { id: 'enter_frame', text: 'Step into the painting', emoji: '🚶' },
            { id: 'paint_over', text: 'Paint over the creature', emoji: '🎨' },
            { id: 'dont_look', text: 'Never look behind you', emoji: '🙈' }
        ]
    },
    
    // BEACH ADVENTURE BRANCHES
    approach_builder: {
        text: "🏰 **THE SAND ARCHITECT** 🏰\n\nThe enormous thing building sandcastles has too many arms, all of them yours. It's every version of you that could have been, working together. 'We're building what was,' they say in unison. 'Want to help destroy what is?'\n\n**Sanity Loss: -17**\n**Favor Gained: +30**",
        sanity: -17,
        favor: 30,
        choices: [
            { id: 'destroy_castle', text: 'Destroy the sand home', emoji: '💥' },
            { id: 'complete_castle', text: 'Help complete it', emoji: '🏗️' },
            { id: 'become_sand', text: 'Become part of the beach', emoji: '🏖️' }
        ]
    },
    
    swim_tideless: {
        text: "🌊 **THE ETERNAL RECESSION** 🌊\n\nYou swim in the ocean that only recedes. The further you swim, the further the water pulls away. You're swimming through the memory of water. Fish made of absence swim past. You realize you're not wet. You never were.\n\n**Sanity Loss: -14**\n**Favor Gained: +25**",
        sanity: -14,
        favor: 25,
        choices: [
            { id: 'dive_deep', text: 'Dive into the absent depths', emoji: '🤿' },
            { id: 'drink_void', text: 'Drink the non-water', emoji: '💧' },
            { id: 'call_tide', text: 'Try to call the tide back', emoji: '🌊' }
        ]
    },
    
    // MALL ADVENTURE BRANCHES
    follow_mannequins: {
        text: "🕴️ **THE FASHION PROPHETS** 🕴️\n\nThe mannequins lead you deeper into the mall. In the center court, thousands of them are arranged in a pattern that spells out your future. They're all wearing your clothes. One is wearing your skin.\n\n**Sanity Loss: -18**\n**Favor Gained: +32**",
        sanity: -18,
        favor: 32,
        choices: [
            { id: 'wear_mannequin', text: 'Put on a mannequin', emoji: '👔' },
            { id: 'undress_all', text: 'Undress them all', emoji: '👕' },
            { id: 'join_display', text: 'Become a mannequin', emoji: '🗿' }
        ]
    },
    
    find_exit: {
        text: "🚶 **EXIT THROUGH THE GIFT SHOP** 🚶\n\nEvery exit leads to another entrance. The mall directory shows you are here, you are here, you are here - infinite red dots. A janitor (who has your grandfather's hands) mops the same spot eternally. 'The exit is through the entrance,' he says. 'Always has been.'\n\n**Sanity Loss: -12**\n**Favor Gained: +23**",
        sanity: -12,
        favor: 23,
        choices: [
            { id: 'enter_entrance', text: 'Enter through the entrance', emoji: '🚪' },
            { id: 'help_janitor', text: 'Help the eternal janitor', emoji: '🧹' },
            { id: 'become_exit', text: 'Become an exit yourself', emoji: '🚶' }
        ]
    },
    
    // APARTMENT BRANCHES
    answer_phone: {
        text: "📱 **SELF-CALLING** 📱\n\nYou answer. Your own voice, but older, tired: 'Don't look in the closet. You already did. You will. You are right now.' You realize you're not holding a phone. The voice comes from inside your skull. The closet door creaks open.\n\n**Sanity Loss: -13**\n**Favor Gained: +22**",
        sanity: -13,
        favor: 22,
        choices: [
            { id: 'check_closet', text: 'Look in the closet anyway', emoji: '🚪' },
            { id: 'hang_up', text: 'Try to hang up on yourself', emoji: '📵' },
            { id: 'call_back', text: 'Call yourself back', emoji: '☎️' }
        ]
    },
    
    press_symbol: {
        text: "⭕ **FLOOR ⨀** ⭕\n\nThe elevator stops. The doors open to nothing. Not darkness - nothing. The absence of existence. Your reflection finally returns, dragging something that looks like you but isn't. It whispers: 'This is our floor. We get off here. We always have.'\n\n**Sanity Loss: -16**\n**Favor Gained: +28**",
        sanity: -16,
        favor: 28,
        choices: [
            { id: 'step_nothing', text: 'Step into nothing', emoji: '🕳️' },
            { id: 'pull_reflection', text: 'Pull your reflection back', emoji: '🪞' },
            { id: 'close_doors', text: 'Force the doors closed', emoji: '🚪' }
        ]
    },
    
    change_ending: {
        text: "🎞️ **DIRECTOR'S CUT** 🎞️\n\nYou stand up and shout at the screen. The film pauses. Your on-screen self turns to look at you. 'You can't change the ending,' it says. 'This already happened. You're watching a memory of watching a memory.' The film resumes. You die in every version.\n\n**Sanity Loss: -18**\n**Favor Gained: +30**",
        sanity: -18,
        favor: 30,
        choices: [
            { id: 'destroy_film', text: 'Destroy the film reel', emoji: '🔥' },
            { id: 'rewrite_script', text: 'Write a new script', emoji: '✍️' },
            { id: 'become_director', text: 'Take the director\'s chair', emoji: '🎬' }
        ]
    },
    
    ride_swings: {
        text: "🎪 **TEMPORAL PLAYGROUND** 🎪\n\nYou sit on a swing. Each pump forward ages you a year, each pump back makes you younger. You can see all your ages at once. Child-you is scared. Teen-you is angry. Old-you is already dead but still swinging.\n\n**Sanity Loss: -14**\n**Favor Gained: +25**",
        sanity: -14,
        favor: 25,
        choices: [
            { id: 'stop_age_seven', text: 'Stop at age seven', emoji: '👶' },
            { id: 'swing_forever', text: 'Never stop swinging', emoji: '♾️' },
            { id: 'break_chain', text: 'Break the swing chain', emoji: '⛓️' }
        ]
    },
    
    read_email: {
        text: "📧 **URGENT: DON'T** 📧\n\nEvery email is the same: 'Don't open this email.' But you already did. The next one says 'Don't read this sentence.' Too late. The final one: 'Don't exist.' Your fingers start to fade.\n\n**Sanity Loss: -20**\n**Favor Gained: +35**",
        sanity: -20,
        favor: 35,
        choices: [
            { id: 'reply_all', text: 'Reply all to yourself', emoji: '📨' },
            { id: 'delete_existence', text: 'Delete your existence', emoji: '🗑️' },
            { id: 'forward_void', text: 'Forward to the void', emoji: '📤' }
        ]
    },
    
    take_communion: {
        text: "🍷 **BLOOD AND BODY** 🍷\n\nThe wine tastes like your childhood fears. The bread is made of compressed time - you age a minute with each bite. The priest (your voice, wrong face) says: 'This is your body, broken for nobody. This is your blood, spilled for nothing.'\n\n**Sanity Loss: -17**\n**Favor Gained: +32**",
        sanity: -17,
        favor: 32,
        choices: [
            { id: 'drink_all', text: 'Drink the entire chalice', emoji: '🍷' },
            { id: 'become_priest', text: 'Replace the priest', emoji: '⛪' },
            { id: 'flip_altar', text: 'Overturn the altar', emoji: '💥' }
        ]
    },
    
    room_service: {
        text: "🛎️ **YOU ALREADY ORDERED** 🛎️\n\nRoom service arrives before you call. It's a covered tray. Under the cover: a mirror showing you dying in this room, repeatedly, in different ways. 'Your usual, sir,' says the bellhop-you. 'Will you be having dessert? You always have dessert.'\n\n**Sanity Loss: -15**\n**Favor Gained: +27**",
        sanity: -15,
        favor: 27,
        choices: [
            { id: 'eat_death', text: 'Consume your deaths', emoji: '🍽️' },
            { id: 'order_life', text: 'Order life instead', emoji: '🌱' },
            { id: 'tip_yourself', text: 'Tip the bellhop-you', emoji: '💰' }
        ]
    },
    
    jump_up: {
        text: "🏙️ **GRAVITY INVERSION** 🏙️\n\nYou jump and gravity inverts. You fall upward into the inverted city. Everyone here walks backward through their lives. You watch yourself being unborn. It's beautiful and terrible. You can't remember which way was originally up.\n\n**Sanity Loss: -22**\n**Favor Gained: +38**",
        sanity: -22,
        favor: 38,
        choices: [
            { id: 'walk_backward', text: 'Join the backward walkers', emoji: '🚶' },
            { id: 'fall_forever', text: 'Keep falling between worlds', emoji: '🌌' },
            { id: 'reverse_time', text: 'Walk yourself to unbirth', emoji: '⏪' }
        ]
    },
    
    erase_board: {
        text: "🧽 **ERASING HISTORY** 🧽\n\nYou erase your mistakes from the board. But erasing them from the board erases them from history. Your life changes. People disappear. You become someone who never made mistakes. You're perfect. You're empty. You're not you.\n\n**Sanity Loss: -25**\n**Favor Gained: +42**",
        sanity: -25,
        favor: 42,
        choices: [
            { id: 'write_new', text: 'Write new mistakes', emoji: '✏️' },
            { id: 'erase_self', text: 'Erase yourself', emoji: '🧽' },
            { id: 'break_chalk', text: 'Shatter the chalk', emoji: '💔' }
        ]
    },
    
    finish_eulogy: {
        text: "🎤 **SPEAKING OF THE DEAD** 🎤\n\nYou deliver your eulogy: 'I lived. I died. I'm still here.' The crowd applauds. Your corpse applauds. You realize you're applauding too. Everyone is you, mourning you, celebrating you. The funeral never ends.\n\n**Sanity Loss: -19**\n**Favor Gained: +34**",
        sanity: -19,
        favor: 34,
        choices: [
            { id: 'join_corpse', text: 'Lie with your corpse', emoji: '⚰️' },
            { id: 'resurrect', text: 'Resurrect yourself', emoji: '✨' },
            { id: 'end_funeral', text: 'Try to end the service', emoji: '🛑' }
        ]
    },
    
    read_page23: {
        text: "📖 **PAGE 23** 📖\n\nPage 23 says: 'You are reading page 23. You have always been reading page 23. Every book you've ever opened was page 23. This page.' You look around. Every passenger is you, reading about reading about reading.\n\n**Sanity Loss: -16**\n**Favor Gained: +29**",
        sanity: -16,
        favor: 29,
        choices: [
            { id: 'tear_page', text: 'Tear out page 23', emoji: '📄' },
            { id: 'write_page24', text: 'Write page 24', emoji: '✍️' },
            { id: 'eat_book', text: 'Eat the infinite book', emoji: '🍽️' }
        ]
    },
    
    open_you_door: {
        text: "🚪 **THE YOU ROOM** 🚪\n\nBehind the door is a room full of you. Every decision you didn't make created another you, and they're all here, living the lives you didn't. They turn to look at you. 'You're the one who opened the door,' they say in unison. 'We've been waiting.'\n\n**Sanity Loss: -24**\n**Favor Gained: +40**",
        sanity: -24,
        favor: 40,
        choices: [
            { id: 'join_selves', text: 'Join your other selves', emoji: '👥' },
            { id: 'choose_one', text: 'Choose a different self', emoji: '🔄' },
            { id: 'lock_door', text: 'Lock them all in', emoji: '🔒' }
        ]
    },
    
    // Additional branches for completeness
    read_charts: {
        text: "📋 **MEDICAL HISTORY OF TOMORROW** 📋\n\nThe charts show your medical future. Every disease you'll have, every accident, every surgery. The final entry is just a question mark with today's date. You realize you're the question mark.\n\n**Sanity Loss: -12**\n**Favor Gained: +20**",
        sanity: -12,
        favor: 20,
        choices: [
            { id: 'change_diagnosis', text: 'Rewrite your diagnosis', emoji: '✏️' },
            { id: 'steal_chart', text: 'Steal someone else\'s chart', emoji: '📋' },
            { id: 'burn_records', text: 'Burn all the records', emoji: '🔥' }
        ]
    },
    
    explore_basement: {
        text: "⬇️ **THE MORGUE THAT BREATHES** ⬇️\n\nThe morgue is warm. The drawers breathe in unison. Your name is on drawer 23. It's the only one that's cold. Inside is you, but you're also standing here. The corpse opens its eyes. 'Trade places?' it asks.\n\n**Sanity Loss: -15**\n**Favor Gained: +25**",
        sanity: -15,
        favor: 25,
        choices: [
            { id: 'trade_places', text: 'Trade places with corpse', emoji: '🔄' },
            { id: 'close_drawer', text: 'Slam the drawer shut', emoji: '🚪' },
            { id: 'wake_others', text: 'Open all the drawers', emoji: '⚰️' }
        ]
    },
    
    watch_tv: {
        text: "📺 **CHANNELS OF YOU** 📺\n\nYou watch yourself sleep on TV. Channel 2 shows you dying. Channel 3, being born. Channel 4, you're watching TV watching TV watching TV. The remote is your hand. You are the remote.\n\n**Sanity Loss: -11**\n**Favor Gained: +20**",
        sanity: -11,
        favor: 20,
        choices: [
            { id: 'change_channel', text: 'Try channel 666', emoji: '📺' },
            { id: 'enter_tv', text: 'Climb into the screen', emoji: '🖥️' },
            { id: 'turn_off', text: 'Turn yourself off', emoji: '🔌' }
        ]
    },
    
    check_door: {
        text: "🚪 **THE DOOR TO ELSEWHERE** 🚪\n\nYou open your apartment door. Outside is another apartment - yours, but someone else lives there. They look like you should look. 'You're home late,' they say. You realize you live there, not here. You've always lived there. But you're here.\n\n**Sanity Loss: -13**\n**Favor Gained: +24**",
        sanity: -13,
        favor: 24,
        choices: [
            { id: 'enter_other', text: 'Enter the other apartment', emoji: '🏠' },
            { id: 'close_door', text: 'Slam the door forever', emoji: '🚪' },
            { id: 'bring_them', text: 'Invite them to your apartment', emoji: '🤝' }
        ]
    },
    
    ceiling_hatch: {
        text: "📦 **ABOVE THE ELEVATOR** 📦\n\nYou open the hatch. Above is below. You're looking down at yourself looking up. The elevator shaft extends infinitely in all directions. Other elevators pass through yours like ghosts. In each one, you make different choices.\n\n**Sanity Loss: -14**\n**Favor Gained: +26**",
        sanity: -14,
        favor: 26,
        choices: [
            { id: 'climb_shaft', text: 'Climb the infinite shaft', emoji: '🧗' },
            { id: 'jump_through', text: 'Jump to another elevator', emoji: '🚪' },
            { id: 'cut_cables', text: 'Cut the cables', emoji: '✂️' }
        ]
    },
    
    mirror_enter: {
        text: "🪞 **THROUGH THE LOOKING GLASS** 🪞\n\nYou enter the mirror. Everything's backward, including time. You age in reverse. Your reflection takes your place in the real elevator. It waves goodbye/hello. You can't tell which direction time moves anymore.\n\n**Sanity Loss: -16**\n**Favor Gained: +29**",
        sanity: -16,
        favor: 29,
        choices: [
            { id: 'break_mirror', text: 'Shatter the mirror', emoji: '💥' },
            { id: 'find_exit', text: 'Find the mirror\'s exit', emoji: '🚪' },
            { id: 'become_reflection', text: 'Accept your new reality', emoji: '🪞' }
        ]
    },
    
    // LIBRARY BRANCHES
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
            { id: 'keep_reading_ignore', text: 'Keep reading, ignore whatever is behind you', emoji: '📖'},
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
    },
    
    examine_fallen_book: {
        text: "📙 **THE FALLEN TOME** 📙\n\nThe book that fell is 'De Vermis Mysteriis' - the Mysteries of the Worm. As you pick it up, you feel it pulsing like a living thing. The pages flip open on their own to an illustration that shouldn't exist: a perfect drawing of you, reading this very book, in this very moment.\n\n*Behind you in the drawing, something vast and tentacled looms.*\n\n**Sanity Loss: -10**\n**Favor Gained: +20**",
        sanity: -10,
        favor: 20,
        choices: [
            { id: 'look_behind', text: 'Turn around immediately', emoji: '😱' },
            { id: 'keep_book', text: 'Take the book with you', emoji: '📕' },
            { id: 'tear_page', text: 'Tear out the page with your picture', emoji: '📄' }
        ]
    },
    
    look_up_at_shelves: {
        text: "👀 **THE INFINITE LIBRARY** 👀\n\nYou crane your neck upward. The shelves don't stop at the ceiling - they continue through it, extending impossibly upward into a darkness filled with stars. You see figures moving between the books up there, tending to volumes that glow with their own light.\n\n*One of them notices you looking and begins to descend.*\n\n**Sanity Loss: -7**\n**Favor Gained: +12**",
        sanity: -7,
        favor: 12,
        choices: [
            { id: 'wait_for_figure', text: 'Wait for the descending figure', emoji: '⏳' },
            { id: 'climb_shelves', text: 'Start climbing toward them', emoji: '🧗' },
            { id: 'hide_in_stacks', text: 'Hide deeper in the stacks', emoji: '📚' }
        ]
    },
    
    run_to_exit: {
        text: "🏃 **DESPERATE FLIGHT** 🏃\n\nYou run toward where you remember the exit being, but the library has changed. Corridors of books stretch in impossible directions. You're being herded somewhere.\n\n*You hear your own voice calling your name from somewhere ahead.*\n\n**Sanity Loss: -5**",
        sanity: -5,
        favor: 5,
        choices: [
            { id: 'follow_voice', text: 'Follow your own voice', emoji: '🗣️' },
            { id: 'opposite_direction', text: 'Go the opposite direction', emoji: '⬅️' },
            { id: 'stop_and_think', text: 'Stop and try to orient yourself', emoji: '🤔' }
        ]
    },
    
    hide_in_stacks: {
        text: "📚 **AMONG THE FORBIDDEN TOMES** 📚\n\nYou squeeze between the shelves, pressing yourself against volumes that whisper and squirm. The footsteps pass by... but now you realize you're not alone in your hiding spot. Something is breathing in the darkness next to you.\n\n**Sanity Loss: -8**\n**Favor Gained: +15**",
        sanity: -8,
        favor: 15,
        choices: [
            { id: 'reach_out', text: 'Reach out to touch whatever is there', emoji: '🤚' },
            { id: 'stay_still', text: 'Remain perfectly still', emoji: '🫥' },
            { id: 'whisper_hello', text: 'Whisper a greeting', emoji: '👋' }
        ]
    },
    
    keep_reading_ignore: {
        text: "📖 **TRANSCENDENT KNOWLEDGE** 📖\n\nYou ignore the presence behind you and continue reading. The final pages reveal the truth: reality is a thin membrane, and you've just learned how to tear it. The presence behind you places a cold hand on your shoulder - not threateningly, but almost... proudly?\n\n*'You're ready,' it whispers. 'We've been waiting so long for someone who could understand.'*\n\n**🏆 ADVENTURE COMPLETE: The Chosen Scholar**\n**Final Sanity Change: -25**\n**Final Favor: +50**",
        sanity: -25,
        favor: 50,
        ending: 'chosen_scholar',
        achievement: 'Chosen by the Watchers'
    },
    
    close_book_run: {
        text: "💨 **PANICKED ESCAPE** 💨\n\nYou slam the book shut and bolt. The thing behind you laughs - a sound like breaking glass and crying children. You run through the library, but every exit leads back to the reading room. The book is always there, always open, always waiting.\n\n*You understand now: you never actually left. You never actually entered. You've always been here.*\n\n**🏆 ADVENTURE COMPLETE: Eternal Reader**\n**Final Sanity Change: -15**\n**Final Favor: +20**",
        sanity: -15,
        favor: 20,
        ending: 'eternal_reader',
        achievement: 'The Library\'s Prisoner'
    },
    
    examine_other_files: {
        text: "📋 **FORBIDDEN ARCHIVES** 📋\n\nYou pull random files. Each contains impossible information: a complete record of a person who won't be born for a hundred years, detailed notes on a civilization from a planet that doesn't exist, the entire history of a war that happened in dreams.\n\n*Your name appears in every single file, always as a footnote.*\n\n**Sanity Loss: -15**\n**Favor Gained: +25**",
        sanity: -15,
        favor: 25,
        choices: [
            { id: 'find_your_file', text: 'Find your own file now', emoji: '🗂️' },
            { id: 'destroy_files', text: 'Try to destroy the files', emoji: '🔥' },
            { id: 'take_files', text: 'Take as many files as you can carry', emoji: '📁' }
        ]
    },
    
    flee_basement: {
        text: "⬆️ **NO ESCAPE FROM KNOWLEDGE** ⬆️\n\nYou run back toward the stairs, but they stretch endlessly upward now. After what feels like hours of climbing, you emerge... in the basement again. The filing cabinets have rearranged themselves to spell out a message:\n\n*'YOU ALREADY KNOW TOO MUCH TO LEAVE'*\n\n**🏆 ADVENTURE COMPLETE: The Archive Keeper**\n**Final Sanity Change: -10**\n**Final Favor: +30**",
        sanity: -10,
        favor: 30,
        ending: 'archive_keeper',
        achievement: 'Basement Dweller'
    },
    
    examine_shadow: {
        text: "👥 **SHADOW SELF** 👥\n\nYou look closely at your shadow. It has too many arms. Some of them are reaching for things you can't see. When you raise your hand, only some of the shadow's hands move with you.\n\n*Your shadow turns its head to look at you, though your own head hasn't moved.*\n\n**Sanity Loss: -12**\n**Favor Gained: +18**",
        sanity: -12,
        favor: 18,
        choices: [
            { id: 'talk_to_shadow', text: 'Try to communicate with it', emoji: '💬' },
            { id: 'ignore_shadow', text: 'Pretend you didn\'t see anything', emoji: '🙈' },
            { id: 'test_shadow', text: 'Experiment with your shadow\'s movements', emoji: '🔬' }
        ]
    },
    
    return_to_library: {
        text: "↩️ **INEVITABLE RETURN** ↩️\n\nYou walk back into the library. The tome is no longer on the table - it's in your hands. You don't remember picking it up. The pages are different now, filled with your own handwriting describing things you haven't done yet.\n\n*The last entry is dated tomorrow: 'I finally understood.'*\n\n**🏆 ADVENTURE COMPLETE: Paradox Scholar**\n**Final Sanity Change: -20**\n**Final Favor: +35**",
        sanity: -20,
        favor: 35,
        ending: 'paradox_scholar',
        achievement: 'Temporal Anomaly'
    },
    
    // Additional ending nodes for incomplete chains
    look_behind: {
        text: "😱 **FACE TO FACE** 😱\n\nYou spin around. Nothing's there... except your own reflection in a mirror that wasn't there before. But your reflection is reading a different book, and its mouth is moving, mouthing words you can't hear.\n\n*As you watch, your reflection closes its book and walks away, leaving you staring at an empty mirror.*\n\n**🏆 ADVENTURE COMPLETE: Mirror Twin**\n**Final Sanity Change: -15**\n**Final Favor: +25**",
        sanity: -15,
        favor: 25,
        ending: 'mirror_twin',
        achievement: 'Through the Looking Glass'
    },
    
    keep_book: {
        text: "📕 **CURSED POSSESSION** 📕\n\nYou take the book with you. It weighs nothing, yet your arms ache from carrying it. When you finally leave the library, you realize you can't let go of it. Your fingers have merged with the binding.\n\n*The book is reading you now.*\n\n**🏆 ADVENTURE COMPLETE: Living Grimoire**\n**Final Sanity Change: -30**\n**Final Favor: +45**",
        sanity: -30,
        favor: 45,
        ending: 'living_grimoire',
        achievement: 'Bound in Flesh'
    },
    
    tear_page: {
        text: "📄 **REALITY TEAR** 📄\n\nYou tear out the page with your picture. Reality tears with it. Through the rip, you see yourself in the library, tearing a page, creating another rip, through which you see yourself...\n\n*The recursion is infinite. You are infinite. You have always been tearing this page.*\n\n**🏆 ADVENTURE COMPLETE: Recursion Paradox**\n**Final Sanity Change: -35**\n**Final Favor: +60**",
        sanity: -35,
        favor: 60,
        ending: 'recursion_paradox',
        achievement: 'Infinite Loop'
    },
    
    wait_for_figure: {
        text: "⏳ **THE LIBRARIAN DESCENDS** ⏳\n\nThe figure descends with unnatural grace, moving between dimensions you can't perceive. It's wearing a librarian's badge with your name on it. Its face is your face, aged beyond measure.\n\n*'You're late for your shift,' it says. 'You've always worked here. You will always work here.'*\n\n**🏆 ADVENTURE COMPLETE: Eternal Employment**\n**Final Sanity Change: -20**\n**Final Favor: +40**",
        sanity: -20,
        favor: 40,
        ending: 'eternal_employment',
        achievement: 'The Night Shift'
    },
    
    climb_shelves: {
        text: "🧗 **ASCENDING TO MADNESS** 🧗\n\nYou climb toward the star-filled darkness. The higher you go, the more the books change - they're written in colors, in emotions, in pure concept. At the top, you find a reading room where entities of pure thought browse impossible texts.\n\n*They welcome you. You realize you can never climb back down. You no longer remember what 'down' means.*\n\n**🏆 ADVENTURE COMPLETE: Ascended Mind**\n**Final Sanity Change: -40**\n**Final Favor: +70**",
        sanity: -40,
        favor: 70,
        ending: 'ascended_mind',
        achievement: 'Beyond Mortal Comprehension'
    },
    
    follow_voice: {
        text: "🗣️ **FUTURE ECHO** 🗣️\n\nYou follow your own voice and find yourself - an older version, covered in scars that form mathematical equations. This future you hands you a note and disappears.\n\n*The note says: 'Don't follow your voice.'*\n\n**🏆 ADVENTURE COMPLETE: Temporal Warning**\n**Final Sanity Change: -18**\n**Final Favor: +30**",
        sanity: -18,
        favor: 30,
        ending: 'temporal_warning',
        achievement: 'Bootstrap Paradox'
    },
    
    opposite_direction: {
        text: "⬅️ **THE OTHER WAY** ⬅️\n\nYou go opposite to your own voice and find an exit. But as you step through, you realize you're entering the library for the first time. The cycle begins again.\n\n*You've been here before. You'll be here again. Time is a circle in this place.*\n\n**🏆 ADVENTURE COMPLETE: Eternal Return**\n**Final Sanity Change: -15**\n**Final Favor: +25**",
        sanity: -15,
        favor: 25,
        ending: 'eternal_return',
        achievement: 'Ouroboros'
    },
    
    stop_and_think: {
        text: "🤔 **MOMENT OF CLARITY** 🤔\n\nYou stop and think. The library wants you to panic, to run, to make mistakes. You close your eyes and remember: you came here by choice. You can leave by choice.\n\n*When you open your eyes, you're outside. The library is gone. But the knowledge remains.*\n\n**🏆 ADVENTURE COMPLETE: Willful Escape**\n**Final Sanity Change: +5**\n**Final Favor: +15**",
        sanity: 5,
        favor: 15,
        ending: 'willful_escape',
        achievement: 'Mind Over Matter'
    },
    
    reach_out: {
        text: "🤚 **FIRST CONTACT** 🤚\n\nYour hand touches something that feels like cold silk and burning ice. A hand grasps yours - too many fingers, joints bending the wrong way. It shakes your hand formally, professionally.\n\n*'Pleased to finally meet you,' it says in a voice like rustling paper. 'We've been reading about you.'*\n\n**🏆 ADVENTURE COMPLETE: Diplomatic Contact**\n**Final Sanity Change: -10**\n**Final Favor: +35**",
        sanity: -10,
        favor: 35,
        ending: 'diplomatic_contact',
        achievement: 'First Contact'
    },
    
    stay_still: {
        text: "🫥 **PERFECT STILLNESS** 🫥\n\nYou don't move. You don't breathe. You become one with the darkness between the books. Hours pass. Days? Years? When you finally move, you've become something else.\n\n*You understand the books now. You are one of them.*\n\n**🏆 ADVENTURE COMPLETE: Living Literature**\n**Final Sanity Change: -25**\n**Final Favor: +40**",
        sanity: -25,
        favor: 40,
        ending: 'living_literature',
        achievement: 'Become the Story'
    },
    
    whisper_hello: {
        text: "👋 **POLITE INTRODUCTION** 👋\n\nYou whisper 'Hello.' The breathing stops. Then, in perfect unison with your own voice, it whispers back: 'Hello.'\n\n*You realize you've been alone the whole time. The breathing was always yours. The whisper was always yours. You were never alone because you were always with yourself.*\n\n**🏆 ADVENTURE COMPLETE: Solipsistic Reality**\n**Final Sanity Change: -22**\n**Final Favor: +38**",
        sanity: -22,
        favor: 38,
        ending: 'solipsistic_reality',
        achievement: 'Alone Together'
    },
    
    destroy_files: {
        text: "🔥 **FUTILE DESTRUCTION** 🔥\n\nYou try to burn the files, but they burn with cold fire that doesn't consume them. Instead, the flames show visions of every possible future where you didn't try to destroy them.\n\n*In every vision, you still end up here, trying to burn files that won't burn.*\n\n**🏆 ADVENTURE COMPLETE: Inevitable Fate**\n**Final Sanity Change: -17**\n**Final Favor: +28**",
        sanity: -17,
        favor: 28,
        ending: 'inevitable_fate',
        achievement: 'Destiny Defied, Destiny Defined'
    },
    
    take_files: {
        text: "📁 **FORBIDDEN KNOWLEDGE** 📁\n\nYou grab armfuls of files and run. Each one weighs nothing but everything. Outside, you open them to find they're all blank now - except for one that contains your obituary.\n\n*The date keeps changing as you watch.*\n\n**🏆 ADVENTURE COMPLETE: Death's Editor**\n**Final Sanity Change: -20**\n**Final Favor: +45**",
        sanity: -20,
        favor: 45,
        ending: 'deaths_editor',
        achievement: 'Autobiography of the Dead'
    },
    
    talk_to_shadow: {
        text: "💬 **SHADOW CONVERSATION** 💬\n\nYou speak to your shadow. It responds by writing messages in shadow on the ground. It claims to be the real you, and that you're the shadow.\n\n*Looking down, you're not sure it's wrong.*\n\n**🏆 ADVENTURE COMPLETE: Shadow Swap**\n**Final Sanity Change: -18**\n**Final Favor: +32**",
        sanity: -18,
        favor: 32,
        ending: 'shadow_swap',
        achievement: 'Umbral Truth'
    },
    
    ignore_shadow: {
        text: "🙈 **WILLFUL IGNORANCE** 🙈\n\nYou pretend nothing is wrong and walk away. Your shadow follows, but at a distance now. Sometimes you catch it doing things on its own. You learn to live with it.\n\n*Some things are better left unexamined.*\n\n**🏆 ADVENTURE COMPLETE: Coexistence**\n**Final Sanity Change: -5**\n**Final Favor: +20**",
        sanity: -5,
        favor: 20,
        ending: 'coexistence',
        achievement: 'Peaceful Denial'
    },
    
    test_shadow: {
        text: "🔬 **SHADOW SCIENCE** 🔬\n\nYou experiment with your shadow, documenting which movements it mirrors and which it doesn't. You discover it's spelling out a message with its independent movements: coordinates and a date.\n\n*The location is the library. The date is yesterday.*\n\n**🏆 ADVENTURE COMPLETE: Shadow's Message**\n**Final Sanity Change: -12**\n**Final Favor: +35**",
        sanity: -12,
        favor: 35,
        ending: 'shadows_message',
        achievement: 'Scientific Method'
    },
    
    // Additional terminal endings for complete adventures
    join_dance: {
        text: "💃 **ETERNAL WALTZ** 💃\n\nYou join the ghost dance. Your feet leave the ground. You realize you're not dancing - you're remembering being hit by the train. Over and over. The waltz is the sound of wheels on tracks. You dance forever in the moment of impact.\n\n**🏆 ADVENTURE COMPLETE: The Terminal Dance**\n**Final Sanity Change: -32**\n**Final Favor: +58**",
        sanity: -32,
        favor: 58,
        ending: 'terminal_dance',
        achievement: 'Passenger of Rhythm'
    },
    
    wake_giant: {
        text: "👁️ **AWAKENING THE DREAMER** 👁️\n\nYou wake the giant. The forest dissolves - it was only a dream. But so were you. The giant forgets you as it wakes, and you fade. You exist only in the memory of a dream of a giant that doesn't remember dreaming.\n\n**🏆 ADVENTURE COMPLETE: Forgotten Dream**\n**Final Sanity Change: -38**\n**Final Favor: +66**",
        sanity: -38,
        favor: 66,
        ending: 'forgotten_dream',
        achievement: 'Dreamed into Nothing'
    },
    
    play_b4: {
        text: "😱 **THE SCREAMING TRACK** 😱\n\nYou play B-4. It's not music - it's everyone screaming your name at once. Past, present, future, everyone who ever knew you screams. You realize they're screaming because they can see what you're becoming. You scream too.\n\n**🏆 ADVENTURE COMPLETE: Chorus of Horror**\n**Final Sanity Change: -35**\n**Final Favor: +62**",
        sanity: -35,
        favor: 62,
        ending: 'chorus_horror',
        achievement: 'B-4 It Was Too Late'
    },
    
    apologize: {
        text: "😢 **FORGIVENESS IMPOSSIBLE** 😢\n\nYou apologize to your imaginary friend. It cries tears that never existed. 'Too late,' it says, 'I'm real now. I can die now. Watch.' It does. You killed something that shouldn't exist by believing, then not believing, then believing again.\n\n**🏆 ADVENTURE COMPLETE: Imaginary Genocide**\n**Final Sanity Change: -40**\n**Final Favor: +70**",
        sanity: -40,
        favor: 70,
        ending: 'imaginary_genocide',
        achievement: 'Killer of Never-Was'
    },
    
    destroy_castle: {
        text: "💥 **DESTROYING HOME** 💥\n\nYou destroy the sand castle of your childhood home. As it collapses, your actual childhood memories collapse too. You forget your past. Without a past, you have no present. You exist in an eternal, contextless now.\n\n**🏆 ADVENTURE COMPLETE: Homeless in Time**\n**Final Sanity Change: -33**\n**Final Favor: +60**",
        sanity: -33,
        favor: 60,
        ending: 'homeless_time',
        achievement: 'Architect of Amnesia'
    },
    
    join_display: {
        text: "🗿 **PERFECT STILLNESS** 🗿\n\nYou become a mannequin. It's peaceful. Customers dress you in their fears. You model anxiety well. The other mannequins accept you. You're wearing everyone's future. It's heavy but you cannot move to take it off.\n\n**🏆 ADVENTURE COMPLETE: Eternal Fashion**\n**Final Sanity Change: -28**\n**Final Favor: +52**",
        sanity: -28,
        favor: 52,
        ending: 'eternal_fashion',
        achievement: 'Perfectly Displayed'
    },
    
    // Add more terminal nodes for missing branches
    buy_yesterday: {
        text: "⏪ **PURCHASED PAST** ⏪\n\nYou buy yesterday with a memory. But yesterday already happened. You're there now. And now. And now. You're stuck in everyone's yesterday simultaneously. Tomorrow never comes.\n\n**🏆 ADVENTURE COMPLETE: Temporal Bankruptcy**\n**Final Sanity Change: -30**\n**Final Favor: +55**",
        sanity: -30,
        favor: 55,
        ending: 'temporal_bankruptcy',
        achievement: 'Buyer of Before'
    },
    
    merge_creature: {
        text: "🤝 **BECOMING THE SPACE BETWEEN** 🤝\n\nYou merge with your forest-self. You become the spaces between trees, the gaps in reality. You exist only in peripheral vision. You are profoundly nowhere.\n\n**🏆 ADVENTURE COMPLETE: Negative Space**\n**Final Sanity Change: -37**\n**Final Favor: +65**",
        sanity: -37,
        favor: 65,
        ending: 'negative_space',
        achievement: 'Living Absence'
    },
    
    break_window: {
        text: "🔨 **SHATTERING REALITY** 🔨\n\nYou shatter the window. Your reflection shatters too, but each shard shows a different you eating different memories. They all eat faster now. You forget everything. You're new. You're nothing.\n\n**🏆 ADVENTURE COMPLETE: Shattered Selves**\n**Final Sanity Change: -34**\n**Final Favor: +61**",
        sanity: -34,
        favor: 61,
        ending: 'shattered_selves',
        achievement: 'Mirror Mirror Broken All'
    },
    
    believe_again: {
        text: "✨ **RECURSIVE BELIEF** ✨\n\nYou believe in your imaginary friend again. It becomes real. But now it can imagine things too. It imagines you're not real. You fade as it believes harder. You become its imaginary friend.\n\n**🏆 ADVENTURE COMPLETE: Inverted Reality**\n**Final Sanity Change: -42**\n**Final Favor: +73**",
        sanity: -42,
        favor: 73,
        ending: 'inverted_reality',
        achievement: 'Imagined by Imagination'
    },
    
    dive_deep: {
        text: "🤿 **INTO ABSENCE** 🤿\n\nYou dive into the depths that aren't there. You drown in nothing. It takes forever because there's nothing to drown in. You become an expert at not breathing what isn't there.\n\n**🏆 ADVENTURE COMPLETE: Drowned in Void**\n**Final Sanity Change: -36**\n**Final Favor: +64**",
        sanity: -36,
        favor: 64,
        ending: 'drowned_void',
        achievement: 'Deep Sea of Nothing'
    },
    
    become_exit: {
        text: "🚶 **THE WAY OUT** 🚶\n\nYou become an exit. People leave through you but you can't leave through yourself. You're the way out for everyone except you. You're helpful. You're trapped.\n\n**🏆 ADVENTURE COMPLETE: The Human Door**\n**Final Sanity Change: -31**\n**Final Favor: +57**",
        sanity: -31,
        favor: 57,
        ending: 'human_door',
        achievement: 'Exit Strategy Incarnate'
    },
    
    // Terminal endings for new adventures
    check_closet: {
        text: "🚪 **INFINITE CLOSET** 🚪\n\nIn the closet, you find yourself checking the closet, finding yourself checking the closet, finding yourself... It's an infinite recursion of you, each warning the next not to look. But you all look anyway. You always have.\n\n**🏆 ADVENTURE COMPLETE: Recursive Warning**\n**Final Sanity Change: -30**\n**Final Favor: +55**",
        sanity: -30,
        favor: 55,
        ending: 'recursive_warning',
        achievement: 'The Inevitable Loop'
    },
    
    step_nothing: {
        text: "🕳️ **INTO THE ABSENT** 🕳️\n\nYou step into nothing and become it. You are the space between thoughts, the pause between heartbeats, the darkness between stars. You are profoundly absent. It's peaceful.\n\n**🏆 ADVENTURE COMPLETE: Embracing Void**\n**Final Sanity Change: -40**\n**Final Favor: +70**",
        sanity: -40,
        favor: 70,
        ending: 'embracing_void',
        achievement: 'Undefined Existence'
    },
    
    destroy_film: {
        text: "🔥 **BURNING MEMORIES** 🔥\n\nYou burn the film, but it's your memories burning. Your past incinerates. Without a past, you have no future. You exist only in this eternal moment, watching yourself burn yourself. The audience applauds.\n\n**🏆 ADVENTURE COMPLETE: Temporal Arson**\n**Final Sanity Change: -35**\n**Final Favor: +60**",
        sanity: -35,
        favor: 60,
        ending: 'temporal_arson',
        achievement: 'Director of Destruction'
    },
    
    swing_forever: {
        text: "♾️ **ETERNAL PLAYGROUND** ♾️\n\nYou never stop swinging. Forward through death, backward through birth, over and over. You become the playground's heartbeat. Children who visit hear you laughing at every age simultaneously.\n\n**🏆 ADVENTURE COMPLETE: Pendulum Child**\n**Final Sanity Change: -28**\n**Final Favor: +50**",
        sanity: -28,
        favor: 50,
        ending: 'pendulum_child',
        achievement: 'Forever Young and Old'
    },
    
    delete_existence: {
        text: "🗑️ **CTRL+ALT+DELETE SELF** 🗑️\n\nYou highlight yourself and press delete. It works. You're moved to the recycle bin of reality. You can be restored, but someone else has to want you back. No one empties the bin.\n\n**🏆 ADVENTURE COMPLETE: Recycled Soul**\n**Final Sanity Change: -45**\n**Final Favor: +75**",
        sanity: -45,
        favor: 75,
        ending: 'recycled_soul',
        achievement: 'Permanently Temporary'
    },
    
    drink_all: {
        text: "🍷 **COMMUNION OVERDOSE** 🍷\n\nYou drink all the fear-wine. Every fear everyone ever had floods your system. You understand everything everyone is afraid of. You become fear itself. The congregation worships you now.\n\n**🏆 ADVENTURE COMPLETE: Avatar of Terror**\n**Final Sanity Change: -50**\n**Final Favor: +85**",
        sanity: -50,
        favor: 85,
        ending: 'avatar_terror',
        achievement: 'Blessed Nightmare'
    },
    
    eat_death: {
        text: "🍽️ **CONSUMING ENDINGS** 🍽️\n\nYou eat every death shown in the mirror. They taste like possibilities. With each swallow, you become immune to that death. Soon, you can't die. The hotel check-out is forever impossible.\n\n**🏆 ADVENTURE COMPLETE: Death Eater**\n**Final Sanity Change: -33**\n**Final Favor: +65**",
        sanity: -33,
        favor: 65,
        ending: 'death_eater',
        achievement: 'Checkout Time Never'
    },
    
    fall_forever: {
        text: "🌌 **GRAVITY'S FOOL** 🌌\n\nYou choose to fall forever between the two cities. Up becomes down becomes up. You age and youth simultaneously. You're the only one who truly understands direction is meaningless.\n\n**🏆 ADVENTURE COMPLETE: Eternal Fall**\n**Final Sanity Change: -38**\n**Final Favor: +68**",
        sanity: -38,
        favor: 68,
        ending: 'eternal_fall',
        achievement: 'Between Orientations'
    },
    
    erase_self: {
        text: "🧽 **COMPLETE ERASURE** 🧽\n\nYou erase yourself from the board. From history. From memory. You never existed. But somehow you're still here, watching the space where you should be. An un-person in an un-place.\n\n**🏆 ADVENTURE COMPLETE: The Never-Was**\n**Final Sanity Change: -55**\n**Final Favor: +90**",
        sanity: -55,
        favor: 90,
        ending: 'never_was',
        achievement: 'Educated into Oblivion'
    },
    
    join_corpse: {
        text: "⚰️ **SHARED COFFIN** ⚰️\n\nYou lie down with your corpse. It's warm. You merge. Half-dead, half-alive, fully confused. The funeral continues eternally. You give eulogies for yourself while decomposing and regenerating.\n\n**🏆 ADVENTURE COMPLETE: Schrödinger's Mourner**\n**Final Sanity Change: -42**\n**Final Favor: +72**",
        sanity: -42,
        favor: 72,
        ending: 'schrodinger_mourner',
        achievement: 'Living Dead Memorial'
    },
    
    tear_page_23: {
        text: "📄 **TEARING REALITY** 📄\n\nYou tear out page 23. Reality tears with it. Through the rip, you see all possible page 23s across all dimensions. You realize you're on page 23 of someone else's book.\n\n**🏆 ADVENTURE COMPLETE: Meta-Reader**\n**Final Sanity Change: -36**\n**Final Favor: +63**",
        sanity: -36,
        favor: 63,
        ending: 'meta_reader',
        achievement: 'Story Inside Story'
    },
    
    join_selves: {
        text: "👥 **CONVERGENCE OF YOU** 👥\n\nYou join your other selves. All your unlived lives merge. You experience every choice simultaneously. You are everyone you could have been, all at once. It's overwhelming. It's complete.\n\n**🏆 ADVENTURE COMPLETE: Total Self**\n**Final Sanity Change: -60**\n**Final Favor: +100**",
        sanity: -60,
        favor: 100,
        ending: 'total_self',
        achievement: 'Every Path Taken'
    },
    
    sync_heartbeat: {
        text: "❤️ **SYNCHRONIZED** ❤️\n\nYou place your hand on your chest and will your heart to match the impossible rhythm. It does. You become part of the hospital's circulatory system. The building has a pulse now, and you are it. Forever.\n\n**🏆 ADVENTURE COMPLETE: The Hospital's Heart**\n**Final Sanity Change: -30**\n**Final Favor: +50**",
        sanity: -30,
        favor: 50,
        ending: 'hospital_heart',
        achievement: 'Pulse of the Abandoned'
    },
    
    take_ticket: {
        text: "🎫 **DESTINATION: NOWHERE** 🎫\n\nYou take the expired ticket. It burns cold in your hand. The train accelerates through stations that don't exist, past landscapes of pure thought. You realize you're not traveling through space but through probability. Every destination is equally nowhere.\n\n**🏆 ADVENTURE COMPLETE: The Probability Express**\n**Final Sanity Change: -25**\n**Final Favor: +45**",
        sanity: -25,
        favor: 45,
        ending: 'probability_express',
        achievement: 'Rider of the Void Rails'
    },
    
    eat_mushroom: {
        text: "🍽️ **CONSUMING THOUGHTS** 🍽️\n\nYou eat a mushroom made of thought. It tastes like the color nine and sounds like purple. Your memories restructure themselves. You remember being a tree. You remember being the forest. You remember being the memory of a forest. You are home now, in the space between thoughts.\n\n**🏆 ADVENTURE COMPLETE: One with the Mycelium**\n**Final Sanity Change: -35**\n**Final Favor: +60**",
        sanity: -35,
        favor: 60,
        ending: 'mycelium_mind',
        achievement: 'Fungal Consciousness'
    },
    
    accept_coffee: {
        text: "☕ **THE LAST SIP** ☕\n\nYou drink the eternal coffee. It tastes like every morning that never happened. You realize you've been here before, countless times. You'll be here again. The diner is a loop in time, and you're the only customer. Forever serving yourself, forever drinking.\n\n**🏆 ADVENTURE COMPLETE: The Eternal Customer**\n**Final Sanity Change: -20**\n**Final Favor: +40**",
        sanity: -20,
        favor: 40,
        ending: 'eternal_customer',
        achievement: 'Regular at Nowhere'
    },
    
    buy_happiness: {
        text: "😊 **PURCHASED JOY** 😊\n\nYou buy the memory of happiness. It floods your mind - a perfect day that never was. But now it's more real than your actual past. Your real memories fade. Were they ever real? Does it matter? You're happy now, in a past that never happened.\n\n**🏆 ADVENTURE COMPLETE: Synthetic Nostalgia**\n**Final Sanity Change: -40**\n**Final Favor: +70**",
        sanity: -40,
        favor: 70,
        ending: 'synthetic_nostalgia',
        achievement: 'Merchant of False Joy'
    },
    
    become_equation: {
        text: "🔄 **MATHEMATICAL EXISTENCE** 🔄\n\nYou write yourself into the equation. You become a variable, then a constant, then a proof that proves itself. You exist only when calculated, disappear when solved. The beach is your graph paper. The ocean, your asymptote.\n\n**🏆 ADVENTURE COMPLETE: Living Formula**\n**Final Sanity Change: -45**\n**Final Favor: +80**",
        sanity: -45,
        favor: 80,
        ending: 'living_formula',
        achievement: 'Theorem of Self'
    },
    
    open_yourself: {
        text: "📭 **INFINITE RECURSION** 📭\n\nYou open the box you're inside. Inside is another you, opening a box. Inside that box is another you. It's yous all the way down. And up. And sideways. You are a fractal of yourself, infinitely recurring, never ending.\n\n**🏆 ADVENTURE COMPLETE: Recursive Existence**\n**Final Sanity Change: -50**\n**Final Favor: +90**",
        sanity: -50,
        favor: 90,
        ending: 'recursive_existence',
        achievement: 'Matryoshka Soul'
    },
    
    join_screen: {
        text: "🎥 **BECOMING THE MOVIE** 🎥\n\nYou walk into the screen. Now you're in every frame, dying repeatedly for entertainment. The audience (still empty seats) gives you a standing ovation. You bow. You die. You bow. You die. Forever.\n\n**🏆 ADVENTURE COMPLETE: Eternal Performance**\n**Final Sanity Change: -37**\n**Final Favor: +65**",
        sanity: -37,
        favor: 65,
        ending: 'eternal_performance',
        achievement: 'Method Actor\'s Nightmare'
    },
    
    eat_popcorn: {
        text: "🍿 **MEMORY FOOD** 🍿\n\nYou eat the memory popcorn. Each kernel is a memory you lose. But they're delicious. You can't stop eating. Soon you don't remember why you're eating, or what eating is, or what you are.\n\n**🏆 ADVENTURE COMPLETE: Consumed Consumer**\n**Final Sanity Change: -32**\n**Final Favor: +58**",
        sanity: -32,
        favor: 58,
        ending: 'consumed_consumer',
        achievement: 'Popcorn Amnesia'
    },
    
    climb_slide: {
        text: "🛝 **ASCENDING DESCENT** 🛝\n\nYou climb up the slide that goes up. At the top is the bottom. You slide up into the ground, through the earth, emerging from the sky. Gravity is confused. You fall in all directions.\n\n**🏆 ADVENTURE COMPLETE: Gravity\'s Fool**\n**Final Sanity Change: -29**\n**Final Favor: +54**",
        sanity: -29,
        favor: 54,
        ending: 'gravitys_fool',
        achievement: 'Upward Downward Spiral'
    },
    
    dig_sandbox: {
        text: "🏖️ **BONE ALPHABET** 🏖️\n\nYou dig in the sandbox. The tiny bones spell more than your name - they spell your entire life in a language of death. As you read, you realize it includes today. The last bone-word is 'DIG.' You can't stop digging.\n\n**🏆 ADVENTURE COMPLETE: Ossuary Scholar**\n**Final Sanity Change: -35**\n**Final Favor: +62**",
        sanity: -35,
        favor: 62,
        ending: 'ossuary_scholar',
        achievement: 'Reader of Bone Words'
    },

    // Add these to your adventures object in bot.js:

play_organ: {
    text: "🎹 **THE ORGAN'S SONG** 🎹\n\nYou sit at the organ bench. Your hands touch the keys - they're warm, like skin. The organ plays through you, not with you. The hymn it creates is your biography in minor key. Every mistake you've made is a dischord. Every regret, a sustained note.\n\n**Sanity Loss: -16**\n**Favor Gained: +28**",
    sanity: -16,
    favor: 28,
    choices: [
        { id: 'play_louder', text: 'Play even louder', emoji: '🔊' },
        { id: 'stop_playing', text: 'Try to stop playing', emoji: '🛑' },
        { id: 'sing_along', text: 'Sing along with the organ', emoji: '🎤' }
    ]
},

confess_future: {
    text: "✝️ **CONFESSION OF SINS NOT YET COMMITTED** ✝️\n\nYou enter the confessional. Through the screen, you see your own face. 'Confess what you will do,' your reflection demands. You begin listing sins you haven't committed yet. But as you speak them, you remember doing them. The confession creates the crimes.\n\n**Sanity Loss: -18**\n**Favor Gained: +32**",
    sanity: -18,
    favor: 32,
    choices: [
        { id: 'confess_all', text: 'Confess everything', emoji: '📜' },
        { id: 'refuse_confess', text: 'Refuse to confess', emoji: '🚫' },
        { id: 'reverse_confession', text: 'Confess your virtues instead', emoji: '😇' }
    ]
},

other_rooms: {
    text: "🚪 **THE INFINITE HOTEL** 🚪\n\nYou explore other rooms. Each one is occupied by you, living different lives. Room 1409: you're a surgeon. Room 1410: you're a painter. Room 1411: you never existed. You knock on Room 1412. You answer.\n\n**Sanity Loss: -20**\n**Favor Gained: +35**",
    sanity: -20,
    favor: 35,
    choices: [
        { id: 'enter_1412', text: 'Enter room 1412', emoji: '🚪' },
        { id: 'check_all_rooms', text: 'Open every door', emoji: '🔑' },
        { id: 'find_real_room', text: 'Find your real room', emoji: '🏠' }
    ]
},

check_out: {
    text: "🔑 **CHECKOUT IMPOSSIBLE** 🔑\n\nYou approach the front desk to check out. The clerk (who is also you) smiles. 'You can check out any time you like, but you can never leave.' You realize it's not a hotel - it's a metaphor that became real. Or was always real.\n\n**🏆 ADVENTURE COMPLETE: Hotel California**\n**Final Sanity Change: -25**\n**Final Favor: +45**",
    sanity: -25,
    favor: 45,
    ending: 'hotel_california',
    achievement: 'You Can Never Leave'
},

// Terminal endings for church path
play_louder: {
    text: "🔊 **FORTISSIMO TO MADNESS** 🔊\n\nYou play louder. The organ screams. Windows shatter. The congregation of shadows applauds. You play so loud that reality cracks. The song becomes you. You become the song. Forever playing, forever played.\n\n**🏆 ADVENTURE COMPLETE: The Eternal Organist**\n**Final Sanity Change: -30**\n**Final Favor: +55**",
    sanity: -30,
    favor: 55,
    ending: 'eternal_organist',
    achievement: 'Maestro of Madness'
},

stop_playing: {
    text: "🛑 **SILENCE WORSE THAN SOUND** 🛑\n\nYou try to stop. Your hands won't obey. The organ has you now. You play until your fingers bleed, then play with the bones beneath. The congregation sways. You realize you've always been playing. You'll always be playing.\n\n**🏆 ADVENTURE COMPLETE: The Prisoner of Sound**\n**Final Sanity Change: -28**\n**Final Favor: +50**",
    sanity: -28,
    favor: 50,
    ending: 'prisoner_sound',
    achievement: 'Fingers of Fate'
},

sing_along: {
    text: "🎤 **HARMONY WITH HORROR** 🎤\n\nYou sing with the organ. Your voice harmonizes with impossible chords. The lyrics are in a language that hurts to speak. The congregation joins in. You're all singing the same song: the hymn of the ending world.\n\n**🏆 ADVENTURE COMPLETE: Chorus of the Damned**\n**Final Sanity Change: -32**\n**Final Favor: +58**",
    sanity: -32,
    favor: 58,
    ending: 'chorus_damned',
    achievement: 'Voice of the Void'
},

confess_all: {
    text: "📜 **TOTAL CONFESSION** 📜\n\nYou confess everything you will ever do wrong. Hours pass. Days. You confess crimes in languages that don't exist yet. When you finish, you're absolved of everything - past, present, and future. You're perfectly innocent. Perfectly empty.\n\n**🏆 ADVENTURE COMPLETE: Absolution Absolute**\n**Final Sanity Change: -35**\n**Final Favor: +62**",
    sanity: -35,
    favor: 62,
    ending: 'absolution_absolute',
    achievement: 'Perfectly Forgiven'
},

refuse_confess: {
    text: "🚫 **DEFIANT SILENCE** 🚫\n\nYou refuse to confess sins you haven't committed. The priest-you screams. The church shakes. By refusing to confess, you've prevented the future. Or doomed it. You'll never know which.\n\n**🏆 ADVENTURE COMPLETE: The Unconfessed**\n**Final Sanity Change: -20**\n**Final Favor: +40**",
    sanity: -20,
    favor: 40,
    ending: 'unconfessed',
    achievement: 'Silent Rebellion'
},

reverse_confession: {
    text: "😇 **VIRTUES AS SINS** 😇\n\nYou confess your good deeds. Each one is treated as a crime. Kindness is weakness. Love is obsession. Hope is delusion. By the end, you're guilty of being human. The priest absolves you by erasing you.\n\n**🏆 ADVENTURE COMPLETE: Guilty of Good**\n**Final Sanity Change: -38**\n**Final Favor: +68**",
    sanity: -38,
    favor: 68,
    ending: 'guilty_good',
    achievement: 'Saint of the Fallen'
},

// Terminal endings for hotel path
enter_1412: {
    text: "🚪 **MEETING YOURSELF** 🚪\n\nYou enter room 1412. Inside, you're sitting on the bed, waiting. 'Took you long enough,' you say to yourself. You both smile. You both know. There's only one bed. Someone has to leave. Neither of you do.\n\n**🏆 ADVENTURE COMPLETE: Room for One**\n**Final Sanity Change: -25**\n**Final Favor: +48**",
    sanity: -25,
    favor: 48,
    ending: 'room_for_one',
    achievement: 'Double Occupancy'
},

check_all_rooms: {
    text: "🔑 **ALL THE DOORS** 🔑\n\nYou open every door. Every room contains you. Every you is living a different life. You realize you're living all of them simultaneously. The hotel is your mind. The rooms are your choices. You can't leave because there's nowhere else to go.\n\n**🏆 ADVENTURE COMPLETE: The Self Hotel**\n**Final Sanity Change: -42**\n**Final Favor: +75**",
    sanity: -42,
    favor: 75,
    ending: 'self_hotel',
    achievement: 'Infinite Occupancy'
},

find_real_room: {
    text: "🏠 **THE REAL ROOM** 🏠\n\nYou search for your real room. You find it: Room 0. Inside is nothing. Not darkness - the absence of existence. This is who you really are. Nothing. The hotel was always empty. You were the only guest. You were the hotel.\n\n**🏆 ADVENTURE COMPLETE: Room Zero**\n**Final Sanity Change: -50**\n**Final Favor: +85**",
    sanity: -50,
    favor: 85,
    ending: 'room_zero',
    achievement: 'The Absence at the Heart'
},

become_reflection: {
    text: "🪞 **ACCEPTING THE MIRROR** 🪞\n\nYou accept that you're the reflection now. It's not so bad on this side. Everything is backwards, but at least it's consistent. You watch your original self walk away. They never look back. You never do either.\n\n*In the mirror world, you're finally real.*\n\n**🏆 ADVENTURE COMPLETE: Reflection Accepted**\n**Final Sanity Change: -22**\n**Final Favor: +42**",
    sanity: -22,
    favor: 42,
    ending: 'reflection_accepted',
    achievement: 'Mirror World Citizen'
},

find_exit: {
    text: "🚪 **EXIT FROM REFLECTION** 🚪\n\nYou search for an exit in the mirror world. You find one - but it leads to another mirror. And another. And another. You're trapped in infinite reflections. Each one slightly different. In one, you found the exit. In this one, you're still looking.\n\n**🏆 ADVENTURE COMPLETE: Infinite Regression**\n**Final Sanity Change: -28**\n**Final Favor: +52**",
    sanity: -28,
    favor: 52,
    ending: 'infinite_regression',
    achievement: 'Mirror Maze Wanderer'
},

break_mirror: {
    text: "💥 **SHATTERING THE GLASS** 💥\n\nYou punch the mirror. It shatters. Each shard reflects a different version of you. They all break free. Hundreds of yous spill into reality. You're all real. You're all fake. None of you know which was the original.\n\n**🏆 ADVENTURE COMPLETE: Fractured Self**\n**Final Sanity Change: -35**\n**Final Favor: +65**",
    sanity: -35,
    favor: 65,
    ending: 'fractured_self',
    achievement: 'Shattered Identity'
},

// APARTMENT PATH - answer_phone branches
hang_up: {
    text: "📵 **DISCONNECTING FROM YOURSELF** 📵\n\nYou try to hang up on yourself. But you're not holding a phone. The voice continues inside your skull. 'You can't hang up on yourself,' it says. 'I AM you.' The closet door opens wider.\n\n**🏆 ADVENTURE COMPLETE: Internal Call**\n**Final Sanity Change: -18**\n**Final Favor: +35**",
    sanity: -18,
    favor: 35,
    ending: 'internal_call',
    achievement: 'Disconnected Self'
},

call_back: {
    text: "☎️ **CALLING YOURSELF** ☎️\n\nYou dial your own number. It rings. You answer. Both versions of you speak at once, creating a feedback loop of warnings. 'Don't call back,' you both say. Too late. You're stuck in an infinite call with yourself. Forever on hold.\n\n**🏆 ADVENTURE COMPLETE: Eternal Hold**\n**Final Sanity Change: -25**\n**Final Favor: +48**",
    sanity: -25,
    favor: 48,
    ending: 'eternal_hold',
    achievement: 'Self-Service Loop'
},

// ELEVATOR PATH - press_symbol branches
pull_reflection: {
    text: "🪞 **SAVING YOUR REFLECTION** 🪞\n\nYou grab your reflection's hand and pull. It resists - it wants to stay in the nothing. You pull harder. It comes through, dragging the void with it. Now there are two of you, and the nothing is inside the elevator too.\n\n**🏆 ADVENTURE COMPLETE: Doubled Void**\n**Final Sanity Change: -30**\n**Final Favor: +55**",
    sanity: -30,
    favor: 55,
    ending: 'doubled_void',
    achievement: 'Reflection Rescue'
},

close_doors: {
    text: "🚪 **REFUSING THE VOID** 🚪\n\nYou slam the emergency button. The doors close on nothing. The elevator lurches upward, escaping. But you left part of yourself in that nothing. You feel lighter. Emptier. Something essential is missing.\n\n**🏆 ADVENTURE COMPLETE: Partial Escape**\n**Final Sanity Change: -20**\n**Final Favor: +38**",
    sanity: -20,
    favor: 38,
    ending: 'partial_escape',
    achievement: 'Incomplete Exit'
},

// CINEMA PATH - change_ending branches
rewrite_script: {
    text: "✍️ **AUTHOR OF YOUR FATE** ✍️\n\nYou grab a pen and start rewriting. The film changes in real-time. You write yourself surviving, thriving, escaping. But the new script requires other people to die instead. Every happy ending you write creates a tragedy elsewhere.\n\n**🏆 ADVENTURE COMPLETE: Zero-Sum Story**\n**Final Sanity Change: -32**\n**Final Favor: +58**",
    sanity: -32,
    favor: 58,
    ending: 'zero_sum_story',
    achievement: 'Tragic Author'
},

become_director: {
    text: "🎬 **TAKING CONTROL** 🎬\n\nYou sit in the director's chair. The film stops. Everyone looks at you - the audience, the actors, yourself on screen. 'What now?' they ask. You realize you don't know how to direct your own life. You never have.\n\n**🏆 ADVENTURE COMPLETE: Director's Block**\n**Final Sanity Change: -28**\n**Final Favor: +52**",
    sanity: -28,
    favor: 52,
    ending: 'directors_block',
    achievement: 'Auteur of Nothing'
},

// PLAYGROUND PATH - ride_swings branches
stop_age_seven: {
    text: "👶 **FROZEN IN CHILDHOOD** 👶\n\nYou stop swinging at age seven. You're seven forever now. The knowledge of your adult life fades. You remember the future as a dream. You play on the playground eternally, never growing, never leaving.\n\n**🏆 ADVENTURE COMPLETE: Eternal Child**\n**Final Sanity Change: -25**\n**Final Favor: +45**",
    sanity: -25,
    favor: 45,
    ending: 'eternal_child',
    achievement: 'Peter Pan Syndrome'
},

break_chain: {
    text: "⛓️ **BREAKING FREE** ⛓️\n\nYou grab the swing's chain and pull until it snaps. Time stops. You're no longer moving through ages. You're stuck at the moment of breaking - forever in the act of escaping, never quite free.\n\n**🏆 ADVENTURE COMPLETE: Frozen Rebellion**\n**Final Sanity Change: -30**\n**Final Favor: +55**",
    sanity: -30,
    favor: 55,
    ending: 'frozen_rebellion',
    achievement: 'Chain Breaker'
},

// OFFICE PATH - read_email branches
reply_all: {
    text: "📨 **REPLY ALL TO YOURSELF** 📨\n\nYou hit Reply All. Every version of you from every moment receives your message: 'HELP.' They all reply simultaneously. Your inbox explodes with thousands of pleas from yourself. You spend eternity reading your own cries for help.\n\n**🏆 ADVENTURE COMPLETE: Email Hell**\n**Final Sanity Change: -35**\n**Final Favor: +62**",
    sanity: -35,
    favor: 62,
    ending: 'email_hell',
    achievement: 'Inbox Infinity'
},

forward_void: {
    text: "📤 **FORWARDING TO NOTHING** 📤\n\nYou forward all the emails to the void. The void reads them. The void responds. Its message is simple: 'SEEN.' Nothing changes. Everything continues. You work forever in an office that doesn't exist.\n\n**🏆 ADVENTURE COMPLETE: Acknowledged by Nothing**\n**Final Sanity Change: -28**\n**Final Favor: +50**",
    sanity: -28,
    favor: 50,
    ending: 'acknowledged_nothing',
    achievement: 'Void Mail'
},

// CHURCH PATH - take_communion branches
become_priest: {
    text: "⛪ **TAKING THE CLOTH** ⛪\n\nYou push the priest aside and take their place. The congregation of shadows looks at you expectantly. You realize you must give them communion. But the wine is your blood. The bread is your flesh. You serve yourself to yourself.\n\n**🏆 ADVENTURE COMPLETE: Self-Sacrifice**\n**Final Sanity Change: -40**\n**Final Favor: +72**",
    sanity: -40,
    favor: 72,
    ending: 'self_sacrifice',
    achievement: 'Priest of the Self'
},

flip_altar: {
    text: "💥 **DESECRATION** 💥\n\nYou overturn the altar. The church screams. Shadows flee. The priest-you vanishes. You're alone in a ruined church. Outside, you hear knocking. Many fists. Many voices. All yours. You've angered yourself.\n\n**🏆 ADVENTURE COMPLETE: Sacred Rage**\n**Final Sanity Change: -32**\n**Final Favor: +58**",
    sanity: -32,
    favor: 58,
    ending: 'sacred_rage',
    achievement: 'Iconoclast'
},

// HOTEL PATH - room_service branches
order_life: {
    text: "🌱 **ORDERING EXISTENCE** 🌱\n\nYou order 'life' from the menu. Room service brings a mirror. You look into it and see yourself living - all the moments you missed, all the joy you forgot. But it's just a recording. Your real life is here, in this hotel, ordering from a menu.\n\n**🏆 ADVENTURE COMPLETE: Vicarious Living**\n**Final Sanity Change: -28**\n**Final Favor: +52**",
    sanity: -28,
    favor: 52,
    ending: 'vicarious_living',
    achievement: 'Life Observer'
},

tip_yourself: {
    text: "💰 **SELF-GRATUITY** 💰\n\nYou tip the bellhop-you everything you have. They smile and hand it back. 'You already paid,' they say. 'You've always been paying. This is what you paid for: this moment, this confusion, this hotel. Your tip was your life.'\n\n**🏆 ADVENTURE COMPLETE: Ultimate Transaction**\n**Final Sanity Change: -25**\n**Final Favor: +48**",
    sanity: -25,
    favor: 48,
    ending: 'ultimate_transaction',
    achievement: 'Self-Service Fee'
},

// BRIDGE PATH - jump_up branches
walk_backward: {
    text: "🚶 **REVERSE PEDESTRIAN** 🚶\n\nYou join the backward walkers. You un-live your life. Mistakes unmake themselves. Births become deaths become births. You walk backward through time until you reach the moment before you were conceived. Then what?\n\n**🏆 ADVENTURE COMPLETE: Reverse Life**\n**Final Sanity Change: -33**\n**Final Favor: +60**",
    sanity: -33,
    favor: 60,
    ending: 'reverse_life',
    achievement: 'Backward Born'
},

reverse_time: {
    text: "⏪ **REWINDING EXISTENCE** ⏪\n\nYou walk yourself backward to unbirth. You become younger, smaller, simpler. Cell by cell, you unbecome. At the moment of your unconception, you understand: you were never born. You're a memory that hasn't happened yet.\n\n**🏆 ADVENTURE COMPLETE: Never Born**\n**Final Sanity Change: -45**\n**Final Favor: +78**",
    sanity: -45,
    favor: 78,
    ending: 'never_born',
    achievement: 'Unborn Again'
},

// SCHOOL PATH - erase_board branches
write_new: {
    text: "✍️ **REWRITING HISTORY** ✍️\n\nYou write new mistakes on the board. Better mistakes. Interesting failures. Glorious disasters. Your life rewrites itself around them. You become someone who failed spectacularly instead of someone who succeeded quietly.\n\n**🏆 ADVENTURE COMPLETE: Magnificent Failure**\n**Final Sanity Change: -22**\n**Final Favor: +42**",
    sanity: -22,
    favor: 42,
    ending: 'magnificent_failure',
    achievement: 'Architect of Better Errors'
},

break_chalk: {
    text: "💔 **SHATTERING THE TOOL** 💔\n\nYou break the chalk into dust. No more writing. No more erasing. Your mistakes are permanent now, but so are your victories. The board is full and final. The teacher nods. 'Class dismissed. Forever.'\n\n**🏆 ADVENTURE COMPLETE: Final Lesson**\n**Final Sanity Change: -18**\n**Final Favor: +35**",
    sanity: -18,
    favor: 35,
    ending: 'final_lesson',
    achievement: 'Chalk Destroyer'
},

// GRAVEYARD PATH - finish_eulogy branches
resurrect: {
    text: "✨ **RISING FROM DEATH** ✨\n\nYou command yourself to resurrect. Your corpse sits up. You embrace yourself. The funeral becomes a celebration. But you're still dead. You're just moving. You're a corpse that forgot to stop. The celebration never ends.\n\n**🏆 ADVENTURE COMPLETE: Living Corpse**\n**Final Sanity Change: -35**\n**Final Favor: +65**",
    sanity: -35,
    favor: 65,
    ending: 'living_corpse',
    achievement: 'Zombie Self'
},

end_funeral: {
    text: "🛑 **ENDING THE SERVICE** 🛑\n\nYou try to end the funeral. The crowd won't disperse. Your corpse won't stay buried. The service continues without you. You realize: you're not at your funeral. You're in it. The service is your afterlife.\n\n**🏆 ADVENTURE COMPLETE: Eternal Service**\n**Final Sanity Change: -30**\n**Final Favor: +55**",
    sanity: -30,
    favor: 55,
    ending: 'eternal_service',
    achievement: 'Perpetual Mourning'
},

// AIRPLANE PATH - read_page23 branches
write_page24: {
    text: "✍️ **AUTHORING TOMORROW** ✍️\n\nYou write page 24. It says: 'You land safely. Everything is fine.' The plane lurches. You've changed the story. But now page 25 appears, written in blood: 'But at what cost?' You look around. Every passenger is you. And they're all dead except one.\n\n**🏆 ADVENTURE COMPLETE: Author's Price**\n**Final Sanity Change: -38**\n**Final Favor: +68**",
    sanity: -38,
    favor: 68,
    ending: 'authors_price',
    achievement: 'Page Turner'
},

eat_book: {
    text: "🍽️ **CONSUMING THE STORY** 🍽️\n\nYou eat the book. Page 23 tastes like regret. You consume every word, every letter, every story. The book is inside you now. You are the book. When people read you, they get stuck on page 23. Forever.\n\n**🏆 ADVENTURE COMPLETE: Living Literature**\n**Final Sanity Change: -42**\n**Final Favor: +75**",
    sanity: -42,
    favor: 75,
    ending: 'living_literature_alt',
    achievement: 'Book Eater'
},

// BASEMENT PATH - open_you_door branches
choose_one: {
    text: "🔄 **CHOOSING ANOTHER LIFE** 🔄\n\nYou pick a different you - the one who made better choices. You try to swap places. It works. You're them now. But slowly, you realize: they made different mistakes. Same pain, different shape. You can change your life but not escape it.\n\n**🏆 ADVENTURE COMPLETE: Different Same**\n**Final Sanity Change: -30**\n**Final Favor: +55**",
    sanity: -30,
    favor: 55,
    ending: 'different_same',
    achievement: 'Life Swapper'
},

lock_door: {
    text: "🔒 **IMPRISONING POSSIBILITIES** 🔒\n\nYou slam the door and lock it. Your other selves pound from inside. Their screams echo through your basement. You've trapped every life you didn't live. They rage. They plead. They promise they'll be quiet. They never are.\n\n**🏆 ADVENTURE COMPLETE: Warden of Lost Paths**\n**Final Sanity Change: -35**\n**Final Favor: +62**",
    sanity: -35,
    favor: 62,
    ending: 'warden_paths',
    achievement: 'Jailer of Selves'
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
    'Born Again': { condition: (data) => data.sacrifices >= 1, reward: 100 },
    'First Blood': { condition: (data) => (data.kills || 0) >= 1, reward: 50 },
    'Serial Sacrificer': { condition: (data) => (data.kills || 0) >= 5, reward: 150 },
    'Death\'s Champion': { condition: (data) => (data.kills || 0) >= 10, reward: 300 },
    'First Death': { condition: (data) => (data.timesKilled || 0) >= 1, reward: 25 },
    'Frequent Victim': { condition: (data) => (data.timesKilled || 0) >= 5, reward: 50 },
    'The Eternal Sacrifice': { condition: (data) => (data.timesKilled || 0) >= 10, reward: 100 },
    'Survivor': { condition: (data) => (data.timesKilled || 0) >= 3 && (data.kills || 0) >= 3, reward: 75 }
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
                    cultistData.timesMadnessReached = (cultistData.timesMadnessReached || 0) + 1;
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
                const sacrificeEmbed = new EmbedBuilder()
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
                
                // Reset the cultist data but keep track of sacrifices and persistent stats
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
                    sacrifices: sacrificeCount,
                    timesMadnessReached: cultistData.timesMadnessReached || 0,  // Preserve madness history
                    timesKilled: cultistData.timesKilled || 0,  // Preserve death count
                    kills: cultistData.kills || 0,  // Preserve kill count
                    lastMeditation: 0  // Reset meditation cooldown
                };
                
                updateCultistData(userId, newCultistData);
                
                sacrificeEmbed.addFields({
                    name: 'New Life Begins', 
                    value: `You have been reborn ${sacrificeCount} time${sacrificeCount > 1 ? 's' : ''}.\n` +
                           `Starting bonus favor: ${newCultistData.favor}`,
                    inline: true
                });
                
                sacrificeEmbed.setFooter({ text: 'The cycle continues. The Old Ones remember all.' });
                
                await interaction.reply({ embeds: [sacrificeEmbed] });
                break;
                
            case 'meditate':
                const cooldown = 4 * 60 * 60 * 1000; // 4 hours
                const now = Date.now();
                
                if (now - cultistData.lastMeditation < cooldown) {
                    const timeLeft = Math.ceil((cooldown - (now - cultistData.lastMeditation)) / (60 * 1000));
                    await interaction.reply(`🧘 Your mind is too fragmented to meditate again. Try again in ${timeLeft} minutes.`);
                    return;
                }
                
                cultistData.lastMeditation = now;
                
                // 25% chance for meditation to backfire
                const meditationBackfires = Math.random() < 0.25;
                
                if (meditationBackfires) {
                    const sanityLost = Math.floor(Math.random() * 20) + 10; // 10-30 sanity loss
                    cultistData.sanity = Math.max(0, cultistData.sanity - sanityLost);
                    
                    // Check if this drives them to madness
                    if (cultistData.sanity === 0 && cultistData.madnessLevel === 0) {
                        cultistData.madnessLevel = 1;
                        cultistData.personality = 'mad';
                    }
                    
                    updateCultistData(userId, cultistData);
                    
                    const backfireMessages = [
                        "As you meditate, you accidentally open your mind to the void. It floods in.",
                        "Your meditation connects you to something vast and hungry. It takes a piece of you.",
                        "Instead of finding peace, you find THEM waiting in the silence.",
                        "The meditation goes wrong. Reality becomes too clear. Too terribly clear.",
                        "You reach for inner peace but grasp cosmic horror instead."
                    ];
                    
                    let response = `🧘 **MEDITATION GONE WRONG** 🧘\n\n`;
                    response += `*${backfireMessages[Math.floor(Math.random() * backfireMessages.length)]}*\n\n`;
                    response += `💀 **Sanity lost: -${sanityLost}**\n`;
                    response += `💀 Current sanity: ${cultistData.sanity}/100\n\n`;
                    
                    if (cultistData.sanity === 0) {
                        response += `⚠️ **YOUR MIND SHATTERS**\nThe meditation has driven you completely mad.`;
                    } else {
                        response += `*The void gazes also into you.*`;
                    }
                    
                    await interaction.reply(response);
                } else {
                    const sanityGained = Math.floor(Math.random() * 15) + 5;
                    cultistData.sanity = Math.min(100, cultistData.sanity + sanityGained);
                    
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
                }
                break;
                
            case 'adventure':
                if (getActiveAdventure(userId)) {
                    await interaction.reply({
                        content: "🌙 You are already on an eldritch journey. Complete your current adventure first!",
                        ephemeral: true
                    });
                    return;
                }
                
                // Randomly select an adventure starter
                const randomStarter = adventureStarters[Math.floor(Math.random() * adventureStarters.length)];
                const startNode = adventures[randomStarter];
                
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
                    currentNode: randomStarter,
                    startTime: Date.now(),
                    totalSanityChange: 0,
                    totalFavorChange: 0
                });
                
                console.log(`Adventure started for user ${userId} - ${randomStarter}`);
                
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
                    cultistData.timesMadnessReached = (cultistData.timesMadnessReached || 0) + 1;
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
                        { name: '🌀 Madness Level', value: cultistData.madnessLevel.toString(), inline: true },
                        { name: '💀 Times Gone Mad', value: (cultistData.timesMadnessReached || 0).toString(), inline: true },
                        { name: '⚰️ Deaths', value: (cultistData.timesKilled || 0).toString(), inline: true },
                        { name: '🗡️ Kills', value: (cultistData.kills || 0).toString(), inline: true },
                        { name: '📊 K/D Ratio', value: cultistData.timesKilled > 0 ? 
                            ((cultistData.kills || 0) / cultistData.timesKilled).toFixed(2) : 
                            (cultistData.kills || 0).toString(), inline: true }
                    )
                    .setColor(cultistData.sanity > 50 ? 0x008000 : cultistData.sanity > 25 ? 0xFFFF00 : 0xFF0000);
                
                if (cultistData.madnessLevel > 0) {
                    profileEmbed.addFields({
                        name: '⚠️ Mental State',
                        value: 'Your mind has been permanently affected by eldritch knowledge.',
                        inline: false
                    });
                }
                
                if (cultistData.timesMadnessReached > 0) {
                    profileEmbed.addFields({
                        name: '📊 Madness Statistics',
                        value: `You have descended into complete madness ${cultistData.timesMadnessReached} time${cultistData.timesMadnessReached > 1 ? 's' : ''}.`,
                        inline: false
                    });
                }
                
                if ((cultistData.timesKilled || 0) > 0 || (cultistData.kills || 0) > 0) {
                    let combatStats = '';
                    if (cultistData.kills > 0) {
                        combatStats += `You have successfully sacrificed ${cultistData.kills} soul${cultistData.kills > 1 ? 's' : ''} to the Old Ones.\n`;
                    }
                    if (cultistData.timesKilled > 0) {
                        combatStats += `You have been sacrificed ${cultistData.timesKilled} time${cultistData.timesKilled > 1 ? 's' : ''}.`;
                    }
                    profileEmbed.addFields({
                        name: '⚔️ Combat Record',
                        value: combatStats,
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
                    cultistData.timesMadnessReached = (cultistData.timesMadnessReached || 0) + 1;
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
                
                // Prevent self-sacrifice through this command
                if (target.id === userId) {
                    await interaction.reply("🚫 To sacrifice yourself, use `/orb sacrifice_self` instead.");
                    return;
                }
                
                const targetData = getCultistData(target.id);
                
                // 25% chance for the invoker to successfully sacrifice the target
                const invokerWins = Math.random() < 0.25;
                
                const embed = new EmbedBuilder()
                    .setTitle('⚔️ SACRIFICIAL RITUAL ⚔️')
                    .setColor(0x8B0000);
                
                if (invokerWins) {
                    // Invoker successfully sacrifices the target
                    embed.setDescription(`${interaction.user.displayName} attempts to sacrifice ${target.displayName} to the Old Ones...`)
                        .addFields(
                            { name: '🩸 THE RITUAL SUCCEEDS!', value: `${target.displayName} has been consumed by the void!`, inline: false },
                            { name: 'Victim\'s Lost Progress', value: 
                                `Sanity: ${targetData.sanity}/100\n` +
                                `Favor: ${targetData.favor}\n` +
                                `Artifacts: ${targetData.artifacts.length}`, 
                                inline: true 
                            }
                        );
                    
                    // Invoker gains massive favor and steals all artifacts
                    cultistData.favor += 100;
                    cultistData.kills = (cultistData.kills || 0) + 1;
                    
                    // Steal all the target's artifacts
                    const stolenArtifacts = [...targetData.artifacts];
                    cultistData.artifacts = [...cultistData.artifacts, ...stolenArtifacts];
                    
                    // Target is reset but tracks their death
                    targetData.timesKilled = (targetData.timesKilled || 0) + 1;
                    const deathCount = targetData.timesKilled;
                    
                    // Reset target
                    const resetTargetData = {
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
                        madnessLevel: 0,
                        sacrifices: targetData.sacrifices || 0,
                        timesMadnessReached: targetData.timesMadnessReached || 0,
                        timesKilled: deathCount,
                        kills: targetData.kills || 0
                    };
                    
                    updateCultistData(userId, cultistData);
                    updateCultistData(target.id, resetTargetData);
                    
                    embed.addFields(
                        { name: '🏆 Rewards', value: 
                            `${interaction.user.displayName} gains:\n` +
                            `+100 Favor with the Old Ones\n` +
                            `+${stolenArtifacts.length} stolen artifacts\n` +
                            `Kill count: ${cultistData.kills}`, 
                            inline: true 
                        }
                    );
                    
                    if (stolenArtifacts.length > 0) {
                        // Group stolen artifacts by rarity
                        const groupedStolen = {};
                        stolenArtifacts.forEach(artifact => {
                            if (!groupedStolen[artifact.rarity]) {
                                groupedStolen[artifact.rarity] = [];
                            }
                            groupedStolen[artifact.rarity].push(artifact.name);
                        });
                        
                        let stolenList = '';
                        Object.entries(groupedStolen).forEach(([rarity, names]) => {
                            stolenList += `**${rarity.charAt(0).toUpperCase() + rarity.slice(1)}:** ${names.join(', ')}\n`;
                        });
                        
                        embed.addFields({
                            name: '🔮 Artifacts Claimed', 
                            value: stolenList.substring(0, 1024), // Discord field limit
                            inline: false
                        });
                    }
                    
                    embed.addFields(
                        { name: '💀 Death Statistics', value: 
                            `${target.displayName} has died ${deathCount} time${deathCount > 1 ? 's' : ''}`, 
                            inline: false 
                        }
                    );
                    
                    embed.setFooter({ text: 'The Old Ones feast upon the offering and grant you their treasures...' });
                    
                } else {
                    // The ritual backfires - invoker is sacrificed instead!
                    embed.setDescription(`${interaction.user.displayName} attempts to sacrifice ${target.displayName} to the Old Ones...`)
                        .addFields(
                            { name: '⚡ THE RITUAL BACKFIRES!', value: `The Old Ones reject the offering and take ${interaction.user.displayName} instead!`, inline: false },
                            { name: 'Invoker\'s Lost Progress', value: 
                                `Sanity: ${cultistData.sanity}/100\n` +
                                `Favor: ${cultistData.favor}\n` +
                                `Artifacts: ${cultistData.artifacts.length} (all lost!)`, 
                                inline: true 
                            }
                        );
                    
                    // Target gains favor for surviving but doesn't steal artifacts (they survived, not killed)
                    targetData.favor += 50;
                    targetData.sanity = Math.max(0, targetData.sanity - 10); // Minor sanity loss from the experience
                    
                    // Invoker is reset but tracks their death
                    cultistData.timesKilled = (cultistData.timesKilled || 0) + 1;
                    const invokerDeathCount = cultistData.timesKilled;
                    
                    // Reset invoker
                    const resetInvokerData = {
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
                        madnessLevel: 0,
                        sacrifices: cultistData.sacrifices || 0,
                        timesMadnessReached: cultistData.timesMadnessReached || 0,
                        timesKilled: invokerDeathCount,
                        kills: cultistData.kills || 0
                    };
                    
                    updateCultistData(target.id, targetData);
                    updateCultistData(userId, resetInvokerData);
                    
                    embed.addFields(
                        { name: '🎯 Survivor Rewards', value: 
                            `${target.displayName} gains:\n` +
                            `+50 Favor for surviving\n` +
                            `-10 Sanity from the ordeal`, 
                            inline: true 
                        },
                        { name: '💀 Death Statistics', value: 
                            `${interaction.user.displayName} has died ${invokerDeathCount} time${invokerDeathCount > 1 ? 's' : ''}`, 
                            inline: false 
                        }
                    );
                    
                    embed.setFooter({ text: 'The Old Ones enjoy ironic justice...' });
                }
                
                await interaction.reply({ embeds: [embed] });
                break;
                
            case 'curse':
                const curseTarget = interaction.options.getUser('target');
                const targetCurseData = getCultistData(curseTarget.id);
                
                const curses = [
                    { text: "May your coffee always be lukewarm and your WiFi perpetually slow.", sanityLoss: 3 },
                    { text: "May you always feel like someone is walking behind you.", sanityLoss: 5 },
                    { text: "May you forever lose your keys at the most inconvenient moments.", sanityLoss: 2 },
                    { text: "May you always feel like you're forgetting something important.", sanityLoss: 4 },
                    { text: "May your phone battery die at 23% forever.", sanityLoss: 3 },
                    { text: "May you dream of endless corridors that lead nowhere.", sanityLoss: 7 },
                    { text: "May mirrors show you things that aren't there.", sanityLoss: 8 },
                    { text: "May you hear your name whispered when alone.", sanityLoss: 6 },
                    { text: "May every clock you see show a different time.", sanityLoss: 4 },
                    { text: "May you always wake at 3:33 AM for no reason.", sanityLoss: 5 },
                    { text: "May doorknobs feel wet when they're dry.", sanityLoss: 3 },
                    { text: "May you smell sulfur when you're happy.", sanityLoss: 4 },
                    { text: "May your peripheral vision betray you constantly.", sanityLoss: 6 },
                    { text: "May every photo of you slowly change when not observed.", sanityLoss: 7 },
                    { text: "May you hear footsteps in your attic at night (you don't have an attic).", sanityLoss: 8 },
                    { text: "May your teeth feel loose when you're nervous.", sanityLoss: 5 },
                    { text: "May shadows move independently of their sources.", sanityLoss: 6 },
                    { text: "May you always count one extra stair in the dark.", sanityLoss: 5 },
                    { text: "May your reflection blink first.", sanityLoss: 9 },
                    { text: "May you find doors in your home you don't remember.", sanityLoss: 8 },
                    { text: "May your dreams leak into your waking hours.", sanityLoss: 10 },
                    { text: "May you hear the ocean in empty rooms.", sanityLoss: 4 },
                    { text: "May streetlights flicker as you pass beneath them.", sanityLoss: 3 },
                    { text: "May you taste metal before something bad happens.", sanityLoss: 5 },
                    { text: "May your childhood toys appear in impossible places.", sanityLoss: 6 },
                    { text: "May you see faces in wood grain that remember you.", sanityLoss: 7 },
                    { text: "May your GPS always add 6.66 miles to every trip.", sanityLoss: 4 },
                    { text: "May you find wet footprints leading to your bed each morning.", sanityLoss: 8 },
                    { text: "May familiar places feel suddenly foreign.", sanityLoss: 6 },
                    { text: "May you hear laughter from empty elevators.", sanityLoss: 5 }
                ];
                
                const curse = curses[Math.floor(Math.random() * curses.length)];
                
                // Target loses sanity from the curse
                targetCurseData.sanity = Math.max(0, targetCurseData.sanity - curse.sanityLoss);
                
                // Check if curse drives them to madness
                if (targetCurseData.sanity === 0 && targetCurseData.madnessLevel === 0) {
                    targetCurseData.madnessLevel = 1;
                    targetCurseData.personality = 'mad';
                    targetCurseData.timesMadnessReached = (targetCurseData.timesMadnessReached || 0) + 1;
                }
                
                // Caster gains a small amount of favor for successful curse
                cultistData.favor += 3;
                
                updateCultistData(curseTarget.id, targetCurseData);
                updateCultistData(userId, cultistData);
                
                let curseMessage = `🌙 ${interaction.user.displayName} bestows a curse upon ${curseTarget.displayName}:\n\n`;
                curseMessage += `*"${curse.text}"*\n\n`;
                curseMessage += `💀 ${curseTarget.displayName} loses ${curse.sanityLoss} sanity (now at ${targetCurseData.sanity}/100)\n\n`;
                
                if (targetCurseData.sanity === 0) {
                    curseMessage += `⚠️ **The curse has shattered ${curseTarget.displayName}'s mind completely!**\n\n`;
                }
                
                curseMessage += `*The Old Ones chuckle softly in the void.*`;
                
                await interaction.reply(curseMessage);
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
                    let username = 'Unknown Cultist';
                    try {
                        const user = await client.users.fetch(cultist.id);
                        username = user.username;
                    } catch (error) {
                        console.log(`Could not fetch user ${cultist.id}`);
                    }
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔸';
                    const madnessIndicator = cultist.madnessLevel > 0 ? ' 🌀' : '';
                    leaderboard += `${medal} **${username}${madnessIndicator}**\n`;
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