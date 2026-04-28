// ============================================================
//  💩  U L T I M A T E  S H I T T E R  B O T  — Discord.js v14
// ============================================================
//  Setup:
//    1. npm install discord.js node-cron
//    2. Create a Discord bot at https://discord.com/developers
//       - Enable: MESSAGE CONTENT INTENT, SERVER MEMBERS INTENT
//    3. Set your BOT_TOKEN below (or use a .env file)
//    4. node poopbot.js
//
//  "The Ultimate Shitter" role:
//    - Create a role in your Discord server called exactly:
//      "The Ultimate Shitter"
//    - Give the bot's own role a HIGHER position than that role
//      (so it has permission to assign/remove it)
//    - The bot does the rest automatically on weekly reset
// ============================================================

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
const fs = require("fs");

// ── Config ─────────────────────────────────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN;
const PREFIX = "!";
const DATA_FILE = "./poopdata.json";
const CHAMPION_ROLE_NAME = "The Ultimate Shitter"; // must match your Discord role exactly

// Double-points windows  [startHour, endHour]  (24h, server local time)
const DOUBLE_POINT_WINDOWS = [
  [2, 4],   // 2 AM – 4 AM  (brave night-pooper bonus)
  [7, 9],   // 7 AM – 9 AM  (morning rush)
  [14, 16], // 2 PM – 4 PM  (afternoon drop)
  [21, 23], // 9 PM – 11 PM (late-night special)
];

// How many of the above windows actually activate each day (random pick)
const WINDOWS_PER_DAY = 2;

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

// ── Double-points state ────────────────────────────────────
let activeDoubleWindows = [];

