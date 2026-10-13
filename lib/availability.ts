import {
  SLOT_DAY_END_MINUTES,
  SLOT_DAY_START_MINUTES,
  TIME_RE,
  intervalsOverlap,
  timeToMinutes,
} from '@/lib/booking'

export type AvailabilityBlockLike = {
  startTime: string | null
  endTime: string | null
}

export function isFullDayBlock(block: AvailabilityBlockLike): boolean {
  return block.startTime == null && block.endTime == null
}

export function isValidBlockRange(startTime: string | null, endTime: string | null): boolean {
  if (startTime == null && endTime == null) return true
  if (startTime == null || endTime == null) return false
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return false
  return timeToMinutes(startTime) < timeToMinutes(endTime)
}

/** Slot [start, start+duration) overlaps a block interval (or full-day block). */
export function slotOverlapsBlocks(
  startTime: string,
  durationMinutes: number,
  blocks: AvailabilityBlockLike[],
): boolean {
  if (blocks.some(isFullDayBlock)) return true

  const start = timeToMinutes(startTime)
  const end = start + durationMinutes

  return blocks.some((block) => {
    if (!block.startTime || !block.endTime) return false
    const bStart = timeToMinutes(block.startTime)
    const bEnd = timeToMinutes(block.endTime)
    return intervalsOverlap(start, end, bStart, bEnd)
  })
}

/** True if every working minute of the day is covered by blocks. */
export function isDayFullyBlocked(blocks: AvailabilityBlockLike[]): boolean {
  if (blocks.length === 0) return false
  if (blocks.some(isFullDayBlock)) return true

  const ranges = blocks
    .filter((b): b is { startTime: string; endTime: string } => Boolean(b.startTime && b.endTime))
    .map((b) => ({
      start: Math.max(timeToMinutes(b.startTime), SLOT_DAY_START_MINUTES),
      end: Math.min(timeToMinutes(b.endTime), SLOT_DAY_END_MINUTES + 1),
    }))
    .filter((r) => r.start < r.end)
    .sort((a, b) => a.start - b.start)

  if (ranges.length === 0) return false

  let coveredUntil = SLOT_DAY_START_MINUTES
  for (const r of ranges) {
    if (r.start > coveredUntil) return false
    coveredUntil = Math.max(coveredUntil, r.end)
  }
  return coveredUntil > SLOT_DAY_END_MINUTES
}

/** Convert blocks into busy-like intervals for slot rendering. */
export function blocksToBusyIntervals(blocks: AvailabilityBlockLike[]): {
  startTime: string
  durationMinutes: number
}[] {
  const dayStart = SLOT_DAY_START_MINUTES
  const dayEnd = SLOT_DAY_END_MINUTES
  const dayDuration = dayEnd - dayStart + 1

  return blocks.flatMap((block) => {
    if (isFullDayBlock(block)) {
      return [
        {
          startTime: `${String(Math.floor(dayStart / 60)).padStart(2, '0')}:${String(dayStart % 60).padStart(2, '0')}`,
          durationMinutes: dayDuration,
        },
      ]
    }
    if (!block.startTime || !block.endTime) return []
    const start = timeToMinutes(block.startTime)
    const end = timeToMinutes(block.endTime)
    return [
      {
        startTime: block.startTime,
        durationMinutes: Math.max(1, end - start),
      },
    ]
  })
}

export function blocksOverlap(
  a: AvailabilityBlockLike,
  b: AvailabilityBlockLike,
): boolean {
  if (isFullDayBlock(a) || isFullDayBlock(b)) return true
  if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return false
  return intervalsOverlap(
    timeToMinutes(a.startTime),
    timeToMinutes(a.endTime),
    timeToMinutes(b.startTime),
    timeToMinutes(b.endTime),
  )
}
