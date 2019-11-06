const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("Pas de problème. Tu peux me donner une autre ville ou une autre date pour ta recherche.")
  });
};