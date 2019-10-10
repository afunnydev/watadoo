import React from "react"
import PropTypes from "prop-types"
import styled from "styled-components"
import moment from "moment"

import { Columns, Column } from "bloomer"

const ScheduleDiv = styled.div`
  margin: 20px 0;
  h4 {
    font-weight: 700;
  }
  div {

  }
`

const EventSchedule = ({ event }) => {
  if (!event.occurrences || !event.occurrences.length) return null
  moment.locale("fr-ca")
  // Normal Event
  if (!event.isRecurring && !event.occurrencesAreUnique) return (<ScheduleDiv>
    <p><strong>Date:</strong> {moment(event.occurrences[0].startDate).format("LLL")}</p>
  </ScheduleDiv>)
  // Events Serie
  if (!event.isRecurring && event.occurrencesAreUnique) return (<ScheduleDiv>
    {event.occurrences.map(o => (<Columns key={o.id} isMobile>
      <Column isSize={{ mobile: 6, default: 6 }}>{o.name}</Column>
      <Column isSize={{ mobile: 6, default: 6 }}>{moment(o.startDate).format("LLL")}</Column>
    </Columns>))}
  </ScheduleDiv>)
  // Recurring Event
  const schedule = []
  const pattern = JSON.parse(event.recurrencePattern)
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche",]

  Object.keys(pattern).forEach((key, index) => {
    if (pattern[key].frequency !== "never") {
      schedule.push({
        day: index,
        startDate: moment(pattern[key].nextStartDate).format("h:mm a"),
        endDate: moment(pattern[key].nextEndDate).format("h:mm a")
      })
    }
  })
  if (event.isRecurring) return (<ScheduleDiv>
    <h4>Horaire</h4>
    {schedule.map(d => (<Columns key={d.day} isMobile>
      <Column isSize={{ mobile: 4, default: 4 }}>{days[d.day]}</Column>
      <Column isSize={{ mobile: 8, default: 8 }}>{d.startDate} - {d.endDate}</Column>
    </Columns>))}
  </ScheduleDiv>)
  return <p>Il semble y avoir une erreur avec la date de cet événement.</p>
}

EventSchedule.propTypes = {
  event: PropTypes.object.isRequired
}

export default EventSchedule
