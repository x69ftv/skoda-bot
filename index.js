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

/* ───── CLIENT ───── */
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

/* ───── PREMIUM AESTHETIC EMBED ───── */
const createEmbed = (title, desc, color = 0x9b59b6, thumbnail = null) => {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(desc)
        .setTimestamp()
        .setFooter({ text: "✦ Premium Bot • v3 Aesthetic Edition" });
    if (thumbnail) embed.setThumbnail(thumbnail);
    return embed;
};

/* ───── MUSIC SYSTEM ───── */
const servers = new Map();

function getServer(id) {
    if (!servers.has(id)) {
        const player = createAudioPlayer();
        player.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle) {
                const server = servers.get(id);
                if (server && server.queue.length) {
                    server.queue.shift();
                    playNext(server);
                }
            }
        });
        servers.set(id, { queue: [], player, connection: null });
    }
    return servers.get(id);
}

async function playNext(server) {
    if (!server.queue.length) return;
    try {
        const stream = ytdl(server.queue[0], { filter: "audioonly", highWaterMark: 1 << 25 });
        const resource = createAudioResource(stream);
        server.player.play(resource);
        if (server.connection) server.connection.subscribe(server.player);
    } catch (e) { console.error(e); }
}

/* ───── READY ───── */
client.once("ready", () => {
    console.log(`🌟 ${client.user.tag} is now online with premium aesthetic!`);
    console.log(`🔗 Prefix: ${prefix}`);
});