function pickTodaysWindows() {
  const shuffled = [...DOUBLE_POINT_WINDOWS].sort(() => Math.random() - 0.5);
  activeDoubleWindows = shuffled.slice(0, WINDOWS_PER_DAY);
  console.log(
    `[UltimateShitter] Today's double-point windows: ${activeDoubleWindows
      .map(([s, e]) => `${s}:00-${e}:00`)
      .join(", ")}`
  );
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

// ── Champion role helpers ──────────────────────────────────
async function assignChampionRole(guild, winnerId) {
  const role = guild.roles.cache.find((r) => r.name === CHAMPION_ROLE_NAME);
  if (!role) {
    console.warn(`[UltimateShitter] Role "${CHAMPION_ROLE_NAME}" not found in ${guild.name}. Create it in Discord!`);
    return false;
  }

  // Strip role from last week's champion if they're different
  if (db.championId && db.championId !== winnerId) {
    const oldChamp = await guild.members.fetch(db.championId).catch(() => null);
    if (oldChamp) {
      await oldChamp.roles.remove(role).catch((e) =>
        console.warn("[UltimateShitter] Could not remove role from old champ:", e.message)
      );
    }
  }

  // Give role to new champion
  const newChamp = await guild.members.fetch(winnerId).catch(() => null);
  if (!newChamp) return false;
  await newChamp.roles.add(role).catch((e) =>
    console.warn("[UltimateShitter] Could not add role to new champ:", e.message)
  );

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

function buildLeaderboardEmbed(data, guildMembers, showChampion = false) {
  const sorted = Object.entries(data.users)
    .sort(([, a], [, b]) => b.points - a.points)
    .slice(0, 10);

  const medals = ["🥇", "🥈", "🥉"];
  const rows = sorted.map(([id, info], i) => {
    const member = guildMembers?.get(id);
    const name = member?.displayName ?? info.name ?? `User ${id}`;
    const medal = medals[i] ?? `**${i + 1}.**`;
    const crown = showChampion && i === 0 ? " 👑" : "";
    return `${medal} **${name}**${crown} — ${info.points} 💩 (${info.count} poops)`;
  });

  const weekNum = getWeekNumber(data.weekStart);
  return new EmbedBuilder()
    .setTitle("💩  Weekly Poop Leaderboard")
    .setDescription(rows.length ? rows.join("\n") : "*No poops logged yet!*")
    .setColor(0x8b4513)
    .setFooter({ text: `Week ${weekNum} • Resets every Monday at midnight` })
    .setTimestamp();
}

// ── Bot setup ──────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

let db = loadData();
pickTodaysWindows();

// ── Weekly reset — every Monday 00:00 ─────────────────────
cron.schedule("0 0 * * 1", () => {
  console.log("[UltimateShitter] Weekly reset!");

  client.guilds.cache.forEach(async (guild) => {
    await guild.members.fetch().catch(() => {});

    const channel = guild.channels.cache.find(
      (c) => c.name === "poop-leaderboard" || c.name === "general"
    );

    // Find this week's winner before resetting
    const winner = getTopUser();

    // Post final leaderboard
    if (channel) {
      const embed = buildLeaderboardEmbed(db, guild.members.cache, true);
      await channel
        .send({ content: "📣  **Weekly results — final standings!**", embeds: [embed] })
        .catch(() => {});
    }

    // Crown the new Ultimate Shitter
    if (winner) {
      const crowned = await assignChampionRole(guild, winner.id);
      db.championId = winner.id;
      db.users[winner.id].weeklyWins = (db.users[winner.id].weeklyWins ?? 0) + 1;

      if (channel && crowned) {
        await channel
          .send(
            `👑 **${crowned.displayName}** has been crowned **The Ultimate Shitter** for the week with **${winner.points} 💩**!\nThey hold the title until next Monday. Watch your thrones. 🚽`
          )
          .catch(() => {});
      }
    } else {
      // Nobody pooped — strip the old title holder
      if (db.championId) {
        const role = guild.roles.cache.find((r) => r.name === CHAMPION_ROLE_NAME);
        if (role) {
          const oldChamp = await guild.members.fetch(db.championId).catch(() => null);
          if (oldChamp) await oldChamp.roles.remove(role).catch(() => {});
        }
        db.championId = null;
      }
      if (channel) {
        await channel
          .send("😔 Nobody pooped enough this week. The throne sits empty.")
          .catch(() => {});
      }
    }

    // Reset scores
    Object.keys(db.users).forEach((id) => {
      db.users[id].points = 0;
      db.users[id].count = 0;
      db.users[id].lastPoopTime = null;
    });
    db.weekStart = todayStr();
    saveData(db);
  });
});

// ── Midnight: pick new double-point windows ────────────────
cron.schedule("0 0 * * *", () => {
  pickTodaysWindows();
});

// ── Message handler ────────────────────────────────────────
client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  // ── !poop ───────────────────────────────────────────────
  if (cmd === "poop") {
    const userId = msg.author.id;
    const userName = msg.member?.displayName ?? msg.author.username;
    const double = isDoublePointsNow();
    const earned = double ? 2 : 1;

    if (!db.users[userId]) {
      db.users[userId] = { name: userName, points: 0, count: 0, lastPoopTime: null, allTimeCount: 0, allTimePoints: 0, weeklyWins: 0 };
    }
    db.users[userId].name = userName;

    // Check for quick-poop bonus (within 2 hours of last poop)
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

    // Taunt if they're threatening the reigning champ
    const leader = getTopUser();
    const leadText =
      leader?.id === userId
        ? "\n👑 You're currently in the lead!"
        : "";

    await msg.reply(
      `💩 Logged! You earned **${totalEarned} point${totalEarned !== 1 ? "s" : ""}**!${bonusText}${quickText}\n` +
        `Your total this week: **${total} 💩**${leadText}`
    );
  }

  // ── !leaderboard ────────────────────────────────────────
  else if (cmd === "leaderboard" || cmd === "lb") {
    await msg.guild?.members.fetch().catch(() => {});
    const embed = buildLeaderboardEmbed(db, msg.guild?.members.cache);

    // Mention the reigning champion above the board
    let champText = "";
    if (db.championId) {
      const champ = await msg.guild?.members.fetch(db.championId).catch(() => null);
      if (champ) {
        champText = `👑 Reigning **Ultimate Shitter**: **${champ.displayName}** *(last week's champ)*`;
      }
    }

    await msg.channel.send({
      content: champText || undefined,
      embeds: [embed],
    });
  }

  // ── !mystats ────────────────────────────────────────────
  else if (cmd === "mystats" || cmd === "stats") {
    const userId = msg.author.id;
    const info = db.users[userId];
    if (!info || (info.allTimeCount ?? 0) === 0) {
      return msg.reply("You haven't pooped yet! 😱");
    }
    const isChamp = db.championId === userId;
    const embed = new EmbedBuilder()
      .setTitle(`📊 ${info.name}'s Poop Stats`)
      .addFields(
        { name: "This week", value: `💩 ${info.count} poops · ${info.points} pts`, inline: false },
        { name: "All-time poops", value: `🚽 ${(info.allTimeCount ?? 0).toLocaleString()}`, inline: true },
        { name: "All-time points", value: `⭐ ${Math.round(info.allTimePoints ?? 0).toLocaleString()}`, inline: true },
        { name: "Weekly wins", value: `👑 ${info.weeklyWins ?? 0}`, inline: true },
      )
      .setColor(0x8b4513)
      .setFooter({ text: isChamp ? "👑 Reigning Ultimate Shitter" : "Keep flushing!" });
    await msg.reply({ embeds: [embed] });
  }

  // ── !alltime ────────────────────────────────────────────
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

  // ── !doublepoints ────────────────────────────────────────
  else if (cmd === "doublepoints" || cmd === "dp") {
    const active = isDoublePointsNow();
    if (active) {
      await msg.reply("🔥 **Double points are ACTIVE right now!** Go poop!");
    } else {
      await msg.reply(`⏳ ${nextDoubleWindowDescription()}`);
    }
  }

  // ── !poopfacts ───────────────────────────────────────────
  else if (cmd === "poopfacts" || cmd === "poopfact") {
    const facts = [
      "The average person poops about 1–3 times per day, but anywhere from 3 times a day to 3 times a week is considered normal. 📊",
      "Your poop is about 75% water. The rest is bacteria, fiber, dead cells, and other waste. 💧",
      "The Bristol Stool Scale is an actual medical chart with 7 categories classifying poop from Type 1 (hard lumps) to Type 7 (entirely liquid). Scientists are serious about this. 📋",
      "The average poop weighs about 100–250 grams — roughly the weight of a smartphone. 📱",
      "It takes 24–72 hours for food to travel through your digestive system and become poop. So today's poop might be last Tuesday's lunch. 🕐",
      "Poop gets its brown color from bilirubin, a byproduct of dead red blood cells being broken down by your liver. 🟤",
      "The smell of poop comes from compounds like skatole and indole, produced by gut bacteria during digestion. Different diets = different smells. 🌿",
      "Corn doesn't actually pass through you undigested — you digest the insides just fine. What you see is the indigestible outer shell (cellulose). 🌽",
      "The longest recorded poop in history was 26 feet (7.9 meters), achieved under careful medical observation. Nobody knows why they measured it. 📏",
      "Some animals eat their own poop on purpose. Rabbits produce a special type called cecotropes that are packed with nutrients and eat them directly from the source. 🐇",
      "Your gut contains about 100 trillion bacteria — outnumbering your body's own cells — and a big chunk of your poop is made up of their dead bodies. 🦠",
      "Poop transplants (fecal microbiota transplants) are a real medical treatment where healthy donor poop is placed into a sick person's gut to restore good bacteria. 💊",
      "Astronauts on early NASA missions had to poop into bags stuck to their butts in zero gravity. It was reportedly the most universally hated part of space travel. 🚀",
      "The word 'poop' originally meant the rear deck of a ship in the 1400s. It didn't become slang for feces until much later. ⛵",
      "Wombat poop is cube-shaped — the only animal known to produce square droppings. Scientists only figured out HOW in 2018. 🟫",
      "If you're right-handed, you probably wipe from front to back. Left-handed people are statistically more likely to wipe back to front. Science has studied this. ✋",
      "The average person spends about 3 hours per week on the toilet over their lifetime — that's roughly 92 days total. 🧮",
      "Holding in poop doesn't actually cause your body to reabsorb toxins (a common myth). But it can lead to constipation and discomfort over time. 🚫",
      "Ancient Romans used a communal sponge on a stick called a 'tersorium' instead of toilet paper. It was shared. And rinsed between uses. 🏛️",
      "Poop has been used as fertilizer for thousands of years and is still used today in many parts of the world — it's called 'night soil' when it's human waste. 🌱",
      "A healthy poop should sink, not float. Floating poop can indicate excess fat or gas, which may signal a digestive issue. 🚽",
      "The Paris Catacombs contain the remains of over 6 million people — but the city's underground also has hundreds of miles of ancient sewers still in use today. 🗺️",
      "Some penguins projectile poop up to 1.34 meters (4.4 feet) to avoid soiling their nests. Scientists calculated the required rectal pressure in a published paper. 🐧",
      "The technical term for the study of feces is 'scatology.' There are actual scatologists. It's a real job. 🔬",
      "Healthy poop should be roughly S or C shaped — the shape of your colon. Straight or fragmented poops mean something's off with hydration or diet. 🔄",
    ];

    const fact = facts[Math.floor(Math.random() * facts.length)];
    const embed = new EmbedBuilder()
      .setTitle("💩  Poop Fact of the Moment")
      .setDescription(fact)
      .setColor(0x8b4513)
      .setFooter({ text: "Use !poopfacts again for another one" });

    await msg.channel.send({ embeds: [embed] });
  }

  // ── !poophelp ────────────────────────────────────────────
  else if (cmd === "poophelp") {
    const windowList = activeDoubleWindows
      .map(([s, e]) => `• ${s}:00 – ${e}:00`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("💩  Ultimate Shitter Bot — Commands")
      .addFields(
        { name: "`!poop`", value: "Log a poop and earn a point" },
        { name: "`!leaderboard` / `!lb`", value: "See the weekly leaderboard" },
        { name: "`!alltime` / `!at`", value: "All-time poop hall of fame — never resets" },
        { name: "`!mystats`", value: "Your personal stats — weekly and all-time" },
        { name: "`!doublepoints` / `!dp`", value: "Check if double points are active" },
        { name: "`!poopfacts`", value: "Get a random fact about poop" },
        { name: "⚡ Quick pooper bonus", value: "Poop within 2 hours of your last poop to earn an extra +1.5 points!" },
        { name: "Today's double-point windows", value: windowList || "None today" },
        {
          name: "👑 The Ultimate Shitter",
          value: "Awarded to the weekly #1 every Monday. They keep the Discord role & title until next reset.",
        }
      )
      .setColor(0x8b4513)
      .setFooter({ text: "Leaderboard resets every Monday at midnight" });

    await msg.channel.send({ embeds: [embed] });
  }
});

// ── Ready ──────────────────────────────────────────────────
client.once("ready", () => {
  console.log(`[UltimateShitter] Logged in as ${client.user.tag} 💩`);
  client.user.setActivity("the toilet 🚽", { type: 3 });
});

client.login(BOT_TOKEN);
