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

  const eventOccurrences = await prisma.eventOccurrencesConnection({
    where: {
      city: searchQuery.city,
      startDate_gte: searchQuery.startDate,
      startDate_lte: searchQuery.endDate
    }
  });

  if (eventOccurrences && !eventOccurrences.edges.length) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("no-event-found-again", { city: polyglot.t(searchQuery.city), name: user.fname }),
      "quick_replies": [
        {
          "content_type": "text",
          "title": polyglot.t("Gatineau"),
          "payload": polyglot.t("Gatineau")
        },
        {
          "content_type": "text",
          "title": polyglot.t("Ottawa"),
          "payload": polyglot.t("Ottawa")
        },
      ]
    });
  }

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("Voici les événements que j'ai durant les 2 prochaines semaines.")
  });
  return await makeNewSearch(user, polyglot, searchQuery);
};