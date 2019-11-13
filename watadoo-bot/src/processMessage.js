/* eslint-disable no-console */
const dialogflow = require("dialogflow");

const { prisma } = require("./generated/prisma-client");
const { welcome, localisation, relationship, age, search, searchYes, searchNext, searchCancel, searchNo, searchNoDate, searchNoCity, searchNoFallback, searchLarger, notification, notificationFrequency, personnalInformation, personnalInformationDelete, personnalInformationDeleteNo, personnalInformationDeleteYes, share, goodbye, language, languageYes, languageNo, about, cityNotAvailable, cityNotAvailableYes, cityNotAvailableNo, help, thankYou, defaultIntent } = require("./intents");
const newUser = require("./utils/newUser");

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
  const sessionId = user.id;
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
    if (process.env.NODE_ENV === "development") {
      console.log(result);
      console.log(result.intent.displayName);
      console.log(result.outputContexts);
    }
    await handleIntent(result.intent.displayName, user, result.parameters.fields, result.outputContexts);
  } else {
    console.log("No intent matched.");
    return false;
  }
};

const handleIntent = async (intent, user, parameters = {}, context = []) => {
  switch (intent) {
  case "Welcome":
    await welcome(user, true);
    break;
  case "Localisation":
    await localisation(user, parameters.city.stringValue);
    break;
  case "Relationship":
    await relationship(user, parameters.relationship ? parameters.relationship.stringValue : "");
    break;
  case "Age":
    await age(user, parameters.age ? parameters.age.numberValue : 0);
    break;
  case "Search":
    await search(user, parameters);
    break;
  case "Search - yes":
    await searchYes(user, context.length ? context[0].parameters : null);
    break;
  case "Search - next":
    await searchNext(user, context.length ? context[0].parameters : null);
    break;
  case "Search - cancel":
    await searchCancel(user, context.length ? context[0].parameters : null);
    break;
  case "Search - no":
    await searchNo(user);
    break;
  case "Search - no - date":
    await searchNoDate(user, context.length ? context[1].parameters : null, parameters);
    break;
  case "Search - no - city":
    await searchNoCity(user, context.length ? context[0].parameters : null, parameters.city ? parameters.city.stringValue : "");
    break;
  case "Search - no - fallback":
    await searchNoFallback(user);
    break;
  case "Search - larger":
    await searchLarger(user, context.length ? context[0].parameters : null);
    break;
  case "New Search":
    await welcome(user);
    break;
  case "Notification":
    await notification(user);
    break;
  case "Notification - Frequency":
    await notificationFrequency(user, parameters.Frequency);
    break;
  case "Personnal information":
    await personnalInformation(user);
    break;
  case "Personnal information - delete":
    await personnalInformationDelete(user);
    break;
  case "Personnal information - delete - no":
    await personnalInformationDeleteNo(user);
    break;
  case "Personnal information - delete - yes":
    await personnalInformationDeleteYes(user);
    break;
  case "Share":
    await share(user);
    break;
  case "Goodbye":
    await goodbye(user);
    break;
  case "Language":
    await language(user);
    break;
  case "Language - yes":
    await languageYes(user);
    break;
  case "Language - no":
    await languageNo(user);
    break;
  case "About":
    await about(user);
    break;
  case "CityNotAvailable":
    await cityNotAvailable(user, parameters.city);
    break;
  case "CityNotAvailable - yes":
    await cityNotAvailableYes(user);
    break;
  case "CityNotAvailable - no":
    await cityNotAvailableNo(user);
    break;
  case "Help":
    await help(user);
    break;
  case "Thank you":
    await thankYou(user);
    break;
  default:
    await defaultIntent(user);
    break;
  }
};
