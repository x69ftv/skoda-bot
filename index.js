const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ApplicationCommandOptionType,
} = require("discord.js");

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("Missing DISCORD_TOKEN in environment variables.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const prefix = ",";

/* =========================
   🎨 PREMIUM EMBED STYLE
========================= */

function embed(title, desc, color = "#7c3aed") {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc)
    .setTimestamp()
    .setFooter({ text: "Premium Bot • Simple & Clean" });
}

/* =========================
   🎲 UTIL
========================= */

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* =========================
   🧠 SLASH COMMANDS
========================= */

const slashCommands = [
  {
    name: "ping",
    description: "Check bot latency",
  },
  {
    name: "coinflip",
    description: "Flip a coin",
  },
  {
    name: "8ball",
    description: "Ask a question",
    options: [
      {
        name: "question",
        type: ApplicationCommandOptionType.String,
        required: true,
        description: "Your question",
      },
    ],
  },
  {
    name: "kick",
    description: "Kick a user",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        required: true,
        description: "User to kick",
      },
      {
        name: "reason",
        type: ApplicationCommandOptionType.String,
        required: false,
        description: "Reason",
      },
    ],
  },
  {
    name: "ban",
    description: "Ban a user",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
];

/* =========================
   📦 REGISTER SLASH COMMANDS
========================= */

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const data = await client.application.commands.set(slashCommands);
  console.log(`Slash commands loaded: ${data.size}`);
});

/* =========================
   💬 PREFIX COMMANDS
========================= */

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  /* ===== PING ===== */
  if (cmd === "ping") {
    return message.channel.send({
      embeds: [embed("🏓 Pong!", `Latency: **${client.ws.ping}ms**`)],
    });
  }

  /* ===== HELP ===== */
  if (cmd === "help") {
    return message.channel.send({
      embeds: [
        embed(
          "📖 Commands",
          `
**Moderation**
\`,kick\` \`,ban\` \`,purge\`

**Fun**
\`,8ball\` \`,coinflip\` \`,say\`

**Utility**
\`,ping\` \`,help\`
        `
        ),
      ],
    });
  }

  /* ===== SAY ===== */
  if (cmd === "say") {
    const text = args.join(" ");
    if (!text) return;

    await message.delete().catch(() => {});
    return message.channel.send({ content: text });
  }

  /* ===== 8BALL ===== */
  if (cmd === "8ball") {
    const responses = [
      "Yes.",
      "No.",
      "Maybe.",
      "Definitely.",
      "Ask again later.",
      "Absolutely not.",
    ];

    return message.channel.send({
      embeds: [embed("🎱 8Ball", random(responses))],
    });
  }

  /* ===== COINFLIP ===== */
  if (cmd === "coinflip") {
    return message.channel.send({
      embeds: [
        embed("🪙 Coinflip", random(["Heads", "Tails"])),
      ],
    });
  }

  /* ===== PURGE ===== */
  if (cmd === "purge") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return;

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return;

    await message.channel.bulkDelete(amount);
    return message.channel.send({
      embeds: [embed("🧹 Purge", `Deleted **${amount} messages**`)],
    });
  }

  /* ===== KICK ===== */
  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return;

    const user = message.mentions.members.first();
    if (!user) return;

    await user.kick();
    return message.channel.send({
      embeds: [embed("👢 Kick", `${user.user.tag} was kicked`)],
    });
  }

  /* ===== BAN ===== */
  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return;

    const user = message.mentions.members.first();
    if (!user) return;

    await user.ban();
    return message.channel.send({
      embeds: [embed("⛔ Ban", `${user.user.tag} was banned`)],
    });
  }
});

/* =========================
   ⚡ SLASH HANDLER
========================= */

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ping") {
    return interaction.reply({
      embeds: [embed("🏓 Pong!", `${client.ws.ping}ms`)],
    });
  }

  if (commandName === "coinflip") {
    return interaction.reply({
      embeds: [embed("🪙 Coinflip", random(["Heads", "Tails"]))],
    });
  }

  if (commandName === "8ball") {
    const q = interaction.options.getString("question");

    const responses = [
      "Yes.",
      "No.",
      "Maybe.",
      "Definitely.",
      "Ask again later.",
    ];

    return interaction.reply({
      embeds: [embed("🎱 8Ball", `Q: ${q}\n\nA: ${random(responses)}`)],
    });
  }

  if (commandName === "kick") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return;

    const user = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason";

    await user.kick(reason);

    return interaction.reply({
      embeds: [embed("👢 Kick", `${user.user.tag} kicked`)],
    });
  }

  if (commandName === "ban") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return;

    const user = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason";

    await user.ban({ reason });

    return interaction.reply({
      embeds: [embed("⛔ Ban", `${user.user.tag} banned`)],
    });
  }
});

/* =========================
   🚀 LOGIN
========================= */

client.login(token);
