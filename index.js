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
  throw new Error('Missing DISCORD_TOKEN secret. Add your Discord bot token to Replit Secrets as DISCORD_TOKEN.');
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
const openai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
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
  ['slash commands', [
    ['slash', '/help', 'slash commands are supported'],
    ['slash mute', '/mute user:@user minutes:10', 'slash mute command'],
    ['slash avatar', '/avatar user:@user', 'slash avatar command'],
    ['slash ai', '/ai prompt:your question', 'slash AI command'],
    ['slash purge', '/purge amount:50', 'slash purge command'],
  ]],
  ['moderation', [
    ['mute', ',mute @user 10', 'mutes for minutes'],
    ['unmute', ',unmute @user', 'removes timeout'],
    ['warn', ',warn @user reason', 'warns a user'],
    ['kick', ',kick @user reason', 'kicks a user'],
    ['ban', ',ban @user reason', 'bans a user'],
    ['unban', ',unban userId', 'unbans by ID'],
    ['softban', ',softban @user reason', 'ban/unban message cleanup'],
    ['purge', ',purge 50', 'deletes messages'],
    ['purgeuser', ',purgeuser @user 20', 'deletes user messages'],
    ['purgebots', ',purgebots 20', 'deletes bot messages'],
    ['slowmode', ',slowmode 10', 'sets slowmode seconds'],
    ['lock', ',lock', 'locks channel'],
    ['unlock', ',unlock', 'unlocks channel'],
    ['hide', ',hide', 'hides channel'],
    ['show', ',show', 'shows channel'],
    ['nick', ',nick @user name', 'changes nickname'],
    ['roleadd', ',roleadd @user @role', 'adds role'],
    ['roleremove', ',roleremove @user @role', 'removes role'],
    ['settopic', ',settopic new topic', 'sets channel topic'],
    ['renamechannel', ',renamechannel new-name', 'renames channel'],
  ]],
  ['server utilities', [
    ['avatar', ',avatar @user', 'shows avatar'],
    ['banner', ',banner @user', 'shows user banner if available'],
    ['userinfo', ',userinfo @user', 'shows user info'],
    ['serverinfo', ',serverinfo', 'shows server info'],
    ['servericon', ',servericon', 'shows server icon'],
    ['membercount', ',membercount', 'shows member count'],
    ['roles', ',roles', 'lists server roles'],
    ['roleinfo', ',roleinfo @role', 'shows role info'],
    ['channelinfo', ',channelinfo', 'shows channel info'],
    ['id', ',id @user', 'shows user ID'],
    ['bans', ',bans', 'shows ban count/list'],
    ['snipe', ',snipe', 'shows last deleted message'],
  ]],
  ['extra', [
    ['say', ',say hello', 'bot says a message'],
    ['announce', ',announce text', 'announcement embed'],
    ['poll', ',poll question', 'yes/no poll'],
    ['choose', ',choose red | blue', 'chooses an option'],
    ['coinflip', ',coinflip', 'flips a coin'],
    ['8ball', ',8ball question', 'answers a question'],
  ]],
  ['more commands', [
    ['prefix', ',prefix', 'shows the prefix'],
    ['commands', ',commands', 'same as help'],
    ['status', ',status', 'shows bot status'],
    ['latency', ',latency', 'shows websocket latency'],
    ['serverage', ',serverage', 'shows server age'],
    ['accountage', ',accountage @user', 'shows account age'],
    ['joined', ',joined @user', 'shows join date'],
    ['created', ',created @user', 'shows creation date'],
    ['owner', ',owner', 'shows server owner'],
    ['boostcount', ',boostcount', 'shows boost count'],
    ['emojis', ',emojis', 'lists emojis'],
    ['stickers', ',stickers', 'lists stickers'],
    ['channels', ',channels', 'shows channel count'],
    ['textchannels', ',textchannels', 'shows text channel count'],
    ['voicechannels', ',voicechannels', 'shows voice channel count'],
    ['categories', ',categories', 'shows category count'],
    ['humans', ',humans', 'counts humans'],
    ['bots', ',bots', 'counts bots'],
    ['admins', ',admins', 'counts admins'],
    ['boosters', ',boosters', 'counts boosters'],
    ['perms', ',perms @user', 'shows key permissions'],
    ['reverse', ',reverse hello', 'reverses text'],
    ['upper', ',upper hello', 'uppercase text'],
    ['lower', ',lower HELLO', 'lowercase text'],
    ['titlecase', ',titlecase hello world', 'title cases text'],
    ['clap', ',clap hello world', 'adds claps'],
    ['sponge', ',sponge hello world', 'mocking text'],
    ['vaporwave', ',vaporwave hello', 'wide text'],
    ['repeat', ',repeat 3 hello', 'repeats text'],
    ['length', ',length hello', 'counts characters'],
    ['wordcount', ',wordcount hello world', 'counts words'],
    ['charcount', ',charcount hello', 'counts characters'],
    ['firstletter', ',firstletter hello', 'gets first letter'],
    ['lastletter', ',lastletter hello', 'gets last letter'],
    ['math', ',math 5 + 5', 'basic math'],
    ['add', ',add 5 7', 'adds numbers'],
    ['subtract', ',subtract 10 3', 'subtracts numbers'],
    ['multiply', ',multiply 4 8', 'multiplies numbers'],
    ['divide', ',divide 20 4', 'divides numbers'],
    ['percent', ',percent 15 200', 'finds percent'],
    ['random', ',random 1 100', 'random number'],
    ['roll', ',roll 20', 'rolls a die'],
    ['dice', ',dice', 'rolls a d6'],
    ['rate', ',rate pizza', 'rates something'],
    ['ship', ',ship @user @user', 'ship score'],
    ['hug', ',hug @user', 'hug command'],
    ['pat', ',pat @user', 'pat command'],
    ['slap', ',slap @user', 'slap command'],
    ['cry', ',cry', 'cry command'],
    ['smile', ',smile', 'smile command'],
    ['roast', ',roast @user', 'light roast'],
    ['compliment', ',compliment @user', 'compliment user'],
    ['quote', ',quote', 'random quote'],
    ['advice', ',advice', 'random advice'],
    ['motivate', ',motivate', 'motivation'],
    ['fact', ',fact', 'random fact'],
    ['wyr', ',wyr', 'would you rather'],
    ['truth', ',truth', 'truth question'],
    ['dare', ',dare', 'dare prompt'],
    ['topic', ',topic', 'conversation topic'],
  ]],
];

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

