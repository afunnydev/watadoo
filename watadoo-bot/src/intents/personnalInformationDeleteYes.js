const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { deleteAllContexts } = require("../utils/context");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  try {
    await prisma.deleteUser({ facebookid: user.facebookid });
  } catch (e) {
    // TODO: send message if can't delete. We need to check what happened.
    // eslint-disable-next-line no-console
    console.log(e);
  }

  await deleteAllContexts(user.id);
  await sendTextMessage(user.facebookid, {
    text: polyglot.t("user-deleted")
  });
  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("farewell")
  });
};