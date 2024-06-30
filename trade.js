const { SlashCommandBuilder } = require('@discordjs/builders');
const trading = require('../trading');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Execute a trade')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of trade (buy/sell)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('symbol')
                .setDescription('The symbol to trade')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount to trade')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('takeprofit')
                .setDescription('Take profit (optional)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('stoploss')
                .setDescription('Stop loss (optional)')
                .setRequired(false)),
    async execute(interaction) {
        const paperTraderRole = 'Paper Trader';

        if (!interaction.member.roles.cache.some(role => role.name === paperTraderRole)) {
            await interaction.reply('You need to be registered as a Paper Trader to use this command. Please register first.');
            return;
        }

        const type = interaction.options.getString('type');
        const symbol = interaction.options.getString('symbol');
        const amount = interaction.options.getInteger('amount');
        const takeProfit = interaction.options.getInteger('takeprofit');
        const stopLoss = interaction.options.getInteger('stoploss');

        const tradeDetails = {
            type,
            symbol,
            amount,
            takeProfit,
            stopLoss,
            user: interaction.user.id,
            status: 'open',
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: true })
        };

        trading.createTrade(tradeDetails);
        await interaction.reply(`Trade executed: ${type} ${amount} of ${symbol}.`);

        const tradeLog = require('./tradeLog');
        tradeLog(tradeDetails.tradeId, interaction.user.username, type, symbol, amount, takeProfit, stopLoss, 'open', tradeDetails.timestamp);

        // After trade close code
        tradeLog(tradeDetails.tradeId, interaction.user.username, 'close', symbol, amount, takeProfit, stopLoss, 'closed', new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: true }));
    },
};
