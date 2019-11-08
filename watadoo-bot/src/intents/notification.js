const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  let currentNotification = "Tu ne reçois présentement aucune alerte.";

  switch (user.messengerNotifications) {
  case "WEEKLY":
    currentNotification = "Tu reçois présentement des alertes à chaque semaine.";
    break;
  case "MONTLY":
    currentNotification = "Tu reçois présentement des alertes à chaque mois.";
    break;
  case "ANYTIME":
    currentNotification = "Je peux présentement t'écrire n'importe quand.";
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
        "payload": "N'importe quand"
      },
      {
        "content_type": "text",
        "title": polyglot.t("À chaque semaine"),
        "payload": "À chaque semaine"
      },
      {
        "content_type": "text",
        "title": polyglot.t("À chaque mois"),
        "payload": "À chaque mois"
      },
    ]
  });
};