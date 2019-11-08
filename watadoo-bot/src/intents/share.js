const Polyglot = require("node-polyglot");
const { messages } = require("../locales");
const { sendTextMessage, sendTemplate } = require("../utils/messenger");

const shareImage = process.env.FACEBOOK_SHARE_IMG || "492785011314608";

module.exports = async (user) => {
  const polyglot = new Polyglot();
  polyglot.extend(messages[user.language.toLowerCase()]);

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("share-text")
  });
  // You can get the attachment_id by hitting this endpoint (https://developers.facebook.com/docs/messenger-platform/reference/attachment-upload-api) with the access page token and using https://watadoo.ca/wp-content/uploads/2019/11/watadoo-share-img-2.jpg
  // The share button has been deprecated on Oct 29th 2019, I followed this article for a new way to do this: https://intercom.help/viral-loops/en/articles/3304813-the-messenger-share-button-change-and-how-do-deal-with-it
  return await sendTemplate(user.facebookid, {
    "template_type": "media",
    "sharable": true,
    "elements": [
      {
        "media_type": "image",
        "attachment_id": shareImage,
        "buttons": [
          {
            "type": "web_url",
            "url": "https://m.me/watadoo.ca",
            "title": "Essayer Watadoo"
          },
        ]
      },
    ]
  });
};