"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const userService_1 = require("../services/userService");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        if (!email)
            return done(new Error('Email não recebido do Google'), null);
        let user = await (0, userService_1.getUserByEmail)(email);
        if (!user) {
            user = await (0, userService_1.createUser)(email, name || 'Google User', undefined, email, undefined);
        }
        return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
        });
    }
    catch (err) {
        return done(err, null);
    }
}));
/* ------------------------- */
/*   NECESSÁRIO PARA SESSÃO  */
/* ------------------------- */
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((obj, done) => {
    done(null, obj);
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map