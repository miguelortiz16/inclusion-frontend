export interface CustomToolConfig {
  _id: string;
  name: string;
  description: string;
  category: string;
  fields: CustomField[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomField {
  id: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "date";
  label: string;
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: any;
  hidden?: boolean;
}

export interface CustomToolInstance {
  id: string;
  toolId: string;
  values: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
} 