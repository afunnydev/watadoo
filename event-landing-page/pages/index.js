import React from "react"
import PropTypes from "prop-types"
import { Mutation } from "react-apollo"
import gql from "graphql-tag"

import SingleEvent from "../components/SingleEvent"
import { withPageRouter } from "../lib/withPageRouter"

const SAVE_SEEN_EVENT = gql`
  mutation SAVE_SEEN_EVENT($eventId: ID!, $userId: ID!) {
    saveSeenEvent(eventId: $eventId, userId: $userId) {
      id
    }
  }
`

const Event = ({ router }) => (
  <div>
    {router.query.id
      && <Mutation
        mutation={SAVE_SEEN_EVENT}
      >
        {(saveSeenEvent) => (
          <SingleEvent eventId={router.query.id} userId={router.query.user} saveSeenEvent={saveSeenEvent} />
        )}
      </Mutation>}
  </div>
)

Event.propTypes = {
  router: PropTypes.object.isRequired
}

export default withPageRouter(Event)