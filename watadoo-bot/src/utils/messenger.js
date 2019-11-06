const needle = require("needle");

exports.sendTextMessage = async (senderId, text) => {
  const data = {
    recipient: { id: senderId },
    message: text
  };
  const res = await needle(
    "post",
    `https://graph.facebook.com/v5.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
    data,
    { json: true }
  ).then(function ({ statusCode, body }) {
    if (statusCode === 200) { return body; }
  }).catch(function (err) {
    // eslint-disable-next-line no-console
    console.log(Error(err));
  });
  return res;
};

exports.sendTemplate = async (senderId, o) => {
  const data = {
    recipient: { id: senderId },
    message: {
      attachment: {
        type: "template",
        payload: o
      }
    }
  };
  const res = await needle(
    "post",
    `https://graph.facebook.com/v5.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
    data,
    { json: true }
  ).then(function ({ statusCode, body }) {
    console.log(body);
    if (statusCode === 200) { return body; }
  }).catch(function (err) {
    // eslint-disable-next-line no-console
    console.log(Error(err));
  });
  return res;
};

exports.conversationRead = async (senderId) => {
  const data = {
    recipient: { id: senderId },
    sender_action: "mark_seen"
  };
  const res = await needle(
    "post",
    `https://graph.facebook.com/v5.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
    data,
    { json: true }
  ).then(function ({ statusCode, body }) {
    if (statusCode === 200) { return body; }
  }).catch(function (err) {
    // eslint-disable-next-line no-console
    console.log(Error(err));
  });
  return res;
};

exports.conversationTyping = async (senderId) => {
  const data = {
    recipient: { id: senderId },
    sender_action: "typing_on"
  };
  const res = await needle(
    "post",
    `https://graph.facebook.com/v5.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
    data,
    { json: true }
  ).then(function ({ statusCode, body }) {
    if (statusCode === 200) { return body; }
  }).catch(function (err) {
    // eslint-disable-next-line no-console
    console.log(Error(err));
  });
  return res;
};
