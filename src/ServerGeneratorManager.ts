import { Client, Intents } from 'discord.js';
import EventEmitter from 'events';

import { ServerOptions } from './types';

/**
 *
 * @export
 * @class ServerGeneratorManager
 * @extends {EventEmitter}
 */
export class ServerGeneratorManager extends EventEmitter {
	private client: Client;
	public options: ServerOptions;

	constructor(client: Client, options: ServerOptions) {
		super();

		const intents = new Intents(client.options.intents);
		if (!intents.has(Intents.FLAGS.GUILDS)) {
			throw new Error('GUILDS intent is required to use this package!');
		}
		if (!intents.has(Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS)) {
			console.warn(
				'GUILD_EMOJIS_AND_STICKERS intent is optional for this package to work but could be a nice addition.'
			);
		}

		this.client = client;
		this.options = options;
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
