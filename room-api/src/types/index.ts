export interface Room {
  id: number;
  room_id: string;
  name: string;
  participants: number;
  max_participants: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoomInput {
  name: string;
  max_participants?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}
