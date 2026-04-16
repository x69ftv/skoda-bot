const {
Client,
GatewayIntentBits,
EmbedBuilder,
PermissionsBitField,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
Collection,
} = require(“discord.js”);

const {
joinVoiceChannel,
createAudioPlayer,
createAudioResource,
AudioPlayerStatus,
getVoiceConnection,
StreamType,
} = require(”@discordjs/voice”);

const ytdl = require(”@distube/ytdl-core”);
const ytSearch = require(“yt-search”);

/* ══════════════════════════════════════════
CLIENT SETUP
══════════════════════════════════════════ */

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildVoiceStates,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildBans,
GatewayIntentBits.GuildPresences,
],
});

const PREFIX = “s!”;
const BOT_COLOR = 0x2b2d31;
const SUCCESS_COLOR = 0x57f287;
const ERROR_COLOR = 0xed4245;
const WARN_COLOR = 0xfee75c;
const INFO_COLOR = 0x5865f2;
const MUSIC_COLOR = 0x1db954;

/* ══════════════════════════════════════════
EMBED BUILDERS
══════════════════════════════════════════ */

const e = {
base: (title, desc, color = BOT_COLOR) =>
new EmbedBuilder()
.setColor(color)
.setTitle(title ?? null)
.setDescription(desc ?? null)
.setTimestamp()
.setFooter({ text: `s! bot` }),

success: (title, desc) => e.base(`✅  ${title}`, desc, SUCCESS_COLOR),
error: (title, desc) => e.base(`❌  ${title}`, desc, ERROR_COLOR),
warn: (title, desc) => e.base(`⚠️  ${title}`, desc, WARN_COLOR),
info: (title, desc) => e.base(`ℹ️  ${title}`, desc, INFO_COLOR),
music: (title, desc) => e.base(`🎵  ${title}`, desc, MUSIC_COLOR),
};

/* ══════════════════════════════════════════
MUSIC SYSTEM
══════════════════════════════════════════ */

const queues = new Map();

function getQueue(guildId) {
if (!queues.has(guildId)) {
queues.set(guildId, {
songs: [],
player: createAudioPlayer(),
connection: null,
loop: false,
volume: 1,
playing: false,
});
}
return queues.get(guildId);
}

async function playSong(queue, message) {
if (!queue.songs.length) {
queue.playing = false;
if (queue.connection) {
setTimeout(() => {
const conn = getVoiceConnection(message.guild.id);
if (conn) conn.destroy();
queues.delete(message.guild.id);
}, 30000);
}
return;
}

const song = queue.songs[0];
queue.playing = true;

try {
const stream = ytdl(song.url, {
filter: “audioonly”,
quality: “highestaudio”,
highWaterMark: 1 << 25,
});

```
const resource = createAudioResource(stream, {
  inputType: StreamType.Arbitrary,
});

queue.player.play(resource);
queue.connection.subscribe(queue.player);

message.channel.send({
  embeds: [
    e.music("Now Playing", `**[${song.title}](${song.url})**\n⏱ Duration: \`${song.duration}\` | Requested by ${song.requester}`)
      .setThumbnail(song.thumbnail),
  ],
});

queue.player.once(AudioPlayerStatus.Idle, () => {
  if (queue.loop) {
    queue.songs.push(queue.songs.shift());
  } else {
    queue.songs.shift();
  }
  playSong(queue, message);
});