/* ───── COMMAND HANDLER ───── */
client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    /* ====================== HELP ====================== */
    if (cmd === "help") {
        return message.channel.send({
            embeds: [createEmbed(
                "✦ Premium Command Panel",
                "**🎧 Music** • `play` `pause` `resume` `skip` `stop` `queue`\n" +
                "**🛡️ Moderation** • `kick` `ban` `unban` `clear` `mute` `unmute`\n" +
                "**💎 Info** • `ping` `avatar` `serverinfo` `userinfo` `botinfo` `uptime`\n" +
                "**🎮 Fun** • `8ball` `coinflip` `dice` `rps` `ship` `hug` `slap` `roast` `meme`\n" +
                "**🧠 Text** • `reverse` `upper` `lower` `calc` `say`\n" +
                "**😂 Random** • `joke` `fact` `quote` `cat` `dog`\n\n" +
                "Type `s!help <category>` for more details (e.g. `s!help music`)"
            )]
        });
    }

    /* ====================== MUSIC ====================== */
    if (cmd === "play") {
        const url = args[0];
        if (!url || !ytdl.validateURL(url)) return message.reply("❌ Provide a valid YouTube URL.");
        const voice = message.member.voice.channel;
        if (!voice) return message.reply("❌ Join a voice channel first!");

        const server = getServer(message.guild.id);
        if (!server.connection) {
            server.connection = joinVoiceChannel({
                channelId: voice.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
        }
        server.queue.push(url);
        if (server.player.state.status !== AudioPlayerStatus.Playing) playNext(server);
        return message.channel.send({ embeds: [createEmbed("🎵 Added to Queue", url, 0x00ff88)] });
    }

    if (cmd === "pause") {
        const server = getServer(message.guild.id);
        server.player.pause();
        return message.channel.send({ embeds: [createEmbed("⏸️ Paused", "Music has been paused.", 0xffaa00)] });
    }

    if (cmd === "resume") {
        const server = getServer(message.guild.id);
        server.player.unpause();
        return message.channel.send({ embeds: [createEmbed("▶️ Resumed", "Music is playing again.", 0x00ff88)] });
    }

    if (cmd === "skip") {
        const server = getServer(message.guild.id);
        if (server.player.state.status === AudioPlayerStatus.Playing) {
            server.player.stop();
            return message.channel.send({ embeds: [createEmbed("⏭️ Skipped", "Next song playing...")] });
        }
        return message.reply("❌ Nothing playing.");
    }

    if (cmd === "stop") {
        const server = getServer(message.guild.id);
        server.queue = [];
        server.player.stop();
        if (server.connection) server.connection.destroy();
        return message.channel.send({ embeds: [createEmbed("⏹️ Stopped", "Queue cleared and disconnected.", 0xff0000)] });
    }

    if (cmd === "queue") {
        const server = getServer(message.guild.id);
        if (!server.queue.length) return message.channel.send({ embeds: [createEmbed("📜 Queue", "Empty queue!")] });
        const list = server.queue.map((url, i) => `${i+1}. ${url}`).join("\n");
        return message.channel.send({ embeds: [createEmbed("📜 Current Queue", list)] });
    }

    /* ====================== MODERATION ====================== */
    if (cmd === "clear") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply("❌ No permission.");
        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) return message.reply("❌ 1-100 messages only.");
        await message.channel.bulkDelete(amount + 1, true);
        const confirm = await message.channel.send({ embeds: [createEmbed("🧹 Cleared", `Deleted **${amount}** messages.`)] });
        setTimeout(() => confirm.delete().catch(() => {}), 5000);
    }

    if (cmd === "kick") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply("❌ No permission.");
        const member = message.mentions.members.first();
        if (!member) return message.reply("❌ Mention a user.");
        const reason = args.slice(1).join(" ") || "No reason";
        await member.kick(reason);
        message.channel.send({ embeds: [createEmbed("👢 Kicked", `${member.user.tag} kicked.\nReason: ${reason}`)] });
    }

    if (cmd === "ban") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply("❌ No permission.");
        const member = message.mentions.members.first();
        if (!member) return message.reply("❌ Mention a user.");
        const reason = args.slice(1).join(" ") || "No reason";
        await member.ban({ reason });
        message.channel.send({ embeds: [createEmbed("🔨 Banned", `${member.user.tag} banned.\nReason: ${reason}`)] });
    }

    if (cmd === "unban") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply("❌ No permission.");
        const id = args[0];
        if (!id) return message.reply("❌ Provide user ID.");
        await message.guild.members.unban(id);
        message.channel.send({ embeds: [createEmbed("✅ Unbanned", `User ${id} has been unbanned.`)] });
    }

    /* ====================== INFO ====================== */
    if (cmd === "ping") return message.channel.send({ embeds: [createEmbed("🏓 Pong!", `**${client.ws.ping}ms**`, 0x00ffff)] });

    if (cmd === "avatar") {
        const user = message.mentions.users.first() || message.author;
        message.channel.send({
            embeds: [new EmbedBuilder()
                .setColor(0x9b59b6)
                .setTitle(`${user.username}'s Avatar`)
                .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
            ]
        });
    }

    if (cmd === "serverinfo") {
        const g = message.guild;
        message.channel.send({ embeds: [createEmbed("🌍 Server Info", 
            `**Name:** ${g.name}\n**Members:** ${g.memberCount}\n**Created:** <t:${Math.floor(g.createdTimestamp/1000)}:R>\n**Boosts:** ${g.premiumSubscriptionCount || 0}`
        )] });
    }

    if (cmd === "botinfo") {
        const uptime = Math.floor(client.uptime / 1000);
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        message.channel.send({ embeds: [createEmbed("🤖 Bot Info", 
            `**Servers:** ${client.guilds.cache.size}\n**Ping:** ${client.ws.ping}ms\n**Uptime:** ${days}d ${hours}h`
        )] });
    }

    /* ====================== FUN ====================== */
    if (cmd === "8ball") {
        const answers = ["Yes ✨", "No 😔", "Maybe 🤔", "Definitely 💯", "Ask again later ⏳"];
        message.channel.send({ embeds: [createEmbed("🎱 Magic 8-Ball", answers[Math.floor(Math.random()*answers.length)])] });
    }

    if (cmd === "coinflip") message.channel.send({ embeds: [createEmbed("🪙 Coin Flip", Math.random() < 0.5 ? "**Heads**" : "**Tails**")] });

    if (cmd === "dice") message.channel.send({ embeds: [createEmbed("🎲 Dice", `You rolled **${Math.floor(Math.random()*6)+1}**`)] });

    if (cmd === "rps") {
        const choices = ["rock", "paper", "scissors"];
        const userChoice = args[0]?.toLowerCase();
        if (!choices.includes(userChoice)) return message.reply("Choose rock, paper or scissors.");
        const botChoice = choices[Math.floor(Math.random()*3)];
        let result = "Tie!";
        if ((userChoice === "rock" && botChoice === "scissors") || 
            (userChoice === "paper" && botChoice === "rock") || 
            (userChoice === "scissors" && botChoice === "paper")) result = "You win! 🎉";
        else if (userChoice !== botChoice) result = "Bot wins! 🤖";
        message.channel.send({ embeds: [createEmbed("✊ Rock Paper Scissors", `You: ${userChoice}\nBot: ${botChoice}\n**${result}**`)] });
    }

    if (cmd === "ship") {
        const users = message.mentions.users;
        if (users.size < 2) return message.reply("Mention two users!");
        const percent = Math.floor(Math.random() * 101);
        message.channel.send({ embeds: [createEmbed("💘 Ship", `${Array.from(users)[0][1].username} ❤️ ${Array.from(users)[1][1].username}\n**${percent}%** compatible`)] });
    }

    if (cmd === "hug") {
        const user = message.mentions.users.first() || message.author;
        message.channel.send({ embeds: [createEmbed("🤗 Hug", `${message.author.username} gives ${user.username} a warm hug 💕`)] });
    }

    if (cmd === "slap") {
        const user = message.mentions.users.first() || message.author;
        message.channel.send({ embeds: [createEmbed("👋 Slap", `${message.author.username} slaps ${user.username} 😤`)] });
    }

    if (cmd === "roast") {
        const user = message.mentions.users.first() || message.author;
        const roasts = ["You're like a cloud... when you disappear it's a beautiful day.", "Your secrets are safe with me... I wasn't even listening."];
        message.channel.send({ embeds: [createEmbed("🔥 Roast", `${user.username}, ${roasts[Math.floor(Math.random()*roasts.length)]}`)] });
    }

    /* ====================== TEXT ====================== */
    if (cmd === "reverse") {
        const text = args.join(" ");
        message.channel.send({ embeds: [createEmbed("🔁 Reversed", text.split("").reverse().join("") || "Nothing to reverse!")] });
    }

    if (cmd === "upper") {
        const text = args.join(" ");
        message.channel.send({ embeds: [createEmbed("🔠 Uppercase", text.toUpperCase() || "Nothing!")] });
    }

    if (cmd === "lower") {
        const text = args.join(" ");
        message.channel.send({ embeds: [createEmbed("🔡 Lowercase", text.toLowerCase() || "Nothing!")] });
    }

    if (cmd === "calc") {
        try {
            const result = eval(args.join(" "));
            message.channel.send({ embeds: [createEmbed("🧮 Calculator", `**Result:** ${result}`)] });
        } catch { message.channel.send({ embeds: [createEmbed("❌ Error", "Invalid expression!")] }); }
    }

    /* ====================== RANDOM ====================== */
    if (cmd === "joke") {
        const jokes = ["Why do programmers prefer dark mode? Because light attracts bugs.", "I told my computer I needed a break... it froze."];
        message.channel.send({ embeds: [createEmbed("😂 Joke", jokes[Math.floor(Math.random()*jokes.length)])] });
    }

    if (cmd === "fact") {
        const facts = ["Octopuses have three hearts.", "Bananas are berries.", "Sharks existed before trees."];
        message.channel.send({ embeds: [createEmbed("📘 Fact", facts[Math.floor(Math.random()*facts.length)])] });
    }

    if (cmd === "quote") {
        const quotes = ["Discipline is choosing between what you want now and what you want most.", "Small steps every day."];
        message.channel.send({ embeds: [createEmbed("💭 Quote", quotes[Math.floor(Math.random()*quotes.length)])] });
    }
});

client.login(process.env.DISCORD_TOKEN);
