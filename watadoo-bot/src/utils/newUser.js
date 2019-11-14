const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { getFacebookInformations } = require("../utils/facebook");
const { createContext } = require("../utils/context");

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

  await createContext(user.id, "Language-followup", 5);
  await sendTextMessage(user.facebookid, {
    text: polyglot.t("current-lang-beginning"),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("choose-french"),
        "payload": polyglot.t("choose-french")
      },
      {
        "content_type": "text",
        "title": polyglot.t("choose-english"),
        "payload": polyglot.t("choose-english")
      },
    ]
  });
};