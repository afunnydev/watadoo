import React from "react"
import styled from "styled-components"
import Link from "next/link"

import { Navbar, NavbarBrand, NavbarItem, NavbarMenu, NavbarEnd } from "bloomer"

const StyledNavbar = styled(Navbar)`
  background: rgba(0,4,9,.8);
  padding: 20px;
`

const NavLink = styled.a`
  color: white;
  text-transform: uppercase;
  &:hover {
    color: white;
    text-decoration: underline;
  }
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
        <NavbarItem><Link href={{ pathname: "/events" }}><NavLink>Events</NavLink></Link></NavbarItem>
        <NavbarItem><Link href={{ pathname: "/venues" }}><NavLink>Venues</NavLink></Link></NavbarItem>
        <NavbarItem hasTextColor="light">ADMIN</NavbarItem>
      </NavbarEnd>
    </NavbarMenu>
  </StyledNavbar>
)

export default Navigation