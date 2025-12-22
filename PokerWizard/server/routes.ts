import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertAnalysisSchema } from "@shared/schema";
import { parsePokerHandHistory } from "./poker-parser";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session user mock - in production this would come from authentication
  const MOCK_USER_ID = "mock-user-1";
  const getMockUserId = () => MOCK_USER_ID;

  // Initialize mock user with deterministic ID
  const initMockUser = async () => {
    let user = await storage.getUser(MOCK_USER_ID);
    
    if (!user) {
      // Create user with deterministic ID
      user = await storage.createUserWithId({
        id: MOCK_USER_ID,
        username: "demo-user",
        password: "hashed-password",
      });
      
      await storage.createUserCredits({
        userId: MOCK_USER_ID,
        freeAnalyses: 5,
        isPremium: false,
        premiumUntil: null,
      });
    }
    
    return user;
  };

  await initMockUser();

  // Get user credits
  app.get("/api/credits", async (req, res) => {
    try {
      const userId = getMockUserId();
      const credits = await storage.getUserCredits(userId);
      
      if (!credits) {
        return res.status(404).json({ error: "Credits not found" });
      }
      
      res.json(credits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch credits" });
    }
  });

  // Watch ad to earn credit
  app.post("/api/credits/watch-ad", async (req, res) => {
    try {
      const userId = getMockUserId();
      const credits = await storage.getUserCredits(userId);
      
      if (!credits) {
        return res.status(404).json({ error: "Credits not found" });
      }
      
      // Add 1 free analysis for watching ad
      const updated = await storage.updateUserCredits(userId, {
        freeAnalyses: credits.freeAnalyses + 1,
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update credits" });
    }
  });

  // Upload and analyze poker hand history
  app.post("/api/analyze", upload.single("file"), async (req, res) => {
    try {
      const userId = getMockUserId();
      const credits = await storage.getUserCredits(userId);
      
      if (!credits) {
        return res.status(404).json({ error: "Credits not found" });
      }
      
      // Check if user has credits (with safeguard)
      if (!credits.isPremium && credits.freeAnalyses <= 0) {
        return res.status(403).json({ 
          error: "No analyses remaining. Watch ads or upgrade to Premium." 
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Parse the file
      const content = req.file.buffer.toString('utf-8');
      const stats = parsePokerHandHistory(content, req.file.originalname);
      
      // Create analysis record
      const analysis = await storage.createAnalysis({
        userId,
        filename: req.file.originalname,
        handsPlayed: stats.handsPlayed,
        winRate: stats.winRate,
        vpip: stats.vpip,
        pfr: stats.pfr,
        threeBet: stats.threeBet,
      });
      
      // Deduct credit if not premium (with safeguard against negative)
      if (!credits.isPremium && credits.freeAnalyses > 0) {
        await storage.updateUserCredits(userId, {
          freeAnalyses: Math.max(0, credits.freeAnalyses - 1),
        });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: "Failed to analyze file" });
    }
  });

  // Get all analyses for user
  app.get("/api/analyses", async (req, res) => {
    try {
      const userId = getMockUserId();
      const analyses = await storage.getAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  // Get single analysis
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Create Stripe checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
      });
      
      const userId = getMockUserId();
      
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: 'PokerStats Premium',
                description: 'Análises ilimitadas e recursos avançados',
              },
              unit_amount: 1000, // R$ 10.00 in cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        client_reference_id: userId,
        success_url: `${req.headers.origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/dashboard?canceled=true`,
      });
      
      res.json({ sessionId: session.id });
    } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Handle Stripe checkout success (for demo purposes)
  app.get("/api/checkout-success", async (req, res) => {
    try {
      const userId = getMockUserId();
      
      // In production, verify session_id with Stripe and use webhooks
      // For MVP, just activate premium
      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);
      
      await storage.updateUserCredits(userId, {
        isPremium: true,
        premiumUntil,
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to activate premium" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
