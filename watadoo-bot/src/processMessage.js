/* eslint-disable no-console */
const dialogflow = require("dialogflow");
const uuid = require("uuid");

const { prisma } = require("./generated/prisma-client");
const { welcome, localisation } = require("./intents");
const { newUser } = require("./utils/newUser");

// Instantiates a session client
const sessionClient = new dialogflow.SessionsClient();
const projectId = "watadoo-13c84";

module.exports = async (event) => {
  const senderId = event.sender.id;
  const user = await prisma.user({ facebookid: senderId });

  if (!user) {
    return await newUser(senderId);
  }

  const { language } = user;
  const sessionId = uuid.v4();
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: event.message.text,
        languageCode: language.toLowerCase()
      }
    }
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);

  const result = responses[0].queryResult;
  if (result.intent) {
    console.log(result);
    await handleIntent(result.intent.displayName, user, result.parameters.fields);
  } else {
    console.log("No intent matched.");
    return false;
  }
};

const handleIntent = async (intent, user, parameters = {}) => {
  switch (intent) {
  case "Welcome" || "New Search":
    await welcome(user);
    break;
  case "Localisation":
    await localisation(user, parameters.city.stringValue);
    break;
  default:
    break;
  }
};
