const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  AttachmentBuilder,
  ApplicationCommandOptionType,
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;

if (!token) throw new Error('Missing DISCORD_TOKEN');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const prefix = ',';

const theme = {
  main: '#5865F2',
  good: '#22c55e',
  bad: '#ef4444',
  vibe: '#a855f7',
  warn: '#f59e0b',
};

function embed(color, title, desc) {
  return new EmbedBuilder()
    .setColor(color)
    .setDescription(title ? `**${title}**\n\n${desc || ''}` : desc)
    .setTimestamp();
}

/* ---------------- HELP ---------------- */

const help = [
  ['✨ general', [
    ['help', ',help', 'show commands'],
    ['ping', ',ping', 'bot latency'],
    ['botinfo', ',botinfo', 'bot info'],
    ['uptime', ',uptime', 'online time'],
  ]],
  ['🛡️ moderation', [
    ['mute', ',mute @user 10', 'timeout user'],
    ['unmute', ',unmute @user', 'remove timeout'],
    ['kick', ',kick @user', 'kick user'],
    ['ban', ',ban @user', 'ban user'],
    ['purge', ',purge 50', 'delete messages'],
    ['slowmode', ',slowmode 5', 'set slowmode'],
  ]],
  ['⚙️ server', [
    ['serverinfo', ',serverinfo', 'server details'],
    ['userinfo', ',userinfo', 'user details'],
    ['avatar', ',avatar', 'show avatar'],
    ['roles', ',roles', 'list roles'],
  ]],
  ['🎮 fun', [
    ['coinflip', ',coinflip', 'flip coin'],
    ['dice', ',dice', 'roll dice'],
    ['8ball', ',8ball question', 'magic answer'],
    ['hug', ',hug @user', 'hug someone'],
    ['pat', ',pat @user', 'pat someone'],
    ['slap', ',slap @user', 'slap someone'],
    ['vibe', ',vibe', 'your mood'],
    ['quote', ',quote', 'random quote'],
    ['fact', ',fact', 'random fact'],
  ]],
  ['🧠 text', [
    ['reverse', ',reverse text', 'reverse text'],
    ['upper', ',upper text', 'uppercase'],
    ['lower', ',lower text', 'lowercase'],
    ['clap', ',clap text', '👏 style'],
    ['ascii', ',ascii text', 'cool text effect'],
  ]],
];

/* ---------------- UTIL ---------------- */

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getUser(message) {
  return message.mentions.users.first() || message.author;
}

/* ---------------- EVENTS ---------------- */

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* ---------------- HELP ---------------- */

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();
  if (!message.content.startsWith(prefix)) return;

  /* HELP */
  if (cmd === 'help') {
    const pages = help.map(([title, cmds]) =>
      embed(
        theme.main,
        title,
        cmds.map(c => `**${prefix}${c[0]}** — ${c[2]}\n\`${c[1]}\``).join('\n\n')
      )
    );

    return message.channel.send({ embeds: pages });
  }

  /* PING */
  if (cmd === 'ping') {
    return message.channel.send({ embeds: [embed(theme.main, 'ping', `${client.ws.ping}ms`)] });
  }

  /* BOT INFO */
  if (cmd === 'botinfo') {
    return message.channel.send({
      embeds: [
        embed(
          theme.main,
          'bot info',
          `name: ${client.user.tag}\nservers: ${client.guilds.cache.size}`
        ),
      ],
    });
  }

  /* UPTIME */
  if (cmd === 'uptime') {
    return message.channel.send({
      embeds: [embed(theme.good, 'uptime', `${Math.floor(client.uptime / 1000)}s`)],
    });
  }

  /* MODERATION */
  if (cmd === 'purge') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const amount = parseInt(args[0]);
    if (!amount) return;
    await message.channel.bulkDelete(amount);
    return message.channel.send({ embeds: [embed(theme.good, 'purge', 'messages deleted')] });
  }

  if (cmd === 'slowmode') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
    const sec = parseInt(args[0]);
    if (!sec && sec !== 0) return;
    await message.channel.setRateLimitPerUser(sec);
    return message.channel.send({ embeds: [embed(theme.warn, 'slowmode', `${sec}s set`)] });
  }

  /* FUN */
  if (cmd === 'coinflip')
    return message.channel.send({ embeds: [embed(theme.main, 'coinflip', random(['heads', 'tails']))] });

  if (cmd === 'dice')
    return message.channel.send({ embeds: [embed(theme.main, 'dice', `${Math.ceil(Math.random() * 6)}/6`)] });

  if (cmd === '8ball')
    return message.channel.send({
      embeds: [embed(theme.vibe, '8ball', random(['yes', 'no', 'maybe', 'absolutely', 'nope']))],
    });

  if (cmd === 'vibe')
    return message.channel.send({
      embeds: [embed(theme.vibe, 'vibe', random(['calm 🌙', 'chaotic ⚡', 'chill 🧊', 'focused 🎯']))],
    });

  if (cmd === 'quote')
    return message.channel.send({
      embeds: [embed(theme.main, 'quote', random(['keep going.', 'stay strong.', 'lock in.', 'breathe.']))],
    });

  if (cmd === 'fact')
    return message.channel.send({
      embeds: [embed(theme.main, 'fact', random(['octopuses have 3 hearts', 'bananas are berries', 'sharks existed before trees']))],
    });

  /* TEXT */
  if (cmd === 'reverse')
    return message.channel.send(args.join(' ').split('').reverse().join(''));

  if (cmd === 'upper')
    return message.channel.send(args.join(' ').toUpperCase());

  if (cmd === 'lower')
    return message.channel.send(args.join(' ').toLowerCase());

  if (cmd === 'clap')
    return message.channel.send(args.join(' ').split(' ').join(' 👏 '));

  if (cmd === 'ascii') {
    const text = args.join(' ');
    return message.channel.send('```' + text + '```');
  }

  /* USER FUN */
  if (cmd === 'hug') {
    const u = getUser(message);
    return message.channel.send({ embeds: [embed(theme.good, 'hug', `${message.author} hugged ${u}`)] });
  }

  if (cmd === 'pat') {
    const u = getUser(message);
    return message.channel.send({ embeds: [embed(theme.good, 'pat', `${message.author} patted ${u}`)] });
  }

  if (cmd === 'slap') {
    const u = getUser(message);
    return message.channel.send({ embeds: [embed(theme.bad, 'slap', `${message.author} slapped ${u}`)] });
  }
});

client.login(token);
