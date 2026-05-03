// ============================================================
//  💩  U L T I M A T E  S H I T T E R  B O T  — Discord.js v14
// ============================================================
//  Setup:
//    1. npm install discord.js node-cron
//    2. Create a Discord bot at https://discord.com/developers
//       - Enable: MESSAGE CONTENT INTENT, SERVER MEMBERS INTENT, GUILD VOICE STATES
//    3. Set BOT_TOKEN as a Railway environment variable
//    4. node poopbot.js
//
//  "The Ultimate Shitter" role:
//    - Create a role called exactly: "The Ultimate Shitter"
//    - Drag the bot's role ABOVE it in Server Settings > Roles
// ============================================================

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const cron = require("node-cron");
const fs = require("fs");

// ── Config ─────────────────────────────────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN;
const PREFIX = "!";
const DATA_FILE = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/poopdata.json`
  : "./poopdata.json";
const CHAMPION_ROLE_NAME = "The Ultimate Shitter";
const FART_CHAMPION_ROLE_NAME = "The Ultimate Farter";
const KITTENS_PER_MESSAGE = 5;
const KITTENS_PER_VC_MINUTE = 5;
const ADMIN_PASSWORD = "p00p5";

const DOUBLE_POINT_WINDOWS = [
  [2, 4],
  [7, 9],
  [14, 16],
  [21, 23],
];
const WINDOWS_PER_DAY = 2;

// ── Race word library ──────────────────────────────────────
const RACE_WORDS = [
  "abbreviation", "abomination", "abstraction", "accomplishment", "accountability",
  "acknowledgment", "acquaintance", "administration", "advertisement", "alliteration",
  "ameliorate", "anachronism", "apprehension", "approximately", "assassination",
  "authentication", "bibliography", "bureaucratic", "camouflage", "catastrophic",
  "circumstantial", "clandestine", "collaborative", "commemorate", "communication",
  "compensation", "comprehension", "concatenation", "confidential", "congratulations",
  "conscientious", "contemporary", "continuously", "controversial", "crystallization",
  "deliberation", "demonstration", "deterioration", "determination", "disenfranchise",
  "disorientation", "documentation", "electromagnetic", "embarrassment", "encouragement",
  "entertainment", "entrepreneurial", "environmental", "establishment", "exaggeration",
  "exasperation", "experimentation", "exhilaration", "extravaganza", "fluorescence",
  "fortunately", "fundamentally", "gesticulation", "globalization", "hallucination",
  "hypothetically", "identification", "illumination", "imagination", "implementation",
  "inappropriate", "inconvenience", "independently", "infrastructure", "initialization",
  "instantaneous", "interpretation", "investigation", "irresponsible", "juxtaposition",
  "kaleidoscope", "knowledgeable", "legitimately", "magnification", "manifestation",
  "manipulation", "measurability", "Mediterranean", "miscellaneous", "misunderstand",
  "modernization", "multiplication", "municipality", "negotiation", "nevertheless",
  "nonchalantly", "occasionally", "overwhelming", "paraphernalia", "parliamentarian",
  "participation", "particularly", "perpendicular", "philosophical", "physiological",
  "predominantly", "preposterous", "prioritization", "procrastinate", "pronunciation",
  "qualification", "questionnaire", "rationalization", "recommendation", "reconciliation",
  "refrigerator", "reincarnation", "relationships", "remembrance", "representation",
  "responsibility", "simultaneously", "sophisticated", "specification", "spontaneously",
  "standardization", "straightforward", "subordination", "sustainability", "telecommunication",
  "unfortunately", "unpredictable", "unprecedented", "unquestionable", "vulnerability",
  "wholeheartedly", "xylophonist", "zealousness", "accomplishments", "disestablishment",
];

function getRaceWord() {
  return RACE_WORDS[Math.floor(Math.random() * RACE_WORDS.length)];
}

// ── Trivia question library ────────────────────────────────
const TRIVIA_QUESTIONS = [
  // ── Math (poop-flavored) ──
  {
    question: "If you poop 3 times a day and each session takes 5 minutes, how many minutes per week do you spend on the toilet?",
    options: ["85 minutes", "100 minutes", "105 minutes", "120 minutes"],
    answer: 2,
  },
  {
    question: "A toilet uses 1.6 gallons per flush. You flush 4 times a day. How many gallons per week?",
    options: ["44.8 gallons", "38.4 gallons", "32 gallons", "52 gallons"],
    answer: 0,
  },
  {
    question: "Your poop is 75% water. You drop a 200g deuce. How many grams are solid waste?",
    options: ["150g", "75g", "50g", "25g"],
    answer: 2,
  },
  {
    question: "The average person produces about 1 pound of poop per day. How many pounds is that in a year?",
    options: ["365 lbs", "252 lbs", "400 lbs", "300 lbs"],
    answer: 0,
  },
  {
    question: "If 8 people each poop twice a day, how many total poops happen in 3 days?",
    options: ["36", "48", "24", "56"],
    answer: 1,
  },
  {
    question: "What is 13 × 13?",
    options: ["149", "159", "169", "179"],
    answer: 2,
  },
  {
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    answer: 2,
  },
  {
    question: "What is 7 × 8? (Don't blow this one.)",
    options: ["54", "56", "58", "62"],
    answer: 1,
  },
  // ── Science / Biology ──
  {
    question: "What gives poop its signature brown color?",
    options: ["Dead bacteria", "Bile pigments (bilirubin)", "Old red blood cells", "Undigested food"],
    answer: 1,
  },
  {
    question: "Roughly what percentage of your poop is actually water?",
    options: ["25%", "50%", "75%", "90%"],
    answer: 2,
  },
  {
    question: "How long is the average adult's small intestine?",
    options: ["About 6 feet", "About 20 feet", "About 10 feet", "About 30 feet"],
    answer: 1,
  },
  {
    question: "What is the correct order food travels through your body?",
    options: [
      "Mouth → Stomach → Large intestine → Small intestine",
      "Mouth → Esophagus → Small intestine → Stomach",
      "Mouth → Esophagus → Stomach → Small intestine → Large intestine",
      "Mouth → Stomach → Esophagus → Small intestine",
    ],
    answer: 2,
  },
  {
    question: "Which organ absorbs most of your nutrients?",
    options: ["Stomach", "Large intestine", "Small intestine", "Liver"],
    answer: 2,
  },
  {
    question: "What is the medical term for farting?",
    options: ["Eructation", "Flatulence", "Borborygmus", "Defecation"],
    answer: 1,
  },
  {
    question: "Which gas is primarily responsible for making farts smell?",
    options: ["Carbon dioxide", "Nitrogen", "Hydrogen sulfide", "Methane"],
    answer: 2,
  },
  {
    question: "Which animal is famous for producing perfectly cube-shaped poop?",
    options: ["Penguin", "Koala", "Wombat", "Capybara"],
    answer: 2,
  },
  {
    question: "On average, how many times do humans fart per day?",
    options: ["3–5 times", "8–10 times", "14–23 times", "30–40 times"],
    answer: 2,
  },
  {
    question: "The Bristol Stool Scale — used by doctors to classify poop — has how many types?",
    options: ["5 types", "7 types", "9 types", "12 types"],
    answer: 1,
  },
  {
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    answer: 2,
  },
  {
    question: "What gas do plants absorb during photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    answer: 2,
  },
  {
    question: "How many bones are in the adult human body?",
    options: ["186", "206", "226", "246"],
    answer: 1,
  },
  {
    question: "What does DNA stand for?",
    options: ["Deoxyribonucleic Acid", "Deoxyribose Nitrogen Acid", "Dynamic Nucleic Array", "Distal Nucleotide Assembly"],
    answer: 0,
  },
  // ── History / Trivia ──
  {
    question: "When was toilet paper first commercially sold in the United States?",
    options: ["1835", "1857", "1901", "1920"],
    answer: 1,
  },
  {
    question: "Which ancient civilization is credited with building some of the earliest sewage systems?",
    options: ["Ancient Egyptians", "Ancient Greeks", "Indus Valley Civilization", "Ancient Chinese"],
    answer: 2,
  },
  {
    question: "Thomas Crapper is famous for popularizing which invention?",
    options: ["The bidet", "The flush toilet", "Toilet paper", "Indoor plumbing pipes"],
    answer: 1,
  },
  {
    question: "Who wrote Romeo and Juliet?",
    options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
    answer: 1,
  },
  {
    question: "In what year did humans first land on the moon?",
    options: ["1965", "1967", "1969", "1972"],
    answer: 2,
  },
  // ── Geography / General ──
  {
    question: "Which planet is named after the Roman god of the sky — and is also a perpetual 8th-grade joke?",
    options: ["Neptune", "Saturn", "Uranus", "Jupiter"],
    answer: 2,
  },
  {
    question: "What is the capital of France? (Even poop-brains should get this one.)",
    options: ["London", "Madrid", "Berlin", "Paris"],
    answer: 3,
  },
  {
    question: "How many continents are on Earth?",
    options: ["5", "6", "7", "8"],
    answer: 2,
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    answer: 3,
  },
  {
    question: "What is the chemical formula for water — the main ingredient in your poop?",
    options: ["H2O2", "HO2", "H2O", "CO2"],
    answer: 2,
  },
  {
    question: "What is the largest country in the world by land area?",
    options: ["Canada", "China", "USA", "Russia"],
    answer: 3,
  },
  {
    question: "What is the approximate speed of light?",
    options: ["186,000 miles per second", "100,000 miles per second", "300,000 miles per hour", "1,000 miles per second"],
    answer: 0,
  },
  {
    question: "Which continent is the Sahara Desert located on?",
    options: ["Asia", "South America", "Australia", "Africa"],
    answer: 3,
  },
  // ── More Poop/Fart Biology ──
  {
    question: "At approximately what speed does gas exit the body during a fart?",
    options: ["1 mph", "7 mph", "25 mph", "60 mph"],
    answer: 1,
  },
  {
    question: "Roughly what percentage of a fart is odorless nitrogen?",
    options: ["20%", "40%", "59%", "80%"],
    answer: 2,
  },
  {
    question: "Can farts actually be lit on fire?",
    options: ["No, they contain no flammable gases", "Yes, due to methane and hydrogen content", "Only if you've eaten nothing but beans", "Only at impossibly high concentrations"],
    answer: 1,
  },
  {
    question: "What is 'meconium'?",
    options: ["A digestive enzyme", "A type of laxative", "A newborn's first poop", "The medical term for diarrhea"],
    answer: 2,
  },
  {
    question: "What is borborygmus?",
    options: ["The medical term for farting", "The gurgling/rumbling sound your stomach makes", "A chronic bowel disease", "The process of digestion"],
    answer: 1,
  },
  {
    question: "How long does it typically take food to travel through your entire digestive system?",
    options: ["2–6 hours", "6–12 hours", "24–72 hours", "About 1 week"],
    answer: 2,
  },
  {
    question: "How long is the average adult's large intestine?",
    options: ["About 2 feet", "About 5 feet", "About 10 feet", "About 15 feet"],
    answer: 1,
  },
  {
    question: "What does IBS stand for?",
    options: ["Internal Bowel Syndrome", "Irritable Bowel Syndrome", "Intestinal Bacteria Syndrome", "Irregular Bowel Spasm"],
    answer: 1,
  },
  {
    question: "Why does corn often appear in your poop looking completely intact?",
    options: ["Corn bypasses the intestines entirely", "The outer shell (pericarp) resists human digestion", "Corn is fully indigestible", "The stomach rejects it immediately"],
    answer: 1,
  },
  {
    question: "Which poop color is considered a medical emergency?",
    options: ["Green", "Yellow", "Black or bright red", "Dark brown"],
    answer: 2,
  },
  {
    question: "What is coprophobia?",
    options: ["Love of bathroom humor", "Fear of spiders", "Fear of feces", "Fear of enclosed spaces"],
    answer: 2,
  },
  {
    question: "What is the main function of the colon?",
    options: ["Digest protein", "Produce stomach acid", "Absorb water and form stool", "Filter toxins from blood"],
    answer: 2,
  },
  {
    question: "What makes poop float?",
    options: ["Too much water content", "Excess gas trapped in the stool", "A diet too high in protein", "Severe liver disease only"],
    answer: 1,
  },
  {
    question: "The smell of poop is primarily caused by which compounds?",
    options: ["Methane and carbon dioxide", "Skatole and indole", "Bile and digestive enzymes", "Nitrogen and ammonia"],
    answer: 1,
  },
  {
    question: "Approximately what percentage of dry stool weight is made up of bacteria?",
    options: ["About 5%", "About 15%", "About 30%", "About 60%"],
    answer: 2,
  },
  {
    question: "What is the anal sphincter?",
    options: ["A digestive enzyme", "The muscle that controls when you poop", "A type of gut bacterium", "The tube connecting stomach to small intestine"],
    answer: 1,
  },
  // ── Animal Poop Facts ──
  {
    question: "How much poop does an elephant produce per day?",
    options: ["About 50 pounds", "About 100 pounds", "About 300 pounds", "About 600 pounds"],
    answer: 2,
  },
  {
    question: "What is 'guano'?",
    options: ["A tropical bird feather type", "Bat or bird droppings used as fertilizer", "A South American fruit", "A digestive enzyme"],
    answer: 1,
  },
  {
    question: "Which animal must eat some of its own droppings (called cecotropes) to absorb essential nutrients?",
    options: ["Dogs", "Rabbits", "Hamsters", "Horses"],
    answer: 1,
  },
  {
    question: "What do dung beetles do with animal poop?",
    options: ["Eat it and build homes from it", "Use it as camouflage", "Roll it into balls, eat it, and lay eggs in it", "Bury it to decompose underground"],
    answer: 2,
  },
  {
    question: "What color is penguin poop, owing to their krill-heavy diet?",
    options: ["Brown", "White", "Pink to salmon", "Green"],
    answer: 2,
  },
  {
    question: "What do hippos do while defecating that helps spread their scent and mark territory?",
    options: ["Roll in the mud afterward", "Spin their tail to fling dung in all directions", "Bellow loudly", "Stomp their feet"],
    answer: 1,
  },
  {
    question: "Why is whale poop surprisingly important to ocean ecosystems?",
    options: ["It sinks and feeds deep-sea creatures", "It floats and fertilizes phytoplankton, supporting food chains", "It balances ocean pH levels", "It has no significant ecological role"],
    answer: 1,
  },
  {
    question: "Which animal produces the most methane through flatulence, making them a significant greenhouse gas contributor?",
    options: ["Pigs", "Horses", "Cows", "Sheep"],
    answer: 2,
  },
  // ── Bathroom History & Culture ──
  {
    question: "What did ancient Romans use to wipe themselves after using the toilet?",
    options: ["Papyrus leaves", "Corn cobs", "A sponge on a stick called a tersorium", "Early toilet paper"],
    answer: 2,
  },
  {
    question: "In which country are toilets often equipped with heated seats, built-in bidets, and sound maskers as standard features?",
    options: ["Germany", "Sweden", "Japan", "South Korea"],
    answer: 2,
  },
  {
    question: "What is the Toto brand famous for producing?",
    options: ["Luxury automobiles", "High-tech toilets and bidets", "Designer bathroom tiles", "Plumbing pipes"],
    answer: 1,
  },
  {
    question: "What was the 'Great Stink' of London in 1858?",
    options: ["A volcanic eruption in Scotland", "The overwhelming stench of the sewage-filled River Thames in summer heat", "A mass skunk invasion of Hyde Park", "A catastrophic gas main explosion"],
    answer: 1,
  },
  {
    question: "Which U.S. president was known for holding meetings and conversations while sitting on the toilet?",
    options: ["Abraham Lincoln", "Lyndon B. Johnson", "Franklin D. Roosevelt", "Theodore Roosevelt"],
    answer: 1,
  },
  {
    question: "The United Nations designated November 19th as what global observance?",
    options: ["World Plumbing Day", "World Sanitation Day", "World Toilet Day", "World Hygiene Day"],
    answer: 2,
  },
  {
    question: "What children's book by Taro Gomi teaches kids that every living creature poops?",
    options: ["'Poop Patrol'", "'The Big Brown Book'", "'Everyone Poops'", "'Where Does Poop Go?'"],
    answer: 2,
  },
  {
    question: "What did ancient Spartans use as 'toilet paper'?",
    options: ["Leaves", "Wool scraps", "Ceramic shards called pessoi", "Sand"],
    answer: 2,
  },
  {
    question: "What was a 'gong farmer' in medieval England?",
    options: ["A farmer who grew a grain called gong", "A person paid to clean out cesspits and privies", "A royal court musician", "A medieval tax collector"],
    answer: 1,
  },
  {
    question: "Who patented the S-bend (U-bend) in plumbing that keeps sewer gases out of your home?",
    options: ["Thomas Crapper", "Alexander Cumming", "John Harington", "Joseph Bramah"],
    answer: 1,
  },
  {
    question: "What is a 'coprolite'?",
    options: ["A toilet cleaning product", "Fossilized animal poop", "A poop-shaped geological formation", "A scientist who studies sewage"],
    answer: 1,
  },
  // ── Fun Poop/Fart Facts ──
  {
    question: "What is the official Unicode name of the 💩 emoji?",
    options: ["Smiling Poo", "Happy Feces", "Pile of Poo", "Turd Emoji"],
    answer: 2,
  },
  {
    question: "What is the scientific study of feces called?",
    options: ["Coprology", "Urology", "Scatology", "Fecalogy"],
    answer: 2,
  },
  {
    question: "What gas makes up the LARGEST percentage of a typical fart?",
    options: ["Methane", "Carbon dioxide", "Nitrogen", "Hydrogen sulfide"],
    answer: 2,
  },
  {
    question: "What is the medical term for a burp?",
    options: ["Flatulence", "Eructation", "Borborygmus", "Peristalsis"],
    answer: 1,
  },
  {
    question: "What happens to human waste on the International Space Station?",
    options: ["Vacuum toilets suck waste into sealed containers", "It is vented directly into space", "Astronauts exclusively wear diapers", "Waste is stored in airlocks"],
    answer: 0,
  },
  {
    question: "What is 'night soil,' historically speaking?",
    options: ["Soil that only grows plants at night", "Human feces collected from privies and used as crop fertilizer", "A medieval bedtime herbal remedy", "Dark volcanic soil"],
    answer: 1,
  },
  // ── More Math (poop-flavored) ──
  {
    question: "A cow produces about 65 lbs of poop per day. How many pounds of poop does it produce in a year?",
    options: ["18,980 lbs", "23,725 lbs", "15,330 lbs", "30,000 lbs"],
    answer: 1,
  },
  {
    question: "If you spend 8 minutes on the toilet per day, how many full days per year are you sitting on the throne?",
    options: ["About 1.5 days", "About 2 days", "About 3.5 days", "About 5 days"],
    answer: 1,
  },
  {
    question: "If you fart 15 times a day for 3 seconds each, how many total seconds per day do you spend farting?",
    options: ["30 seconds", "45 seconds", "60 seconds", "90 seconds"],
    answer: 1,
  },
  {
    question: "If the U.S. population (330 million people) each produces 1 lb of poop per day, how many tons is that total per day?",
    options: ["About 80,000 tons", "About 165,000 tons", "About 330,000 tons", "About 500,000 tons"],
    answer: 1,
  },
  {
    question: "A standard roll of toilet paper has ~200 sheets. Using 8 sheets per poop and pooping twice a day, how many rolls do you use per year?",
    options: ["About 15 rolls", "About 21 rolls", "About 29 rolls", "About 50 rolls"],
    answer: 2,
  },
  // ── General Trivia ──
  {
    question: "What is the smallest planet in our solar system?",
    options: ["Mars", "Pluto", "Mercury", "Venus"],
    answer: 2,
  },
  {
    question: "How many teeth does a healthy adult human have?",
    options: ["28", "30", "32", "36"],
    answer: 2,
  },
  {
    question: "What is the most spoken language in the world by number of native speakers?",
    options: ["English", "Spanish", "Hindi", "Mandarin Chinese"],
    answer: 3,
  },
  {
    question: "How many strings does a standard guitar have?",
    options: ["4", "5", "6", "8"],
    answer: 2,
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answer: 2,
  },
  {
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    answer: 1,
  },
  {
    question: "What is the longest river in the world?",
    options: ["Amazon", "Mississippi", "Yangtze", "Nile"],
    answer: 3,
  },
  {
    question: "Which element has the atomic number 1?",
    options: ["Helium", "Hydrogen", "Lithium", "Oxygen"],
    answer: 1,
  },
  {
    question: "How many players are on a standard soccer team on the field at one time?",
    options: ["9", "10", "11", "12"],
    answer: 2,
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Quartz", "Corundum", "Topaz", "Diamond"],
    answer: 3,
  },
  {
    question: "What year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    answer: 2,
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
    answer: 2,
  },
  {
    question: "How many planets are in our solar system?",
    options: ["7", "8", "9", "10"],
    answer: 1,
  },
  {
    question: "What is the currency of Japan?",
    options: ["Won", "Yuan", "Yen", "Ringgit"],
    answer: 2,
  },
  {
    question: "What is the tallest mountain in the world?",
    options: ["K2", "Kangchenjunga", "Mount Kilimanjaro", "Mount Everest"],
    answer: 3,
  },
  {
    question: "What is 15% of 200?",
    options: ["25", "30", "35", "40"],
    answer: 1,
  },
  {
    question: "Which country has the most natural lakes in the world?",
    options: ["Russia", "USA", "Finland", "Canada"],
    answer: 3,
  },
  {
    question: "What does 'www' stand for in a web address?",
    options: ["World Wide Web", "World Web Works", "Wide World Web", "Web World Wide"],
    answer: 0,
  },
  {
    question: "Which gas makes up the majority of Earth's atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"],
    answer: 1,
  },
  {
    question: "How many zeros are in one billion?",
    options: ["6", "7", "8", "9"],
    answer: 3,
  },
];

// ── Persistence ────────────────────────────────────────────
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  return { users: {}, weekStart: todayStr(), championId: null, taxPool: 0 };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ensureUser(userId, name) {
  if (!db.users[userId]) {
    db.users[userId] = {
      name: name ?? "Unknown",
      points: 0,
      count: 0,
      lastPoopTime: null,
      allTimeCount: 0,
      allTimePoints: 0,
      weeklyWins: 0,
      kittens: 0,
      fartPoints: 0,
      fartCount: 0,
      lastFartTime: null,
      allTimeFartCount: 0,
      allTimeFartPoints: 0,
      fartWeeklyWins: 0,
    };
  }
  if (name) db.users[userId].name = name;
}

// ── Kitten helpers ─────────────────────────────────────────
function getKittens(userId) {
  return db.users[userId]?.kittens ?? 0;
}

function addKittens(userId, amount) {
  if (!db.users[userId]) ensureUser(userId, null);
  db.users[userId].kittens = (db.users[userId].kittens ?? 0) + amount;
  saveData(db);
}

function removeKittens(userId, amount) {
  if (!db.users[userId]) return;
  db.users[userId].kittens = Math.max(0, (db.users[userId].kittens ?? 0) - amount);
  saveData(db);
}

// ── Double-points ──────────────────────────────────────────
let activeDoubleWindows = [];

function pickTodaysWindows() {
  const shuffled = [...DOUBLE_POINT_WINDOWS].sort(() => Math.random() - 0.5);
  activeDoubleWindows = shuffled.slice(0, WINDOWS_PER_DAY);
  console.log(`[UltimateShitter] Today's double-point windows: ${activeDoubleWindows.map(([s, e]) => `${s}:00-${e}:00`).join(", ")}`);
}

