import React from 'react'
import { BaseBoxShapeUtil } from 'tldraw'
import type { TLBaseShape } from '@tldraw/tlschema'
import { CanvasesWidgetComponent } from './CanvasesWidgetComponent'

export type CanvasesWidgetShape = TLBaseShape<
  'CanvasesWidget',
  {
    w: number
    h: number
  }
>

export class CanvasesWidgetShapeUtil extends BaseBoxShapeUtil<CanvasesWidgetShape> {
  static override type = 'CanvasesWidget' as const

  override getDefaultProps(): CanvasesWidgetShape['props'] {
    return {
      w: 360,
      h: 480,
    }
  }

  override component(shape: CanvasesWidgetShape) {
    return <CanvasesWidgetComponent shape={shape} />
  }

  override indicator(shape: CanvasesWidgetShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
