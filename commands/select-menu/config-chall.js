/*
 * edited : Syxles (Syxless)
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
  run: async (client, interaction) => {
    const { user, channel, values, locale } = interaction;

    if (user.id !== channel.ownerId) {
      await interaction.reply({
        content: {
          fr: "Vous n'etes pas l'auteur de ce challenge."
        }[locale] || "You're not the author of the challenge.",
        ephemeral: true
      }).catch(() => {});
      return;
    }

    // ack before db calls
    await interaction.deferUpdate().catch(() => {});

    const score = values[0];

    // find challenge in db
    let response = await client.notion.databases.query({
      database_id: process.env.CHALLENGES_DB,
      filter: {
        property: "ThreadID",
        text: {
          contains: channel.id
        }
      }
    });

    if (response.results.length === 0) {
      await interaction.followUp({
        content: {
          fr: "<:cross:1163970998605983848> Quelque chose s'est mal passe..."
        }[locale] || "<:cross:1163970998605983848> Something went wrong...",
        ephemeral: true
      }).catch(() => {});
      return;
    }

    // update challenge score
    const pageId = response.results[0].id;
    await client.notion.pages.update({
      page_id: pageId,
      properties: {
        Points: {
          number: parseInt(score, 10)
        }
      }
    });

    const embed = new EmbedBuilder({
      title: channel.name,
      color: resolveColor("#2B2D31"),
      fields: [
        {
          name: `${score === "5" ? "Easy" : score === "10" ? "Medium" : score === "15" ? "Hard" : "Extreme"} Difficulty`,
          value: `(${score === "5" ? "Easy" : score === "10" ? "Medium" : score === "15" ? "Hard" : "Extreme"} ${score} points)`,
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
          name: "First Blood",
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

    const button = new ActionRowBuilder({
      components: [
        new ButtonBuilder({
          style: 3,
          label: "Submit Flag",
          emoji: "<:ctf:1165446844587974706>",
          customId: "validation_btn"
        })
      ]
    });

    await interaction.channel.send({ embeds: [embed], components: [button] });
    await interaction.message.delete().catch(() => {});
  }
};
