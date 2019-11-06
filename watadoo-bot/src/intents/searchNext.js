const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { sendAllEventsSeenMessage, sendNextOccurrences } = require("../messages/search");

module.exports = async (user, parameters) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (!parameters || !parameters.fields || !parameters.fields.queryId) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-no-query")
    });
  }

  const queryId = parameters.fields.queryId.stringValue;
  const fragment = `
    fragment SearchWithEventsAndUser on Search {
      id
      suggested
      eventOccurrences {
        id
        name
        description
        imageUrl
        event {
          id
        }
      }
      user {
        id
      }
    }
  `;

  const searchQuery = await prisma.search({ id: queryId }).$fragment(fragment);

  if (searchQuery.eventOccurrences.length < searchQuery.suggested) {
    return await sendAllEventsSeenMessage(user.facebookid, polyglot);
  }
  const totalSuggested = searchQuery.suggested + 5;
  await prisma.updateSearch({
    data: {
      suggested: totalSuggested
    },
    where: {
      id: searchQuery.id
    }
  });
  return await sendNextOccurrences(user, polyglot, searchQuery.eventOccurrences.slice(searchQuery.suggested), true);
};