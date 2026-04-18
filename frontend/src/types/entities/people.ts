export interface Parent {
  id: number;
  name: string;
  code: string;
  gender: "male" | "female";
  email: string;
  phone: string;
  image: string;
  job_title: string;
}

export interface Student {
  id: number;
  name: string;
  code: string;
  gender: "male" | "female";
  dob: string;
  age: number;
  image: string;
  primary_parent?: never; // Students are independent in this model
}

export interface Child {
  id: string; // "child-1"
  name: string;
  code: string;
  gender: "male" | "female";
  dob: string;
  age: number;
  image: string;
  primary_parent: Parent;
}

// TODO(types): Unused entity type; reintroduce when an API uses it.
/*
// Union type for Enrollments/Attendance
export type Participant = Student | Child;
*/
