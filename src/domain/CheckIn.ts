export interface CheckIn {
  id: string;
  createdAt: string;
  mood: 'stable' | 'hard' | 'craving';
  note: string;
}
