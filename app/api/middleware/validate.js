const { ZodError } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) return next();

    const errorsArray = Array.isArray(result.error?.errors) ? result.error.errors : [];

    const details = errorsArray.map(e => ({
      path: Array.isArray(e.path) ? e.path.join('.') : '',
      message: e.message || 'Invalid input'
    }));

    if (details.length === 0 && result.error) {
      return res.status(400).json({ error: 'Invalid payload', details: [result.error.message] });
    }

    return res.status(400).json({ error: 'Invalid payload', details });
  };
}

module.exports = { validate };