async function getAuraAttachment() {
  if (!auraGifBuffer) {
    const response = await fetch(auraGif);
    if (!response.ok) throw new Error('Could not fetch aura GIF.');
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

function hasPermission(message, permission) {
  return message.member.permissions.has(permission);
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

function splitDiscordText(text, maxLength = 3900) {
  const chunks = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf('\n', maxLength);
    if (splitAt < maxLength * 0.5) splitAt = remaining.lastIndexOf(' ', maxLength);
    if (splitAt < maxLength * 0.5) splitAt = maxLength;

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function getInviteLink() {
  return `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&integration_type=0&scope=bot+applications.commands`;
}

const slashCommands = [
  { name: 'help', description: 'List bot commands' },
  { name: 'invite', description: 'Get the bot invite link' },
  { name: 'ping', description: 'Check bot latency' },
  { name: 'botinfo', description: 'Show bot info' },
  { name: 'uptime', description: 'Show bot uptime' },
  {
    name: 'ai',
    description: 'Ask AI a question',
    options: [{ name: 'prompt', description: 'What do you want to ask?', type: ApplicationCommandOptionType.String, required: true }],
  },
  {
    name: 'mute',
    description: 'Mute a user for minutes',
    default_member_permissions: PermissionsBitField.Flags.ModerateMembers.toString(),
    options: [
      { name: 'user', description: 'User to mute', type: ApplicationCommandOptionType.User, required: true },
      { name: 'minutes', description: 'Minutes to mute', type: ApplicationCommandOptionType.Integer, required: false },
    ],
  },
  {
    name: 'unmute',
    description: 'Unmute a user',
    default_member_permissions: PermissionsBitField.Flags.ModerateMembers.toString(),
    options: [{ name: 'user', description: 'User to unmute', type: ApplicationCommandOptionType.User, required: true }],
  },
  {
    name: 'warn',
    description: 'Warn a user',
    default_member_permissions: PermissionsBitField.Flags.ModerateMembers.toString(),
    options: [
      { name: 'user', description: 'User to warn', type: ApplicationCommandOptionType.User, required: true },
      { name: 'reason', description: 'Warning reason', type: ApplicationCommandOptionType.String, required: false },
    ],
  },
  {
    name: 'kick',
    description: 'Kick a user',
    default_member_permissions: PermissionsBitField.Flags.KickMembers.toString(),
    options: [
      { name: 'user', description: 'User to kick', type: ApplicationCommandOptionType.User, required: true },
      { name: 'reason', description: 'Kick reason', type: ApplicationCommandOptionType.String, required: false },
    ],
  },
  {
    name: 'ban',
    description: 'Ban a user',
    default_member_permissions: PermissionsBitField.Flags.BanMembers.toString(),
    options: [
      { name: 'user', description: 'User to ban', type: ApplicationCommandOptionType.User, required: true },
      { name: 'reason', description: 'Ban reason', type: ApplicationCommandOptionType.String, required: false },
    ],
  },
  {
    name: 'purge',
    description: 'Delete messages',
    default_member_permissions: PermissionsBitField.Flags.ManageMessages.toString(),
    options: [{ name: 'amount', description: 'Amount to delete', type: ApplicationCommandOptionType.Integer, required: true }],
  },
  {
    name: 'slowmode',
    description: 'Set slowmode seconds',
    default_member_permissions: PermissionsBitField.Flags.ManageChannels.toString(),
    options: [{ name: 'seconds', description: 'Slowmode seconds', type: ApplicationCommandOptionType.Integer, required: true }],
  },
  { name: 'lock', description: 'Lock this channel', default_member_permissions: PermissionsBitField.Flags.ManageChannels.toString() },
  { name: 'unlock', description: 'Unlock this channel', default_member_permissions: PermissionsBitField.Flags.ManageChannels.toString() },
  { name: 'avatar', description: 'Show avatar', options: [{ name: 'user', description: 'User', type: ApplicationCommandOptionType.User, required: false }] },
  { name: 'userinfo', description: 'Show user info', options: [{ name: 'user', description: 'User', type: ApplicationCommandOptionType.User, required: false }] },
  { name: 'serverinfo', description: 'Show server info' },
  { name: 'servericon', description: 'Show server icon' },
  { name: 'membercount', description: 'Show member count' },
  { name: 'roles', description: 'List roles' },
  { name: 'coinflip', description: 'Flip a coin' },
  { name: 'dice', description: 'Roll a d6' },
  { name: '8ball', description: 'Ask the magic 8ball', options: [{ name: 'question', description: 'Question', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'choose', description: 'Choose between options split by |', options: [{ name: 'options', description: 'red | blue | green', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'poll', description: 'Create a yes/no poll', options: [{ name: 'question', description: 'Poll question', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'reverse', description: 'Reverse text', options: [{ name: 'text', description: 'Text', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'upper', description: 'Uppercase text', options: [{ name: 'text', description: 'Text', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'lower', description: 'Lowercase text', options: [{ name: 'text', description: 'Text', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'random', description: 'Random number', options: [
    { name: 'min', description: 'Minimum', type: ApplicationCommandOptionType.Integer, required: true },
    { name: 'max', description: 'Maximum', type: ApplicationCommandOptionType.Integer, required: true },
  ] },
];

async function registerSlashCommands(guild) {
  try {
    await guild.commands.set(slashCommands);
    console.log(`Slash commands registered for ${guild.name}`);
  } catch (error) {
    console.error(`Failed to register slash commands for ${guild.name}:`, error.message);
  }
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function numberArg(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeMath(expression) {
  if (!/^[0-9+\-*/().% ^]+$/.test(expression)) return null;
  const normalized = expression.replace(/\^/g, '**');
  try {
    const result = Function(`"use strict"; return (${normalized})`)();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

async function handleExtraCommand(message, command, args) {
  const text = args.join(' ');
  const mentionedUser = message.mentions.users.first();
  const mentionedMember = message.mentions.members.first();
  const targetUser = mentionedUser || message.author;
  const targetMember = mentionedMember || message.member;
  const send = (content) => message.channel.send({ embeds: [plainEmbed(content)] });

  if (command === 'prefix') return send(`prefix: \`${prefix}\``);
  if (command === 'commands') {
    const embeds = helpSections.map(([section, commands]) => plainEmbed(`**${section}**\n\n${commands.map(([name, example, use]) => `**${prefix}${name}** — ${use}\n\`${example}\``).join('\n\n')}`));
    return message.channel.send({ embeds });
  }
  if (command === 'status') return send('online.');
  if (command === 'latency') return send(`${client.ws.ping}ms`);
  if (command === 'serverage') return send(`created <t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`);
  if (command === 'accountage' || command === 'created') return send(`${targetUser.tag} was created <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`);
  if (command === 'joined') return send(`${targetMember.user.tag} joined <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`);
  if (command === 'owner') {
    const owner = await message.guild.fetchOwner();
    return send(`owner: ${owner.user.tag}`);
  }
  if (command === 'boostcount') return send(`boosts: ${message.guild.premiumSubscriptionCount || 0}`);
  if (command === 'emojis') return send(message.guild.emojis.cache.map((emoji) => `${emoji}`).slice(0, 60).join(' ') || 'no emojis found.');
  if (command === 'stickers') return send(message.guild.stickers.cache.map((sticker) => sticker.name).slice(0, 40).join(', ') || 'no stickers found.');
  if (command === 'channels') return send(`channels: ${message.guild.channels.cache.size}`);
  if (command === 'textchannels') return send(`text channels: ${message.guild.channels.cache.filter((channel) => channel.type === 0).size}`);
  if (command === 'voicechannels') return send(`voice channels: ${message.guild.channels.cache.filter((channel) => channel.type === 2).size}`);
  if (command === 'categories') return send(`categories: ${message.guild.channels.cache.filter((channel) => channel.type === 4).size}`);
  if (command === 'humans') return send(`humans: ${message.guild.members.cache.filter((member) => !member.user.bot).size}`);
  if (command === 'bots') return send(`bots: ${message.guild.members.cache.filter((member) => member.user.bot).size}`);
  if (command === 'admins') return send(`admins: ${message.guild.members.cache.filter((member) => member.permissions.has(PermissionsBitField.Flags.Administrator)).size}`);
  if (command === 'boosters') return send(`boosters: ${message.guild.members.cache.filter((member) => member.premiumSince).size}`);
  if (command === 'perms') {
    const perms = targetMember.permissions.toArray().filter((permission) => ['Administrator', 'ManageGuild', 'ManageChannels', 'ManageMessages', 'KickMembers', 'BanMembers', 'ModerateMembers', 'ManageRoles'].includes(permission));
    return send(`**${targetMember.user.tag} permissions**\n\n${perms.join(', ') || 'none'}`);
  }
  if (command === 'reverse') return text ? send(text.split('').reverse().join('')) : null;
  if (command === 'upper') return text ? send(text.toUpperCase()) : null;
  if (command === 'lower') return text ? send(text.toLowerCase()) : null;
  if (command === 'titlecase') return text ? send(text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())) : null;
  if (command === 'clap') return text ? send(text.split(/\s+/).join(' 👏 ')) : null;
  if (command === 'sponge') return text ? send(text.split('').map((letter, index) => (index % 2 ? letter.toUpperCase() : letter.toLowerCase())).join('')) : null;
  if (command === 'vaporwave') return text ? send(text.replace(/[!-~]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0xFEE0))) : null;
  if (command === 'repeat') {
    const times = Math.min(Math.max(parseInt(args[0], 10) || 1, 1), 10);
    const repeated = args.slice(1).join(' ');
    return repeated ? send(Array(times).fill(repeated).join('\n')) : null;
  }
  if (command === 'length' || command === 'charcount') return text ? send(`characters: ${text.length}`) : null;
  if (command === 'wordcount') return text ? send(`words: ${text.trim().split(/\s+/).filter(Boolean).length}`) : null;
  if (command === 'firstletter') return text ? send(text.trim()[0] || 'none') : null;
  if (command === 'lastletter') return text ? send(text.trim().slice(-1) || 'none') : null;
  if (command === 'math') {
    const result = safeMath(text);
    return result === null ? send('invalid math.') : send(`${result}`);
  }
  if (command === 'add') return send(`${numberArg(args[0]) + numberArg(args[1])}`);
  if (command === 'subtract') return send(`${numberArg(args[0]) - numberArg(args[1])}`);
  if (command === 'multiply') return send(`${numberArg(args[0]) * numberArg(args[1])}`);
  if (command === 'divide') return numberArg(args[1]) === 0 ? send('cannot divide by zero.') : send(`${numberArg(args[0]) / numberArg(args[1])}`);
  if (command === 'percent') return send(`${(numberArg(args[0]) / 100) * numberArg(args[1])}`);
  if (command === 'random') {
    const min = Math.floor(numberArg(args[0], 1));
    const max = Math.floor(numberArg(args[1], 100));
    return send(`${Math.floor(Math.random() * (Math.max(min, max) - Math.min(min, max) + 1)) + Math.min(min, max)}`);
  }
  if (command === 'roll') {
    const sides = Math.max(parseInt(args[0], 10) || 6, 2);
    return send(`rolled ${Math.floor(Math.random() * sides) + 1}/${sides}`);
  }
  if (command === 'dice') return send(`rolled ${Math.floor(Math.random() * 6) + 1}/6`);
  if (command === 'rate') return text ? send(`${text}: ${Math.floor(Math.random() * 101)}/100`) : null;
  if (command === 'ship') return send(`ship score: ${Math.floor(Math.random() * 101)}%`);
  if (command === 'hug') return send(`${message.author} hugged ${targetUser}.`);
  if (command === 'pat') return send(`${message.author} patted ${targetUser}.`);
  if (command === 'slap') return send(`${message.author} slapped ${targetUser}.`);
  if (command === 'cry') return send(`${message.author} is crying.`);
  if (command === 'smile') return send(`${message.author} smiled.`);
  if (command === 'roast') return send(`${targetUser}, ${randomFrom(['you have the energy of a muted microphone.', 'your Wi-Fi has more personality.', 'even cooldowns move faster than you.', 'you are proof lag can become a person.'])}`);
  if (command === 'compliment') return send(`${targetUser}, ${randomFrom(['you are doing great.', 'your vibe is clean.', 'you make the server better.', 'you are appreciated.'])}`);
  if (command === 'quote') return send(randomFrom(['stay sharp.', 'silence is also an answer.', 'small steps still move forward.', 'discipline beats motivation.']));
  if (command === 'advice') return send(randomFrom(['drink water.', 'take a break.', 'double-check before sending.', 'do the important thing first.']));
  if (command === 'motivate') return send(randomFrom(['keep going.', 'you are closer than you think.', 'lock in.', 'one more try.']));
  if (command === 'fact') return send(randomFrom(['honey never spoils.', 'octopuses have three hearts.', 'bananas are berries.', 'sharks are older than trees.']));
  if (command === 'wyr') return send(randomFrom(['would you rather fly or teleport?', 'would you rather be invisible or read minds?', 'would you rather have unlimited time or unlimited money?']));
  if (command === 'truth') return send(randomFrom(['what is something you are avoiding?', 'what was your last lie?', 'what is your biggest goal right now?']));
  if (command === 'dare') return send(randomFrom(['send your last saved meme.', 'compliment someone here.', 'change your nickname for 10 minutes.']));
  if (command === 'topic') return send(randomFrom(['favorite game?', 'best movie ever?', 'what song is stuck in your head?', 'what is one thing you want to learn?']));
  return null;
}

async function replyPlain(interaction, text) {
  return interaction.reply({ embeds: [plainEmbed(text)] });
}

async function replyAura(interaction, text) {
  try {
    return interaction.reply({ embeds: [auraEmbed(text)], files: [await getAuraAttachment()] });
  } catch {
    return interaction.reply({ content: auraGif, embeds: [plainEmbed(text)] });
  }
}

async function askAi(prompt) {
  if (!openai) return 'AI is not configured yet.';
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    max_completion_tokens: 8192,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant inside a Discord server. Keep answers useful, friendly, and concise.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });
  return response.choices[0]?.message?.content?.trim() || 'I could not generate a response.';
}

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Invite link: ${getInviteLink()}`);
  for (const guild of client.guilds.cache.values()) {
    await registerSlashCommands(guild);
  }
});

client.on('guildCreate', registerSlashCommands);

function hasInteractionPermission(interaction, permission) {
  return interaction.memberPermissions?.has(permission);
}

async function getInteractionMember(interaction, name = 'user') {
  const user = interaction.options.getUser(name);
  if (!user) return null;
  return interaction.guild.members.fetch(user.id);
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) return;

  const command = interaction.commandName;

  try {
    if (command === 'help') {
      const embeds = helpSections.map(([section, commands]) => plainEmbed(
        `**${section}**\n\n${commands.map(([name, example, use]) => `**${prefix}${name}** — ${use}\n\`${example}\``).join('\n\n')}`,
      ));
      return interaction.reply({ embeds });
    }

    if (command === 'invite') {
      return replyPlain(interaction, `**invite link**\n\n${getInviteLink()}`);
    }

    if (command === 'ping') {
      return replyPlain(interaction, `pong — ${client.ws.ping}ms`);
    }

    if (command === 'botinfo') {
      return replyPlain(interaction, `**bot info**\n\nname: ${client.user.tag}\nid: ${client.user.id}\nservers: ${client.guilds.cache.size}\nping: ${client.ws.ping}ms`);
    }

    if (command === 'uptime') {
      return replyPlain(interaction, `online for ${formatDuration(client.uptime)}`);
    }

    if (command === 'ai') {
      const prompt = interaction.options.getString('prompt', true);
      await interaction.deferReply();
      const answer = await askAi(prompt);
      const chunks = splitDiscordText(answer);
      await interaction.editReply({ embeds: [plainEmbed(`**AI**\n\n${chunks[0]}`)] });
      for (const chunk of chunks.slice(1)) {
        await interaction.followUp({ embeds: [plainEmbed(chunk)] });
      }
      return;
    }

    if (command === 'mute') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.ModerateMembers)) return replyPlain(interaction, 'missing permission.');
      const member = await getInteractionMember(interaction);
      const minutes = interaction.options.getInteger('minutes') || 1;
      if (!member) return replyPlain(interaction, 'user not found.');
      await member.timeout(minutes * 60 * 1000);
      return replyAura(interaction, `${member.user.tag} — silenced for ${minutes}m.`);
    }

    if (command === 'unmute') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.ModerateMembers)) return replyPlain(interaction, 'missing permission.');
      const member = await getInteractionMember(interaction);
      if (!member) return replyPlain(interaction, 'user not found.');
      await member.timeout(null);
      return replyAura(interaction, `${member.user.tag} — unsilenced.`);
    }

    if (command === 'warn') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.ModerateMembers)) return replyPlain(interaction, 'missing permission.');
      const user = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'watch it';
      return replyAura(interaction, `${user.tag} — ${reason}.`);
    }

    if (command === 'kick') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.KickMembers)) return replyPlain(interaction, 'missing permission.');
      const member = await getInteractionMember(interaction);
      const reason = interaction.options.getString('reason') || 'no reason given';
      if (!member) return replyPlain(interaction, 'user not found.');
      await member.kick(reason);
      return replyAura(interaction, `${member.user.tag} — removed.`);
    }

    if (command === 'ban') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.BanMembers)) return replyPlain(interaction, 'missing permission.');
      const member = await getInteractionMember(interaction);
      const reason = interaction.options.getString('reason') || 'no reason given';
      if (!member) return replyPlain(interaction, 'user not found.');
      await member.ban({ reason });
      return replyAura(interaction, `${member.user.tag} — terminated.`);
    }

    if (command === 'purge') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.ManageMessages)) return replyPlain(interaction, 'missing permission.');
      const amount = interaction.options.getInteger('amount', true);
      if (amount < 1 || amount > 100) return replyPlain(interaction, 'amount must be 1-100.');
      await interaction.channel.bulkDelete(amount, true);
      return replyAura(interaction, 'completed');
    }

    if (command === 'slowmode') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.ManageChannels)) return replyPlain(interaction, 'missing permission.');
      const seconds = interaction.options.getInteger('seconds', true);
      if (seconds < 0 || seconds > 21600) return replyPlain(interaction, 'seconds must be 0-21600.');
      await interaction.channel.setRateLimitPerUser(seconds);
      return replyAura(interaction, `slowmode set to ${seconds}s.`);
    }

    if (command === 'lock') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.ManageChannels)) return replyPlain(interaction, 'missing permission.');
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      return replyAura(interaction, 'channel locked.');
    }

    if (command === 'unlock') {
      if (!hasInteractionPermission(interaction, PermissionsBitField.Flags.ManageChannels)) return replyPlain(interaction, 'missing permission.');
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      return replyAura(interaction, 'channel unlocked.');
    }

    if (command === 'avatar') {
      const user = interaction.options.getUser('user') || interaction.user;
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#2b2d31')
          .setDescription(`${user.tag}'s avatar`)
          .setImage(user.displayAvatarURL({ size: 1024 }))
          .setFooter({ text: '...' })],
      });
    }

    if (command === 'userinfo') {
      const member = await getInteractionMember(interaction).catch(() => null) || interaction.member;
      return replyPlain(interaction, `**user info**\n\nuser: ${member.user.tag}\nid: ${member.id}\njoined: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\ncreated: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`);
    }

    if (command === 'serverinfo') {
      return replyPlain(interaction, `**server info**\n\nname: ${interaction.guild.name}\nid: ${interaction.guild.id}\nmembers: ${interaction.guild.memberCount}\nroles: ${interaction.guild.roles.cache.size}\nchannels: ${interaction.guild.channels.cache.size}\ncreated: <t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:R>`);
    }

    if (command === 'servericon') {
      const icon = interaction.guild.iconURL({ size: 1024 });
      return interaction.reply({ embeds: [icon ? new EmbedBuilder().setColor('#2b2d31').setDescription(`${interaction.guild.name}'s icon`).setImage(icon).setFooter({ text: '...' }) : plainEmbed('no server icon found.')] });
    }

    if (command === 'membercount') return replyPlain(interaction, `members: ${interaction.guild.memberCount}`);

    if (command === 'roles') {
      const roles = interaction.guild.roles.cache.filter((role) => role.id !== interaction.guild.id).sort((a, b) => b.position - a.position).map((role) => role.name).slice(0, 40).join(', ');
      return replyPlain(interaction, `**roles**\n\n${roles || 'none'}`);
    }

    if (command === 'coinflip') return replyPlain(interaction, Math.random() < 0.5 ? 'heads' : 'tails');
    if (command === 'dice') return replyPlain(interaction, `rolled ${Math.floor(Math.random() * 6) + 1}/6`);
    if (command === '8ball') return replyPlain(interaction, randomFrom(['yes.', 'no.', 'maybe.', 'not today.', 'definitely.', 'ask again later.']));

    if (command === 'choose') {
      const options = interaction.options.getString('options', true).split('|').map((option) => option.trim()).filter(Boolean);
      if (options.length < 2) return replyPlain(interaction, 'give at least 2 options split with |');
      return replyPlain(interaction, `I choose: **${randomFrom(options)}**`);
    }

    if (command === 'poll') {
      const question = interaction.options.getString('question', true);
      const pollMessage = await interaction.reply({ embeds: [plainEmbed(`**poll**\n\n${question}`)], fetchReply: true });
      await pollMessage.react('✅');
      await pollMessage.react('❌');
      return;
    }

    if (command === 'reverse') return replyPlain(interaction, interaction.options.getString('text', true).split('').reverse().join(''));
    if (command === 'upper') return replyPlain(interaction, interaction.options.getString('text', true).toUpperCase());
    if (command === 'lower') return replyPlain(interaction, interaction.options.getString('text', true).toLowerCase());
    if (command === 'random') {
      const min = interaction.options.getInteger('min', true);
      const max = interaction.options.getInteger('max', true);
      return replyPlain(interaction, `${Math.floor(Math.random() * (Math.max(min, max) - Math.min(min, max) + 1)) + Math.min(min, max)}`);
    }
  } catch (error) {
    console.error('Slash command failed:', error);
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({ embeds: [plainEmbed('failed.')] }).catch(() => {});
    }
    return interaction.reply({ embeds: [plainEmbed('failed.')], ephemeral: true }).catch(() => {});
  }
});

client.on('messageDelete', (message) => {
  if (!message.guild || message.author?.bot || !message.content) return;

  deletedMessages.set(`${message.guild.id}:${message.channel.id}`, {
    author: message.author.tag,
    content: message.content,
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (!command) return;

  if (command === 'help') {
    const embeds = helpSections.map(([section, commands]) => plainEmbed(
      `**${section}**\n\n${commands.map(([name, example, use]) => `**${prefix}${name}** — ${use}\n\`${example}\``).join('\n\n')}`,
    ));

    return message.channel.send({ embeds });
  }

  if (command === 'invite') {
    return message.channel.send({
      embeds: [plainEmbed(`**invite link**\n\n${getInviteLink()}\n\nIf it still will not add, enable **Public Bot** in the Discord Developer Portal and make sure your account has **Manage Server** in the server.`)],
    });
  }

  if (command === 'ai' || command === 'chatgpt') {
    const prompt = args.join(' ');
    if (!prompt) {
      return message.channel.send({
        embeds: [plainEmbed('use it like this:\n`,ai how do I make a Discord embed?`')],
      });
    }

    if (!openai) {
      return message.channel.send({
        embeds: [plainEmbed('AI is not configured yet.')],
      });
    }

    const loadingMessage = await message.channel.send({
      embeds: [plainEmbed('thinking...')],
    });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        max_completion_tokens: 8192,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant inside a Discord server. Keep answers useful, friendly, and concise. If the user asks for code, explain clearly and include examples when helpful.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const answer = response.choices[0]?.message?.content?.trim() || 'I could not generate a response.';
      const chunks = splitDiscordText(answer);

      await loadingMessage.edit({
        embeds: [plainEmbed(`**AI**\n\n${chunks[0]}`)],
      });

      for (const chunk of chunks.slice(1)) {
        await message.channel.send({
          embeds: [plainEmbed(chunk)],
        });
      }
      return;
    } catch (error) {
      console.error('AI command failed:', error);
      return loadingMessage.edit({
        embeds: [plainEmbed('AI failed to respond right now.')],
      });
    }
  }

  if (command === 'ping') {
    return message.channel.send({ embeds: [plainEmbed(`pong — ${client.ws.ping}ms`)] });
  }

  if (command === 'botinfo') {
    return message.channel.send({
      embeds: [plainEmbed(`**bot info**\n\nname: ${client.user.tag}\nid: ${client.user.id}\nservers: ${client.guilds.cache.size}\nping: ${client.ws.ping}ms`)],
    });
  }

  if (command === 'uptime') {
    return message.channel.send({ embeds: [plainEmbed(`online for ${formatDuration(client.uptime)}`)] });
  }

  if (command === 'mute') {
    if (!hasPermission(message, PermissionsBitField.Flags.ModerateMembers)) return;

    const user = message.mentions.members.first();
    const time = parseInt(args[1], 10) || 1;
    if (!user) return;

    try {
      await user.timeout(time * 60 * 1000);
      return sendAura(message.channel, `${user.user.tag} — silenced for ${time}m.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'unmute') {
    if (!hasPermission(message, PermissionsBitField.Flags.ModerateMembers)) return;

    const user = message.mentions.members.first();
    if (!user) return;

    try {
      await user.timeout(null);
      return sendAura(message.channel, `${user.user.tag} — unsilenced.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'warn') {
    if (!hasPermission(message, PermissionsBitField.Flags.ModerateMembers)) return;

    const user = message.mentions.users.first();
    const reason = getReason(args, 1, 'watch it');
    if (!user) return;

    return sendAura(message.channel, `${user.tag} — ${reason}.`);
  }

  if (command === 'kick') {
    if (!hasPermission(message, PermissionsBitField.Flags.KickMembers)) return;

    const user = message.mentions.members.first();
    const reason = getReason(args, 1);
    if (!user) return;

    try {
      await user.kick(reason);
      return sendAura(message.channel, `${user.user.tag} — removed.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'ban') {
    if (!hasPermission(message, PermissionsBitField.Flags.BanMembers)) return;

    const user = message.mentions.members.first();
    const reason = getReason(args, 1);
    if (!user) return;

    try {
      await user.ban({ reason });
      return sendAura(message.channel, `${user.user.tag} — terminated.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'unban') {
    if (!hasPermission(message, PermissionsBitField.Flags.BanMembers)) return;

    const userId = args[0];
    if (!userId) return;

    try {
      await message.guild.members.unban(userId);
      return sendAura(message.channel, `${userId} — restored.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'softban') {
    if (!hasPermission(message, PermissionsBitField.Flags.BanMembers)) return;

    const user = message.mentions.members.first();
    const reason = getReason(args, 1);
    if (!user) return;

    try {
      await user.ban({ deleteMessageSeconds: 604800, reason });
      await message.guild.members.unban(user.id, 'softban complete');
      return sendAura(message.channel, `${user.user.tag} — cleaned.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'clear' || command === 'purge') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageMessages)) return;

    const amount = parseInt(args[0], 10);
    if (!amount || amount < 1 || amount > 100) return;

    try {
      await message.channel.bulkDelete(amount, true);
      return sendAura(message.channel, 'completed');
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'purgeuser') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageMessages)) return;

    const user = message.mentions.users.first();
    const amount = parseInt(args[1], 10);
    if (!user || !amount || amount < 1 || amount > 100) return;

    try {
      const messages = await message.channel.messages.fetch({ limit: 100 });
      const filtered = messages.filter((msg) => msg.author.id === user.id).first(amount);
      await message.channel.bulkDelete(filtered, true);
      return sendAura(message.channel, `completed — deleted ${filtered.length} from ${user.tag}.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'purgebots') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageMessages)) return;

    const amount = parseInt(args[0], 10) || 20;
    if (amount < 1 || amount > 100) return;

    try {
      const messages = await message.channel.messages.fetch({ limit: 100 });
      const filtered = messages.filter((msg) => msg.author.bot).first(amount);
      await message.channel.bulkDelete(filtered, true);
      return sendAura(message.channel, `completed — deleted ${filtered.length} bot messages.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'slowmode') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) return;

    const seconds = parseInt(args[0], 10);
    if (Number.isNaN(seconds) || seconds < 0 || seconds > 21600) return;

    try {
      await message.channel.setRateLimitPerUser(seconds);
      return sendAura(message.channel, `slowmode set to ${seconds}s.`);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'lock') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) return;

    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      return sendAura(message.channel, 'channel locked.');
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'unlock') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) return;

    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
      return sendAura(message.channel, 'channel unlocked.');
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'hide') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) return;

    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false });
      return sendAura(message.channel, 'channel hidden.');
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'show') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) return;

    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: null });
      return sendAura(message.channel, 'channel visible.');
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'nick') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageNicknames)) return;

    const user = message.mentions.members.first();
    const nickname = args.slice(1).join(' ');
    if (!user || !nickname) return;

    try {
      await user.setNickname(nickname);
      return message.channel.send({ embeds: [plainEmbed(`${user.user.tag} nickname changed to ${nickname}.`)] });
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'roleadd' || command === 'addrole') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageRoles)) return;

    const user = message.mentions.members.first();
    const role = message.mentions.roles.first();
    if (!user || !role) return;

    try {
      await user.roles.add(role);
      return message.channel.send({ embeds: [plainEmbed(`${role.name} added to ${user.user.tag}.`)] });
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'roleremove' || command === 'removerole') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageRoles)) return;

    const user = message.mentions.members.first();
    const role = message.mentions.roles.first();
    if (!user || !role) return;

    try {
      await user.roles.remove(role);
      return message.channel.send({ embeds: [plainEmbed(`${role.name} removed from ${user.user.tag}.`)] });
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'settopic') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) return;

    const topic = args.join(' ');
    if (!topic) return;

    try {
      await message.channel.setTopic(topic);
      return message.channel.send({ embeds: [plainEmbed('topic updated.')] });
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'renamechannel') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) return;

    const name = args.join('-').toLowerCase();
    if (!name) return;

    try {
      await message.channel.setName(name);
      return message.channel.send({ embeds: [plainEmbed(`channel renamed to ${name}.`)] });
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'say') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageMessages)) return;

    const text = args.join(' ');
    if (!text) return;

    try {
      await message.delete().catch(() => {});
      return message.channel.send(text);
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'announce') {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageMessages)) return;

    const text = args.join(' ');
    if (!text) return;

    return message.channel.send({ embeds: [plainEmbed(`**announcement**\n\n${text}`)] });
  }

  if (command === 'poll') {
    const question = args.join(' ');
    if (!question) return;

    const pollMessage = await message.channel.send({ embeds: [plainEmbed(`**poll**\n\n${question}`)] });
    await pollMessage.react('✅');
    await pollMessage.react('❌');
    return;
  }

  if (command === 'choose') {
    const options = args.join(' ').split('|').map((option) => option.trim()).filter(Boolean);
    if (options.length < 2) return;

    const choice = options[Math.floor(Math.random() * options.length)];
    return message.channel.send({ embeds: [plainEmbed(`I choose: **${choice}**`)] });
  }

  if (command === 'coinflip') {
    return message.channel.send({ embeds: [plainEmbed(Math.random() < 0.5 ? 'heads' : 'tails')] });
  }

  if (command === '8ball') {
    const answers = ['yes.', 'no.', 'maybe.', 'not today.', 'definitely.', 'ask again later.'];
    return message.channel.send({ embeds: [plainEmbed(answers[Math.floor(Math.random() * answers.length)])] });
  }

  if (command === 'avatar') {
    const user = message.mentions.users.first() || message.author;

    return message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor('#2b2d31')
        .setDescription(`${user.tag}'s avatar`)
        .setImage(user.displayAvatarURL({ size: 1024 }))
        .setFooter({ text: '...' })],
    });
  }

  if (command === 'banner') {
    const user = message.mentions.users.first() || message.author;
    const fetchedUser = await client.users.fetch(user.id, { force: true });
    const banner = fetchedUser.bannerURL({ size: 1024 });

    return message.channel.send({ embeds: [banner ? new EmbedBuilder().setColor('#2b2d31').setDescription(`${user.tag}'s banner`).setImage(banner).setFooter({ text: '...' }) : plainEmbed('no banner found.')] });
  }

  if (command === 'userinfo') {
    const user = message.mentions.members.first() || message.member;

    return message.channel.send({
      embeds: [plainEmbed(`**user info**\n\nuser: ${user.user.tag}\nid: ${user.id}\njoined: <t:${Math.floor(user.joinedTimestamp / 1000)}:R>\ncreated: <t:${Math.floor(user.user.createdTimestamp / 1000)}:R>\nroles: ${user.roles.cache.size - 1}`)],
    });
  }

  if (command === 'serverinfo') {
    return message.channel.send({
      embeds: [plainEmbed(`**server info**\n\nname: ${message.guild.name}\nid: ${message.guild.id}\nmembers: ${message.guild.memberCount}\nroles: ${message.guild.roles.cache.size}\nchannels: ${message.guild.channels.cache.size}\ncreated: <t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`)],
    });
  }

  if (command === 'servericon') {
    const icon = message.guild.iconURL({ size: 1024 });
    return message.channel.send({ embeds: [icon ? new EmbedBuilder().setColor('#2b2d31').setDescription(`${message.guild.name}'s icon`).setImage(icon).setFooter({ text: '...' }) : plainEmbed('no server icon found.')] });
  }

  if (command === 'membercount') {
    return message.channel.send({ embeds: [plainEmbed(`members: ${message.guild.memberCount}`)] });
  }

  if (command === 'roles') {
    const roles = message.guild.roles.cache
      .filter((role) => role.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((role) => role.name)
      .slice(0, 40)
      .join(', ');

    return message.channel.send({ embeds: [plainEmbed(`**roles**\n\n${roles || 'none'}`)] });
  }

  if (command === 'roleinfo') {
    const role = message.mentions.roles.first();
    if (!role) return;

    return message.channel.send({ embeds: [plainEmbed(`**role info**\n\nname: ${role.name}\nid: ${role.id}\nmembers: ${role.members.size}\nposition: ${role.position}\ncreated: <t:${Math.floor(role.createdTimestamp / 1000)}:R>`)] });
  }

  if (command === 'channelinfo') {
    return message.channel.send({ embeds: [plainEmbed(`**channel info**\n\nname: ${message.channel.name}\nid: ${message.channel.id}\ntype: ${message.channel.type}\ncreated: <t:${Math.floor(message.channel.createdTimestamp / 1000)}:R>`)] });
  }

  if (command === 'id') {
    const user = message.mentions.users.first() || message.author;
    return message.channel.send({ embeds: [plainEmbed(`${user.tag}: ${user.id}`)] });
  }

  if (command === 'bans') {
    if (!hasPermission(message, PermissionsBitField.Flags.BanMembers)) return;

    try {
      const bans = await message.guild.bans.fetch();
      const list = bans.map((ban) => `${ban.user.tag} (${ban.user.id})`).slice(0, 10).join('\n');
      return message.channel.send({ embeds: [plainEmbed(`**bans: ${bans.size}**\n\n${list || 'none'}`)] });
    } catch {
      return message.reply('failed.');
    }
  }

  if (command === 'snipe') {
    const deleted = deletedMessages.get(`${message.guild.id}:${message.channel.id}`);
    if (!deleted) return message.channel.send({ embeds: [plainEmbed('nothing to snipe.')] });

    return message.channel.send({ embeds: [plainEmbed(`**${deleted.author}**\n\n${deleted.content}`)] });
  }

  return handleExtraCommand(message, command, args);
});

client.login(token);
