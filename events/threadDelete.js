const client = require("../index");
const colors = require('../functions/colors.js');

client.on("threadDelete", async (thread) => {
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

  // Get challenge in DB
  response = await client.notion.databases.query({
    database_id: process.env.CHALLENGES_DB,
    filter: {
      property: 'ThreadID',
      text: {
        contains: thread.id
      }
    }
  });

  if (response.results.length > 0){
    // Delete challenge
    const pageId = response.results[0].id;
    response = await client.notion.pages.update({
      page_id: pageId,
      archived: true
    });
  }

  // Logs
  console.log(`[${colors.FgRed}Chall Remove${colors.Reset}]\ttitle : ${thread.name}\n\t\tid : ${thread.id}`);
});
