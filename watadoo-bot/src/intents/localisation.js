const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");
const { prisma } = require("../generated/prisma-client");
const { askForRelationship, askForAge } = require("../messages/profile");
const { askWhenMessage } = require("../messages/search");
const { createContext } = require("../utils/context");

module.exports = async (user, city) => {
  const cities = ["Gatineau", "Ottawa", "Montréal", "Québec", "gatineau", "ottawa", "Montreal", "montreal", "Quebec", "quebec",];
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

  } else {
    await prisma.createRequestedCity({ city, user: { connect: { facebookid: user.facebookid } } });

    // agent.add(`Malheureusement, nous n'offrons pas d'événement à ${city} encore.`);
    // agent.add("Veux-tu que je t'avertisse quand ce sera le cas?");
    // return agent.context.set({
    //   name: "CityNotAvailable-followup",
    //   lifespan: 2,
    //   parameters: {
    //     city: city
    //   }
    // });
  }
};