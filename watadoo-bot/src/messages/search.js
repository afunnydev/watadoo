const { sendTextMessage, sendTemplate } = require("../utils/messenger");
const { generateCard } = require("../utils/search");
const { prisma } = require("../generated/prisma-client");

const sendAllEventsSeenMessage = async (id, polyglot) => {
  await sendTextMessage(id, {
    text: polyglot.t("Tu as déjà vu tous les événements pour cette recherche. Veux-tu faire une autre recherche?"),
    "quick_replies": [
      {
        "content_type": "text",
        "title": polyglot.t("Oui"),
        "payload": polyglot.t("Oui")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Non"),
        "payload": polyglot.t("Non")
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
        "payload": polyglot.t("Je veux m'inscrire")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Nouvelle recherche"),
        "payload": polyglot.t("Nouvelle recherche")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Partager Watadoo"),
        "payload": polyglot.t("Partager Watadoo")
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
        "payload": polyglot.t("Recherche plus large")
      },
      {
        "content_type": "text",
        "title": polyglot.t("Non"),
        "payload": polyglot.t("Annuler")
      },
    ]
  });
};

const sendNextOccurrences = async (user, polyglot, occurrences, extended = false) => {
  await sendTemplate(user.facebookid, {
    template_type: "generic",
    elements: occurrences.slice(0, 5).map(occ => generateCard(occ, user.id, polyglot))
  });
  if (occurrences.length > 5) {
    const quickReplies = [
      {
        "content_type": "text",
        "title": polyglot.t("Voir les suivants"),
        "payload": polyglot.t("suivant")
      },
    ];
    if (extended) {
      quickReplies.push({
        "content_type": "text",
        "title": polyglot.t("Nouvelle recherche"),
        "payload": polyglot.t("Nouvelle recherche")
      });
      quickReplies.push({
        "content_type": "text",
        "title": polyglot.t("Recevoir des alertes"),
        "payload": polyglot.t("Recevoir des alertes")
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
  let eventOccurrences = await prisma.eventOccurrences({
    where: {
      city: searchQuery.city,
      startDate_gte: searchQuery.startDate,
      startDate_lte: searchQuery.endDate
    },
    first: 20,
    orderBy: "priority_DESC"
  }).$fragment(occurrenceWithEventFragment);

  if (!eventOccurrences.length) {
    return await sendNothingFoundMessage(user.facebookid, polyglot);
  }

  // Remove occurrences with the same parent event id.
  eventOccurrences = eventOccurrences.filter((occ, index, self) =>
    index === self.findIndex((t) => (
      t.event.id === occ.event.id
    ))
  );

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

const moments = ["Aujourd'hui", "Demain", "En fin de semaine",];
exports.askWhenMessage = async (id, polyglot) => {
  await sendTextMessage(id, {
    "text": polyglot.t("Tu recherches quelque chose à faire à quel moment? Tu peux aussi écrire un autre moment que les choix ci-bas."),
    "quick_replies": moments.map(m => ({
      "content_type": "text",
      "title": polyglot.t(m),
      "payload": polyglot.t(m)
    }))
  });
};