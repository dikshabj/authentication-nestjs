// src/auth/types/auth-response.type.ts
export type AuthResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
  };
};