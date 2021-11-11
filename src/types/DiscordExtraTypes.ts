import {
	GuildEmojiCreateOptions,
	BufferResolvable,
	Base64Resolvable,
	FileOptions,
	MessageAttachment,
	GuildStickerCreateOptions,
} from 'discord.js';
import { Stream } from 'stream';

export type GuildStickerOptions = {
	file: BufferResolvable | Stream | FileOptions | MessageAttachment;
	name: string;
	tags: string;
	options?: GuildStickerCreateOptions;
};

export type GuildEmojiOptions = {
	attachment: BufferResolvable | Base64Resolvable;
	name: string;
	options?: GuildEmojiCreateOptions;
};

export type DeletableEntity<T> = {
	delete(reason?: string): Promise<T>;
};
