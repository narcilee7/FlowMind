/**
 * 画图适配器接口
 */


/**
 * 绘图工具类型
 */
export enum CanvasDrawingTool {
  // 选择工具
  SELECT = 'select',
  // 画笔工具
  PEN = 'pen',
  // 矩形工具
  RECTANGLE = 'rectangle',
  // 圆形工具
  CIRCLE = 'circle',
  // 直线工具
  LINE = 'line',
  // 文本工具
  TEXT = 'text',
  // 橡皮擦工具
  ERASER = 'eraser'
}

/**
 * 画布对象接口
 */
export interface CanvasObject {
  id: string
  type: CanvasObjectType
  data: any
  style: CanvasObjectStyle
  bounds: CanvasObjectBounds
  selected?: boolean
  visible?: boolean
}

/**
 * 画布对象类型:
 * - path: 路径
 * - rectangle: 矩形
 * - circle: 圆形
 * - line: 直线
 * - text: 文本
 */
export type CanvasObjectType = 'path' | 'rectangle' | 'circle' | 'line' | 'text'

/**
 * 画布对象样式
 */
export interface CanvasObjectStyle {
  stroke?: string
  fill?: string
  strokeWidth?: number
  fontSize?: number
  fontFamily?: string
}

/**
 * bounds
 */
export interface CanvasObjectBounds {
  x: number
  y: number
  width: number
  height: number
}