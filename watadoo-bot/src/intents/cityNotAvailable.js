const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");
const { prisma } = require("../generated/prisma-client");
const { askWhenMessage } = require("../messages/search");
const { createContext } = require("../utils/context");

module.exports = async (user, city) => {
  // const cities = ["Gatineau", "Ottawa", "Montréal", "Québec", "gatineau", "ottawa", "Montreal", "montreal", "Quebec", "quebec",];
  const cities = ["Gatineau", "Ottawa", "gatineau", "ottawa",];
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (cities.includes(city)) {
    // In the enum, we use MONTREAL and QUEBEC, without special character.
    await Promise.all([prisma.updateUser({ data: { city: city.replace("é", "e").toUpperCase() }, where: { facebookid: user.facebookid } }), sendTextMessage(user.facebookid, {
      text: polyglot.t("location_confirmation", { city })
    }),]);

    return await askWhenMessage(user.facebookid, polyglot);

  } else {
    await prisma.createRequestedCity({ city, user: { connect: { facebookid: user.facebookid } } });

    createContext(user.id, "CityNotAvailable-followup", 2, { city });
    await sendTextMessage(user.facebookid, {
      text: polyglot.t("city-not-available", { city })
    });
  }
};