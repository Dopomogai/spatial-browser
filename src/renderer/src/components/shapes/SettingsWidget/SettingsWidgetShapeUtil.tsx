/**
 * @purpose tldraw ShapeUtil for the settings widget.
 * @why Pre-migration tldraw remnant; superseded by xyflow nodeTypes.
 * @role node-type
 * @exports SettingsWidgetShapeUtil, SettingsWidgetShape
 * @uses tldraw, @tldraw/tlschema, SettingsWidgetComponent
 * @stability deprecated
 * @gotchas DEAD CODE from tldraw → xyflow migration. tldraw not in package.json (may or may not exist transiently in node_modules). Not referenced in live xyflow nodeTypes. Flagged for deletion in first cleanup task.
 */
import React from 'react'
import { BaseBoxShapeUtil } from 'tldraw'
import type { TLBaseShape } from '@tldraw/tlschema'
import { SettingsWidgetComponent } from './SettingsWidgetComponent'

export type SettingsWidgetShape = TLBaseShape<
  'SettingsWidget',
  {
    w: number
    h: number
  }
>

export class SettingsWidgetShapeUtil extends BaseBoxShapeUtil<SettingsWidgetShape> {
  static override type = 'SettingsWidget' as const

  override getDefaultProps(): SettingsWidgetShape['props'] {
    return {
      w: 480,
      h: 340,
    }
  }

  override component(shape: SettingsWidgetShape) {
    return <SettingsWidgetComponent shape={shape} />
  }

  override indicator(shape: SettingsWidgetShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
