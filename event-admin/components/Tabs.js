import React from "react"
import PropTypes from "prop-types"

import { Tabs as BloomerTabs, Tab, TabList, TabLink } from "bloomer"

const Tabs = ({ tabs, activeTab, setActiveTab }) => (
  <BloomerTabs isAlign>
    <TabList>
      {tabs.map((tab, index) => (
        <Tab isActive={activeTab === index} key={tab}>
          <TabLink onClick={() => setActiveTab(index)}><span>{tab}</span></TabLink>
        </Tab>
      ))}
    </TabList>
  </BloomerTabs>
)

Tabs.propTypes = {
  tabs: PropTypes.array.isRequired,
  activeTab: PropTypes.number.isRequired,
  setActiveTab: PropTypes.func.isRequired
}

export default Tabs
