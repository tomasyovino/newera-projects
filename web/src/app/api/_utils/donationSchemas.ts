import { donationSchema } from '@/lib/schemas';

export const donationCreateSchema = donationSchema.omit({
  id: true, createdAt: true, updatedAt: true
});

export const donationUpdateSchema = donationSchema.partial().omit({
  id: true, createdAt: true, updatedAt: true
});

