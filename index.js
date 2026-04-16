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

/* ───────────── BOT SETUP ───────────── */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const prefix = ",";

/* ───────────── PREMIUM EMBED STYLE ───────────── */

function makeEmbed(title, desc) {
  return new EmbedBuilder()
    .setColor(0x9b59b6) // premium purple
    .setTitle(title || null)
    .setDescription(desc || null)
    .setTimestamp()
    .setFooter({ text: "Premium Bot" });
}

/* ───────────── MUSIC SYSTEM ───────────── */

const servers = new Map();

function getServer(guildId) {
  if (!servers.has(guildId)) {
    servers.set(guildId, {
      queue: [],
      player: createAudioPlayer(),
      connection: null,
    });
  }
  return servers.get(guildId);
}

/* ───────────── READY ───────────── */

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* ───────────── COMMANDS ───────────── */

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

/* ───────── HELP ───────── */

  if (cmd === "help") {
    return message.channel.send({
      embeds: [
        makeEmbed(
          "📌 Commands",
`
🎧 MUSIC
,play <url>
,skip
,stop

💬 GENERAL
,ping
,avatar
,serverinfo
`
          ),
      ],
    });
  }

/* ───────── PING ───────── */

  if (cmd === "ping") {
    return message.channel.send({
      embeds: [makeEmbed("🏓 Pong", `${client.ws.ping}ms`)],
    });
  }

/* ───────── AVATAR ───────── */

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

/* ───────── SERVER INFO ───────── */

  if (cmd === "serverinfo") {
    return message.channel.send({
      embeds: [
        makeEmbed(
          "Server Info",
          `Name: ${message.guild.name}
Members: ${message.guild.memberCount}`
        ),
      ],
    });
  }

/* ───────── MUSIC PLAY ───────── */

  if (cmd === "play") {
    const url = args[0];
    if (!url || !ytdl.validateURL(url)) {
      return message.channel.send({
        embeds: [makeEmbed("Error", "Invalid YouTube URL")],
      });
    }

    const voice = message.member.voice.channel;
    if (!voice) return message.reply("join a voice channel first");

    const server = getServer(message.guild.id);

    const connection = joinVoiceChannel({
      channelId: voice.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    server.connection = connection;

    server.queue.push(url);

    const playNext = () => {
      if (!server.queue.length) return;

      const stream = ytdl(server.queue[0], {
        filter: "audioonly",
        quality: "highestaudio",
      });

      const resource = createAudioResource(stream);

      server.player.play(resource);
      connection.subscribe(server.player);

      server.player.once(AudioPlayerStatus.Idle, () => {
        server.queue.shift();
        playNext();
      });
    };

    playNext();

    return message.channel.send({
      embeds: [makeEmbed("🎶 Now Playing", url)],
    });
  }

/* ───────── SKIP ───────── */

  if (cmd === "skip") {
    const server = getServer(message.guild.id);
    server.player.stop();
    return message.channel.send({
      embeds: [makeEmbed("Skipped ▶️")],
    });
  }

/* ───────── STOP ───────── */

  if (cmd === "stop") {
    const server = getServer(message.guild.id);
    server.queue = [];
    server.player.stop();
    return message.channel.send({
      embeds: [makeEmbed("⏹ Stopped")],
    });
  }
});

/* ───────── LOGIN ───────── */

client.login(process.env.DISCORD_TOKEN);

npm install discord.js @discordjs/voice ytdl-core