function isDoublePointsNow() {
  const hour = new Date().getHours();
  return activeDoubleWindows.some(([start, end]) => hour >= start && hour < end);
}

function nextDoubleWindowDescription() {
  const hour = new Date().getHours();
  const upcoming = activeDoubleWindows.filter(([s]) => s > hour);
  if (upcoming.length === 0) return "No more double-point windows today!";
  const [s, e] = upcoming[0];
  return `Next double-points window: **${s}:00 – ${e}:00** today`;
}

// ── Champion role ──────────────────────────────────────────
async function assignFartChampionRole(guild, winnerId) {
  const role = guild.roles.cache.find((r) => r.name === FART_CHAMPION_ROLE_NAME);
  if (!role) {
    console.warn(`[UltimateShitter] Role "${FART_CHAMPION_ROLE_NAME}" not found in ${guild.name}.`);
    return false;
  }
  if (db.fartChampionId && db.fartChampionId !== winnerId) {
    const oldChamp = await guild.members.fetch(db.fartChampionId).catch(() => null);
    if (oldChamp) await oldChamp.roles.remove(role).catch(() => {});
  }
  const newChamp = await guild.members.fetch(winnerId).catch(() => null);
  if (!newChamp) return false;
  await newChamp.roles.add(role).catch(() => {});
  return newChamp;
}

async function assignChampionRole(guild, winnerId) {
  const role = guild.roles.cache.find((r) => r.name === CHAMPION_ROLE_NAME);
  if (!role) {
    console.warn(`[UltimateShitter] Role "${CHAMPION_ROLE_NAME}" not found in ${guild.name}.`);
    return false;
  }
  if (db.championId && db.championId !== winnerId) {
    const oldChamp = await guild.members.fetch(db.championId).catch(() => null);
    if (oldChamp) await oldChamp.roles.remove(role).catch(() => {});
  }
  const newChamp = await guild.members.fetch(winnerId).catch(() => null);
  if (!newChamp) return false;
  await newChamp.roles.add(role).catch(() => {});
  return newChamp;
}

// ── Leaderboard helpers ────────────────────────────────────
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getTopUser() {
  const sorted = Object.entries(db.users).sort(([, a], [, b]) => b.points - a.points);
  if (!sorted.length || sorted[0][1].points === 0) return null;
  return { id: sorted[0][0], ...sorted[0][1] };
}

function getFartTopUser() {
  const sorted = Object.entries(db.users).sort(([, a], [, b]) => (b.fartPoints ?? 0) - (a.fartPoints ?? 0));
  if (!sorted.length || (sorted[0][1].fartPoints ?? 0) === 0) return null;
  return { id: sorted[0][0], ...sorted[0][1] };
}

function buildLeaderboardEmbed(data, guildMembers) {
  const sorted = Object.entries(data.users)
    .sort(([, a], [, b]) => b.points - a.points || b.count - a.count)
    .slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];
  const rows = sorted.map(([id, info], i) => {
    const member = guildMembers?.get(id);
    const name = member?.displayName ?? info.name ?? `User ${id}`;
    const medal = medals[i] ?? `**${i + 1}.**`;
    return `${medal} **${name}** — ${info.points} 💩 (${info.count} poops)`;
  });
  const weekNum = getWeekNumber(data.weekStart);
  return new EmbedBuilder()
    .setTitle("💩  Weekly Poop Leaderboard")
    .setDescription(rows.length ? rows.join("\n") : "*No poops logged yet!*")
    .setColor(0x8b4513)
    .setFooter({ text: `Week ${weekNum} • Resets every Monday at midnight` })
    .setTimestamp();
}

function buildFartLeaderboardEmbed(data, guildMembers) {
  const sorted = Object.entries(data.users)
    .filter(([, u]) => (u.fartPoints ?? 0) > 0 || (u.fartCount ?? 0) > 0)
    .sort(([, a], [, b]) => (b.fartPoints ?? 0) - (a.fartPoints ?? 0) || (b.fartCount ?? 0) - (a.fartCount ?? 0))
    .slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];
  const rows = sorted.map(([id, info], i) => {
    const member = guildMembers?.get(id);
    const name = member?.displayName ?? info.name ?? `User ${id}`;
    const medal = medals[i] ?? `**${i + 1}.**`;
    return `${medal} **${name}** — ${info.fartPoints ?? 0} 💨 (${info.fartCount ?? 0} farts)`;
  });
  const weekNum = getWeekNumber(data.weekStart);
  return new EmbedBuilder()
    .setTitle("💨  Weekly Fart Leaderboard")
    .setDescription(rows.length ? rows.join("\n") : "*No farts logged yet!*")
    .setColor(0xf5d76e)
    .setFooter({ text: `Week ${weekNum} • Resets every Monday at midnight` })
    .setTimestamp();
}

// ── Rob helpers ────────────────────────────────────────────
const pendingRobs = new Map();
const ROB_DAILY_LIMIT = 2;
const JACKPOT_DAILY_LIMIT = 5;
const TRIVIA_HOURLY_LIMIT = 5;
const ROB_RPS_TIMEOUT_MS = 30_000;

// ── Blackjack helpers ──────────────────────────────────────
const activeGames = new Map();
const TURN_TIMEOUT_MS = 30_000;

function clearTurnTimeout(game) {
  if (game.turnTimeout) {
    clearTimeout(game.turnTimeout);
    game.turnTimeout = null;
  }
}

function setTurnTimeout(channel, channelId) {
  const game = activeGames.get(channelId);
  if (!game) return;
  clearTurnTimeout(game);
  const turnPlayerId = game.turn;
  game.turnTimeout = setTimeout(async () => {
    const g = activeGames.get(channelId);
    if (!g || g.turn !== turnPlayerId) return;
    const name = g.players.find(p => p.id === g.turn).name;
    const card = g.deck.pop();
    g.hands[g.turn].push(card);
    const val = handValue(g.hands[g.turn]);
    if (val > 21) {
      await channel.send(`⏰ **${name}** took too long — auto-hit! Drew **${card.rank}${card.suit}** and busted with **${val}**! 💥`);
      g.stood.add(g.turn);
      advanceTurn(channel, channelId);
    } else if (val === 21) {
      await channel.send(`⏰ **${name}** took too long — auto-hit! Drew **${card.rank}${card.suit}** and hit 21! ✨`);
      g.stood.add(g.turn);
      advanceTurn(channel, channelId);
    } else {
      await channel.send({ content: `⏰ **${name}** took too long — auto-hit! Drew **${card.rank}${card.suit}** **(${val})**. Still their turn!`, embeds: [buildGameEmbed(g)], components: [buildBJRow(channelId)] });
      setTurnTimeout(channel, channelId);
    }
  }, TURN_TIMEOUT_MS);
}

function makeDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];
  for (const suit of suits)
    for (const rank of ranks)
      deck.push({ rank, suit });
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  if (card.rank === "A") return 11;
  return parseInt(card.rank);
}

function handValue(hand) {
  let total = hand.reduce((sum, c) => sum + cardValue(c), 0);
  let aces = hand.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function formatHand(hand, hideSecond = false) {
  if (hideSecond) return `${hand[0].rank}${hand[0].suit} 🂠`;
  return hand.map((c) => `${c.rank}${c.suit}`).join("  ");
}

function buildGameEmbed(game, reveal = false) {
  const dealerVal = reveal ? handValue(game.dealerHand) : "?";
  const desc = [
    `🃏 **Dealer:** ${formatHand(game.dealerHand, !reveal)} ${reveal ? `(${dealerVal})` : ""}`,
    ``,
  ];
  for (const { id, name } of game.players) {
    desc.push(`😺 **${name}:** ${formatHand(game.hands[id])} **(${handValue(game.hands[id])})**`);
  }
  desc.push(``, `💰 Pot: **${game.bet * (game.vsBot ? 1 : game.players.length)} 🐱 kittens**`);
  if (!reveal) {
    const current = game.players.find(p => p.id === game.turn);
    desc.push(`\n⏳ **${current.name}'s turn**`);
  }
  return new EmbedBuilder()
    .setTitle("🃏  Blackjack")
    .setDescription(desc.join("\n"))
    .setColor(0x2ecc71);
}

function buildBJRow(channelId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bj_hit_${channelId}`).setLabel("Hit").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`bj_stand_${channelId}`).setLabel("Stand").setStyle(ButtonStyle.Danger),
  );
}

function advanceTurn(channel, channelId) {
  const game = activeGames.get(channelId);
  if (!game) return;
  if (game.vsBot || game.players.every(p => game.stood.has(p.id))) {
    return resolveBlackjack(channel, channelId);
  }
  const idx = game.players.findIndex(p => p.id === game.turn);
  for (let i = 1; i <= game.players.length; i++) {
    const next = game.players[(idx + i) % game.players.length];
    if (!game.stood.has(next.id)) {
      game.turn = next.id;
      const embed = buildGameEmbed(game);
      channel.send({ content: `➡️ **${next.name}**'s turn!`, embeds: [embed], components: [buildBJRow(channelId)] });
      setTurnTimeout(channel, channelId);
      return;
    }
  }
  resolveBlackjack(channel, channelId);
}

async function resolveBlackjack(channel, channelId) {
  const game = activeGames.get(channelId);
  if (!game) return;
  clearTurnTimeout(game);
  activeGames.delete(channelId);
  while (handValue(game.dealerHand) < 17) game.dealerHand.push(game.deck.pop());
  const dealerVal = handValue(game.dealerHand);
  const results = [];
  if (game.vsBot) {
    for (const { id, name } of game.players) {
      const playerVal = handValue(game.hands[id]);
      if (playerVal > 21) {
        results.push(`💥 **${name}** busted (${playerVal}) — loses **${game.bet} 🐱**`);
      } else if (dealerVal > 21 || playerVal > dealerVal) {
        results.push(`🎉 **${name}** wins! (${playerVal} vs dealer ${dealerVal}) — wins **${game.bet * 2} 🐱**`);
        addKittens(id, game.bet * 2);
      } else if (playerVal === dealerVal) {
        results.push(`🤝 **${name}** pushes (${playerVal}) — bet returned`);
        addKittens(id, game.bet);
      } else {
        results.push(`😔 **${name}** loses (${playerVal} vs dealer ${dealerVal}) — loses **${game.bet} 🐱**`);
      }
    }
  } else {
    // PvP: pool is all antes; pushers get refunded, winners split what remains
    let pool = game.players.length * game.bet;
    const winners = [];
    for (const { id, name } of game.players) {
      const playerVal = handValue(game.hands[id]);
      if (playerVal > 21) {
        results.push(`💥 **${name}** busted (${playerVal}) — loses **${game.bet} 🐱**`);
      } else if (dealerVal > 21 || playerVal > dealerVal) {
        winners.push({ id, name, playerVal });
      } else if (playerVal === dealerVal) {
        results.push(`🤝 **${name}** pushes (${playerVal}) — bet returned`);
        addKittens(id, game.bet);
        pool -= game.bet;
      } else {
        results.push(`😔 **${name}** loses (${playerVal} vs dealer ${dealerVal}) — loses **${game.bet} 🐱**`);
      }
    }
    if (winners.length > 0) {
      const share = Math.ceil(pool / winners.length);
      for (const { id, name, playerVal } of winners) {
        addKittens(id, share);
        results.push(`🎉 **${name}** wins! (${playerVal} vs dealer ${dealerVal}) — wins **${share} 🐱**`);
      }
    }
  }
  const playerLines = game.players.map(({ id, name }) =>
    `😺 **${name}:** ${formatHand(game.hands[id])} **(${handValue(game.hands[id])})**`
  );
  const embed = new EmbedBuilder()
    .setTitle("🃏  Blackjack — Results")
    .setDescription([
      `🃏 **Dealer:** ${formatHand(game.dealerHand)} **(${dealerVal})**`,
      ...playerLines,
      ``,
      ...results,
    ].join("\n"))
    .setColor(0xe74c3c)
    .setTimestamp();
  await channel.send({ embeds: [embed] });
}

async function startPvPGame(channel, channelId, players, bet) {
  const deck = makeDeck();
  const hands = {};
  for (const { id } of players) hands[id] = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];
  for (const { id } of players) removeKittens(id, bet);
  const game = { players, bet, deck, hands, dealerHand, turn: players[0].id, stood: new Set(), vsBot: false };
  activeGames.set(channelId, game);
  const nameList = players.map(p => `**${p.name}**`).join(", ");
  const embed = buildGameEmbed(game);
  await channel.send({ content: `🃏 ${nameList} — **${bet} 🐱 kittens** each!`, embeds: [embed], components: [buildBJRow(channelId)] });
  setTurnTimeout(channel, channelId);
}

// ── Report-based spam tracking ─────────────────────────────
const REPORT_WINDOW_MS = 10 * 60 * 1000; // both reports must arrive within 10 minutes
// spamReports: userId -> { reporters: Set<reporterId>, windowStart: timestamp }
const spamReports = new Map();
// reporterDailyUsage: reporterId -> YYYY-MM-DD of last report filed
const reporterDailyUsage = new Map();
// frozenUsers: userId -> frozenUntil timestamp
const frozenUsers = new Map();

function isKittenFrozen(userId) {
  const frozenUntil = frozenUsers.get(userId);
  if (!frozenUntil) return false;
  if (Date.now() < frozenUntil) return true;
  frozenUsers.delete(userId);
  return false;
}

function applySpamConsequence(userId, userName, channel) {
  const before = db.users[userId]?.kittens ?? 0;
  if (db.users[userId]) {
    db.users[userId].kittens = Math.max(0, before - 300);
    saveData(db);
  }
  frozenUsers.set(userId, Date.now() + 2 * 60 * 1000);
  spamReports.delete(userId);
  channel.send(
    `🚨 **SPAM ALERT: ${userName} has been reported by multiple users!**\n` +
    `**${userName}** has been deducted **300 🐱 kittens** and kitten earning is **frozen for 2 minutes**.`
  ).catch(() => {});
}



// ── RPS helpers ───────────────────────────────────────────
const pendingRpsGames = new Map();
const RPS_TIMEOUT_MS = 30_000;
const RPS_BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
const RPS_EMOJI = { rock: "🪨", paper: "📄", scissors: "✂️" };
const RPS_LABEL = { rock: "Rock", paper: "Paper", scissors: "Scissors" };

// ── Slots helpers ──────────────────────────────────────────
const SLOTS_SYMBOLS = [
  { emoji: "💩", weight: 1  },
  { emoji: "🐱", weight: 3  },
  { emoji: "💎", weight: 5  },
  { emoji: "⭐", weight: 8  },
  { emoji: "🍒", weight: 12 },
  { emoji: "🔔", weight: 12 },
  { emoji: "🍋", weight: 14 },
];
const SLOTS_TOTAL_WEIGHT = SLOTS_SYMBOLS.reduce((s, x) => s + x.weight, 0);

const SLOTS_PAYOUTS = {
  "💩💩💩": 50,
  "🐱🐱🐱": 15,
  "💎💎💎": 8,
  "⭐⭐⭐":  4,
  "🍒🍒🍒": 3,
  "🔔🔔🔔": 3,
  "🍋🍋🍋": 2,
};

function spinReel() {
  let r = Math.floor(Math.random() * SLOTS_TOTAL_WEIGHT);
  for (const s of SLOTS_SYMBOLS) {
    if (r < s.weight) return s.emoji;
    r -= s.weight;
  }
  return SLOTS_SYMBOLS[SLOTS_SYMBOLS.length - 1].emoji;
}

function getSlotsResult(reels) {
  const key = reels.join("");
  if (SLOTS_PAYOUTS[key]) return { multiplier: SLOTS_PAYOUTS[key] };
  const counts = {};
  for (const r of reels) counts[r] = (counts[r] ?? 0) + 1;
  if ((counts["💩"] ?? 0) >= 2 || (counts["🐱"] ?? 0) >= 2) return { multiplier: 1 };
  return { multiplier: 0 };
}

// ── Race state ─────────────────────────────────────────────
const activeRaces = new Map();

// ── Trivia state ───────────────────────────────────────────
const activeTrivias = new Map();

// ── Crash helpers ──────────────────────────────────────────
function generateCrashPoint() {
  const r = Math.random();
  return Math.min(1000, Math.max(1.00, parseFloat((0.97 / r).toFixed(2))));
}

function buildCrashEmbed(crash, crashed = false) {
  const multStr = crashed
    ? `💥 **CRASHED** at ${crash.crashPoint.toFixed(2)}x!`
    : `📈 **${crash.multiplier.toFixed(2)}x** and climbing...`;
  const lines = [...crash.bets.entries()].map(([id, info]) => {
    if (info.cashedAt !== null) {
      const profit = Math.floor(info.bet * info.cashedAt) - info.bet;
      return `✅ <@${id}> cashed out at **${info.cashedAt.toFixed(2)}x** (+${profit.toLocaleString()} 🐱)`;
    }
    return crashed
      ? `💥 <@${id}> lost **${info.bet.toLocaleString()} 🐱**`
      : `⏳ <@${id}> — **${info.bet.toLocaleString()} 🐱** riding`;
  });
  return new EmbedBuilder()
    .setTitle(crashed ? "📈  Crash — CRASHED! 💥" : "📈  Crash")
    .setDescription([multStr, "", ...lines].join("\n"))
    .setColor(crashed ? 0xe74c3c : 0x2ecc71)
    .setTimestamp();
}

// ── WYR question bank ──────────────────────────────────────
const WYR_QUESTIONS = [
  { a: "Poop once a year (extremely painful, a full year's worth)", b: "Poop 20 times a day every single day" },
  { a: "Your farts smell like roses but sound like foghorns", b: "Your farts are completely silent but smell like the apocalypse" },
  { a: "Never be able to flush a toilet again", b: "Never be able to wash your hands after pooping" },
  { a: "Use a cactus as toilet paper", b: "Wipe with wet sand" },
  { a: "Poop your pants once a month in public with everyone knowing", b: "Poop your pants once a week in private" },
  { a: "Have a transparent bathroom with opaque walls", b: "Have an opaque bathroom with transparent walls" },
  { a: "Only use public restrooms for the rest of your life", b: "Never be able to use a restroom when you actually need one" },
  { a: "Have Dwayne Johnson narrate every one of your bathroom trips", b: "Have Gordon Ramsay critique your technique every time" },
  { a: "Poop glitter for a week straight", b: "Poop spaghetti exactly once" },
  { a: "Your poop is solid gold but you have to sell it to strangers", b: "Normal poop but it smells like fresh-baked cookies" },
  { a: "Accidentally send your boss a toilet selfie", b: "Your boss walks in on you in the work bathroom" },
  { a: "Only poop in a bucket like a medieval peasant forever", b: "Only poop in a porta-potty at a music festival forever" },
  { a: "Get an urgent poop urge in the middle of every important meeting", b: "Only be able to poop at exactly 3 AM every day" },
  { a: "Your farts sound like anime attack names out loud", b: "Your farts blast your ringtone at full volume" },
  { a: "Poop in zero gravity on a space station", b: "Poop in a submarine with 20 other people" },
  { a: "Announce every bathroom visit to your entire contact list", b: "Every bathroom visit is livestreamed to 3 random strangers" },
  { a: "Your poop is bright neon green forever", b: "Your poop makes a loud honking sound on impact" },
  { a: "Never poop again but survive magically", b: "Poop every 15 minutes for the rest of your life" },
  { a: "Always need to poop 5 minutes after sitting in traffic", b: "Always need to poop right as you fall asleep" },
  { a: "Your poop smells like your favorite food", b: "Your favorite food tastes exactly like poop" },
  { a: "Have to narrate your pooping like a nature documentary", b: "A live audience of strangers applauds after every successful flush" },
  { a: "Wipe with dry leaves forever", b: "Wipe with bubble wrap forever" },
  { a: "Only be able to use Discord while on the toilet", b: "Never be able to use your phone on the toilet ever again" },
  { a: "Toilet paper always runs out at the worst possible moment", b: "The toilet always clogs no matter what you do" },
];

