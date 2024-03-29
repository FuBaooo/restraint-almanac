import type { AlmanacResult } from './almanac'
import { SimpleDom } from './simpleDom'
import { calcTextWidth } from './calcTextWidth'

export interface DrawCardOptions {
  width?: number
  padding?: number
  fontSize?: number
  fontPadding?: number
  startX?: number
  startY?: number
  margin?: number
  border?: number
  radius?: number
  // TODO: dark mode
}

export interface DrawCardPosition {
  x: number
  y: number
}

export interface DrawCardTagRect extends DrawCardPosition {
  width: number
  height: number
  content: string
  length: number
}

export type DrawCardHalfDistrict = [DrawCardTagRect[], DrawCardTagRect[]]
export type DrawCardSvg = SimpleDom | null

export class DrawCard {
  options: Required<DrawCardOptions>
  svg: DrawCardSvg = null

  constructor(options: Partial<DrawCardOptions>) {
    // 合并配置
    const defaultOptions: DrawCardOptions = {
      width: 460,
      fontSize: 16,
      startX: 68,
      padding: 15,
      margin: 8,
      border: 1,
      fontPadding: 8,
      radius: 4,
    }
    this.options = this.merageOptions(defaultOptions, (options || {}))
  }

  merageOptions(defaultOptions: DrawCardOptions, options: DrawCardOptions): Required<DrawCardOptions> {
    const use = { ...defaultOptions, ...options } as Required<DrawCardOptions>
    use.startX = use.startX + use.margin
    use.startY = use.padding + use.margin
    use.width = (options.width || 0) < defaultOptions!.width! ? defaultOptions.width! : options.width!
    return use
  }

  /**
   * calculate all element location
   */
  calcAllPosition(data: AlmanacResult): DrawCardHalfDistrict {
    const { width, startX, startY, fontSize, padding, fontPadding } = this.options
    const halfDistrict: DrawCardHalfDistrict = [[], []]

    let [countWith, countHeight] = [startX + padding, startY]
    for (let i = 0; i < data.length; i++) {
      if (i === 1) {
        countWith = startX + padding
        countHeight += padding * 4
      }
      data[i].list.forEach((item) => {
        const text = `${item.emoji} ${item.name}`
        const textLength = this.calcEmojiTextLength(text)

        const rectWidth = textLength + fontPadding * 2
        const rectHeight = fontSize + fontPadding * 1.5

        if (rectWidth > width - countWith - padding) {
          countWith = startX + padding
          countHeight += rectHeight + padding
        }

        const rect: DrawCardTagRect = {
          x: countWith,
          y: countHeight,
          width: rectWidth,
          height: rectHeight,
          content: text,
          length: textLength,
        }
        halfDistrict[i].push(rect)

        countWith += rectWidth + padding
      })
    }
    return halfDistrict
  }

  draw(data: AlmanacResult) {
    const { width, margin, padding, startX, fontSize } = this.options
    const halfDistrict = this.calcAllPosition(data)
    const last = halfDistrict[1][halfDistrict[1].length - 1]
    const height = last.y + last.height + (padding / 2)

    const svgWidth = width + margin * 2
    const svgHeight = height + margin * 2
    this.svg = SimpleDom.createSvg({ width: svgWidth, height: svgHeight })
    this.createBorderRect({
      x: margin,
      y: margin,
      width,
      height,
    })

    for (let i = 0; i < halfDistrict.length; i++) {
      if (i === 1) {
        const y = halfDistrict[i][0].y - padding
        this.createLine(margin, y, width + margin, y)
      }

      halfDistrict[i].forEach(item => this.createTextRect(item))

      const districtLast = halfDistrict[i][halfDistrict[i].length - 1]
      const districtFirst = halfDistrict[i][0]
      this.createText({
        x: (startX / 2) - ((calcTextWidth(data[i].title) * fontSize * 1.25) / 2) + (margin / 2),
        y: districtFirst.y + (((districtLast.y + districtLast.height + padding) - districtFirst.y) / 2),
        fontSize: fontSize * 1.25,
        content: data[i].title,
      })
    }

    this.createLine(startX, margin, startX, height + margin)

    return this.svg?.toString()
  }

  /**
   * create rounded rectangular
   */
  createBorderRect({ x, y, height, width }: Omit<DrawCardTagRect, 'length' | 'content'>, g: DrawCardSvg = null) {
    const { radius } = this.options
    const target = g || this.svg
    target?.appendChild(new SimpleDom('rect', {
      fill: '#ffffff',
      stroke: '#e5e7eb',
      rx: radius,
      ry: radius,
      x,
      y,
      width,
      height,
    }))
  }

  /**
   * rounded rectangular containing text
   */
  createTextRect({ x, y, height, width, content, length }: DrawCardTagRect) {
    const { fontSize } = this.options
    const g = new SimpleDom('g')
    this.createBorderRect({ x, y, height, width }, g)

    this.createText({
      x: x + (width / 2) - length / 2,
      y: y + height - (fontSize / 2),
      fontSize,
      content,
    }, g)
    this.svg?.appendChild(g)
  }

  /**
   * create a line
   */
  createLine(x1: number, y1: number, x2: number, y2: number) {
    const line = new SimpleDom('line', {
      x1,
      y1,
      x2,
      y2,
      'stroke': '#e5e7eb',
      'stroke-width': 1,
    })
    this.svg?.appendChild(line)
  }

  /**
   * create text
   */
  createText({ x, y, fontSize, content }: {
    x: number
    y: number
    fontSize: number
    content: string
  }, g: DrawCardSvg = null) {
    const text = new SimpleDom('text', {
      'fill': '#000',
      'font-size': fontSize,
      'x': x,
      'y': y,
      'baseline-shift': 'baseline',
    })
    text.content = content
    const target = g || this.svg
    target?.appendChild(text)
  }

  /**
   * calculate the text length containing emoji
   */
  calcEmojiTextLength(content: string) {
    const { fontSize } = this.options
    const [, ...text] = content.split(' ')
    return (calcTextWidth(text.join(' ')) + 2) * fontSize
  }
}
