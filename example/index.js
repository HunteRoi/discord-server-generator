const { Client } = require('discord.js');
const { ServerGeneratorManager } = require('../lib');

const client = new Client();
const manager = new ServerGeneratorManager(client);

client.on('ready', () => console.log('Connected!'));

manager.on('', () => console.log(``));

client.login('TOKEN');
