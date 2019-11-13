const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { capitalize } = require("../utils/other");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("Voici les informations personnelles que j'ai sur toi.")
  });
  await sendTextMessage(user.facebookid, {
    text: polyglot.t("user-info", {
      fname: user.fname,
      age: user.age,
      relationship: user.relationship,
      city: capitalize(user.city),
      sex: capitalize(user.sex),
      search: user.lastInteraction
    })
  });
  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("Tu ne peux pas modifier tes informations personnelles pour le moment. Voici ce que tu peux faire:"),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("Supprimer mon compte"),
        "payload": polyglot.t("Supprimer mon compte")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Nouvelle recherche"),
        "payload": polyglot.t("Nouvelle recherche")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Confidentialité"),
        "payload": polyglot.t("Confidentialité")
      },
    ]
  });
};