// ── Per-channel game state ─────────────────────────────────
const activeCrashes = new Map();
const activeWyrs = new Map();
const activeHeists = new Map();
const activeRussians = new Map();

// ── Hangman helpers ────────────────────────────────────────
const activeHangman = new Map();
const HANGMAN_WORDS = [
  "poop", "fart", "toilet", "plunger", "sewer", "stench", "latrine",
  "outhouse", "cesspool", "flatulence", "methane", "fungus", "mildew",
  "rancid", "putrid", "compost", "manure", "bacteria", "odorous",
  "discord", "gambling", "jackpot", "casino", "heist", "robbery",
  "pirate", "dungeon", "dragon", "wizard", "goblin", "phantom",
  "specter", "zombie", "vampire", "werewolf", "skeleton", "ghoul",
  "hurricane", "tornado", "tsunami", "avalanche", "volcano", "blizzard",
  "crocodile", "rhinoceros", "platypus", "armadillo", "chameleon",
  "salamander", "anaconda", "scorpion", "tarantula", "saxophone",
  "accordion", "tambourine", "buffoonery", "shenanigans", "tomfoolery",
  "mischief", "kerfuffle", "hullabaloo", "brouhaha", "balderdash",
  "flabbergasted", "gobsmacked", "bamboozle", "discombobulate",
  "catastrophe", "pandemonium", "juggernaut", "conflagration",
  "boisterous", "loquacious", "perspicacious", "obstreperous",
  "extravaganza", "kaleidoscope", "paraphernalia", "preposterous",
  "scoundrel", "knucklehead", "numbskull", "blunderbuss", "skedaddle",
  "whippersnapper", "nincompoop", "lollygag", "cattywampus",
  "rapscallion", "skullduggery", "chicanery", "flabbergast", "rascal",
];
const HANGMAN_STAGES = [
  "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```",
];

// ── Horse race helpers ─────────────────────────────────────
const activeHorseRaces = new Map();
const RACE_HORSES = [
  { id: 1, name: "Stinky Steve",   emoji: "💩", odds: 2.0,  maxStep: 5.0 },
  { id: 2, name: "Kitty Gallop",   emoji: "🐱", odds: 3.0,  maxStep: 4.0 },
  { id: 3, name: "Lightning Butt", emoji: "⚡", odds: 5.0,  maxStep: 3.0 },
  { id: 4, name: "Golden Nugget",  emoji: "🌟", odds: 8.0,  maxStep: 2.2 },
  { id: 5, name: "Space Pooper",   emoji: "🚀", odds: 12.0, maxStep: 1.6 },
];
const HORSE_RACE_LENGTH = 20;

async function revealTrivia(trivia) {
  const { bet, participants, answers, question, letters, questionMsg } = trivia;
  const optionsText = question.options.map((opt, i) => `**${letters[i]}.** ${opt}`).join("\n");
  const correctLetter = letters[question.answer];

  const resultLines = [...participants.entries()].map(([uid, name]) => {
    const choice = answers.get(uid);
    if (choice === question.answer) {
      addKittens(uid, bet * 2);
      return `✅ **${name}** — CORRECT! (+${bet.toLocaleString()} 🐱)`;
    }
    return `❌ **${name}** — ${choice !== undefined ? "WRONG" : "TIMED OUT"} (-${bet.toLocaleString()} 🐱)`;
  }).join("\n");

  const embed = new EmbedBuilder()
    .setTitle("🧠  Trivia — Results")
    .setDescription(`**${question.question}**\n\n${optionsText}\n\n**Answer: ${correctLetter}. ${question.options[question.answer]}**\n\n${resultLines}`)
    .setColor(0x9b59b6)
    .setTimestamp();

  if (questionMsg) await questionMsg.edit({ embeds: [embed], components: [] }).catch(() => {});
}

// ── Hangman embed ──────────────────────────────────────────
function buildHangmanEmbed(game) {
  const display = game.word.split("").map(ch => game.guessed.has(ch) ? ch.toUpperCase() : "_").join(" ");
  const wrong = game.wrongGuesses.length;
  const wrongText = wrong > 0 ? game.wrongGuesses.map(l => l.toUpperCase()).join("  ") : "None";
  const color = wrong >= 6 ? 0xe74c3c : wrong >= 4 ? 0xe67e22 : 0x3498db;
  return new EmbedBuilder()
    .setTitle("🪦  Hangman")
    .setDescription(
      `${HANGMAN_STAGES[wrong]}\n` +
      `**Word:** \`${display}\`  (${game.word.length} letters)\n\n` +
      `❌ **Wrong (${wrong}/6):** ${wrongText}`
    )
    .setColor(color)
    .setFooter({ text: `!guess <letter>  or  !guess <word>${game.bet > 0 ? ` · Pot: ${(game.bet * 2).toLocaleString()} 🐱` : ""}` })
    .setTimestamp();
}

// ── Horse race embeds ──────────────────────────────────────
function buildHorseRaceBettingEmbed(race) {
  const horseList = RACE_HORSES.map(h =>
    `**${h.id}.** ${h.emoji} ${h.name} — **${h.odds}x**`
  ).join("\n");
  const betList = race.bets.size > 0
    ? [...race.bets.values()].map(b => {
        const h = RACE_HORSES[b.horseId - 1];
        return `• ${b.userName} → ${h.emoji} ${h.name} (${b.bet.toLocaleString()} 🐱)`;
      }).join("\n")
    : "*No bets yet*";
  return new EmbedBuilder()
    .setTitle("🏇  Horse Race — Place Your Bets!")
    .setDescription(`${horseList}\n\n**Current bets:**\n${betList}`)
    .setColor(0xf39c12)
    .setFooter({ text: "!horse <1-5> <bet> to place · Race starts in 30 seconds · Max 500 🐱 per bet" })
    .setTimestamp();
}

function buildHorseRaceTrackEmbed(positions, winner) {
  const BARS = 14;
  const lines = RACE_HORSES.map((h, i) => {
    const pct = Math.min(1, positions[i] / HORSE_RACE_LENGTH);
    const filled = Math.round(pct * BARS);
    const bar = "█".repeat(filled) + "░".repeat(BARS - filled);
    const flag = winner?.id === h.id ? " 🏆" : "";
    return `${h.emoji} **${h.name}**  (${h.odds}x)\n\`[${bar}]\`${flag}`;
  });
  return new EmbedBuilder()
    .setTitle(winner ? `🏇  Race Over — ${winner.emoji} ${winner.name} Wins!` : "🏇  Horse Race — LIVE!")
    .setDescription(lines.join("\n\n"))
    .setColor(winner ? 0x2ecc71 : 0xf39c12)
    .setTimestamp();
}

async function runHorseRace(channelId, channel, bettingMsg) {
  const race = activeHorseRaces.get(channelId);
  if (!race) return;
  race.phase = "racing";

  const positions = [0, 0, 0, 0, 0];
  const raceMsg = await channel.send({ embeds: [buildHorseRaceTrackEmbed(positions, null)] });

  let winner = null;
  for (let tick = 0; tick < 14 && !winner; tick++) {
    await new Promise(r => setTimeout(r, 1800));
    for (let i = 0; i < RACE_HORSES.length; i++) {
      positions[i] = Math.min(HORSE_RACE_LENGTH, positions[i] + Math.random() * RACE_HORSES[i].maxStep);
    }
    if (positions.some(p => p >= HORSE_RACE_LENGTH)) {
      const maxPos = Math.max(...positions);
      winner = RACE_HORSES[positions.indexOf(maxPos)];
    }
    await raceMsg.edit({ embeds: [buildHorseRaceTrackEmbed(positions, winner)] }).catch(() => {});
  }

  if (!winner) {
    const maxPos = Math.max(...positions);
    winner = RACE_HORSES[positions.indexOf(maxPos)];
    await raceMsg.edit({ embeds: [buildHorseRaceTrackEmbed(positions, winner)] }).catch(() => {});
  }

  activeHorseRaces.delete(channelId);

  const winLines = [];
  const loseLines = [];
  for (const [uid, { horseId, bet, userName: bName }] of race.bets) {
    const h = RACE_HORSES[horseId - 1];
    if (horseId === winner.id) {
      const payout = Math.floor(bet * winner.odds);
      addKittens(uid, payout);
      winLines.push(`🏆 **${bName}** bet **${bet.toLocaleString()} 🐱** → wins **${payout.toLocaleString()} 🐱** (${winner.odds}x)`);
    } else {
      loseLines.push(`💸 **${bName}** bet on ${h.emoji} ${h.name} — loses **${bet.toLocaleString()} 🐱**`);
    }
  }

  const resultEmbed = new EmbedBuilder()
    .setTitle(`🏇  Race Results — ${winner.emoji} ${winner.name} wins!`)
    .setDescription(
      (winLines.length ? `**Winners:**\n${winLines.join("\n")}` : "**No one bet on the winner!**") +
      (loseLines.length ? `\n\n**Losers:**\n${loseLines.join("\n")}` : "")
    )
    .setColor(0x2ecc71)
    .setFooter({ text: `Odds were ${winner.odds}x` })
    .setTimestamp();
  await channel.send({ embeds: [resultEmbed] });
}

// ── Bot client ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

let db = loadData();
pickTodaysWindows();

// ── Weekly reset ───────────────────────────────────────────
cron.schedule("0 0 * * 1", () => {
  console.log("[UltimateShitter] Weekly reset!");
  client.guilds.cache.forEach(async (guild) => {
    await guild.members.fetch().catch(() => {});
    const channel = guild.channels.cache.find((c) => c.name === "poop-leaderboard" || c.name === "general");

    // Poop champion
    const winner = getTopUser();
    if (channel) {
      const embed = buildLeaderboardEmbed(db, guild.members.cache);
      await channel.send({ content: "📣 **Weekly poop results before the reset!**", embeds: [embed] }).catch(() => {});
    }
    if (winner) {
      const crowned = await assignChampionRole(guild, winner.id);
      db.championId = winner.id;
      db.users[winner.id].weeklyWins = (db.users[winner.id].weeklyWins ?? 0) + 1;
      if (crowned && channel) {
        await channel.send(`👑 **${crowned.displayName}** is the new **Ultimate Shitter**! 💩`).catch(() => {});
      }
    } else if (db.championId) {
      const role = guild.roles.cache.find((r) => r.name === CHAMPION_ROLE_NAME);
      if (role) {
        const oldChamp = await guild.members.fetch(db.championId).catch(() => null);
        if (oldChamp) await oldChamp.roles.remove(role).catch(() => {});
      }
      db.championId = null;
    }

    // Fart champion
    const fartWinner = getFartTopUser();
    const fartChannel = guild.channels.cache.find((c) => c.name === "fart-leaderboard") ?? channel;
    if (fartChannel) {
      const fartEmbed = buildFartLeaderboardEmbed(db, guild.members.cache);
      await fartChannel.send({ content: "💨 **Weekly fart results before the reset!**", embeds: [fartEmbed] }).catch(() => {});
    }
    if (fartWinner) {
      const fartCrowned = await assignFartChampionRole(guild, fartWinner.id);
      db.fartChampionId = fartWinner.id;
      db.users[fartWinner.id].fartWeeklyWins = (db.users[fartWinner.id].fartWeeklyWins ?? 0) + 1;
      if (fartCrowned && fartChannel) {
        await fartChannel.send(`💨 **${fartCrowned.displayName}** is the new **Ultimate Farter**! 💨`).catch(() => {});
      }
    } else if (db.fartChampionId) {
      const role = guild.roles.cache.find((r) => r.name === FART_CHAMPION_ROLE_NAME);
      if (role) {
        const oldChamp = await guild.members.fetch(db.fartChampionId).catch(() => null);
        if (oldChamp) await oldChamp.roles.remove(role).catch(() => {});
      }
      db.fartChampionId = null;
    }
  });
  Object.keys(db.users).forEach((id) => {
    db.users[id].points = 0;
    db.users[id].count = 0;
    db.users[id].lastPoopTime = null;
    db.users[id].fartPoints = 0;
    db.users[id].fartCount = 0;
    db.users[id].lastFartTime = null;
  });
  db.weekStart = todayStr();
  saveData(db);
});

cron.schedule("0 0 * * *", () => {
  pickTodaysWindows();
  for (const user of Object.values(db.users)) {
    user.jackpotToday = 0;
    user.megaJackpotToday = 0;
  }
  saveData(db);
});

// ── Daily tax collection & jackpot ─────────────────────────
const EKITTEN_ROLE_NAME = "ekitten :3";

