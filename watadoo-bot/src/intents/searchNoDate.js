const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { findEventMoment } = require("../utils/search");
const { makeNewSearch } = require("../messages/search");

module.exports = async (user, context, { date, timePeriod, datePeriod, datePeriodString }) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (!context || !context.fields || !context.fields.queryId) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-no-query")
    });
  }

  const queryId = context.fields.queryId.stringValue;

  if (!date && !timePeriod && !datePeriod) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("Je n'ai pas compris ces dates.")
    });
  }

  const eventMoment = findEventMoment(
    polyglot,
    date.stringValue,
    timePeriod.structValue ? timePeriod.structValue.fields : null,
    datePeriod.structValue ? datePeriod.structValue.fields : null,
    datePeriodString.stringValue
  );

  const searchQuery = await prisma.updateSearch({
    data: {
      startDate: eventMoment.start.toISOString(),
      endDate: eventMoment.end.toISOString()
    },
    where: {
      id: queryId
    }
  });

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("date-adjusted", { date: eventMoment.string })
  });
  return await makeNewSearch(user, polyglot, searchQuery);
};