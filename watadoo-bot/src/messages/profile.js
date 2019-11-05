const { sendTextMessage } = require("../utils/messenger");

const relationOptions = [
  { title: "Célibataire", payload: "Célibataire" },
  { title: "En couple", payload: "Couple" },
  { title: "Marié(e)", payload: "Marié" },
  { title: "Autre", payload: "Autre" },
  { title: "Ne pas répondre", payload: "Autre" },
];
exports.askForRelationship = async (id, polyglot) => {
  return await sendTextMessage(id, {
    text: polyglot.t("Quel est ton statut relationnel?"),
    quick_replies: relationOptions.map(option => ({
      content_type: "text",
      title: polyglot.t(option.title),
      payload: option.payload
    }))
  });
};

exports.askForAge = async (id, polyglot) => {
  await sendTextMessage(id, {
    text: polyglot.t("Quel âge as-tu? Entre simplement des chiffres.")
  });
  await sendTextMessage(id, {
    text: polyglot.t("Si tu n'est pas à l'aise à me dire ton âge, entre '0'.")
  });
};

const cities = ["Gatineau", "Ottawa", "Montréal", "Québec",];
exports.askForLocation = async (id, polyglot) => {
  return await sendTextMessage(id, {
    text: polyglot.t("Pour commencer, dans quelle ville es-tu? Tu peux l'écrire si elle n'est pas dans les choix."),
    quick_replies: cities.map(city => ({
      content_type: "text",
      title: polyglot.t(city),
      payload: city
    }))
  });
};