async function runDailyTax() {
  if (!db.taxPool) db.taxPool = 0;

  // Build set of user IDs who have the ekitten :3 role across all guilds
  const eligibleIds = new Set();
  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch().catch(() => {});
    const role = guild.roles.cache.find((r) => r.name === EKITTEN_ROLE_NAME);
    if (!role) continue;
    guild.members.cache.forEach((member) => {
      if (member.roles.cache.has(role.id)) eligibleIds.add(member.id);
    });
  }

  // Collect 5% from eligible users who have kittens
  let collected = 0;
  Object.entries(db.users).forEach(([id, user]) => {
    if (!eligibleIds.has(id)) return;
    const bal = user.kittens ?? 0;
    if (bal <= 0) return;
    const tax = Math.max(1, Math.floor(bal * 0.05));
    user.kittens = Math.max(0, bal - tax);
    collected += tax;
  });
  db.taxPool += collected;
  db.lastTaxDate = todayStr();

  if (db.taxPool <= 0) {
    saveData(db);
    return;
  }

  // Only eligible users can win — weight = 1 / (kittens + 1), poorer users win more often
  const entries = Object.entries(db.users).filter(([id]) => eligibleIds.has(id));
  if (entries.length === 0) { saveData(db); return; }

  const weights = entries.map(([, u]) => 1 / ((u.kittens ?? 0) + 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  let winnerId = entries[entries.length - 1][0];
  for (let i = 0; i < entries.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { winnerId = entries[i][0]; break; }
  }

  const prize = db.taxPool;
  db.taxPool = 0;
  db.users[winnerId].kittens = (db.users[winnerId].kittens ?? 0) + prize;
  saveData(db);

  // Announce in 🤑golden-saucer or fallback
  client.guilds.cache.forEach(async (guild) => {
    const channel = guild.channels.cache.find(
      (c) => c.name === "🤑golden-saucer" || c.name === "golden-saucer" || c.name === "general"
    );
    if (!channel) return;
    const winner = guild.members.cache.get(winnerId) ?? await guild.members.fetch(winnerId).catch(() => null);
    const winnerName = winner?.displayName ?? db.users[winnerId]?.name ?? "Unknown";
    const winnerBal = (db.users[winnerId]?.kittens ?? 0).toLocaleString();
    const embed = new EmbedBuilder()
      .setTitle("💸  Daily Tax Jackpot!")
      .setDescription(
        `The IRS has collected **${collected.toLocaleString()} 🐱** in taxes today.\n\n` +
        `🎉 **${winnerName}** won the jackpot of **${prize.toLocaleString()} 🐱**!\n\n` +
        `*(The fewer kittens you have, the better your odds)*`
      )
      .addFields({ name: winnerName, value: `${winnerBal} 🐱 (after winning)`, inline: true })
      .setColor(0xe74c3c)
      .setTimestamp();
    await channel.send({ embeds: [embed] }).catch(() => {});
  });
}

// 2 pm PST = 22:00 UTC
cron.schedule("0 22 * * *", () => runDailyTax());

// ── VC tracking ────────────────────────────────────────────
const vcJoinTimes = new Map();

client.on("voiceStateUpdate", (oldState, newState) => {
  const userId = newState.member?.id;
  if (!userId || newState.member?.user.bot) return;
  const joined = !oldState.channelId && newState.channelId;
  const left = oldState.channelId && !newState.channelId;
  if (joined) {
    vcJoinTimes.set(userId, Date.now());
  } else if (left) {
    const joinTime = vcJoinTimes.get(userId);
    if (joinTime) {
      const minutesSpent = Math.floor((Date.now() - joinTime) / 60000);
      if (minutesSpent > 0) {
        const name = newState.member?.displayName ?? "Unknown";
        ensureUser(userId, name);
        addKittens(userId, minutesSpent * KITTENS_PER_VC_MINUTE);
        console.log(`[UltimateShitter] ${name} earned ${minutesSpent * KITTENS_PER_VC_MINUTE} kittens for ${minutesSpent} min in VC`);
      }
      vcJoinTimes.delete(userId);
    }
  }
});

// ── Message handler ────────────────────────────────────────
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const userId = msg.author.id;
  const userName = msg.member?.displayName ?? msg.author.username;

  // Earn kittens for every message (frozen if reported by 2+ users)
  ensureUser(userId, userName);
  if (!isKittenFrozen(userId)) {
    db.users[userId].kittens = (db.users[userId].kittens ?? 0) + KITTENS_PER_MESSAGE;
    saveData(db);
  }

  // ── Race word detection ──────────────────────────────────
  const channelRace = activeRaces.get(msg.channel.id);
  if (channelRace && channelRace.phase === "racing" && channelRace.participants.has(userId)) {
    const typed = msg.content.trim().toLowerCase();
    const target = channelRace.word.toLowerCase();
    if (!channelRace.finished.has(userId)) {
      if (typed === target) {
        channelRace.finished.add(userId);
        const elapsed = ((Date.now() - channelRace.startTime) / 1000).toFixed(2);
        if (channelRace.finished.size === 1) {
          addKittens(userId, 25);
          const losers = [];
          for (const [pid, pname] of channelRace.participants) {
            if (pid !== userId) {
              removeKittens(pid, Math.min(25, getKittens(pid)));
              losers.push(pname);
            }
          }
          activeRaces.delete(msg.channel.id);
          const embed = new EmbedBuilder()
            .setTitle("⌨️  Race Over!")
            .setDescription(
              `🏆 **${userName}** wins in **${elapsed}s**! +25 🐱 kittens!\n` +
              (losers.length ? `😔 **${losers.join(", ")}** lose 25 🐱 kittens each.` : "")
            )
            .setColor(0x2ecc71)
            .setTimestamp();
          await msg.channel.send({ embeds: [embed] });
        }
      } else if (typed.length >= channelRace.word.length) {
        channelRace.finished.add(userId);
        removeKittens(userId, Math.min(25, getKittens(userId)));
        await msg.channel.send(`❌ **${userName}** misspelled \`${channelRace.word}\` and loses **25 🐱 kittens**!`);
        if (channelRace.finished.size >= channelRace.participants.size) {
          activeRaces.delete(msg.channel.id);
          await msg.channel.send("💀 Everyone misspelled — no winner this race!");
        }
      }
    }
  }

  if (!msg.content.startsWith(PREFIX)) return;
  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  // ── !poop ────────────────────────────────────────────────
  if (cmd === "poop") {
    ensureUser(userId, userName);
    const double = isDoublePointsNow();
    const earned = double ? 2 : 1;
    const now = Date.now();
    const lastPoop = db.users[userId].lastPoopTime;
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const quickBonus = lastPoop && (now - lastPoop) <= TWO_HOURS ? 1.5 : 0;
    const totalEarned = earned + quickBonus;
    db.users[userId].points += totalEarned;
    db.users[userId].count += 1;
    db.users[userId].lastPoopTime = now;
    db.users[userId].allTimeCount = (db.users[userId].allTimeCount ?? 0) + 1;
    db.users[userId].allTimePoints = (db.users[userId].allTimePoints ?? 0) + totalEarned;
    saveData(db);
    const total = db.users[userId].points;
    const bonusText = double ? " 🔥 **DOUBLE POINTS!** 🔥" : "";
    const quickText = quickBonus ? "\n⚡ **Quick Pooper bonus!** +1.5 pts for pooping within 2 hours!" : "";
    const leader = getTopUser();
    const leadText = leader?.id === userId ? "\n👑 You're currently in the lead!" : "";
    await msg.reply(`💩 Logged! You earned **${totalEarned} point${totalEarned !== 1 ? "s" : ""}**!${bonusText}${quickText}\nYour total this week: **${total} 💩**${leadText}`);
  }

  // ── !leaderboard ─────────────────────────────────────────
  else if (cmd === "leaderboard" || cmd === "lb") {
    await msg.guild?.members.fetch().catch(() => {});
    const embed = buildLeaderboardEmbed(db, msg.guild?.members.cache);
    let champText = "";
    if (db.championId) {
      const champ = await msg.guild?.members.fetch(db.championId).catch(() => null);
      if (champ) champText = `👑 Reigning **Ultimate Shitter**: **${champ.displayName}** *(last week's champ)*`;
    }
    await msg.channel.send({ content: champText || undefined, embeds: [embed] });
  }

  // ── !alltime ─────────────────────────────────────────────
  else if (cmd === "alltime" || cmd === "at") {
    await msg.guild?.members.fetch().catch(() => {});
    const sorted = Object.entries(db.users)
      .filter(([, u]) => (u.allTimeCount ?? 0) > 0)
      .sort(([, a], [, b]) => (b.allTimeCount ?? 0) - (a.allTimeCount ?? 0))
      .slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    const rows = sorted.map(([id, info], i) => {
      const member = msg.guild?.members.cache.get(id);
      const name = member?.displayName ?? info.name ?? `User ${id}`;
      const medal = medals[i] ?? `**${i + 1}.**`;
      return `${medal} **${name}** — ${(info.allTimeCount ?? 0).toLocaleString()} 💩 · ${Math.round(info.allTimePoints ?? 0).toLocaleString()} pts · 👑 ${info.weeklyWins ?? 0} wins`;
    });
    const embed = new EmbedBuilder()
      .setTitle("💩  All-Time Poop Hall of Fame")
      .setDescription(rows.length ? rows.join("\n") : "*Nobody has pooped yet!*")
      .setColor(0x8b4513)
      .setFooter({ text: "All-time stats never reset" })
      .setTimestamp();
    await msg.channel.send({ embeds: [embed] });
  }

  // ── !mystats ─────────────────────────────────────────────
  else if (cmd === "mystats" || cmd === "stats") {
    const info = db.users[userId];
    if (!info || (info.allTimeCount ?? 0) === 0) return msg.reply("You haven't pooped yet! 😱");
    const isChamp = db.championId === userId;
    const embed = new EmbedBuilder()
      .setTitle(`📊 ${info.name}'s Poop Stats`)
      .addFields(
        { name: "This week", value: `💩 ${info.count} poops · ${info.points} pts`, inline: false },
        { name: "All-time poops", value: `🚽 ${(info.allTimeCount ?? 0).toLocaleString()}`, inline: true },
        { name: "All-time points", value: `⭐ ${Math.round(info.allTimePoints ?? 0).toLocaleString()}`, inline: true },
        { name: "Weekly wins", value: `👑 ${info.weeklyWins ?? 0}`, inline: true },
        { name: "Kittens", value: `🐱 ${(info.kittens ?? 0).toLocaleString()}`, inline: true },
      )
      .setColor(0x8b4513)
      .setFooter({ text: isChamp ? "👑 Reigning Ultimate Shitter" : "Keep flushing!" });
    await msg.reply({ embeds: [embed] });
  }

  // ── !doublepoints ─────────────────────────────────────────
  else if (cmd === "doublepoints" || cmd === "dp") {
    if (isDoublePointsNow()) {
      await msg.reply("🔥 **Double points are ACTIVE right now!** Go poop!");
    } else {
      await msg.reply(`⏳ ${nextDoubleWindowDescription()}`);
    }
  }

  // ── !poopfacts ────────────────────────────────────────────
  else if (cmd === "poopfacts" || cmd === "poopfact") {
    const facts = [
      "The average person poops about 1–3 times per day, but anywhere from 3 times a day to 3 times a week is considered normal. 📊",
      "Your poop is about 75% water. The rest is bacteria, fiber, dead cells, and other waste. 💧",
      "The Bristol Stool Scale is an actual medical chart with 7 categories classifying poop from Type 1 (hard lumps) to Type 7 (entirely liquid). Scientists are serious about this. 📋",
      "The average poop weighs about 100–250 grams — roughly the weight of a smartphone. 📱",
      "It takes 24–72 hours for food to travel through your digestive system and become poop. So today's poop might be last Tuesday's lunch. 🕐",
      "Poop gets its brown color from bilirubin, a byproduct of dead red blood cells broken down by your liver. 🟤",
      "The smell of poop comes from compounds like skatole and indole, produced by gut bacteria during digestion. 🌿",
      "Corn doesn't actually pass through you undigested — you digest the insides just fine. What you see is the outer shell. 🌽",
      "The longest recorded poop in history was 26 feet (7.9 meters), achieved under careful medical observation. 📏",
      "Some animals eat their own poop on purpose. Rabbits produce cecotropes packed with nutrients and eat them directly. 🐇",
      "Your gut contains about 100 trillion bacteria — outnumbering your body's own cells. 🦠",
      "Poop transplants (fecal microbiota transplants) are a real medical treatment. 💊",
      "Astronauts on early NASA missions had to poop into bags stuck to their butts in zero gravity. 🚀",
      "The word 'poop' originally meant the rear deck of a ship in the 1400s. ⛵",
      "Wombat poop is cube-shaped — the only animal known to produce square droppings. Scientists figured out HOW in 2018. 🟫",
      "The average person spends about 3 hours per week on the toilet — roughly 92 days over a lifetime. 🧮",
      "Holding in poop doesn't cause your body to reabsorb toxins — that's a myth. 🚫",
      "Ancient Romans used a communal sponge on a stick called a 'tersorium' instead of toilet paper. It was shared. 🏛️",
      "A healthy poop should sink, not float. Floating poop can indicate excess fat or gas. 🚽",
      "Some penguins projectile poop up to 4.4 feet to avoid soiling their nests. Scientists published a paper on the rectal pressure required. 🐧",
      "The technical term for the study of feces is 'scatology.' There are actual scatologists. 🔬",
      "Healthy poop should be roughly S or C shaped — the shape of your colon. 🔄",
      "Poop has been used as fertilizer for thousands of years and is still used today. 🌱",
      "Some penguins projectile poop up to 4.4 feet to avoid soiling their nests. 🐧",
      "If you're right-handed, you probably wipe front to back. Left-handers are statistically more likely to wipe back to front. ✋",
    ];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    const embed = new EmbedBuilder()
      .setTitle("💩  Poop Fact of the Moment")
      .setDescription(fact)
      .setColor(0x8b4513)
      .setFooter({ text: "Use !poopfacts again for another one" });
    await msg.channel.send({ embeds: [embed] });
  }

  // ── !fart ────────────────────────────────────────────────
  else if (cmd === "fart") {
    ensureUser(userId, userName);
    const double = isDoublePointsNow();
    const earned = double ? 2 : 1;
    const now = Date.now();
    const lastFart = db.users[userId].lastFartTime;
    const ONE_HOUR = 60 * 60 * 1000;
    const quickBonus = lastFart && (now - lastFart) <= ONE_HOUR ? 1.5 : 0;
    const totalEarned = earned + quickBonus;
    db.users[userId].fartPoints = (db.users[userId].fartPoints ?? 0) + totalEarned;
    db.users[userId].fartCount = (db.users[userId].fartCount ?? 0) + 1;
    db.users[userId].lastFartTime = now;
    db.users[userId].allTimeFartCount = (db.users[userId].allTimeFartCount ?? 0) + 1;
    db.users[userId].allTimeFartPoints = (db.users[userId].allTimeFartPoints ?? 0) + totalEarned;
    saveData(db);
    const total = db.users[userId].fartPoints;
    const bonusText = double ? " 🔥 **DOUBLE POINTS!** 🔥" : "";
    const quickText = quickBonus ? "\n⚡ **Quick Farter bonus!** +1.5 pts for farting within 1 hour!" : "";
    const fartLeader = getFartTopUser();
    const leadText = fartLeader?.id === userId ? "\n👑 You're currently leading the fart charts!" : "";
    const fartSounds = ["*pffft*", "*braaap*", "*toot*", "*squeak*", "*riiiip*", "*pfft*", "*blaaaart*", "*peep*", "*BRRRT*"];
    const sound = fartSounds[Math.floor(Math.random() * fartSounds.length)];
    await msg.reply(`💨 ${sound} Logged! You earned **${totalEarned} point${totalEarned !== 1 ? "s" : ""}**!${bonusText}${quickText}\nYour total this week: **${total} 💨**${leadText}`);
  }

  // ── !fartleaderboard ──────────────────────────────────────
  else if (cmd === "fartleaderboard" || cmd === "fartlb" || cmd === "flb") {
    await msg.guild?.members.fetch().catch(() => {});
    const embed = buildFartLeaderboardEmbed(db, msg.guild?.members.cache);
    let champText = "";
    if (db.fartChampionId) {
      const champ = await msg.guild?.members.fetch(db.fartChampionId).catch(() => null);
      if (champ) champText = `👑 Reigning **Ultimate Farter**: **${champ.displayName}** *(last week's champ)*`;
    }
    await msg.channel.send({ content: champText || undefined, embeds: [embed] });
  }

  // ── !fartalltime ──────────────────────────────────────────
  else if (cmd === "fartalltime" || cmd === "fat") {
    await msg.guild?.members.fetch().catch(() => {});
    const sorted = Object.entries(db.users)
      .filter(([, u]) => (u.allTimeFartCount ?? 0) > 0)
      .sort(([, a], [, b]) => (b.allTimeFartCount ?? 0) - (a.allTimeFartCount ?? 0))
      .slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    const rows = sorted.map(([id, info], i) => {
      const member = msg.guild?.members.cache.get(id);
      const name = member?.displayName ?? info.name ?? `User ${id}`;
      const medal = medals[i] ?? `**${i + 1}.**`;
      return `${medal} **${name}** — ${(info.allTimeFartCount ?? 0).toLocaleString()} 💨 · ${Math.round(info.allTimeFartPoints ?? 0).toLocaleString()} pts · 👑 ${info.fartWeeklyWins ?? 0} wins`;
    });
    const embed = new EmbedBuilder()
      .setTitle("💨  All-Time Fart Hall of Fame")
      .setDescription(rows.length ? rows.join("\n") : "*Nobody has farted yet!*")
      .setColor(0xf5d76e)
      .setFooter({ text: "All-time stats never reset" })
      .setTimestamp();
    await msg.channel.send({ embeds: [embed] });
  }

  // ── !fartstats ────────────────────────────────────────────
  else if (cmd === "fartstats" || cmd === "fstats") {
    ensureUser(userId, userName);
    const info = db.users[userId];
    if ((info.allTimeFartCount ?? 0) === 0) return msg.reply("You haven't farted yet! Let it rip! 💨");
    const isChamp = db.fartChampionId === userId;
    const embed = new EmbedBuilder()
      .setTitle(`📊 ${info.name}'s Fart Stats`)
      .addFields(
        { name: "This week", value: `💨 ${info.fartCount ?? 0} farts · ${info.fartPoints ?? 0} pts`, inline: false },
        { name: "All-time farts", value: `🌬️ ${(info.allTimeFartCount ?? 0).toLocaleString()}`, inline: true },
        { name: "All-time points", value: `⭐ ${Math.round(info.allTimeFartPoints ?? 0).toLocaleString()}`, inline: true },
        { name: "Weekly wins", value: `👑 ${info.fartWeeklyWins ?? 0}`, inline: true },
      )
      .setColor(0xf5d76e)
      .setFooter({ text: isChamp ? "👑 Reigning Ultimate Farter" : "Let it rip!" });
    await msg.reply({ embeds: [embed] });
  }

  // ── !fartfacts ────────────────────────────────────────────
  else if (cmd === "fartfacts" || cmd === "fartfact") {
    const facts = [
      "The average person farts 14–23 times per day — whether they admit it or not. 💨",
      "Farts are primarily made up of nitrogen, hydrogen, carbon dioxide, oxygen, and methane. Only about 1% is the smelly stuff. 🧪",
      "The word 'fart' dates back to at least the 13th century, derived from Old English 'feortan.' It's one of the oldest words in the language. 📜",
      "Women's farts actually smell worse than men's on average — they contain higher concentrations of hydrogen sulfide. 🔬",
      "Methane in farts is flammable. Hence why lighting farts is a thing. Do not try this at home. 🔥",
      "Termites are the biggest animal farters by mass — they produce more methane than all other animals combined. 🐜",
      "Fish fart too. Herring communicate using high-frequency farts. Scientists named it Fast Repetitive Tick (FRT). 🐟",
      "Holding in a fart doesn't make it disappear — it gets reabsorbed into your bloodstream and can be exhaled through your lungs. 😬",
      "The technical term for farting is 'flatulence.' A single fart is called 'flatus.' There are actual scientists who study this. 🔬",
      "Ancient Egyptians had fart jokes — some of the oldest written humor ever discovered is fart-related. 🏺",
      "Manatees use their farts to swim — stored intestinal gas helps them float and sink like a biological ballast system. 🌊",
      "Cows produce so much methane from farting and burping that they are a significant contributor to global greenhouse gases. 🐄",
      "The sound of a fart comes from vibrations of the anal sphincter — higher pressure produces higher pitch. 🎵",
      "Dogs fart silently more often than humans because their anal sphincter is more relaxed. This is why you never smell it coming. 🐶",
      "The average fart contains about 200–2000ml of gas depending on diet — enough to fill a small balloon. 🎈",
      "A fart in a sealed space like an elevator can linger for up to 20 minutes. Choose your elevator companions wisely. 🛗",
      "Astronauts have to be careful about farting near equipment — methane accumulation in enclosed spacecraft is genuinely dangerous. 🚀",
      "The hydrogen sulfide in farts smells at concentrations of just 1 part per billion. Your nose is an extremely sensitive fart detector. 👃",
      "Beans cause extra gas because they contain oligosaccharides — complex sugars humans can't fully digest, so gut bacteria ferment them. 🫘",
      "Benjamin Franklin once wrote a satirical essay titled 'Fart Proudly' urging scientists to study ways to make farts smell better. 📝",
      "Hippos spin their tails while defecating to spread waste and scent-mark their territory via farts. Nature is wild. 🦛",
      "A blue whale's fart bubble is reportedly large enough for a horse to stand in. 🐋",
      "A fart travels at about 10 feet per second when it exits the body. 💨",
      "During surgery, electrosurgical tools have ignited gas in the colon causing internal explosions. Bowel prep exists for a reason. 💥",
      "The fart of a single cow produces enough methane per year to power a small car for about 100 miles. 🚗",
    ];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    const embed = new EmbedBuilder()
      .setTitle("💨  Fart Fact of the Moment")
      .setDescription(fact)
      .setColor(0xf5d76e)
      .setFooter({ text: "Use !fartfacts again for another one" });
    await msg.channel.send({ embeds: [embed] });
  }

  // ── !farthelp ─────────────────────────────────────────────
  else if (cmd === "farthelp") {
    const embed = new EmbedBuilder()
      .setTitle("💨  Fart Bot — Commands")
      .addFields(
        { name: "`!fart`", value: "Log a fart and earn a point" },
        { name: "`!fartlb` / `!flb`", value: "See the weekly fart leaderboard" },
        { name: "`!fartalltime` / `!fat`", value: "All-time fart hall of fame — never resets" },
        { name: "`!fartstats` / `!fstats`", value: "Your personal fart stats — weekly and all-time" },
        { name: "`!fartfacts`", value: "Get a random fart fact" },
        { name: "`!doublepoints` / `!dp`", value: "Check if double points are active (shared with poop!)" },
        { name: "⚡ Quick Farter bonus", value: "Fart within 1 hour of your last for +1.5 points!" },
        { name: "👑 The Ultimate Farter", value: "Awarded to the weekly #1 farter every Monday." },
      )
      .setColor(0xf5d76e)
      .setFooter({ text: "Leaderboard resets every Monday at midnight • !poophelp for poop commands" });
    await msg.channel.send({ embeds: [embed] });
  }

  // ── !kittens ─────────────────────────────────────────────
  else if (cmd === "kittens" || cmd === "balance" || cmd === "bal") {
    const target = msg.mentions.users.first();
    const lookupId = target?.id ?? userId;
    const lookupName = target?.username ?? userName;
    const bal = getKittens(lookupId);
    await msg.reply(`🐱 **${lookupName}** has **${bal.toLocaleString()} kittens**`);
  }


  // ── !kittenboard ─────────────────────────────────────────
  else if (cmd === "kittenboard" || cmd === "kb") {
    await msg.guild?.members.fetch().catch(() => {});
    const sorted = Object.entries(db.users)
      .filter(([, u]) => (u.kittens ?? 0) > 0)
      .sort(([, a], [, b]) => (b.kittens ?? 0) - (a.kittens ?? 0))
      .slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    const rows = sorted.map(([id, info], i) => {
      const member = msg.guild?.members.cache.get(id);
      const name = member?.displayName ?? info.name ?? `User ${id}`;
      const medal = medals[i] ?? `**${i + 1}.**`;
      return `${medal} **${name}** — ${(info.kittens ?? 0).toLocaleString()} 🐱`;
    });
    const embed = new EmbedBuilder()
      .setTitle("🐱  Kitten Rich List")
      .setDescription(rows.length ? rows.join("\n") : "*Nobody has kittens yet — send some messages!*")
      .setColor(0xff69b4)
      .setFooter({ text: "Earn 5 kittens per message · 5 kittens per minute in VC" })
      .setTimestamp();
    await msg.channel.send({ embeds: [embed] });
  }

  // ── !donate ───────────────────────────────────────────────
  else if (cmd === "donate") {
    const target = msg.mentions.users.first();
    const amount = parseInt(args[args.length - 1]);

    if (!target) return msg.reply("❌ Usage: `!donate @user <amount>`");
    if (target.id === userId) return msg.reply("❌ You can't donate to yourself!");
    if (target.bot) return msg.reply("❌ You can't donate to a bot!");
    if (isNaN(amount) || amount <= 0) return msg.reply("❌ Provide a positive amount — e.g. `!donate @user 10`");

    const senderBal = getKittens(userId);
    if (senderBal < amount) return msg.reply(`❌ You only have **${senderBal.toLocaleString()} 🐱 kittens** — can't donate **${amount.toLocaleString()}**`);

    ensureUser(target.id, target.username);
    removeKittens(userId, amount);
    addKittens(target.id, amount);

    const targetName = msg.guild?.members.cache.get(target.id)?.displayName ?? target.username;
    const senderName = msg.guild?.members.cache.get(userId)?.displayName ?? userName;
    const embed = new EmbedBuilder()
      .setTitle("🎁  Kitten Donation")
      .setDescription(`**${senderName}** donated **${amount.toLocaleString()} 🐱 kittens** to **${targetName}**!`)
      .addFields(
        { name: senderName, value: `${(senderBal - amount).toLocaleString()} 🐱 remaining`, inline: true },
        { name: targetName, value: `${getKittens(target.id).toLocaleString()} 🐱 total`, inline: true },
      )
      .setColor(0x2ecc71)
      .setTimestamp();
    await msg.channel.send({ embeds: [embed] });
  }

  // ── !rob ──────────────────────────────────────────────────
  else if (cmd === "rob") {
    ensureUser(userId, userName);

    // Daily limit
    const today = todayStr();
    const robUser = db.users[userId];
    if (robUser.lastRobDate !== today) { robUser.robsToday = 0; robUser.lastRobDate = today; }
    const robsUsed = robUser.robsToday ?? 0;
    if (robsUsed >= ROB_DAILY_LIMIT) {
      return msg.reply(`❌ You've used all **${ROB_DAILY_LIMIT} robbery attempts** for today. Come back tomorrow!`);
    }

    // Parse mode (optional last arg "rps", default is dice)
    const lastArg = args[args.length - 1]?.toLowerCase();
    const mode = lastArg === "rps" ? "rps" : "dice";
    const stakeArg = parseInt(args[mode === "rps" ? args.length - 2 : args.length - 1]);

    if (isNaN(stakeArg) || stakeArg <= 0) {
      return msg.reply("❌ Usage: `!rob @user <amount> [rps]` or `!rob <amount> [rps]`");
    }

    const robberKittens = getKittens(userId);
    if (robberKittens < stakeArg) {
      return msg.reply(`❌ You only have **${robberKittens.toLocaleString()} 🐱 kittens** — can't stake **${stakeArg.toLocaleString()}**!`);
    }

    const mentionedTarget = msg.mentions.users.first();
    const isRandom = !mentionedTarget;
    let targetId, targetName;

    if (mentionedTarget) {
      if (mentionedTarget.id === userId) return msg.reply("❌ You can't rob yourself!");
      if (mentionedTarget.bot) return msg.reply("❌ You can't rob a bot!");
      targetId = mentionedTarget.id;
      ensureUser(targetId, mentionedTarget.username);
      targetName = msg.guild?.members.cache.get(targetId)?.displayName ?? mentionedTarget.username;
      const targetKittens = getKittens(targetId);
      if (targetKittens < stakeArg) {
        return msg.reply(`❌ **${targetName}** only has **${targetKittens.toLocaleString()} 🐱 kittens** — not enough to rob!`);
      }
    } else {
      const eligible = Object.entries(db.users).filter(([id, u]) => id !== userId && (u.kittens ?? 0) >= stakeArg);
      if (eligible.length === 0) {
        return msg.reply(`❌ No one has **${stakeArg.toLocaleString()} 🐱 kittens** for you to rob!`);
      }
      const [randomId, randomUser] = eligible[Math.floor(Math.random() * eligible.length)];
      targetId = randomId;
      targetName = msg.guild?.members.cache.get(targetId)?.displayName ?? randomUser.name ?? `User ${targetId}`;
    }

    // Consume a daily attempt
    robUser.robsToday = robsUsed + 1;
    saveData(db);

    const robberDisplayName = msg.member?.displayName ?? userName;
    const robsLeft = ROB_DAILY_LIMIT - robUser.robsToday;

    if (mode === "dice") {
      let roll1, roll2;
      do {
        roll1 = Math.floor(Math.random() * 6) + 1;
        roll2 = Math.floor(Math.random() * 6) + 1;
      } while (roll1 === roll2);

      const robberWins = roll1 > roll2;
      const winAmount = isRandom && robberWins ? Math.floor(stakeArg * 1.5) : stakeArg;

      let description;
      if (robberWins) {
        removeKittens(targetId, stakeArg);
        addKittens(userId, winAmount);
        if (isRandom) {
          description = `🎲 **${robberDisplayName}** rolled **${roll1}** · **${targetName}** rolled **${roll2}**\n\n🔫 **${robberDisplayName}** wins! Stole **${stakeArg.toLocaleString()} 🐱** and got a **+${(winAmount - stakeArg).toLocaleString()} 🐱 RNG bonus** for **${winAmount.toLocaleString()} 🐱 total**!`;
        } else {
          description = `🎲 **${robberDisplayName}** rolled **${roll1}** · **${targetName}** rolled **${roll2}**\n\n🔫 **${robberDisplayName}** wins and steals **${stakeArg.toLocaleString()} 🐱** from **${targetName}**!`;
        }
      } else {
        removeKittens(userId, stakeArg);
        addKittens(targetId, stakeArg);
        description = `🎲 **${robberDisplayName}** rolled **${roll1}** · **${targetName}** rolled **${roll2}**\n\n🛡️ **${targetName}** defended! **${robberDisplayName}** loses **${stakeArg.toLocaleString()} 🐱** to **${targetName}**!`;
      }

      const embed = new EmbedBuilder()
        .setTitle("🔫  Rob Attempt — Dice!")
        .setDescription(description)
        .setColor(robberWins ? 0xe74c3c : 0x2ecc71)
        .addFields(
          { name: robberDisplayName, value: `${getKittens(userId).toLocaleString()} 🐱`, inline: true },
          { name: targetName, value: `${getKittens(targetId).toLocaleString()} 🐱`, inline: true },
        )
        .setFooter({ text: `${isRandom ? "Random target — 50% bonus on win · " : ""}${robsLeft} rob${robsLeft === 1 ? "" : "s"} left today` })
        .setTimestamp();

      await msg.channel.send({ embeds: [embed] });

    } else {
      // RPS mode
      const robKey = `${userId}_${targetId}`;
      if (pendingRobs.has(robKey)) {
        return msg.reply("❌ You already have a pending RPS robbery against this person!");
      }

      const rpsRow = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`rob_rps_${userId}_${targetId}_rock`).setLabel("🪨 Rock").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`rob_rps_${userId}_${targetId}_paper`).setLabel("📄 Paper").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`rob_rps_${userId}_${targetId}_scissors`).setLabel("✂️ Scissors").setStyle(ButtonStyle.Secondary),
      );

      const phaseEmbed = (desc) => new EmbedBuilder()
        .setTitle("🔫  Rob Attempt — Rock Paper Scissors!")
        .setDescription(desc)
        .setColor(0xe67e22)
        .setFooter({ text: `${isRandom ? "Random target — 50% bonus on win · " : ""}${robsLeft} rob${robsLeft === 1 ? "" : "s"} left today · 30s per phase` })
        .setTimestamp();

      const sentMsg = await msg.channel.send({
        embeds: [phaseEmbed(`**${robberDisplayName}** is trying to rob <@${targetId}> for **${stakeArg.toLocaleString()} 🐱**!\n\n<@${userId}> — pick your move first. Only you will see your choice.`)],
        components: [rpsRow()],
      });

      const makeTimeout = (phase) => setTimeout(async () => {
        pendingRobs.delete(robKey);
        const cancelEmbed = new EmbedBuilder()
          .setTitle("🔫  Rob Attempt — Cancelled")
          .setDescription(`⏰ The RPS challenge between **${robberDisplayName}** and **${targetName}** timed out (${phase} didn't respond) — no kittens exchanged.`)
          .setColor(0x95a5a6)
          .setTimestamp();
        sentMsg.edit({ embeds: [cancelEmbed], components: [] }).catch(() => {});
      }, ROB_RPS_TIMEOUT_MS);

      pendingRobs.set(robKey, {
        robberId: userId,
        robberName: robberDisplayName,
        targetId,
        targetName,
        stake: stakeArg,
        isRandom,
        robberPick: null,
        phase: "robber",
        message: sentMsg,
        phaseEmbed,
        rpsRow,
        timeoutHandle: makeTimeout("robber"),
        robsLeft,
      });
    }
  }

  // ── !bomb ─────────────────────────────────────────────────
  else if (cmd === "bomb") {
    const target = msg.mentions.users.first();
    if (!target) return msg.reply("❌ Usage: `!bomb @user`");
    if (target.id === userId) return msg.reply("❌ You can't bomb yourself!");
    if (target.bot) return msg.reply("❌ You can't bomb a bot!");

    const BOMB_COOLDOWN_MS = 60 * 60 * 1000;
    const lastBomb = db.users[userId]?.lastBombTime ?? 0;
    const elapsed = Date.now() - lastBomb;
    if (elapsed < BOMB_COOLDOWN_MS) {
      const secsLeft = Math.ceil((BOMB_COOLDOWN_MS - elapsed) / 1000);
      const minsLeft = Math.ceil(secsLeft / 60);
      return msg.reply(`❌ You already threw a bomb! You can throw another in **${minsLeft} minute${minsLeft !== 1 ? "s" : ""}**.`);
    }

    ensureUser(target.id, target.username);
    db.users[userId].lastBombTime = Date.now();
    saveData(db);
    const senderName = msg.guild?.members.cache.get(userId)?.displayName ?? userName;

    const BOMB_AMOUNT = 100;
    const HIT_CHANCE = 0.2;

    const memberPool = msg.guild
      ? [...msg.guild.members.cache.values()].filter(m => !m.user.bot)
      : [];

    const chain = [];
    let current = target;

    while (true) {
      const currentName = msg.guild?.members.cache.get(current.id)?.displayName ?? current.username;
      if (Math.random() < HIT_CHANCE) {
        chain.push(`**${currentName}** 💥`);
        ensureUser(current.id, current.username);
        const before = getKittens(current.id);
        removeKittens(current.id, BOMB_AMOUNT);
        saveData(db);
        const after = getKittens(current.id);
        const lost = before - after;
        const embed = new EmbedBuilder()
          .setTitle("💣  BOOM!")
          .setDescription(`**${senderName}** threw a bomb!\n\n${chain.join(" → ")}\n\n**${lost.toLocaleString()} 🐱 kittens** obliterated.`)
          .addFields({ name: currentName, value: `${after.toLocaleString()} 🐱 remaining`, inline: true })
          .setColor(0xe74c3c)
          .setTimestamp();
        await msg.channel.send({ embeds: [embed] });
        break;
      } else {
        chain.push(`**${currentName}**`);
        if (memberPool.length === 0) break;
        current = memberPool[Math.floor(Math.random() * memberPool.length)].user;
        ensureUser(current.id, current.username);
      }
    }
  }

  // ── !blackjack ────────────────────────────────────────────
  else if (cmd === "blackjack" || cmd === "bj") {
    const channelId = msg.channel.id;
    if (activeGames.has(channelId)) return msg.reply("❌ There's already a game running in this channel!");
    const mentionedUsers = [...msg.mentions.users.values()].filter(u => u.id !== client.user.id);

    if (mentionedUsers.length > 0) {
      const betArg = parseInt(args[args.length - 1]);
      if (isNaN(betArg) || betArg <= 0) return msg.reply("Usage: `!blackjack @user1 [@user2 ...] <bet>`");
      const p1Kittens = getKittens(userId);
      if (p1Kittens < betArg) return msg.reply(`❌ You only have **${p1Kittens} 🐱 kittens**!`);
      const spamTracker = msg.client.bjSpamTracker ?? (msg.client.bjSpamTracker = new Map());
      const p2s = [];
      for (const u of mentionedUsers) {
        if (u.id === userId) return msg.reply("❌ You can't challenge yourself!");
        const p2Kittens = getKittens(u.id);
        if (p2Kittens < betArg) return msg.reply(`❌ <@${u.id}> only has **${p2Kittens} 🐱 kittens**!`);
        const spamKey = `${userId}-${u.id}`;
        const spamCount = spamTracker.get(spamKey) ?? 0;
        if (spamCount >= 3) return msg.reply(`❌ You've sent **3 unanswered challenges** to <@${u.id}>! Wait for them to respond.`);
        p2s.push({ id: u.id, spamKey });
      }
      for (const { spamKey } of p2s) spamTracker.set(spamKey, (spamTracker.get(spamKey) ?? 0) + 1);
      const mentions = p2s.map(p => `<@${p.id}>`).join(", ");
      const challengeMsg = await msg.channel.send(
        `🃏 ${mentions} — **${userName}** challenges you to Blackjack for **${betArg} 🐱 kittens** each!\nType \`!accept\` within 60 seconds!`
      );
      const pendingGames = msg.client.pendingGames ?? (msg.client.pendingGames = new Map());
      pendingGames.set(channelId, { type: "challenge", p1: userId, p1Name: userName, p2s, accepted: new Map(), bet: betArg, expiresAt: Date.now() + 60000 });
      setTimeout(async () => {
        const pending = pendingGames.get(channelId);
        if (!pending || pending.type !== "challenge") return;
        pendingGames.delete(channelId);
        const noShows = pending.p2s.filter(p => !pending.accepted.has(p.id));
        for (const { id, spamKey } of noShows) {
          spamTracker.delete(spamKey);
          if (getKittens(id) > 0) { removeKittens(id, 1); addKittens(userId, 1); }
        }
        if (pending.accepted.size === 0) {
          challengeMsg.reply(`⏰ Challenge expired — nobody responded! No-shows each lost **1 🐱 kitten** to **${userName}**.`).catch(() => {});
        } else {
          const players = [{ id: pending.p1, name: pending.p1Name }];
          for (const { id } of pending.p2s) {
            if (pending.accepted.has(id)) players.push({ id, name: pending.accepted.get(id) });
          }
          await startPvPGame(msg.channel, channelId, players, pending.bet);
          if (noShows.length > 0) {
            const noShowMentions = noShows.map(p => `<@${p.id}>`).join(", ");
            msg.channel.send(`⏰ ${noShowMentions} didn't respond and each lost **1 🐱 kitten** to **${userName}**.`).catch(() => {});
          }
        }
      }, 60000);
    } else if (args[0]?.toLowerCase() === "open") {
      const betArg = parseInt(args[1]);
      if (isNaN(betArg) || betArg <= 0) return msg.reply("Usage: `!blackjack open <bet>`");
      const p1Kittens = getKittens(userId);
      if (p1Kittens < betArg) return msg.reply(`❌ You only have **${p1Kittens} 🐱 kittens**!`);
      const pendingGames = msg.client.pendingGames ?? (msg.client.pendingGames = new Map());
      if (pendingGames.has(channelId)) return msg.reply("❌ There's already a pending game in this channel!");
      const participants = new Map([[userId, userName]]);
      pendingGames.set(channelId, { type: "open", host: userId, participants, bet: betArg, expiresAt: Date.now() + 30000 });
      const lobbyEmbed = new EmbedBuilder()
        .setTitle("🃏  Open Blackjack Table")
        .setDescription(`**${userName}** opened a table for **${betArg} 🐱 kittens**!\nType \`!join\` within **30 seconds** to sit down!`)
        .setColor(0x2ecc71)
        .setFooter({ text: "Need at least 2 players to start" });
      const lobbyMsg = await msg.channel.send({ embeds: [lobbyEmbed] });
      setTimeout(async () => {
        const pending = pendingGames.get(channelId);
        if (!pending || pending.type !== "open") return;
        pendingGames.delete(channelId);
        if (pending.participants.size < 2) {
          lobbyMsg.reply("❌ Not enough players joined — table cancelled! (Need at least 2)").catch(() => {});
          return;
        }
        const players = [...pending.participants.entries()].map(([id, name]) => ({ id, name }));
        await startPvPGame(msg.channel, channelId, players, pending.bet);
      }, 30000);
    } else {
      const bet = parseInt(args[0]);
      if (isNaN(bet) || bet <= 0) return msg.reply("Usage: `!blackjack <bet>` or `!blackjack @user1 [@user2 ...] <bet>`");
      const p1Kittens = getKittens(userId);
      if (p1Kittens < bet) return msg.reply(`❌ You only have **${p1Kittens} 🐱 kittens**!`);
      const deck = makeDeck();
      const hands = { [userId]: [deck.pop(), deck.pop()] };
      const dealerHand = [deck.pop(), deck.pop()];
      removeKittens(userId, bet);
      const players = [{ id: userId, name: userName }];
      const game = { players, bet, deck, hands, dealerHand, turn: userId, stood: new Set(), vsBot: true };
      activeGames.set(channelId, game);
      const embed = buildGameEmbed(game);
      await msg.channel.send({ content: `🃏 **${userName}** plays Blackjack vs the dealer for **${bet} 🐱 kittens**!`, embeds: [embed], components: [buildBJRow(channelId)] });
      if (handValue(hands[userId]) === 21) resolveBlackjack(msg.channel, channelId);
      else setTurnTimeout(msg.channel, channelId);
    }
  }

  // ── !accept ───────────────────────────────────────────────
  else if (cmd === "accept") {
    const channelId = msg.channel.id;
    const pendingGames = msg.client.pendingGames;
    const pending = pendingGames?.get(channelId);
    if (!pending || pending.type !== "challenge") return msg.reply("❌ No pending challenge in this channel.");
    const isChallengee = pending.p2s.some(p => p.id === msg.author.id);
    if (!isChallengee) return msg.reply("❌ This challenge isn't for you!");
    if (Date.now() > pending.expiresAt) {
      pendingGames.delete(channelId);
      return msg.reply("⏰ That challenge already expired.");
    }
    if (pending.accepted.has(msg.author.id)) return msg.reply("❌ You've already accepted!");
    const acceptName = msg.member?.displayName ?? msg.author.username;
    pending.accepted.set(msg.author.id, acceptName);
    const spamTracker = msg.client.bjSpamTracker;
    const entry = pending.p2s.find(p => p.id === msg.author.id);
    if (spamTracker && entry?.spamKey) spamTracker.delete(entry.spamKey);
    const remaining = pending.p2s.filter(p => !pending.accepted.has(p.id));
    if (remaining.length > 0) {
      const remainMentions = remaining.map(p => `<@${p.id}>`).join(", ");
      await msg.reply(`✅ **${acceptName}** accepted! Still waiting for: ${remainMentions}`);
    } else {
      pendingGames.delete(channelId);
      const players = [{ id: pending.p1, name: pending.p1Name }];
      for (const { id } of pending.p2s) players.push({ id, name: pending.accepted.get(id) });
      await startPvPGame(msg.channel, channelId, players, pending.bet);
    }
  }

  // ── !hit ──────────────────────────────────────────────────
  else if (cmd === "hit") {
    const channelId = msg.channel.id;
    const game = activeGames.get(channelId);
    if (!game) return;
    if (msg.author.id !== game.turn) return msg.reply("❌ It's not your turn!");
    clearTurnTimeout(game);
    const card = game.deck.pop();
    game.hands[game.turn].push(card);
    const val = handValue(game.hands[game.turn]);
    const name = game.players.find(p => p.id === game.turn).name;
    if (val > 21) {
      await msg.channel.send(`💥 **${name}** busted with **${val}**!`);
      game.stood.add(game.turn);
      advanceTurn(msg.channel, channelId);
    } else if (val === 21) {
      await msg.channel.send(`✨ **${name}** hit 21! Standing automatically.`);
      game.stood.add(game.turn);
      advanceTurn(msg.channel, channelId);
    } else {
      await msg.channel.send({ embeds: [buildGameEmbed(game)], components: [buildBJRow(channelId)] });
    }
  }

  // ── !stand ────────────────────────────────────────────────
  else if (cmd === "stand") {
    const channelId = msg.channel.id;
    const game = activeGames.get(channelId);
    if (!game) return;
    if (msg.author.id !== game.turn) return msg.reply("❌ It's not your turn!");
    clearTurnTimeout(game);
    const name = game.players.find(p => p.id === game.turn).name;
    game.stood.add(game.turn);
    await msg.channel.send(`🛑 **${name}** stands at **${handValue(game.hands[game.turn])}**.`);
    advanceTurn(msg.channel, channelId);
  }

  // ── !rps ──────────────────────────────────────────────────
  else if (cmd === "rps") {
    const mentionedUser = msg.mentions.users.first();
    const bet = parseInt(args[args.length - 1]);

    if (isNaN(bet) || bet <= 0) return msg.reply("❌ Usage: `!rps <bet>` or `!rps @user <bet>`");

    const userKittens = getKittens(userId);
    if (userKittens < bet) return msg.reply(`❌ You only have **${userKittens.toLocaleString()} 🐱 kittens**!`);

    const rpsRow = (idPrefix) => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${idPrefix}_rock`).setLabel("🪨 Rock").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${idPrefix}_paper`).setLabel("📄 Paper").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`${idPrefix}_scissors`).setLabel("✂️ Scissors").setStyle(ButtonStyle.Danger),
    );

    if (!mentionedUser) {
      // vs house
      const gameKey = `rps_bot_${userId}`;
      if (pendingRpsGames.has(gameKey)) return msg.reply("❌ You already have a pending RPS game!");

      const embed = new EmbedBuilder()
        .setTitle("✂️  Rock Paper Scissors — vs House")
        .setDescription(`**${userName}** bets **${bet.toLocaleString()} 🐱 kittens** against the house!\n\nPick your move:`)
        .setColor(0x3498db)
        .setFooter({ text: "30s to pick · Win doubles your bet · Tie returns it" });

      const sentMsg = await msg.channel.send({
        embeds: [embed],
        components: [rpsRow(`rps_bot_${userId}_${bet}`)],
      });

      const timeoutHandle = setTimeout(async () => {
        pendingRpsGames.delete(gameKey);
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("✂️  Rock Paper Scissors — Cancelled")
          .setDescription(`⏰ **${userName}** didn't pick in time — game cancelled.`)
          .setColor(0x95a5a6)
          .setTimestamp();
        sentMsg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }, RPS_TIMEOUT_MS);

      pendingRpsGames.set(gameKey, { userId, userName, bet, message: sentMsg, timeoutHandle });

    } else {
      // vs player
      if (mentionedUser.id === userId) return msg.reply("❌ You can't challenge yourself!");
      if (mentionedUser.bot) return msg.reply("❌ You can't challenge a bot!");

      const targetId = mentionedUser.id;
      ensureUser(targetId, mentionedUser.username);
      const targetName = msg.guild?.members.cache.get(targetId)?.displayName ?? mentionedUser.username;
      const targetKittens = getKittens(targetId);
      if (targetKittens < bet) return msg.reply(`❌ **${targetName}** only has **${targetKittens.toLocaleString()} 🐱 kittens** — not enough!`);

      const rpsKey = `rps_pvp_${userId}_${targetId}`;
      if (pendingRpsGames.has(rpsKey)) return msg.reply("❌ You already have a pending RPS challenge against this person!");

      const phaseEmbed = (desc) => new EmbedBuilder()
        .setTitle("✂️  Rock Paper Scissors — 1v1")
        .setDescription(desc)
        .setColor(0x9b59b6)
        .setFooter({ text: `${bet.toLocaleString()} 🐱 kittens each · 30s to pick` });

      const sentMsg = await msg.channel.send({
        embeds: [phaseEmbed(`<@${userId}> challenges <@${targetId}> to RPS for **${bet.toLocaleString()} 🐱 kittens** each!\n\n<@${userId}> — pick your move first. Only you will see your choice.`)],
        components: [rpsRow(`rps_pvp_${userId}_${targetId}`)],
      });

      const makeTimeout = (name) => setTimeout(async () => {
        pendingRpsGames.delete(rpsKey);
        const cancelEmbed = new EmbedBuilder()
          .setTitle("✂️  Rock Paper Scissors — Cancelled")
          .setDescription(`⏰ **${name}** didn't respond in time — game cancelled, no kittens exchanged.`)
          .setColor(0x95a5a6)
          .setTimestamp();
        sentMsg.edit({ embeds: [cancelEmbed], components: [] }).catch(() => {});
      }, RPS_TIMEOUT_MS);

      pendingRpsGames.set(rpsKey, {
        challengerId: userId,
        challengerName: userName,
        targetId,
        targetName,
        bet,
        challengerPick: null,
        phase: "challenger",
        message: sentMsg,
        phaseEmbed,
        rpsRow: () => rpsRow(`rps_pvp_${userId}_${targetId}`),
        timeoutHandle: makeTimeout(userName),
      });
    }
  }

  // ── !race ─────────────────────────────────────────────────
  else if (cmd === "race") {
    const channelId = msg.channel.id;
    if (activeRaces.has(channelId)) return msg.reply("❌ A race is already running in this channel!");
    const participants = new Map();
    participants.set(userId, userName);
    const race = { phase: "joining", participants, channelId, word: null, startTime: null, finished: new Set() };
    activeRaces.set(channelId, race);
    const embed = new EmbedBuilder()
      .setTitle("⌨️  Type Race — Joining Phase")
      .setDescription(`**${userName}** started a type race!\nType \`!join\` to enter — race starts in **30 seconds**!`)
      .setColor(0x3498db)
      .setFooter({ text: "Winner gets +25 🐱 kittens · Losers lose 25 🐱 · Misspelling = instant loss" });
    await msg.channel.send({ embeds: [embed] });
    setTimeout(async () => {
      const currentRace = activeRaces.get(channelId);
      if (!currentRace || currentRace.phase !== "joining") return;
      if (currentRace.participants.size < 2) {
        activeRaces.delete(channelId);
        return msg.channel.send("❌ Not enough players joined — race cancelled! (Need at least 2)");
      }
      const word = getRaceWord();
      currentRace.word = word;
      currentRace.phase = "racing";
      currentRace.startTime = Date.now();
      const playerList = [...currentRace.participants.values()].map((n) => `• ${n}`).join("\n");
      const raceEmbed = new EmbedBuilder()
        .setTitle("⌨️  Type Race — GO!")
        .setDescription(`**Type this word as fast as you can:**\n\n# \`${word}\`\n\n**Players:**\n${playerList}`)
        .setColor(0xe74c3c)
        .setFooter({ text: "First to type it correctly wins! Misspelling = instant loss!" });
      await msg.channel.send({ embeds: [raceEmbed] });
    }, 30000);
  }

  // ── !join ─────────────────────────────────────────────────
  else if (cmd === "join") {
    const channelId = msg.channel.id;

    const trivia = activeTrivias.get(channelId);
    if (trivia && trivia.phase === "joining") {
      if (trivia.participants.has(userId)) return msg.reply("❌ You're already in the trivia!");
      const balance = getKittens(userId);
      if (balance < trivia.bet) return msg.reply(`❌ You need **${trivia.bet.toLocaleString()} 🐱 kittens** to join!`);
      ensureUser(userId, userName);
      removeKittens(userId, trivia.bet);
      trivia.participants.set(userId, userName);
      await msg.reply(`✅ **${userName}** joined the trivia! (${trivia.participants.size} players so far)`);
      return;
    }

    const race = activeRaces.get(channelId);
    if (race && race.phase === "joining") {
      if (race.participants.has(userId)) return msg.reply("❌ You're already in the race!");
      race.participants.set(userId, userName);
      await msg.reply(`✅ **${userName}** joined the race! (${race.participants.size} players so far)`);
      return;
    }
    const pendingGames = msg.client.pendingGames;
    const pending = pendingGames?.get(channelId);
    if (pending?.type === "open") {
      if (Date.now() > pending.expiresAt) {
        pendingGames.delete(channelId);
        return msg.reply("⏰ That table already closed.");
      }
      if (pending.participants.has(userId)) return msg.reply("❌ You're already at the table!");
      const balance = getKittens(userId);
      if (balance < pending.bet) return msg.reply(`❌ You need **${pending.bet} 🐱 kittens** to join — you only have **${balance}**!`);
      pending.participants.set(userId, userName);
      await msg.reply(`✅ **${userName}** joined the table! (${pending.participants.size} players so far)`);
      return;
    }
    return msg.reply("❌ Nothing to join right now. Start a race with `!race` or an open table with `!blackjack open <bet>`!");
  }

  // ── !report ───────────────────────────────────────────────
  else if (cmd === "report") {
    const target = msg.mentions.users.first();
    if (!target) return msg.reply("❌ Usage: `!report @user`");
    if (target.id === userId) return msg.reply("❌ You can't report yourself.");
    if (target.bot) return msg.reply("❌ You can't report a bot.");

    // Daily limit: one report filed per reporter per day
    const today = todayStr();
    if (reporterDailyUsage.get(userId) === today) {
      return msg.reply("❌ You've already filed a report today. You can report again tomorrow.");
    }

    const now = Date.now();
    let entry = spamReports.get(target.id);

    // If an existing report window has expired, reset it
    if (entry && now - entry.windowStart > REPORT_WINDOW_MS) {
      entry = null;
      spamReports.delete(target.id);
    }

    if (!entry) {
      entry = { reporters: new Set(), windowStart: now };
      spamReports.set(target.id, entry);
    }

    if (entry.reporters.has(userId)) return msg.reply("❌ You've already reported this user.");
    entry.reporters.add(userId);
    reporterDailyUsage.set(userId, today);

    const targetName = msg.guild?.members.cache.get(target.id)?.displayName ?? target.username;
    if (entry.reporters.size >= 2) {
      ensureUser(target.id, targetName);
      applySpamConsequence(target.id, targetName, msg.channel);
    } else {
      const windowMinutes = Math.round(REPORT_WINDOW_MS / 60000);
      await msg.reply(`✅ **${targetName}** has been reported. **1/2** reports — one more report within **${windowMinutes} minutes** will trigger a penalty.`);
    }
  }

  // ── !editscore ────────────────────────────────────────────
  else if (cmd === "editscore") {
    const password = args[0];
    const targetUser = msg.mentions.users.first();
    const newPoints = parseInt(args[2]);
    if (!password || password !== ADMIN_PASSWORD) return msg.reply("❌ Invalid password.");
    if (!targetUser) return msg.reply("❌ Usage: `!editscore <password> @user <points>`");
    if (isNaN(newPoints) || newPoints < 0) return msg.reply("❌ Please provide a valid point value.");
    ensureUser(targetUser.id, targetUser.username);
    const oldPoints = db.users[targetUser.id].points;
    db.users[targetUser.id].points = newPoints;
    saveData(db);
    await msg.reply(`✅ Updated **${targetUser.username}**'s weekly points from **${oldPoints}** to **${newPoints}** 💩`);
    await msg.delete().catch(() => {});
  }

  // ── !editkittens ──────────────────────────────────────────
  else if (cmd === "editkittens") {
    const password = args[0];
    const targetUser = msg.mentions.users.first();
    const newAmount = parseInt(args[2]);
    if (!password || password !== ADMIN_PASSWORD) return msg.reply("❌ Invalid password.");
    if (!targetUser) return msg.reply("❌ Usage: `!editkittens <password> @user <amount>`");
    if (isNaN(newAmount) || newAmount < 0) return msg.reply("❌ Please provide a valid kitten amount.");
    ensureUser(targetUser.id, targetUser.username);
    const oldKittens = db.users[targetUser.id].kittens ?? 0;
    db.users[targetUser.id].kittens = newAmount;
    saveData(db);
    await msg.reply(`✅ Updated **${targetUser.username}**'s kittens from **${oldKittens}** to **${newAmount}** 🐱`);
    await msg.delete().catch(() => {});
  }

  // ── !poophelp ─────────────────────────────────────────────
  else if (cmd === "poophelp") {
    const embed = new EmbedBuilder()
      .setTitle("💩  Ultimate Shitter Bot — Commands")
      .addFields(
        { name: "`!poop`", value: "Log a poop and earn a point" },
        { name: "`!leaderboard` / `!lb`", value: "See the weekly leaderboard" },
        { name: "`!alltime` / `!at`", value: "All-time poop hall of fame — never resets" },
        { name: "`!mystats`", value: "Your personal stats — weekly and all-time" },
        { name: "`!poopfacts`", value: "Get a random poop fact" },
        { name: "`!donate @user <amount>`", value: "Donate kittens to another user" },
        { name: "`!daily`", value: "Claim a free 150–250 🐱 kittens once per day" },
        { name: "`!cops`", value: "Ping all server admins" },
        { name: "`!report @user`", value: "Report a user for spam — 2 reports triggers a 300 🐱 penalty + 2 min freeze" },
        { name: "⚡ Quick pooper bonus", value: "Poop within 2 hours of your last for +1.5 points!" },
        { name: "🐱 Earning kittens", value: "5 kittens per message · 5 kittens per minute in VC" },
        { name: "👑 The Ultimate Shitter", value: "Awarded to the weekly #1 every Monday." },
        { name: "`!farthelp`", value: "See all fart bot commands 💨" },
        { name: "`!gamblinghelp` / `!gh`", value: "See all casino & kitten commands 🎰" },
      )
      .setColor(0x8b4513)
      .setFooter({ text: "Leaderboard resets every Monday at midnight" });
    await msg.channel.send({ embeds: [embed] });
  }

  else if (cmd === "gamblinghelp" || cmd === "gh") {
    const embed = new EmbedBuilder()
      .setTitle("🎰  Ultimate Shitter Bot — Casino & Kittens")
      .addFields(
        { name: "`!kittens` / `!bal`", value: "Check your kitten balance (or `!kittens @user`)" },
        { name: "`!kittenboard` / `!kb`", value: "Kitten rich list" },
        { name: "`!wyr`", value: "Post a 'Would You Rather' poll — vote with buttons, results revealed after 30 seconds" },
        { name: "`!race`", value: "Start a type race — 30s to join with `!join`" },
        { name: "`!blackjack [open / @users] <bet>`", value: "Play vs the dealer · challenge others directly · or open a public table (anyone `!join`s within 30s) — Hit / Stand buttons appear during your turn" },
        { name: "`!slots <bet>`", value: "Spin the slot machine — match symbols to win big, 💩💩💩 pays 50×" },
        { name: "`!trivia <bet>`", value: "Start a trivia round — 20s for others to `!join`, then a poop-flavored question drops for all players · Correct = 2× bet · Wrong or timeout = lose bet" },
        { name: "`!rps <bet>` / `!rps @user <bet>`", value: "Play Rock Paper Scissors vs the house (win doubles your bet, tie refunds it) — or challenge someone 1v1 (winner takes the other's bet)" },
        { name: "`!rob [@user] <amount> [rps]`", value: "Rob a random user or target a specific one — dice roll (default) or rps · win 1.5× stake · 2 robs/day · 30s to respond" },
        { name: "`!bomb @user`", value: "Throw a bomb at someone — 20% chance it goes off and obliterates 100 🐱 kittens · deflects to a random server member each miss until it hits" },
        { name: "`!beg`", value: "Beg the house for kittens — 40% chance of 1–200 🐱, 100% chance of humiliation" },
        { name: "`!jackpot` / `!megajackpot`", value: "Buy a jackpot ticket (**10 🐱**, 1 in 50) or mega jackpot ticket (**50 🐱**, 1 in 100) — winner takes the whole pot · `!jackpot info` / `!megajackpot info` to see current pots" },
        { name: "`!crash <bet>`", value: "Bet kittens on a growing multiplier — cash out before it crashes! Others can join with the same bet. (3% house edge, max 2,000 🐱)" },
        { name: "`!heist <bet>`", value: "Recruit a crew and rob a rich user — 10% + 10% per member success chance (max 80%). Richer targets are more likely to be chosen. Others join with the same command. (max 1,000 🐱 ante)" },
        { name: "`!russian <bet>`", value: "Russian roulette — 1 in 6 chance the gun fires on you. Survivors split the dead players' bets. Type to join others. (max 1,500 🐱)" },
        { name: "`!hangman [bet]`", value: "Start a hangman game — anyone guesses with `!guess <letter>` or `!guess <word>`. 6 wrong guesses = game over. Bet up to 500 🐱 (starter wins 2× if solved, loses if hanged)" },
        { name: "`!horse` / `!horse <1–5> <bet>`", value: "Horse racing! View the 5 horses and their odds, then bet with `!horse <number> <amount>`. Others can join the 30-second betting window. Winner takes bet × odds. (max 500 🐱 per bet)" },
      )
      .setColor(0xf1c40f)
      .setFooter({ text: "5% daily tax at 2 PM PST — poorest players have the best odds of winning the pot" });
    await msg.channel.send({ embeds: [embed] });
  }
  // ── !beg ──────────────────────────────────────────────────
  else if (cmd === "beg") {
    ensureUser(userId, userName);
    const kittensRole = msg.guild?.roles.cache.find(r => r.name.toLowerCase() === "kittens");
    const roleMention = kittensRole ? `<@&${kittensRole.id}> ` : "";
    const user = db.users[userId];
    const today = todayStr();
    if (user.begDate !== today) {
      user.begDate = today;
      user.begCount = 0;
    }
    if (user.begCount >= 5) {
      removeKittens(userId, 300);
      await msg.channel.send(
        `${roleMention}🚨 **AGAIN?!** — <@${userId}>\n\n` +
        `you've begged **5 times today** and you're STILL here?? the audacity.\n` +
        `i'm taking **300 🐱 kittens** from you. maybe that'll teach you some dignity.`
      );
      return;
    }
    user.begCount = (user.begCount ?? 0) + 1;
    saveData(db);
    const tauntLines = [
      `look who's begging for my help`,
      `absolutely pathetic — someone's desperate for kittens`,
      `on your knees already? wow`,
      `aw, begging like a little kitten yourself`,
      `you really crawled in here to beg?`,
      `can't even earn your own kittens?`,
      `the audacity to come crawling to ME`,
      `begging? in this economy?`,
      `so broke you had to beg the house`,
      `look at this little scrounger`,
      `this is genuinely embarrassing to watch`,
      `i almost feel bad. almost.`,
    ];
    const taunt = tauntLines[Math.floor(Math.random() * tauntLines.length)];
    if (Math.random() < 0.4) {
      const gift = Math.floor(Math.random() * 200) + 1;
      addKittens(userId, gift);
      await msg.channel.send(
        `${roleMention}😂 **${taunt}** — <@${userId}>\n\n` +
        `...fine. here's **${gift} 🐱 kittens**. don't make it weird.`
      );
    } else {
      await msg.channel.send(
        `${roleMention}😂 **${taunt}** — <@${userId}>\n\n` +
        `the house says **no**. get a job.`
      );
    }
  }

  // ── !slots ────────────────────────────────────────────────
  else if (cmd === "slots") {
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) return msg.reply("Usage: `!slots <bet>`");
    const userKittens = getKittens(userId);
    if (userKittens < bet) return msg.reply(`❌ You only have **${userKittens.toLocaleString()} 🐱 kittens**!`);

    removeKittens(userId, bet);
    const reels = [spinReel(), spinReel(), spinReel()];
    const { multiplier } = getSlotsResult(reels);
    if (multiplier > 0) addKittens(userId, bet * multiplier);

    const reelDisplay = reels.join("  ");
    let title, description, color;
    if (multiplier >= 50) {
      title = "🎰  JACKPOT!!! 💩💩💩";
      description = `# ${reelDisplay}\n\n🏆 **HOLY SHIT!** You won **${(bet * multiplier).toLocaleString()} 🐱 kittens**! (${multiplier}x)`;
      color = 0xf1c40f;
    } else if (multiplier > 1) {
      title = "🎰  Winner!";
      description = `# ${reelDisplay}\n\n🎉 You won **${(bet * multiplier).toLocaleString()} 🐱 kittens**! (${multiplier}x)`;
      color = 0x2ecc71;
    } else if (multiplier === 1) {
      title = "🎰  So close...";
      description = `# ${reelDisplay}\n\n🤝 Rare pair — bet returned! (**${bet.toLocaleString()} 🐱**)`;
      color = 0x95a5a6;
    } else {
      title = "🎰  Slots";
      description = `# ${reelDisplay}\n\n😔 No match — lost **${bet.toLocaleString()} 🐱 kittens**.`;
      color = 0xe74c3c;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .addFields({ name: userName, value: `${getKittens(userId).toLocaleString()} 🐱`, inline: true })
      .setFooter({ text: "💩=50x · 🐱=15x · 💎=8x · ⭐=4x · 🍒/🔔=3x · 🍋=2x · Two 💩/🐱 = push" })
      .setTimestamp();
    await msg.channel.send({ embeds: [embed] });
  }

  // ── !trivia ───────────────────────────────────────────────
  else if (cmd === "trivia") {
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) return msg.reply("Usage: `!trivia <bet>`");
    if (bet > 500) return msg.reply("❌ The maximum trivia bet is **500 🐱 kittens**!");
    const userKittens = getKittens(userId);
    if (userKittens < bet) return msg.reply(`❌ You only have **${userKittens.toLocaleString()} 🐱 kittens**!`);
    if (activeTrivias.has(msg.channel.id)) return msg.reply("❌ A trivia question is already active in this channel!");

    const TRIVIA_WINDOW_MS = 60 * 60 * 1000;
    const triviaWindowStart = db.users[userId]?.lastTriviaWindowStart ?? 0;
    const triviasThisHour = (Date.now() - triviaWindowStart < TRIVIA_WINDOW_MS) ? (db.users[userId]?.triviasThisHour ?? 0) : 0;
    if (triviasThisHour >= TRIVIA_HOURLY_LIMIT) {
      const secsLeft = Math.ceil((TRIVIA_WINDOW_MS - (Date.now() - triviaWindowStart)) / 1000);
      const minsLeft = Math.ceil(secsLeft / 60);
      return msg.reply(`❌ You've started too many trivia games! Try again in **${minsLeft} minute${minsLeft !== 1 ? "s" : ""}**.`);
    }

    ensureUser(userId, userName);
    if (Date.now() - (db.users[userId].lastTriviaWindowStart ?? 0) >= TRIVIA_WINDOW_MS) {
      db.users[userId].lastTriviaWindowStart = Date.now();
      db.users[userId].triviasThisHour = 0;
    }
    db.users[userId].triviasThisHour = (db.users[userId].triviasThisHour ?? 0) + 1;
    saveData(db);
    removeKittens(userId, bet);

    const channelId = msg.channel.id;
    const participants = new Map([[userId, userName]]);
    const trivia = {
      phase: "joining",
      bet,
      participants,
      answers: new Map(),
      question: null,
      letters: ["A", "B", "C", "D"],
      timeout: null,
      questionMsg: null,
      channelId,
    };
    activeTrivias.set(channelId, trivia);

    const joinEmbed = new EmbedBuilder()
      .setTitle("🧠  Trivia — Joining Phase")
      .setDescription(`**${userName}** started a trivia round!\nType \`!join\` to enter — question drops in **20 seconds**!\n\nBet: **${bet.toLocaleString()} 🐱 kittens** · Correct = 2× bet`)
      .setColor(0x9b59b6)
      .setFooter({ text: "All participants must bet the same amount" });
    await msg.channel.send({ embeds: [joinEmbed] });

    trivia.timeout = setTimeout(async () => {
      const current = activeTrivias.get(channelId);
      if (!current || current.phase !== "joining") return;

      const q = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
      current.question = q;
      current.phase = "answering";

      const optionsText = q.options.map((opt, i) => `**${current.letters[i]}.** ${opt}`).join("\n");
      const playerList = [...current.participants.values()].map(n => `• ${n}`).join("\n");
      const row = new ActionRowBuilder().addComponents(
        current.letters.map((letter, i) =>
          new ButtonBuilder()
            .setCustomId(`trivia_${channelId}_${i}`)
            .setLabel(letter)
            .setStyle(ButtonStyle.Primary)
        )
      );

      const questionEmbed = new EmbedBuilder()
        .setTitle("🧠  Are You Smarter Than a 5th Grader?")
        .setDescription(`**${q.question}**\n\n${optionsText}`)
        .setColor(0x9b59b6)
        .addFields({ name: "Players", value: playerList })
        .setFooter({ text: "30 seconds to answer · Correct = 2× bet · Wrong or timeout = lose bet" })
        .setTimestamp();

      current.questionMsg = await msg.channel.send({ embeds: [questionEmbed], components: [row] });

      current.timeout = setTimeout(async () => {
        activeTrivias.delete(channelId);
        await revealTrivia(current);
      }, 30_000);
    }, 20_000);
  }

  // ── !jackpot ────────────────────────────────────────────────
  else if (cmd === "jackpot") {
    ensureUser(userId, userName);
    if (!db.jackpot) db.jackpot = { pot: 0, ticketCount: 0, prize: null };

    const sub = args[0]?.toLowerCase();

    if (sub === "setprize") {
      if (!msg.member?.permissions.has("Administrator")) return msg.reply("❌ Admins only.");
      const prize = args.slice(1).join(" ");
      if (!prize) return msg.reply("Usage: `!jackpot setprize <code>`");
      db.jackpot.prize = prize;
      saveData(db);
      return msg.reply("✅ Jackpot prize set!");
    }

    if (sub === "info" || sub === undefined) {
      if (sub === "info" || getKittens(userId) < 10) {
        const embed = new EmbedBuilder()
          .setTitle("🎟️  Jackpot — Current Pot")
          .setDescription(`**${(db.jackpot.pot).toLocaleString()} 🐱 kittens** in the pot\n**${db.jackpot.ticketCount.toLocaleString()}** tickets sold so far\n\nCost: **10 🐱** per ticket · Odds: **1 in 50** (2%)`)
          .setColor(0xf1c40f)
          .setFooter({ text: "Use !jackpot to buy a ticket!" });
        return msg.channel.send({ embeds: [embed] });
      }
    }

    if (sub !== undefined && sub !== "info") return msg.reply("Usage: `!jackpot` to buy a ticket · `!jackpot info` to see the pot");

    const TICKET_COST = 10;
    const userKittens = getKittens(userId);
    if (userKittens < TICKET_COST) return msg.reply(`❌ You need **${TICKET_COST} 🐱 kittens** for a ticket — you only have **${userKittens.toLocaleString()} 🐱**.`);

    const today = todayStr();
    const jackpotUser = db.users[userId];
    if (jackpotUser.lastJackpotDate !== today) { jackpotUser.jackpotToday = 0; jackpotUser.lastJackpotDate = today; }
    const jackpotUsed = jackpotUser.jackpotToday ?? 0;
    if (jackpotUsed >= JACKPOT_DAILY_LIMIT) {
      return msg.reply(`❌ You've bought **${JACKPOT_DAILY_LIMIT} jackpot tickets** today already. Come back tomorrow!`);
    }
    jackpotUser.jackpotToday = jackpotUsed + 1;

    removeKittens(userId, TICKET_COST);
    db.jackpot.pot += TICKET_COST;
    db.jackpot.ticketCount += 1;
    saveData(db);

    if (Math.random() < 1 / 50) {
      const prize = db.jackpot.prize;
      const pot = db.jackpot.pot;
      addKittens(userId, pot);
      db.jackpot.pot = 0;
      db.jackpot.prize = null;
      saveData(db);

      let desc = `🏆 **${userName}** bought a ticket and **WON THE JACKPOT!!!**\n\n💰 **${pot.toLocaleString()} 🐱 kittens** added to your balance!`;
      if (prize) desc += `\n\n🎁 **Prize:** \`${prize}\``;
      desc += "\n\nThe pot has been reset.";

      const embed = new EmbedBuilder()
        .setTitle("🎟️  JACKPOT WON!!! 🎉🎉🎉")
        .setDescription(desc)
        .setColor(0xf1c40f)
        .addFields({ name: userName, value: `${getKittens(userId).toLocaleString()} 🐱`, inline: true })
        .setTimestamp();
      await msg.channel.send({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle("🎟️  No luck this time...")
        .setDescription(`<@${userId}> bought a ticket — nothing this time.\n\n🏦 **Pot: ${db.jackpot.pot.toLocaleString()} 🐱** · Tickets sold: **${db.jackpot.ticketCount.toLocaleString()}**`)
        .setColor(0x95a5a6)
        .addFields({ name: userName, value: `${getKittens(userId).toLocaleString()} 🐱`, inline: true })
        .setFooter({ text: `1 in 50 chance to win · ${JACKPOT_DAILY_LIMIT - jackpotUser.jackpotToday} ticket${JACKPOT_DAILY_LIMIT - jackpotUser.jackpotToday === 1 ? "" : "s"} left today · !jackpot to try again` })
        .setTimestamp();
      await msg.channel.send({ embeds: [embed] });
    }
  }

  // ── !megajackpot ────────────────────────────────────────────
  else if (cmd === "megajackpot") {
    ensureUser(userId, userName);
    if (!db.megaJackpot) db.megaJackpot = { pot: 0, ticketCount: 0, prize: null };

    const sub = args[0]?.toLowerCase();

    if (sub === "setprize") {
      if (!msg.member?.permissions.has("Administrator")) return msg.reply("❌ Admins only.");
      const prize = args.slice(1).join(" ");
      if (!prize) return msg.reply("Usage: `!megajackpot setprize <code>`");
      db.megaJackpot.prize = prize;
      saveData(db);
      return msg.reply("✅ Mega Jackpot prize set!");
    }

    if (sub === "info" || sub === undefined) {
      if (sub === "info" || getKittens(userId) < 50) {
        const embed = new EmbedBuilder()
          .setTitle("💎  Mega Jackpot — Current Pot")
          .setDescription(`**${(db.megaJackpot.pot).toLocaleString()} 🐱 kittens** in the mega pot\n**${db.megaJackpot.ticketCount.toLocaleString()}** tickets sold so far\n\nCost: **50 🐱** per ticket · Odds: **1 in 100** (1%)`)
          .setColor(0x9b59b6)
          .setFooter({ text: "Use !megajackpot to buy a ticket!" });
        return msg.channel.send({ embeds: [embed] });
      }
    }

    if (sub !== undefined && sub !== "info") return msg.reply("Usage: `!megajackpot` to buy a ticket · `!megajackpot info` to see the pot");

    const TICKET_COST = 50;
    const userKittens = getKittens(userId);
    if (userKittens < TICKET_COST) return msg.reply(`❌ You need **${TICKET_COST} 🐱 kittens** for a mega ticket — you only have **${userKittens.toLocaleString()} 🐱**.`);

    const today = todayStr();
    const megaUser = db.users[userId];
    if (megaUser.lastMegaJackpotDate !== today) { megaUser.megaJackpotToday = 0; megaUser.lastMegaJackpotDate = today; }
    const megaUsed = megaUser.megaJackpotToday ?? 0;
    if (megaUsed >= JACKPOT_DAILY_LIMIT) {
      return msg.reply(`❌ You've bought **${JACKPOT_DAILY_LIMIT} mega jackpot tickets** today already. Come back tomorrow!`);
    }
    megaUser.megaJackpotToday = megaUsed + 1;

    removeKittens(userId, TICKET_COST);
    db.megaJackpot.pot += TICKET_COST;
    db.megaJackpot.ticketCount += 1;
    saveData(db);

    if (Math.random() < 1 / 100) {
      const prize = db.megaJackpot.prize;
      const pot = db.megaJackpot.pot;
      addKittens(userId, pot);
      db.megaJackpot.pot = 0;
      db.megaJackpot.prize = null;
      saveData(db);

      let desc = `💎 **${userName}** bought a mega ticket and **WON THE MEGA JACKPOT!!!**\n\n💰 **${pot.toLocaleString()} 🐱 kittens** added to your balance!`;
      if (prize) desc += `\n\n🎁 **Prize:** \`${prize}\``;
      desc += "\n\nThe mega pot has been reset.";

      const embed = new EmbedBuilder()
        .setTitle("💎  MEGA JACKPOT WON!!! 🔥🔥🔥")
        .setDescription(desc)
        .setColor(0x9b59b6)
        .addFields({ name: userName, value: `${getKittens(userId).toLocaleString()} 🐱`, inline: true })
        .setTimestamp();
      await msg.channel.send({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle("💎  No luck this time...")
        .setDescription(`<@${userId}> bought a mega ticket — nothing this time.\n\n🏦 **Mega pot: ${db.megaJackpot.pot.toLocaleString()} 🐱** · Tickets sold: **${db.megaJackpot.ticketCount.toLocaleString()}**`)
        .setColor(0x95a5a6)
        .addFields({ name: userName, value: `${getKittens(userId).toLocaleString()} 🐱`, inline: true })
        .setFooter({ text: `1 in 100 chance to win · ${JACKPOT_DAILY_LIMIT - megaUser.megaJackpotToday} ticket${JACKPOT_DAILY_LIMIT - megaUser.megaJackpotToday === 1 ? "" : "s"} left today · !megajackpot to try again` })
        .setTimestamp();
      await msg.channel.send({ embeds: [embed] });
    }
  }

  // ── !crash ────────────────────────────────────────────────
  else if (cmd === "crash") {
    ensureUser(userId, userName);
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) return msg.reply("Usage: `!crash <bet>`");
    if (bet > 2000) return msg.reply("❌ Max crash bet is **2,000 🐱 kittens**!");

    const existing = activeCrashes.get(msg.channel.id);

    if (existing && existing.phase === "joining") {
      if (existing.bets.has(userId)) return msg.reply("❌ You're already in this crash game!");
      if (bet !== existing.betAmount) return msg.reply(`❌ This game's bet is **${existing.betAmount.toLocaleString()} 🐱**!`);
      const bal = getKittens(userId);
      if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);
      removeKittens(userId, bet);
      existing.bets.set(userId, { name: userName, bet, cashedAt: null });
      return msg.reply(`✅ **${userName}** joined the crash for **${bet.toLocaleString()} 🐱 kittens**!`);
    }

    if (existing) return msg.reply("❌ A crash game is already in the air in this channel!");

    const bal = getKittens(userId);
    if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);

    removeKittens(userId, bet);
    const crashPoint = generateCrashPoint();
    const crash = {
      phase: "joining",
      betAmount: bet,
      crashPoint,
      bets: new Map([[userId, { name: userName, bet, cashedAt: null }]]),
      multiplier: 1.00,
      interval: null,
      message: null,
    };
    activeCrashes.set(msg.channel.id, crash);

    const cashOutRow = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`crash_cashout_${msg.channel.id}`).setLabel("💰 Cash Out").setStyle(ButtonStyle.Success)
    );

    const sentMsg = await msg.channel.send({
      content: `📈 **Crash starting!** Bet: **${bet.toLocaleString()} 🐱** — type \`!crash ${bet}\` to join! Launching in **15 seconds**...`,
      embeds: [buildCrashEmbed(crash)],
    });
    crash.message = sentMsg;

    setTimeout(async () => {
      const c = activeCrashes.get(msg.channel.id);
      if (!c || c.phase !== "joining") return;
      c.phase = "flying";

      await sentMsg.edit({
        content: "📈 **Crash is live! Cash out before it crashes!**",
        embeds: [buildCrashEmbed(c)],
        components: [cashOutRow()],
      }).catch(() => {});

      c.interval = setInterval(async () => {
        const game = activeCrashes.get(msg.channel.id);
        if (!game || game.phase !== "flying") { clearInterval(c.interval); return; }

        game.multiplier = parseFloat((game.multiplier * 1.06).toFixed(2));

        if (game.multiplier >= game.crashPoint) {
          game.phase = "crashed";
          clearInterval(game.interval);
          activeCrashes.delete(msg.channel.id);
          await sentMsg.edit({ content: null, embeds: [buildCrashEmbed(game, true)], components: [] }).catch(() => {});
        } else {
          await sentMsg.edit({ embeds: [buildCrashEmbed(game)], components: [cashOutRow()] }).catch(() => {});
        }
      }, 2000);
    }, 15_000);
  }

  // ── !wyr ──────────────────────────────────────────────────
  else if (cmd === "wyr") {
    if (activeWyrs.has(msg.channel.id)) return msg.reply("❌ A WYR question is already active in this channel!");

    const q = WYR_QUESTIONS[Math.floor(Math.random() * WYR_QUESTIONS.length)];
    const votes = { a: new Set(), b: new Set() };

    const buildWyrEmbed = (revealed = false) => {
      const aCount = votes.a.size;
      const bCount = votes.b.size;
      const total = aCount + bCount;
      let desc = `**🅰️  ${q.a}**\n\nvs.\n\n**🅱️  ${q.b}**`;
      if (revealed && total > 0) {
        const aBar = Math.round((aCount / total) * 10);
        const bBar = Math.round((bCount / total) * 10);
        desc += `\n\n**Results:**\n🅰️ ${"█".repeat(aBar)}${"░".repeat(10 - aBar)} ${aCount} vote${aCount !== 1 ? "s" : ""} (${Math.round((aCount / total) * 100)}%)\n🅱️ ${"█".repeat(bBar)}${"░".repeat(10 - bBar)} ${bCount} vote${bCount !== 1 ? "s" : ""} (${Math.round((bCount / total) * 100)}%)`;
      } else if (revealed) {
        desc += "\n\n*No votes were cast!*";
      }
      return new EmbedBuilder()
        .setTitle("🤔  Would You Rather?")
        .setDescription(desc)
        .setColor(revealed ? 0xf1c40f : 0x9b59b6)
        .setFooter({ text: revealed ? `${total} total vote${total !== 1 ? "s" : ""}` : "Vote below! Results in 30 seconds." })
        .setTimestamp();
    };

    const wyrRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`wyr_a_${msg.channel.id}`).setLabel("🅰️ Option A").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`wyr_b_${msg.channel.id}`).setLabel("🅱️ Option B").setStyle(ButtonStyle.Danger),
    );

    const sentMsg = await msg.channel.send({ embeds: [buildWyrEmbed()], components: [wyrRow] });
    activeWyrs.set(msg.channel.id, { q, votes, buildWyrEmbed });

    setTimeout(async () => {
      activeWyrs.delete(msg.channel.id);
      await sentMsg.edit({ embeds: [buildWyrEmbed(true)], components: [] }).catch(() => {});
    }, 30_000);
  }

  // ── !heist ────────────────────────────────────────────────
  else if (cmd === "heist") {
    ensureUser(userId, userName);
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) return msg.reply("Usage: `!heist <bet>`");
    if (bet > 1000) return msg.reply("❌ Max heist ante is **1,000 🐱 kittens**!");

    const existing = activeHeists.get(msg.channel.id);

    if (existing && existing.phase === "joining") {
      if (existing.crew.has(userId)) return msg.reply("❌ You're already in this heist!");
      if (bet !== existing.betAmount) return msg.reply(`❌ This heist's ante is **${existing.betAmount.toLocaleString()} 🐱**!`);
      const bal = getKittens(userId);
      if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);
      removeKittens(userId, bet);
      existing.crew.set(userId, userName);
      return msg.reply(`✅ **${userName}** joined the heist! Crew: **${existing.crew.size}** (success chance: ${Math.round(Math.min(0.80, 0.10 + existing.crew.size * 0.10) * 100)}%)`);
    }

    if (existing) return msg.reply("❌ A heist is already being planned in this channel!");

    const bal = getKittens(userId);
    if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);

    removeKittens(userId, bet);
    activeHeists.set(msg.channel.id, { phase: "joining", betAmount: bet, crew: new Map([[userId, userName]]) });

    const embed = new EmbedBuilder()
      .setTitle("🦹  Heist — Recruiting Crew")
      .setDescription(`**${userName}** is planning a heist!\nAnte: **${bet.toLocaleString()} 🐱 kittens**\n\nType \`!heist ${bet}\` to join! Launching in **20 seconds**.\n\n*More crew = better odds (10% + 10% per member, max 80%)*`)
      .setColor(0xe67e22)
      .setFooter({ text: "Target is chosen at launch based on crew size" })
      .setTimestamp();
    await msg.channel.send({ embeds: [embed] });

    setTimeout(async () => {
      const h = activeHeists.get(msg.channel.id);
      if (!h || h.phase !== "joining") return;
      h.phase = "complete";
      activeHeists.delete(msg.channel.id);

      const crewSize = h.crew.size;
      const successChance = Math.min(0.80, 0.10 + crewSize * 0.10);
      const totalPot = crewSize * h.betAmount;
      const crewList = [...h.crew.values()].map(n => `• ${n}`).join("\n");

      const eligible = Object.entries(db.users).filter(
        ([id, u]) => !h.crew.has(id) && (u.kittens ?? 0) >= totalPot
      );

      if (eligible.length === 0) {
        for (const [id] of h.crew) addKittens(id, h.betAmount);
        return msg.channel.send({
          embeds: [new EmbedBuilder()
            .setTitle("🦹  Heist — Aborted")
            .setDescription(`No target found with **${totalPot.toLocaleString()} 🐱**. Antes refunded.\n\n**Crew:**\n${crewList}`)
            .setColor(0x95a5a6).setTimestamp()],
        });
      }

      const totalWeight = eligible.reduce((sum, [, u]) => sum + (u.kittens ?? 0), 0);
      let pick = Math.random() * totalWeight;
      const [targetId, targetUser] = eligible.find(([, u]) => (pick -= u.kittens ?? 0) <= 0) ?? eligible[eligible.length - 1];
      const targetName = msg.guild?.members.cache.get(targetId)?.displayName ?? targetUser.name ?? `User ${targetId}`;
      const success = Math.random() < successChance;

      if (success) {
        removeKittens(targetId, totalPot);
        const share = Math.floor(totalPot / crewSize);
        for (const [id] of h.crew) addKittens(id, h.betAmount + share);
        await msg.channel.send({
          embeds: [new EmbedBuilder()
            .setTitle("🦹  Heist — SUCCESS! 💰")
            .setDescription(
              `The crew pulled it off! Robbed **${targetName}** for **${totalPot.toLocaleString()} 🐱**!\n` +
              `Each crew member nets **+${share.toLocaleString()} 🐱** profit!\n\n**Crew (${crewSize}):**\n${crewList}`
            )
            .addFields({ name: targetName, value: `${getKittens(targetId).toLocaleString()} 🐱 remaining`, inline: true })
            .setColor(0x2ecc71).setFooter({ text: `Success chance was ${Math.round(successChance * 100)}%` }).setTimestamp()],
        });
      } else {
        await msg.channel.send({
          embeds: [new EmbedBuilder()
            .setTitle("🦹  Heist — BUSTED! 🚔")
            .setDescription(
              `The crew got caught! **${targetName}** was tipped off.\n` +
              `All **${totalPot.toLocaleString()} 🐱** in antes are lost.\n\n**Crew (${crewSize}):**\n${crewList}`
            )
            .setColor(0xe74c3c).setFooter({ text: `Success chance was ${Math.round(successChance * 100)}% — better luck next time` }).setTimestamp()],
        });
      }
    }, 20_000);
  }

  // ── !russian ──────────────────────────────────────────────
  else if (cmd === "russian") {
    ensureUser(userId, userName);
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) return msg.reply("Usage: `!russian <bet>`");
    if (bet > 1500) return msg.reply("❌ Max Russian roulette bet is **1,500 🐱 kittens**!");

    const existing = activeRussians.get(msg.channel.id);

    if (existing && existing.phase === "joining") {
      if (existing.players.has(userId)) return msg.reply("❌ You're already in this round!");
      if (bet !== existing.betAmount) return msg.reply(`❌ This round's bet is **${existing.betAmount.toLocaleString()} 🐱**!`);
      const bal = getKittens(userId);
      if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);
      removeKittens(userId, bet);
      existing.players.set(userId, userName);
      return msg.reply(`🔫 **${userName}** picks up the gun... (${existing.players.size} in the circle)`);
    }

    if (existing) return msg.reply("❌ A round is already loading in this channel!");

    const bal = getKittens(userId);
    if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);

    removeKittens(userId, bet);
    activeRussians.set(msg.channel.id, { phase: "joining", betAmount: bet, players: new Map([[userId, userName]]) });

    await msg.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle("🔫  Russian Roulette — Loading the Chamber")
        .setDescription(
          `**${userName}** spins the cylinder...\nBet: **${bet.toLocaleString()} 🐱 kittens**\n\n` +
          `Type \`!russian ${bet}\` to join! Firing in **20 seconds**.\n\n` +
          `*1 in 6 chance the gun fires on you. Survivors split the dead players' bets.*`
        )
        .setColor(0xe74c3c).setFooter({ text: "Do you feel lucky?" }).setTimestamp()],
    });

    setTimeout(async () => {
      const r = activeRussians.get(msg.channel.id);
      if (!r || r.phase !== "joining") return;
      r.phase = "complete";
      activeRussians.delete(msg.channel.id);

      const dead = [], survived = [];
      for (const [id, name] of r.players) {
        (Math.random() < 1 / 6 ? dead : survived).push({ id, name });
      }

      const deadPool = dead.length * r.betAmount;
      const lines = [
        ...dead.map(({ name }) => `💀 **${name}** — *click* 💥 BANG — lost **${r.betAmount.toLocaleString()} 🐱**`),
        ...survived.map(({ name }) => `😅 **${name}** — *click* ... safe`),
      ];

      if (dead.length === 0) {
        for (const { id } of survived) addKittens(id, r.betAmount);
        return msg.channel.send({
          embeds: [new EmbedBuilder().setTitle("🔫  Russian Roulette — Everyone Survived!")
            .setDescription(`${lines.join("\n")}\n\nThe cylinder was empty! Everyone gets their bet back.`)
            .setColor(0x2ecc71).setTimestamp()],
        });
      }

      if (survived.length === 0) {
        return msg.channel.send({
          embeds: [new EmbedBuilder().setTitle("🔫  Russian Roulette — EVERYONE DIED 💀")
            .setDescription(`${lines.join("\n")}\n\n💀 The house takes **${deadPool.toLocaleString()} 🐱**. Nobody survives to collect.`)
            .setColor(0x2f3136).setTimestamp()],
        });
      }

      const share = Math.floor(deadPool / survived.length);
      for (const { id } of survived) addKittens(id, r.betAmount + share);
      await msg.channel.send({
        embeds: [new EmbedBuilder().setTitle("🔫  Russian Roulette — Results")
          .setDescription(
            `${lines.join("\n")}\n\n` +
            `💀 **${dead.length}** dead · 😅 **${survived.length}** survived\n` +
            `Each survivor collects **+${share.toLocaleString()} 🐱** from the fallen!`
          )
          .setColor(0xe74c3c).setTimestamp()],
      });
    }, 20_000);
  }

  // ── !daily ────────────────────────────────────────────────
  else if (cmd === "daily") {
    ensureUser(userId, userName);
    const today = todayStr();
    const user = db.users[userId];

    if (user.lastDailyDate === today) {
      return msg.reply("❌ You already claimed your daily reward today! Come back tomorrow.");
    }

    user.lastDailyDate = today;
    const reward = 150 + Math.floor(Math.random() * 101);
    addKittens(userId, reward);
    saveData(db);

    await msg.reply({
      embeds: [new EmbedBuilder()
        .setTitle("📅  Daily Reward")
        .setDescription(`**${userName}** claimed their daily!\n\n🐱 **+${reward.toLocaleString()} kittens** added to your balance.`)
        .addFields({ name: "Balance", value: `${getKittens(userId).toLocaleString()} 🐱`, inline: true })
        .setColor(0xf1c40f)
        .setFooter({ text: "Come back tomorrow for another!" })
        .setTimestamp()],
    });
  }

  // ── !hangman ───────────────────────────────────────────────
  else if (cmd === "hangman") {
    ensureUser(userId, userName);
    const channelId = msg.channel.id;
    if (activeHangman.has(channelId)) return msg.reply("❌ A hangman game is already running in this channel!");

    const bet = args[0] ? parseInt(args[0]) : 0;
    if (args[0] && (isNaN(bet) || bet <= 0)) return msg.reply("Usage: `!hangman [bet]`");
    if (bet > 500) return msg.reply("❌ Max hangman bet is **500 🐱 kittens**!");
    if (bet > 0) {
      const bal = getKittens(userId);
      if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);
      removeKittens(userId, bet);
    }

    const word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
    const game = { word, guessed: new Set(), wrongGuesses: [], bet, starterId: userId, starterName: userName, timeoutHandle: null };
    activeHangman.set(channelId, game);

    const header = bet > 0
      ? `🪦 **${userName}** started hangman with a **${bet.toLocaleString()} 🐱** bet! Solve it to win **${(bet * 2).toLocaleString()} 🐱**!`
      : `🪦 **${userName}** started a hangman game! Anyone can guess.`;
    await msg.channel.send({ content: header, embeds: [buildHangmanEmbed(game)] });

    game.timeoutHandle = setTimeout(async () => {
      if (!activeHangman.has(channelId)) return;
      activeHangman.delete(channelId);
      await msg.channel.send(`⏰ Hangman timed out! The word was **${word.toUpperCase()}**.${bet > 0 ? ` **${userName}** loses **${bet.toLocaleString()} 🐱 kittens**!` : ""}`);
    }, 5 * 60 * 1000);
  }

  // ── !guess ─────────────────────────────────────────────────
  else if (cmd === "guess") {
    const channelId = msg.channel.id;
    const game = activeHangman.get(channelId);
    if (!game) return;

    const input = args[0]?.toLowerCase();
    if (!input) return msg.reply("Usage: `!guess <letter>` or `!guess <word>`");

    if (input.length > 1) {
      // Full word guess
      if (input === game.word) {
        clearTimeout(game.timeoutHandle);
        activeHangman.delete(channelId);
        if (game.bet > 0) addKittens(game.starterId, game.bet * 2);
        return msg.channel.send({ embeds: [new EmbedBuilder()
          .setTitle("🎉  Hangman — Solved!")
          .setDescription(
            `**${userName}** guessed the word: **${game.word.toUpperCase()}**!\n` +
            (game.bet > 0 ? `\n**${game.starterName}** wins **${(game.bet * 2).toLocaleString()} 🐱 kittens**!` : "")
          )
          .setColor(0x2ecc71).setTimestamp()] });
      } else {
        game.wrongGuesses.push(`[${input}]`);
        if (game.wrongGuesses.length >= 6) {
          clearTimeout(game.timeoutHandle);
          activeHangman.delete(channelId);
          return msg.channel.send({ embeds: [new EmbedBuilder()
            .setTitle("💀  Hangman — Game Over!")
            .setDescription(
              `**${userName}** guessed \`${input}\` — wrong!\n\nThe word was **${game.word.toUpperCase()}**.` +
              (game.bet > 0 ? `\n\n**${game.starterName}** loses **${game.bet.toLocaleString()} 🐱 kittens** to the house!` : "")
            )
            .setColor(0xe74c3c).setTimestamp()] });
        }
        return msg.channel.send({ content: `❌ **${userName}** guessed \`${input}\` — wrong word!`, embeds: [buildHangmanEmbed(game)] });
      }
    }

    // Single letter
    if (!/^[a-z]$/.test(input)) return msg.reply("❌ Guess a single letter or the full word.");
    if (game.guessed.has(input)) return msg.reply(`❌ **${input.toUpperCase()}** was already guessed!`);
    game.guessed.add(input);

    if (game.word.includes(input)) {
      const solved = game.word.split("").every(ch => game.guessed.has(ch));
      if (solved) {
        clearTimeout(game.timeoutHandle);
        activeHangman.delete(channelId);
        if (game.bet > 0) addKittens(game.starterId, game.bet * 2);
        return msg.channel.send({ embeds: [new EmbedBuilder()
          .setTitle("🎉  Hangman — Solved!")
          .setDescription(
            `**${userName}** found the last letter **${input.toUpperCase()}** — word is **${game.word.toUpperCase()}**!` +
            (game.bet > 0 ? `\n\n**${game.starterName}** wins **${(game.bet * 2).toLocaleString()} 🐱 kittens**!` : "")
          )
          .setColor(0x2ecc71).setTimestamp()] });
      }
      return msg.channel.send({ content: `✅ **${userName}** found **${input.toUpperCase()}**!`, embeds: [buildHangmanEmbed(game)] });
    } else {
      game.wrongGuesses.push(input);
      if (game.wrongGuesses.length >= 6) {
        clearTimeout(game.timeoutHandle);
        activeHangman.delete(channelId);
        return msg.channel.send({ embeds: [new EmbedBuilder()
          .setTitle("💀  Hangman — Game Over!")
          .setDescription(
            `**${userName}** guessed **${input.toUpperCase()}** — not in the word!\n\nThe word was **${game.word.toUpperCase()}**.` +
            (game.bet > 0 ? `\n\n**${game.starterName}** loses **${game.bet.toLocaleString()} 🐱 kittens** to the house!` : "")
          )
          .setColor(0xe74c3c).setTimestamp()] });
      }
      return msg.channel.send({ content: `❌ **${userName}** guessed **${input.toUpperCase()}** — not in the word!`, embeds: [buildHangmanEmbed(game)] });
    }
  }

  // ── !horse ─────────────────────────────────────────────────
  else if (cmd === "horse") {
    ensureUser(userId, userName);
    const channelId = msg.channel.id;
    const existing = activeHorseRaces.get(channelId);

    // No args → show horses (and current bets if race is open)
    if (!args[0] || isNaN(parseInt(args[0]))) {
      if (existing && existing.phase === "betting") {
        return msg.channel.send({ embeds: [buildHorseRaceBettingEmbed(existing)] });
      }
      const horseList = RACE_HORSES.map(h => `**${h.id}.** ${h.emoji} ${h.name} — **${h.odds}x**`).join("\n");
      return msg.channel.send({ embeds: [new EmbedBuilder()
        .setTitle("🏇  Horse Racing")
        .setDescription(`${horseList}\n\nBet with \`!horse <1–5> <amount>\` to start or join a race!`)
        .setColor(0xf39c12)
        .setFooter({ text: "Max 500 🐱 per bet · Betting window is 30 seconds after the first bet" })
        .setTimestamp()] });
    }

    const horseId = parseInt(args[0]);
    const bet = parseInt(args[1]);
    if (horseId < 1 || horseId > 5 || isNaN(horseId)) return msg.reply("❌ Pick a horse number 1–5. Type `!horse` to see the list.");
    if (isNaN(bet) || bet <= 0) return msg.reply("Usage: `!horse <1–5> <bet>`");
    if (bet > 500) return msg.reply("❌ Max horse race bet is **500 🐱 kittens**!");

    // Join existing betting phase
    if (existing && existing.phase === "betting") {
      if (existing.bets.has(userId)) return msg.reply("❌ You already have a bet in this race!");
      const bal = getKittens(userId);
      if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);
      removeKittens(userId, bet);
      existing.bets.set(userId, { horseId, bet, userName });
      const h = RACE_HORSES[horseId - 1];
      await msg.reply(`✅ **${userName}** bets **${bet.toLocaleString()} 🐱** on ${h.emoji} **${h.name}** (${h.odds}x)!`);
      await existing.bettingMsg?.edit({ embeds: [buildHorseRaceBettingEmbed(existing)] }).catch(() => {});
      return;
    }

    if (existing) return msg.reply("❌ A race is already running in this channel!");

    const bal = getKittens(userId);
    if (bal < bet) return msg.reply(`❌ You only have **${bal.toLocaleString()} 🐱 kittens**!`);
    removeKittens(userId, bet);

    const race = { phase: "betting", bets: new Map([[userId, { horseId, bet, userName }]]), bettingMsg: null };
    activeHorseRaces.set(channelId, race);

    const h = RACE_HORSES[horseId - 1];
    const bettingMsg = await msg.channel.send({ embeds: [buildHorseRaceBettingEmbed(race)] });
    race.bettingMsg = bettingMsg;
    await msg.reply(`🏇 **${userName}** bets **${bet.toLocaleString()} 🐱** on ${h.emoji} **${h.name}** (${h.odds}x)! Race starts in **30 seconds** — place your bets!`);

    setTimeout(() => runHorseRace(channelId, msg.channel, bettingMsg), 30_000);
  }

  else if (cmd === "cops") {
    const guild = msg.guild;
    await guild.members.fetch().catch(() => {});
    const admins = guild.members.cache.filter(
      (m) => !m.user.bot && m.permissions.has("Administrator")
    );
    if (admins.size === 0) return msg.reply("No admins found.");
    const mentions = admins.map((m) => `<@${m.id}>`).join(" ");
    await msg.channel.send(`🚔 ${mentions}`);
  }
});

