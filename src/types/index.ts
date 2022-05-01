import {
  CreateRoleOptions,
  GuildChannelCreateOptions,
  GuildCreateOptions,
  ThreadCreateOptions,
  AllowedThreadTypeForTextChannel,
  AllowedThreadTypeForNewsChannel,
  CategoryCreateChannelOptions,
} from 'discord.js';

import { GuildEmojiOptions, GuildStickerOptions } from './DiscordExtraTypes';

export { DeletableEntity } from './DiscordExtraTypes';
export * from './ServerGeneratorOptions';

type AnyProperty = {
  [name: string]: any;
};

export type RoleOptions = Omit<CreateRoleOptions, 'name'> & {
  name: string;
} & AnyProperty;
export type EmojiOptions = GuildEmojiOptions & AnyProperty;
export type StickerOptions = GuildStickerOptions & AnyProperty;

export type CategoryOptions = Omit<GuildChannelCreateOptions, 'type'> & {
  readonly type: 'GUILD_CATEGORY';
  children?: GuildChannelOptions[];
} & AnyProperty;
export type GuildChannelOptions = GuildChannelCreateOptions & {
  type:
    | 'GUILD_TEXT'
    | 'GUILD_VOICE'
    | 'GUILD_NEWS'
    | 'GUILD_STORE'
    | 'GUILD_STAGE_VOICE';
  children?: ThreadOptions[];
} & AnyProperty;
export type ThreadOptions = ThreadCreateOptions<
  AllowedThreadTypeForTextChannel | AllowedThreadTypeForNewsChannel
> &
  AnyProperty;

export type GuildOptions = {
  emojis?: EmojiOptions[];
  stickers?: StickerOptions[];
  roles?: RoleOptions[];
  rootChannels?: GuildChannelOptions[];
  channels?: CategoryOptions[];
} & Omit<GuildCreateOptions, 'channels' | 'roles'>;
