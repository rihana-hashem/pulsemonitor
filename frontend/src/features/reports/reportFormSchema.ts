import { z } from 'zod'

export type ReportPeriod = '24h' | '7d' | '30d' | 'custom'

/** The API's limit (RequestReportValidator). */
export const maxReportDays = 31
const dayMs = 24 * 60 * 60_000

const presetMs: Record<Exclude<ReportPeriod, 'custom'>, number> = {
  '24h': dayMs,
  '7d': 7 * dayMs,
  '30d': 30 * dayMs,
}

/** A Date as an <input type="datetime-local"> value, in the viewer's time zone. */
export function toLocalInput(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export const reportFormSchema = z
  .object({
    serverId: z.string().min(1, 'Choose a server.'),
    period: z.enum(['24h', '7d', '30d', 'custom']),
    // datetime-local values; only used for the custom period.
    from: z.string(),
    to: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.period !== 'custom') return
    const from = new Date(values.from).getTime()
    const to = new Date(values.to).getTime()

    if (Number.isNaN(from)) ctx.addIssue({ code: 'custom', path: ['from'], message: 'Enter a start date.' })
    if (Number.isNaN(to)) ctx.addIssue({ code: 'custom', path: ['to'], message: 'Enter an end date.' })
    if (Number.isNaN(from) || Number.isNaN(to)) return

    if (from >= to) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'Must be after the start.' })
    } else if (to - from > maxReportDays * dayMs) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: `A report can cover at most ${maxReportDays} days.` })
    }
  })

export type ReportFormValues = z.infer<typeof reportFormSchema>

/** The reported period in UTC. Presets end "now", at the moment the form is sent. */
export function toRange(values: ReportFormValues): { from: string; to: string } {
  if (values.period === 'custom') {
    return { from: new Date(values.from).toISOString(), to: new Date(values.to).toISOString() }
  }
  const to = new Date()
  return { from: new Date(to.getTime() - presetMs[values.period]).toISOString(), to: to.toISOString() }
}
