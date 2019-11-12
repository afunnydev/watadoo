const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("default-intent", { name: user.fname }),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("Nouvelle recherche"),
        "payload": polyglot.t("Nouvelle recherche")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Je veux m'inscrire"),
        "payload": polyglot.t("Je veux m'inscrire")
      },
    ]
  });
};