require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const pino = require('pino');
const pinoHttp = require('pino-http');
const { MongoClient, ObjectId } = require('mongodb');
const { validate } = require('./middleware/validate');
const { IssueCreateSchema } = require('./validation/issues');
const { StatusSchema, CommentSchema, FlagSchema, FeedbackSchema } = require('./validation/extra');
const rateLimit = require('express-rate-limit');
const { locateWard } = require('./locator');
const multer = require('multer');
const exif = require('exif-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();
const authenticateUser = require('./middleware/authenticate');
const googleAuthRouter = require('./googleAuth');

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.get('/api/wards', (req, res) => {
  const geojsonPath = path.join(process.cwd(), 'data', 'gcc-divisions-latest.geojson');
  res.sendFile(geojsonPath);
});

app.use(helmet());
app.use(express.json());
app.use('/auth/google', googleAuthRouter);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Backend running locally on port ${PORT}`));
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});
app.use(pinoHttp({
  logger,
  customLogLevel: function (res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  }
}));

const API_KEY = process.env.API_KEY;
function requireApiKey(req, res, next) {
  if (!API_KEY) return res.status(500).json({ error: 'Server not configured: API_KEY missing' });
  const key = req.header('x-api-key');
  if (!key || key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/jpg','image/heic','image/heif'].includes(file.mimetype);
    cb(null, ok);
  }
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

const createIssueLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  handler: (req, res) => res.status(429).json({ error: 'Too many issue submissions, try later' })
});

const upvoteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  handler: (req, res) => res.status(429).json({ error: 'Too many upvotes from this IP, try later' })
});

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Smart Civic Reporter API',
      version: '1.0.0',
      description: 'Endpoints for issues, votes, status, comments, flags, feedback, search, and analytics'
    },
    servers: [{ url: 'http://localhost:' + (process.env.PORT || 8080) }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' }
      }
    },
    security: [{ ApiKeyAuth: [] }]
  },
  apis: [path.join(__dirname, 'index.js')]
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/docs.json', (req, res) => {
  res.type('application/json').send(swaggerSpec);
});

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

async function connectToMongo() {
  if (!app.locals.db) {
    try {
      const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 10000 });
      const db = client.db(dbName);
      app.locals.db = db;

      db.collection('issues').createIndex({ createdAt: -1 }).catch(() => {});
      db.collection('issues').createIndex({ status: 1 }).catch(() => {});
      db.collection('issues').createIndex({ wardNumber: 1 }).catch(() => {});
      db.collection('issues').createIndex({ upvotes: -1 }).catch(() => {});

      logger.info('Connected to MongoDB Atlas');
    } catch (err) {
      logger.error({ err }, 'Failed to connect to MongoDB');
      throw err;
    }
  }
}

app.use(async (req, res, next) => {
  try {
    await connectToMongo();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/api/issues', async (req, res) => {
  const db = req.app.locals.db;
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const wardSlug = req.query.ward;
  if (!wardSlug) {
    return res.status(400).json({ error: 'Ward query parameter required' });
  }

  const wardName = wardSlug.replace(/-/g, ' ');

  try {
    const issues = await db.collection('issues')
      .find({ wardName: new RegExp(`^${wardName}$`, 'i') })
      .sort({ createdAt: -1 })
      .toArray();

  res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/', (req, res) => res.send('Smart Civic Reporter backend is running!'));

app.get('/geo/divisions', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'gcc-divisions-latest.geojson');
  res.set('Content-Type', 'application/geo+json');
  res.set('Cache-Control', 'public, max-age=86400, immutable');
  fs.createReadStream(filePath).pipe(res);
});

app.get('/geo/ward-zones', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'ward-zones.json');
  res.set('Content-Type', 'application/json');
  res.set('Cache-Control', 'public, max-age=86400, immutable');
  fs.createReadStream(filePath).pipe(res);
});

app.post('/geo/locate', (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng must be numbers' });
  }
  const ward = locateWard(lat, lng);
  if (!ward) return res.status(404).json({ error: 'Not found in any ward' });
  res.json(ward);
});

async function updateByEitherId(collection, id, update, options) {
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    const r1 = await collection.findOneAndUpdate({ _id: new ObjectId(id) }, update, options);
    const doc1 = r1?.value ?? r1;
    if (doc1) return doc1;
  }
  const r2 = await collection.findOneAndUpdate({ _id: id }, update, options);
  const doc2 = r2?.value ?? r2;
  return doc2 || null;
}

app.post('/issues',
  requireApiKey,
  createIssueLimiter,
  validate(IssueCreateSchema),
  async (req, res) => {
    const db = req.app.locals.db;
    const { title, description, category, lat, lng, photo, userId, priority } = req.body;

    let wardInfo = null;
    if (typeof lat === 'number' && typeof lng === 'number') {
      wardInfo = locateWard(lat, lng);
      if (!wardInfo) return res.status(400).json({ error: 'Location outside service area' });
    }

    let imageData = null;
    if (photo && photo.startsWith('data:image/')) {
      try {
        const base64Data = photo.split(',')[1];
        imageData = Buffer.from(base64Data, 'base64');
      } catch (err) {
        return res.status(400).json({ error: 'Invalid image data' });
      }
    }

    const now = new Date();
    const doc = {
      title,
      description,
      category,
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
      photo: imageData ? imageData.toString('base64') : null,
      wardNumber: wardInfo?.wardNumber || null,
      wardName: wardInfo?.wardName || null,
      upvotes: 0,
      priority: priority || 'medium',
      createdAt: now,
      updatedAt: now,
      status: 'open',
      assignedTo: null,
      history: [{ status: 'open', timestamp: now }],
      userId: userId || null,
      comments: [],
      flags: [],
      feedback: null
    };

    try {
      const result = await db.collection('issues').insertOne(doc);
      res.status(201).json({ id: result.insertedId, ...doc, _id: result.insertedId });
    } catch (e) {
      logger.error({ err: e }, 'Create issue error');
      res.status(500).json({ error: 'Failed to create issue' });
    }
  }
);

app.post(
  '/issues/upload',
  requireApiKey,
  async (req, res, next) => {
    multer().single('photo')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { title, description, category, lat: latIn, lng: lngIn } = req.body;
      const file = req.file;

      if (!file && (latIn === undefined || lngIn === undefined || latIn === '' || lngIn === '')) {
        return res.status(400).json({ error: 'photo file required or lat/lng coordinates must be provided' });
      }

      function parseDMS(dms, ref) {
        if (typeof dms === 'string') {
          const match = dms.match(/(\d+)[^\d]+(\d+)[^\d]+([\d.]+)/);
          if (match) {
            let degrees = parseFloat(match[1]);
            let minutes = parseFloat(match[2]);
            let seconds = parseFloat(match[3]);
            let decimal = degrees + minutes / 60 + seconds / 3600;
            if (ref === 'S' || ref === 'W') {
              decimal = -decimal;
            }
            return decimal;
          }
        } else if (Array.isArray(dms)) {
          let decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
          if (ref === 'S' || ref === 'W') {
            decimal = -decimal;
          }
          return decimal;
        }
        return null;
      }

      let lat = null;
      let lng = null;

      if (file) {
        try {
          const buf = Buffer.from(file.buffer);
          const parsed = exif.create(buf).parse();

          if (
            parsed.tags.GPSLatitude &&
            parsed.tags.GPSLongitude &&
            parsed.tags.GPSLatitudeRef &&
            parsed.tags.GPSLongitudeRef
          ) {
            lat = parseDMS(parsed.tags.GPSLatitude, parsed.tags.GPSLatitudeRef);
            lng = parseDMS(parsed.tags.GPSLongitude, parsed.tags.GPSLongitudeRef);
          }
        } catch (exifErr) {
          console.warn('EXIF GPS parse failed or no GPS tags:', exifErr);
        }
      }

      if (lat === null || lng === null) {
        const fl = Number(latIn);
        const fg = Number(lngIn);
        if (Number.isFinite(fl) && Number.isFinite(fg)) {
          lat = fl;
          lng = fg;
        }
      }

      if (lat === null || lng === null) {
        return res.status(400).json({ error: 'Invalid or missing location information' });
      }

      const wardInfo = locateWard(lat, lng);
      if (!wardInfo) {
        return res.status(400).json({ error: 'Location outside supported area' });
      }

      const now = new Date();

      let imageData = null;
      if (file) {
        imageData = file.buffer.toString('base64');
      }

      const doc = {
        title,
        description,
        category,
        lat,
        lng,
        photo: imageData,
        wardNumber: wardInfo?.wardNumber ?? null,
        wardName: wardInfo?.wardName ?? null,
        upvotes: 0,
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
        status: 'open',
        assignedTo: null,
        history: [{ status: 'open', timestamp: now }],
        userId: null,
        comments: [],
        flags: [],
        feedback: null,
      };

      const result = await db.collection('issues').insertOne(doc);

      return res.status(201).json({ id: result.insertedId, ...doc });
    } catch (e) {
      console.error('Upload issue error', e);
      return res.status(500).json({ error: 'Failed to upload issue' });
    }
  }
);

app.get('/issues', async (req, res) => {
  const db = req.app.locals.db;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const cursor = req.query.cursor;
  const q = {};
  if (cursor && /^[0-9a-fA-F]{24}$/.test(cursor)) {
    q._id = { $lt: new ObjectId(cursor) };
  }
  const items = await db.collection('issues')
    .find(q)
    .sort({ _id: -1 })
    .limit(limit)
    .toArray();
  const nextCursor = items.length ? String(items[items.length - 1]._id) : null;
  res.json({ items, nextCursor });
});

app.get('/issues/search', async (req, res) => {
  const db = req.app.locals.db;
  const { wardNumber, status } = req.query;
  const q = {};
  if (wardNumber !== undefined) q.wardNumber = Number(wardNumber);
  if (status) q.status = status;
  const items = await db.collection('issues')
    .find(q)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  res.json({ items });
});

app.post('/issues/:id/upvote',
  requireApiKey,
  authenticateUser, 
  upvoteLimiter,
  async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const userId = req.user.id;

    console.log('Checking upvote for user ID:', userId, 'on issue:', id);

    try {
      let alreadyUpvoted = null;
      if (/^[0-9a-fA-F]{24}$/.test(id)) {
        alreadyUpvoted = await db.collection('issues').findOne({ _id: new ObjectId(id), upvotedBy: userId });
      }
      if (!alreadyUpvoted) {
        alreadyUpvoted = await db.collection('issues').findOne({ _id: id, upvotedBy: userId });
      }

      console.log('Already upvoted:', !!alreadyUpvoted);

      let update = null;
      if (alreadyUpvoted) {
        update = { $inc: { upvotes: -1 }, $pull: { upvotedBy: userId }, $set: { updatedAt: new Date() } };
      } else {
        update = { $inc: { upvotes: 1 }, $addToSet: { upvotedBy: userId }, $set: { updatedAt: new Date() } };
      }

      let updatedDoc = null;
      if (/^[0-9a-fA-F]{24}$/.test(id)) {
        try {
          const r1 = await db.collection('issues').findOneAndUpdate(
            { _id: new ObjectId(id) },
            update,
            { returnDocument: 'after' }
          );
          console.debug('Upvote r1 result:', !!r1, 'valueExists:', !!r1?.value);
          if (r1 && r1.value) updatedDoc = r1.value;
        } catch (r1err) {
          console.warn('Upvote r1 error for ObjectId attempt:', r1err);
        }
      }

      if (!updatedDoc) {
        try {
          const r2 = await db.collection('issues').findOneAndUpdate(
            { _id: id },
            update,
            { returnDocument: 'after' }
          );
          console.debug('Upvote r2 result:', !!r2, 'valueExists:', !!r2?.value);
          if (r2 && r2.value) updatedDoc = r2.value;
        } catch (r2err) {
          console.warn('Upvote r2 error for string id attempt:', r2err);
        }
      }

      if (!updatedDoc) {
        try {
          let found = null;
          if (/^[0-9a-fA-F]{24}$/.test(id)) {
            found = await db.collection('issues').findOne({ _id: new ObjectId(id) });
          }
          if (!found) found = await db.collection('issues').findOne({ _id: id });

          if (found) {
            console.debug('Upvote: fetched document after update via explicit find');
            return res.json(found);
          }
        } catch (findErr) {
          console.warn('Upvote: explicit find after update failed:', findErr);
        }

        console.warn('Upvote: no document found for id (tried ObjectId and string). id=', id, 'typeof id=', typeof id);
        const nearby = await db.collection('issues').find({}).sort({ createdAt: -1 }).limit(10).toArray();
        console.warn('Sample recent issue ids:', nearby.map(i => ({ id: String(i._id), type: typeof i._id })));
        return res.status(404).json({ error: 'Issue not found' });
      }

  res.json(updatedDoc);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to upvote' });
    }
  }
);

app.post('/issues/:id/status',
  requireApiKey,
  validate(StatusSchema),
  async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { status, assignedTo, statusChangeReason } = req.body;

    const set = { updatedAt: new Date() };
    if (status) set.status = status;
    if (assignedTo) set.assignedTo = assignedTo;

    const update = {
      $set: set,
      $push: { history: { status, assignedTo, reason: statusChangeReason, timestamp: new Date() } }
    };

    try {
      const doc = await updateByEitherId(
        db.collection('issues'),
        id,
        update,
        { returnDocument: 'after' }
      );
      if (!doc) return res.status(404).json({ error: 'Issue not found' });
  res.json(doc);
    } catch (e) {
      logger.error({ err: e, id }, 'Status update error');
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

app.post('/issues/:id/comment',
  requireApiKey,
  validate(CommentSchema),
  async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { user, text } = req.body;
    const comment = { user, text, timestamp: new Date() };

    try {
      const doc = await updateByEitherId(
        db.collection('issues'),
        id,
        { $push: { comments: comment }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      if (!doc) return res.status(404).json({ error: 'Issue not found' });
  res.json(doc);
    } catch (e) {
      logger.error({ err: e, id }, 'Comment error');
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
);

app.post('/issues/:id/flag',
  requireApiKey,
  validate(FlagSchema),
  async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { user, reason } = req.body;
    const flag = { user, reason, timestamp: new Date() };

    try {
      const doc = await updateByEitherId(
        db.collection('issues'),
        id,
        { $push: { flags: flag }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      if (!doc) return res.status(404).json({ error: 'Issue not found' });
  res.json(doc);
    } catch (e) {
      logger.error({ err: e, id }, 'Flag error');
      res.status(500).json({ error: 'Failed to flag issue' });
    }
  }
);

app.post('/issues/:id/feedback',
  requireApiKey,
  validate(FeedbackSchema),
  async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { rating, comment } = req.body;

    try {
      const doc = await updateByEitherId(
        db.collection('issues'),
        id,
        { $set: { feedback: { rating, comment, timestamp: new Date() }, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      if (!doc) return res.status(404).json({ error: 'Issue not found' });
  res.json(doc);
    } catch (e) {
      logger.error({ err: e, id }, 'Feedback error');
      res.status(500).json({ error: 'Failed to add feedback' });
    }
  }
);

app.get('/issues/analytics', async (req, res) => {
  const db = req.app.locals.db;
  const total = await db.collection('issues').countDocuments();
  const open = await db.collection('issues').countDocuments({ status: 'open' });
  const resolved = await db.collection('issues').countDocuments({ status: 'resolved' });
  res.json({ total, open, resolved });
});

app.get('/issues/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  try {
    let doc = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      doc = await db.collection('issues').findOne({ _id: new ObjectId(id) });
      if (!doc) doc = await db.collection('issues').findOne({ _id: id });
    } else {
      if (!doc) doc = await db.collection('issues').findOne({ _id: id });
    }
    if (!doc) return res.status(404).json({ error: 'Issue not found' });
  res.json(doc);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

module.exports = app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Backend running locally on port ${PORT}`));
}