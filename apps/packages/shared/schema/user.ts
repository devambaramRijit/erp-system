import { z } from "zod";

/**
 * Shared User schemas for validation and typing across client and server
 */

export const userRoleSchema = z.enum(["ADMIN", "MANAGER", "STAFF", "VIEWER"]);

export const userIdSchema = z.string().uuid({ message: "Invalid user id" });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address" });

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name cannot be empty" })
  .max(120, { message: "Name is too long" });

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(128, { message: "Password is too long" });

const dateLike = z.union([z.date(), z.string()]);

export const userSchema = z.object({
  id: userIdSchema,
  email: emailSchema,
  name: nameSchema,
  role: userRoleSchema,
  createdAt: dateLike,
  updatedAt: dateLike,
});

export const userCreateSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  role: userRoleSchema.default("VIEWER"),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const userUpdateSchema = z
  .object({
    email: emailSchema.optional(),
    name: nameSchema.optional(),
    role: userRoleSchema.optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: ["_"],
  });

export const sessionUserSchema = userSchema.pick({ id: true, email: true, name: true, role: true });

export const authResponseSchema = z.object({
  user: sessionUserSchema,
  token: z.string().optional(),
  message: z.string().optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
