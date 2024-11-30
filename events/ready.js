const client = require("../index");
const colors = require('../functions/colors.js');
const { ActivityType } = require("discord.js");

client.on("ready", () => {
   console.log(`[${colors.FgGreen} Connected  ${colors.Reset}]\t✅ Logged in as ${client.user.tag}!`);
   client.user.setActivity(`${client.guilds.cache.size} servers`, {type: ActivityType.Competing});
});
