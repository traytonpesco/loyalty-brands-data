import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session from 'express-session';
import cors from 'cors';
import passport from './auth/passport';
import sequelize from './db/sequelize';
import indexRouter from './routes/index';
import authWeb from './routes/auth.web';
import authApi from './routes/auth.api';
import adminUsers from './routes/admin.users';
import adminTenants from './routes/admin.tenants';
import adminRoles from './routes/admin.roles';
import campaigns from './routes/campaigns';
import exportsRouter from './routes/exports';
import scheduledExportsRouter from './routes/scheduledExports';
import analyticsRouter from './routes/analytics';
import webhooksRouter from './routes/webhooks';
import docsRouter from './routes/docs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Logger (plain in dev, combined in prod)
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve React client build files statically from client
// Note: In development with ts-node, __dirname is the source dir, so we need to look in dist/
// In production, __dirname is dist/, so we look in client/
const clientPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'client')
  : path.join(__dirname, 'dist', 'client');
app.use(express.static(clientPath));

// Security
app.use(helmet());
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const maxReq = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
app.use(['/auth', '/api/auth'], rateLimit({ windowMs, max: maxReq }));

// Sessions (web) with Sequelize store
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const store = new SequelizeStore({ db: sequelize });
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.set('trust proxy', 1);
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  store,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProduction },
}));
store.sync();

// CORS from env
const origins = (process.env.CLIENT_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins, credentials: true } : undefined));
app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use('/api', indexRouter);
app.use('/auth', authWeb); // session-based web auth
app.use('/api/auth', authApi); // JWT-based API auth
app.use('/api/admin/users', adminUsers);
app.use('/api/admin/roles', passport.authenticate('jwt', { session: false }), adminRoles);
app.use('/api/admin/tenants', passport.authenticate('jwt', { session: false }), adminTenants);
app.use('/api/campaigns', passport.authenticate('jwt', { session: false }), campaigns);
app.use('/api/exports', passport.authenticate('jwt', { session: false }), exportsRouter);
app.use('/api/scheduled-exports', passport.authenticate('jwt', { session: false }), scheduledExportsRouter);
app.use('/api/analytics', passport.authenticate('jwt', { session: false }), analyticsRouter);
app.use('/api/webhooks', passport.authenticate('jwt', { session: false }), webhooksRouter);
app.use('/api/docs', docsRouter); // API documentation

// Catch-all handler to serve React app for client-side routing
app.get('*', (req: Request, res: Response) => {
  const indexPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, 'client', 'index.html')
    : path.join(__dirname, 'dist', 'client', 'index.html');
  res.sendFile(indexPath);
});

// 404 handler
app.use(function(req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.json({ error: err.message });
});

export default app;
