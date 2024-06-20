import EventEmitter from "node:events";
import {
    type AllowedThreadTypeForNewsChannel,
    type AllowedThreadTypeForTextChannel,
    type CategoryChannel,
    ChannelType,
    type Client,
    type Collection,
    ForumChannel,
    GatewayIntentBits,
    type Guild,
    type GuildBasedChannel,
    type GuildChannelManager,
    type GuildEmojiManager,
    type GuildForumThreadCreateOptions,
    GuildPremiumTier,
    type GuildResolvable,
    type GuildStickerManager,
    type GuildTextThreadCreateOptions,
    NewsChannel,
    type RoleManager,
    type Snowflake,
    type StageChannel,
    TextChannel,
    type ThreadChannel,
    type VoiceChannel,
} from "discord.js";

import { ServerGeneratorManagerEvents } from "./ServerGeneratorManagerEvents.js";
import type {
    CategoryOptions,
    DeletableEntity,
    EmojiOptions,
    GuildChannelOptions,
    GuildOptions,
    RoleOptions,
    ServerGeneratorOptions,
    StickerOptions,
    ThreadOptions,
} from "./types/index.js";

/**
 *
 * @export
 * @class ServerGeneratorManager
 * @extends {EventEmitter}
 */
export class ServerGeneratorManager extends EventEmitter {
    private client: Client;
    public options: ServerGeneratorOptions;
    private hasOptionalIntent = false;

    constructor(
        client: Client,
        options: ServerGeneratorOptions = {
            reason: `Automated by ${client.user}`,
        },
    ) {
        super();

        if (!client.options.intents.has(GatewayIntentBits.Guilds)) {
            throw new Error("GUILDS intent is required to use this package!");
        }
        if (
            !client.options.intents.has(
                GatewayIntentBits.GuildEmojisAndStickers,
            )
        ) {
            console.warn(
                "GUILD_EMOJIS_AND_STICKERS intent is optional for this package to work but could be a nice addition.",
            );
        } else this.hasOptionalIntent = true;

        this.client = client;
        this.options = options;

        this.on(
            ServerGeneratorManagerEvents.channelCreate,
            this.#handleChannelCreate,
        );
    }

    /**
     * Generates a guild from scratch with the given options.
     *
     * @param {GuildResolvable} guild
     * @param {GuildOptions} options
     * @param {string?} [reason]
     * @memberof ServerGeneratorManager
     */
    public async generate(
        guild: GuildResolvable,
        options: GuildOptions,
        reason?: string,
    ) {
        if (!this.client.isReady()) {
            throw new Error("You should call this method on client#ready");
        }

        const overallReason =
            reason ?? this.options.reason ?? "Automated by the bot";
        const target = await this.client.guilds.fetch({ guild });
        await this.#getCaches(target);

        if (
            target.roles.highest !== target.roles.botRoleFor(this.client.user)
        ) {
            throw new Error(
                "The bot's role has to be the highest in order to generate the whole guild from scratch.",
            );
        }

        this.emit(
            ServerGeneratorManagerEvents.guildGenerate,
            target,
            options,
            overallReason,
        );
        await this.#deleteEverything(target, overallReason);
        await this.#createEverything(target, options, overallReason);
        this.emit(
            ServerGeneratorManagerEvents.guildGenerated,
            target,
            options,
            overallReason,
        );
    }

