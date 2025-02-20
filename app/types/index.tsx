export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface SportGroup {
  id: string;
  name: string;
  sport_type: string;
  current_participants: number;
  required_participants: number;
  location_id: string;
  creator_id: string;
  created_at: string;
  status: 'open' | 'full' | 'in_progress' | 'completed';
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  zipcode: string;
  type: 'outdoor' | 'indoor';
  sport_type: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}
