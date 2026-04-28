import { PDFDocument } from 'pdf-lib'
import { readFile } from 'node:fs/promises'

const path = process.argv[2]
if (!path) {
  console.error('usage: node scripts/inspect-pdf.mjs <path-to-pdf>')
  process.exit(1)
}

const bytes = await readFile(path)
const pdf = await PDFDocument.load(bytes)
const form = pdf.getForm()

const out = {}
for (const f of form.getFields()) {
  const name = f.getName()
  const type = f.constructor.name
  let value
  if (type === 'PDFTextField') value = f.getText() ?? ''
  else if (type === 'PDFCheckBox') value = f.isChecked()
  else if (type === 'PDFRadioGroup') value = f.getSelected()
  else value = `<${type}>`
  out[name] = value
}

const ordered = Object.keys(out).sort().reduce((acc, k) => { acc[k] = out[k]; return acc }, {})
console.log(JSON.stringify(ordered, null, 2))
