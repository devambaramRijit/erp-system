"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResponseSchema = exports.sessionUserSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userCreateSchema = exports.userSchema = exports.passwordSchema = exports.nameSchema = exports.emailSchema = exports.userIdSchema = exports.userRoleSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared User schemas for validation and typing across client and server
 */
exports.userRoleSchema = zod_1.z.enum(["ADMIN", "MANAGER", "STAFF", "VIEWER"]);
exports.userIdSchema = zod_1.z.string().uuid({ message: "Invalid user id" });
exports.emailSchema = zod_1.z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address" });
exports.nameSchema = zod_1.z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(120, { message: "Name is too long" });
exports.passwordSchema = zod_1.z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password is too long" });
const dateLike = zod_1.z.union([zod_1.z.date(), zod_1.z.string()]);
exports.userSchema = zod_1.z.object({
    id: exports.userIdSchema,
    email: exports.emailSchema,
    name: exports.nameSchema,
    role: exports.userRoleSchema,
    createdAt: dateLike,
    updatedAt: dateLike,
});
exports.userCreateSchema = zod_1.z.object({
    email: exports.emailSchema,
    name: exports.nameSchema,
    password: exports.passwordSchema,
    role: exports.userRoleSchema.default("VIEWER"),
});
exports.userLoginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
});
exports.userUpdateSchema = zod_1.z
    .object({
    email: exports.emailSchema.optional(),
    name: exports.nameSchema.optional(),
    role: exports.userRoleSchema.optional(),
    password: exports.passwordSchema.optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: ["_"],
});
exports.sessionUserSchema = exports.userSchema.pick({ id: true, email: true, name: true, role: true });
exports.authResponseSchema = zod_1.z.object({
    user: exports.sessionUserSchema,
    token: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
});
