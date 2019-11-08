const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { deleteAllContexts } = require("../utils/context");

module.exports = async (user, frequency) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  let newNotification = {};

  switch (frequency) {
  case "N'importe quand":
    newNotification = { code: "ANYTIME", text: "n'importe quand" };
    break;
  case "Hebdomadairement":
    newNotification = { code: "WEEKLY", text: "à chaque semaine" };
    break;
  case "Bi-mensuellement":
    newNotification = { code: "BIWEEKLY", text: "aux deux semaines" };
    break;
  default:
    newNotification = { code: "MONTHLY", text: "à chaque mois" };
  }

  await prisma.updateUser({
    data: {
      messengerNotifications: newNotification.code
    },
    where: {
      facebookid: user.facebookid
    }
  });

  await deleteAllContexts(user.id);
  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("notification-changed", { name: user.fname, frequency: newNotification.text}),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("Nouvelle recherche"),
        "payload": "Nouvelle recherche"
      },
      {
        "content_type": "text",
        "title": polyglot.t("Partager Watadoo"),
        "payload": "Partager Watadoo"
      },
    ]
  });
};