import React from "react"
import Head from "next/head"

import "../src/styles/style.scss"

const Meta = () => (
  <Head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="googlebot" content="noindex,nofollow" />
    <meta charSet="utf-8" />
    <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png" />
    <link rel="manifest" href="/static/site.webmanifest" />
    <meta name="msapplication-TileColor" content="#ffffff" />
    <meta name="theme-color" content="#ffffff" />
    <link href="https://fonts.googleapis.com/css?family=Raleway:400,400i,700,900" rel="stylesheet" />
    <title>Watadoo</title>
  </Head>
)

export default Meta