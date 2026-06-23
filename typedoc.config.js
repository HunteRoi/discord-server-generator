import { OptionDefaults } from 'typedoc'

/** @type {import('typedoc').TypeDocOptions} */
export default {
    entryPoints: ["src/index.ts"],
    out: "docs/api-docs",
    hideGenerator: true,
    excludePrivate: true,
    excludeExternals: true,
    navigationLinks: {
        GitHub: "https://github.com/hunteroi/discord-server-generator"
    },
    blockTags: [...OptionDefaults.blockTags, "@export", "@name", "@min", "@max", "@memberof", "@inherit", "@implements"],
    externalSymbolLinkMappings: {
        "discord.js": { "Client": "https://discord.js.org/docs/packages/discord.js/14.22.1/Client:Class" }
    }
}
