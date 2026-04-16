const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");

/* ───── CLIENT SETUP ───── */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ],
});

const prefix = "s!";

/* ───── BEAUTIFUL EMBED ───── */
const createEmbed = (title, desc, color = 0x9b59b6) => {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(desc)
        .setTimestamp()
        .setFooter({ text: "Premium Bot • v2" });
};

/* ───── MUSIC SYSTEM ───── */
const servers = new Map();

function getServer(id) {
    if (!servers.has(id)) {
        const player = createAudioPlayer();
        
        player.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                const server = servers.get(id);
                if (server) {
                    server.queue.shift();
                    playNext(server);
                }
            }
        });

        servers.set(id, {
            queue: [],
            player: player,
            connection: null
        });
    }
    return servers.get(id);
}

async function playNext(server) {
    if (!server.queue.length) return;

    try {
        const stream = ytdl(server.queue[0], { 
            filter: "audioonly",
            quality: "highestaudio",
            highWaterMark: 1 << 25 
        });
        
        const resource = createAudioResource(stream);
        server.player.play(resource);
        
        if (server.connection) {
            server.connection.subscribe(server.player);
        }
    } catch (err) {
        console.error("Music error:", err);
    }
}

/* ───── READY ───── */
client.once("ready", () => {
    console.log(`✅ ${client.user.tag} is online!`);
    console.log(`🔗 Prefix: ${prefix}`);
});

