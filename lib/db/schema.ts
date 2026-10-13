import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  barberId: text('barber_id').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  serviceId: text('service_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert

/**
 * Availability blocks for a barber on a date.
 * - startTime/endTime null → whole day unavailable
 * - both set → only that interval is blocked
 */
export const availabilityBlocks = pgTable('availability_blocks', {
  id: text('id').primaryKey(),
  barberId: text('barber_id').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type AvailabilityBlock = typeof availabilityBlocks.$inferSelect
export type NewAvailabilityBlock = typeof availabilityBlocks.$inferInsert
