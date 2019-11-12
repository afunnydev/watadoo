const Polyglot = require("node-polyglot");
const { sendTextMessage } = require("../utils/messenger");
const { getFacebookInformations } = require("../utils/facebook");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");

module.exports = async (senderId) => {
  const fbUser = await getFacebookInformations(senderId);
  const now = new Date();
  const user = await prisma.createUser({
    facebookid: senderId,
    fname: fbUser ? fbUser.first_name : "",
    picture: fbUser ? fbUser.profile_pic : "",
    sex: fbUser.gender ? fbUser.gender.toUpperCase() : "OTHER",
    lastInteraction: now.toISOString()
  });

  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  await sendTextMessage(senderId, {
    text: polyglot.t("presentation")
  });

  const cities = ["Gatineau", "Ottawa", "Montréal", "Québec",];
  await sendTextMessage(senderId, {
    text: polyglot.t("Pour commencer, dans quelle ville es-tu? Tu peux l'écrire si elle n'est pas dans les choix."),
    quick_replies: cities.map(city => ({
      content_type: "text",
      title: polyglot.t(city),
      payload: polyglot.t(city)
    }))
  });
};