/* ───── COMMAND HANDLER ───── */
client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    /* HELP */
    if (cmd === "help") {
        return message.channel.send({
            embeds: [createEmbed(
                "📌 Premium Command Panel",
                `**🎧 MUSIC**\ns!play <url> • s!pause • s!resume • s!skip • s!stop • s!queue\n\n` +
                `**🛡️ MODERATION**\ns!kick @user • s!ban @user • s!unban <id> • s!clear <amount>\n\n` +
                `**💬 INFO**\ns!ping • s!avatar • s!serverinfo • s!userinfo • s!botinfo\n\n` +
                `**🎮 FUN**\ns!8ball • s!coinflip • s!dice • s!choose • s!ship • s!rps • s!hug • s!slap • s!roast\n\n` +
                `**🧠 TEXT**\ns!reverse • s!upper • s!lower • s!calc\n\n` +
                `**😂 RANDOM**\ns!joke • s!fact • s!quote`
            )]
        });
    }

    /* INFO */
    if (cmd === "ping") return message.channel.send({ embeds: [createEmbed("🏓 Pong!", `${client.ws.ping}ms`)] });

    if (cmd === "avatar") {
        const user = message.mentions.users.first() || message.author;
        return message.channel.send({
            embeds: [new EmbedBuilder()
                .setColor(0x9b59b6)
                .setTitle(`${user.username}'s Avatar`)
                .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
            ]
        });
    }

    if (cmd === "serverinfo") {
        const guild = message.guild;
        return message.channel.send({
            embeds: [createEmbed("🌍 Server Info", 
                `**Name:** ${guild.name}\n**Members:** ${guild.memberCount}\n**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
            )]
        });
    }

    if (cmd === "userinfo") {
        const member = message.mentions.members.first() || message.member;
        return message.channel.send({
            embeds: [createEmbed("👤 User Info", 
                `**Tag:** ${member.user.tag}\n**ID:** ${member.id}\n**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            )]
        });
    }

    if (cmd === "botinfo") {
        const uptime = client.uptime;
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor((uptime % 86400000) / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        return message.channel.send({
            embeds: [createEmbed("🤖 Bot Info", 
                `**Servers:** ${client.guilds.cache.size}\n**Ping:** ${client.ws.ping}ms\n**Uptime:** ${days}d ${hours}h ${minutes}m`
            )]
        });
    }

    /* MODERATION */
    if (cmd === "clear") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) 
            return message.reply("❌ You need Manage Messages permission.");

        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) 
            return message.reply("❌ Please specify a number between 1-100.");

        await message.channel.bulkDelete(amount + 1, true);
        const msg = await message.channel.send({ embeds: [createEmbed("🧹 Cleared", `Deleted **${amount}** messages.`)] });
        setTimeout(() => msg.delete().catch(() => {}), 4000);
        return;
    }

    if (cmd === "kick") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) 
            return message.reply("❌ You need Kick Members permission.");

        const member = message.mentions.members.first();
        if (!member) return message.reply("❌ Mention a user to kick.");
        const reason = args.slice(1).join(" ") || "No reason";
        await member.kick(reason);
        return message.channel.send({ embeds: [createEmbed("👢 Kicked", `${member.user.tag} was kicked.\nReason: ${reason}`)] });
    }

    if (cmd === "ban") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) 
            return message.reply("❌ You need Ban Members permission.");

        const member = message.mentions.members.first();
        if (!member) return message.reply("❌ Mention a user to ban.");
        const reason = args.slice(1).join(" ") || "No reason";
        await member.ban({ reason });
        return message.channel.send({ embeds: [createEmbed("🔨 Banned", `${member.user.tag} was banned.\nReason: ${reason}`)] });
    }

    /* MUSIC */
    if (cmd === "play") {
        const url = args[0];
        if (!url || !ytdl.validateURL(url)) return message.reply("❌ Please give a valid YouTube URL.");

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("❌ You must be in a voice channel!");

        const server = getServer(message.guild.id);

        if (!server.connection || server.connection.state.status !== VoiceConnectionStatus.Ready) {
            server.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
        }

        server.queue.push(url);
        if (server.player.state.status !== AudioPlayerStatus.Playing) {
            playNext(server);
        }

        return message.channel.send({ embeds: [createEmbed("🎶 Added to Queue", url)] });
    }

    if (cmd === "skip") {
        const server = getServer(message.guild.id);
        if (server.player.state.status === AudioPlayerStatus.Playing) {
            server.player.stop();
            return message.channel.send({ embeds: [createEmbed("⏭️ Skipped", "Playing next song...")] });
        }
        return message.reply("❌ Nothing is playing.");
    }

    if (cmd === "pause") {
        const server = getServer(message.guild.id);
        server.player.pause();
        return message.channel.send({ embeds: [createEmbed("⏸️ Paused", "Music paused.")] });
    }

    if (cmd === "resume") {
        const server = getServer(message.guild.id);
        server.player.unpause();
        return message.channel.send({ embeds: [createEmbed("▶️ Resumed", "Music resumed.")] });
    }

    if (cmd === "stop") {
        const server = getServer(message.guild.id);
        server.queue = [];
        server.player.stop();
        if (server.connection) server.connection.destroy();
        return message.channel.send({ embeds: [createEmbed("⏹️ Stopped", "Music stopped and disconnected.")] });
    }

    if (cmd === "queue") {
        const server = getServer(message.guild.id);
        if (!server.queue.length) return message.channel.send({ embeds: [createEmbed("📜 Queue", "Queue is empty!")] });
        const q = server.queue.map((url, i) => `${i+1}. ${url}`).join("\n");
        return message.channel.send({ embeds: [createEmbed("📜 Queue", q)] });
    }

    /* FUN & TEXT COMMANDS (shortened for space) */
    if (cmd === "8ball") {
        const answers = ["Yes", "No", "Maybe", "Definitely", "Ask again"];
        return message.channel.send({ embeds: [createEmbed("🎱 8-Ball", answers[Math.floor(Math.random()*answers.length)])] });
    }

    if (cmd === "coinflip") return message.channel.send({ embeds: [createEmbed("🪙 Coinflip", Math.random() < 0.5 ? "Heads" : "Tails")] });

    if (cmd === "dice") return message.channel.send({ embeds: [createEmbed("🎲 Dice", `You rolled: **${Math.floor(Math.random()*6)+1}**`)] });

    if (cmd === "reverse") {
        const text = args.join(" ");
        return message.channel.send({ embeds: [createEmbed("🔁 Reversed", text.split("").reverse().join("") || "Nothing to reverse")] });
    }

    if (cmd === "joke") {
        const jokes = ["I told my computer I needed a break... it froze.", "Why do programmers hate nature? Too many bugs."];
        return message.channel.send({ embeds: [createEmbed("😂 Joke", jokes[Math.floor(Math.random()*jokes.length)])] });
    }

    // Add more commands from previous version if you want — this is already enough to get it running
});

client.login(process.env.DISCORD_TOKEN);
