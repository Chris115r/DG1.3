const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
const { updateLeaderboard } = require('./utils');
const { logError } = require('./logger');

const playersPath = path.join(__dirname, './data/players.json');
const announcementsChannelName = 'dg-announcements';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register a new user'),
    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const nickname = interaction.user.username;
            const initialBalance = 100000;
            const paperTraderRole = 'Paper Trader';

            let players;
            try {
                players = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
            } catch (error) {
                logError(error, 'register', interaction.client);
                players = [];
            }

            const existingPlayer = players.find(p => p.userId === userId);

            const member = interaction.guild.members.cache.get(userId);
            if (member) {
                const role = interaction.guild.roles.cache.find(role => role.name === paperTraderRole);
                if (role && member.roles.cache.has(role.id)) {
                    await interaction.reply('You are already registered.');
                    return;
                } else {
                    if (existingPlayer) {
                        existingPlayer.balance = initialBalance;
                    } else {
                        players.push({ userId, nickname, balance: initialBalance });
                    }

                    fs.writeFileSync(playersPath, JSON.stringify(players, null, 2));
                    await member.roles.add(role);

                    const announcementsChannel = interaction.client.channels.cache.find(channel => channel.name === announcementsChannelName);
                    if (announcementsChannel) {
                        await announcementsChannel.send(`Welcome <@${userId}>! You have been registered with an initial balance of ${initialBalance}. Use /help to get started.`);
                    }

                    await updateLeaderboard(interaction.client);
                    await interaction.reply(`User ${nickname} registered successfully with a balance of ${initialBalance}.`);
                }
            } else {
                await interaction.reply('An error occurred. Please try again later.');
            }
        } catch (error) {
            logError(error, 'register', interaction.client);
        }
    },
};
