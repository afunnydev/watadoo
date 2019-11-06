const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { findEventMoment } = require("../utils/search");
const { capitalize } = require("../utils/other");
const { askWhenMessage } = require("../messages/search");
const { updateContext } = require("../utils/context");

module.exports = async (user, { date, timePeriod, datePeriod, datePeriodString }) => {
  const now = new Date();
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  // Every searches are count as interaction. It will affect if the user gets a notification or no.
  await prisma.updateUser({ data: { lastInteraction: now.toISOString() }, where: { id: user.id } });

  if (!date && !timePeriod && !datePeriod) {
    await sendTextMessage(user.facebookid, {
      text: polyglot.t("Je n'ai pas compris ces dates.")
    });
    return await askWhenMessage(user.facebookid, polyglot);
  }

  const eventMoment = findEventMoment(
    date.stringValue,
    timePeriod.structValue ? timePeriod.structValue.fields : null,
    datePeriod.structValue ? datePeriod.structValue.fields : null,
    datePeriodString.stringValue
  );
  let query = {};

  try {
    query = await prisma.createSearch({
      city: user.city,
      startDate: eventMoment.start.toISOString(),
      endDate: eventMoment.end.toISOString(),
      user: {
        connect: {
          id: user.id
        }
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-error")
    });
  }
  return await Promise.all([
    updateContext(user.id, "search-followup", 5, { queryId: query.id }),
    sendTextMessage(user.facebookid, {
      text: `Parfait! Donc, si j'ai bien compris, je cherche des événements à ${capitalize(user.city)} qui se dérouleront ${eventMoment.string}?`,
      "quick_replies": [
        {
          "content_type": "text",
          "title": "Oui",
          "payload": "oui"
        },
        {
          "content_type": "text",
          "title": "Non",
          "payload": "non"
        },
      ]
    }),
  ]);
};