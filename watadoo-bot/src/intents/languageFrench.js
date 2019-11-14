const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const newUser = await prisma.updateUser({
    data: {
      language: "FR"
    },
    where: {
      facebookid: user.facebookid
    }
  });

  const polyglot = new Polyglot();
  polyglot.extend(messages[newUser.language.toLowerCase()]);

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("lang-changed")
  });

  if (!user.age && !user.relationship) {
    const cities = ["Gatineau", "Ottawa", "Montréal", "Québec",];
    await sendTextMessage(user.facebookid, {
      text: polyglot.t("Pour commencer, dans quelle ville es-tu? Tu peux l'écrire si elle n'est pas dans les choix."),
      quick_replies: cities.map(city => ({
        content_type: "text",
        title: polyglot.t(city),
        payload: polyglot.t(city)
      }))
    });
  }
};