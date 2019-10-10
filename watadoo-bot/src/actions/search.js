const { Payload } = require("dialogflow-fulfillment");
const { prisma } = require("../generated/prisma-client");

const { capitalize } = require("../utils/other");
const { findEventMoment, generateCard } = require("../utils/search");

const { nothingFoundMessage, searchDoneMessage, momentMessage } = require("../messages/search");

const makeNewSearch = async searchQuery => {
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

  let messages = [];

  if (!eventOccurrences.length) {
    messages.push(nothingFoundMessage);
  } else {
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
          connect: eventOccurrences.map(eventOccurrence => ({ id: eventOccurrence.id}))
        },
        suggested: 5
      },
      where: {
        id: searchQuery.id
      }
    }).$fragment(searchWithUserFragment);

    messages.push({
      text: `J'ai trouvé ${eventOccurrences.length} événement${eventOccurrences.length > 1 ? "s" : ""} pour toi. Tu peux cliquer sur l'événement pour en savoir plus. ⬇️`
    });
    messages.push({
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": eventOccurrences.slice(0,5).map(eventOccurrence => generateCard(eventOccurrence, updatedSearchQuery.user.id))
        }
      }
    });
    if (eventOccurrences.length > 5) {
      messages.push({
        text: `Il me reste ${eventOccurrences.length - 5} autres événements à te montrer.`,
        "quick_replies":[
          {
            "content_type": "text",
            "title": "Voir les suivants",
            "payload":"suivant"
          },
        ]
      });
    } else {
      messages.push(searchDoneMessage);
    }
  }
  return messages;
};

exports.search = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  let user = {};

  try {
    user = await prisma.user({ facebookid: senderId });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    user = await prisma.user({ facebookid: senderId });
  }

  if (user === {}) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  const now = new Date();

  // Every searches are count as interaction. It will affect if the user gets a notification or no.
  await prisma.updateUser({ data: { lastInteraction: now.toISOString() }, where: { id: user.id }});

  let messages = [];

  const { date, timePeriod, datePeriod, datePeriodString } = agent.parameters;
  if (!date && !timePeriod && !datePeriod) {
    messages.push(
      {
        text: "Je n'ai pas compris ces dates."
      }
    );
    messages.push(momentMessage);
  } else {
    const eventMoment = findEventMoment(date, timePeriod, datePeriod, datePeriodString);
    let query = {};
    try {
      query = await prisma.createSearch({
        city: user.city,
        startDate: eventMoment.start.toISOString(),
        endDate: eventMoment.end.toISOString(),
        user: {
          connect: {
            facebookid: senderId
          }
        }
      });
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log(e);
      return agent.add("Une erreur s'est produite. Je suis vraiment désolé ...😅 Peux-tu recommencer ta recherche SVP?");
    }
    messages.push(
      {
        text: `Parfait! Donc, si j'ai bien compris, je cherche des événements à ${capitalize(user.city)} qui se dérouleront ${eventMoment.string}?`,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Oui",
            "payload":"oui"
          },
          {
            "content_type":"text",
            "title":"Non",
            "payload":"non"
          },
        ]
      }
    );
    agent.context.set({
      name: "search-followup",
      lifespan: 5,
      parameters: { "queryId": query.id }
    });
  }

  const payload = new Payload(agent.FACEBOOK, messages);
  return agent.add(payload);
};

exports.searchYes = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  const searchContext = agent.context.get("search-followup");
  const { queryId } = searchContext.parameters;

  if (!queryId) {
    return agent.add("Une erreur s'est produite. Je suis vraiment désolé ...😅 Peux-tu recommencer ta recherche SVP?");
  }

  const searchQuery = await prisma.search({ id: queryId });

  const messages = await makeNewSearch(searchQuery);

  const payload = new Payload(agent.FACEBOOK, messages);
  return agent.add(payload);
};

exports.searchInterest = async agent => {
  return agent.add("C'est bon à savoir, merci!");
};

exports.searchNext = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  const searchContext = agent.context.get("search-followup");
  const { queryId } = searchContext.parameters;

  if (!queryId) {
    return agent.add("Une erreur s'est produite. Je suis vraiment désolé ...😅 Peux-tu recommencer ta recherche SVP?");
  }

  const fragment = `
    fragment SearchWithEventsAndUser on Search {
      id
      suggested
      eventOccurrences {
        id
        name
        description
        imageUrl
        event {
          id
        }
      }
      user {
        id
      }
    }
  `;

  const searchQuery = await prisma.search({ id: queryId }).$fragment(fragment);

  let messages = [];

  if (searchQuery.eventOccurrences.length < searchQuery.suggested) {
    messages.push(
      {
        text: "Tu as déjà vu tous les événements pour cette recherche. Veux-tu faire une autre recherche?",
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Oui",
            "payload":"oui"
          },
          {
            "content_type":"text",
            "title":"Non",
            "payload":"non"
          },
        ]
      }
    );
  } else {
    const totalSuggested = searchQuery.suggested + 5;
    await prisma.updateSearch({
      data: {
        suggested: totalSuggested
      },
      where: {
        id: searchQuery.id
      }
    });
    messages.push({
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": searchQuery.eventOccurrences.slice(searchQuery.suggested, totalSuggested).map(eventOccurrence => generateCard(eventOccurrence, searchQuery.user.id))
        }
      }
    });
    // When there's 3 or more pages of eventOccurrences, we give more options than juste see the next ones.
    if (searchQuery.eventOccurrences.length > totalSuggested) {
      messages.push({
        text: `Il me reste ${searchQuery.eventOccurrences.length - totalSuggested} autres événements à te montrer.`,
        "quick_replies":[
          {
            "content_type": "text",
            "title": "Voir les suivants",
            "payload":"suivant"
          },
          {
            "content_type": "text",
            "title": "Nouvelle recherche",
            "payload":"Nouvelle recherche"
          },
          {
            "content_type": "text",
            "title": "Recevoir des alertes",
            "payload":"Recevoir des alertes"
          },
        ]
      });
    } else {
      messages.push(searchDoneMessage);
    }
  }

  const payload = new Payload(agent.FACEBOOK, messages);
  return agent.add(payload);
};

