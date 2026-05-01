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

// ── Persistence ────────────────────────────────────────────
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  return { users: {}, weekStart: todayStr(), championId: null };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
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

function buildLeaderboardEmbed(data, guildMembers) {
  const sorted = Object.entries(data.users)
    .sort(([, a], [, b]) => b.points - a.points)
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

// ── Rob helpers ────────────────────────────────────────────
const pendingRobs = new Map();
const ROB_DAILY_LIMIT = 2;
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

// ── Race state ─────────────────────────────────────────────
const activeRaces = new Map();

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
    const winner = getTopUser();
    if (channel) {
      const embed = buildLeaderboardEmbed(db, guild.members.cache);
      await channel.send({ content: "📣 **Weekly results before the reset!**", embeds: [embed] }).catch(() => {});
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
  });
  Object.keys(db.users).forEach((id) => {
    db.users[id].points = 0;
    db.users[id].count = 0;
    db.users[id].lastPoopTime = null;
  });
  db.weekStart = todayStr();
  saveData(db);
});

cron.schedule("0 0 * * *", () => pickTodaysWindows());

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
    const windowList = activeDoubleWindows.map(([s, e]) => `• ${s}:00 – ${e}:00`).join("\n");
    const embed = new EmbedBuilder()
      .setTitle("💩  Ultimate Shitter Bot — Commands")
      .addFields(
        { name: "`!poop`", value: "Log a poop and earn a point" },
        { name: "`!leaderboard` / `!lb`", value: "See the weekly leaderboard" },
        { name: "`!alltime` / `!at`", value: "All-time poop hall of fame — never resets" },
        { name: "`!mystats`", value: "Your personal stats — weekly and all-time" },
        { name: "`!doublepoints` / `!dp`", value: "Check if double points are active" },
        { name: "`!poopfacts`", value: "Get a random poop fact" },
        { name: "`!race`", value: "Start a type race — 30s to join with `!join`" },
        { name: "`!kittens` / `!bal`", value: "Check your kitten balance (or `!kittens @user`)" },
        { name: "`!kittenboard` / `!kb`", value: "Kitten rich list" },
        { name: "`!blackjack <bet>`", value: "Play blackjack vs the dealer" },
        { name: "`!blackjack @user1 [@user2 ...] <bet>`", value: "Challenge one or more people to blackjack" },
        { name: "`!blackjack open <bet>`", value: "Open a public table — anyone can `!join` within 30s" },
        { name: "`!blackjack` buttons", value: "Hit / Stand buttons appear during your turn" },
        { name: "`!donate @user <amount>`", value: "Donate kittens to another user" },
        { name: "`!rps <bet>`", value: "Play Rock Paper Scissors vs the house — win doubles your bet, tie refunds it" },
        { name: "`!rps @user <bet>`", value: "Challenge someone to 1v1 RPS — winner takes the other's bet" },
        { name: "`!rob @user <amount> [rps]`", value: "Rob a specific user — dice roll (default) or rock paper scissors · 2 robs/day" },
        { name: "`!rob <amount> [rps]`", value: "Rob a random user — win 1.5× stake on win · tie in RPS = null · 30s to respond" },
        { name: "`!beg`", value: "Beg the house for kittens — 40% chance of 1–200 🐱, 100% chance of humiliation" },
        { name: "`!cops`", value: "Ping all server admins" },
        { name: "`!report @user`", value: "Report a user for spam — 2 reports triggers a 300 🐱 penalty + 2 min freeze" },
        { name: "⚡ Quick pooper bonus", value: "Poop within 2 hours of your last for +1.5 points!" },
        { name: "🐱 Earning kittens", value: "5 kittens per message · 5 kittens per minute in VC" },
        { name: "Today's double-point windows", value: windowList || "None today" },
        { name: "👑 The Ultimate Shitter", value: "Awarded to the weekly #1 every Monday." },
      )
      .setColor(0x8b4513)
      .setFooter({ text: "Leaderboard resets every Monday at midnight" });
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

// ── Ready ──────────────────────────────────────────────────
client.once("ready", () => {
  console.log(`[UltimateShitter] Logged in as ${client.user.tag} 💩`);
  client.user.setActivity("the toilet 🚽", { type: 3 });
});

client.login(BOT_TOKEN);
