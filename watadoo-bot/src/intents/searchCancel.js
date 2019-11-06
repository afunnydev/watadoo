const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");

module.exports = async (user, parameters) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (!parameters || !parameters.fields || !parameters.fields.queryId) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-no-query")
    });
  }

  const queryId = parameters.fields.queryId.stringValue;

  try {
    await prisma.deleteSearch({ id: queryId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-no-query")
    });
  }

  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("search-cancel")
  });
};