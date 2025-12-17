import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getUserByEmail, createUser } from '../services/userService';

// Log para debug
console.log('🔐 Google OAuth Config:');
console.log('  - CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : '❌ NÃO DEFINIDO');
console.log('  - CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Definido' : '❌ NÃO DEFINIDO');
console.log('  - CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || '❌ NÃO DEFINIDO');

// DEBUG TEMPORÁRIO
console.log('GOOGLE CALLBACK EM USO →', process.env.GOOGLE_CALLBACK_URL);

// Só configura o Google Strategy se as credenciais existirem
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
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
  console.log('✅ Google OAuth Strategy configurada com sucesso!');
} else {
  console.warn('⚠️ Google OAuth NÃO configurado - variáveis de ambiente faltando!');
}

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
