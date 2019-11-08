const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { makeNewSearch } = require("../messages/search");

module.exports = async (user, parameters) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (!parameters || !parameters.fields || !parameters.fields.queryId) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-no-query")
    });
  }

  const queryId = parameters.fields.queryId.stringValue;
  const searchQuery = await prisma.search({ id: queryId });

  return await makeNewSearch(user, polyglot, searchQuery);
};