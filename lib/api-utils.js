
import { z, ZodError } from 'zod';

export function validate(schema) {
  return async (request) => {
    try {
      if (request.parsedBody) {
        schema.parse(request.parsedBody);
        return null;
      }

      const body = await request.json();
      schema.parse(body);
      request.parsedBody = body;
      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        const details = (error.issues || []).map(e => ({
          path: Array.isArray(e.path) ? e.path.join('.') : '',
          message: e.message || 'Invalid input',
        }));
        return new Response(JSON.stringify({ error: 'Invalid payload', details }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: error.message || 'Failed to parse body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

const ALLOWED_CATEGORIES = [
  'Road & Pavement', 'Water & Drainage', 'Sanitation', 'Electricity',
  'Parks & Trees', 'Traffic & Signals', 'Public Property', 'Other'
];

export const IssueCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(1).max(1000),
  category: z.enum(ALLOWED_CATEGORIES),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  photo: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const StatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  assignedTo: z.string().min(2).max(100).optional(),
  statusChangeReason: z.string().min(5).max(1000),
}).refine(d => d.status || d.assignedTo, { message: 'Provide status or assignedTo' });

export const CommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const FlagSchema = z.object({
  reason: z.string().min(3).max(300),
});

export const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(500).optional(),
});

export const PromoteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['citizen', 'municipality', 'admin']),
  wardNumber: z.number().int().min(1).optional().nullable(),
}).refine(
  d => d.role !== 'municipality' || (d.wardNumber != null && d.wardNumber >= 1),
  { message: 'wardNumber is required (and must be ≥ 1) when role is municipality', path: ['wardNumber'] }
);