queue.player.on("error", (err) => {
  console.error("Player error:", err);
  queue.songs.shift();
  playSong(queue, message);
});
```

} catch (err) {
console.error(“Stream error:”, err);
queue.songs.shift();
playSong(queue, message);
}
}

/* ══════════════════════════════════════════
COOLDOWN SYSTEM
══════════════════════════════════════════ */

const cooldowns = new Collection();

function checkCooldown(userId, command, ms) {
if (!cooldowns.has(command)) cooldowns.set(command, new Collection());
const timestamps = cooldowns.get(command);
if (timestamps.has(userId)) {
const remaining = ms - (Date.now() - timestamps.get(userId));
if (remaining > 0) return `${(remaining / 1000).toFixed(1)}s`;
}
timestamps.set(userId, Date.now());
setTimeout(() => timestamps.delete(userId), ms);
return null;
}

/* ══════════════════════════════════════════
READY
══════════════════════════════════════════ */

client.once(“ready”, () => {
console.log(`✅ Logged in as ${client.user.tag}`);
client.user.setActivity(`s!help | ${client.guilds.cache.size} servers`, { type: 3 });
});

/* ══════════════════════════════════════════
MESSAGE HANDLER
══════════════════════════════════════════ */

client.on(“messageCreate”, async (message) => {
if (!message.guild || message.author.bot) return;
if (!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

const reply = (embeds) => message.channel.send({ embeds: Array.isArray(embeds) ? embeds : [embeds] });

/* ══════════════════════════════════════════
HELP COMMAND
══════════════════════════════════════════ */

if (cmd === “help”) {
const category = args[0]?.toLowerCase();

```
if (category === "music") {
  return reply(
    e.base("🎵  Music Commands", `
```

`s!play <url/title>` — Play a song from YouTube
`s!search <title>` — Search YouTube and pick a result
`s!skip` — Skip the current song
`s!stop` — Stop music and clear queue
`s!pause` — Pause playback
`s!resume` — Resume playback
`s!queue` — Show the current queue
`s!nowplaying` — Show current song
`s!loop` — Toggle loop mode
`s!shuffle` — Shuffle the queue
`s!remove <pos>` — Remove a song from queue
`s!volume <1-100>` — Set volume
`s!join` — Join your voice channel
`s!leave` — Leave voice channel
`, MUSIC_COLOR)
);
}

```
if (category === "mod") {
  return reply(
    e.base("🔨  Moderation Commands", `
```

`s!ban @user [reason]` — Ban a member
`s!unban <userID>` — Unban a user
`s!kick @user [reason]` — Kick a member
`s!mute @user [duration] [reason]` — Timeout a member
`s!unmute @user` — Remove timeout
`s!warn @user [reason]` — Warn a member
`s!warnings @user` — View a member’s warnings
`s!clearwarnings @user` — Clear warnings
`s!purge <amount>` — Delete messages (1–100)
`s!slowmode <seconds>` — Set channel slowmode
`s!lock` — Lock current channel
`s!unlock` — Unlock current channel
`s!nick @user <name>` — Change nickname
`s!role @user @role` — Add/remove a role
`, ERROR_COLOR)
);
}

```
if (category === "fun") {
  return reply(
    e.base("🎮  Fun Commands", `
```

`s!8ball <question>` — Ask the magic 8ball
`s!coinflip` — Heads or tails
`s!dice [sides]` — Roll a dice
`s!choose a | b | c` — Pick an option
`s!ship @user [@user]` — Ship two users
`s!rps <rock/paper/scissors>` — Play RPS
`s!trivia` — Random trivia question
`s!would <thing1> | <thing2>` — Would you rather
`s!rate <thing>` — Rate anything
`s!roast @user` — Roast someone
`s!compliment @user` — Compliment someone
`s!random color` — Random hex color
`s!truth` — Truth question
`s!dare` — Dare challenge
`, WARN_COLOR)
);
}

```
if (category === "utility") {
  return reply(
    e.base("🔧  Utility Commands", `
```

`s!ping` — Show bot latency
`s!uptime` — Bot uptime
`s!avatar [@user]` — Get user avatar
`s!banner [@user]` — Get user banner
`s!serverinfo` — Server information
`s!userinfo [@user]` — User information
`s!roleinfo @role` — Role information
`s!channelinfo` — Channel information
`s!botinfo` — Bot information
`s!calc <expression>` — Calculator
`s!reverse <text>` — Reverse text
`s!upper <text>` — UPPERCASE
`s!lower <text>` — lowercase
`s!mock <text>` — mOcK tExT
`s!base64 <encode/decode> <text>` — Base64
`s!password [length]` — Generate password
`s!poll <question>` — Create a poll
`s!timestamp <date>` — Convert to Discord timestamp
`, INFO_COLOR)
);
}

```
// Main help menu
return reply(
  new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle("📋  Command Categories")
    .setDescription("Use `s!help <category>` for detailed commands.")
    .addFields(
      { name: "🎵  Music", value: "`s!help music`", inline: true },
      { name: "🔨  Moderation", value: "`s!help mod`", inline: true },
      { name: "🎮  Fun", value: "`s!help fun`", inline: true },
      { name: "🔧  Utility", value: "`s!help utility`", inline: true },
    )
    .setTimestamp()
    .setFooter({ text: `Prefix: s! • ${client.guilds.cache.size} servers` })
);
```

}

/* ══════════════════════════════════════════
UTILITY COMMANDS
══════════════════════════════════════════ */

if (cmd === “ping”) {
const msg = await message.channel.send({ embeds: [e.info(“Pinging…”, “Measuring latency…”)] });
const latency = msg.createdTimestamp - message.createdTimestamp;
return msg.edit({
embeds: [
e.info(“Pong! 🏓”, `📡 Message Latency: \`${latency}ms`\n💓 API Latency: `${client.ws.ping}ms``)
],
});
}

if (cmd === “uptime”) {
const s = Math.floor(client.uptime / 1000);
const m = Math.floor(s / 60);
const h = Math.floor(m / 60);
const d = Math.floor(h / 24);
return reply(e.info(“Uptime”, `\`${d}d ${h % 24}h ${m % 60}m ${s % 60}s``));
}

if (cmd === “botinfo”) {
return reply(
new EmbedBuilder()
.setColor(BOT_COLOR)
.setTitle(“Bot Info”)
.setThumbnail(client.user.displayAvatarURL({ size: 256 }))
.addFields(
{ name: “Name”, value: client.user.tag, inline: true },
{ name: “Servers”, value: `${client.guilds.cache.size}`, inline: true },
{ name: “Users”, value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
{ name: “Prefix”, value: PREFIX, inline: true },
{ name: “Library”, value: “discord.js v14”, inline: true },
{ name: “Node.js”, value: process.version, inline: true },
)
.setTimestamp()
.setFooter({ text: “s! bot” })
);
}

if (cmd === “avatar”) {
const user = message.mentions.users.first() || message.author;
return reply(
new EmbedBuilder()
.setColor(BOT_COLOR)
.setTitle(`${user.username}'s Avatar`)
.setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
.addFields({ name: “Links”, value: `[PNG](${user.displayAvatarURL({ size: 1024, extension: "png" })}) | [JPG](${user.displayAvatarURL({ size: 1024, extension: "jpg" })}) | [WEBP](${user.displayAvatarURL({ size: 1024, extension: "webp" })})` })
);
}

if (cmd === “banner”) {
const user = await (message.mentions.users.first() || message.author).fetch();
if (!user.bannerURL()) return reply(e.warn(“No Banner”, “This user doesn’t have a banner.”));
return reply(
new EmbedBuilder()
.setColor(BOT_COLOR)
.setTitle(`${user.username}'s Banner`)
.setImage(user.bannerURL({ size: 1024, dynamic: true }))
);
}

if (cmd === “serverinfo”) {
const g = message.guild;
await g.fetch();
return reply(
new EmbedBuilder()
.setColor(BOT_COLOR)
.setTitle(g.name)
.setThumbnail(g.iconURL({ size: 256 }))
.addFields(
{ name: “Owner”, value: `<@${g.ownerId}>`, inline: true },
{ name: “Members”, value: `${g.memberCount}`, inline: true },
{ name: “Channels”, value: `${g.channels.cache.size}`, inline: true },
{ name: “Roles”, value: `${g.roles.cache.size}`, inline: true },
{ name: “Boosts”, value: `${g.premiumSubscriptionCount}`, inline: true },
{ name: “Boost Tier”, value: `Level ${g.premiumTier}`, inline: true },
{ name: “Created”, value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
{ name: “Verification”, value: g.verificationLevel.toString(), inline: true },
)
.setTimestamp()
.setFooter({ text: `ID: ${g.id}` })
);
}

if (cmd === “userinfo”) {
const member = message.mentions.members.first() || message.member;
const user = member.user;
const roles = member.roles.cache.filter(r => r.id !== message.guild.id).map(r => `<@&${r.id}>`).join(”, “) || “None”;
return reply(
new EmbedBuilder()
.setColor(member.displayHexColor || BOT_COLOR)
.setTitle(`${user.tag}`)
.setThumbnail(user.displayAvatarURL({ size: 256 }))
.addFields(
{ name: “ID”, value: user.id, inline: true },
{ name: “Nickname”, value: member.nickname || “None”, inline: true },
{ name: “Bot”, value: user.bot ? “Yes” : “No”, inline: true },
{ name: “Joined Server”, value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
{ name: “Account Created”, value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
{ name: `Roles [${member.roles.cache.size - 1}]`, value: roles.length > 1024 ? roles.substring(0, 1021) + “…” : roles },
)
.setFooter({ text: `s! bot` })
.setTimestamp()
);
}

if (cmd === “roleinfo”) {
const role = message.mentions.roles.first();
if (!role) return reply(e.error(“No Role”, “Mention a role.”));
return reply(
new EmbedBuilder()
.setColor(role.hexColor)
.setTitle(`Role: ${role.name}`)
.addFields(
{ name: “ID”, value: role.id, inline: true },
{ name: “Color”, value: role.hexColor, inline: true },
{ name: “Members”, value: `${role.members.size}`, inline: true },
{ name: “Mentionable”, value: role.mentionable ? “Yes” : “No”, inline: true },
{ name: “Hoisted”, value: role.hoist ? “Yes” : “No”, inline: true },
{ name: “Position”, value: `${role.position}`, inline: true },
{ name: “Created”, value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
)
);
}

if (cmd === “channelinfo”) {
const ch = message.channel;
return reply(
new EmbedBuilder()
.setColor(BOT_COLOR)
.setTitle(`#${ch.name}`)
.addFields(
{ name: “ID”, value: ch.id, inline: true },
{ name: “Type”, value: ch.type.toString(), inline: true },
{ name: “NSFW”, value: ch.nsfw ? “Yes” : “No”, inline: true },
{ name: “Topic”, value: ch.topic || “None” },
{ name: “Created”, value: `<t:${Math.floor(ch.createdTimestamp / 1000)}:R>`, inline: true },
)
);
}

if (cmd === “calc”) {
const expr = args.join(” “);
if (!expr) return reply(e.error(“Calc”, “Provide a math expression.”));
try {
const result = Function(`"use strict"; return (${expr})`)();
return reply(e.info(“Calculator 🧮”, `\`${expr}` = **${result}**`));
} catch {
return reply(e.error(“Calculator”, “Invalid expression.”));
}
}

if (cmd === “reverse”) {
const text = args.join(” “);
if (!text) return reply(e.error(“Reverse”, “Provide some text.”));
return reply(e.base(“🔁 Reversed”, text.split(””).reverse().join(””)));
}

if (cmd === “upper”) {
const text = args.join(” “);
return reply(e.base(“🔠 Uppercase”, text.toUpperCase()));
}

if (cmd === “lower”) {
const text = args.join(” “);
return reply(e.base(“🔡 Lowercase”, text.toLowerCase()));
}

if (cmd === “mock”) {
const text = args.join(” “);
return reply(e.base(“🤪 Mock”, text.split(””).map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(””)));
}

if (cmd === “base64”) {
const mode = args[0]?.toLowerCase();
const text = args.slice(1).join(” “);
if (!mode || !text) return reply(e.error(“Base64”, “Usage: `s!base64 encode/decode <text>`”));
try {
if (mode === “encode”) return reply(e.info(“Base64 Encode”, Buffer.from(text).toString(“base64”)));
if (mode === “decode”) return reply(e.info(“Base64 Decode”, Buffer.from(text, “base64”).toString(“utf-8”)));
return reply(e.error(“Base64”, “Use `encode` or `decode`.”));
} catch {
return reply(e.error(“Base64”, “Failed to process text.”));
}
}

if (cmd === “password”) {
const length = parseInt(args[0]) || 16;
if (length < 4 || length > 64) return reply(e.error(“Password”, “Length must be 4–64.”));
const chars = “abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*”;
let pwd = “”;
for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
try {
await message.author.send({ embeds: [e.success(“Password Generated”, `\`${pwd}`\n\n*Sent in DMs for privacy.*`)] }); return reply(e.success("Password", "Sent to your DMs! 📬")); } catch { return reply(e.warn("Password", ``${pwd}` *(Couldn’t DM you)*`));
}
}

if (cmd === “poll”) {
const question = args.join(” “);
if (!question) return reply(e.error(“Poll”, “Provide a question.”));
const pollMsg = await message.channel.send({
embeds: [
new EmbedBuilder()
.setColor(INFO_COLOR)
.setTitle(“📊  Poll”)
.setDescription(`**${question}**\n\n👍 Yes\n👎 No`)
.setFooter({ text: `Poll by ${message.author.tag}` })
.setTimestamp()
],
});
await pollMsg.react(“👍”);
await pollMsg.react(“👎”);
await message.delete().catch(() => {});
}

if (cmd === “timestamp”) {
const input = args.join(” “);
if (!input) return reply(e.error(“Timestamp”, “Provide a date string.”));
const date = new Date(input);
if (isNaN(date)) return reply(e.error(“Timestamp”, “Invalid date format.”));
const unix = Math.floor(date.getTime() / 1000);
return reply(e.info(“Timestamp 🕐”, `**Input:** ${input}\n**Unix:** \`${unix}`\n**Short:** <t:${unix}:f>\n**Relative:** <t:${unix}:R>\n**Copy:** `<t:${unix}:R>``));
}

if (cmd === “color”) {
const hex = args[0] || Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, “0”);
const clean = hex.replace(”#”, “”);
if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return reply(e.error(“Color”, “Invalid hex code.”));
const int = parseInt(clean, 16);
const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
return reply(
new EmbedBuilder()
.setColor(int)
.setTitle(`🎨  #${clean.toUpperCase()}`)
.addFields(
{ name: “HEX”, value: `#${clean.toUpperCase()}`, inline: true },
{ name: “RGB”, value: `rgb(${r}, ${g}, ${b})`, inline: true },
{ name: “INT”, value: `${int}`, inline: true },
)
);
}

/* ══════════════════════════════════════════
FUN COMMANDS
══════════════════════════════════════════ */

if (cmd === “8ball”) {
const question = args.join(” “);
if (!question) return reply(e.error(“8ball”, “Ask a question!”));
const answers = [
“It is certain.”, “It is decidedly so.”, “Without a doubt.”,
“Yes, definitely.”, “You may rely on it.”, “As I see it, yes.”,
“Most likely.”, “Outlook good.”, “Yes.”, “Signs point to yes.”,
“Reply hazy, try again.”, “Ask again later.”, “Better not tell you now.”,
“Cannot predict now.”, “Concentrate and ask again.”,
“Don’t count on it.”, “My reply is no.”, “My sources say no.”,
“Outlook not so good.”, “Very doubtful.”,
];
return reply(e.base(“🎱  Magic 8-Ball”, `**${question}**\n\n> ${answers[Math.floor(Math.random() * answers.length)]}`));
}

if (cmd === “coinflip”) {
return reply(e.base(“🪙  Coinflip”, Math.random() < 0.5 ? “**Heads!** 🦅” : “**Tails!** 🦞”));
}

if (cmd === “dice”) {
const sides = parseInt(args[0]) || 6;
if (sides < 2 || sides > 1000) return reply(e.error(“Dice”, “Sides must be 2–1000.”));
return reply(e.base(“🎲  Dice Roll”, `You rolled a **${Math.floor(Math.random() * sides) + 1}** (d${sides})`));
}

if (cmd === “choose”) {
const options = args.join(” “).split(”|”).map(x => x.trim()).filter(Boolean);
if (options.length < 2) return reply(e.error(“Choose”, “Provide at least 2 options separated by `|`.”));
return reply(e.base(“🎯  I Choose…”, `**${options[Math.floor(Math.random() * options.length)]}**`));
}

if (cmd === “ship”) {
const user1 = message.mentions.users.first() || message.author;
const user2 = message.mentions.users.at(1) || message.guild.members.cache.random()?.user;
if (!user2) return reply(e.error(“Ship”, “Mention 2 users.”));
const score = Math.floor(Math.random() * 101);
const bar = “█”.repeat(Math.floor(score / 10)) + “░”.repeat(10 - Math.floor(score / 10));
const status = score >= 80 ? “💞 Soulmates!” : score >= 60 ? “💕 Great Match!” : score >= 40 ? “💛 Pretty Good” : score >= 20 ? “💔 Rough” : “😬 Not Happening”;
return reply(e.base(“💘  Ship”, `**${user1.username}** × **${user2.username}**\n\n\`[${bar}]` **${score}%**\n${status}`));
}

if (cmd === “rps”) {
const choices = [“rock”, “paper”, “scissors”];
const user = args[0]?.toLowerCase();
if (!choices.includes(user)) return reply(e.error(“RPS”, “Choose `rock`, `paper`, or `scissors`.”));
const bot = choices[Math.floor(Math.random() * 3)];
const win = (user === “rock” && bot === “scissors”) || (user === “paper” && bot === “rock”) || (user === “scissors” && bot === “paper”);
const result = user === bot ? “It’s a **tie**! 🤝” : win ? “You **win**! 🎉” : “You **lose**! 💀”;
return reply(e.base(“✂️  Rock Paper Scissors”, `You: **${user}** | Bot: **${bot}**\n${result}`));
}

if (cmd === “rate”) {
const thing = args.join(” “);
if (!thing) return reply(e.error(“Rate”, “What should I rate?”));
const score = Math.floor(Math.random() * 11);
const bar = “⭐”.repeat(score) + “☆”.repeat(10 - score);
return reply(e.base(“⭐  Rating”, `**${thing}**\n\n${bar}\n**${score}/10**`));
}

if (cmd === “roast”) {
const user = message.mentions.users.first() || message.author;
const roasts = [
“You’re the human equivalent of a 404 error.”,
“If brains were dynamite, you couldn’t blow your nose.”,
“You’re like a cloud. When you disappear, it’s a beautiful day.”,
“I’d roast you harder but my mom said I’m not allowed to burn trash.”,
“You’re the reason they put instructions on shampoo.”,
“Your Wi-Fi signal is stronger than your personality.”,
“You’re like a software update — nobody wants you but you keep appearing.”,
“Even your reflection looks disappointed.”,
];
return reply(e.base(“🔥  Roast”, `${user} — ${roasts[Math.floor(Math.random() * roasts.length)]}`));
}

if (cmd === “compliment”) {
const user = message.mentions.users.first() || message.author;
const compliments = [
“You light up every room you walk into.”,
“You have the best laugh.”,
“You’re genuinely one of a kind.”,
“Your potential is limitless.”,
“You make the world better just by being in it.”,
“You’re smarter than you give yourself credit for.”,
“The world is a better place with you in it.”,
];
return reply(e.base(“💐  Compliment”, `${user} — ${compliments[Math.floor(Math.random() * compliments.length)]}`));
}

if (cmd === “trivia”) {
const cd = checkCooldown(message.author.id, “trivia”, 10000);
if (cd) return reply(e.warn(“Cooldown”, `Wait \`${cd}` before using trivia again.`));

```
const questions = [
  { q: "What planet is closest to the sun?", a: "mercury", choices: ["Venus", "Mercury", "Mars", "Earth"] },
  { q: "How many sides does a hexagon have?", a: "6", choices: ["5", "6", "7", "8"] },
  { q: "What is the chemical symbol for gold?", a: "au", choices: ["Go", "Gd", "Au", "Ag"] },
  { q: "What is the largest ocean on Earth?", a: "pacific", choices: ["Atlantic", "Indian", "Pacific", "Arctic"] },
  { q: "Who wrote Romeo and Juliet?", a: "shakespeare", choices: ["Dickens", "Chaucer", "Shakespeare", "Austen"] },
  { q: "How many bones are in the adult human body?", a: "206", choices: ["185", "196", "206", "215"] },
  { q: "What is the speed of light (approx)?", a: "300000 km/s", choices: ["150,000 km/s", "300,000 km/s", "450,000 km/s", "600,000 km/s"] },
  { q: "What is the largest planet in our solar system?", a: "jupiter", choices: ["Saturn", "Uranus", "Jupiter", "Neptune"] },
];

const q = questions[Math.floor(Math.random() * questions.length)];
const triviaMsg = await reply(
  new EmbedBuilder()
    .setColor(WARN_COLOR)
    .setTitle("🧠  Trivia")
    .setDescription(`**${q.q}**\n\n${q.choices.map((c, i) => `${["🇦","🇧","🇨","🇩"][i]} ${c}`).join("\n")}`)
    .setFooter({ text: "You have 15 seconds to answer!" })
);

const emojis = ["🇦", "🇧", "🇨", "🇩"];
for (const emoji of emojis) await triviaMsg.react(emoji);

const filter = (reaction, user) => emojis.includes(reaction.emoji.name) && user.id === message.author.id;
try {
  const collected = await triviaMsg.awaitReactions({ filter, max: 1, time: 15000, errors: ["time"] });
  const picked = q.choices[emojis.indexOf(collected.first().emoji.name)];
  const correct = picked.toLowerCase() === q.a.toLowerCase() || q.a.toLowerCase().includes(picked.toLowerCase());
  await triviaMsg.edit({
    embeds: [
      e.base("🧠  Trivia", `**${q.q}**\n\nYou chose: **${picked}**\nCorrect answer: **${q.choices.find(c => c.toLowerCase() === q.a.toLowerCase() || q.a.toLowerCase().includes(c.toLowerCase()))}**\n\n${correct ? "✅ Correct! 🎉" : "❌ Wrong!"}`, correct ? SUCCESS_COLOR : ERROR_COLOR)
    ],
  });
} catch {
  await triviaMsg.edit({
    embeds: [e.warn("Trivia", `Time's up! The answer was: **${q.choices.find(c => c.toLowerCase() === q.a.toLowerCase() || q.a.toLowerCase().includes(c.toLowerCase()))}**`)],
  });
}
return;
```

}

if (cmd === “would”) {
const options = args.join(” “).split(”|”).map(x => x.trim());
if (options.length < 2) return reply(e.error(“Would”, “Format: `s!would option1 | option2`”));
return reply(e.base(“🤔  Would You Rather…”, `**${options[0]}**\n\nor\n\n**${options[1]}**`));
}

if (cmd === “truth”) {
const truths = [
“What’s your biggest regret?”, “What’s your most embarrassing moment?”,
“Have you ever lied to a friend?”, “What’s your biggest fear?”,
“What’s something you’ve never told anyone?”, “What’s the last lie you told?”,
];
return reply(e.base(“💬  Truth”, truths[Math.floor(Math.random() * truths.length)]));
}

if (cmd === “dare”) {
const dares = [
“Send a voice message saying a tongue twister.”, “Change your nickname to something embarrassing for 1 hour.”,
“Post a childhood photo.”, “Type with your eyes closed for the next 5 messages.”,
“Speak in rhymes for the next 10 minutes.”, “DM someone a meme.”,
];
return reply(e.base(“🎯  Dare”, dares[Math.floor(Math.random() * dares.length)]));
}

if (cmd === “joke”) {
const jokes = [
“I told my computer I needed a break. Now it won’t stop sending me Kit-Kat ads.”,
“Why do programmers prefer dark mode? Because light attracts bugs.”,
“I would tell you a UDP joke but you might not get it.”,
“Why did the developer go broke? Because he used up all his cache.”,
“There are 10 types of people: those who understand binary and those who don’t.”,
“How do you comfort a JavaScript bug? You console it.”,
“A SQL query walks into a bar, sees two tables and asks… Can I join you?”,
];
return reply(e.base(“😂  Joke”, jokes[Math.floor(Math.random() * jokes.length)]));
}

if (cmd === “fact”) {
const facts = [
“Octopuses have 3 hearts and blue blood.”, “Bananas are technically berries but strawberries aren’t.”,
“Sharks are older than trees.”, “A day on Venus is longer than a year on Venus.”,
“Honey never spoils — archaeologists found 3000-year-old honey in Egyptian tombs.”,
“The human brain generates about 20 watts of electrical power.”,
“There are more possible chess games than atoms in the observable universe.”,
];
return reply(e.base(“📘  Random Fact”, facts[Math.floor(Math.random() * facts.length)]));
}

if (cmd === “quote”) {
const quotes = [
{ q: “Stay consistent.”, a: “Unknown” },
{ q: “Small steps compound into giant leaps.”, a: “Unknown” },
{ q: “Discipline is freedom.”, a: “Jocko Willink” },
{ q: “The secret of getting ahead is getting started.”, a: “Mark Twain” },
{ q: “You don’t rise to the level of your goals, you fall to the level of your systems.”, a: “James Clear” },
{ q: “Hard work beats talent when talent doesn’t work hard.”, a: “Tim Notke” },
];
const pick = quotes[Math.floor(Math.random() * quotes.length)];
return reply(e.base(“💭  Quote”, `*"${pick.q}"*\n— **${pick.a}**`));
}

/* ══════════════════════════════════════════
MODERATION COMMANDS
══════════════════════════════════════════ */

const warnings = new Map(); // In-memory warning store

if (cmd === “ban”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return reply(e.error(“No Permission”, “You need **Ban Members** permission.”));
if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers))
return reply(e.error(“Bot No Permission”, “I need **Ban Members** permission.”));

```
const target = message.mentions.members.first();
if (!target) return reply(e.error("Ban", "Mention a member to ban."));
if (!target.bannable) return reply(e.error("Ban", "I cannot ban that member."));

const reason = args.slice(1).join(" ") || "No reason provided";

try {
  await target.send({ embeds: [e.error("Banned", `You were banned from **${message.guild.name}**\nReason: ${reason}`)] }).catch(() => {});
  await target.ban({ reason });
  return reply(e.success("Banned", `**${target.user.tag}** has been banned.\nReason: ${reason}`));
} catch {
  return reply(e.error("Ban Failed", "Could not ban that member."));
}
```

}

if (cmd === “unban”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return reply(e.error(“No Permission”, “You need **Ban Members** permission.”));

```
const userId = args[0];
if (!userId) return reply(e.error("Unban", "Provide a user ID."));

try {
  await message.guild.members.unban(userId);
  return reply(e.success("Unbanned", `User \`${userId}\` has been unbanned.`));
} catch {
  return reply(e.error("Unban Failed", "Could not unban. Is the ID correct?"));
}
```

}

if (cmd === “kick”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
return reply(e.error(“No Permission”, “You need **Kick Members** permission.”));

```
const target = message.mentions.members.first();
if (!target) return reply(e.error("Kick", "Mention a member."));
if (!target.kickable) return reply(e.error("Kick", "I cannot kick that member."));

const reason = args.slice(1).join(" ") || "No reason provided";

try {
  await target.send({ embeds: [e.warn("Kicked", `You were kicked from **${message.guild.name}**\nReason: ${reason}`)] }).catch(() => {});
  await target.kick(reason);
  return reply(e.success("Kicked", `**${target.user.tag}** has been kicked.\nReason: ${reason}`));
} catch {
  return reply(e.error("Kick Failed", "Could not kick that member."));
}
```

}

if (cmd === “mute”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
return reply(e.error(“No Permission”, “You need **Timeout Members** permission.”));

```
const target = message.mentions.members.first();
if (!target) return reply(e.error("Mute", "Mention a member."));

// Parse duration: e.g. 10m, 1h, 1d
let durationMs = 10 * 60 * 1000; // default 10 min
const durationArg = args[1];
if (durationArg) {
  const match = durationArg.match(/^(\d+)(s|m|h|d)$/);
  if (match) {
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    durationMs = parseInt(match[1]) * mult[match[2]];
  }
}

const reason = args.slice(2).join(" ") || "No reason provided";

try {
  await target.timeout(durationMs, reason);
  return reply(e.success("Muted", `**${target.user.tag}** has been timed out for \`${durationArg || "10m"}\`.\nReason: ${reason}`));
} catch {
  return reply(e.error("Mute Failed", "Could not mute that member."));
}
```

}

if (cmd === “unmute”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
return reply(e.error(“No Permission”, “You need **Timeout Members** permission.”));

```
const target = message.mentions.members.first();
if (!target) return reply(e.error("Unmute", "Mention a member."));

try {
  await target.timeout(null);
  return reply(e.success("Unmuted", `**${target.user.tag}**'s timeout has been removed.`));
} catch {
  return reply(e.error("Unmute Failed", "Could not unmute that member."));
}
```

}

if (cmd === “warn”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
return reply(e.error(“No Permission”, “You need **Manage Messages** permission.”));

```
const target = message.mentions.members.first();
if (!target) return reply(e.error("Warn", "Mention a member."));

const reason = args.slice(1).join(" ") || "No reason provided";
const key = `${message.guild.id}-${target.id}`;

if (!warnings.has(key)) warnings.set(key, []);
warnings.get(key).push({ reason, by: message.author.tag, at: Date.now() });

await target.send({ embeds: [e.warn("Warning", `You received a warning in **${message.guild.name}**\nReason: ${reason}`)] }).catch(() => {});
return reply(e.success("Warned", `**${target.user.tag}** has been warned.\nReason: ${reason}\nTotal warnings: **${warnings.get(key).length}**`));
```

}

if (cmd === “warnings”) {
const target = message.mentions.members.first() || message.member;
const key = `${message.guild.id}-${target.id}`;
const list = warnings.get(key);

```
if (!list || !list.length) return reply(e.info("Warnings", `**${target.user.tag}** has no warnings.`));

const formatted = list.map((w, i) => `**${i + 1}.** ${w.reason} — by ${w.by} (<t:${Math.floor(w.at / 1000)}:R>)`).join("\n");
return reply(e.warn("Warnings", `**${target.user.tag}** — ${list.length} warning(s)\n\n${formatted}`));
```

}

if (cmd === “clearwarnings”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
return reply(e.error(“No Permission”, “You need **Manage Messages** permission.”));

```
const target = message.mentions.members.first();
if (!target) return reply(e.error("Clearwarnings", "Mention a member."));

const key = `${message.guild.id}-${target.id}`;
warnings.delete(key);
return reply(e.success("Warnings Cleared", `All warnings for **${target.user.tag}** have been cleared.`));
```

}

if (cmd === “purge”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
return reply(e.error(“No Permission”, “You need **Manage Messages** permission.”));

```
const amount = parseInt(args[0]);
if (!amount || amount < 1 || amount > 100) return reply(e.error("Purge", "Provide a number between 1–100."));

try {
  await message.delete();
  const deleted = await message.channel.bulkDelete(amount, true);
  const msg = await reply(e.success("Purge", `Deleted **${deleted.size}** messages.`));
  setTimeout(() => msg.delete().catch(() => {}), 3000);
} catch {
  return reply(e.error("Purge Failed", "Couldn't delete messages. They may be older than 14 days."));
}
```

}

if (cmd === “slowmode”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return reply(e.error(“No Permission”, “You need **Manage Channels** permission.”));

```
const seconds = parseInt(args[0]);
if (isNaN(seconds) || seconds < 0 || seconds > 21600) return reply(e.error("Slowmode", "Provide a value between 0–21600."));

try {
  await message.channel.setRateLimitPerUser(seconds);
  return reply(e.success("Slowmode", seconds === 0 ? "Slowmode disabled." : `Slowmode set to **${seconds}s**.`));
} catch {
  return reply(e.error("Slowmode Failed", "Couldn't set slowmode."));
}
```

}

if (cmd === “lock”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return reply(e.error(“No Permission”, “You need **Manage Channels** permission.”));

```
try {
  await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
  return reply(e.success("Channel Locked", `🔒 **#${message.channel.name}** is now locked.`));
} catch {
  return reply(e.error("Lock Failed", "Couldn't lock the channel."));
}
```

}

if (cmd === “unlock”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return reply(e.error(“No Permission”, “You need **Manage Channels** permission.”));

```
try {
  await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
  return reply(e.success("Channel Unlocked", `🔓 **#${message.channel.name}** is now unlocked.`));
} catch {
  return reply(e.error("Unlock Failed", "Couldn't unlock the channel."));
}
```

}

if (cmd === “nick”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames))
return reply(e.error(“No Permission”, “You need **Manage Nicknames** permission.”));

```
const target = message.mentions.members.first();
if (!target) return reply(e.error("Nick", "Mention a member."));
const nick = args.slice(1).join(" ") || null;

try {
  await target.setNickname(nick);
  return reply(e.success("Nickname Changed", `**${target.user.tag}**'s nickname is now: ${nick || "*(cleared)*"}`));
} catch {
  return reply(e.error("Nick Failed", "Couldn't change nickname."));
}
```

}

if (cmd === “role”) {
if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
return reply(e.error(“No Permission”, “You need **Manage Roles** permission.”));

```
const target = message.mentions.members.first();
const role = message.mentions.roles.first();
if (!target || !role) return reply(e.error("Role", "Mention a member and a role."));

try {
  if (target.roles.cache.has(role.id)) {
    await target.roles.remove(role);
    return reply(e.success("Role Removed", `Removed **${role.name}** from **${target.user.tag}**.`));
  } else {
    await target.roles.add(role);
    return reply(e.success("Role Added", `Added **${role.name}** to **${target.user.tag}**.`));
  }
} catch {
  return reply(e.error("Role Failed", "Couldn't modify role. Check my role hierarchy."));
}
```

}

/* ══════════════════════════════════════════
MUSIC COMMANDS
══════════════════════════════════════════ */

if (cmd === “join”) {
const voice = message.member.voice.channel;
if (!voice) return reply(e.error(“Join”, “You need to be in a voice channel.”));
joinVoiceChannel({ channelId: voice.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator });
return reply(e.music(“Joined”, `Connected to **${voice.name}**.`));
}

if (cmd === “leave”) {
const conn = getVoiceConnection(message.guild.id);
if (!conn) return reply(e.error(“Leave”, “I’m not in a voice channel.”));
conn.destroy();
queues.delete(message.guild.id);
return reply(e.music(“Left”, “Disconnected from voice channel.”));
}

if (cmd === “play” || cmd === “p”) {
const voice = message.member.voice.channel;
if (!voice) return reply(e.error(“Play”, “Join a voice channel first.”));
if (!args.length) return reply(e.error(“Play”, “Provide a YouTube URL or song title.”));

```
const query = args.join(" ");
let url, title, duration, thumbnail;

try {
  if (ytdl.validateURL(query)) {
    url = query;
    const info = await ytdl.getBasicInfo(url);
    title = info.videoDetails.title;
    duration = formatDuration(parseInt(info.videoDetails.lengthSeconds));
    thumbnail = info.videoDetails.thumbnails[0]?.url;
  } else {
    const search = await ytSearch(query);
    const video = search.videos[0];
    if (!video) return reply(e.error("Play", "No results found."));
    url = video.url;
    title = video.title;
    duration = video.timestamp;
    thumbnail = video.thumbnail;
  }
} catch {
  return reply(e.error("Play", "Failed to fetch song info. Try a direct YouTube URL."));
}

const queue = getQueue(message.guild.id);

if (!queue.connection || getVoiceConnection(message.guild.id)?.state.status === "destroyed") {
  queue.connection = joinVoiceChannel({
    channelId: voice.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
  });
}

queue.songs.push({ url, title, duration, thumbnail, requester: message.author.toString() });

if (queue.playing) {
  return reply(e.music("Added to Queue", `**[${title}](${url})**\nPosition: **#${queue.songs.length}** | Duration: \`${duration}\``).setThumbnail(thumbnail));
} else {
  playSong(queue, message);
}
return;
```

}

if (cmd === “search”) {
const query = args.join(” “);
if (!query) return reply(e.error(“Search”, “Provide a search query.”));

```
try {
  const results = await ytSearch(query);
  const videos = results.videos.slice(0, 5);
  if (!videos.length) return reply(e.error("Search", "No results found."));

  const desc = videos.map((v, i) => `**${i + 1}.** [${v.title}](${v.url}) \`${v.timestamp}\``).join("\n");
  const searchMsg = await reply(e.music("Search Results", `${desc}\n\nReply with a number (1-5) to play.`));

  const filter = m => m.author.id === message.author.id && /^[1-5]$/.test(m.content.trim());
  try {
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ["time"] });
    const pick = parseInt(collected.first().content.trim()) - 1;
    const chosen = videos[pick];

    const voice = message.member.voice.channel;
    if (!voice) return reply(e.error("Play", "Join a voice channel first."));

    const queue = getQueue(message.guild.id);
    if (!queue.connection || getVoiceConnection(message.guild.id)?.state.status === "destroyed") {
      queue.connection = joinVoiceChannel({
        channelId: voice.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
    }

    queue.songs.push({ url: chosen.url, title: chosen.title, duration: chosen.timestamp, thumbnail: chosen.thumbnail, requester: message.author.toString() });

    if (!queue.playing) {
      playSong(queue, message);
    } else {
      reply(e.music("Added to Queue", `**[${chosen.title}](${chosen.url})**\nPosition: **#${queue.songs.length}**`));
    }
  } catch {
    reply(e.warn("Search", "Timed out. No song selected."));
  }
} catch {
  return reply(e.error("Search", "Failed to search YouTube."));
}
return;
```

}

if (cmd === “skip” || cmd === “s”) {
const queue = getQueue(message.guild.id);
if (!queue.playing) return reply(e.error(“Skip”, “Nothing is playing.”));
queue.player.stop();
return reply(e.music(“Skipped”, “Skipped to next song.”));
}

if (cmd === “stop”) {
const queue = getQueue(message.guild.id);
queue.songs = [];
queue.playing = false;
queue.player.stop();
const conn = getVoiceConnection(message.guild.id);
if (conn) conn.destroy();
queues.delete(message.guild.id);
return reply(e.music(“Stopped”, “Music stopped and queue cleared.”));
}

if (cmd === “pause”) {
const queue = getQueue(message.guild.id);
if (!queue.playing) return reply(e.error(“Pause”, “Nothing is playing.”));
queue.player.pause();
return reply(e.music(“Paused”, “Playback paused. Use `s!resume` to continue.”));
}

if (cmd === “resume”) {
const queue = getQueue(message.guild.id);
queue.player.unpause();
return reply(e.music(“Resumed”, “Playback resumed.”));
}

if (cmd === “queue” || cmd === “q”) {
const queue = getQueue(message.guild.id);
if (!queue.songs.length) return reply(e.music(“Queue”, “The queue is empty.”));

```
const current = queue.songs[0];
const upcoming = queue.songs.slice(1, 11);

const desc = [
  `**Now Playing:**\n🎵 [${current.title}](${current.url}) \`${current.duration}\``,
  upcoming.length ? `\n**Up Next:**\n${upcoming.map((s, i) => `**${i + 1}.** [${s.title}](${s.url}) \`${s.duration}\``).join("\n")}` : "",
  queue.songs.length > 11 ? `\n\n*...and ${queue.songs.length - 11} more*` : "",
].join("");

return reply(
  e.music(`Queue — ${queue.songs.length} songs`, desc)
    .setThumbnail(current.thumbnail)
    .addFields({ name: "Loop", value: queue.loop ? "✅ On" : "❌ Off", inline: true })
);
```

}

if (cmd === “nowplaying” || cmd === “np”) {
const queue = getQueue(message.guild.id);
if (!queue.playing || !queue.songs.length) return reply(e.error(“Now Playing”, “Nothing is playing.”));
const song = queue.songs[0];
return reply(e.music(“Now Playing”, `**[${song.title}](${song.url})**\n⏱ Duration: \`${song.duration}` | Requested by ${song.requester}`).setThumbnail(song.thumbnail));
}

if (cmd === “loop”) {
const queue = getQueue(message.guild.id);
queue.loop = !queue.loop;
return reply(e.music(“Loop”, `Loop is now **${queue.loop ? "enabled ✅" : "disabled ❌"}**.`));
}

if (cmd === “shuffle”) {
const queue = getQueue(message.guild.id);
if (queue.songs.length < 2) return reply(e.error(“Shuffle”, “Not enough songs in queue.”));
const current = queue.songs.shift();
for (let i = queue.songs.length - 1; i > 0; i–) {
const j = Math.floor(Math.random() * (i + 1));
[queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
}
queue.songs.unshift(current);
return reply(e.music(“Shuffled”, “The queue has been shuffled.”));
}

if (cmd === “remove”) {
const queue = getQueue(message.guild.id);
const pos = parseInt(args[0]);
if (!pos || pos < 1 || pos > queue.songs.length) return reply(e.error(“Remove”, `Provide a valid position (1–${queue.songs.length}).`));
const removed = queue.songs.splice(pos, 1)[0];
return reply(e.music(“Removed”, `Removed **${removed.title}** from the queue.`));
}

if (cmd === “volume” || cmd === “vol”) {
return reply(e.warn(“Volume”, “Volume control requires `@discordjs/voice` resource volume transformer. For now, use `s!stop` and rejoin.”));
}

});

/* ══════════════════════════════════════════
HELPER: FORMAT DURATION
══════════════════════════════════════════ */

function formatDuration(seconds) {
const h = Math.floor(seconds / 3600);
const m = Math.floor((seconds % 3600) / 60);
const s = seconds % 60;
return h > 0
? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
: `${m}:${String(s).padStart(2, "0")}`;
}

/* ══════════════════════════════════════════
AUTO-DISCONNECT ON EMPTY CHANNEL
══════════════════════════════════════════ */

client.on(“voiceStateUpdate”, (oldState) => {
const conn = getVoiceConnection(oldState.guild.id);
if (!conn) return;
const channel = oldState.guild.channels.cache.get(conn.joinConfig.channelId);
if (channel && channel.members.filter(m => !m.user.bot).size === 0) {
setTimeout(() => {
const c = oldState.guild.channels.cache.get(conn.joinConfig.channelId);
if (c && c.members.filter(m => !m.user.bot).size === 0) {
conn.destroy();
queues.delete(oldState.guild.id);
}
}, 30000);
}
});

/* ══════════════════════════════════════════
ERROR HANDLING
══════════════════════════════════════════ */

process.on(“unhandledRejection”, (err) => console.error(“Unhandled rejection:”, err));
process.on(“uncaughtException”, (err) => console.error(“Uncaught exception:”, err));

client.login(process.env.DISCORD_TOKEN);
