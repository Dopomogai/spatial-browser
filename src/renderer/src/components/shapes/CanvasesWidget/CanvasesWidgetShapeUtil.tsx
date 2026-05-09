/**
 * @purpose tldraw ShapeUtil wrapper for the canvases widget.
 * @why Pre-migration tldraw remnant; superseded by xyflow nodeTypes.
 * @role node-type
 * @exports CanvasesWidgetShapeUtil, CanvasesWidgetShape
 * @uses tldraw, @tldraw/tlschema, CanvasesWidgetComponent
 * @stability deprecated
 * @gotchas DEAD CODE from tldraw → xyflow migration. tldraw not in package.json (may or may not exist transiently in node_modules). Not referenced in live xyflow nodeTypes. Flagged for deletion in first cleanup task.
 */
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
