import React from "react"
import PropTypes from "prop-types"
import { withApollo } from "react-apollo"
import { Button } from "bloomer"
import gql from "graphql-tag"

const REMOVE_OCCURRENCE_MUTATION = gql`
  mutation REMOVE_OCCURRENCE_MUTATION($occurrenceId: ID!) {
    removeOccurrence(occurrenceId: $occurrenceId) @client(always: true) {
      id
    }
  }
`

const RemoveOccurrenceButton = ({ occurrenceId, client }) => {
  const removeOccurrence = async () => {
    await client.mutate({
      mutation: REMOVE_OCCURRENCE_MUTATION,
      variables: { occurrenceId }
    })
  }
  return (
    <Button
      isColor="danger"
      onClick={async () => await removeOccurrence()}
    >
      Delete
    </Button>
  )
}

RemoveOccurrenceButton.propTypes = {
  eventId: PropTypes.string.isRequired,
  occurrenceId: PropTypes.string.isRequired,
  client: PropTypes.object.isRequired
}

export default withApollo(RemoveOccurrenceButton)
