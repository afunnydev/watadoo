const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { deleteAllContexts } = require("../utils/context");

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

  await deleteAllContexts(user.id);
  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("lang-changed")
  });
};