const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { askWhenMessage } = require("../messages/search");

module.exports = async (user, age = 0) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  await Promise.all([
    sendTextMessage(user.facebookid, {
      text: polyglot.t("thanks-for-info", { name: user.fname })
    }),
    prisma.updateUser({
      data: {
        age: age
      },
      where: {
        id: user.id
      }
    }),
  ]);

  return await askWhenMessage(user.facebookid, polyglot);
};