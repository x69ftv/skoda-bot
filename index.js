const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ApplicationCommandOptionType,
} = require("discord.js");

const token = process.env.DISCORD_TOKEN;
const prefix = ",";

if (!token) throw new Error("Missing DISCORD_TOKEN");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

/* =========================
   🌙 AURA GIF
========================= */

const auraGif =
  "https://media1.tenor.com/m/pJoX_nEXbS4AAAAC/sorrow-angel.gif";

/* =========================
   ✨ EMBED STYLE
========================= */

function embed(title, desc, color = "#7c3aed") {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc)
    .setImage(auraGif)
    .setTimestamp()
    .setFooter({ text: "Aura Bot • Premium Moderation" });
}

/* =========================
   🎲 UTIL
========================= */

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* =========================
   🚀 READY
========================= */

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* =========================
   💬 PREFIX COMMANDS
========================= */

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  /* =========================
     🧠 BASIC
  ========================= */

  if (cmd === "ping")
    return message.channel.send({
      embeds: [embed("🏓 Ping", `${client.ws.ping}ms`)],
    });

  if (cmd === "help")
    return message.channel.send({
      embeds: [
        embed(
          "📖 Help Menu",
          `
**Moderation**
,kick ,ban ,purge

**Fun**
,8ball ,coinflip ,joke

**Utility**
,avatar ,userinfo ,serverinfo
        `
        ),
      ],
    });

  /* =========================
     🎮 FUN
  ========================= */

  if (cmd === "8ball") {
    const res = ["Yes", "No", "Maybe", "Definitely", "Ask again"];
    return message.channel.send({
      embeds: [embed("🎱 8Ball", random(res))],
    });
  }

  if (cmd === "coinflip") {
    return message.channel.send({
      embeds: [embed("🪙 Coinflip", random(["Heads", "Tails"]))],
    });
  }

  if (cmd === "joke") {
    return message.channel.send({
      embeds: [
        embed(
          "😂 Joke",
          random([
            "Why did the coder quit? Too many bugs.",
            "Debugging is like being the detective in a crime movie.",
          ])
        ),
      ],
    });
  }

  /* =========================
     🛡️ MODERATION (WITH GIF)
  ========================= */

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return;

    const user = message.mentions.members.first();
    if (!user) return;

    await user.kick();

    return message.channel.send({
      embeds: [
        embed("👢 Kick", `${user.user.tag} was kicked from the server.`),
      ],
    });
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return;

    const user = message.mentions.members.first();
    if (!user) return;

    await user.ban();

    return message.channel.send({
      embeds: [
        embed("⛔ Ban", `${user.user.tag} was banned from the server.`),
      ],
    });
  }

  if (cmd === "purge") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return;

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return;

    await message.channel.bulkDelete(amount);

    return message.channel.send({
      embeds: [embed("🧹 Purge", `Deleted ${amount} messages.`)],
    });
  }

  /* =========================
     👤 UTILITY
  ========================= */

  if (cmd === "avatar") {
    const user = message.mentions.users.first() || message.author;

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#7c3aed")
          .setTitle("🖼 Avatar")
          .setImage(user.displayAvatarURL({ size: 1024 }))
          .setFooter({ text: "Aura Bot" }),
      ],
    });
  }

  if (cmd === "userinfo") {
    const user = message.mentions.members.first() || message.member;

    return message.channel.send({
      embeds: [
        embed(
          "👤 User Info",
          `User: ${user.user.tag}\nID: ${user.id}`
        ),
      ],
    });
  }

  if (cmd === "serverinfo") {
    return message.channel.send({
      embeds: [
        embed(
          "🏠 Server Info",
          `Name: ${message.guild.name}\nMembers: ${message.guild.memberCount}`
        ),
      ],
    });
  }
});

/* =========================
   ⚡ SLASH COMMANDS
========================= */

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    return interaction.reply({
      embeds: [embed("🏓 Ping", `${client.ws.ping}ms`)],
    });
  }

  if (interaction.commandName === "coinflip") {
    return interaction.reply({
      embeds: [embed("🪙 Coinflip", random(["Heads", "Tails"]))],
    });
  }

  if (interaction.commandName === "8ball") {
    const q = interaction.options.getString("question");

    return interaction.reply({
      embeds: [
        embed(
          "🎱 8Ball",
          `Q: ${q}\nA: ${random(["Yes", "No", "Maybe"])}`
        ),
      ],
    });
  }
});

/* =========================
   🚀 LOGIN
========================= */

client.login(token);
