export type ParticipantAvailability = {
  id: string;
  name: string;
  dates: Date[];
  time?: string;
};

export type AvailabilityData = ParticipantAvailability[];
