"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.getUserByEmail = getUserByEmail;
exports.getUserById = getUserById;
exports.verifyPassword = verifyPassword;
exports.deductCredit = deductCredit;
exports.setPremium = setPremium;
exports.updateUser = updateUser;
exports.getAllUsers = getAllUsers;
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// In-memory user store (for prototype; use DB in production)
const users = new Map();
// Index by email for quick lookup
const usersByEmail = new Map();
async function createUser(email, name, password, googleId, price) {
    const existing = usersByEmail.get(email);
    if (existing) {
        throw new Error('User already exists');
    }
    const user = {
        id: (0, uuid_1.v4)(),
        email,
        name,
        passwordHash: password ? bcryptjs_1.default.hashSync(password, 10) : undefined,
        googleId,
        price,
        credits: 3, // 3 free analyses
        premium: false,
        premiumUntil: null,
        createdAt: new Date(),
    };
    users.set(user.id, user);
    usersByEmail.set(email, user);
    return user;
}
async function getUserByEmail(email) {
    return usersByEmail.get(email);
}
async function getUserById(id) {
    return users.get(id);
}
async function verifyPassword(email, password) {
    const user = usersByEmail.get(email);
    if (!user || !user.passwordHash)
        return false;
    return bcryptjs_1.default.compareSync(password, user.passwordHash);
}
async function deductCredit(userId) {
    const user = users.get(userId);
    if (!user)
        return false;
    // If premium, don't deduct (unlimited)
    if (user.premium && user.premiumUntil && new Date() < user.premiumUntil) {
        return true;
    }
    if (user.credits > 0) {
        user.credits -= 1;
        return true;
    }
    return false;
}
async function setPremium(userId, days = 30) {
    const user = users.get(userId);
    if (!user)
        throw new Error('User not found');
    user.premium = true;
    const until = new Date();
    until.setDate(until.getDate() + days);
    user.premiumUntil = until;
    // Optionally reset credits to unlimited (or keep tracking for analytics)
    user.credits = 1000; // Large number to indicate unlimited in free version
}
async function updateUser(userId, updates) {
    const user = users.get(userId);
    if (!user)
        throw new Error('User not found');
    Object.assign(user, updates);
    return user;
}
// Export snapshot for debugging
function getAllUsers() {
    return Array.from(users.values());
}
//# sourceMappingURL=userService.js.map