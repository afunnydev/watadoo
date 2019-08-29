import React from "react"

import { ThemeProvider } from "styled-components"
import Router from "next/router"
import NProgress from "nprogress"

import Meta from "./Meta"
import Navigation from "./Navigation"

Router.onRouteChangeStart = () => {
  NProgress.start()
}
Router.onRouteChangeComplete = () => {
  NProgress.done()
}
Router.onRouteChangeError = () => {
  NProgress.done()
}

const theme = {
  black: "rgba(0,4,9,.8)"
}

const Page = props => (
  <ThemeProvider theme={ theme }>
    <div>
      <Meta />
      <Navigation />
      {props.children}
      <script> </script>
    </div>
  </ThemeProvider>
)

export default Page