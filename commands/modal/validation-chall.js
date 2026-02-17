/*
 * edited : Syxles (Syxless)
 * author : Mizari (Mizari-W)
 */
const colors = require("../../functions/colors.js");
const { createHash } = require("node:crypto");

module.exports = {
  name: "validation_modal",
  type: "Modal",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const { channel, locale, message, user, guild } = interaction;

    await interaction.deferReply({ ephemeral: true }).catch((err) => {
      console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\tFailed to defer validation modal`, err);
    });

    try {
      const userFlag = createHash("sha256")
        .update(interaction.fields.getTextInputValue("flag"))
        .digest("hex");

      // find challenge in db
      const challResponse = await client.notion.databases.query({
        database_id: process.env.CHALLENGES_DB,
        filter: {
          property: "ThreadID",
          text: {
            contains: channel.id
          }
        }
      });

      if (challResponse.results.length === 0) {
        await interaction.followUp({
          content: {
            fr: "<:cross:1163970998605983848> Quelque chose s'est mal passe..."
          }[locale] || "<:cross:1163970998605983848> Something went wrong..."
        });
        return;
      }

      const challPage = challResponse.results[0];
      const challProperties = challPage.properties;

      if (channel.ownerId === user.id && challProperties["FirstBlood"].relation.length === 0) {
        await interaction.followUp({
          content: {
            fr: "Veuillez attendre le first blood."
          }[locale] || "Please wait for the First Blood"
        });
        return;
      }

      // block duplicate validations
      let memberResponse = await client.notion.databases.query({
        database_id: process.env.MEMBERS_DB,
        filter: {
          property: "MemberID",
          text: {
            contains: user.id
          }
        }
      });

      if (memberResponse.results.length > 0) {
        const memberPageId = memberResponse.results[0].id;
        if (challProperties["Flaggers"].relation.find((mem) => mem.id === memberPageId)) {
          await interaction.followUp({
            content: {
              fr: "Tu as deja fait ce challenge."
            }[locale] || "You already did this challenge"
          });
          return;
        }
      }

      const flag = challProperties["Flag"].rich_text[0]?.plain_text;
      if (!flag || userFlag !== flag) {
        await interaction.followUp({
          content: {
            fr: "Ce n'est pas le bon flag... reessayez !"
          }[locale] || "It's not the good flag... try again!"
        });
        return;
      }

      // score and first blood
      const score = challProperties["Points"].number;
      let firstBloodRelation = challProperties["FirstBlood"].relation;
      let firstBloodUserId = user.id;

      let congrateMessage = {
        fr: `Bravo ! Vous gagnez ${score} points !`
      }[locale] || `Good job! You win ${score} points from this challenge!`;

      if (firstBloodRelation.length === 0) {
        congrateMessage += {
          fr: " Et vous l'avez firstblood."
        }[locale] || " And firstblooded the challenge.";
      } else {
        const firstResponse = await client.notion.pages.retrieve({ page_id: firstBloodRelation[0].id });
        firstBloodUserId = firstResponse.properties["MemberID"].rich_text[0].plain_text;
      }

      await interaction.followUp({ content: congrateMessage });

      // update challenge embed
      if (message?.embeds?.length) {
        const embed = message.embeds[0];
        embed.data.fields[1].value = `${challProperties["Flaggers"].relation.length + 1}`;
        embed.data.fields[3].value = `<@${firstBloodUserId}>`;
        embed.data.fields[4].value = `<@${user.id}>`;
        await message.edit({ embeds: [embed], components: message.components }).catch(() => {});
      }

      // create member if missing
      if (memberResponse.results.length === 0) {
        memberResponse = await client.notion.pages.create({
          parent: {
            database_id: process.env.MEMBERS_DB
          },
          properties: {
            MemberName: {
              title: [
                {
                  text: {
                    content: user.username
                  }
                }
              ]
            },
            MemberID: {
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
        memberResponse = memberResponse.results[0];
      }

      // find guild in db
      const guildResponse = await client.notion.databases.query({
        database_id: process.env.GUILDS_DB,
        filter: {
          property: "GuildID",
          rich_text: {
            contains: guild.id
          }
        }
      });

      if (guildResponse.results.length === 0) {
        console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\tGuild missing in DB for validation`, guild.id);
        return;
      }

      // find member guild score page
      let scoreMemberResponse = await client.notion.databases.query({
        database_id: process.env.SCORES_DB,
        filter: {
          and: [
            {
              property: "Member",
              relation: {
                contains: memberResponse.id
              }
            },
            {
              property: "Guild",
              relation: {
                contains: guildResponse.results[0].id
              }
            }
          ]
        }
      });

      // create score page if missing
      if (scoreMemberResponse.results.length === 0) {
        scoreMemberResponse = await client.notion.pages.create({
          parent: {
            database_id: process.env.SCORES_DB
          },
          properties: {
            RELATION: {
              title: [
                {
                  text: {
                    content: `${user.username}/${guild.name}`
                  }
                }
              ]
            },
            Member: {
              relation: [
                {
                  id: memberResponse.id
                }
              ]
            },
            Guild: {
              relation: [
                {
                  id: guildResponse.results[0].id
                }
              ]
            }
          }
        });
      } else {
        scoreMemberResponse = scoreMemberResponse.results[0];
      }

      const allChallenges = [...scoreMemberResponse.properties["Challenges"].relation];
      if (!allChallenges.find((chall) => chall.id === challPage.id)) {
        allChallenges.push({ id: challPage.id });
      }

      // update score page
      await client.notion.pages.update({
        page_id: scoreMemberResponse.id,
        properties: {
          Challenges: {
            relation: allChallenges
          }
        }
      });

      // update challenge page
      const updatedFlaggers = [...challProperties["Flaggers"].relation];
      if (!updatedFlaggers.find((mem) => mem.id === memberResponse.id)) {
        updatedFlaggers.push({ id: memberResponse.id });
      }

      if (firstBloodRelation.length === 0) {
        firstBloodRelation = [{ id: memberResponse.id }];
      }

      await client.notion.pages.update({
        page_id: challPage.id,
        properties: {
          FirstBlood: {
            relation: firstBloodRelation
          },
          Flaggers: {
            relation: updatedFlaggers
          }
        }
      });
    } catch (err) {
      console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\tValidation modal failed`, err);
      await interaction.followUp({
        content: {
          fr: "<:cross:1163970998605983848> Quelque chose s'est mal passe..."
        }[locale] || "<:cross:1163970998605983848> Something went wrong..."
      }).catch(() => {});
    }
  }
};
