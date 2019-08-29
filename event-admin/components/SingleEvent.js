import React, { useState } from "react"
import PropTypes from "prop-types"
import { Section } from "bloomer"
import { toast } from "react-toastify"

import UpdateEventButton from "./UpdateEventButton"
import EventGeneralInfo from "./EventGeneralInfo"
import Tabs from "./Tabs"
import EventOccurrences from "./EventOccurrences"

const SingleEvent = ({ id, name, hasVenue }) => {
  const [newVenueId, setNewVenueId,] = useState(null)
  const [activeTab, setActiveTab,] = useState(0)
  const changeTab = (index) => !hasVenue ? toast.error("Please select a venue and save it first.") : setActiveTab(index)
  return (
    <Section>
      <h1>{name} ({id})</h1>
      <Tabs
        tabs={["General Info", "Occurrence(s)",]}
        activeTab={activeTab}
        setActiveTab={changeTab}
      />
      {activeTab === 0
        ? <EventGeneralInfo
          eventId={id}
          setNewVenueId={setNewVenueId}
          newVenueId={newVenueId}
        />
        : <EventOccurrences eventId={id} />}
      <UpdateEventButton eventId={id} newVenueId={newVenueId} />
    </Section>
  )
}

SingleEvent.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  hasVenue: PropTypes.bool.isRequired
}

export default SingleEvent