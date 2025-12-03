// Type definitions for Compassion Safe

export interface User {
  id: string;
  childNumber: string;
  password: string;
  fullName: string;
  profilePicture?: string;
  description: string;
  isActive: boolean;
  data: UserData;
}

export interface UserData {
  backgroundInformation: Record<string, any>;
  homeVisit: Record<string, any>;
  healthRecords: Record<string, any>;
  gifts: Record<string, any>;
  spiritualDevelopment: Record<string, any>;
  academicRecords: Record<string, any>;
  careerDream: Record<string, any>;
  commitmentForms: Record<string, any>;
}

export interface Admin {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'super-admin';
  fullName: string;
}

export interface DataField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'image' | 'video' | 'audio' | 'pdf' | 'docx';
  required: boolean;
  value?: any;
}

export interface Category {
  id: string;
  name: string;
  fields: DataField[];
}

export type LoginType = 'admin' | 'user';

export interface AuthState {
  isAuthenticated: boolean;
  userType: LoginType | null;
  user: User | Admin | null;
}