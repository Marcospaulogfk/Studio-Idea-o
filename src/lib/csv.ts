/** Escapa um campo para CSV padrão RFC 4180. */
function escapeField(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : String(v)
  if (/[",\n;\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export interface CsvColumn<T> {
  header: string
  accessor: (row: T) => unknown
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map(c => escapeField(c.header)).join(';')
  const body = rows
    .map(r => columns.map(c => escapeField(c.accessor(r))).join(';'))
    .join('\n')
  return head + '\n' + body
}

/**
 * Dispara download de um CSV no browser. Usa BOM UTF-8 para Excel
 * abrir corretamente acentos.
 */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const csv = '﻿' + toCsv(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
