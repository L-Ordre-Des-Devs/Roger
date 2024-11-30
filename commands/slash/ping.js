/*
 * author : Mizari (Mizari-Dev)
 */
const { ApplicationCommandType } = require("discord.js");

module.exports = {
    name: "ping",
    description: "Bot latency.",
    descriptionLocalizations:{
      "fr":"Latence du bot."
    },
    type: ApplicationCommandType.ChatInput,
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
      await interaction.deferReply({ ephemeral: false }).catch(() => {});
      let time = interaction.createdAt;
      interaction.followUp({ content: `pong! 🏓` }).then(msg => {
        if (interaction.locale === "fr"){
          msg.edit({ content: `${msg.content} avec ${msg.createdAt - time}ms`})
        }else {
          msg.edit({ content: `${msg.content} with ${msg.createdAt - time}ms`});
        }
      });
    },
};
