// logger.js
const fs = require('fs');
const path = require('path');
const errorLogPath = path.join(__dirname, './data/error_log.json');

function logError(error, commandName, client) {
    const errorMessage = {
        command: commandName,
        error: error.message,
        stack: error.stack,
        time: new Date().toISOString()
    };

    // Log to console
    console.error(errorMessage);

    // Append to error_log.json
    let errorLogs = [];
    try {
        errorLogs = JSON.parse(fs.readFileSync(errorLogPath, 'utf8'));
    } catch (error) {
        console.error('Error reading error_log.json:', error);
    }
    errorLogs.push(errorMessage);
    fs.writeFileSync(errorLogPath, JSON.stringify(errorLogs, null, 2));

    // Send direct message to admin
    const adminId = '130156972174475264';
    const adminUser = client.users.cache.get(adminId);
    if (adminUser) {
        adminUser.send(`Error in command ${commandName}: ${error.message}\n\nStack Trace:\n${error.stack}`);
    }
}

module.exports = {
    logError
};
