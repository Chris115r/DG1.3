const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

class PaperTrading {
    constructor() {
        this.loadData();
    }

    loadData() {
        this.trades = this.loadJSON('trades.json');
        this.players = this.loadJSON('players.json');
        this.availableTradeIds = this.loadJSON('availableTradeIds.json');
        this.leaderboardMessageId = this.loadJSON('leaderboardMessageId.json');
    }

    loadJSON(fileName) {
        try {
            const data = fs.readFileSync(`./data/${fileName}`);
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error loading ${fileName}:`, error);
            return {};
        }
    }

    saveJSON(fileName, data) {
        try {
            fs.writeFileSync(`./data/${fileName}`, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Error saving ${fileName}:`, error);
        }
    }

    getTradesByUser(userId) {
        return Object.values(this.trades).filter(trade => trade.userId === userId);
    }

    registerUser(userId, nickname) {
        if (!this.players[userId]) {
            this.players[userId] = {
                userId: userId,
                nickname: nickname,
                balance: 100000,
                trades: []
            };
            this.saveJSON('players.json', this.players);
        } else {
            throw new Error('User is already registered.');
        }
    }

    isUserRegistered(userId) {
        return !!this.players[userId];
    }

    resetData() {
        this.trades = {};
        this.players = {};
        this.availableTradeIds = [];
        this.saveJSON('trades.json', this.trades);
        this.saveJSON('players.json', this.players);
        this.saveJSON('availableTradeIds.json', this.availableTradeIds);
    }

    async updateLeaderboard(guild) {
        const leaderboardChannel = guild.channels.cache.find(channel => channel.name === 'leaderboard');
        if (!leaderboardChannel) return;

        const sortedPlayers = Object.values(this.players).sort((a, b) => b.balance - a.balance);
        const embed = new EmbedBuilder()
            .setTitle('Leaderboard')
            .setColor('#00FF00')
            .setDescription(sortedPlayers.map((player, index) => `${index + 1}. ${player.nickname} - $${player.balance}`).join('\n'));

        try {
            if (this.leaderboardMessageId.messageId) {
                const message = await leaderboardChannel.messages.fetch(this.leaderboardMessageId.messageId);
                await message.edit({ embeds: [embed] });
            } else {
                throw new Error('Message not found');
            }
        } catch (error) {
            const message = await leaderboardChannel.send({ embeds: [embed] });
            this.leaderboardMessageId.messageId = message.id;
            this.saveJSON('leaderboardMessageId.json', this.leaderboardMessageId);
        }
    }

    getBalance(userId) {
        const player = this.players[userId];
        if (player) {
            return player.balance;
        } else {
            throw new Error('User not found.');
        }
    }

    editBalance(userId, amount) {
        const player = this.players[userId];
        if (player) {
            player.balance = amount;
            this.saveJSON('players.json', this.players);
        } else {
            throw new Error('User not found.');
        }
    }

    logTrade(trade) {
        const logEntry = {
            tradeId: trade.tradeId,
            userId: trade.userId,
            type: trade.type,
            symbol: trade.symbol,
            amount: trade.amount,
            status: trade.status,
            time: new Date().toISOString()
        };
        this.saveJSON('trade_log.json', logEntry);
    }

    createTrade(userId, type, symbol, amount) {
        const tradeId = this.generateTradeId();
        const trade = {
            tradeId: tradeId,
            userId: userId,
            type: type,
            symbol: symbol,
            amount: amount,
            status: 'open',
            time: new Date().toISOString()
        };
        this.trades[tradeId] = trade;
        this.saveJSON('trades.json', this.trades);
        this.logTrade(trade);
        return trade;
    }

    closeTrade(tradeId) {
        const trade = this.trades[tradeId];
        if (trade) {
            trade.status = 'closed';
            trade.closeTime = new Date().toISOString();
            this.saveJSON('trades.json', this.trades);
            this.logTrade(trade);
            this.availableTradeIds.push(tradeId);
            this.saveJSON('availableTradeIds.json', this.availableTradeIds);
            return trade;
        } else {
            throw new Error('Trade not found.');
        }
    }

    generateTradeId() {
        if (this.availableTradeIds.length > 0) {
            return this.availableTradeIds.shift();
        } else {
            const tradeIds = Object.keys(this.trades).map(id => parseInt(id));
            return tradeIds.length > 0 ? Math.max(...tradeIds) + 1 : 1;
        }
    }

    // Add more methods as necessary...
}

module.exports = PaperTrading;
