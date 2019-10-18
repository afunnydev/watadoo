import React from "react"
import PropTypes from "prop-types"

import { Control, Select } from "bloomer"

const CategorySelect = ({ value, onChange, all }) => {
  const categories = [
    { label: "Activities", value:"ACTIVITES" },
    { label: "Comedy", value: "COMEDY" },
    { label: "Family", value: "FAMILY" },
    { label: "Festivals/Events", value: "FESTIVALS" },
    { label: "Food", value: "FOOD" },
    { label: "Museums/Exhibitions", value: "MUSEUMS" },
    { label: "Music", value: "MUSIC" },
    { label: "Sports/Recreation", value: "SPORTS" },
    { label: "Theater/Performing Arts", value: "THEATER" },
    { label: "Variety", value: "VARIETY" },
    { label: "Other", value: "OTHER" },
    { label: "Unknown", value: "UNKNOWN" },
  ]
  if (all) {
    categories.unshift({ label: "All", value: ""})
  }
  return (
    <Control>
      <Select value={value} onChange={onChange} name="category">
        {categories.map(category => (
          <option value={category.value} key={category.value}>
            {category.label}
          </option>
        ))}
      </Select>
    </Control>
  )
}

CategorySelect.defaultValue = {
  all: false
}

CategorySelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  all: PropTypes.bool
}

export default CategorySelect