import React, { useState } from "react"
import Link from "next/link"
import { Section, Columns, Column, Level, LevelLeft, LevelRight } from "bloomer"

import Tabs from "../components/Tabs"
import SaveButton from "../components/styles/SaveButton"
import ListEvents from "../components/ListEvents"
import ListEventsFilters from "../components/ListEventsFilters"

const now = new Date()
const EventsPage = () => {
  const [activeTab, setActiveTab,] = useState(0)
  const [category, setCategory,] = useState("")
  const coming = {
    occurrences_some: {
      startDate_gte: now.toISOString()
    }
  }
  const withoutOccurrence = {
    occurrences_none: {
      id_not: null
    }
  }
  const withNotes = {
    OR: [
      { possibleDuplicate: true },
      { importNotes_gt: "" },
      { category: "UNKNOWN" },
      { venue: { id: "ck1v91n8a2wei0729alfoa5nc" } },
    ]
  }
  return (
    <Section>
      <Level>
        <LevelLeft><h1>Events</h1></LevelLeft>
        <LevelRight><SaveButton><Link href={{ pathname: "/event/new" }}><a>Create new event</a></Link></SaveButton></LevelRight>
      </Level>
      <ListEventsFilters value={category} setCategory={setCategory} />
      <Tabs
        tabs={["Coming", "To check", "Without occurrence",]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <Columns>
        <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>Name</Column>
        <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>Next Occurrence</Column>
        <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>Source</Column>
        <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>Category</Column>
      </Columns>
      {activeTab === 0 && <ListEvents category={category} where={coming} />}
      {activeTab === 1 && <ListEvents
        category={category}
        where={withNotes}
        orderBy="createdAt_ASC"/>}
      {activeTab === 2 && <ListEvents
        category={category}
        where={withoutOccurrence}
        orderBy="createdAt_ASC"/>}
    </Section>
  )
}

export default EventsPage