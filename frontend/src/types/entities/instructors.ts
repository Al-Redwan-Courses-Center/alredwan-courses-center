import { Tag } from "./common";

export interface Instructor {
  id: number;
  name: string;
  tags: Tag[];
  bio: string;
  image_url: string;
  type: "supervisor" | "normal";
  type_display: string;
  joined_date: string;
}

export interface InstructorDetail extends Instructor {
  email: string | null;
  phone: string | null;
  average_rating: number | null;
  rating_count: number;
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
