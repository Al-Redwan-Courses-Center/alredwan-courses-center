import { Tag } from "./common";

export interface Instructor {
  id: number;
  name: string;
  // gender: "male" | "female";
  tags: Tag[];
  bio: string;
  image_url: string;
  type: string;
  type_display: string;
  joined_date: string;
}

export interface LandingPageInstructorDetail {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string;
  type: string;
  type_display: string;
  image_url: string | null;
  joined_date: string;
}

export interface LandingPageInstructor {
  id: number;
  order: number;
  created_at: string;
  instructor: LandingPageInstructorDetail;
}
