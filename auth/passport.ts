import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';
import models, { Permission, Role, User } from '../models';

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => done(null, user.id));
passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
  try {
    const user = await models.User.findByPk(id);
    done(null, user);
  } catch (e) {
    done(e, undefined);
  }
});

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email: string, password: string, done: (err: any, user?: any, info?: any) => void) => {
  try {
    const user: any = await models.User.findOne({ where: { email } });
    if (!user || !user.isActive) return done(null, false);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return done(null, false);
    user.lastLoginAt = new Date();
    await user.save();
    return done(null, user);
  } catch (e) {
    return done(e);
  }
}));

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: (process.env.JWT_SECRET as string) || 'change-me',
}, async (payload: any, done: (err: any, user?: any, info?: any) => void) => {
  try {
    const user: any = await models.User.findByPk(payload.sub);
    if (!user || !user.isActive) return done(null, false);
    // Include roles, permissions, and tenant info from JWT payload
    return done(null, { 
      id: user.id, 
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      tenantIds: payload.tenantIds || [],
      isSuperAdmin: payload.isSuperAdmin || false,
      // Include the full user instance for accessing methods like getTenants()
      ...user.toJSON(),
      getRoles: () => user.getRoles(),
      getTenants: () => user.getTenants()
    });
  } catch (e) {
    done(e, false);
  }
}));

export default passport;
