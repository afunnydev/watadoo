import React, { useState } from "react"
import Link from "next/link"

import {
  Section,
  Columns,
  Column,
  Level,
  LevelLeft,
  LevelRight
} from "bloomer"

import SaveButton from "../components/styles/SaveButton"
import ListVenues from "../components/ListVenues"
import ListVenuesFilters from "../components/ListVenuesFilters"

const VenuesPage = () => {
  const [possibleDuplicate, setPossibleDuplicate,] = useState(false)
  const [city, setCity,] = useState("")
  const toggleDuplicates = () => {
    setPossibleDuplicate(!possibleDuplicate)
  }
  return (
    <Section>
      <Level>
        <LevelLeft><h1>Venues</h1></LevelLeft>
        <LevelRight><SaveButton><Link href={{ pathname: "/venue/new" }}><a>Create new venue</a></Link></SaveButton></LevelRight>
      </Level>
      <ListVenuesFilters
        toggleDuplicates={toggleDuplicates}
        setCity={setCity} />
      <Columns>
        <Column isSize={{ mobile: 6, tablet: 3 }}><strong>ID</strong></Column>
        <Column isSize={{ mobile: 6, tablet: 3 }}><strong>Name</strong></Column>
        <Column isSize={{ mobile: 6, tablet: 3 }}><strong>Address</strong></Column>
        <Column isSize={{ mobile: 6, tablet: 3 }}><strong>City</strong></Column>
      </Columns>
      <ListVenues
        possibleDuplicate={possibleDuplicate}
        city={city} />
    </Section>
  )
}

export default VenuesPage