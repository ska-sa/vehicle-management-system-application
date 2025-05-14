export interface Trip {
  id: string;
  date: string;
  destination: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
}

export interface Inspection {
  id: string;
  type: 'Pre-trip' | 'Post-trip';
  date: string;
  signed: boolean;
}