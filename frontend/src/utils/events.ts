import type { EventDTO, RegistrationDTO } from '@/types/events';

/**
 * Calculate enrolled_count and waitlist_count for an event
 */
export function calcCounters(
  eventId: string,
  registrations: RegistrationDTO[]
): { enrolled_count: number; waitlist_count: number } {
  const eventRegs = registrations.filter(r => r.event_id === eventId);
  
  const enrolled_count = eventRegs.filter(r => r.status === 'ENROLLED').length;
  const waitlist_count = eventRegs.filter(r => r.status === 'WAITLIST').length;
  
  return { enrolled_count, waitlist_count };
}

/**
 * Check if an event meets the "only_open" criteria
 */
export function isOnlyOpen(
  event: EventDTO,
  counters: { enrolled_count: number; waitlist_count: number },
  nowUTC: string
): boolean {
  // rsvp_deadline must be null or in the future
  if (event.rsvp_deadline && event.rsvp_deadline <= nowUTC) {
    return false;
  }
  
  // Must have available spots
  if (counters.enrolled_count >= event.capacity_unit) {
    return false;
  }
  
  return true;
}


