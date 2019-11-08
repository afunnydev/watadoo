const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { makeNewSearch } = require("../messages/search");

module.exports = async (user, context, city) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (!context || !context.fields || !context.fields.queryId) {
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("search-no-query")
    });
  }

  const queryId = context.fields.queryId.stringValue;

  // This needs to be checked because these are our cities in the enum. TODO: Shouldn't be checked manually...
  const cities = ["Gatineau", "Ottawa", "Montréal", "Québec", "gatineau", "ottawa", "Montreal", "montreal", "Quebec", "quebec",];
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

  // agent.add(`Malheureusement, je n'offre pas d'événement à ${city} encore.`);
  // agent.add("Veux-tu que je t'avertisse quand ce sera le cas?");
  // agent.context.delete("Search-followup");
  // agent.context.delete("Search-no-followup");
  // return agent.context.set({
  //   name: "CityNotAvailable-followup",
  //   lifespan: 2,
  //   parameters: {
  //     city: city
  //   }
  // });
};