require("dotenv").config({ path: ".env.development" });

const express = require("express");
const app = express();
const createServer = require("./createServer");

const { WebhookClient } = require("dialogflow-fulfillment");
const bodyParser = require("body-parser");

const { welcome, localisation, share } = require("./actions/defaults");
const { relationship, age, viewProfile, deleteProfile } = require("./actions/profile");
const { search, searchYes, searchInterest, searchNext, searchNoCity, searchNoDate, searchCancel, searchLarge } = require("./actions/search");
const { notification, notificationFrequency } = require("./actions/notification");

const { uptime } = require("./tests/uptime");

const corsOptions = {
  credentials: true,
  origin: process.env.FRONTEND_URL
};

app.use(bodyParser.json());

app.get("/monitor", async (req, res) => {
  const auth = req.header("Authorization");
  if (auth !== process.env.UPTIME_BASIC_AUTH) {
    throw new Error("Not Authorized");
  }
  const up = await uptime();
  if (up) {
    res.status(200).json({up: true});
  } else {
    res.status(404).json({up: false});
  }
});

app.post("/webhook/dialogflow", async (req, res) => {
  const key = req.header("X-Dialogflow");
  if (key !== process.env.DIALOGFLOW_HEADER_KEY) {
    throw new Error("Not Authorized");
  }

  const agent = new WebhookClient({ request: req, response: res });
  if (process.env.NODE_ENV === "development") {
    console.log(JSON.stringify(req.body));
  }

  let intentMap = new Map(); // Map functions to Dialogflow intent names

  intentMap.set("Welcome", await welcome);
  intentMap.set("New Search", await welcome);
  intentMap.set("Localisation", await localisation);
  intentMap.set("Share", await share);

  intentMap.set("Relationship", await relationship);
  intentMap.set("Age", await age);

  intentMap.set("Search", await search);
  intentMap.set("Search - yes", await searchYes);
  intentMap.set("Search - interest", await searchInterest);
  intentMap.set("Search - next", await searchNext);
  intentMap.set("Search - cancel", await searchCancel);
  intentMap.set("Search - larger", await searchLarge);
  intentMap.set("Search - no - city", await searchNoCity);
  intentMap.set("Search - no - date", await searchNoDate);

  intentMap.set("Notification", await notification);
  intentMap.set("Notification - Frequency", await notificationFrequency);

  intentMap.set("Personnal information", await viewProfile);
  intentMap.set("Personnal information - delete - yes", await deleteProfile);

  agent.handleRequest(intentMap);
});

const server = createServer();
server.applyMiddleware({ app, cors: corsOptions });

const port = process.env.PORT || 5000;

// Start server
app.listen(port, () => console.log(`App listening on port ${port}!`));
