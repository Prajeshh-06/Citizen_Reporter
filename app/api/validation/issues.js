const { z } = require('zod');

const IssueCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(1).max(1000),
  category: z.string().min(2).max(50),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  photo: z.string().optional(), 
  userId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

module.exports = { IssueCreateSchema };
