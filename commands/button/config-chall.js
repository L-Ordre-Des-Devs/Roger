/*
 * author : Mizari (Mizari-W)
 */
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const colors = require('../../functions/colors.js');

module.exports = {
  name: "chall_btn",
  type: "Button",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  run: async(client, interaction) => {
    const { channel, user, locale } = interaction;
    if (channel.ownerId === user.id){
      // création du modal
      let modal = new ModalBuilder({
        title: {
          "fr": "Configuration du challenge"
        }[locale] || "Challenge configuration",
        customId: "chall_modal",
        components: [
          new ActionRowBuilder({
            components: [
              new TextInputBuilder({
                label: "Flag",
                customId: "flag",
                placeholder: {
                  "fr": "Quel est le flag du challenge ?"
                }[locale] || "What is the flag of the challenge?",
                style: TextInputStyle.Short,
                required: true
              })
            ]
          })
        ]
      });

      try {
        // apparission du modal
        interaction.showModal(modal);
      } catch(err) {
        interaction.reply({
          content: {
            "fr": "<:cross:1163970998605983848> Quelque chose s'est mal passé... veuillez réessayer :/"
          }[locale] || "<:cross:1163970998605983848> Something went wrong... please retry :/",
          ephemeral: true
        });
        //Logs
        console.log(`[${colors.FgRed}   Error    ${colors.Reset}]\t❌ Le modal a planté ???`);
      }

    } else {
      interaction.reply({
        content: {
          "fr": "<:cross:1163970998605983848> Vous n'êtes pas l'auteur de ce challenge"
        }[locale] || "<:cross:1163970998605983848> You're note the author of the challenge",
        ephemeral: true
      });
    }
  }
}
