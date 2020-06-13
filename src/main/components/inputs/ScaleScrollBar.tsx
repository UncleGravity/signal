import React, { StatelessComponent, ReactNode, CSSProperties } from "react"
import { withSize } from "react-sizeme"
import Icon from "components/outputs/Icon"
import { ScrollBar, BAR_WIDTH, ScrollBarProps } from "./ScrollBar"
import { ISize } from "common/geometry"

import "./ScaleScrollBar.css"

interface ScaleButtonProps {
  style?: CSSProperties
  onClick?: () => void
}

const ScaleButton: StatelessComponent<ScaleButtonProps> = ({
  style,
  children,
  onClick,
}) => {
  return (
    <div className="ScaleButton" style={style} onClick={onClick}>
      {children}
    </div>
  )
}

type HorizontalScaleScrollBar_Props = Omit<
  ScrollBarProps,
  "isVertical" | "barLength" | "style"
> & {
  size: ISize
  onClickScaleDown?: () => void
  onClickScaleReset?: () => void
  onClickScaleUp?: () => void
}

const HorizontalScaleScrollBar_: StatelessComponent<HorizontalScaleScrollBar_Props> = (
  props
) => {
  const buttonSize = BAR_WIDTH
  const barLength = props.size.width - buttonSize * 3
  const buttonStyle = {
    width: buttonSize,
    height: buttonSize,
  }
  return (
    <ScrollBar isVertical={false} {...props} barLength={barLength}>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleDown}>
        <Icon>minus</Icon>
      </ScaleButton>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleReset}>
        <Icon>circle</Icon>
      </ScaleButton>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleUp}>
        <Icon>plus</Icon>
      </ScaleButton>
    </ScrollBar>
  )
}

export type HorizontalScaleScrollBarProps = Omit<
  HorizontalScaleScrollBar_Props,
  "size"
>

const areEqual = (
  props: HorizontalScaleScrollBar_Props,
  nextProps: HorizontalScaleScrollBar_Props
) =>
  props.scrollOffset === nextProps.scrollOffset &&
  props.contentLength === nextProps.contentLength &&
  props.onScroll === nextProps.onScroll &&
  props.size.width === nextProps.size.width &&
  props.size.height === nextProps.size.height &&
  props.onClickScaleDown === nextProps.onClickScaleDown &&
  props.onClickScaleReset === nextProps.onClickScaleReset &&
  props.onClickScaleUp === nextProps.onClickScaleUp

export const HorizontalScaleScrollBar = withSize({
  monitorWidth: true,
  monitorHeight: false,
  monitorPosition: false,
})(React.memo(HorizontalScaleScrollBar_, areEqual))
