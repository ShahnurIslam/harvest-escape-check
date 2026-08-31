import { describe, it, expect } from 'vitest'
import {
  normaliseHeader,
  stripBom,
  parseNumber,
  parseBoolean,
  parseDate,
  parseCsvRows,
} from '../parsers/parser-utils'

describe('parser utils', () => {
  it('strips UTF-8 BOM', () => {
    expect(stripBom('\uFEFFDate,Hours')).toBe('Date,Hours')
  })

  it('normalises headers', () => {
    expect(normaliseHeader('  First Name  ')).toBe('first name')
    expect(normaliseHeader('Billable?')).toBe('billable?')
  })

  it('parses numbers with currency symbols', () => {
    expect(parseNumber('£1,234.56')).toBe(1234.56)
    expect(parseNumber('$500')).toBe(500)
  })

  it('parses booleans', () => {
    expect(parseBoolean('Yes')).toBe(true)
    expect(parseBoolean('No')).toBe(false)
  })

  it('parses ISO dates', () => {
    const result = parseDate('2024-03-15')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('2024-03-15')
  })

  it('parses slash dates', () => {
    const result = parseDate('15/03/2024')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('2024-15-03')
  })

  it('rejects invalid dates', () => {
    const result = parseDate('not-a-date')
    expect(result.valid).toBe(false)
  })

  it('skips empty rows in CSV', () => {
    const csv = 'Date,Hours\n2024-01-01,8\n,\n'
    const rows = parseCsvRows(csv)
    expect(rows.length).toBe(1)
  })

  it('handles BOM in CSV rows', () => {
    const csv = '\uFEFFDate,Hours\n2024-01-01,8'
    const rows = parseCsvRows(csv)
    expect(rows.length).toBe(1)
    expect(rows[0]['Date']).toBe('2024-01-01')
  })
})
