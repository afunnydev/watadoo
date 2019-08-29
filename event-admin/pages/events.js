import React, { useState } from "react"
import Link from "next/link"
import { Section, Columns, Column, Level, LevelLeft, LevelRight } from "bloomer"

import Tabs from "../components/Tabs"
import SaveButton from "../components/styles/SaveButton"
import ListEvents from "../components/ListEvents"

const EventsPage = () => {
  const [activeTab, setActiveTab,] = useState(0)
  return (
    <Section>
      <Level>
        <LevelLeft><h1>Events</h1></LevelLeft>
        <LevelRight><SaveButton><Link href={{ pathname: "/event/new" }}><a>Create new event</a></Link></SaveButton></LevelRight>
      </Level>
      <Tabs
        tabs={["Events", "Without occurrence",]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <Columns>
        <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>ID</Column>
        <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>Name</Column>
        <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>Next Occurrence</Column>
        <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>Source</Column>
      </Columns>
      {activeTab === 0
        ? <ListEvents />
        : <ListEvents withoutOccurrence />
      }
    </Section>
  )
}

export default EventsPage