const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("about")
  });
  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("about-2")
  });
};