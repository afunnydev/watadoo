const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user) => {
  const newLang = user.language === "FR" ? "EN" : "FR";
  const newUser = await prisma.updateUser({
    data: {
      language: newLang
    },
    where: {
      facebookid: user.facebookid
    }
  });

  const polyglot = new Polyglot();
  polyglot.extend(messages[newUser.language.toLowerCase()]);

  let m = {
    text: polyglot.t("lang-changed")
  };

  if (user.age || user.relationship) {
    m["quick_replies"] = [
      {
        "content_type": "text",
        "title": polyglot.t("Nouvelle recherche"),
        "payload": polyglot.t("Nouvelle recherche")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Je veux m'inscrire"),
        "payload": polyglot.t("Je veux m'inscrire")
      },
    ];
  }

  await sendTextMessage(user.facebookid, m);

  if (!user.age && !user.relationship) {
    // const cities = ["Gatineau", "Ottawa", "Montréal", "Québec",];
    const cities = ["Gatineau", "Ottawa",];
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("Pour commencer, dans quelle ville es-tu? Tu peux l'écrire si elle n'est pas dans les choix."),
      quick_replies: cities.map(city => ({
        content_type: "text",
        title: polyglot.t(city),
        payload: polyglot.t(city)
      }))
    });
  }
};