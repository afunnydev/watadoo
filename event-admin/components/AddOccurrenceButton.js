import React from "react"
import PropTypes from "prop-types"
import { withApollo } from "react-apollo"
import { Button } from "bloomer"
import gql from "graphql-tag"

const ADD_OCCURRENCE_MUTATION = gql`
  mutation ADD_OCCURRENCE_MUTATION($eventId: ID!) {
    addOccurrence(eventId: $eventId) @client(always: true) {
      id
    }
  }
`

const AddOccurrenceButton = ({ eventId, client }) => {
  const addOccurrence = async () => {
    await client.mutate({
      mutation: ADD_OCCURRENCE_MUTATION,
      variables: { eventId }
    })
  }
  return (
    <Button
      isColor="info"
      onClick={async () => await addOccurrence()}
    >
      Add occurrence
    </Button>
  )
}

AddOccurrenceButton.propTypes = {
  eventId: PropTypes.string.isRequired,
  client: PropTypes.object.isRequired
}

export default withApollo(AddOccurrenceButton)
