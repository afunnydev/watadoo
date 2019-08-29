const relationOptions = [
  { title: "Célibataire", payload: "Célibataire" },
  { title: "En couple", payload: "Couple" },
  { title: "Marié(e)", payload: "Marié" },
  { title: "Autre", payload: "Autre" },
  { title: "Ne pas répondre", payload: "Autre" },
];

exports.askForRelationship = [
  {
    text: "Je vais avoir besoin de quelques informations pour compléter ton profil."
  },
  {
    text: "Tu peux toujours choisir l'option 'Ne pas répondre' si tu n'es pas à l'aise."
  },
  {
    text: "Quel est ton statut relationnel?",
    quick_replies: relationOptions.map(option => ({
      content_type: "text",
      title: option.title,
      payload: option.payload
    }))
  },
];

exports.askForAge = [
  {
    text: "Quel âge as-tu? Entre simplement des chiffres."
  },
  {
    text: "Si tu n'est pas à l'aise à me dire ton âge, entre '0'."
  },
];

const cities = [ "Gatineau", "Ottawa", "Montréal", "Québec", ];

exports.askForLocation = {
  text: "Pour commencer, dans quelle ville es-tu? Tu peux l'écrire si elle n'est pas dans les choix.",
  quick_replies: cities.map(city => ({
    content_type: "text",
    title: city,
    payload: city
  }))
};

