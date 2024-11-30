/*
 * author : Mizari (Mizari-Dev)
 */
// importation des packages et fonctions dont on a besoin
const { EmbedBuilder, ApplicationCommandType, resolveColor } = require('discord.js');
const date = require('../../functions/date.js');
const badges = require('../../functions/getServBadges.js');


module.exports = {
  name: "leaderboard",
  description: "Show server leaderboard.",
  descriptionLocalizations: {
    "fr": "Montre le leaderboard du serveur."
  },
  type: ApplicationCommandType.ChatInput,
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */
  run: async(client, interaction, args) => {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});
    const { guild, locale } = interaction; // récupération du serv
    var embeds = [];

    // Get guild page from DB
    let guild_response = await client.notion.databases.query({
      database_id: process.env.GUILDS_DB,
      filter: {
        property: "GuildID",
        rich_text:{
          contains: guild.id
        }
      }
    });

    if (guild_response.results.length === 0){
      interaction.followUp({
        content: {
          "fr": "Ce serveur n'existe pas encore dans notre base de données."
        }[locale] || "This server is not yet in our data base."
      });
      return;
    }

    // Get scores of all members from this guild
    let scores_response = await client.notion.databases.query({
      database_id: process.env.SCORES_DB,
      filter: {
        property: "Guild",
        relation: {
          contains: guild_response.results[0].id
        }
      },
      sorts: [
        {
          property: "Score",
          direction: "descending"
        }
      ]
    });

    if (scores_response.results.length === 0){
      interaction.followUp({
        content: {
          "fr": "Ce serveur n'a pas encore de joueur."
        }[locale] || "This server has no player yet."
      });
      return;
    }

      
    let list_member = "";
    for (var i = 0; i < scores_response.results.length; i++) {
      let member_response = await client.notion.pages.retrieve({
        page_id: scores_response.results[i].properties["Member"].relation[0].id
      });
      
      list_member += `${i+1}. <@${member_response.properties["MemberID"].rich_text[0].plain_text}> ${{
        "fr": "avec"
      }[locale] || "with"} ${scores_response.results[i].properties["Score"].formula.number} points.\n`;
    }
    var score_embed = new EmbedBuilder({
      title: "Leaderboard",
      color: resolveColor("#2B2D31"),
      description: list_member
    });

    interaction.followUp({ embeds: [score_embed] });
  }
}
