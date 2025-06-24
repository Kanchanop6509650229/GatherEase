export type DateAvailability = {
  date: Date;
  time: string;
};

export type ParticipantAvailability = {
  id: string;
  name: string;
  availabilities: DateAvailability[];
};

export type AvailabilityData = ParticipantAvailability[];
