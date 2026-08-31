/** Shared key helpers for cross-record reconciliation. */

export function invoiceKey(id?: string, number?: string): string {
  if (number) return `num:${number.toLowerCase()}`
  if (id) return `id:${id}`
  return ''
}

export function projectKey(id?: string, name?: string): string | undefined {
  if (id) return `id:${id}`
  if (name) return `name:${name.toLowerCase()}`
  return undefined
}

export function clientKey(id?: string, name?: string): string | undefined {
  if (id) return `id:${id}`
  if (name) return `name:${name.toLowerCase()}`
  return undefined
}

export function buildInvoiceKeySet(
  invoices: Array<{ data: { id?: string; number?: string } }>,
): Set<string> {
  const keys = new Set<string>()
  for (const inv of invoices) {
    const key = invoiceKey(inv.data.id, inv.data.number)
    if (key) keys.add(key)
    if (inv.data.id) keys.add(`id:${inv.data.id}`)
    if (inv.data.number) keys.add(`num:${inv.data.number.toLowerCase()}`)
  }
  return keys
}

export function buildProjectKeySet(
  projects: Array<{ data: { id?: string; name: string } }>,
): Set<string> {
  const keys = new Set<string>()
  for (const p of projects) {
    const key = projectKey(p.data.id, p.data.name)
    if (key) keys.add(key)
    if (p.data.id) keys.add(`id:${p.data.id}`)
    if (p.data.name) keys.add(`name:${p.data.name.toLowerCase()}`)
  }
  return keys
}

export function matchesInvoiceKey(
  keySet: Set<string>,
  id?: string,
  number?: string,
): boolean {
  const key = invoiceKey(id, number)
  if (key && keySet.has(key)) return true
  if (id && keySet.has(`id:${id}`)) return true
  if (number && keySet.has(`num:${number.toLowerCase()}`)) return true
  return false
}

export function matchesProjectKey(
  keySet: Set<string>,
  id?: string,
  name?: string,
): boolean {
  const key = projectKey(id, name)
  if (key && keySet.has(key)) return true
  if (id && keySet.has(`id:${id}`)) return true
  if (name && keySet.has(`name:${name.toLowerCase()}`)) return true
  return false
}

export function taskKey(id?: string, name?: string): string | undefined {
  if (id) return `id:${id}`
  if (name) return `name:${name.toLowerCase()}`
  return undefined
}

export function buildTaskKeySet(
  tasks: Array<{ data: { id?: string; name: string } }>,
): Set<string> {
  const keys = new Set<string>()
  for (const task of tasks) {
    const key = taskKey(task.data.id, task.data.name)
    if (key) keys.add(key)
    if (task.data.id) keys.add(`id:${task.data.id}`)
    if (task.data.name) keys.add(`name:${task.data.name.toLowerCase()}`)
  }
  return keys
}

export function matchesTaskKey(keySet: Set<string>, id?: string, name?: string): boolean {
  const key = taskKey(id, name)
  if (key && keySet.has(key)) return true
  if (id && keySet.has(`id:${id}`)) return true
  if (name && keySet.has(`name:${name.toLowerCase()}`)) return true
  return false
}
