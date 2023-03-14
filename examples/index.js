const { Client, IntentsBitField, ChannelType } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const synchronizeSlashCommands = require('discord-sync-commands');

const { ServerGeneratorManager, ServerGeneratorManagerEvents } = require('../lib');

const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildEmojisAndStickers] });
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
const manager = new ServerGeneratorManager(client, { reason: 'A ServerGeneratorManager action!' });

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand() && interaction.commandName === 'generate') {
    await interaction.deferReply({ ephemeral: true });
    await manager.generate(interaction.guildId, {
      name: 'new guild name',
      icon: './examples/icon.jpg',
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
          type: ChannelType.GuildText,
        },
        {
          name: 'afk',
          isAFKChannel: true,
          type: ChannelType.GuildVoice,
        },
        {
          name: 'general',
          type: ChannelType.GuildText,
        },
      ],
      channels: [
        {
          name: 'CategorY',
          type: ChannelType.GuildCategory,
          children: [
            {
              name: 'bot',
              type: ChannelType.GuildText,
              children: [{ name: 'thread name' }],
            },
            {
              name: 'voice',
              type: ChannelType.GuildVoice,
              userLimit: 5,
            },
          ],
        },
      ],
      emojis: [{ name: 'red', attachment: './examples/icon.jpg' }],
    });
  }
});

client.on('ready', () => console.log('Connected!'));

manager.on(ServerGeneratorManagerEvents.guildGenerate, (guild, options, reason) => {
  console.log(`Generating guild ${guild.id} for reason ${reason} with options`, options);
});

manager.on(ServerGeneratorManagerEvents.guildGenerated, (guild, options, reason) => {
  console.log(`Generated guild ${guild.id} for reason ${reason} with options`, options);
});

manager.on(ServerGeneratorManagerEvents.roleDelete, (role, reason) => {
  console.log(`Role ${role.id} deleted for reason ${reason}`);
});

manager.on(ServerGeneratorManagerEvents.channelDelete, (channel, reason) => {
  console.log(`Channel ${channel.id} deleted for reason ${reason}`);
});

manager.on(ServerGeneratorManagerEvents.emojiDelete, (emoji, reason) => {
  console.log(`Emoji ${emoji.id} deleted for reason ${reason}`);
});

manager.on(ServerGeneratorManagerEvents.stickerDelete, (sticker, reason) => {
  console.log(`Sticker ${sticker.id} deleted for reason ${reason}`);
});

manager.on(ServerGeneratorManagerEvents.channelCreate, (channel, options, reason) => {
  console.log(`Channel ${channel.id} created for reason ${reason} with options`, options);
});

manager.on(ServerGeneratorManagerEvents.threadCreate, (thread, options, reason) => {
  console.log(`Thread ${thread.id} created for reason ${reason} with options`, options);
});

manager.on(ServerGeneratorManagerEvents.roleCreate, (role, options, reason) => {
  console.log(`Role ${role.id} created for reason ${reason} with options`, options);
});

manager.on(ServerGeneratorManagerEvents.emojiCreate, (emoji, options, reason) => {
  console.log(`Emoji ${emoji.id} created for reason ${reason} with options`, options);
});

manager.on(ServerGeneratorManagerEvents.stickerCreate, (sticker, options, reason) => {
  console.log(`Sticker ${sticker.id} created for reason ${reason} with options`, options);
});

client.login('TOKEN');
