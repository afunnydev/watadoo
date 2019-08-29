import styled, { css } from "styled-components"

import { Button } from "bloomer"

const SaveButton = styled(Button)`
  background-color: ${props => props.theme.orange};
  color: ${props => props.theme.black};
  padding-right: 50px;
  padding-left: 50px;
  border-color: ${props => props.theme.orange} !important;
  ${props => props.floating && css`
    position: fixed;
    bottom: 20px;
    right: 30px;
  `}
`

export default SaveButton