export interface Circle {
  id: string;
  name: string;
  rules: string[];
  members: CircleMember[];
  templatePosts: string[];
}

export interface CircleMember {
  id: string;
  displayName: string;
  blocked: boolean;
}
