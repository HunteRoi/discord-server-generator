import {
	AllowedThreadTypeForNewsChannel,
	AllowedThreadTypeForTextChannel,
	Client,
	Collection,
	Constants,
	DataManager,
	Guild,
	GuildChannelManager,
	GuildEmojiManager,
	GuildResolvable,
	GuildStickerManager,
	Intents,
	NewsChannel,
	RoleManager,
	Snowflake,
	ThreadChannel,
	ThreadCreateOptions,
} from 'discord.js';
import EventEmitter from 'events';

import { ServerGeneratorManagerEvents } from './ServerGeneratorManagerEvents';
import {
	CategoryOptions,
	GuildChannelOptions,
	GuildOptions,
	RoleOptions,
	EmojiOptions,
	StickerOptions,
	DeletableEntity,
	ServerGeneratorOptions,
	ThreadOptions,
} from './types';
import { handleChannelCreate } from './handlers';

/**
 *
 * @export
 * @class ServerGeneratorManager
 * @extends {EventEmitter}
 */
export class ServerGeneratorManager extends EventEmitter {
	private client: Client;
	public options: ServerGeneratorOptions;
	private hasOptionalIntent: boolean = false;

	constructor(client: Client, options: ServerGeneratorOptions) {
		super();

		const intents = new Intents(client.options.intents);
		if (!intents.has(Intents.FLAGS.GUILDS)) {
			throw new Error('GUILDS intent is required to use this package!');
		}
		if (!intents.has(Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS)) {
			console.warn(
				'GUILD_EMOJIS_AND_STICKERS intent is optional for this package to work but could be a nice addition.'
			);
		} else this.hasOptionalIntent = true;

		this.client = client;
		this.options = options;

		this.on(
			ServerGeneratorManagerEvents.channelCreate,
			handleChannelCreate
		);
	}

	public async generate(guild: GuildResolvable, options: GuildOptions) {
		const target = await this.client.guilds.fetch({ guild });
		await this.getCaches(target);
		if (target.roles.highest != target.roles.botRoleFor(this.client.user))
			throw new Error(
				"The bot's role has to be the highest in order to generate the whole guild from scratch."
			);

		this.emit(ServerGeneratorManagerEvents.guildGenerate, target, options);

		if (this.hasOptionalIntent) {
			await this.delete(
				target.emojis.cache,
				ServerGeneratorManagerEvents.emojiDelete,
				this.options.reason
			);
			await this.delete(
				target.stickers.cache,
				ServerGeneratorManagerEvents.stickerDelete,
				this.options.reason
			);
		}
		await this.delete(
			target.roles.cache.filter(
				(r) => r !== target.roles.everyone && !r.managed
			),
			ServerGeneratorManagerEvents.roleDelete,
			this.options.reason
		);
		await this.delete(
			target.channels.cache.filter((c) => !c.isThread()),
			ServerGeneratorManagerEvents.channelDelete,
			this.options.reason
		);

		if (this.hasOptionalIntent) {
			await this.createEmojis(
				target.emojis,
				options.emojis,
				this.options.reason
			);
			await this.createStickers(
				target.stickers,
				options.stickers,
				this.options.reason
			);
		}
		await this.createRoles(
			target.roles,
			options.roles,
			this.options.reason
		);
		await this.createChannels(
			target.channels,
			options.rootChannels,
			this.options.reason
		);
		await this.createChannels(
			target.channels,
			options.channels,
			this.options.reason
		);

		await target.edit(options, this.options.reason);

		this.emit(ServerGeneratorManagerEvents.guildGenerated, target, options);
	}

	private async getCaches(guild: Guild) {
		if (this.hasOptionalIntent) {
			await guild.emojis.fetch();
			await guild.stickers.fetch();
		}
		await guild.roles.fetch();
		await guild.channels.fetch();
	}

	private async delete<T, Holds>(
		collection: Collection<T, Holds>,
		event: string,
		reason?: string
	) {
		if (!collection || !event) return;

		for (const [_, entity] of collection) {
			await (entity as unknown as DeletableEntity<Holds>).delete(reason);
			this.emit(event, entity as Holds);
		}
	}

	private async createRoles(
		roles: RoleManager,
		roleOptions: RoleOptions[],
		reason?: string
	) {
		if (!roles || !roleOptions) return;

		for (const options of roleOptions) {
			const role = await roles.create({ reason, ...options });
			this.emit(ServerGeneratorManagerEvents.roleCreate, role, options);
		}
	}

	private async createThreads(
		channels: GuildChannelManager,
		threadOptions: ThreadOptions[],
		textChannelId: Snowflake,
		reason?: string
	) {
		if (!channels || !textChannelId || !threadOptions) return;
		const textChannel = await channels.fetch(textChannelId);
		if (!textChannel.isText()) return;

		for (const options of threadOptions) {
			let thread: ThreadChannel;
			if (textChannel instanceof NewsChannel) {
				thread = await textChannel.threads.create({
					reason,
					...options,
				} as ThreadCreateOptions<AllowedThreadTypeForNewsChannel>);
			} else {
				thread = await textChannel.threads.create({
					reason,
					...options,
				} as ThreadCreateOptions<AllowedThreadTypeForTextChannel>);
			}
			this.emit(
				ServerGeneratorManagerEvents.threadCreate,
				thread,
				options
			);
		}
	}

