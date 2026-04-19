import { BaseBoxShapeUtil, HTMLContainer, T } from 'tldraw'
import { BrowserWidgetComponent } from './BrowserWidgetComponent'

export type IBrowserWidgetShapeProps = {
  w: number
  h: number
  widgetId: string
}

export class BrowserWidgetShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = 'browser_widget' as const
  
  // Modern TLDraw prop validation
  static override props = {
    w: T.number,
    h: T.number,
    widgetId: T.string
  }

  override getDefaultProps(): IBrowserWidgetShapeProps {
    return {
      w: 800,
      h: 600,
      widgetId: ''
    }
  }

  override component(shape: any) {
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: 'all'
        }}
      >
        <BrowserWidgetComponent shape={shape} />
      </HTMLContainer>
    )
  }

  override indicator(shape: any) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}