const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  AttachmentBuilder,
  ApplicationCommandOptionType,
} = require('discord.js');

const OpenAI = require('openai');

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error('Missing DISCORD_TOKEN secret. Add your Discord bot token to Replit Secrets.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const prefix = ',';

const auraGif = 'https://media1.tenor.com/m/pJoX_nEXbS4AAAAC/sorrow-angel.gif';
let auraGifBuffer;

const deletedMessages = new Map();

// FIX: correct OpenAI init safety
const openai =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
    ? new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      })
    : null;

const helpSections = [
  ['main', [
    ['help', ',help', 'lists all commands'],
    ['invite', ',invite', 'sends the bot invite link'],
    ['ai', ',ai explain how timeouts work in Discord', 'asks AI for help'],
    ['ping', ',ping', 'checks bot speed'],
    ['botinfo', ',botinfo', 'shows bot info'],
    ['uptime', ',uptime', 'shows how long bot has been online'],
  ]],
];

// ---------------- EMBEDS ----------------
function plainEmbed(text) {
  return new EmbedBuilder()
    .setColor('#2b2d31')
    .setDescription(text)
    .setFooter({ text: '...' });
}

function auraEmbed(text) {
  return new EmbedBuilder()
    .setColor('#2b2d31')
    .setDescription(text)
    .setImage('attachment://aura.gif')
    .setFooter({ text: '...' });
}

// ---------------- AURA GIF ----------------
async function getAuraAttachment() {
  if (!auraGifBuffer) {
    const response = await fetch(auraGif);
    if (!response.ok) throw new Error('Failed to fetch GIF');
    auraGifBuffer = Buffer.from(await response.arrayBuffer());
  }

  return new AttachmentBuilder(auraGifBuffer, { name: 'aura.gif' });
}

async function sendAura(channel, text) {
  try {
    return channel.send({
      embeds: [auraEmbed(text)],
      files: [await getAuraAttachment()],
    });
  } catch {
    return channel.send({
      content: auraGif,
      embeds: [plainEmbed(text)],
    });
  }
}

// ---------------- UTIL ----------------
function hasPermission(message, permission) {
  return message.member?.permissions?.has(permission);
}

function getReason(args, startIndex, fallback = 'no reason given') {
  return args.slice(startIndex).join(' ') || fallback;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

// FIX: safer chunking
function splitDiscordText(text, maxLength = 3900) {
  const chunks = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf('\n', maxLength);
    if (splitAt < maxLength * 0.5) splitAt = maxLength;

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

// FIX: safe invite
function getInviteLink() {
  return `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot+applications.commands`;
}

// ---------------- SLASH READY ----------------
// 🔥 FIXED EVENT NAME (THIS WAS YOUR MAIN BUG)
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Invite link: ${getInviteLink()}`);
});

// ---------------- MESSAGE COMMANDS ----------------
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  if (command === 'ping') {
    return message.channel.send({ embeds: [plainEmbed(`pong — ${client.ws.ping}ms`)] });
  }

  if (command === 'uptime') {
    return message.channel.send({
      embeds: [plainEmbed(`online for ${formatDuration(client.uptime)}`)],
    });
  }

  if (command === 'help') {
    const embeds = helpSections.map(([section, commands]) =>
      plainEmbed(
        `**${section}**\n\n` +
          commands.map(([n, ex, u]) => `**${prefix}${n}** — ${u}\n\`${ex}\``).join('\n\n')
      )
    );

    return message.channel.send({ embeds });
  }

  if (command === 'invite') {
    return message.channel.send({
      embeds: [plainEmbed(`invite:\n${getInviteLink()}`)],
    });
  }

  if (command === 'ai') {
    const prompt = args.join(' ');
    if (!openai) return message.channel.send('AI not configured.');
    if (!prompt) return message.channel.send('missing prompt.');

    const msg = await message.channel.send({ embeds: [plainEmbed('thinking...')] });

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'user', content: prompt },
        ],
      });

      const answer = res.choices[0]?.message?.content || 'no response';
      return msg.edit({ embeds: [plainEmbed(answer)] });
    } catch (e) {
      return msg.edit({ embeds: [plainEmbed('AI error')] });
    }
  }
});

// ---------------- LOGIN ----------------
client.login(token);
