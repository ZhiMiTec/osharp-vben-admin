import L from './lodopFuncs'
export default class lodopTable {

  static LineType = {
    text: 0,
    table: 1,
    centerText: 2,
    centerTable: 3
  }

  constructor () {
    this.currentLine = {}
    this.tableMap = []
    this.boxOption = { style: { lineHeight: '1.414', fontSize: '16px', borderColor: '#000' }, classList: '' }
  }

  setStyle (style) {
    this.boxOption.style = style
  }

  setClassList (list) {
    this.boxOption.classList = list
  }

  static getLodop () {
    return L.getLodop()
  }

  getHtml (inline) {
    let html = ''
    let i = 0
    this.tableMap.forEach(Line => {
      let lineEl = lodopTable.renderEl('', Line.style, Line.classList)
      lineEl.style.tableLayout = 'fixed'
      lineEl.class = 'table-line table-line-' + Line.style
      // Children Render
      Line.children.forEach(Cell => {
        let styleMap = { paddingLeft: '5px', paddingRight: '5px', ...Cell.style }
        if (Cell.ctx.indexOf('table-cell') >= 0) {
          styleMap = Cell.style
        }
        let cellEl = lodopTable.renderEl(Cell.ctx, styleMap, Cell.classList)
        Cell.class = 'table-cell'
        cellEl.style.width = Cell.width
        cellEl.style.wordBreak = 'break-all'
        cellEl.style.display = 'table-cell'
        lineEl.append(cellEl)
      })

      lineEl.style.display = 'inline-table'
      let hasBorder = !!([lodopTable.LineType.table, lodopTable.LineType.centerTable].indexOf(Line.type) >= 0);
      let hasCenter = !!([lodopTable.LineType.centerTable, lodopTable.LineType.centerText].indexOf(Line.type) >= 0);
      if (hasBorder) {
        lineEl.style.border = '1px solid'
        lineEl.style.borderTop = '0px'
        lineEl.style.borderColor = 'inherit'
      }
      let holdEl = lodopTable.genClearEl()
      holdEl.style.width = '0px'
      holdEl.style.borderColor = 'inherit'
      holdEl.style.display = 'table-cell'
      holdEl.style.color = 'transparent'
      holdEl.style.visibility = 'hidden'
      holdEl.innerHTML = '.'
      lineEl.append(holdEl)
      let ci = lineEl.children.length
      Array.from(lineEl.children).forEach(el => {
        let LineIndex = this.tableMap.indexOf(Line)
        if (hasBorder) {
          if (ci > 2) {
            el.style.borderRight = '1px solid'
          }
          el.style.borderColor = 'inherit'
          if (LineIndex && [lodopTable.LineType.table, lodopTable.LineType.centerTable].indexOf(this.tableMap[LineIndex - 1].type) >= 0 && !inline) {
            el.style.borderTop = '0px solid'
          } else {
            el.style.borderTop = '1px solid'
          }
          el.style.borderTopColor = 'inherit'
        }
        if (hasCenter) {
          el.style.textAlign = el.style.textAlign || 'center'
          if (ci > 1) {
            el.style.verticalAlign = 'middle'
          }
        }
        ci--;
      })
      html += lineEl.outerHTML
      i++;
    })
    let resultEl = lodopTable.renderEl(html, this.boxOption.style, this.boxOption.classList)
    if (inline) {
      resultEl.children.forEach( el => {
        el.style.border = '0px'
      })
      resultEl.children[0].children.forEach(el => {
        el.style.borderTop = '0px'
      })
    }
    return resultEl.outerHTML
  }

  static genClearEl () {
    let el = document.createElement('div')
    el.style.display = 'block'
    el.style.clear = 'both'
    el.style.width = '0px'
    el.style.height = '0px'
    return el
  }

  static renderEl (ctx = '', style = '', classList = '') {
    let el = document.createElement('div')
    el.innerHTML = ctx
    typeof style === 'string' && (el.style = style);
    typeof classList === 'string' && (el.classList = classList);
    if (typeof style === 'object') {
      for (let key in style) {
        el.style[key] = style[key]
      }
    }
    if (classList.constructor === Array) {
      classList.forEach(el.classList.push)
    }
    !el.style.width && (el.style.width = '100%')
    el.style.boxSizing = 'border-box'
    return el
  }

  lineStart (type = lodopTable.LineType.table, style = '', classList = '') {
    this.currentLine = { type, style, classList, children: [] }
    return this
  }

  data (width = '100%', ctx = '', style = '', classList = '') {
    this.currentLine.children.push({ width, ctx, style, classList })
    return this
  }

  lineEnd () {
    this.tableMap.push(this.currentLine)
    return this
  }

}
