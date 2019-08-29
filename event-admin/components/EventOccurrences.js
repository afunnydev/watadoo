import React from "react"
import PropTypes from "prop-types"
import { Query, withApollo } from "react-apollo"
import gql from "graphql-tag"
import { Container, Columns, Column, Field, Control, Checkbox } from "bloomer"

import { occurrenceFragment } from "../lib/fragments"
import RecurringOccurrencesManager from "./RecurringOccurrencesManager"
import OccurrencesManager from "./OccurrencesManager"

const EVENT_OCCURRENCES_INFO_QUERY = gql`
  query EVENT_OCCURRENCES_INFO_QUERY($id: ID!) {
    event(id: $id) @client {
      occurrencesAreUnique
      isRecurring
      recurrencePattern
      occurrences {
        ...OccurrenceInfo
      }
    }
  }
  ${occurrenceFragment}
`

const EventOccurrences = ({ eventId, client }) => {
  const changeCheckedValue = (e) => client.writeData(
    { id: `Event:${eventId}`, data: { [e.target.name]: e.target.checked } }
  )
  return (
    <Query
      query={EVENT_OCCURRENCES_INFO_QUERY}
      variables={{ id: eventId }}
    >
      {({ data, loading, error }) => {
        if (error) return <p>Error</p>
        if (loading) return <p>Loading...</p>
        if (!data || !data.event) return <p>Error</p>
        const {
          occurrencesAreUnique,
          isRecurring,
          recurrencePattern,
          occurrences
        } = data.event
        return (
          <Container>
            <Columns isMultiline>
              <Column isSize={{ mobile: 12, tablet: 6 }}>
                <Field>
                  <Control hasTextAlign="centered">
                    <Checkbox name="isRecurring" checked={isRecurring} onChange={changeCheckedValue}> This is a recurring event.</Checkbox>
                  </Control>
                </Field>
              </Column>
              <Column isSize={{ mobile: 12, tablet: 6 }}>
                <Field>
                  <Control hasTextAlign="centered">
                    <Checkbox name="occurrencesAreUnique" checked={occurrencesAreUnique} onChange={changeCheckedValue}> The occurrences are all different (ex: festival, conference)</Checkbox>
                  </Control>
                </Field>
              </Column>
              <Column isSize={{ mobile: 12 }}>
                {isRecurring
                  ? <RecurringOccurrencesManager recurrencePattern={recurrencePattern} eventId={eventId} />
                  : <OccurrencesManager
                    occurrences={occurrences || []}
                    eventId={eventId}
                    occurrencesAreUnique={occurrencesAreUnique}
                  />}
              </Column>
            </Columns>
          </Container>
        )
      }}
    </Query>
  )
}

EventOccurrences.propTypes = {
  eventId: PropTypes.string.isRequired,
  client: PropTypes.object.isRequired
}

export default withApollo(EventOccurrences)
export { EVENT_OCCURRENCES_INFO_QUERY }
