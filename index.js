const notion = require("@notionhq/client")
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { 
    DefaultWebSocketManagerOptions: { 
        identifyProperties 
    } 
} = require("@discordjs/ws");
// To show the bot on mobile :D (method from : https://stackoverflow.com/a/77072376)
identifyProperties.browser = "Discord Android";

// Discord app
let client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});
// Notion app (for free data base)
client.notion = new notion.Client({
    auth: process.env.NOTION_TOKEN,
    LogLevel: notion.LogLevel.DEBUG
});
module.exports = client;

// Global Variables
client.commandsFiles = new Collection();

// Initializing the project
require("./handler")(client);

client.login(process.env.TOKEN);