    async #handleChannelCreate(
        channel:
            | TextChannel
            | VoiceChannel
            | CategoryChannel
            | NewsChannel
            | StageChannel,
        options: CategoryOptions | GuildChannelOptions,
        reason?: string,
    ) {
        if (options.isRulesChannel && channel.isTextBased()) {
            await channel.guild.setRulesChannel(channel.id, reason);
        }

        if (options.isAFKChannel && channel.isVoiceBased()) {
            await channel.guild.setAFKChannel(channel.id, reason);
        }
    }

    async #getCaches(guild: Guild) {
        if (this.hasOptionalIntent) {
            await guild.emojis.fetch();
            await guild.stickers.fetch();
        }
        await guild.roles.fetch();
        await guild.channels.fetch();
    }

    async #deleteEverything(target: Guild, overallReason: string) {
        if (this.hasOptionalIntent) {
            await this.#delete(
                target.emojis.cache,
                ServerGeneratorManagerEvents.emojiDelete,
                overallReason,
            );
            await this.#delete(
                target.stickers.cache,
                ServerGeneratorManagerEvents.stickerDelete,
                overallReason,
            );
        }
        await this.#delete(
            target.roles.cache.filter(
                (r) => r !== target.roles.everyone && !r.managed,
            ),
            ServerGeneratorManagerEvents.roleDelete,
            overallReason,
        );
        await this.#delete(
            target.channels.cache.filter((c) => !c.isThread()),
            ServerGeneratorManagerEvents.channelDelete,
            overallReason,
        );
    }

    async #createEverything(
        target: Guild,
        options: GuildOptions,
        overallReason: string,
    ) {
        if (this.hasOptionalIntent) {
            await this.#createEmojis(
                target.emojis,
                options.emojis,
                overallReason,
            );
            await this.#createStickers(
                target.stickers,
                options.stickers,
                overallReason,
            );
        }
        await this.#createRoles(target.roles, options.roles, overallReason);
        await this.#createChannels(
            target.channels,
            options.rootChannels,
            null,
            overallReason,
        );
        await this.#createCategories(
            target.channels,
            options.channels,
            null,
            overallReason,
        );
        await target.edit({ ...options, reason: overallReason });
    }

    async #delete<T, Holds>(
        collection: Collection<T, Holds>,
        event: string,
        reason?: string,
    ) {
        if (!collection || !event) return;

        for (const entity of collection.values()) {
            await (entity as DeletableEntity<Holds>).delete(reason);
            this.emit(event, entity, reason);
        }
    }

    async #createRoles(
        roles?: RoleManager,
        roleOptions?: RoleOptions[],
        reason?: string,
    ) {
        if (!roles || !roleOptions) return;

        for (const options of roleOptions) {
            const role = await roles.create({ reason, ...options });
            this.emit(
                ServerGeneratorManagerEvents.roleCreate,
                role,
                options,
                reason,
            );
        }
    }

    #isText(
        channel: GuildBasedChannel,
    ): channel is NewsChannel | TextChannel | ForumChannel {
        return (
            channel.isTextBased() &&
            (channel instanceof NewsChannel ||
                channel instanceof TextChannel ||
                channel instanceof ForumChannel)
        );
    }

    async #createThreads(
        channels?: GuildChannelManager,
        threadOptions?: ThreadOptions[],
        textChannelId?: Snowflake,
        reason?: string,
    ) {
        if (!channels || !textChannelId || !threadOptions) return;
        const textChannel = await channels.fetch(textChannelId);
        if (!textChannel || !this.#isText(textChannel)) return;

        for (const options of threadOptions) {
            let thread: ThreadChannel;
            if (textChannel instanceof ForumChannel) {
                thread = await textChannel.threads.create({
                    reason,
                    ...options,
                } as GuildForumThreadCreateOptions);
            } else if (textChannel instanceof NewsChannel) {
                thread = await textChannel.threads.create({
                    reason,
                    ...options,
                } as GuildTextThreadCreateOptions<AllowedThreadTypeForNewsChannel>);
            } else {
                thread = await textChannel.threads.create({
                    reason,
                    ...options,
                } as GuildTextThreadCreateOptions<AllowedThreadTypeForTextChannel>);
            }

            this.emit(
                ServerGeneratorManagerEvents.threadCreate,
                thread,
                options,
                reason,
            );
        }
    }

    async #createChannels(
        channels?: GuildChannelManager,
        channelOptions?: GuildChannelOptions[],
        parent?: Snowflake | null,
        reason?: string,
    ) {
        if (!channels || !channelOptions) return;

        for (const options of channelOptions) {
            const channel: TextChannel = await channels.create({
                reason,
                ...options,
                parent,
            });
            this.emit(
                ServerGeneratorManagerEvents.channelCreate,
                channel,
                options,
            );

            if (options.children && channel.isTextBased()) {
                await this.#createThreads(
                    channels,
                    options.children as ThreadOptions[],
                    channel.id,
                    reason,
                );
            }
        }
    }

    async #createCategories(
        channels?: GuildChannelManager,
        channelOptions?: CategoryOptions[],
        parent?: Snowflake | null,
        reason?: string,
    ) {
        if (!channels || !channelOptions) return;

        for (const options of channelOptions) {
            const channel = await channels.create({
                reason,
                ...options,
                parent,
                type: ChannelType.GuildCategory,
            });
            this.emit(
                ServerGeneratorManagerEvents.channelCreate,
                channel,
                options,
            );

            if (
                options.children &&
                channel.type === ChannelType.GuildCategory
            ) {
                await this.#createChannels(
                    channels,
                    options.children as GuildChannelOptions[],
                    channel.id,
                    reason,
                );
            }
        }
    }

    async #createEmojis(
        emojis?: GuildEmojiManager,
        emojiOptions?: EmojiOptions[],
        reason?: string,
    ) {
        if (!emojis || !emojiOptions) return;

        for (const options of emojiOptions) {
            const emoji = await emojis.create({
                reason,
                ...options,
            });
            this.emit(
                ServerGeneratorManagerEvents.emojiCreate,
                emoji,
                options,
                reason,
            );
        }
    }

    async #createStickers(
        stickers?: GuildStickerManager,
        stickerOptions?: StickerOptions[],
        reason?: string,
    ) {
        if (!stickers || !stickerOptions) return;
        if (stickers.guild.premiumTier === GuildPremiumTier.None) return;

        for (const options of stickerOptions) {
            const sticker = await stickers.create({
                reason,
                ...options,
            });
            this.emit(
                ServerGeneratorManagerEvents.stickerCreate,
                sticker,
                options,
                reason,
            );
        }
    }
}

