// utils.js
const fs = require('fs');
const path = require('path');
const playersPath = path.join(__dirname, './data/players.json');
const leaderboardMessageIdPath = path.join(__dirname, './data/leaderboardMessageId.json');

async function updateLeaderboard(client) {
    let players;
    try {
        players = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
    } catch (error) {
        console.error('Error reading players.json:', error);
        players = [];
    }

    players.sort((a, b) => b.balance - a.balance);
    const leaderboardMessageId = JSON.parse(fs.readFileSync(leaderboardMessageIdPath, 'utf8'));

    const leaderboardChannel = client.channels.cache.find(channel => channel.name === 'leaderboard');
    if (leaderboardChannel) {
        let leaderboardMessage;
        try {
            leaderboardMessage = await leaderboardChannel.messages.fetch(leaderboardMessageId.id);
        } catch (error) {
            console.error('Error fetching leaderboard message:', error);
        }

        if (leaderboardMessage) {
            const leaderboardContent = players.map((player, index) => `${index + 1}. ${player.nickname}: ${player.balance}`).join('\n');
            await leaderboardMessage.edit(leaderboardContent);
        } else {
            const leaderboardContent = players.map((player, index) => `${index + 1}. ${player.nickname}: ${player.balance}`).join('\n');
            const newMessage = await leaderboardChannel.send(leaderboardContent);
            fs.writeFileSync(leaderboardMessageIdPath, JSON.stringify({ id: newMessage.id }));
        }
    }

    // Save updated player data
    fs.writeFileSync(playersPath, JSON.stringify(players, null, 2));
}

module.exports = {
    updateLeaderboard
};
