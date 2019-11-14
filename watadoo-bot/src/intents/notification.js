const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  let currentNotification = "subscription-never";

  switch (user.messengerNotifications) {
  case "WEEKLY":
    currentNotification = "subscription-weekly";
    break;
  case "MONTHLY":
    currentNotification = "subscription-monthly";
    break;
  case "ANYTIME":
    currentNotification = "subscription-anytime";
    break;
  }

  await sendTextMessage(user.facebookid, {
    text: polyglot.t(currentNotification)
  });
  return await sendTextMessage(user.facebookid, {
    "text": polyglot.t("À quelle fréquence aimerais-tu que je t'écrives?"),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("N'importe quand"),
        "payload": polyglot.t("N'importe quand")
      },
      {
        "content_type": "text",
        "title": polyglot.t("À chaque semaine"),
        "payload": polyglot.t("À chaque semaine")
      },
      {
        "content_type": "text",
        "title": polyglot.t("À chaque mois"),
        "payload": polyglot.t("À chaque mois")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Jamais"),
        "payload": polyglot.t("Jamais")
      },
    ]
  });
};