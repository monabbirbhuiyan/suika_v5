export type FragmentType =
  | "QUESTION"
  | "IDEA"
  | "OBSERVATION"
  | "CONSTRAINS"
  | "CONCLUSION";

export interface GraphNode {
  id: string;
  problem_space_id?: string;
  title: string;
  label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Fragment {
  id: string;
  nodeId: string;
  type: FragmentType;
  content: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProblemSpace {
  id: string;
  userId?: string;
  user_id?: string;
  title: string;
  description?: string;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  fragments?: Fragment[];
  graphNodes?: GraphNode[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}
