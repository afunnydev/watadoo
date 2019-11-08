require("dotenv").config({ path: ".env.development.local" });

const express = require("express");
const crypto = require("crypto");
const createServer = require("./createServer");

const bodyParser = require("body-parser");
const uptime = require("./uptime");
const processMessage = require("./processMessage");

const app = express();
const corsOptions = {
  credentials: true,
  origin: process.env.FRONTEND_URL
};

app.use(bodyParser.json({
  verify(req, res, buf) {
    req.rawBody = buf;
  }
}));

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

const fbWebhookAuth = (req, res, next) => {
  const hmac = crypto.createHmac("sha1", process.env.FACEBOOK_APP_SECRET);
  hmac.update(req.rawBody, "utf-8");
  if (req.headers["x-hub-signature"] === `sha1=${hmac.digest("hex")}`) next();
  else res.status(400).send("Invalid signature");
};

app.post("/webhook/facebook", fbWebhookAuth, async (req, res) => {
  if (req.body.object === "page") {
    req.body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && event.message.text) {
          // eslint-disable-next-line no-console
          processMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

app.get("/webhook/facebook", async (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      // eslint-disable-next-line no-console
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

const server = createServer();
server.applyMiddleware({ app, cors: corsOptions });

const port = process.env.PORT || 5000;

// Start server
// eslint-disable-next-line no-console
app.listen(port, () => console.log(`App listening on port ${port}!`));
