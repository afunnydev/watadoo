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