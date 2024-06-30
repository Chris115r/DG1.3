const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
const playersPath = path.join(__dirname, '../data/players.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your balance'),
    async execute(interaction) {
        const paperTraderRole = 'Paper Trader';

        if (!interaction.member.roles.cache.some(role => role.name === paperTraderRole)) {
            await interaction.reply('You need to be registered as a Paper Trader to use this command. Please register first.');
            return;
        }

        const userId = interaction.user.id;
        let players;
        try {
            players = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
        } catch (error) {
            console.error('Error reading players.json:', error);
            players = [];
        }

        const player = players.find(p => p.userId === userId);
        if (player) {
            await interaction.reply(`Your balance is ${player.balance}.`);
        } else {
            await interaction.reply('You are not registered. Please register first.');
        }
    },
};
