import React from "react"

import App, { Container } from "next/app"
import { ApolloProvider } from "react-apollo"
import { ToastContainer, toast } from "react-toastify"

import Page from "../components/Page"
import withData from "../lib/withData"

class MyApp extends App {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {}
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }
    // this exposes the query to the user
    pageProps.query = ctx.query
    return { pageProps }
  }
  render() {
    const { Component, apollo, pageProps } = this.props

    return (
      <Container>
        <ApolloProvider client={apollo}>
          <Page>
            <Component {...pageProps} />
            <ToastContainer
              autoClose={5000}
              hideProgressBar={true}
              position={toast.POSITION.BOTTOM_LEFT}
              pauseOnFocusLoss={false}
            />
          </Page>
        </ApolloProvider>
      </Container>
    )
  }
}

export default withData(MyApp)