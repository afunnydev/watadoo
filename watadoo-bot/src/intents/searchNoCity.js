const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { createContext, deleteContext } = require("../utils/context");
const { makeNewSearch } = require("../messages/search");
const { deleteAllContexts } = require("../utils/context");
const welcome = require("./welcome");

module.exports = async (user, context, city) => {
  if (city === "Salut") {
    await deleteAllContexts(user.id);
    return await welcome(user);
  }

  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (!context || !context.fields || !context.fields.queryId) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-no-query")
    });
  }

  const queryId = context.fields.queryId.stringValue;

  // This needs to be checked because these are our cities in the enum. TODO: Shouldn't be checked manually...
  // const cities = ["Gatineau", "Ottawa", "Montréal", "Québec", "gatineau", "ottawa", "Montreal", "montreal", "Quebec", "quebec",];
  const cities = ["Gatineau", "Ottawa", "gatineau", "ottawa",];
  if (cities.includes(city)) {
    const searchQuery = await prisma.updateSearch({
      data: {
        // In the enum, we use MONTREAL and QUEBEC, without special character.
        city: city.replace("é", "e").toUpperCase()
      },
      where: {
        id: queryId
      }
    });

    await sendTextMessage(user.facebookid, {
      text: polyglot.t("city-adjusted", { city })
    });
    return await makeNewSearch(user, polyglot, searchQuery);
  }
  await prisma.createRequestedCity({ city, user: { connect: { facebookid: user.facebookid } } });
  await Promise.all([
    createContext(user.id, "CityNotAvailable-followup", 2, { city }),
    deleteContext(user.id, "Search-followup"),
    deleteContext(user.id, "Search-no-followup"),
  ]);
  await sendTextMessage(user.facebookid, {
    text: polyglot.t("city-not-available", { city })
  });
};