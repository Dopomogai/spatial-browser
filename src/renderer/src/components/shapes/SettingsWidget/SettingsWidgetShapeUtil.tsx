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
