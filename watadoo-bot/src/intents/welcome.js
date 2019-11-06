const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage } = require("../utils/messenger");
const { askForLocation, askForRelationship, askForAge } = require("../messages/profile");
const { askWhenMessage } = require("../messages/search");
const { createContext } = require("../utils/context");

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("greet-with-name", { name: user.fname ? `${user.fname}` : "" })
  });

  if (!user.city) {
    return await askForLocation(user.facebookid, polyglot);
  }

  if (!user.relationship) {
    await sendTextMessage(user.facebookid, {
      text: polyglot.t("more-info-needed")
    });
    createContext(user.id, "relationship");
    return await askForRelationship(user.facebookid, polyglot);
  }

  if (typeof user.age !== "number") {
    createContext(user.id, "age");
    return await askForAge(user.facebookid, polyglot);
  }

  return await askWhenMessage(user.facebookid, polyglot);
};