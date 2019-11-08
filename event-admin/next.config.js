/* eslint-disable no-undef */
require("dotenv").config({ path: ".env.local" })
const withSass = require("@zeit/next-sass")
module.exports = withSass({
  env: {
    "REACT_APP_GEOCODE_KEY": process.env.REACT_APP_GEOCODE_KEY,
    "REACT_APP_GRAPHQL_ENDPOINT": process.env.REACT_APP_GRAPHQL_ENDPOINT
  }
})