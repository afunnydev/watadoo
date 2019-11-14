const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");
const { prisma } = require("../generated/prisma-client");
const { askForRelationship, askForAge } = require("../messages/profile");
const { askWhenMessage } = require("../messages/search");
const { createContext, deleteAllContexts } = require("../utils/context");
const welcome = require("./welcome");

module.exports = async (user, city) => {
  // There's a city called "Salut"... It shouldn't trigger this intention but I can't use Negative examples in Dialogflow.
  if (city === "Salut") {
    await deleteAllContexts(user.id);
    return await welcome(user);
  }
  // const cities = ["Gatineau", "Ottawa", "Montréal", "Québec", "gatineau", "ottawa", "Montreal", "montreal", "Quebec", "quebec",];
  const cities = ["Gatineau", "Ottawa", "gatineau", "ottawa",];
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (cities.includes(city)) {
    // In the enum, we use MONTREAL and QUEBEC, without special character.
    await Promise.all([prisma.updateUser({ data: { city: city.replace("é", "e").toUpperCase() }, where: { facebookid: user.facebookid } }), sendTextMessage(user.facebookid, {
      text: polyglot.t("location_confirmation", { city })
    }),]);

    if (!user.relationship) {
      await sendTextMessage(user.facebookid, {
        text: polyglot.t("more-info-needed")
      });
      createContext(user.id, "relationship");
      return askForRelationship(user.facebookid, polyglot);
    }

    if (typeof user.age !== "number") {
      createContext(user.id, "age");
      return await askForAge(user.facebookid, polyglot);
    }

    return await askWhenMessage(user.facebookid, polyglot);

  }
  await prisma.createRequestedCity({ city, user: { connect: { facebookid: user.facebookid } } });

  createContext(user.id, "CityNotAvailable-followup", 2, { city });
  return await sendTextMessage(user.facebookid, {
    text: polyglot.t("city-not-available", { city })
  });
};