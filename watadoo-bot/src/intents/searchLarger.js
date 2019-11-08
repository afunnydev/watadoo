const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { makeNewSearch } = require("../messages/search");

module.exports = async (user, context) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (!context || !context.fields || !context.fields.queryId) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-no-query")
    });
  }

  const queryId = context.fields.queryId.stringValue;
  const now = new Date();
  const in14Days = new Date(now.getTime() + 12096e5);

  const searchQuery = await prisma.updateSearch({
    data: {
      startDate: now.toISOString(),
      endDate: in14Days.toISOString()
    },
    where: {
      id: queryId
    }
  });

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("Voici les événements que j'ai durant les 2 prochaines semaines.")
  });
  return await makeNewSearch(user, polyglot, searchQuery);
};