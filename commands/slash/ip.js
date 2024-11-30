/*
 * authors : Osiris (YourHacktivist) & Mizari (Mizari-Dev)
 */

 // importation des packages requis
 const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, resolveColor } = require('discord.js');
 const fetch = require('node-fetch');

module.exports = {
  name: "ip-infos",
  description: "Show informations about an IP address.",
  descriptionLocalizations:{
    "fr": "Montre des informations à propos d'une adresse IP."
  },
  options: [
    {
      name: "ip",
      description: "The IP address you want to know some informations.",
      descriptionLocalizations:{
        "fr":"L'adresse IP dont vous voulez voir les informations."
      },
      type: ApplicationCommandOptionType.String,
      required: true
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
    // requête sur l'API avec l'IP passée en paramètre
    const resp = await fetch(`http://ip-api.com/json/${args[0]}?fields=isp,as,org,country,countryCode,regionName,city,zip,proxy,hosting,status`).then(r => r.json()).catch();

    // si la commande a réussi
    if (resp.status === "success") {
      let Geo;
      if (interaction.locale === "fr"){
        // on crée un embed avec toutes les infos de l'IP en français
        Geo = new EmbedBuilder({
          "color": resolveColor('#2F3136'),
          "title":`**IP Lookup**`,
          "description":`**__Récupération des informations d'une IP :__**\n
            **Adresse IP** : ${args[0]}
            **ISP** : ${resp.isp}
            **ASN** : ${resp.as}
            **Organisation** : ${resp.org}
            **Pays** : ${resp.country} (${resp.countryCode})
            **Région** : ${resp.regionName}
            **Ville** : ${resp.city}
            **Code postal** : ${resp.zip}\n
            **Proxy** : ${resp.proxy?"Activé":"Désactivé"}
            **Hosting** : ${resp.hosting?"Activé":"Aucun"} `,
          "footer":{
            "text": "La localisation IP n'est jamais précise • Propulsé par ip-api.com"
          }
        });
      } else {
        Geo = new EmbedBuilder({
          "color": resolveColor('#2F3136'),
          "title":`**IP Lookup**`,
          "description":`**__IP informations retrieve :__**\n
            **Address IP** : ${args[0]}
            **ISP** : ${resp.isp}
            **ASN** : ${resp.as}
            **Organization** : ${resp.org}
            **Country** : ${resp.country} (${resp.countryCode})
            **Region** : ${resp.regionName}
            **City** : ${resp.city}
            **Postal code** : ${resp.zip}\n
            **Proxy** : ${resp.proxy?"Activé":"Désactivé"}
            **Hosting** : ${resp.hosting?"Activé":"Aucun"} `,
          "footer":{
            "text": "IP localization is never precise • Powered by ip-api.com"
          }
        });
      }

      // on send l'embed
      interaction.followUp({ embeds: [Geo] });
    // si la commande n'a pas réussi
    }else {
      // on dit à l'utilisateur ce dont on a besoin pour que ça se passe bien
      interaction.followUp({ content: "Il faut que vous donniez une adresse IP publique." });
    }
  }
}
