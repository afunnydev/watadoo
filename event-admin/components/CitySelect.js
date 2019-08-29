import React from "react"
import PropTypes from "prop-types"

import { Control, Select } from "bloomer"

const CitySelect = ({ value, onChange }) => {
  const cities = ["GATINEAU", "OTTAWA", "MONTREAL", "QUEBEC", "TORONTO",]
  return (
    <Control>
      <Select value={value} onChange={onChange} name="city">
        {cities.map(city => (
          <option value={city} key={city}>{city}</option>
        ))}
      </Select>
    </Control>
  )
}

CitySelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default CitySelect