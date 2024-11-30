/*
 * author : Mizari (Mizari-Dev)
 */

 // importation des packages requis
 const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, resolveColor } = require('discord.js');

module.exports = {
  name: "user-infos",
  nameLocalizations: {
    "fr": "infos-utilisateur"
  },
  description: "Show informations about a user.",
  descriptionLocalizations: {
    "fr": "Montre des informations sur un utilisateur."
  },
  options: [
    {
      name: "user",
      nameLocalizations: {
        "fr": "utilisateur"
      },
      description: "The user you want to show informations.",
      descriptionLocalizations: {
        "fr": "L'utilisateur dont vous voulez voir les informations."
      },
      type: ApplicationCommandOptionType.User,
      required: false
    }
  ],
  type: ApplicationCommandType.ChatInput,
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */
  run: async(client, interaction, args) => {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});
    const { guild, member, locale } = interaction;

    var mbr = null;
    // If there's an arg, we use it
    if (args.length > 0) {
      mbr = guild.members.cache.get(args[0]);
    // Else we use the author
    } else {
      mbr = member;
    }

    const { user } = mbr;

    // Get guild page in DB
    let guild_response = await client.notion.databases.query({
      database_id: process.env.GUILDS_DB,
      filter: {
        property: 'GuildID',
        text: {
          contains: guild.id
        }
      }
    });

    // Get member page in DB
    let member_response = await client.notion.databases.query({
      database_id: process.env.MEMBERS_DB,
      filter: {
        property: 'MemberID',
        text: {
          contains: user.id
        }
      }
    });

    // If not exist in DB, exit
    if (guild_response.results.length === 0 || member_response.results.length === 0){
      interaction.followUp({
        content: {
          "fr": "Cet utilisateur ou ce serveur n'est pas encore dans notre base de données."
        }[locale] || "This user or this guild is not yet in our data base."
      });
      return;
    }

    // Get score in DB
    let score_response = await client.notion.databases.query({
      database_id: process.env.SCORES_DB,
      filter: {
        and: [
          {
            property: "Member",
            relation: {
              contains: member_response.results[0].id
            }
          },
          {
            property: "Guild",
            relation: {
              contains: guild_response.results[0].id
            }
          }
        ]
      }
    });

    // If no score, exit
    if (score_response.results.length === 0){
      interaction.followUp({
        content: {
          "fr": "Cet utilisateur n'a pas encore fait de challenge."
        }[locale] || "This user has not yet completed any challenges."
      });
      return;
    }
    
    const { properties } = score_response.results[0];
    
    // Build embed
    var user_embed = new EmbedBuilder({
      color: mbr.displayColor!==0?mbr.displayColor:resolveColor("#2B2D31"),
      thumbnail: {
        url: mbr.displayAvatarURL({ dynamic: true, format: "png" })
      },
      title: mbr.displayName,
      fields: [
        {
          name: "Score",
          value: properties["Score"].formula.number,
          inline: true
        },
        {
          name: "Validations",
          value: properties["Challenges"].relation.length,
          inline: true
        }
      ]
    });

    // Check bot perms, then send embed
    const client_mbr = guild.members.me;
    if (client_mbr.permissions.has(PermissionFlagsBits.SendMessages) && client_mbr.permissions.has(PermissionFlagsBits.EmbedLinks)){
      interaction.followUp({ embeds: [user_embed] });
    } else {
      interaction.followUp({
        content: {
          "fr": "Je ne peux pas envoyer de messages ou de liens intégrés :/"
        }[locale] || "Can't send messages or embed links :/"
      });
    }
  }
}
