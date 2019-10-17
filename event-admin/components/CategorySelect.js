import React from "react"
import PropTypes from "prop-types"

import { Control, Select } from "bloomer"

const CategorySelect = ({ value, onChange }) => {
  const categories = ["ACTIVITES", "COMEDY", "FAMILY", "FESTIVALS", "FOOD", "MUSEUMS", "MUSIC", "SPORTS", "THEATER", "VARIETY", "OTHER",]
  return (
    <Control>
      <Select value={value} onChange={onChange} name="category">
        {categories.map(category => (
          <option value={category} key={category}>{category}</option>
        ))}
      </Select>
    </Control>
  )
}

CategorySelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default CategorySelect