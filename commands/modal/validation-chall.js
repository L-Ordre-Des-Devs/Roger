/*
 * author : Mizari (Mizari-W)
 */
const colors = require('../../functions/colors.js');
const { createHash } = require('node:crypto');

module.exports = {
  name: "validation_modal",
  type: "Modal",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  run: async(client, interaction) => {
    const { components, channel, locale, message, user, guild } = interaction;
    await interaction.deferReply({ ephemeral: true }).catch(err => console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\t❌ `+err));
    // Get player answare
    var user_flag = components[0].components[0].value;
    user_flag = createHash('sha256').update(user_flag).digest('hex');

    // Get challenge from DB
    var chall_response = await client.notion.databases.query({
      database_id: process.env.CHALLENGES_DB,
      filter: {
        property: 'ThreadID',
        text: {
          contains: channel.id
        }
      }
    });

    if (chall_response.results.length > 0){
      // Get flag from DB
      const chall_properties = chall_response.results[0].properties;
      const flag = chall_properties["Flag"].rich_text[0].plain_text;

      // If player found the right flag
      if (user_flag === flag){
        // Get challenge score
        let score = chall_properties["Points"].number;
        // Get challenge first blood
        let first_blood = chall_properties["FirstBlood"].relation;

        // Prepare congrate message
        let congrate_message = {
          "fr": `Bravo ! Vous gagnez ${score} points ! 🥳`
        }[locale] || `Good job! You win ${score} points from this challenge! 🥳`

        // If no first blood
        if (first_blood.length===0){
          congrate_message += {
            "fr": " Et vous l'avez firstblood 😱"
          }[locale] || " And firstblooded the challenge 😱";
          first_blood = user.id;
        } else {
          let first_response = await client.notion.pages.retrieve({ page_id: first_blood[0].id });
          first_blood = first_response.properties["MemberID"].rich_text[0].plain_text;
        }

        // Send congratulations
        await interaction.followUp({ content: congrate_message });

        // Get challenge embed from Discord
        let embed = message.embeds[0]

        // Change validations value
        embed.data.fields[1].value = `${chall_properties["Flaggers"].relation.length+1}`;
        // Change first blooder
        embed.data.fields[3].value = "<@"+first_blood+">"
        // Change last flagger value
        embed.data.fields[4].value = "<@"+user.id+">";

        // Send embed and components
        message.edit({ embeds: [embed], components: message.components });

        // Get member in DB
        let member_response = await client.notion.databases.query({
          database_id: process.env.MEMBERS_DB,
          filter: {
            property: 'MemberID',
            text: {
              contains: user.id
            }
          }
        });

        // If not in DB
        if (member_response.results.length === 0){
          // Create member in DB
          member_response = await client.notion.pages.create({
            parent: {
              database_id: process.env.MEMBERS_DB
            },
            properties: {
              "MemberName": {
                title: [
                  {
                    text: {
                      content: user.username
                    }
                  }
                ]
              },
              "MemberID": {
                rich_text: [
                  {
                    text: {
                      content: user.id
                    }
                  }
                ]
              }
            }
          });
        } else {
          member_response = member_response.results[0];
        }

        // Get guild in DB
        let guild_response = await client.notion.databases.query({
          database_id: process.env.GUILDS_DB,
          filter: {
            property: "GuildID",
            rich_text: {
              contains: guild.id
            }
          }
        });

        // Get score page in relation with the member AND the guild
        let score_member_response = await client.notion.databases.query({
          database_id: process.env.SCORES_DB,
          filter: {
            and: [
              {
                property: 'Member',
                relation: {
                  contains: member_response.id
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
        
        // If no score yet, create it
        if (score_member_response.results.length === 0){
          score_member_response = await client.notion.pages.create({
            parent: {
              database_id: process.env.SCORES_DB
            },
            properties: {
              "RELATION": {
                title: [
                  {
                    text: {
                      content: user.username + "/" + guild.name
                    }
                  }
                ]
              },
              "Member": {
                relation: [
                  {
                    id: member_response.id
                  }
                ]
              },
              "Guild": {
                relation: [
                  {
                    id: guild_response.results[0].id
                  }
                ]
              }
            }
          });
        } else {
          score_member_response = score_member_response.results[0];
        }
        
        const { properties } = score_member_response;
        const all_challenges = properties["Challenges"].relation;
        all_challenges.push({ id: chall_response.results[0].id })

        // Update score
        await client.notion.pages.update({
          page_id: score_member_response.id,
          properties: {
            "Challenges": {
              relation: all_challenges
            }
          }
        });

        // Update challenge in DB
        chall_properties["Flaggers"].relation.push({
          id: member_response.id
        });
        if (chall_properties["FirstBlood"].relation.length === 0){
          chall_properties["FirstBlood"].relation = [
            {
              id: member_response.id
            }
          ]
        }
        await client.notion.pages.update({
          page_id: chall_response.results[0].id,
          properties: {
            "FirstBlood": {
              relation: chall_properties["FirstBlood"].relation
            },
            "Flaggers": {
              relation: chall_properties["Flaggers"].relation
            }
          }
        });
      } else {
        await interaction.followUp({
          content: {
            "fr": "Ce n'est pas le bon flag... réessayez !"
          }[locale] || "It's not the good flag... try again!"
        });
      }
    } else {
      await interaction.followUp({
        content: {
          "fr": "<:cross:1163970998605983848> Quelque chose s'est mal passé..."
        }[locale] || "<:cross:1163970998605983848> Something went wrong..."
      });
    }
  }
}