// ── Blackjack interactions ─────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId, user } = interaction;
  if (!customId.startsWith("bj_")) return;

  const [, action, channelId] = customId.split("_");
  const game = activeGames.get(channelId);
  if (!game) return interaction.reply({ content: "❌ This game has already ended.", ephemeral: true });
  if (user.id !== game.turn) return interaction.reply({ content: "❌ It's not your turn!", ephemeral: true });

  clearTurnTimeout(game);
  const channel = interaction.channel;
  const name = game.players.find(p => p.id === game.turn).name;

  if (action === "hit") {
    const card = game.deck.pop();
    game.hands[game.turn].push(card);
    const val = handValue(game.hands[game.turn]);
    if (val > 21) {
      await interaction.update({ components: [] });
      await channel.send(`💥 **${name}** busted with **${val}**!`);
      game.stood.add(game.turn);
      advanceTurn(channel, channelId);
    } else if (val === 21) {
      await interaction.update({ components: [] });
      await channel.send(`✨ **${name}** hit 21! Standing automatically.`);
      game.stood.add(game.turn);
      advanceTurn(channel, channelId);
    } else {
      await interaction.update({ embeds: [buildGameEmbed(game)], components: [buildBJRow(channelId)] });
    }
  } else {
    game.stood.add(game.turn);
    await interaction.update({ components: [] });
    await channel.send(`🛑 **${name}** stands at **${handValue(game.hands[game.turn])}**.`);
    advanceTurn(channel, channelId);
  }
});

