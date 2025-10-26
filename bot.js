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