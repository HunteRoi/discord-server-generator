import { Collection, Guild, OverwriteResolvable, Role } from 'discord.js';

import { ParentChannelAndChildren, RoleChannelConfiguration, ChannelType } from '../types';
import { ServerGeneratorManager } from '..';

export async function generateRoleChannel(manager: ServerGeneratorManager, guild: Guild, configuration: RoleChannelConfiguration) {
  let role: Role;
  
  if (configuration.role) {
    const existsAlready = guild.roles.cache.array().map(r => r.name).includes(configuration.role.name);
    role = existsAlready && await guild.roles.create({ data: configuration.role });
    if (role instanceof Role) manager.emit('createRole', role);
    else manager.emit('noCreateRole');
  }

  const channel = await guild.channels.create(configuration.channel.name, configuration.channel);
  manager.emit('createChannel', channel);

  const children: Array<ChannelType> = [];
  if (configuration.channel.children && channel.type === 'category') {
    for (const child of configuration.channel.children) {
      if (child.type === 'category') {
        manager.emit('noCreateChildChannel', child);
        return;
      }

      if (!child.parent || child.parent != channel.id) {
        child.parent = channel.id;
      }

      if (role && child.permissionOverwrites) {
        if (child.permissionOverwrites instanceof Collection) {
          child.permissionOverwrites = child.permissionOverwrites.array();
        }

        child.permissionOverwrites = child.permissionOverwrites
          .map((permOverwrite: OverwriteResolvable) => permOverwrite.id === 'ROLE' ? { ...permOverwrite, id: role.id } : permOverwrite);
      }

      const childChannel = await guild.channels.create(child.name, child);
      manager.emit('createChilChannel', channel, childChannel);
      
      children.push(childChannel);
    }
  }
  
  return { role, channel, children } as ParentChannelAndChildren;  
}
