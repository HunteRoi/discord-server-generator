import { Client, type ClientOptions } from "discord.js";

import { ServerGeneratorManager } from ".";
import type { ServerGeneratorOptions } from "./types";

/**
 * A Discord client with an embedded {@link ServerGeneratorManager}.
 *
 * @export
 * @class ServerGeneratorClient
 * @extends {Client}
 */
export class ServerGeneratorClient extends Client {
    public readonly serverGeneratorManager: ServerGeneratorManager;

    constructor(
        options: ClientOptions,
        managerOptions: ServerGeneratorOptions,
    ) {
        super(options);

        this.serverGeneratorManager = new ServerGeneratorManager(
            this,
            managerOptions,
        );
    }
}
