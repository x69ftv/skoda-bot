const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");

/* ───── CLIENT ───── */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const prefix = ",";

/* ───── PREMIUM EMBED STYLE ───── */

const embed = (title, desc, color = 0x9b59b6) =>
  new EmbedBuilder()
    .setColor(color)
    .setTitle(title || null)
    .setDescription(desc || null)
    .setTimestamp()
    .setFooter({ text: "Premium Bot • v2" });

/* ───── MUSIC SYSTEM ───── */

const servers = new Map();

function getServer(id) {
  if (!servers.has(id)) {
    servers.set(id, {
      queue: [],
      player: createAudioPlayer(),
      connection: null,
    });
  }
  return servers.get(id);
}

/* ───── READY ───── */

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* ───── COMMANDS ───── */

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

/* ───────────────── HELP ───────────────── */

if (cmd === "help") {
  return message.channel.send({
    embeds: [
      embed(
        "📌 Command Panel",
`
🎧 MUSIC
,play <url>
,skip
,stop

💬 INFO
,ping
,avatar
,serverinfo
,userinfo

🎮 FUN
,8ball <question>
,coinflip
,dice
,choose a | b | c
,ship @user @user

🧠 TEXT
,reverse text
,upper text
,lower text
,calc 5+5

😂 RANDOM
,joke
,fact
,quote
`
      ),
    ],
  });
}

/* ───────────────── PING ───────────────── */

if (cmd === "ping") {
  return message.channel.send({ embeds: [embed("🏓 Pong", `${client.ws.ping}ms`)] });
}

/* ───────────────── AVATAR ───────────────── */

if (cmd === "avatar") {
  const user = message.mentions.users.first() || message.author;

  return message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`${user.username}'s Avatar`)
        .setImage(user.displayAvatarURL({ size: 1024 })),
    ],
  });
}

/* ───────────────── SERVER INFO ───────────────── */

if (cmd === "serverinfo") {
  return message.channel.send({
    embeds: [
      embed(
        "Server Info",
        `Name: ${message.guild.name}
Members: ${message.guild.memberCount}
Created: <t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`
      ),
    ],
  });
}

/* ───────────────── USER INFO ───────────────── */

if (cmd === "userinfo") {
  const user = message.mentions.members.first() || message.member;

  return message.channel.send({
    embeds: [
      embed(
        "User Info",
        `User: ${user.user.tag}
ID: ${user.id}
Joined: <t:${Math.floor(user.joinedTimestamp / 1000)}:R>`
      ),
    ],
  });
}

/* ───────────────── FUN COMMANDS ───────────────── */

if (cmd === "8ball") {
  const answers = ["yes", "no", "maybe", "definitely", "ask again"];
  return message.channel.send({ embeds: [embed("🎱 8ball", answers[Math.floor(Math.random()*answers.length)])] });
}

if (cmd === "coinflip") {
  return message.channel.send({ embeds: [embed("🪙 Coinflip", Math.random() < 0.5 ? "heads" : "tails")] });
}

if (cmd === "dice") {
  return message.channel.send({ embeds: [embed("🎲 Dice", `${Math.floor(Math.random()*6)+1}`)] });
}

if (cmd === "choose") {
  const options = args.join(" ").split("|").map(x => x.trim());
  return message.channel.send({ embeds: [embed("🎯 Choice", options[Math.floor(Math.random()*options.length)])] });
}

if (cmd === "ship") {
  return message.channel.send({ embeds: [embed("💘 Ship", `${Math.floor(Math.random()*101)}% compatible`)] });
}

/* ───────────────── TEXT COMMANDS ───────────────── */

if (cmd === "reverse") {
  return message.channel.send(embed("🔁 Reverse", args.join(" ").split("").reverse().join("")));
}

if (cmd === "upper") {
  return message.channel.send(embed("🔠 Upper", args.join(" ").toUpperCase()));
}

if (cmd === "lower") {
  return message.channel.send(embed("🔡 Lower", args.join(" ").toLowerCase()));
}

if (cmd === "calc") {
  try {
    const result = eval(args.join(" "));
    return message.channel.send(embed("🧮 Calculator", String(result)));
  } catch {
    return message.channel.send(embed("Error", "invalid math"));
  }
}

/* ───────────────── RANDOM FUN ───────────────── */

if (cmd === "joke") {
  const jokes = [
    "I told my computer I needed a break… it froze.",
    "Why do programmers hate nature? too many bugs",
    "I would tell you a UDP joke but you might not get it"
  ];
  return message.channel.send(embed("😂 Joke", jokes[Math.floor(Math.random()*jokes.length)]));
}

if (cmd === "fact") {
  const facts = ["octopuses have 3 hearts", "bananas are berries", "sharks existed before trees"];
  return message.channel.send(embed("📘 Fact", facts[Math.floor(Math.random()*facts.length)]));
}

if (cmd === "quote") {
  const quotes = ["stay consistent", "small steps matter", "discipline wins"];
  return message.channel.send(embed("💭 Quote", quotes[Math.floor(Math.random()*quotes.length)]));
}

/* ───────────────── MUSIC ───────────────── */

if (cmd === "play") {
  const url = args[0];
  if (!url || !ytdl.validateURL(url)) return message.reply("invalid url");

  const voice = message.member.voice.channel;
  if (!voice) return message.reply("join a voice channel");

  const server = getServer(message.guild.id);

  const connection = joinVoiceChannel({
    channelId: voice.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
  });

  server.connection = connection;
  server.queue.push(url);

  const play = () => {
    if (!server.queue.length) return;

    const stream = ytdl(server.queue[0], { filter: "audioonly" });
    const resource = createAudioResource(stream);

    server.player.play(resource);
    connection.subscribe(server.player);

    server.player.once(AudioPlayerStatus.Idle, () => {
      server.queue.shift();
      play();
    });
  };

  play();

  return message.channel.send({ embeds: [embed("🎶 Playing", url)] });
}

if (cmd === "skip") {
  const server = getServer(message.guild.id);
  server.player.stop();
  return message.channel.send(embed("⏭ Skipped"));
}

if (cmd === "stop") {
  const server = getServer(message.guild.id);
  server.queue = [];
  server.player.stop();
  return message.channel.send(embed("⏹ Stopped"));
}

});

client.login(process.env.DISCORD_TOKEN);

npm install discord.js @discordjs/voice ytdl-core
