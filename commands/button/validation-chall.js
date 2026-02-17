/*
 * edited : Syxles (Syxless)
 * author : Mizari (Mizari-W)
 */
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const colors = require("../../functions/colors.js");

module.exports = {
  name: "validation_btn",
  type: "Button",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const { locale } = interaction;

    // Show the modal immediately to stay within Discord's 3s response window.
    const modal = new ModalBuilder({
      title: "Challenge Validation",
      customId: "validation_modal",
      components: [
        new ActionRowBuilder({
          components: [
            new TextInputBuilder({
              label: "Flag",
              customId: "flag",
              placeholder: "Submit the flag",
              style: TextInputStyle.Short,
              required: true
            })
          ]
        })
      ]
    });

    try {
      await interaction.showModal(modal);
    } catch (err) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: {
            fr: "<:cross:1163970998605983848> Quelque chose s'est mal passe..."
          }[locale] || "<:cross:1163970998605983848> Something went wrong...",
          ephemeral: true
        }).catch(() => {});
      }

      console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\tFlag modal display failed`, err);
    }
  }
};
