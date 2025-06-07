export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  dateOfBirth?: string;
  gender?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
} 