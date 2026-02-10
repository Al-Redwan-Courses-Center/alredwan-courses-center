import { Session } from "next-auth";

export interface UserEntity {
  id: string;
  phone_number1: string;
  phone_number2: string | null;
  email: string | null;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  identity_number: string;
  identity_type: string;
  address: string | null;
  location: string | null;
  role: "admin" | "parent" | "instructor" | "student";
  is_verified: boolean;
  date_joined: string;
  jwt_access_token: string;
  jwt_refresh_token: string;
  exp: number;
  error?: string;
}

export type UserSession = (Session | null) & {
  user: UserEntity;
};

export interface LoginInputs {
  phone_number1: string;
  password: string;
}

export interface SignupInputs {
  phone_number1: string;
  password: string;
  re_password: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: "male" | "female";
  role: "parent" | "student";

  phone_number2?: string;
  email?: string;
  identity_number?: string;
  identity_type?: "nid" | "passport" | "other";
  address?: string;
  location?: string;
}
