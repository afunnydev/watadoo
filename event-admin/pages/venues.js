import React from "react"
import Link from "next/link"
import { Query } from "react-apollo"
import gql from "graphql-tag"

import { Section, Columns, Column, Level, LevelLeft, LevelRight } from "bloomer"

import SaveButton from "../components/styles/SaveButton"

const VENUES_QUERY = gql`
  query VENUES_QUERY {
    venues {
      id
      nameFr
      address
      city
    }
  }
`

const VenuesPage = () => (
  <Query
    query={VENUES_QUERY}
    fetchPolicy="network-only"
  >
    {({ data, loading, error }) => {
      if (error) return <p>Error</p>
      if (loading) return <p>Loading...</p>
      if (!data || !data.venues || !data.venues.length) return <p>No venues in here</p>
      return (
        <Section>
          <Level>
            <LevelLeft><h1>Venues</h1></LevelLeft>
            <LevelRight><SaveButton><Link href={{ pathname: "/venue/new" }}><a>Create new venue</a></Link></SaveButton></LevelRight>
          </Level>
          <Columns>
            <Column isSize={{ mobile: 6, tablet: 3 }}>ID</Column>
            <Column isSize={{ mobile: 6, tablet: 3 }}>Name</Column>
            <Column isSize={{ mobile: 6, tablet: 3 }}>Address</Column>
            <Column isSize={{ mobile: 6, tablet: 3 }}>City</Column>
          </Columns>
          {data.venues.map(venue => (
            <Columns key={venue.id}>
              <Column isSize={{ mobile: 6, tablet: 3 }}>
                <Link href={{ pathname: "/venue", query: { id: venue.id } }}>
                  <a>{venue.id}</a>
                </Link>
              </Column>
              <Column isSize={{ mobile: 6, tablet: 3 }}>
                <p>{venue.nameFr}</p>
              </Column>
              <Column isSize={{ mobile: 6, tablet: 3 }}>
                <p>{venue.address}</p>
              </Column>
              <Column isSize={{ mobile: 6, tablet: 3 }}>
                <p>{venue.city}</p>
              </Column>
            </Columns>
          ))}
        </Section>
      )
    }}
  </Query>
)

export default VenuesPage