/**
 * Utility for generating and triggering browser downloads of CSV reports.
 */
export function downloadCsv(filename: string, rows: Record<string, string | number>[]): void {
  if (rows.length === 0) {
    const emptyBlob = new Blob(['No attendance logs recorded'], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(emptyBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return
  }

  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '').replace(/"/g, '""')
          return `"${val}"`
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
