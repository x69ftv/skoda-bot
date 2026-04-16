const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ApplicationCommandOptionType,
} = require('discord.js');

const OpenAI = require('openai');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.DISCORD_TOKEN;

// 🎨 Aesthetic theme
const COLORS = {
  main: '#8b5cf6',
  good: '#22c55e',
  bad: '#ef4444',
  dark: '#0f0f0f',
};

// 🤖 OpenAI (optional)
const openai =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
    ? new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      })
    : null;

const prefix = ',';

// ─────────────────────────────
// 🎭 EMBEDS
// ─────────────────────────────
function embed(title, desc, color = COLORS.main) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc)
    .setTimestamp();
}

// ─────────────────────────────
// 🚀 READY
// ─────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ─────────────────────────────
// 💬 MESSAGE COMMANDS
// ─────────────────────────────
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();

  // 🏓 ping
  if (cmd === 'ping') {
    return message.channel.send({
      embeds: [
        embed(
          '🏓 Pong!',
          `Latency: **${client.ws.ping}ms**`,
          COLORS.main
        ),
      ],
    });
  }

  // 🤖 AI
  if (cmd === 'ai') {
    const prompt = args.join(' ');
    if (!prompt) {
      return message.channel.send({
        embeds: [embed('❌ Missing prompt', 'Usage: `,ai hello`', COLORS.bad)],
      });
    }

    if (!openai) {
      return message.channel.send({
        embeds: [embed('❌ AI not setup', 'Missing API keys', COLORS.bad)],
      });
    }

    const msg = await message.channel.send({
      embeds: [embed('🤖 Thinking...', 'Please wait')],
    });

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const text = res.choices[0]?.message?.content || 'No response';

      return msg.edit({
        embeds: [embed('🤖 AI Response', text)],
      });
    } catch {
      return msg.edit({
        embeds: [embed('❌ AI Error', 'Try again later', COLORS.bad)],
      });
    }
  }

  // 🎲 coinflip
  if (cmd === 'coinflip') {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

    return message.channel.send({
      embeds: [embed('🪙 Coin Flip', `Result: **${result}**`)],
    });
  }

  // ❓ 8ball
  if (cmd === '8ball') {
    const answers = ['Yes', 'No', 'Maybe', 'Definitely', 'Ask again'];
    const pick = answers[Math.floor(Math.random() * answers.length)];

    return message.channel.send({
      embeds: [embed('🎱 8Ball', pick)],
    });
  }

  // 🧹 clear
  if (cmd === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return;

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return;

    await message.channel.bulkDelete(amount, true);

    return message.channel.send({
      embeds: [embed('🧹 Cleared', `Deleted **${amount} messages**`, COLORS.good)],
    });
  }

  // 📜 help
  if (cmd === 'help') {
    return message.channel.send({
      embeds: [
        embed(
const helpSections = [
  ['✨ general', [
    ['help', ',help', 'shows all commands'],
    ['invite', ',invite', 'bot invite link'],
    ['ping', ',ping', 'check bot latency'],
    ['botinfo', ',botinfo', 'bot information'],
    ['uptime', ',uptime', 'bot uptime'],
  ]],

  ['🤖 ai', [
    ['ai', ',ai hello', 'ask the AI anything'],
  ]],

  ['🛡️ moderation', [
    ['mute', ',mute @user 10', 'timeout a user'],
    ['unmute', ',unmute @user', 'remove timeout'],
    ['warn', ',warn @user reason', 'warn a user'],
    ['kick', ',kick @user reason', 'kick a user'],
    ['ban', ',ban @user reason', 'ban a user'],
    ['purge', ',purge 50', 'delete messages'],
    ['slowmode', ',slowmode 5', 'set slowmode'],
    ['lock', ',lock', 'lock channel'],
    ['unlock', ',unlock', 'unlock channel'],
  ]],

  ['⚙️ server', [
    ['serverinfo', ',serverinfo', 'server details'],
    ['userinfo', ',userinfo @user', 'user details'],
    ['avatar', ',avatar @user', 'user avatar'],
    ['roles', ',roles', 'list server roles'],
    ['membercount', ',membercount', 'member count'],
  ]],

  ['🎮 fun', [
    ['coinflip', ',coinflip', 'flip a coin'],
    ['dice', ',dice', 'roll a dice'],
    ['8ball', ',8ball question', 'magic 8ball'],
    ['choose', ',choose a | b', 'random choice'],
    ['hug', ',hug @user', 'hug someone'],
    ['pat', ',pat @user', 'pat someone'],
    ['slap', ',slap @user', 'slap someone'],
  ]],

  ['🧠 text', [
    ['reverse', ',reverse text', 'reverse text'],
    ['upper', ',upper text', 'uppercase'],
    ['lower', ',lower text', 'lowercase'],
    ['clap', ',clap text', '👏 text 👏 style'],
    ['math', ',math 5+5', 'solve math'],
  ]],
];

// ─────────────────────────────
// 🔌 LOGIN
// ─────────────────────────────
client.login(token);
