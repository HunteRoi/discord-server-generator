import { Guild } from 'discord.js';

import { CreateChannelOptions, ChannelType, ParentChannelAndChildren } from '../types';

export async function createChannels(guild: Guild, options: CreateChannelOptions, parent?: ChannelType): Promise<ParentChannelAndChildren> {
  if (parent) {
    if (parent.type !== 'category') return;

    if (!options.parent || options.parent != parent.id) {
      options.parent = parent.id;
    }
  }

  const channel = await guild.channels.create(options.name, options);
  if (!channel) return;

  let children = new Array<ParentChannelAndChildren>();
  if (options.children) {
    children = await Promise.all(options.children.map(opts => createChannels(guild, opts, channel)));
  }
  
  return { channel, children: children.filter(child => !!child) };
}
