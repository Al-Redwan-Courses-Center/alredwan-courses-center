// TODO(types): Unused entity type; reintroduce when an API uses it.
/*
export interface Season {
  id: number;
  name: string;
  type: string;
  description: string;
  is_active: boolean;
}
*/

export interface Tag {
  id: number;
  name: string;
  color?: string;
}
