const { Client, Intents } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const synchronizeSlashCommands = require('discord-sync-commands');
const {
  ServerGeneratorManager,
  ServerGeneratorManagerEvents,
} = require('../lib');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS],
});
synchronizeSlashCommands(
  client,
  [
    new SlashCommandBuilder()
      .setName('generate')
      .setDescription(
        'Deletes all channels, roles etc. and generates a new guild based on the configuration'
      ),
  ],
  {}
);
const manager = new ServerGeneratorManager(client, {
  reason: 'A ServerGeneratorManager action!',
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand() && interaction.commandName === 'generate') {
    await interaction.deferReply({ ephemeral: true });
    await manager.generate(interaction.guildId, {
      name: 'new guild name',
      icon: './example/icon.jpg',
      roles: [
        {
          name: 'first role',
        },
        {
          name: 'second',
        },
      ],
      rootChannels: [
        {
          name: 'rules',
          isRulesChannel: true,
          type: 'GUILD_TEXT',
        },
        {
          name: 'afk',
          isAFKChannel: true,
          type: 'GUILD_VOICE',
        },
        {
          name: 'general',
          type: 'GUILD_TEXT',
        },
      ],
      channels: [
        {
          name: 'CategorY',
          children: [
            {
              name: 'bot',
              type: 'GUID_TEXT',
              children: [{ name: 'thread name' }],
            },
            {
              name: 'voice',
              type: 'GUILD_VOICE',
              userLimit: 5,
            },
          ],
        },
      ],
      emojis: [{ name: 'red', attachment: './example/icon.jpg' }],
    });
  }
});

client.on('ready', () => console.log('Connected!'));

manager.on(ServerGeneratorManagerEvents.guildGenerate, (guild, options) => {
  console.log(`Generating guild ${guild.id} with options`, options);
});

manager.on(ServerGeneratorManagerEvents.guildGenerated, (guild, options) => {
  console.log(`Generated guild ${guild.id} with options`, options);
});

manager.on(ServerGeneratorManagerEvents.roleDelete, (role) => {
  console.log(`Role ${role.id} deleted`);
});

manager.on(ServerGeneratorManagerEvents.channelDelete, (channel) => {
  console.log(`Channel ${channel.id} deleted`);
});

manager.on(ServerGeneratorManagerEvents.emojiDelete, (emoji) => {
  console.log(`Emoji ${emoji.id} deleted`);
});

manager.on(ServerGeneratorManagerEvents.stickerDelete, (sticker) => {
  console.log(`Sticker ${sticker.id} deleted`);
});

manager.on(ServerGeneratorManagerEvents.channelCreate, (channel, options) => {
  console.log(`Channel ${channel.id} created with options`, options);
});

manager.on(ServerGeneratorManagerEvents.threadCreate, (thread, options) => {
  console.log(`Thread ${thread.id} created with options`, options);
});

manager.on(ServerGeneratorManagerEvents.roleCreate, (role, options) => {
  console.log(`Role ${role.id} created with options`, options);
});

manager.on(ServerGeneratorManagerEvents.emojiCreate, (emoji, options) => {
  console.log(`Emoji ${emoji.id} created with options`, options);
});

manager.on(ServerGeneratorManagerEvents.stickerCreate, (sticker, options) => {
  console.log(`Sticker ${sticker.id} created with options`, options);
});

client.login('TOKEN');
