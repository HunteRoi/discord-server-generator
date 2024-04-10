/** @type {import('typedoc').TypeDocOptions} */
export default {
    "entryPoints": ["src/index.ts"],
    "out": "docs/api-docs",
    "hideGenerator": true,
    "excludePrivate": true,
    "excludeExternals": true,
    "navigationLinks": {
        "GitHub": "https://github.com/hunteroi/discord-server-generator"
    }
}
