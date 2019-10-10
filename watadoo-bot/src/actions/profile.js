const { Payload } = require("dialogflow-fulfillment");
const { prisma } = require("../generated/prisma-client");

const { capitalize } = require("../utils/other");

const { askForAge } = require("../messages/profile");
const { momentMessage } = require("../messages/search");

exports.relationship = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) { return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅"); }

  const { relationship } = agent.parameters;
  let status = "NONE";

  if (relationship === "Célibataire") {
    status = "SINGLE";
  } else if (relationship === "Couple") {
    status = "COUPLE";
  } else if (relationship === "Mariage") {
    status = "MARRIED";
  }

  const user = await prisma.updateUser({
    data: {
      relationship: status
    },
    where:{
      facebookid: senderId
    }
  });

  let messages = [];

  if (!user.age) {

    askForAge.map(message => messages.push(message));
    agent.context.set({"name": "age", "lifespan": 2});

  } else {
    messages.push({
      text: `Merci beaucoup pour toutes ces informations${user.fname ? ` ${user.fname}` : ""} ! Je sais que ça peut être long au début. 😅`
    });
    messages.push(momentMessage);
  }

  const payload = new Payload(agent.FACEBOOK, messages);
  return agent.add(payload);
};

exports.age = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) { return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅"); }

  let { age } = agent.parameters;
  const query = agent.query;

  if (query === "Ne pas répondre" || query === "Question suivante" || query === "Prochaine question") { age = 0; }

  const user = await prisma.updateUser({
    data: {
      age: age
    },
    where:{
      facebookid: senderId
    }
  });

  let messages = [
    {
      text: `Merci beaucoup pour toutes ces informations${user.fname ? ` ${user.fname}` : ""} ! Je sais que ça peut être long au début. 😅`
    },
  ];
  messages.push(momentMessage);

  const payload = new Payload(agent.FACEBOOK, messages);
  return agent.add(payload);
};

exports.viewProfile = async (agent) => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) { return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅"); }

  let user = {};

  try {
    user = await prisma.user({ facebookid: senderId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    user = await prisma.user({ facebookid: senderId });
  }

  if (!user) {
    return agent.add("Tu n'as pas encore d'utilisateur sur cette plateforme. Tu peux me me dire 'salut' et ton compte se créera automatiquement.");
  }

  const payload = new Payload(agent.FACEBOOK, [
    { text: "Voici les informations personnelles que j'ai sur toi. 👇"},
    { text: `Prénom: ${user.fname}\nÂge: ${user.age}\nStatut relationnel: ${capitalize(user.relationship)}\nVille de résidence: ${capitalize(user.city)}\nSexe: ${capitalize(user.sex)}\nDernière recherche: ${user.lastInteraction}`},
    {
      text: "Tu ne peux pas modifier tes informations personnelles pour le moment. Voici ce que tu peux faire:",
      "quick_replies":[
        {
          "content_type": "text",
          "title":"Supprimer mon compte",
          "payload":"Supprimer mon compte"
        },
        {
          "content_type": "text",
          "title": "Nouvelle recherche",
          "payload": "Nouvelle recherche"
        },
        {
          "content_type": "text",
          "title": "Confidentialité",
          "payload": "Confidentialité"
        },
      ]
    },
  ]);
  return agent.add(payload);
};

exports.deleteProfile = async (agent) => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) { return agent.add("Je ne suis pas capable de t'dentifer. Réessaye plus tard 😅"); }

  let user = {};

  try {
    user = await prisma.deleteUser({ facebookid: senderId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }

  if (!user) {
    return agent.add("Tu n'as pas encore d'utilisateur sur cette plateforme. Difficile à supprimer. 😂");
  }

  agent.add("Ton compte a été supprimé avec succès. Même si je suis triste qu'on en finisse là, je suis certain que tu as des bonnes raisons. Sans rancune.");

  return agent.add("Je serai toujours là si tu as besoin d'aide pour trouver un événement. Tu n'as qu'à me saluer. Bonne continuité. 👋");
};
