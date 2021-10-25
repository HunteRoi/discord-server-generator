import { Client, ClientOptions } from 'discord.js';

import { ServerGeneratorManager } from '.';

/**
 * A Discord client with an embedded {@link ServerGeneratorManager}.
 *
 * @export
 * @class ServerGeneratorClient
 * @extends {Client}
 */
export class ServerGeneratorClient extends Client {
	public serverGeneratorManager: ServerGeneratorManager;

	constructor(options: ClientOptions) {
		super(options);
	}
}
