const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  AttachmentBuilder,
  ApplicationCommandOptionType,
} = require("discord.js");

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("Missing DISCORD_TOKEN in environment variables.");
}

/* -------------------- CLIENT -------------------- */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/* -------------------- CONFIG -------------------- */

const prefix = ",";
const auraGif =
  "https://media1.tenor.com/m/pJoX_nEXbS4AAAAC/sorrow-angel.gif";

let auraBuffer;

/* -------------------- EMBED STYLE -------------------- */

function baseEmbed(title, desc) {
  return new EmbedBuilder()
    .setColor("#2b2d31")
    .setTitle(title || null)
    .setDescription(desc || null)
    .setFooter({ text: "premium bot v3" })
    .setTimestamp();
}

function successEmbed(desc) {
  return baseEmbed("✅ Success", desc);
}

function errorEmbed(desc) {
  return baseEmbed("❌ Error", desc);
}

function auraEmbed(desc) {
  return new EmbedBuilder()
    .setColor("#2b2d31")
    .setDescription(desc)
    .setImage("attachment://aura.gif")
    .setFooter({ text: "premium moderation system" });
}

/* -------------------- GIF -------------------- */

async function getAura() {
  if (!auraBuffer) {
    const res = await fetch(auraGif);
    auraBuffer = Buffer.from(await res.arrayBuffer());
  }
  return new AttachmentBuilder(auraBuffer, { name: "aura.gif" });
}

/* -------------------- HELPERS -------------------- */

function isMod(member) {
  return member.permissions.has(
    PermissionsBitField.Flags.ModerateMembers
  );
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* -------------------- STATUS -------------------- */

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* -------------------- MESSAGE COMMANDS -------------------- */

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

/* ---------------- HELP ---------------- */

  if (cmd === "help") {
    return message.channel.send({
      embeds: [
        baseEmbed(
          "📖 Commands",
          `
moderation:
\`mute, unmute, kick, ban, warn, purge, slowmode, lock, unlock\`

utility:
\`ping, avatar, serverinfo, userinfo, roleinfo, channelinfo\`

fun:
\`8ball, coinflip, dice, ship, roast, compliment, joke, quote\`

text:
\`reverse, upper, lower, clap, vaporwave\`

system:
\`uptime, invite, botinfo\`
`
        ),
      ],
    });
  }

/* ---------------- SYSTEM ---------------- */

  if (cmd === "ping")
    return message.channel.send({
      embeds: [successEmbed(`Latency: ${client.ws.ping}ms`)],
    });

  if (cmd === "uptime")
    return message.channel.send({
      embeds: [successEmbed(`Uptime: ${process.uptime().toFixed(0)}s`)],
    });

  if (cmd === "invite")
    return message.channel.send({
      embeds: [
        baseEmbed(
          "Invite",
          `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
        ),
      ],
    });

/* ---------------- MODERATION (AURA GIF) ---------------- */

  async function modReply(text) {
    return message.channel.send({
      embeds: [auraEmbed(text)],
      files: [await getAura()],
    });
  }

  if (cmd === "mute") {
    if (!isMod(message.member)) return;
    const user = message.mentions.members.first();
    const time = parseInt(args[1]) || 5;
    if (!user) return;
    await user.timeout(time * 60000);
    return modReply(`${user.user.tag} muted for ${time} minutes`);
  }

  if (cmd === "unmute") {
    if (!isMod(message.member)) return;
    const user = message.mentions.members.first();
    if (!user) return;
    await user.timeout(null);
    return modReply(`${user.user.tag} unmuted`);
  }

  if (cmd === "kick") {
    if (!isMod(message.member)) return;
    const user = message.mentions.members.first();
    if (!user) return;
    await user.kick();
    return modReply(`${user.user.tag} kicked`);
  }

  if (cmd === "ban") {
    if (!isMod(message.member)) return;
    const user = message.mentions.members.first();
    if (!user) return;
    await user.ban();
    return modReply(`${user.user.tag} banned`);
  }

  if (cmd === "purge") {
    if (!isMod(message.member)) return;
    const amt = parseInt(args[0]);
    if (!amt || amt > 100) return;
    await message.channel.bulkDelete(amt);
    return modReply(`Deleted ${amt} messages`);
  }

  if (cmd === "slowmode") {
    if (!isMod(message.member)) return;
    const sec = parseInt(args[0]);
    await message.channel.setRateLimitPerUser(sec);
    return modReply(`Slowmode set to ${sec}s`);
  }

  if (cmd === "lock") {
    if (!isMod(message.member)) return;
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { SendMessages: false }
    );
    return modReply("Channel locked");
  }

  if (cmd === "unlock") {
    if (!isMod(message.member)) return;
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { SendMessages: null }
    );
    return modReply("Channel unlocked");
  }

/* ---------------- UTILITY ---------------- */

  if (cmd === "avatar") {
    const user = message.mentions.users.first() || message.author;
    return message.channel.send({
      embeds: [
        baseEmbed("Avatar", `${user.tag}`)
          .setImage(user.displayAvatarURL({ size: 1024 })),
      ],
    });
  }

  if (cmd === "serverinfo") {
    return message.channel.send({
      embeds: [
        baseEmbed(
          "Server Info",
          `
Name: ${message.guild.name}
Members: ${message.guild.memberCount}
Channels: ${message.guild.channels.cache.size}
Roles: ${message.guild.roles.cache.size}
`
        ),
      ],
    });
  }

  if (cmd === "userinfo") {
    const user = message.mentions.members.first() || message.member;
    return message.channel.send({
      embeds: [
        baseEmbed(
          "User Info",
          `
User: ${user.user.tag}
ID: ${user.id}
Joined: <t:${Math.floor(user.joinedTimestamp / 1000)}:R>
`
        ),
      ],
    });
  }

/* ---------------- FUN ---------------- */

  if (cmd === "8ball")
    return message.channel.send({
      embeds: [
        successEmbed(
          pick(["yes", "no", "maybe", "definitely", "ask again"])
        ),
      ],
    });

  if (cmd === "coinflip")
    return message.channel.send({
      embeds: [successEmbed(pick(["heads", "tails"]))],
    });

  if (cmd === "dice")
    return message.channel.send({
      embeds: [successEmbed(`Rolled: ${Math.floor(Math.random() * 6) + 1}`)],
    });

  if (cmd === "roast")
    return message.channel.send({
      embeds: [
        errorEmbed(
          pick([
            "your WiFi has more personality than you",
            "you move like lag",
            "even NPCs have better timing",
          ])
        ),
      ],
    });

/* ---------------- TEXT ---------------- */

  if (cmd === "reverse")
    return message.channel.send(args.join(" ").split("").reverse().join(""));

  if (cmd === "upper")
    return message.channel.send(args.join(" ").toUpperCase());

  if (cmd === "lower")
    return message.channel.send(args.join(" ").toLowerCase());

  if (cmd === "clap")
    return message.channel.send(args.join(" 👏 "));

/* ---------------- DEFAULT ---------------- */

  return;
});

/* ---------------- LOGIN ---------------- */

client.login(token);
