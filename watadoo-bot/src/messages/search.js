const { sendTextMessage, sendTemplate } = require("../utils/messenger");
const { generateCard } = require("../utils/search");
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

const sendAllEventsSeenMessage = async (id, polyglot) => {
  await sendTextMessage(id, {
    text: polyglot.t("Tu as déjà vu tous les événements pour cette recherche. Veux-tu faire une autre recherche?"),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("Oui"),
        "payload": "oui"
      },
      {
        "content_type": "text",
        "title": polyglot.t("Non"),
        "payload": "non"
      },
    ]
  });
};
exports.sendAllEventsSeenMessage = sendAllEventsSeenMessage;

const sendSearchDoneMessage = async (id, polyglot) => {
  await sendTextMessage(id, {
    text: polyglot.t("search-completed"),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("Je veux m'inscrire"),
        "payload": "Je veux m'inscrire"
      },
      {
        "content_type": "text",
        "title": polyglot.t("Nouvelle recherche"),
        "payload": "Nouvelle recherche"
      },
      {
        "content_type": "text",
        "title": polyglot.t("Partager Watadoo"),
        "payload": "Partager Watadoo"
      },
    ]
  });
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

const sendNextOccurrences = async (user, polyglot, occurrences, extended = false) => {
  await sendTemplate(user.facebookid, {
    template_type: "generic",
    elements: occurrences.slice(0, 5).map(occ => generateCard(occ, user.id))
  });
  if (occurrences.length > 5) {
    const quickReplies = [
      {
        "content_type": "text",
        "title": polyglot.t("Voir les suivants"),
        "payload": "suivant"
      },
    ];
    if (extended) {
      quickReplies.push({
        "content_type": "text",
        "title": polyglot.t("Nouvelle recherche"),
        "payload": "Nouvelle recherche"
      });
      quickReplies.push({
        "content_type": "text",
        "title": polyglot.t("Recevoir des alertes"),
        "payload": "Recevoir des alertes"
      });
    }
    return await sendTextMessage(user.facebookid, {
      text: polyglot.t("more-events-in-search", occurrences.length - 5),
      "quick_replies": quickReplies
    });
  }
  return await sendSearchDoneMessage(user.facebookid, polyglot);
};
exports.sendNextOccurrences = sendNextOccurrences;

exports.makeNewSearch = async (user, polyglot, searchQuery) => {
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
    return await sendNothingFoundMessage(user.facebookid, polyglot);
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
  await prisma.updateSearch({
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

  await sendTextMessage(user.facebookid, {
    text: polyglot.t("found-events", eventOccurrences.length)
  });

  return await sendNextOccurrences(user, polyglot, eventOccurrences);
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