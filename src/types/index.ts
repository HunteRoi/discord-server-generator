import type {
    AllowedThreadTypeForNewsChannel,
    AllowedThreadTypeForTextChannel,
    ChannelType,
    GuildChannelCreateOptions,
    GuildCreateOptions,
    GuildEmojiCreateOptions,
    GuildForumThreadCreateOptions,
    GuildStickerCreateOptions,
    GuildTextThreadCreateOptions,
    RoleCreateOptions,
} from "discord.js";

export * from "./ServerGeneratorOptions.js";

// biome-ignore lint: should allow any property possible
type AnyProperty = Record<string, any>;

export type RoleOptions = RoleCreateOptions & AnyProperty;
export type EmojiOptions = GuildEmojiCreateOptions & AnyProperty;
export type StickerOptions = GuildStickerCreateOptions & AnyProperty;

export type CategoryOptions = Omit<GuildChannelCreateOptions, "type"> & {
    readonly type: ChannelType.GuildCategory;
    children?: GuildChannelOptions[];
} & AnyProperty;
export type GuildChannelOptions = GuildChannelCreateOptions & {
    type: Exclude<
        ChannelType,
        | ChannelType.DM
        | ChannelType.GroupDM
        | ChannelType.PublicThread
        | ChannelType.AnnouncementThread
        | ChannelType.PrivateThread
        | ChannelType.GuildCategory
    >;
    children?: ThreadOptions[];
} & AnyProperty;
export type ThreadOptions = (
    | GuildForumThreadCreateOptions
    | GuildTextThreadCreateOptions<
          AllowedThreadTypeForTextChannel | AllowedThreadTypeForNewsChannel
      >
) &
    AnyProperty;

export type GuildOptions = {
    emojis?: EmojiOptions[];
    stickers?: StickerOptions[];
    roles?: RoleOptions[];
    rootChannels?: GuildChannelOptions[];
    channels?: CategoryOptions[];
} & Omit<GuildCreateOptions, "channels" | "roles">;

export interface DeletableEntity<T> {
    delete(reason?: string): Promise<T>;
}
