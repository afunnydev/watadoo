const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("current-lang")
  });
  return await sendTextMessage(user.facebookid, {
    "text": polyglot.t("new-lang-suggestion"),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("Oui"),
        "payload": polyglot.t("Oui")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Non"),
        "payload": polyglot.t("Non")
      },
    ]
  });
};