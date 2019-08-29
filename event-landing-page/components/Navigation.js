import React from "react"
import styled from "styled-components"

import { Navbar, NavbarBrand, NavbarItem, NavbarMenu, NavbarEnd } from "bloomer"

const StyledNavbar = styled(Navbar)`
  background: rgba(0,4,9,.8);
  padding: 20px;
`

const Navigation = () => (
  <StyledNavbar>
    <NavbarBrand>
      <NavbarItem>
        <img src="/static/logo-watadoo.png" />
      </NavbarItem>
    </NavbarBrand>
    <NavbarMenu isActive={false}>
      <NavbarEnd>
        <NavbarItem style={{ color: "white" }}>GATINEAU / OTTAWA</NavbarItem>
      </NavbarEnd>
    </NavbarMenu>
  </StyledNavbar>
)

export default Navigation