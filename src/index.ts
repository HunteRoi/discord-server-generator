import { Client, ClientOptions, Snowflake, Guild } from 'discord.js';
import EventEmitter from 'events';

import { ServerConfiguration } from './types';
import { generateRoleChannel } from './utils/generateRoleChannel';

/**
 *
 * @export
 * @class ServerGeneratorManager
 * @extends {EventEmitter}
 */
export class ServerGeneratorManager extends EventEmitter {
  /**
   * The configuration of the manager.
   *
   * @private
   * @type {ServerConfiguration}
   */
  public readonly options: ServerConfiguration;

  /**
   * The client that instantiated this Manager
   * @name ServerGeneratorManager#client
   * @type {Client}
   * @readonly
   */
  public readonly client: Client;

  /**
   * Creates an instance of ServerGeneratorManager.
   * @param {Client} client
   * @param {ServerConfiguration} options
   */
  constructor(client: Client, options: ServerConfiguration) {
    super();

    this.client = client;
    this.options = options;
  }

  async generate(guildId: Snowflake) {
    const guild = await this.client.guilds.fetch(guildId);
    this.emit('generationStart', guild);
    
    if (this.options.forceCleanServer && guild.channels.cache.size > 1) {
      await this.forceCleanServer(guild);
    }

    await this.generateRoles(guild);
    await this.generateOnce(guild);
    await this.generateManyTimes(guild);
    this.emit('generationFinish', guild);
  }

  private async forceCleanServer(guild: Guild) {
    await Promise.all(guild.roles.cache.map(role => role.delete()));
    await Promise.all(guild.channels.cache.map(channel => channel.delete()));
    this.emit('forceClean', guild);
  }

  private async generateRoles(guild: Guild) {
    if (!this.options.roles) {
      this.emit('noGenerateRoles');
      return;
    }

    const roles = await Promise.all(this.options.roles.map(role => guild.roles.create({ data: role })));
    this.emit('generateRoles', roles);
  }

  private async generateOnce(guild: Guild) {
    if (!this.options.oneTimeGeneration) {
      this.emit('noGenerateOnce');
      return;
    }

    const channelsData = await Promise.all(this.options.oneTimeGeneration.map(config => generateRoleChannel(this, guild, config)));

    this.emit('generateOnce', channelsData);
  }

  private async generateManyTimes(guild: Guild) {
    if (!this.options.manyTimesGeneration) {
      this.emit('noGenerateMany');
      return;
    }

    // generate x times the entities

    this.emit('generateMany');
  }


}

/**
 * A wrapper class for {@link Client} that carries a {@link ServerGeneratorManager} instance.
 *
 * @export
 * @class ServerGeneratorClient
 * @extends {Client}
 */
export class ServerGeneratorClient extends Client {
  /**
   * The mailbox manager.
   *
   * @type {ServerGeneratorManager}
   */
  public readonly serverGeneratorManager: ServerGeneratorManager;

  /**
   *Creates an instance of MailboxClient.
   * @param {ClientOptions} [options]
   * @param {ServerConfiguration} [serverGeneratorOptions]
   * @memberof MailboxClient
   */
  constructor(serverGeneratorOptions: ServerConfiguration, options?: ClientOptions) {
    super(options);

    this.serverGeneratorManager = new ServerGeneratorManager(this, serverGeneratorOptions);
  }
}

/**
 * Emitted when
 * @event ServerGeneratorManager#
 * @param {Type} param
 * @example
 * manager.on('', () => {
 *  console.log(``);
 * });
 */
