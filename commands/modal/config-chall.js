/*
 * author : Mizari (Mizari-W)
 */
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const colors = require('../../functions/colors.js');
const { createHash } = require('node:crypto');

module.exports = {
  name: "chall_modal",
  type: "Modal",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  run: async(client, interaction) => {
    interaction.deferReply().catch(err => console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\t❌ `+err));
    const { components, locale, message } = interaction;
    var flag = components[0].components[0].value;

    // on cherche le thread dans la db
    var response = await client.notion.databases.query({
      database_id: process.env.CHALLENGES_DB,
      filter: {
        property: 'ThreadID',
        text: {
          contains: interaction.channel.id
        }
      }
    });

    if (response.results.length > 0){
      // on update le chall
      const pageId = response.results[0].id;
      response = await client.notion.pages.update({
        page_id: pageId,
        properties: {
          Flag: {
            rich_text: [
              {
                text: {
                  content: createHash('sha256').update(flag).digest('hex')
                }
              }
            ]
          }
        }
      });

      let select = new ActionRowBuilder({
        components: [
          new StringSelectMenuBuilder({
            customId: "score",
            maxValues: 1,
            minValues: 1,
            options: [
              {
                emoji: "🟢",
                label: `Easy (5 points)`,
                value: "5"
              },
              {
                emoji: "🟡",
                label: `Middle (10 points)`,
                value: "10"
              },
              {
                emoji: "🔴",
                label: `Hard (15 points)`,
                value: "15"
              },
              {
                emoji: "⚫",
                label: `Xtrem (30 points)`,
                value: "30"
              }
            ],
            placeholder: {
              "fr": "Sélectionnez une difficulté."
            }[locale] || "Select difficulty."
          })
        ]
      });

      interaction.followUp({ components: [select] });
    } else {
      interaction.followUp({
        content: {
          "fr": "<:cross:1163970998605983848> Quelque chose s'est mal passé..."
        }[locale] || "<:cross:1163970998605983848> Something went wrong..."
      });
    }

    await message.delete();
  }
}
