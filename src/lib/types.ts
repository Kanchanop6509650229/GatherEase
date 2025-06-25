export type DateAvailability = {
  date: Date;
  /** One or more time slots the participant is available on this date */
  times: string[];
};

export type ParticipantAvailability = {
  id: string;
  name: string;
  availabilities: DateAvailability[];
  /** Additional notes or dietary restrictions */
  notes?: string;
};

export type AvailabilityData = ParticipantAvailability[];
