export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  dateOfBirth?: string;
  gender?: string;
  // Medical survey fields
  isDiabetic?: boolean;
  isHypertensive?: boolean;
  isSmoker?: boolean;
  smokingAmount?: string;
  smokingDuration?: string;
  height?: string;
  weight?: string;
  isPregnant?: boolean;
  isSexuallyActive?: boolean;
  sexualPartnerCount?: 'single' | 'multiple';
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
} 