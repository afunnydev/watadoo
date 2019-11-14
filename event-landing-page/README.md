# Event Landing Page

The Event Landing Page is built using React.js and Next.js. This interface is only used by people coming from the bot, looking for more information. 

## Setup

1) Install dependencies

```
npm install
```

2) Setup your environment variables (optionnal).

```
cp .env .env.local
nano .env.local

# in the .env.local file
# Change the bot backend URL if needed. It should be on 5000.
REACT_APP_GRAPHQL_ENDPOINT="http://localhost:4000/graphql"
```

3) Start the Next server

```
npm run dev
```

4) Start the bot server (needs to be setup at first)

```
cd ../watadoo-bot
npm run dev
```

## Data layer

This projects uses [Apollo GraphQL](https://www.apollographql.com/docs/) with React Apollo to interact with the backend. The Apollo client is defined in ```lib/withData.js```. Some interesting thing to note:

## Project Architecture

All pages are in the ```pages``` folder. The routing is done directly by next.

All components are in the ```components``` folder. I admit that the components nomenclature is pretty messy, and that they are not all really reusable. Sorry for that, please refactor if needed :)

## Exceptions

See ```event-admin``` for exception about routing.

This project uses the bot backend as its GraphQL endpoint, which can feel weird. Actually, it is weird. At first, the bot's backend made a lot more than it does actually, but I migrated most of this to the Management Backend (in Golang). Anyway, this small part is still in the bot backend and I don't think it's worth it to migrate it for now.

The bot backend really just serves the event query, and saves it to the database when someone click's an event.

## Commands

Please refer to the package.json and the [Next.js documentation](https://nextjs.org/docs) to understand the commands we are using. It is probably a lot better explained over there vs what I can do here 😅.
