const client = require("../index");
const colors = require('../functions/colors.js');
const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

client.on("threadCreate", async (thread, newlyCreated) => {
  
  // Get the guild in the DB
  let response = await client.notion.databases.query({
    database_id: process.env.GUILDS_DB,
    filter: {
      property: "GuildID",
      rich_text: {
        contains: thread.guildId,
      }
    }
  });

  // If guild not in DB, exit
  if (response.results.length === 0)
    return;

  // Get all channels in the guild config
  const configs = response.results[0].properties['CTFChannels'].relation.map(conf => conf.id);

  // If no config, exit
  if (configs.length === 0)
    return;

  // Get all channel IDs
  let ids = [];
  let ids_configs = {};
  for (let i = 0; i < configs.length; i++) {
    response = await client.notion.pages.retrieve({ page_id: configs[i] });
    let id = response.properties["ChannelID"].rich_text[0].plain_text;
    ids.push(id);
    ids_configs[id] = {id: configs[i], relation: response.properties["Challenges"].relation};
    
  }
  
  // If thread's parent not in config, exit
  if (!ids.includes(thread.parentId))
    return;
  
  // Create challenge in DB
  response = await client.notion.pages.create({
    parent: {
      database_id: process.env.CHALLENGES_DB
    },
    properties: {
      "ThreadName": {
        title: [
          {
            text: {
              content: thread.name
            }
          }
        ]
      },
      "ThreadID": {
        rich_text: [
          {
            text: {
              content: thread.id
            }
          }
        ]
      }
    }
  });
  // Get page ID
  challenge_id_in_db = response.id;

  // Update channel to link the challenge to the channel in the DB
  let channel_to_update = ids_configs[thread.parentId];
  channel_to_update.relation.push({
    id: challenge_id_in_db
  });
  response = await client.notion.pages.update({
    page_id: channel_to_update.id,
    properties: {
      "Challenges": {
        relation: channel_to_update.relation
      }
    }
  });
  
  // Create challenge config button
  let button = new ActionRowBuilder({
    components: [
      new ButtonBuilder({
        style: 1,
        label: "Config challenge",
        customId: "chall_btn"
      })
    ]
  });

  // Send button
  thread.send({
    components: [button]
  });

  // Logs
  console.log(`[${colors.FgGreen}  New Chall ${colors.Reset}]\ttitle : ${thread.name}\n\t\tid : ${thread.id}`);
});
