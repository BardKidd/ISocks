import { z } from 'zod';

export const ItemSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  age: z.string().min(1, 'Age is required'),
  email: z.string().email('Invalid email'),
  remark: z.string().optional(),
});

export const FormSchema = z.object({
  items: z.array(ItemSchema).min(1, 'At least one item is required'),
});

export type FormSchemaType = z.infer<typeof FormSchema>;
