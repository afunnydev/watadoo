import React from "react"
import PropTypes from "prop-types"

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
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-K4W8PDM"
        height="0" width="0" style={{ display: "none", visibility: "hidden"}}></iframe></noscript>
      <Meta />
      <Navigation />
      {props.children}
      <script> </script>
    </div>
  </ThemeProvider>
)

Page.propTypes = {
  children: PropTypes.object.isRequired
}

export default Page