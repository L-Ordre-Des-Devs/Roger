/*
 * edited : Syxles (Syxless)
 */
const { ApplicationCommandOptionType } = require("discord.js");
const client = require("../index");
const colors = require("../functions/colors.js");

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.guild) {
      await safeReply(interaction, { content: "Can't do commands in PM :/" });
      return;
    }

    // Slash Command Handling
    if (interaction.isChatInputCommand()) {
      const cmd = client.commandsFiles.get(interaction.commandName);
      if (!cmd) {
        await safeReply(interaction, { content: "An error has occured", ephemeral: true });
        return;
      }

      const args = [];
      for (const option of interaction.options.data) {
        if (option.type === ApplicationCommandOptionType.Subcommand) {
          if (option.name) {
            args.push(option.name);
          }

          option.options?.forEach((valueOption) => {
            if (valueOption.value !== undefined) {
              args.push(valueOption.value);
            }
          });
        } else if (option.value !== undefined) {
          args.push(option.value);
        }
      }

      interaction.member = interaction.guild.members.cache.get(interaction.user.id);
      await cmd.run(client, interaction, args);

      console.log(`[ ${colors.FgCyan}slash-cmd${colors.Reset}  ]\tauthor : ${interaction.user.username}\n\t\tguild : ${interaction.guild.name}\n\t\tcmd : ${interaction.commandName}\n\t\targs : ${args}`);
      return;
    }

    // Context Menu Handling
    if (interaction.isContextMenuCommand()) {
      await interaction.deferReply({ ephemeral: false });
      const command = client.commandsFiles.get(interaction.commandName);

      if (command) {
        await command.run(client, interaction);
      } else {
        await safeReply(interaction, { content: "This command is no longer available.", ephemeral: true });
      }

      console.log(`[${colors.FgCyan}context-menu${colors.Reset}]\tauthor : ${interaction.user.username}\n\t\tguild : ${interaction.guild.name}\n\t\tcmd : ${interaction.commandName}`);
      return;
    }

    // Modal Handling
    if (interaction.isModalSubmit()) {
      const command = getComponentCommand(interaction.customId);
      if (!command) {
        await safeReply(interaction, { content: "This interaction is no longer available.", ephemeral: true });
        return;
      }

      await command.run(client, interaction);
      console.log(`[${colors.FgCyan}   modal    ${colors.Reset}]\tauthor : ${interaction.user.username}\n\t\tguild : ${interaction.guild.name}\n\t\tmodal : ${interaction.customId}`);
      return;
    }

    // Button Handling
    if (interaction.isButton()) {
      const btn = getComponentCommand(interaction.customId);
      if (!btn) {
        await safeReply(interaction, { content: "This interaction is no longer available.", ephemeral: true });
        return;
      }

      await btn.run(client, interaction);
      console.log(`[${colors.FgCyan}   button   ${colors.Reset}]\tauthor : ${interaction.user.username}\n\t\tguild : ${interaction.guild.name}\n\t\tbtn : ${interaction.customId}`);
      return;
    }

    // Select Handling
    if (interaction.isStringSelectMenu()) {
      const select = getComponentCommand(interaction.customId);
      if (!select) {
        await safeReply(interaction, { content: "This interaction is no longer available.", ephemeral: true });
        return;
      }

      await select.run(client, interaction);
      console.log(`[${colors.FgCyan}   select   ${colors.Reset}]\tauthor : ${interaction.user.username}\n\t\tguild : ${interaction.guild.name}\n\t\tselect : ${interaction.customId}`);
    }
  } catch (err) {
    console.error(`[${colors.FgRed}   Error    ${colors.Reset}]\tInteraction handler failed`, err);
    await safeReply(interaction, { content: "An unexpected error has occured.", ephemeral: true });
  }
});

function getComponentCommand(customId) {
  const directMatch = client.commandsFiles.get(customId);
  if (directMatch) {
    return directMatch;
  }

  for (const [key, command] of client.commandsFiles) {
    if (customId.startsWith(`${key}:`)) {
      return command;
    }
  }

  return null;
}

async function safeReply(interaction, payload) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload).catch(() => {});
    return;
  }

  await interaction.reply(payload).catch(() => {});
}
