/*
 * author : Mizari (Mizari-Dev)
 */
const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, ChannelType, PermissionsBitField, resolveColor } = require('discord.js');

module.exports = {
  name: "ctf-config",
  description: "Config the channel for challenges/CTFs.",
  descriptionLocalizations:{
    "fr": "Configurer le salon pour les challenges/CTFs."
  },
  options: [
    {
      name: "set_channel",
      nameLocalizations: {
        "fr": "définir_salon"
      },
      description: "Set up a challenges/CTFs channel.",
      descriptionLocalizations: {
        "fr": "Configurer un salon de challenges/CTFs."
      },
      options: [
        {
          name: "channel",
          nameLocalizations: {
            "fr": "salon"
          },
          description: "The channel to set up.",
          descriptionLocalizations:{
            "fr": "Le salon à configurer."
          },
          type: ApplicationCommandOptionType.Channel,
          channelTypes: [ChannelType.GuildForum],
          required: true
        }
      ],
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: "unset_channel",
      nameLocalizations: {
        "fr": "enlever_salon"
      },
      description: "Remove a challenges/CTFs channel from config",
      descriptionLocalizations: {
        "fr": "Enlève un salon de challenges/CTFs de la config."
      },
      options: [
        {
          name: "channel",
          nameLocalizations: {
            "fr": "salon"
          },
          description: "Channel to remove from config.",
          descriptionLocalizations: {
            "fr": "Le salon à retirer de la config."
          },
          type: ApplicationCommandOptionType.Channel,
          channelTypes: [ChannelType.GuildForum],
          required: true
        }
      ],
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: "infos",
      description: "Show informations about this server CTF config.",
      descriptionLocalizations: {
        "fr": "Montre les informations de la configuration des CTFs pour ce serveur."
      },
      type: ApplicationCommandOptionType.Subcommand
    }
  ],
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionsBitField.Flags.ManageGuild,
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */
  run: async(client, interaction, args) => {
    await interaction.deferReply({ ephemeral: false }).catch(() => {});
    const { options, locale } = interaction;
    const { _subcommand, _hoistedOptions } = options;

    // Do the right thing
    switch(_subcommand){
      case "set_channel":
        SetChannel({
          client: client,
          interaction: interaction,
          options: _hoistedOptions,
          locale: locale
        });
        break;
      case "unset_channel":
        UnsetChannel({
          client: client,
          interaction: interaction,
          options: _hoistedOptions,
          locale: locale
        });
        break;
      case "info":
        Informations({
          client: client,
          interaction: interaction,
          locale: locale
        });
        break;
    }
  }
}

/**
 * Set a new channel in the guild config
 * @param {Object} allINeed {client, interaction, options, locale}
 */
async function SetChannel(allINeed){
  const { client, interaction, options, locale } = allINeed;
  const { channel } = options[0];

  // Get guild in database
  let response = await client.notion.databases.query({
    database_id: process.env.GUILDS_DB,
    filter: {
      property: "GuildID",
      rich_text: {
        contains: interaction.guildId,
      }
    }
  });

  // Or insert it in database
  if (response.results.length === 0){
    response = await client.notion.pages.create({
      parent: {
        type: "database_id",
        database_id: process.env.GUILDS_DB
      },
      icon: {
        type: "external",
        external: {
          url: interaction.guild.iconURL({ extension: "png", forceStatic: true, size: 16 })
        }
      },
      properties: {
        "GuildName": {
          title: [
            {
              text: {
                content: interaction.guild.name
              }
            }
          ]
        },
        "GuildID": {
          rich_text: [
            {
              text: {
                content: interaction.guildId
              }
            }
          ]
        }
      }
    });
  } else {
    response = response.results[0];
  }
  // Get the ID of the page in DB
  let guild_in_db_id = response.id;
  // Get its relation property
  let guild_relation = response.properties["CTFChannels"].relation;

  // Check if this channel is already in DB
  response = await client.notion.databases.query({
    database_id: process.env.CTFCHANNELS_DB,
    filter: {
      property: "ChannelID",
      rich_text: {
        contains: channel.id,
      }
    }
  });

  // If yes, exit
  if (response.results.length > 0){
    interaction.followUp({
      content: {
        "fr": "<:cross:1163970998605983848> Ce salon existe déjà dans la base de données."
      }[locale] || "<:cross:1163970998605983848> Channel already exist in data base."
    });
    return;
  }

  // Else, insert it in DB
  response = await client.notion.pages.create({
    parent: {
      type: "database_id",
      database_id: process.env.CTFCHANNELS_DB
    },
    properties: {
      "ChannelName": {
        title: [
          {
            text: {
              content: channel.name
            }
          }
        ]
      },
      "ChannelID": {
        rich_text: [
          {
            text: {
              content: channel.id
            }
          }
        ]
      }
    }
  });
  // Then, take the page's ID
  let channel_in_db_id = response.id;

  guild_relation.push({
    id: channel_in_db_id
  });
  // Make a relation between the channel and the guild
  response = await client.notion.pages.update({
    page_id: guild_in_db_id,
    properties: {
      "CTFChannels": {
        relation: guild_relation
      }
    }
  });

  // Inform user that the process ended
  interaction.followUp({
    content: {
      "fr": "<:check:1163970982030094388> Salon ajouté avec succès."
    }[locale] || "<:check:1163970982030094388> Channel added successfully."
  });
}

