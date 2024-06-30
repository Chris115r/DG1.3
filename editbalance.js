const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
const { updateLeaderboard } = require('./utils');
const { logError } = require('./logger');

const playersPath = path.join(__dirname, './data/players.json');
const profitAllocationChannelName = 'profit-allocation';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editbalance')
        .setDescription('Edit a user\'s balance')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose balance to edit')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount to set the balance to')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const userId = interaction.options.getUser('user').id;
            const amount = interaction.options.getInteger('amount');
            const paperTraderRole = 'Paper Trader';

            if (!interaction.member.roles.cache.some(role => role.name === paperTraderRole)) {
                await interaction.reply('You need to be registered as a Paper Trader to use this command. Please register first.');
                return;
            }

            let players;
            try {
                players = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
            } catch (error) {
                logError(error, 'editbalance', interaction.client);
                players = [];
            }

            const player = players.find(p => p.userId === userId);
            if (player) {
                player.balance += amount;
                fs.writeFileSync(playersPath, JSON.stringify(players, null, 2));

                await interaction.reply(`User ${interaction.options.getUser('user').username}'s balance updated to ${player.balance}.`);

                const profitAllocationChannel = interaction.client.channels.cache.find(channel => channel.name === profitAllocationChannelName);
                if (profitAllocationChannel) {
                    const message = amount > 0 ? 
                        `User ${interaction.options.getUser('user').username} has just won ${amount} amount!` : 
                        `User ${interaction.options.getUser('user').username} has just lost ${Math.abs(amount)} amount.`;
                    await profitAllocationChannel.send(message);
                }

                await updateLeaderboard(interaction.client);
            } else {
                await interaction.reply('User not found.');
            }
        } catch (error) {
            logError(error, 'editbalance', interaction.client);
        }
    },
};
