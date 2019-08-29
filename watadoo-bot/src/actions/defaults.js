const { Payload } = require("dialogflow-fulfillment");
const { prisma } = require("../generated/prisma-client");

const { getFacebookInformations } = require("../utils/profile");

const { askForRelationship, askForAge, askForLocation } = require("../messages/profile");
const { momentMessage } = require("../messages/search");

exports.welcome = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) { return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅"); }

  const user = await prisma.user({ facebookid: senderId });

  if (!user) {
    const fbUser = await getFacebookInformations(senderId);
    const now = new Date();
    await prisma.createUser({
      facebookid: senderId,
      fname: fbUser ? fbUser.first_name : "",
      picture: fbUser ? fbUser.profile_pic : "",
      sex: fbUser.gender ? fbUser.gender.toUpperCase() : "OTHER",
      lastInteraction: now.toISOString()
    });

    const payload = new Payload(agent.FACEBOOK, [
      {
        text: "Salut! Je m'appelle Watadoo. Je suis là pour t'aider à trouver des sorties, des événements ou des activités."
      },
      askForLocation,
    ]);
    return agent.add(payload);
  }

  // The same intent is used to welcome AND to start a new search. Adjust the first message accordingly.

  let messages = agent.intent === "New Search" ? [] : [
    {
      text: `Salut${user.fname ? ` ${user.fname}` : ""} ! J'espère que tu vas bien.`
    },
  ];

  if (!user.city) {

    messages.push(askForLocation);

  } else if (!user.relationship) {

    askForRelationship.map(message => messages.push(message));
    agent.context.set({"name": "relationship", "lifespan": 2});

  } else if (typeof user.age !== "number") {

    askForAge.map(message => messages.push(message));
    agent.context.set({"name": "age", "lifespan": 2});

  } else {
    messages.push(momentMessage);
  }

  const payload = new Payload(agent.FACEBOOK, messages);
  return agent.add(payload);
};

exports.localisation = async (agent) => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) { return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅"); }

  const { city } = agent.parameters;

  if (city === "Gatineau" || city === "Ottawa" || city === "Montréal" || city === "Québec" || city === "gatineau" || city === "ottawa" || city === "Montreal" || city === "montreal" || city === "Quebec" || city === "quebec" ) {
    // In the enum, we use MONTREAL and QUEBEC, without special character.
    const user = await prisma.updateUser({ data: { city: city.replace("é", "e").toUpperCase() }, where: { facebookid: senderId }});

    let messages = [
      {
        text: `Justement, je connais plusieurs événements qui se passent à ${city}!`
      },
    ];

    if (!user.relationship) {

      askForRelationship.map(message => messages.push(message));
      agent.context.set({"name": "relationship", "lifespan": 2});

    } else if (!user.age) {

      askForAge.map(message => messages.push(message));
      agent.context.set({"name": "age", "lifespan": 2});

    } else {
      messages.push(momentMessage);
    }

    const payload = new Payload(agent.FACEBOOK, messages);
    return agent.add(payload);
  } else {
    await prisma.createRequestedCity({ city, user: { connect: { facebookid: senderId }} });

    agent.add(`Malheureusement, nous n'offrons pas d'événement à ${city} encore.`);
    agent.add("Veux-tu que je t'avertisse quand ce sera le cas?");
    return agent.context.set({
      name: "CityNotAvailable-followup",
      lifespan: 2,
      parameters: {
        city: city
      }
    });
  }
};

exports.share = async (agent) => {
  const payload = new Payload(agent.FACEBOOK, [
    {
      text: "Tu peux partager l'expérience avec un.e ami.e en cliquant sur le bouton ci-dessous 👇"
    },
    {
      text: "À bientôt 😎"
    },
    {
      "attachment": {
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements":[
            {
              "title": "Watadoo",
              "subtitle": "Ne manque plus jamais un événement qui se déroule près de chez toi.",
              "image_url": "https://watadoo.ca/wp-content/uploads/2019/03/watadoo-icon.jpg",
              "buttons": [
                {
                  "type": "element_share",
                  "share_contents": {
                    "attachment": {
                      "type": "template",
                      "payload": {
                        "template_type": "generic",
                        "elements": [
                          {
                            "title": "Watadoo",
                            "subtitle": "Ne manque plus jamais un événement qui se déroule près de chez toi.",
                            "image_url": "https://watadoo.ca/wp-content/uploads/2019/03/watadoo-icon.jpg",
                            "default_action": {
                              "type": "web_url",
                              "url": "https://m.me/watadoo.ca"
                            },
                            "buttons": [
                              {
                                "type": "web_url",
                                "url": "https://m.me/watadoo.ca",
                                "title": "Essayer Watadoo"
                              },
                            ]
                          },
                        ]
                      }
                    }
                  }
                },
              ]
            },
          ]
        }
      }
    },
  ]);
  return agent.add(payload);
};