// ── RPS interactions ───────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId, user } = interaction;

  // ── Standalone RPS — vs house ──────────────────────────
  if (customId.startsWith("rps_bot_")) {
    // customId: rps_bot_{userId}_{bet}_{pick}
    const parts = customId.split("_");
    const rpsUserId = parts[2];
    const rpsBet = parseInt(parts[3]);
    const pick = parts[4];
    const gameKey = `rps_bot_${rpsUserId}`;

    if (user.id !== rpsUserId) {
      return interaction.reply({ content: "❌ This isn't your game!", ephemeral: true });
    }

    const pending = pendingRpsGames.get(gameKey);
    if (!pending) {
      return interaction.reply({ content: "❌ This game has already ended or expired.", ephemeral: true });
    }

    clearTimeout(pending.timeoutHandle);
    pendingRpsGames.delete(gameKey);

    const moves = ["rock", "paper", "scissors"];
    const housePick = moves[Math.floor(Math.random() * 3)];
    const moveLine = `${RPS_EMOJI[pick]} **${pending.userName}** picked **${RPS_LABEL[pick]}** · ${RPS_EMOJI[housePick]} **House** picked **${RPS_LABEL[housePick]}**`;

    let description, color;
    if (pick === housePick) {
      description = `${moveLine}\n\n🤝 Tie! Your **${rpsBet.toLocaleString()} 🐱 kittens** are returned.`;
      color = 0x95a5a6;
    } else if (RPS_BEATS[pick] === housePick) {
      removeKittens(rpsUserId, rpsBet);
      addKittens(rpsUserId, rpsBet * 2);
      description = `${moveLine}\n\n🎉 **${pending.userName}** wins **+${rpsBet.toLocaleString()} 🐱 kittens**!`;
      color = 0x2ecc71;
    } else {
      removeKittens(rpsUserId, rpsBet);
      description = `${moveLine}\n\n😔 **${pending.userName}** loses **${rpsBet.toLocaleString()} 🐱 kittens** to the house!`;
      color = 0xe74c3c;
    }

    const finalEmbed = new EmbedBuilder()
      .setTitle("✂️  Rock Paper Scissors — Result")
      .setDescription(description)
      .setColor(color)
      .addFields({ name: pending.userName, value: `${getKittens(rpsUserId).toLocaleString()} 🐱`, inline: true })
      .setTimestamp();

    return interaction.update({ embeds: [finalEmbed], components: [] });
  }

  // ── Standalone RPS — 1v1 ──────────────────────────────
  if (customId.startsWith("rps_pvp_")) {
    // customId: rps_pvp_{challengerId}_{targetId}_{pick}
    const parts = customId.split("_");
    const challengerId = parts[2];
    const targetId = parts[3];
    const pick = parts[4];
    const rpsKey = `rps_pvp_${challengerId}_${targetId}`;

    const pending = pendingRpsGames.get(rpsKey);
    if (!pending) {
      return interaction.reply({ content: "❌ This challenge has already ended or expired.", ephemeral: true });
    }

    if (pending.phase === "challenger") {
      if (user.id !== challengerId) {
        return interaction.reply({ content: "❌ Wait — the challenger picks first!", ephemeral: true });
      }

      pending.challengerPick = pick;
      pending.phase = "target";

      await interaction.reply({
        content: `🤫 You picked **${RPS_EMOJI[pick]} ${RPS_LABEL[pick]}**! Waiting for **${pending.targetName}** to respond...`,
        ephemeral: true,
      });

      clearTimeout(pending.timeoutHandle);
      pending.timeoutHandle = setTimeout(async () => {
        pendingRpsGames.delete(rpsKey);
        const cancelEmbed = new EmbedBuilder()
          .setTitle("✂️  Rock Paper Scissors — Cancelled")
          .setDescription(`⏰ **${pending.targetName}** didn't respond in time — game cancelled, no kittens exchanged.`)
          .setColor(0x95a5a6)
          .setTimestamp();
        pending.message.edit({ embeds: [cancelEmbed], components: [] }).catch(() => {});
      }, RPS_TIMEOUT_MS);

      await pending.message.edit({
        embeds: [pending.phaseEmbed(`**${pending.challengerName}** has locked in their move! 🔒\n\n<@${targetId}> — your turn! Pick your move:`)],
        components: [pending.rpsRow()],
      }).catch(() => {});

    } else {
      // target's turn
      if (user.id !== targetId) {
        return interaction.reply({ content: "❌ It's not your turn to pick!", ephemeral: true });
      }

      clearTimeout(pending.timeoutHandle);
      pendingRpsGames.delete(rpsKey);

      const { challengerId: cId, challengerName, targetName, bet, challengerPick } = pending;
      const moveLine = `${RPS_EMOJI[challengerPick]} **${challengerName}** picked **${RPS_LABEL[challengerPick]}** · ${RPS_EMOJI[pick]} **${targetName}** picked **${RPS_LABEL[pick]}**`;

      let description, color;
      if (challengerPick === pick) {
        description = `${moveLine}\n\n🤝 Tie! Both players keep their **${bet.toLocaleString()} 🐱 kittens**.`;
        color = 0x95a5a6;
      } else if (RPS_BEATS[challengerPick] === pick) {
        removeKittens(targetId, bet);
        addKittens(cId, bet);
        description = `${moveLine}\n\n🎉 **${challengerName}** wins **${bet.toLocaleString()} 🐱 kittens** from **${targetName}**!`;
        color = 0x2ecc71;
      } else {
        removeKittens(cId, bet);
        addKittens(targetId, bet);
        description = `${moveLine}\n\n🎉 **${targetName}** wins **${bet.toLocaleString()} 🐱 kittens** from **${challengerName}**!`;
        color = 0x9b59b6;
      }

      const finalEmbed = new EmbedBuilder()
        .setTitle("✂️  Rock Paper Scissors — Result")
        .setDescription(description)
        .setColor(color)
        .addFields(
          { name: challengerName, value: `${getKittens(cId).toLocaleString()} 🐱`, inline: true },
          { name: targetName, value: `${getKittens(targetId).toLocaleString()} 🐱`, inline: true },
        )
        .setTimestamp();

      return interaction.update({ embeds: [finalEmbed], components: [] });
    }
    return;
  }

  if (!customId.startsWith("rob_rps_")) return;

  // customId format: rob_rps_{robberId}_{targetId}_{pick}
  const parts = customId.split("_");
  const robberId = parts[2];
  const targetId = parts[3];
  const pick = parts[4];
  const robKey = `${robberId}_${targetId}`;

  const pending = pendingRobs.get(robKey);
  if (!pending) {
    return interaction.reply({ content: "❌ This challenge has already ended or expired.", ephemeral: true });
  }

  const pickEmoji = { rock: "🪨", paper: "📄", scissors: "✂️" };
  const pickLabel = { rock: "Rock", paper: "Paper", scissors: "Scissors" };

  if (pending.phase === "robber") {
    if (user.id !== robberId) {
      return interaction.reply({ content: "❌ You're not the one initiating this robbery!", ephemeral: true });
    }

    // Store pick, advance to target phase
    pending.robberPick = pick;
    pending.phase = "target";

    await interaction.reply({
      content: `🤫 You picked **${pickEmoji[pick]} ${pickLabel[pick]}**! Waiting for **${pending.targetName}** to respond...`,
      ephemeral: true,
    });

    // Reset timeout for target phase
    clearTimeout(pending.timeoutHandle);
    pending.timeoutHandle = setTimeout(async () => {
      pendingRobs.delete(robKey);
      const cancelEmbed = new EmbedBuilder()
        .setTitle("🔫  Rob Attempt — Cancelled")
        .setDescription(`⏰ **${pending.targetName}** didn't respond in time — no kittens exchanged.`)
        .setColor(0x95a5a6)
        .setTimestamp();
      pending.message.edit({ embeds: [cancelEmbed], components: [] }).catch(() => {});
    }, ROB_RPS_TIMEOUT_MS);

    await pending.message.edit({
      embeds: [pending.phaseEmbed(`**${pending.robberName}** has locked in their move! 🔒\n\n<@${targetId}> — defend yourself! Pick your move:`)],
      components: [pending.rpsRow()],
    }).catch(() => {});

  } else {
    // Target's turn
    if (user.id !== targetId) {
      return interaction.reply({ content: "❌ You're not the one being robbed here!", ephemeral: true });
    }

    clearTimeout(pending.timeoutHandle);
    pendingRobs.delete(robKey);

    const { robberId: rId, robberName, targetName, stake, isRandom, robberPick, robsLeft } = pending;
    const beats = { rock: "scissors", paper: "rock", scissors: "paper" };

    let result;
    if (robberPick === pick) result = "tie";
    else if (beats[robberPick] === pick) result = "robber";
    else result = "target";

    const moveLine = `${pickEmoji[robberPick]} **${robberName}** picked **${pickLabel[robberPick]}** · ${pickEmoji[pick]} **${targetName}** picked **${pickLabel[pick]}**`;
    let description, color;

    if (result === "tie") {
      description = `${moveLine}\n\n🤝 It's a tie! No kittens were exchanged.`;
      color = 0x95a5a6;
    } else if (result === "robber") {
      const winAmount = isRandom ? Math.floor(stake * 1.5) : stake;
      removeKittens(targetId, stake);
      addKittens(rId, winAmount);
      description = isRandom
        ? `${moveLine}\n\n🔫 **${robberName}** wins! Stole **${stake.toLocaleString()} 🐱** + **${(winAmount - stake).toLocaleString()} 🐱 RNG bonus** = **${winAmount.toLocaleString()} 🐱 total**!`
        : `${moveLine}\n\n🔫 **${robberName}** wins and steals **${stake.toLocaleString()} 🐱** from **${targetName}**!`;
      color = 0xe74c3c;
    } else {
      removeKittens(rId, stake);
      addKittens(targetId, stake);
      description = `${moveLine}\n\n🛡️ **${targetName}** defended! **${robberName}** loses **${stake.toLocaleString()} 🐱** to **${targetName}**!`;
      color = 0x2ecc71;
    }

    const finalEmbed = new EmbedBuilder()
      .setTitle("🔫  Rob Result — Rock Paper Scissors!")
      .setDescription(description)
      .setColor(color)
      .addFields(
        { name: robberName, value: `${getKittens(rId).toLocaleString()} 🐱`, inline: true },
        { name: targetName, value: `${getKittens(targetId).toLocaleString()} 🐱`, inline: true },
      )
      .setFooter({ text: `${isRandom ? "Random target — 50% bonus on win · " : ""}${robsLeft} rob${robsLeft === 1 ? "" : "s"} left today` })
      .setTimestamp();

    await interaction.update({ embeds: [finalEmbed], components: [] });
  }
});

