const { glob } = require("glob");
const { Client, ApplicationCommandType } = require("discord.js");

/**
 * @param {Client} client
 */
module.exports = async (client) => {

    // Events
    const eventFiles = await glob(`events/*.js`);
    eventFiles.map((value) => require("../"+value));

    // Commands
    const commandsFiles = await glob(`commands/*/*.js`);

    const arrayOfSlashCommands = [];
    await commandsFiles.map(async (value) => {
        const file = require("../"+value);
        if (!file?.name) return;
        await client.commandsFiles.set(file.name, file);

        if ([
            ApplicationCommandType.Message,
            ApplicationCommandType.User,
            ApplicationCommandType.ChatInput
        ].includes(file.type))
            await arrayOfSlashCommands.push(file);
    });

    client.on("ready", async () => {
        await client.application.commands.set(arrayOfSlashCommands);
    });
};
