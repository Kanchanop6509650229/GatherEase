export type DateAvailability = {
  date: Date;
  time: string;
};

export type ParticipantAvailability = {
  id: string;
  name: string;
  availabilities: DateAvailability[];
  /** Additional notes or dietary restrictions */
  notes?: string;
};

export type AvailabilityData = ParticipantAvailability[];