// ── Trivia interactions ────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId, user } = interaction;
  if (!customId.startsWith("trivia_")) return;

  const [, channelId, choiceStr] = customId.split("_");
  const choice = parseInt(choiceStr);

  const trivia = activeTrivias.get(channelId);
  if (!trivia || trivia.phase !== "answering") return interaction.reply({ content: "❌ This question has already ended.", ephemeral: true });
  if (!trivia.participants.has(user.id)) return interaction.reply({ content: "❌ You're not in this trivia round!", ephemeral: true });
  if (trivia.answers.has(user.id)) return interaction.reply({ content: "❌ You've already locked in an answer!", ephemeral: true });

  trivia.answers.set(user.id, choice);
  const remaining = trivia.participants.size - trivia.answers.size;

  await interaction.reply({
    content: `✅ Answer locked in! ${remaining > 0 ? `Waiting on **${remaining}** more player${remaining === 1 ? "" : "s"}...` : "Everyone's answered!"}`,
    ephemeral: true,
  });

  if (trivia.answers.size === trivia.participants.size) {
    clearTimeout(trivia.timeout);
    activeTrivias.delete(channelId);
    await revealTrivia(trivia);
  }
});

// ── Crash interactions ─────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId, user } = interaction;
  if (!customId.startsWith("crash_cashout_")) return;

  const channelId = customId.slice("crash_cashout_".length);
  const game = activeCrashes.get(channelId);

  if (!game || game.phase !== "flying") {
    return interaction.reply({ content: "❌ The game has already ended!", ephemeral: true });
  }
  if (!game.bets.has(user.id)) {
    return interaction.reply({ content: "❌ You're not in this crash game!", ephemeral: true });
  }
  const info = game.bets.get(user.id);
  if (info.cashedAt !== null) {
    return interaction.reply({ content: "❌ You already cashed out!", ephemeral: true });
  }

  info.cashedAt = game.multiplier;
  const winnings = Math.floor(info.bet * game.multiplier);
  addKittens(user.id, winnings);
  const profit = winnings - info.bet;

  await interaction.reply({
    content: `💰 **${user.username}** cashed out at **${game.multiplier.toFixed(2)}x** — won **${winnings.toLocaleString()} 🐱** (+${profit.toLocaleString()} profit)!`,
  });
});

// ── WYR interactions ───────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId, user } = interaction;
  if (!customId.startsWith("wyr_a_") && !customId.startsWith("wyr_b_")) return;

  const option = customId[4]; // "a" or "b"
  const channelId = customId.slice(6);

  const wyr = activeWyrs.get(channelId);
  if (!wyr) return interaction.reply({ content: "❌ This poll has already ended!", ephemeral: true });
  if (wyr.votes.a.has(user.id) || wyr.votes.b.has(user.id)) {
    return interaction.reply({ content: "❌ You already voted!", ephemeral: true });
  }

  wyr.votes[option].add(user.id);
  const total = wyr.votes.a.size + wyr.votes.b.size;
  await interaction.reply({ content: `✅ Vote locked in! (${total} total so far)`, ephemeral: true });
});

// ── Ready ──────────────────────────────────────────────────
client.once("ready", () => {
  console.log(`[UltimateShitter] Logged in as ${client.user.tag} 💩`);
  client.user.setActivity("the toilet 🚽", { type: 3 });
});

client.login(BOT_TOKEN);
