const needle = require("needle");

exports.getFacebookInformations = async (senderId) => {
  const fbUser = await needle(
    "get",
    `https://graph.facebook.com/${senderId}?fields=first_name,last_name,profile_pic,gender&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
    null,
    { json: true }
  ).then(function({statusCode, body}) {
    if (statusCode === 200) { return body; }
  }).catch(function(err) {
    // eslint-disable-next-line no-console
    console.log(Error(err));
  });
  return fbUser || {};
};