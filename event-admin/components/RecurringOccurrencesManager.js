import React from "react"
import PropTypes from "prop-types"
import { withApollo } from "react-apollo"

import RecurringOccurrenceBox from "./RecurringOccurrenceBox"
import newRecurrencePattern from "../lib/newRecurrencePattern"

const RecurringOccurrencesManager = ({ recurrencePattern, eventId, client }) => {
  const recurrencePatternObject = recurrencePattern ? JSON.parse(recurrencePattern) : newRecurrencePattern()
  const updateStore = (key, childKey, value) => {
    let updatedPattern = Object.assign({}, recurrencePatternObject)
    updatedPattern[key][childKey] = value
    client.writeData(
      { id: `Event:${eventId}`, data: { recurrencePattern: JSON.stringify(updatedPattern), recurrencePatternChanged: true } }
    )
  }
  return (
    <div>
      <p>Recurrence Pattern</p>
      {Object.keys(recurrencePatternObject).map(key => (
        <RecurringOccurrenceBox
          key={key}
          day={key}
          pattern={recurrencePatternObject[key]}
          updateFn={updateStore}
        />
      ))}
    </div>
  )
}

RecurringOccurrencesManager.propTypes = {
  recurrencePattern: PropTypes.string,
  eventId: PropTypes.string.isRequired,
  client: PropTypes.object.isRequired
}

export default withApollo(RecurringOccurrencesManager)
