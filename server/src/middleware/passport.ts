import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getUserByEmail, createUser } from '../services/userService';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;

        if (!email) return done(new Error('Email não recebido do Google'), null);

        let user = await getUserByEmail(email);

        if (!user) {
          user = await createUser(email, name || 'Google User', undefined, email, undefined);
        }

        return done(null, {
          id: user.id,
          email: user.email,
          name: user.name,
        });
      } catch (err) {
        return done(err as any, null);
      }
    }
  )
);

/* ------------------------- */
/*   NECESSÁRIO PARA SESSÃO  */
/* ------------------------- */

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

export default passport;
