import { newSchema } from "@/lib/schemas";

export const newCreateSchema = newSchema.omit({
    id: true, createdAt: true, updatedAt: true
});

export const newUpdateSchema = newSchema.partial().omit({
    id: true, createdAt: true, updatedAt: true
});