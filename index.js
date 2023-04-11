const path = require('node:path');

module.exports = {
    name: 'Reminders',
    version: '1.1.0',
    cookiebot: '1.4.0',
    description: 'Crear recordatorios.',
    dependencies: [],
    enabled: true,
    async plugin (bot) {
        require('../../events/commands')(bot, path.join(__dirname, 'commands'));
        require('./worker')(bot);
    }
}
