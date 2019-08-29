import React from "react"
import PropTypes from "prop-types"
import { Level, LevelLeft, LevelRight } from "bloomer"

import OccurrenceBox from "./OccurrenceBox"
import AddOccurrenceButton from "./AddOccurrenceButton"

const OccurrencesManager = ({ occurrences, eventId, occurrencesAreUnique }) => {
  return (
    <>
      <Level>
        <LevelLeft>Occurrences</LevelLeft>
        <LevelRight><AddOccurrenceButton eventId={eventId} /></LevelRight>
      </Level>
      {occurrences && occurrences.length
        ? occurrences.map(occurrence => !occurrence.toDelete && (
          <OccurrenceBox id={occurrence.id} full={occurrencesAreUnique} />
        ))
        : <p>Add your first occurrence for this event by clicking the &#34;+&#34; button.</p>
      }
    </>
  )
}

OccurrencesManager.propTypes = {
  occurrences: PropTypes.array.isRequired,
  eventId: PropTypes.string.isRequired,
  occurrencesAreUnique: PropTypes.bool.isRequired
}

export default OccurrencesManager
