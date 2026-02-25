const { z } = require('zod');

const StatusSchema = z.object({
  status: z.enum(['open','in_progress','resolved']).optional(),
  assignedTo: z.string().min(2).max(100).optional(),
  statusChangeReason: z.string().min(5).max(1000),
}).refine(d => d.status || d.assignedTo, { message: 'Provide status or assignedTo' });

const CommentSchema = z.object({
  user: z.string().min(2).max(50),
  text: z.string().min(1).max(1000)
});

const FlagSchema = z.object({
  user: z.string().min(2).max(50),
  reason: z.string().min(3).max(300)
});

const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(500)
});

module.exports = { StatusSchema, CommentSchema, FlagSchema, FeedbackSchema };
