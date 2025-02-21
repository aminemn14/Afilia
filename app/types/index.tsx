export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  event_type: string;
  current_participants: number;
  max_participants: number;
  remaining_participants: number;
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
  event_type: 'theatre' | 'concert' | 'chorale' | 'exposition' | 'museum';
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

const TypesPage = () => {
  return <div>This page is not intended for display.</div>;
};

export default TypesPage;
