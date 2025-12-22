import { type User, type InsertUser, type Analysis, type InsertAnalysis, type UserCredits, type InsertUserCredits } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithId(user: User): Promise<User>;
  
  getUserCredits(userId: string): Promise<UserCredits | undefined>;
  createUserCredits(credits: InsertUserCredits): Promise<UserCredits>;
  updateUserCredits(userId: string, updates: Partial<UserCredits>): Promise<UserCredits | undefined>;
  
  getAnalyses(userId: string): Promise<Analysis[]>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private userCredits: Map<string, UserCredits>;
  private analyses: Map<string, Analysis>;

  constructor() {
    this.users = new Map();
    this.userCredits = new Map();
    this.analyses = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    const creditsId = randomUUID();
    const credits: UserCredits = {
      id: creditsId,
      userId: id,
      freeAnalyses: 5,
      isPremium: false,
      premiumUntil: null,
    };
    this.userCredits.set(id, credits);
    
    return user;
  }

  async createUserWithId(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async getUserCredits(userId: string): Promise<UserCredits | undefined> {
    return this.userCredits.get(userId);
  }

  async createUserCredits(insertCredits: InsertUserCredits): Promise<UserCredits> {
    const id = randomUUID();
    const credits: UserCredits = { 
      id,
      userId: insertCredits.userId,
      freeAnalyses: insertCredits.freeAnalyses ?? 5,
      isPremium: insertCredits.isPremium ?? false,
      premiumUntil: insertCredits.premiumUntil ?? null,
    };
    this.userCredits.set(insertCredits.userId, credits);
    return credits;
  }

  async updateUserCredits(userId: string, updates: Partial<UserCredits>): Promise<UserCredits | undefined> {
    const existing = this.userCredits.get(userId);
    if (!existing) return undefined;
    
    const updated: UserCredits = { ...existing, ...updates };
    this.userCredits.set(userId, updated);
    return updated;
  }

  async getAnalyses(userId: string): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const analysis: Analysis = {
      ...insertAnalysis,
      id,
      createdAt: new Date(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }
}

export const storage = new MemStorage();
