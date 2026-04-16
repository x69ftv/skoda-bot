const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
   🌙 AURA CORE
========================= */

const auraGif =
  "https://media1.tenor.com/m/pJoX_nEXbS4AAAAC/sorrow-angel.gif";

/* =========================
   ✨ PREMIUM EMBED SYSTEM
========================= */

function ui(title, desc, color = "#7c3aed") {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc)
    .setImage(auraGif)
    .setTimestamp()
    .setFooter({ text: "Premium OS • Aura System" });
}

/* =========================
   🎲 UTILS
========================= */

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* =========================
   📜 MOD LOG SYSTEM
========================= */

let modLogChannelId = null;

/* =========================
   🚀 READY
========================= */

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* =========================
   🎛️ HELP MENU (BUTTON UI)
========================= */

function helpMenu() {
  const embed = ui(
    "💠 Aura OS Control Panel",
    "Choose a category below:"
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mod")
      .setLabel("Moderation")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("fun")
      .setLabel("Fun")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("util")
      .setLabel("Utility")
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

/* =========================
   💬 PREFIX COMMANDS
========================= */

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  /* ===== HELP MENU ===== */
  if (cmd === "help") {
    return message.channel.send(helpMenu());
  }

  /* ===== PING ===== */
  if (cmd === "ping")
    return message.channel.send({
      embeds: [ui("🏓 Ping", `${client.ws.ping}ms`)],
    });

  /* =========================
     🎮 FUN
  ========================= */

  if (cmd === "8ball")
    return message.channel.send({
      embeds: [ui("🎱 8Ball", random(["Yes", "No", "Maybe"]))],
    });

  if (cmd === "coinflip")
    return message.channel.send({
      embeds: [ui("🪙 Coinflip", random(["Heads", "Tails"]))],
    });

  if (cmd === "joke")
    return message.channel.send({
      embeds: [
        ui(
          "😂 Joke",
          random([
            "Why do programmers hate nature? Bugs.",
            "Debugging: you vs yourself.",
          ])
        ),
      ],
    });

  /* =========================
     🛡️ MODERATION + LOGS
  ========================= */

  async function log(action) {
    if (!modLogChannelId) return;
    const ch = message.guild.channels.cache.get(modLogChannelId);
    if (!ch) return;

    ch.send({ embeds: [ui("📜 Mod Log", action)] });
  }

  if (cmd === "setlog") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    modLogChannelId = message.channel.id;

    return message.channel.send({
      embeds: [ui("📜 Logs Set", "This channel is now mod logs.")],
    });
  }

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return;

    const user = message.mentions.members.first();
    if (!user) return;

    await user.kick();

    await log(`👢 Kicked: ${user.user.tag}`);

    return message.channel.send({
      embeds: [ui("👢 Kick", `${user.user.tag} was kicked`)],
    });
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return;

    const user = message.mentions.members.first();
    if (!user) return;

    await user.ban();

    await log(`⛔ Banned: ${user.user.tag}`);

    return message.channel.send({
      embeds: [ui("⛔ Ban", `${user.user.tag} was banned`)],
    });
  }

  if (cmd === "purge") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return;

    const amount = parseInt(args[0]);
    if (!amount || amount > 100) return;

    await message.channel.bulkDelete(amount);

    await log(`🧹 Purged ${amount} messages`);

    return message.channel.send({
      embeds: [ui("🧹 Purge", `Deleted ${amount} messages`)],
    });
  }

  /* =========================
     👤 UTIL
  ========================= */

  if (cmd === "avatar") {
    const user = message.mentions.users.first() || message.author;

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#7c3aed")
          .setTitle("🖼 Avatar")
          .setImage(user.displayAvatarURL({ size: 1024 }))
          .setFooter({ text: "Aura OS" }),
      ],
    });
  }
});

/* =========================
   🎛️ BUTTON INTERACTIONS
========================= */

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "mod") {
    return interaction.reply({
      embeds: [
        ui(
          "🛡️ Moderation",
          "`kick`, `ban`, `purge`, `setlog`"
        ),
      ],
      ephemeral: true,
    });
  }

  if (interaction.customId === "fun") {
    return interaction.reply({
      embeds: [
        ui(
          "🎮 Fun",
          "`8ball`, `coinflip`, `joke`"
        ),
      ],
      ephemeral: true,
    });
  }

  if (interaction.customId === "util") {
    return interaction.reply({
      embeds: [
        ui(
          "⚙️ Utility",
          "`avatar`, `ping`, `help`"
        ),
      ],
      ephemeral: true,
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
      embeds: [ui("🏓 Ping", `${client.ws.ping}ms`)],
    });
  }
});

/* =========================
   🚀 LOGIN
========================= */

client.login(token);
