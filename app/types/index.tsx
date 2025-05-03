export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  password: string;
  role: 'user' | 'admin';
  age: number;
  sexe: 'homme' | 'femme';
  phoneNumber: string;
  birthDate: string;
  createdAt: string;
}

export interface Profile extends User {
  bio: string;
  avatar: string;
}

export interface Event {
  _id: string;
  id: string;
  name: string;
  event_type: string;
  current_participants: number;
  max_participants: number;
  remaining_participants: number;
  location_id: string;
  created_at: string;
  status: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  is_free: boolean;
  organizer: string;
  tel: string;
  email: string;
  description: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
}

export interface Location {
  _id: string;
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  address: string;
  city: string;
  zipcode: string;
  event_types: ('théâtre' | 'concert' | 'chorale' | 'exposition' | 'museum')[];
  image_url: string;
  description: string;
  tel: string;
  email: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  friend: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: string;
  updatedAt: string;
  unread: boolean;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isFriend: boolean;
  invitationPending: boolean;
  invitationReceived: boolean;
  invitationReceivedId: string | null;
  isBlocked: boolean;
  isBlockedBy: boolean;
}

export interface FriendItemProps {
  item: Friend;
  isFriend: boolean;
  isBlockedBy: boolean;
  onInviteSent: (id: string) => void;
  onAcceptReceived: (
    friend: Friend,
    invitationReceivedId: string | null
  ) => Promise<void>;
  index: number;
}

export interface Invitation {
  _id: string;
  senderId: User;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface MessageType {
  id: string;
  text: string;
  sender: 'me' | 'friend';
  createdAt: Date;
}

const TypesPage = () => {
  return <div>This page is not intended for display.</div>;
};

export default TypesPage;
