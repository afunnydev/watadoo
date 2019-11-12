const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { prisma } = require("../generated/prisma-client");
const { sendTextMessage } = require("../utils/messenger");
const { askForAge } = require("../messages/profile");
const { askWhenMessage } = require("../messages/search");
const { createContext } = require("../utils/context");

module.exports = async (user, relationship) => {
  let status = "NONE";

  if (relationship === "Célibataire" || relationship === "Single") {
    status = "SINGLE";
  } else if (relationship === "Couple") {
    status = "COUPLE";
  } else if (relationship === "Mariage" || relationship === "Married") {
    status = "MARRIED";
  }

  await prisma.updateUser({
    data: {
      relationship: status
    },
    where: {
      id: user.id
    }
  });

  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  if (!user.age) {
    createContext(user.id, "age");
    return await askForAge(user.facebookid, polyglot);
  }

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("thanks-for-info", { name: user.fname })
  });
  return await askWhenMessage(user.facebookid, polyglot);
};