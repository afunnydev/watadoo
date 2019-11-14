# Event Manager Admin

The Event Manager Admin is built using React.js and Next.js. This interface is not consumer facing, and is only made for our people to manage events in the bot easily.

## Setup

1) Install dependencies

```
npm install
```

2) Get a Google Maps API Key and setup your environment variables.

The API Key needs access to the Geocoding API.

```
cp .env .env.local
nano .env.local

# in the .env.local file
# Change the API Key value for yours
REACT_APP_GRAPHQL_ENDPOINT="http://localhost:8080/query"
REACT_APP_GEOCODE_KEY="TheSecretKeyGoesHere"
```

3) Start the Next server

```
npm run dev
```

4) Start the backend server (needs to be setup at first)

```
cd ../watadoo-backend
go run ./cmd/server
```

## Data layer

This projects uses [Apollo GraphQL](https://www.apollographql.com/docs/) with React Apollo to interact with the backend. The Apollo client is defined in ```lib/withData.js```. Some interesting thing to note:

- The server's schema is extended with local fields, local queries and local mutations.
- You can reuse fragments in ```lib/fragments.js````

## Project Architecture

All pages are in the ```pages``` folder. The routing is done directly by next.

All components are in the ```components``` folder. There's a specific folder for components useful only for styling. I admit that the components nomenclature is pretty messy, and that they are not all really reusable. Sorry for that, please refactor if needed :)

## Exceptions

Usually, a project using Next will be deployed using ```next start```, so the routing is handled directly by the next server. However, in our case, it is deployed on Netlify, which means it must be static. That's why we're deploying from the ```out``` folder using the ```next export``` command.

However, in the process, the routing is a little bit messed up on page load, and can reach for the queries in the URL. I wrote a little helper to access the URL queries in ```lib/withPageRouter.js``` that you can use if you need to access a URL parameter in ```router.query```.

## Commands

Please refer to the package.json and the [Next.js documentation](https://nextjs.org/docs) to understand the commands we are using. It is probably a lot better explained over there vs what I can do here 😅.
