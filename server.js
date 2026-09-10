import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import methodOverride from 'method-override';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db.js';
import { exposeUser } from './middleware/auth.js';
import { exposePageSections } from './middleware/pageSections.js';
import publicRoutes from './routes/public.js';
import chatRoutes from './routes/chat.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { registerChatSocket } from './realtime/chatSocket.js';
import { ensureDefaultContent } from './utils/ensureContent.js';
import { ensurePageSections } from './utils/ensurePageSections.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: false } });
app.set('io', io);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

await connectDB();
await ensureDefaultContent();
await ensurePageSections();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0 }));

const sessionMiddleware = session({
  name: 'gracious.sid',
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
registerChatSocket(io);

app.use(exposeUser);
app.use(exposePageSections);
app.use('/api/chat', chatRoutes);
app.use('/admin', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);
app.use((req, res) => res.status(404).render('public/404', { title: 'Page Not Found', settings: {} }));
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ ok: false, error: 'Server error.' });
  res.status(500).render('public/500', { title: 'Server Error', settings: {}, error: process.env.NODE_ENV === 'development' ? err : null });
});

const port = Number(process.env.PORT) || 5000;
server.listen(port, () => console.log(`Gracious Senior Living running on http://localhost:${port}`));
