const { sendTextMessage } = require("../utils/messenger");
const { prisma } = require("../generated/prisma-client");

exports.searchDoneMessage = {
  text: "C'est tout pour ta recherche. Si tu as aimé l'expérience, n'hésite pas à t'inscrire pour recevoir des événements automatiquement.",
  "quick_replies":[
    {
      "content_type": "text",
      "title": "Je veux m'inscrire",
      "payload":"Je veux m'inscrire"
    },
    {
      "content_type": "text",
      "title": "Nouvelle recherche",
      "payload": "Nouvelle recherche"
    },
    {
      "content_type": "text",
      "title": "Partager Watadoo",
      "payload": "Partager Watadoo"
    },
  ]
};

exports.nothingFoundMessage = {
  text: "Je n'ai malheureusement pas trouvé d'événement pour toi. Surprenant, puisque nous avons plus de 20 000 événements dans la base de données. Veux-tu que je fasse une recherche un peu plus large?",
  "quick_replies":[
    {
      "content_type":"text",
      "title":"Oui",
      "payload":"Recherche plus large"
    },
    {
      "content_type":"text",
      "title":"Non",
      "payload":"Annuler"
    },
  ]
};

const sendNothingFoundMessage = async (id, polyglot) => {
  await sendTextMessage(id, {
    text: polyglot.t("no-event-found"),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("Oui"),
        "payload": "Recherche plus large"
      },
      {
        "content_type": "text",
        "title": polyglot.t("Non"),
        "payload": "Annuler"
      },
    ]
  });
};

exports.makeNewSearch = async (userId, polyglot, searchQuery) => {
  const occurrenceWithEventFragment = `
    fragment EventOccurenceWithEvent on EventOccurrence {
      id
      name
      description
      imageUrl
      event {
        id
      }
    }
  `;
  const eventOccurrences = await prisma.eventOccurrences({
    where: {
      city: searchQuery.city,
      startDate_gte: searchQuery.startDate,
      startDate_lte: searchQuery.endDate
    },
    first: 20
  }).$fragment(occurrenceWithEventFragment);

  if (!eventOccurrences.length) {
    return await sendNothingFoundMessage(userId, polyglot);
  }
  const searchWithUserFragment = `
    fragment SearchWithUser on Search {
      id
      suggested
      user {
        id
      }
    }
  `;
  const updatedSearchQuery = await prisma.updateSearch({
    data: {
      eventOccurrences: {
        connect: eventOccurrences.map(eventOccurrence => ({ id: eventOccurrence.id }))
      },
      suggested: 5
    },
    where: {
      id: searchQuery.id
    }
  }).$fragment(searchWithUserFragment);

  await sendTextMessage(userId, {
    text: polyglot.t("found-events", eventOccurrences.length)
  });

  // messages.push({
  //   "attachment": {
  //     "type": "template",
  //     "payload": {
  //       "template_type": "generic",
  //       "elements": eventOccurrences.slice(0, 5).map(eventOccurrence => generateCard(eventOccurrence, updatedSearchQuery.user.id))
  //     }
  //   }
  // });
  // if (eventOccurrences.length > 5) {
  //   messages.push({
  //     text: `Il me reste ${eventOccurrences.length - 5} autres événements à te montrer.`,
  //     "quick_replies": [
  //       {
  //         "content_type": "text",
  //         "title": "Voir les suivants",
  //         "payload": "suivant"
  //       },
  //     ]
  //   });
  // } else {
  //   messages.push(searchDoneMessage);
  // }
};

exports.momentMessage = {
  "text": "Tu recherches quelque chose à faire à quel moment? Tu peux aussi écrire un autre moment que les choix ci-bas.",
  "quick_replies":[
    {
      "content_type":"text",
      "title":"Aujourd'hui",
      "payload":"aujourd'hui"
    },
    {
      "content_type":"text",
      "title":"Demain",
      "payload":"demain"
    },
    {
      "content_type":"text",
      "title":"En fin de semaine",
      "payload":"en fin de semaine"
    },
  ]
};

const moments = ["Aujourd'hui", "Demain", "En fin de semaine",];
exports.askWhenMessage = async (id, polyglot) => {
  await sendTextMessage(id, {
    "text": polyglot.t("Tu recherches quelque chose à faire à quel moment? Tu peux aussi écrire un autre moment que les choix ci-bas."),
    "quick_replies": moments.map(m => ({
      "content_type": "text",
      "title": polyglot.t(m),
      "payload": m
    }))
  });
};