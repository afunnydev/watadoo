import React from "react"
import PropTypes from "prop-types"

import { ThemeProvider } from "styled-components"
import Router from "next/router"
import NProgress from "nprogress"

import { Container } from "bloomer"

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
  black: "rgba(0,4,9,.8)",
  orange: "#f98615"
}

const Page = props => (
  <ThemeProvider theme={ theme }>
    <div>
      <Meta />
      <Navigation />
      <Container>
        {props.children}
      </Container>
      <script> </script>
    </div>
  </ThemeProvider>
)

Page.propTypes = {
  children: PropTypes.array.isRequired
}

export default Page