	private async createChannels(
		channels: GuildChannelManager,
		channelOptions: (CategoryOptions | GuildChannelOptions)[],
		reason?: string,
		parent?: Snowflake
	) {
		if (!channels || !channelOptions) return;

		for (const options of channelOptions) {
			const channel = await channels.create(options.name, {
				reason,
				type: Constants.ChannelTypes[
					Constants.ChannelTypes.GUILD_CATEGORY
				],
				...options,
				parent,
			});
			this.emit(
				ServerGeneratorManagerEvents.channelCreate,
				channel,
				options
			);

			const isCategory =
				!parent &&
				channel.type ===
					Constants.ChannelTypes[
						Constants.ChannelTypes.GUILD_CATEGORY
					];

			if (options.children && isCategory) {
				await this.createChannels(
					channels,
					options.children as GuildChannelOptions[],
					reason,
					channel.id
				);
			} else if (options.children && channel.isText()) {
				await this.createThreads(
					channels,
					options.children as ThreadOptions[],
					channel.id,
					reason
				);
			}
		}
	}

	private async createEmojis(
		emojis: GuildEmojiManager,
		emojiOptions: EmojiOptions[],
		reason?: string
	) {
		if (!emojis || !emojiOptions) return;

		for (const options of emojiOptions) {
			const emoji = await emojis.create(
				options.attachment,
				options.name,
				{ reason, ...options.options }
			);
			this.emit(ServerGeneratorManagerEvents.emojiCreate, emoji, options);
		}
	}

	private async createStickers(
		stickers: GuildStickerManager,
		stickerOptions: StickerOptions[],
		reason?: string
	) {
		if (!stickers || !stickerOptions) return;
		if (
			stickers.guild.premiumTier ===
			Constants.PremiumTiers[Constants.PremiumTiers.NONE]
		)
			return;

		for (const options of stickerOptions) {
			const sticker = await stickers.create(
				options.file,
				options.name,
				options.tags,
				{ reason, ...options.options }
			);
			this.emit(
				ServerGeneratorManagerEvents.stickerCreate,
				sticker,
				options
			);
		}
	}
}

/**
 * Emitted when a guild is being generated by the manager.
 * @event ServerGeneratorManager#guildGenerate
 * @param {Guild} Guild
 * @param {GuildOptions} options
 * @example
 * manager.on(ServerGeneratorManagerEvents.guildGenerate, (guild, options) => {
 *  console.log(`Generating guild ${guild.id} with options`, options);
 * });
 */

/**
 * Emitted when a guild has just been generated by the manager.
 * @event ServerGeneratorManager#guildGenerated
 * @param {Guild} Guild
 * @param {GuildOptions} options
 * @example
 * manager.on(ServerGeneratorManagerEvents.guildGenerated, (guild, options) => {
 *  console.log(`Generated guild ${guild.id} with options`, options);
 * });
 */

/**
 * Emitted when an old role is being deleted by the manager when generating the guild.
 * @event ServerGeneratorManager#roleDelete
 * @param {Role} role
 * @example
 * manager.on(ServerGeneratorManagerEvents.roleDelete, (role) => {
 *  console.log(`Role ${role.id} deleted`);
 * });
 */

/**
 * Emitted when an old channel is being deleted by the manager when generating the guild.
 * @event ServerGeneratorManager#channelDelete
 * @param {GuildChannel} channel
 * @example
 * manager.on(ServerGeneratorManagerEvents.channelDelete, (channel) => {
 *  console.log(`Channel ${channel.id} deleted`);
 * });
 */

/**
 * Emitted when an old emoji is being deleted by the manager when generating the guild.
 * @event ServerGeneratorManager#emojiDelete
 * @param {GuildEmoji} emoji
 * @example
 * manager.on(ServerGeneratorManagerEvents.emojiDelete, (emoji) => {
 *  console.log(`Emoji ${emoji.id} deleted`);
 * });
 */

/**
 * Emitted when an old sticker is being deleted by the manager when generating the guild.
 * @event ServerGeneratorManager#stickerDelete
 * @param {Sticker} sticker
 * @example
 * manager.on(ServerGeneratorManagerEvents.stickerDelete, (sticker) => {
 *  console.log(`Sticker ${sticker.id} deleted`);
 * });
 */

/**
 * Emitted when a new channel is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#channelCreate
 * @param { TextChannel | VoiceChannel | CategoryChannel | NewsChannel | StoreChannel | StageChannel} channel
 * @param {GuildChannelOptions} options
 * @example
 * manager.on(ServerGeneratorManagerEvents.channelCreate, (channel, options) => {
 *  console.log(`Channel ${channel.id} created with options`, options);
 * });
 */

/**
 * Emitted when a new thread is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#threadCreate
 * @param {ThreadChannel} thread
 * @param {ThreadOptions} options
 * @example
 * manager.on(ServerGeneratorManagerEvents.threadCreate, (thread, options) => {
 *  console.log(`Thread ${thread.id} created with options`, options);
 * });
 */

/**
 * Emitted when a new role is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#roleCreate
 * @param {Role} role
 * @param {RoleOptions} options
 * @example
 * manager.on(ServerGeneratorManagerEvents.roleCreate, (role, options) => {
 *  console.log(`Role ${role.id} created with options`, options);
 * });
 */

/**
 * Emitted when a new emoji is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#emojiCreate
 * @param {GuildEmoji} emoji
 * @param {EmojiOptions} options
 * @example
 * manager.on(ServerGeneratorManagerEvents.emojiCreate, (emoji, options) => {
 *  console.log(`Emoji ${emoji.id} created with options`, options);
 * });
 */

/**
 * Emitted when a new sticker is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#stickerCreate
 * @param {Sticker} sticker
 * @param {StickerOptions} options
 * @example
 * manager.on(ServerGeneratorManagerEvents.stickerCreate, (sticker, options) => {
 *  console.log(`Sticker ${sticker.id} created with options`, options);
 * });
 */