exports.searchCancel = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  const searchContext = agent.context.get("search-followup");
  const { queryId } = searchContext.parameters;

  if (!queryId) {
    return agent.add("Une erreur s'est produite. Je suis vraiment désolé ...😅 Tu peux dire 'Nouvelle recherche' pour recommencer.");
  }

  try {
    await prisma.deleteSearch({ id: queryId });
  } catch(e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return agent.add("Une erreur s'est produite. Je suis vraiment désolé ...😅 Tu peux dire 'Nouvelle recherche' pour recommencer.");
  }

  return agent.add("J'ai annulé cette recherche. Tu peux faire une nouvelle recherche en me disant 'Nouvelle recherche'.");
};

exports.searchLarge = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  const searchContext = agent.context.get("search-followup");
  const { queryId } = searchContext.parameters;

  if (!queryId) {
    return agent.add("Une erreur s'est produite. Je suis vraiment désolé ...😅 Peux-tu recommencer ta recherche SVP?");
  }

  const now = new Date();
  const in14Days = new Date(now.getTime() + 12096e5);

  const searchQuery = await prisma.updateSearch({
    data: {
      startDate: now.toISOString(),
      endDate: in14Days.toISOString()
    },
    where: {
      id: queryId
    }
  });

  let messages = await makeNewSearch(searchQuery);

  messages.unshift({
    text: "Voici les événements que j'ai durant les 2 prochaines semaines."
  });

  const payload = new Payload(agent.FACEBOOK, messages);
  return agent.add(payload);
};

exports.searchNoCity = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  const { city } = agent.parameters;
  const searchContext = agent.context.get("search-followup");
  const { queryId } = searchContext.parameters;

  if (!queryId) {
    return agent.add("Une erreur s'est produite. Je suis vraiment désolé ...😅 Peux-tu recommencer ta recherche SVP?");
  }
  // This needs to be checked because these are our cities in the enum. TODO: Shouldn't be checked manually...
  if (city === "Gatineau" || city === "Ottawa" || city === "Montréal" || city === "Québec" || city === "gatineau" || city === "ottawa" || city === "Montreal" || city === "montreal" || city === "Quebec" || city === "quebec" ) {
    const searchQuery = await prisma.updateSearch({
      data: {
        // In the enum, we use MONTREAL and QUEBEC, without special character.
        city: city.replace("é", "e").toUpperCase()
      },
      where: {
        id: queryId
      }
    });

    let messages = await makeNewSearch(searchQuery);

    messages.unshift({
      text: `Parfait, j'ai ajusté la ville de ta recherche pour ${city}.`
    });

    const payload = new Payload(agent.FACEBOOK, messages);
    return agent.add(payload);
  }

  await prisma.createRequestedCity({ city, user: { connect: { facebookid: senderId }} });

  agent.add(`Malheureusement, je n'offre pas d'événement à ${city} encore.`);
  agent.add("Veux-tu que je t'avertisse quand ce sera le cas?");
  agent.context.delete("Search-followup");
  agent.context.delete("Search-no-followup");
  return agent.context.set({
    name: "CityNotAvailable-followup",
    lifespan: 2,
    parameters: {
      city: city
    }
  });
};

exports.searchNoDate = async agent => {
  const senderId = agent.parameters.facebook_sender_id || agent.originalRequest.payload.data.sender.id;
  if (!senderId) {
    return agent.add("Je ne suis pas capable de vous identifer. Réessayez plus tard 😅");
  }

  const { date, timePeriod, datePeriod, datePeriodString } = agent.parameters;
  const searchContext = agent.context.get("search-followup");
  const { queryId } = searchContext.parameters;

  if (!queryId) {
    return agent.add("Une erreur s'est produite. Je suis vraiment désolé ...😅 Peux-tu recommencer ta recherche SVP?");
  }

  if (!date && !timePeriod && !datePeriod) {
    return agent.add("Je n'ai pas compris ces dates.");
  }

  const eventMoment = findEventMoment(date, timePeriod, datePeriod, datePeriodString);
  const searchQuery = await prisma.updateSearch({
    data: {
      startDate: eventMoment.start.toISOString(),
      endDate: eventMoment.end.toISOString()
    },
    where: {
      id: queryId
    }
  });

  let messages = await makeNewSearch(searchQuery);

  messages.unshift({
    text: `Parfait, j'ai ajusté le moment de ta recherche pour ${eventMoment.string}.`
  });

  const payload = new Payload(agent.FACEBOOK, messages);
  return agent.add(payload);
};
