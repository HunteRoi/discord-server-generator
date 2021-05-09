import { GuildChannelCloneOptions } from 'discord.js';

export interface CreateChannelOptions extends GuildChannelCloneOptions {
  children?: CreateChannelOptions[];
}
