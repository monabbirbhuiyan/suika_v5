import * as z from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.email().min(1, "Email is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
  terms: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms and conditions"),
});

export const signInSchema = z.object({
  email: z.email().min(1, "Email is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;

// Profile Schema
export const profileSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.email("Invalid email address"),
  image: z.string().optional(),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const problemSpaceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export type ProblemSpaceFormValues = z.infer<typeof problemSpaceSchema>;

export const fragmentTypes = [
  "QUESTION",
  "IDEA",
  "OBSERVATION",
  "CONSTRAINS",
  "CONCLUSION",
] as const;

export const singleInstanceFragmentTypes = ["QUESTION"] as const;

export const fragmentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  nodeId: z.string().min(1, "Node is required"),
  type: z.enum(fragmentTypes, {
    message: "Type is required",
  }),
});

export type FragmentFormValues = z.infer<typeof fragmentSchema>;

export const createNodeSchema = z.object({
  title: z.string().min(1, "Node name is required"),
});

export type CreateNodeFormValues = z.infer<typeof createNodeSchema>;
