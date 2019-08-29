const { Payload } = require("dialogflow-fulfillment");
const { prisma } = require("../generated/prisma-client");

const { notificationChoices } = require("../messages/notification");

exports.notification = async (agent) => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  let user = {};

  try {
    user = await prisma.user({ facebookid: senderId });
  } catch (e) {
    console.log(e);
    user = await prisma.user({ facebookid: senderId });
  }

  if (!user) {
    return agent.add("Tu n'as pas encore d'utilisateur sur cette plateforme. Tu peux me me dire 'salut' et ton compte se créera automatiquement.");
  }

  let currentNotification = "Tu ne reçois présentement aucune alerte.";

  switch (user.messengerNotifications)
  {
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

  const payload = new Payload(agent.FACEBOOK, [
    { text: currentNotification },
    notificationChoices,
  ]);

  return agent.add(payload);
};

exports.notificationFrequency = async (agent) => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  const { Frequency } = agent.parameters;

  let newNotification = {};

  switch (Frequency)
  {
  case "N'importe quand":
    newNotification = {code: "ANYTIME", text: "n'importe quand"};
    break;
  case "Hebdomadairement":
    newNotification = {code: "WEEKLY", text: "à chaque semaine"};
    break;
  case "Bi-mensuellement":
    newNotification = {code: "BIWEEKLY", text: "aux deux semaines"};
    break;
  default:
    newNotification = {code: "MONTHLY", text: "à chaque mois"};
  }

  const user = await prisma.updateUser({
    data: {
      messengerNotifications: newNotification.code
    },
    where: {
      facebookid: senderId
    }
  });

  const payload = new Payload(agent.FACEBOOK, [
    {
      text: `Parfait, c'est noté ${user.fname}! Je t'écrirai dorénavant ${newNotification.text}.`,
      "quick_replies":[
        {
          "content_type": "text",
          "title": "Nouvelle recherche",
          "payload": "Nouvelle recherche"
        },
        {
          "content_type": "text",
          "title": "Partager Watadoo",
          "payload": "Partager Watadoo"
        },
      ]
    },
  ]);
  agent.context.delete("Notification-followup");
  return agent.add(payload);
};
