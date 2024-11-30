/*
 * author : Mizari (Mizari-W)
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, resolveColor } = require("discord.js");

module.exports = {
  name: "score",
  type: "Select",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  run: async(client, interaction) => {
    const { user, channel, values, locale } = interaction;
    if (user.id === channel.ownerId){
      let score = values[0];

      // on cherche le thread dans la db
      var response = await client.notion.databases.query({
        database_id: process.env.CHALLENGES_DB,
        filter: {
          property: 'ThreadID',
          text: {
            contains: channel.id
          }
        }
      });

      if (response.results.length > 0){
        // on update la config
        const pageId = response.results[0].id;
        response = await client.notion.pages.update({
          page_id: pageId,
          properties: {
            Points: {
              number: parseInt(score)
            }
          }
        });

        const embed = new EmbedBuilder({
          title: channel.name,
          color: resolveColor('#2B2D31'),
          fields: [
            {
              name: `${score=="5"?"🟢":(score=="10"?"🟡":(score=="15"?"🔴":"⚫"))} Difficulty`,
              value: `(${(score=="5"?"Easy":(score=="10"?"Middle":(score=="15"?"Hard":"Xtrem")))} ${score} points)`,
              inline: true
            },
            {
              name: "<:check:1163970982030094388> Validations",
              value: "0",
              inline: true
            },
            {
              name: "",
              value: ""
            },
            {
              name: "🩸 First Blood",
              value: "None",
              inline: true
            },
            {
              name: "<:ctf:1165446844587974706> Last Flagger",
              value: "None",
              inline: true
            }
          ]
        });

        let button = new ActionRowBuilder({
          components: [
            new ButtonBuilder({
              style: 3,
              label: "Submit Flag",
              emoji: "<:ctf:1165446844587974706>",
              customId: "validation_btn"
            })
          ]
        });

        interaction.channel.send({ embeds: [embed], components: [button] });

      }else{
        interaction.reply({
          content: {
            "fr": "<:cross:1163970998605983848> Quelque chose s'est mal passé..."
          }[locale] || "<:cross:1163970998605983848> Something went wrong..."
        });
      }

      interaction.message.delete();
    } else {
      interaction.reply({
        content: {
          "fr": "Vous n'êtes pas l'auteur de ce challenge."
        }[locale] || "You're note the author of the challenge.",
        ephemeral: true
      });
    }
  }
}
