/*
 * edited : Syxles (Syxless)
 * author : Mizari (Mizari-W)
 */
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const colors = require("../../functions/colors.js");
const { createHash } = require("node:crypto");

module.exports = {
  name: "chall_modal",
  type: "Modal",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const { locale, message } = interaction;
    await interaction.deferReply().catch((err) => {
      console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\tFailed to defer challenge modal`, err);
    });

    const flag = interaction.fields.getTextInputValue("flag");

    // find thread in db
    let response = await client.notion.databases.query({
      database_id: process.env.CHALLENGES_DB,
      filter: {
        property: "ThreadID",
        text: {
          contains: interaction.channel.id
        }
      }
    });

    if (response.results.length > 0) {
      // update challenge flag
      const pageId = response.results[0].id;
      await client.notion.pages.update({
        page_id: pageId,
        properties: {
          Flag: {
            rich_text: [
              {
                text: {
                  content: createHash("sha256").update(flag).digest("hex")
                }
              }
            ]
          }
        }
      });

      const select = new ActionRowBuilder({
        components: [
          new StringSelectMenuBuilder({
            customId: "score",
            maxValues: 1,
            minValues: 1,
            options: [
              {
                emoji: "🟢",
                label: "Easy (5 points)",
                value: "5"
              },
              {
                emoji: "🟡",
                label: "Middle (10 points)",
                value: "10"
              },
              {
                emoji: "🔴",
                label: "Hard (15 points)",
                value: "15"
              },
              {
                emoji: "⚫",
                label: "Xtrem (30 points)",
                value: "30"
              }
            ],
            placeholder: {
              fr: "Selectionnez une difficulte."
            }[locale] || "Select difficulty."
          })
        ]
      });

      await interaction.followUp({ components: [select] });
    } else {
      await interaction.followUp({
        content: {
          fr: "<:cross:1163970998605983848> Quelque chose s'est mal passe..."
        }[locale] || "<:cross:1163970998605983848> Something went wrong..."
      });
    }

    await message.delete().catch(() => {});
  }
};
