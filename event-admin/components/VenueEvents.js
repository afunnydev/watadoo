import React from "react"
import PropTypes from "prop-types"
import Link from "next/link"

import { Table } from "bloomer"

const VenueEvents = ({ events }) => (
  <Table isBordered isStriped isNarrow>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Next Occurrence</th>
      </tr>
    </thead>
    <tbody>
      {events.map(event => (
        <tr key={event.id}>
          <td><Link href={{ pathname: "/event", query: { id: event.id } }}><a target="_blank">{event.id}</a></Link></td>
          <td>{event.name}</td>
          <td>{event.nextOccurrenceDate}</td>
        </tr>
      ))}
    </tbody>
  </Table>
)

VenueEvents.propTypes = {
  events: PropTypes.array
}

export default VenueEvents