/**
 * Emitted when a guild is being generated by the manager.
 * @event ServerGeneratorManager#guildGenerate
 * @param {Guild} Guild
 * @param {GuildOptions} options
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.guildGenerate, (guild, options, reason) => {
 *  console.log(`Generating guild ${guild.id} for reason ${reason} with options`, options);
 * });
 */

/**
 * Emitted when a guild has just been generated by the manager.
 * @event ServerGeneratorManager#guildGenerated
 * @param {Guild} Guild
 * @param {GuildOptions} options
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.guildGenerated, (guild, options, reason) => {
 *  console.log(`Generated guild ${guild.id} for reason ${reason} with options`, options);
 * });
 */

/**
 * Emitted when an old role is being deleted by the manager when generating the guild.
 * @event ServerGeneratorManager#roleDelete
 * @param {Role} role
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.roleDelete, (role, reason) => {
 *  console.log(`Role ${role.id} deleted for reason ${reason}`);
 * });
 */

/**
 * Emitted when an old channel is being deleted by the manager when generating the guild.
 * @event ServerGeneratorManager#channelDelete
 * @param {GuildChannel} channel
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.channelDelete, (channel, reason) => {
 *  console.log(`Channel ${channel.id} deleted for reason ${reason}`);
 * });
 */

/**
 * Emitted when an old emoji is being deleted by the manager when generating the guild.
 * @event ServerGeneratorManager#emojiDelete
 * @param {GuildEmoji} emoji
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.emojiDelete, (emoji, reason) => {
 *  console.log(`Emoji ${emoji.id} deleted for reason ${reason}`);
 * });
 */

/**
 * Emitted when an old sticker is being deleted by the manager when generating the guild.
 * @event ServerGeneratorManager#stickerDelete
 * @param {Sticker} sticker
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.stickerDelete, (sticker, reason) => {
 *  console.log(`Sticker ${sticker.id} deleted for reason ${reason}`);
 * });
 */

/**
 * Emitted when a new channel is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#channelCreate
 * @param { TextChannel | VoiceChannel | CategoryChannel | NewsChannel | StoreChannel | StageChannel} channel
 * @param {CategoryOptions | GuildChannelOptions} options
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.channelCreate, (channel, options, reason) => {
 *  console.log(`Channel ${channel.id} created for reason ${reason} with options`, options);
 * });
 */

/**
 * Emitted when a new thread is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#threadCreate
 * @param {ThreadChannel} thread
 * @param {ThreadOptions} options
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.threadCreate, (thread, options, reason) => {
 *  console.log(`Thread ${thread.id} created for reason ${reason} with options`, options);
 * });
 */

/**
 * Emitted when a new role is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#roleCreate
 * @param {Role} role
 * @param {RoleOptions} options
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.roleCreate, (role, options, reason) => {
 *  console.log(`Role ${role.id} created for reason ${reason} with options`, options);
 * });
 */

/**
 * Emitted when a new emoji is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#emojiCreate
 * @param {GuildEmoji} emoji
 * @param {EmojiOptions} options
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.emojiCreate, (emoji, options, reason) => {
 *  console.log(`Emoji ${emoji.id} created for reason ${reason} with options`, options);
 * });
 */

/**
 * Emitted when a new sticker is being created by the manager when generating the guild.
 * @event ServerGeneratorManager#stickerCreate
 * @param {Sticker} sticker
 * @param {StickerOptions} options
 * @param {string?} reason
 * @example
 * manager.on(ServerGeneratorManagerEvents.stickerCreate, (sticker, options, reason) => {
 *  console.log(`Sticker ${sticker.id} created for reason ${reason} with options`, options);
 * });
 */