/**
 * Unset a channel from the guild config
 * @param {Object} allINeed {client, interaction, options, locale}
 */
async function UnsetChannel(allINeed){
  const { client, interaction, options, locale } = allINeed;
  const { channel } = options[0];

  // check if this channel is already in DB
  let response = await client.notion.databases.query({
    database_id: process.env.CTFCHANNELS_DB,
    filter: {
      property: "ChannelID",
      rich_text: {
        contains: channel.id,
      }
    }
  });

  // If channel not in DB, exit
  if (response.results.length === 0){
    interaction.followUp({
      content: {
        "fr": "<:cross:1163970998605983848> Ce salon n'existe pas dans la base de données."
      }[locale] || "<:cross:1163970998605983848> This channel does not exist in the data base."
    });
    return;
  }

  // Else, delete it
  let channel_in_db_id = response.results[0].id;
  response = await client.notion.pages.update({
    page_id: channel_in_db_id,
    archived: true
  });

  interaction.followUp({
    content: {
      "fr": "<:check:1163970982030094388> Salon retiré de la config avec succès."
    }[locale] || "<:check:1163970982030094388> Channel removed from config successfully."
  });
}

/**
 * Give informations about guild config
 * @param {Object} allINeed {client, interaction, locale}
 */
async function Informations(allINeed) {
  const { client, interaction, locale } = allINeed;

  // Get the guild in the DB
  let response = await client.notion.databases.query({
    database_id: process.env.GUILDS_DB,
    filter: {
      property: "GuildID",
      rich_text: {
        contains: interaction.guildId,
      }
    }
  });

  // If not in DB, insert it
  if (response.results.length === 0){
    response = client.notion.pages.create({
      parent: {
        type: "database_id",
        database_id: process.env.GUILDS_DB
      },
      icon: {
        type: "external",
        external: {
          url: interaction.guild.iconURL({ extension: "png", forceStatic: true, size: 16 })
        }
      },
      properties: {
        "GuildName": {
          title: [
            {
              text: {
                content: interaction.guild.name
              }
            }
          ]
        },
        "GuildID": {
          rich_text: [
            {
              text: {
                content: interaction.guildId
              }
            }
          ]
        }
      }
    });
  } else {
    response = response.results[0];
  }

  // Get all channels in guild config
  let channels = response.properties['CTFChannels'].relation;
  for(let i = 0; i < channels.length; i++){
    response = await client.notion.pages.retrieve({ page_id: channels[i].id });
    channels[i] = "<#"+response.properties["ChannelID"].rich_text[0].plain_text+">";
  }

  // Create embed
  let embed = new EmbedBuilder({
    title: {
      "fr": "Voici la configuration de votre serveur :"
    }[locale] || "Here is your server's config:",
    description: channels.length>0?channels.join("\n"):{
      "fr": "Aucune"
    }[locale] || "None",
    color: resolveColor("#2F3136")
  });
  // Send embed
  interaction.followUp({ embeds: [embed] });
}