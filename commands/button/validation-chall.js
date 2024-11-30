/*
 * author : Mizari (Mizari-W)
 */
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

module.exports = {
  name: "validation_btn",
  type: "Button",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  run: async(client, interaction) => {
    const { channel, locale, user } = interaction;

    // Create modal
    let modal = new ModalBuilder({
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

    // Get challenge in DB
    let chall_response = await client.notion.databases.query({
      database_id: process.env.CHALLENGES_DB,
      filter: {
        property: 'ThreadID',
        text: {
          contains: channel.id
        }
      }
    });

    // If challenge found
    if (chall_response.results.length > 0){
      // If player is chall author and no first blood yet, exit
      if (channel.ownerId === user.id){
        let page = chall_response.results[0];
        if (page.properties["FirstBlood"].relation.length === 0){
          interaction.reply({
            content: {
              "fr": "Veuillez attendre le first blood."
            }[locale] || "Please wait for the First Blood",
            ephemeral: true
          });
          return;
        }
      }

      // Get member in DB
      let member_response = await client.notion.databases.query({
        database_id: process.env.MEMBERS_DB,
        filter: {
          property: 'MemberID',
          text: {
            contains: interaction.user.id
          }
        }
      });

      // If user found in DB
      if (member_response.results.length > 0){
        let member_page_id = member_response.results[0].id;
        // If member is in flaggers of this challenge, exit
        if (chall_response.results[0].properties["Flaggers"].relation.find(mem => mem.id === member_page_id)){
          interaction.reply({
            content: {
              "fr": "Tu as déjà fait ce challenge."
            }[locale] || "You already did this challenge",
            ephemeral: true
          });
          return;
        }
      }

      try {
        // Show modal
        interaction.showModal(modal);
      } catch(err) {
        interaction.reply({
          content:{
            "fr": "<:cross:1163970998605983848> Quelque chose s'est mal passé..."
          }[locale] || "<:cross:1163970998605983848> Something went wrong...",
          ephemeral: true
        });
        //Logs
        console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\t❌ Le modal a planté ???`);
      }
    } else {
      // Challenge not found
      interaction.reply({
        content:{
          "fr": "<:cross:1163970998605983848> Quelque chose s'est mal passé..."
        }[locale] || "<:cross:1163970998605983848> Something went wrong..."
      });
      console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\t❌ Pas de challenge dans la DB... id : ${channel.id}`);
    }
  }
}
