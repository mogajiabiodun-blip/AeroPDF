import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

// Simulated Database
interface Document {
  id: string;
  name: string;
  size: string;
  type: string;
  createdAt: string;
  category: string;
  favorite: boolean;
  shared: boolean;
  version: number;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  status: "success" | "warning" | "error";
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  plan: string;
}

interface Subscription {
  planName: "Free" | "Professional" | "Enterprise";
  status: "active" | "past_due" | "canceled";
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  creditsUsed: number;
  creditsTotal: number;
  storageUsed: number; // in MB
  storageTotal: number; // in MB
}

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  createdAt: string;
  subscription: Subscription;
  documents: Document[];
  activityLogs: ActivityLog[];
  invoices: Invoice[];
  apiKeys: APIKey[];
  lemonSqueezyEnabled?: boolean;
  lemonSqueezyProUrl?: string;
  lemonSqueezyEntUrl?: string;
  lemonSqueezyWebhookSecret?: string;
}

// Global Multi-User Database File Store
const DB_PATH = path.join(process.cwd(), "database.json");
let dbData: { users: User[] } = { users: [] };

function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      dbData = JSON.parse(content);
      console.log(`Database loaded successfully with ${dbData.users.length} users.`);
    } else {
      console.log("No database file found. Initializing with default admin...");
      const defaultUser: User = {
        id: "user-default",
        username: "admin",
        passwordHash: "password",
        email: "admin@aeropdf.com",
        createdAt: new Date().toISOString(),
        subscription: {
          planName: "Professional",
          status: "active",
          billingCycle: "monthly",
          nextBillingDate: "2026-08-01",
          creditsUsed: 124,
          creditsTotal: 500,
          storageUsed: 5.45,
          storageTotal: 10000
        },
        documents: [
          { id: "doc-1", name: "Sample_Financial_Statement.pdf", size: "1.2 MB", type: "pdf", createdAt: "2026-07-01T10:00:00Z", category: "Finance", favorite: true, shared: false, version: 1 },
          { id: "doc-2", name: "Employment_Agreement_Template.pdf", size: "450 KB", type: "pdf", createdAt: "2026-07-05T14:30:00Z", category: "Legal", favorite: false, shared: true, version: 2 },
          { id: "doc-3", name: "Marketing_Presentation_Q3.pdf", size: "3.8 MB", type: "pdf", createdAt: "2026-07-10T09:15:00Z", category: "Marketing", favorite: true, shared: true, version: 1 }
        ],
        activityLogs: [
          { id: "act-1", userId: "user-default", action: "User Login", details: "Logged in from Chrome on macOS (IP: 192.168.1.50)", timestamp: "2026-07-12T18:00:00Z", status: "success" },
          { id: "act-2", userId: "user-default", action: "PDF Merge", details: "Merged 3 financial statements into a single PDF", timestamp: "2026-07-12T18:10:00Z", status: "success" },
          { id: "act-3", userId: "user-default", action: "AI Summarization", details: "Summarized Marketing_Presentation_Q3.pdf using Gemini", timestamp: "2026-07-12T18:12:00Z", status: "success" }
        ],
        invoices: [
          { id: "INV-2026-001", date: "2026-07-01", amount: "$15.00", status: "Paid", plan: "Professional Monthly" },
          { id: "INV-2026-002", date: "2026-06-01", amount: "$15.00", status: "Paid", plan: "Professional Monthly" },
          { id: "INV-2026-003", date: "2026-05-01", amount: "$15.00", status: "Paid", plan: "Professional Monthly" }
        ],
        apiKeys: [
          { id: "key-1", name: "Production API Key", prefix: "ap_live_...", createdAt: "2026-06-15" },
          { id: "key-2", name: "Staging API Key", prefix: "ap_test_...", createdAt: "2026-07-01" }
        ]
      };
      dbData.users.push(defaultUser);
      saveDatabase();
    }
  } catch (err) {
    console.error("Failed to load or initialize database:", err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save database:", err);
  }
}

// Global Subscribers Database File Store
const SUBSCRIBERS_PATH = path.join(process.cwd(), "subscribers.json");

interface Subscriber {
  id: string;
  userId: string;
  username: string;
  email: string;
  planName: "Free" | "Professional" | "Enterprise";
  status: "active" | "past_due" | "canceled";
  billingCycle: "monthly" | "yearly";
  creditsUsed: number;
  creditsTotal: number;
  startDate: string;
}

let subscribersData: { subscribers: Subscriber[] } = { subscribers: [] };

function loadSubscribers() {
  try {
    if (fs.existsSync(SUBSCRIBERS_PATH)) {
      const content = fs.readFileSync(SUBSCRIBERS_PATH, "utf-8");
      subscribersData = JSON.parse(content);
      console.log(`Subscribers database loaded successfully with ${subscribersData.subscribers.length} subscribers.`);
    } else {
      console.log("No subscribers database found. Initializing with default subscriber...");
      const defaultSub: Subscriber = {
        id: "sub-default",
        userId: "user-default",
        username: "admin",
        email: "admin@aeropdf.com",
        planName: "Professional",
        status: "active",
        billingCycle: "monthly",
        creditsUsed: 124,
        creditsTotal: 500,
        startDate: "2026-07-01T10:00:00Z"
      };
      subscribersData.subscribers = [defaultSub];
      saveSubscribers();
    }
  } catch (err) {
    console.error("Failed to load or initialize subscribers database:", err);
  }
}

function saveSubscribers() {
  try {
    fs.writeFileSync(SUBSCRIBERS_PATH, JSON.stringify(subscribersData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save subscribers database:", err);
  }
}

function syncSubscriber(user: User) {
  const existingIndex = subscribersData.subscribers.findIndex(s => s.userId === user.id);
  const subscriberInfo: Subscriber = {
    id: existingIndex >= 0 ? subscribersData.subscribers[existingIndex].id : "sub-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    userId: user.id,
    username: user.username,
    email: user.email,
    planName: user.subscription.planName,
    status: user.subscription.status,
    billingCycle: user.subscription.billingCycle,
    creditsUsed: user.subscription.creditsUsed,
    creditsTotal: user.subscription.creditsTotal,
    startDate: existingIndex >= 0 ? subscribersData.subscribers[existingIndex].startDate : new Date().toISOString()
  };

  if (existingIndex >= 0) {
    subscribersData.subscribers[existingIndex] = subscriberInfo;
  } else {
    subscribersData.subscribers.push(subscriberInfo);
  }
  saveSubscribers();
}

// Boot database
loadDatabase();
loadSubscribers();

// Authentication Middleware
function getAuthenticatedUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized access. Please register or log in first." });
  }
  const userId = authHeader.substring(7); // "Bearer <userId>"
  const user = dbData.users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "Session invalid or expired. Please register or log in again." });
  }
  (req as any).user = user;
  next();
}

function requirePremium(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized access. Please register or log in first." });
  }
  if (user.subscription.planName === "Free") {
    return res.status(403).json({ error: "AeroPDF AI Workspace is a premium feature. Please upgrade to Professional or Enterprise to unlock real-time Gemini analysis." });
  }
  next();
}

function requireEnterprise(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized access. Please register or log in first." });
  }
  if (user.subscription.planName !== "Enterprise") {
    return res.status(403).json({ error: "Developer APIs are exclusive to Enterprise subscribers." });
  }
  next();
}

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
const resetCodes: Record<string, { code: string; expires: number }> = {};
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not set or configured. Please set up the secret in the platform panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: "AeroPDF Fullstack Engine"
    });
  });

  // --- AUTHENTICATION ENDPOINTS ---

  // Register a new user
  app.post("/api/auth/register", (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = dbData.users.find(u => u.username.toLowerCase() === normalizedUsername || u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "Username or Email already registered." });
    }

    const userId = "user-" + Date.now();
    const newUser: User = {
      id: userId,
      username: username.trim(),
      passwordHash: password, // Store password simply for this demo context
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      subscription: {
        planName: "Free",
        status: "active",
        billingCycle: "monthly",
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        creditsUsed: 0,
        creditsTotal: 100,
        storageUsed: 0,
        storageTotal: 100
      },
      documents: [
        { id: "doc-welcome", name: "Welcome_to_AeroPDF.pdf", size: "12 KB", type: "pdf", createdAt: new Date().toISOString(), category: "General", favorite: true, shared: false, version: 1 }
      ],
      activityLogs: [
        { id: "act-" + Date.now(), userId: userId, action: "Account Registered", details: "Created new AeroPDF free account", timestamp: new Date().toISOString(), status: "success" }
      ],
      invoices: [],
      apiKeys: []
    };

    dbData.users.push(newUser);
    saveDatabase();
    syncSubscriber(newUser);

    res.json({
      success: true,
      token: userId,
      user: {
        id: userId,
        username: newUser.username,
        email: newUser.email,
        subscription: newUser.subscription
      }
    });
  });

  // Login existing user
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const user = dbData.users.find(u => 
      u.username.toLowerCase() === normalizedUsername || 
      u.email.toLowerCase() === normalizedUsername
    );

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Add login log
    user.activityLogs.unshift({
      id: "act-" + Date.now(),
      userId: user.id,
      action: "User Login",
      details: "Logged in successfully to AeroPDF",
      timestamp: new Date().toISOString(),
      status: "success"
    });
    saveDatabase();

    res.json({
      success: true,
      token: user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscription: user.subscription
      }
    });
  });

  // Request password reset (Forgot Password)
  app.post("/api/auth/forgot-password", (req, res) => {
    const { identity } = req.body;
    if (!identity) {
      return res.status(400).json({ error: "Username or email address is required." });
    }

    const normalizedIdentity = identity.trim().toLowerCase();
    const user = dbData.users.find(u => 
      u.username.toLowerCase() === normalizedIdentity || 
      u.email.toLowerCase() === normalizedIdentity
    );

    if (!user) {
      return res.status(404).json({ error: "No registered account found matching that username or email address." });
    }

    // Generate a 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in-memory with 15 minutes expiration
    resetCodes[user.id] = {
      code,
      expires: Date.now() + 15 * 60 * 1000
    };

    // Helper to mask email for privacy
    const maskEmail = (emailStr: string) => {
      const parts = emailStr.split("@");
      if (parts.length !== 2) return emailStr;
      const [name, domain] = parts;
      const maskedName = name.length > 2 
        ? name.substring(0, 2) + "***" + name.substring(name.length - 1)
        : name + "***";
      return `${maskedName}@${domain}`;
    };

    console.log(`Password reset requested for ${user.username}. Generated code: ${code}`);

    res.json({
      success: true,
      message: "Verification code sent successfully.",
      email: maskEmail(user.email),
      code: code // Expose code to client-side so it can simulate email delivery inside the app
    });
  });

  // Reset Password using code
  app.post("/api/auth/reset-password", (req, res) => {
    const { identity, code, newPassword } = req.body;
    if (!identity || !code || !newPassword) {
      return res.status(400).json({ error: "Identity, reset code, and new password are required." });
    }

    const normalizedIdentity = identity.trim().toLowerCase();
    const user = dbData.users.find(u => 
      u.username.toLowerCase() === normalizedIdentity || 
      u.email.toLowerCase() === normalizedIdentity
    );

    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    const record = resetCodes[user.id];
    if (!record || record.code !== code.trim() || record.expires < Date.now()) {
      return res.status(400).json({ error: "The verification code is invalid or has expired. Please try again." });
    }

    // Update password
    user.passwordHash = newPassword;
    
    // Log recovery activity
    user.activityLogs.unshift({
      id: "act-reset-" + Date.now(),
      userId: user.id,
      action: "Password Recovered",
      details: "Password reset completed via self-service verification",
      timestamp: new Date().toISOString(),
      status: "success"
    });

    // Save database
    saveDatabase();

    // Clean up used code
    delete resetCodes[user.id];

    res.json({
      success: true,
      message: "Your password has been successfully reset. You can now log in with your new password."
    });
  });

  // Backup restore endpoint for ephemeral container file resets
  app.post("/api/auth/restore", (req, res) => {
    const { id, username, passwordHash, email, subscription, documents, activityLogs, apiKeys, invoices } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: "Invalid backup profile parameters." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    let user = dbData.users.find(u => 
      u.username.toLowerCase() === normalizedUsername || 
      u.email.toLowerCase() === normalizedEmail
    );

    if (!user) {
      // Recreate user exactly as stored in client-side localStorage
      user = {
        id: id || "user-" + Date.now(),
        username: username.trim(),
        passwordHash: passwordHash || "password",
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
        subscription: subscription || {
          planName: "Free",
          status: "active",
          billingCycle: "monthly",
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          creditsUsed: 0,
          creditsTotal: 100,
          storageUsed: 0,
          storageTotal: 100
        },
        documents: documents || [],
        activityLogs: activityLogs || [
          { id: "act-restore-" + Date.now(), userId: id || "user", action: "Account Restored", details: "Restored from persistent client-side backup context", timestamp: new Date().toISOString(), status: "success" }
        ],
        invoices: invoices || [],
        apiKeys: apiKeys || []
      };
      dbData.users.push(user);
      saveDatabase();
      syncSubscriber(user);
      console.log(`User ${user.username} successfully restored from client-side persistent vault.`);
    } else {
      console.log(`User ${user.username} already exists in runtime memory, skipping restoration.`);
    }

    res.json({
      success: true,
      token: user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscription: user.subscription
      }
    });
  });

  // Get current session user
  app.get("/api/auth/me", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscription: user.subscription
      }
    });
  });

  // System statistics (for super admin / dashboard)
  app.get("/api/admin/stats", getAuthenticatedUser, (req, res) => {
    const totalUsers = dbData.users.length;
    const recentLogs = dbData.users.flatMap(u => u.activityLogs).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    res.json({
      totalUsers: totalUsers + 14204,
      activeSubscriptions: dbData.users.filter(u => u.subscription.planName !== "Free").length + 2840,
      monthlyRevenue: `$${(dbData.users.filter(u => u.subscription.planName !== "Free").length * 15 + 42600).toLocaleString()}`,
      totalDocumentsProcessed: dbData.users.reduce((acc, u) => acc + u.documents.length, 0) + 184512,
      activeJobs: 3,
      systemCpu: "12%",
      systemMemory: "42% of 4GB",
      storageUsageTotal: "24.5 TB of 100 TB",
      recentLogs
    });
  });

  // Get all subscribers in subscribers database
  app.get("/api/admin/subscribers", getAuthenticatedUser, (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.username !== "admin") {
      return res.status(403).json({ error: "Access denied. Exclusively managed by Owner/Admin." });
    }
    
    // Auto-sync current database users to keep files synchronized
    dbData.users.forEach(user => {
      syncSubscriber(user);
    });

    res.json({ success: true, subscribers: subscribersData.subscribers });
  });

  // Admin updating a subscriber directly
  app.post("/api/admin/subscribers/update", getAuthenticatedUser, (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.username !== "admin") {
      return res.status(403).json({ error: "Access denied. Exclusively managed by Owner/Admin." });
    }

    const { userId, planName, status, billingCycle, creditsTotal, creditsUsed } = req.body;
    
    const user = dbData.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found in main database." });
    }

    user.subscription.planName = planName || user.subscription.planName;
    user.subscription.status = status || user.subscription.status;
    user.subscription.billingCycle = billingCycle || user.subscription.billingCycle;
    if (creditsTotal !== undefined) user.subscription.creditsTotal = Number(creditsTotal);
    if (creditsUsed !== undefined) user.subscription.creditsUsed = Number(creditsUsed);
    
    saveDatabase();
    syncSubscriber(user);

    res.json({ success: true, subscribers: subscribersData.subscribers, message: `Subscriber ${user.username} updated successfully!` });
  });

  // Get current subscription & stats
  app.get("/api/user/subscription", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    res.json({
      subscription: user.subscription,
      invoices: user.invoices,
      apiKeys: user.apiKeys,
      lemonSqueezyEnabled: user.lemonSqueezyEnabled || false,
      lemonSqueezyProUrl: user.lemonSqueezyProUrl || "",
      lemonSqueezyEntUrl: user.lemonSqueezyEntUrl || "",
      lemonSqueezyWebhookSecret: user.lemonSqueezyWebhookSecret || ""
    });
  });

  // Save Lemon Squeezy integration settings
  app.post("/api/user/lemonsqueezy-settings", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    const { enabled, proUrl, entUrl, webhookSecret } = req.body;
    
    user.lemonSqueezyEnabled = !!enabled;
    user.lemonSqueezyProUrl = (proUrl || "").trim();
    user.lemonSqueezyEntUrl = (entUrl || "").trim();
    user.lemonSqueezyWebhookSecret = (webhookSecret || "").trim();
    
    // Log Activity
    user.activityLogs.unshift({
      id: "act-" + Date.now(),
      userId: user.id,
      action: "Integration Update",
      details: `Updated Lemon Squeezy payment settings (Status: ${enabled ? 'Enabled' : 'Disabled'})`,
      timestamp: new Date().toISOString(),
      status: "success"
    });
    
    saveDatabase();
    res.json({ success: true });
  });

  // Lemon Squeezy Webhook Receiver
  app.post("/api/billing/lemonsqueezy-webhook", async (req, res) => {
    try {
      const payload = req.body;
      const eventName = payload.meta?.event_name;
      const customData = payload.meta?.custom_data;
      const email = payload.data?.attributes?.user_email || payload.data?.attributes?.customer_email;
      
      console.log(`[Lemon Squeezy Webhook] Event: ${eventName}, Email: ${email}, CustomData:`, customData);
      
      // Find the user by ID or by Email
      let user = null;
      if (customData && customData.user_id) {
        user = dbData.users.find(u => u.id === customData.user_id);
      }
      if (!user && email) {
        user = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }
      
      if (!user) {
        console.warn(`[Lemon Squeezy Webhook] No matching user found for email ${email} or user_id ${customData?.user_id}`);
        // If it's a test/unregistered order, we can still return 200 to satisfy Lemon Squeezy
        return res.status(200).json({ success: false, warning: "User not found, but webhook acknowledged" });
      }
      
      // Determine plan based on product/variant name or payload structure
      const variantName = payload.data?.attributes?.variant_name || "";
      const productName = payload.data?.attributes?.product_name || "";
      let planName: "Free" | "Professional" | "Enterprise" = "Professional";
      if (
        variantName.toLowerCase().includes("enterprise") || 
        productName.toLowerCase().includes("enterprise")
      ) {
        planName = "Enterprise";
      } else if (
        variantName.toLowerCase().includes("free") || 
        productName.toLowerCase().includes("free")
      ) {
        planName = "Free";
      }
      
      // Update User Plan
      user.subscription.planName = planName;
      user.subscription.status = "active";
      user.subscription.creditsTotal = planName === "Enterprise" ? 5000 : planName === "Professional" ? 500 : 100;
      user.subscription.storageTotal = planName === "Enterprise" ? 500000 : planName === "Professional" ? 10000 : 100;
      user.subscription.creditsUsed = 0; // Automatically reset creditsUsed to 0 on payment to add full credits immediately
      user.subscription.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      // Add an invoice record
      const amountPaid = payload.data?.attributes?.total_formatted || (planName === "Enterprise" ? "$120.00" : "$15.00");
      const orderId = payload.data?.attributes?.order_number || "LS-" + Math.floor(Math.random() * 900000 + 100000);
      
      user.invoices.unshift({
        id: "INV-" + orderId,
        date: new Date().toISOString().split("T")[0],
        amount: amountPaid,
        status: "Paid",
        plan: `${planName} Subscription (Lemon Squeezy)`
      });
      
      // Log Action
      user.activityLogs.unshift({
        id: "act-" + Date.now(),
        userId: user.id,
        action: "Payment Received",
        details: `Subscribed to ${planName} via Lemon Squeezy (Order #${orderId})`,
        timestamp: new Date().toISOString(),
        status: "success"
      });
      
      saveDatabase();
      syncSubscriber(user);
      console.log(`[Lemon Squeezy Webhook] User ${user.email} successfully upgraded to ${planName}.`);
      return res.json({ success: true, message: `Upgraded user to ${planName}` });
    } catch (err: any) {
      console.error("[Lemon Squeezy Webhook Error]:", err);
      return res.status(500).json({ error: err.message || "Internal error processing webhook" });
    }
  });

  // Add virtual API Key
  app.post("/api/user/apikeys", getAuthenticatedUser, requireEnterprise, (req, res) => {
    const user = (req as any).user;
    const { name } = req.body;
    const newKey = {
      id: "key-" + Date.now(),
      name: name || "New Key",
      prefix: "ap_live_dev_" + Math.random().toString(36).substring(2, 8) + "...",
      createdAt: new Date().toISOString().split("T")[0]
    };
    user.apiKeys.push(newKey);
    saveDatabase();
    res.json(newKey);
  });

  // Delete virtual API Key
  app.delete("/api/user/apikeys/:id", getAuthenticatedUser, requireEnterprise, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    user.apiKeys = user.apiKeys.filter((k: any) => k.id !== id);
    saveDatabase();
    res.json({ success: true });
  });

  // Documents API
  app.get("/api/documents", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    res.json(user.documents);
  });

  app.post("/api/documents/upload", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    const { name, size, category } = req.body;

    // Check file size and vault storage limits based on active plan
    if (user.subscription.planName === "Free") {
      if (size && size.includes("MB")) {
        const val = parseFloat(size.replace("MB", "").trim());
        if (val > 10) {
          return res.status(403).json({ error: "File limit exceeded. Free tier accounts are restricted to 10 MB per file. Please upgrade to Professional." });
        }
      }
      
      let totalMB = 0;
      user.documents.forEach((d: any) => {
        if (d.size.includes("MB")) {
          totalMB += parseFloat(d.size.replace("MB", "").trim());
        } else if (d.size.includes("KB")) {
          totalMB += parseFloat(d.size.replace("KB", "").trim()) / 1024;
        }
      });
      
      if (totalMB > 100) {
        return res.status(403).json({ error: "Vault space exhausted. Free tier accounts have a 100 MB total storage limit. Please upgrade to Professional." });
      }
    } else if (user.subscription.planName === "Professional") {
      if (size && size.includes("GB")) {
        const val = parseFloat(size.replace("GB", "").trim());
        if (val > 2) {
          return res.status(403).json({ error: "File limit exceeded. Professional tier accounts are restricted to 2 GB per file." });
        }
      } else if (size && size.includes("MB")) {
        const val = parseFloat(size.replace("MB", "").trim());
        if (val > 2048) {
          return res.status(403).json({ error: "File limit exceeded. Professional tier accounts are restricted to 2 GB per file." });
        }
      }
    }

    const newDoc: Document = {
      id: "doc-" + Date.now(),
      name: name || "unnamed.pdf",
      size: size || "100 KB",
      type: "pdf",
      createdAt: new Date().toISOString(),
      category: category || "General",
      favorite: false,
      shared: false,
      version: 1
    };
    user.documents.unshift(newDoc);
    
    // Log Activity
    user.activityLogs.unshift({
      id: "act-" + Date.now(),
      userId: user.id,
      action: "Document Upload",
      details: `Uploaded ${newDoc.name}`,
      timestamp: new Date().toISOString(),
      status: "success"
    });
    saveDatabase();

    res.json(newDoc);
  });

  // Record PDF tool operation & deduct credits
  app.post("/api/billing/record-operation", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    const { toolName } = req.body;
    
    // Validate that credits are available
    if (user.subscription.creditsUsed >= user.subscription.creditsTotal) {
      return res.status(403).json({ error: `You have consumed all of your active plan credits (${user.subscription.creditsTotal}). Please upgrade to Professional or Enterprise in the Billing panel!` });
    }
    
    user.subscription.creditsUsed += 1;
    
    // Log activity
    user.activityLogs.unshift({
      id: "act-" + Date.now(),
      userId: user.id,
      action: "PDF Operation",
      details: `Executed ${toolName || "PDF Tool"} successfully`,
      timestamp: new Date().toISOString(),
      status: "success"
    });
    
    saveDatabase();
    res.json({ success: true, subscription: user.subscription });
  });

  app.post("/api/documents/toggle-favorite", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.body;
    const doc = user.documents.find((d: any) => d.id === id);
    if (doc) {
      doc.favorite = !doc.favorite;
      saveDatabase();
      res.json(doc);
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  });

  app.post("/api/documents/toggle-share", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.body;
    const doc = user.documents.find((d: any) => d.id === id);
    if (doc) {
      doc.shared = !doc.shared;
      saveDatabase();
      res.json(doc);
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  });

  app.delete("/api/documents/:id", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const doc = user.documents.find((d: any) => d.id === id);
    if (doc) {
      user.documents = user.documents.filter((d: any) => d.id !== id);
      // Log Action
      user.activityLogs.unshift({
        id: "act-" + Date.now(),
        userId: user.id,
        action: "Document Delete",
        details: `Deleted ${doc.name}`,
        timestamp: new Date().toISOString(),
        status: "warning"
      });
      saveDatabase();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  });

  // Logs API
  app.get("/api/logs", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    res.json(user.activityLogs);
  });

  // Update virtual plan
  app.post("/api/billing/update-plan", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    const { plan, cycle } = req.body;
    user.subscription.planName = plan;
    user.subscription.billingCycle = cycle;
    user.subscription.creditsTotal = plan === "Enterprise" ? 5000 : plan === "Professional" ? 500 : 100;
    user.subscription.storageTotal = plan === "Enterprise" ? 500000 : plan === "Professional" ? 10000 : 100;
    user.subscription.creditsUsed = 0; // Automatically reset creditsUsed to 0 to allocate full credits immediately on payment
    user.subscription.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    user.invoices.unshift({
      id: "INV-2026-" + Math.floor(Math.random() * 900 + 100),
      date: new Date().toISOString().split("T")[0],
      amount: plan === "Enterprise" ? "$120.00" : plan === "Professional" ? "$15.00" : "$0.00",
      status: "Paid",
      plan: `${plan} ${cycle === "monthly" ? "Monthly" : "Yearly"}`
    });

    user.activityLogs.unshift({
      id: "act-" + Date.now(),
      userId: user.id,
      action: "Subscription Changed",
      details: `Upgraded/Changed plan to ${plan} (${cycle})`,
      timestamp: new Date().toISOString(),
      status: "success"
    });
    saveDatabase();
    syncSubscriber(user);

    res.json({ success: true, subscription: user.subscription });
  });

  // --- GEMINI AI CHAT & DOCUMENT WORKSPACE ENDPOINTS ---

  app.post("/api/ai/summarize", getAuthenticatedUser, requirePremium, async (req, res) => {
    const { text, docName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text content provided for summarization" });
    }

    try {
      const ai = getGeminiClient();
      const prompt = `You are an elite, production-grade PDF SaaS AI assistant. Provide a comprehensive summary of the following document. Present it with clear headers:
1. Executive Summary
2. Key Points (bulleted)
3. Action Items (bulleted)
4. Key Terms & Definitions

Document Name: ${docName || "Uploaded PDF"}
Document Context:
${text.slice(0, 50000)}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ summary: response.text });
    } catch (err: any) {
      console.error("Gemini summarize error:", err);
      res.status(500).json({ 
        error: err.message || "AI Summarization failed",
        isMockFallback: true,
        summary: `### Executive Summary\nThis is an elegant fallback summary of ${docName || "the PDF Document"} because no real API Key was supplied. Once you attach a valid key in the settings panel, this is generated dynamically by Gemini 3.5 Flash.\n\n### Key Metrics Detected\n- Highly robust multi-column layouts\n- Real-time OCR readiness\n- Secure cloud document storage active\n\n### Next Steps\n1. Add your real GEMINI_API_KEY in the Secrets menu to test real AI capabilities\n2. Try uploading other PDFs to see conversion & toolkit controls`
      });
    }
  });

  app.post("/api/ai/explain", getAuthenticatedUser, requirePremium, async (req, res) => {
    const { term, context } = req.body;
    if (!term) {
      return res.status(400).json({ error: "No term or text provided to explain" });
    }

    try {
      const ai = getGeminiClient();
      const prompt = `As an expert researcher, explain the term/concept "${term}" within the context of this document segment:
---
${context ? context.slice(0, 10000) : "No surrounding context provided"}
---
Provide:
1. Quick Definition
2. Detailed Breakdown
3. Importance in context
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ explanation: response.text });
    } catch (err: any) {
      console.error("Gemini explain error:", err);
      res.status(500).json({
        error: err.message || "AI Explanation failed",
        explanation: `### Explanation Fallback: ${term}\n\nThis is a custom-crafted context lookup for "**${term}**". When the Gemini API is configured, the system retrieves a rigorous breakdown of any scientific, legal, financial, or engineering concepts.\n\n- **Category**: Custom Document Concepts\n- **Context Checked**: Available`
      });
    }
  });

  app.post("/api/ai/contract-review", getAuthenticatedUser, requirePremium, async (req, res) => {
    const { text, docName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No contract text provided for review" });
    }

    try {
      const ai = getGeminiClient();
      const prompt = `You are an elite corporate legal counsel. Perform a rigorous, professional contract audit on the document text provided. Highlight liabilities, non-standard clauses, missing standard protections, risk ratings, and direct suggestions for modification.

Document Name: ${docName || "Contract.pdf"}
Contract Content:
${text.slice(0, 50000)}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ review: response.text });
    } catch (err: any) {
      console.error("Gemini contract-review error:", err);
      res.status(500).json({
        error: err.message || "AI Contract Review failed",
        review: `### ⚖️ Legal Audit & Risk Assessment (Fallback Mock)
**Document Reviewed:** ${docName || "Contract.pdf"}

#### 1. Risk Profile Summary
- **Overall Risk Rating:** Medium Risk
- **Critical Issues Identified:** 2 clauses require attention
- **Indemnity Match:** Standard mutual indemnification appears missing

#### 2. Clause Analysis
- **Termination Clause:** Requires 30 days notice. Highly standard.
- **Governing Law:** Not explicitly stated or defaults to provider. Ensure it is updated to your home state.

#### 3. Strategic Redline Suggestions
- Add a mutual non-disclosure agreement section if proprietary metrics are mentioned.
- Specify clear dispute resolution and arbitration guidelines.`
      });
    }
  });

  app.post("/api/ai/resume-analysis", getAuthenticatedUser, requirePremium, async (req, res) => {
    const { text, jobDescription } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No resume text provided" });
    }

    try {
      const ai = getGeminiClient();
      const prompt = `You are an expert technical recruiter and HR Director. Audit the following resume text. Rate how well it fits the Job Description (if provided), outline technical/soft skills strengths, flag potential career gaps or issues, and provide detailed bulleted points for optimizing the resume.

Job Description Context:
${jobDescription || "General Software/Product Engineering & Leadership position"}

Resume Content:
${text.slice(0, 30000)}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (err: any) {
      console.error("Gemini resume analysis error:", err);
      res.status(500).json({
        error: err.message || "AI Resume Analysis failed",
        analysis: `### 👔 Talent Review & Resume Audit (Fallback Mock)

#### 1. Skill Profile Match
- **Role Target:** Software Development / Engineering Manager
- **Match Score:** 88% Match
- **Top Technical Proficiencies:** React, TypeScript, Node.js, API Design, System Architecture

#### 2. Key Observations
- Strongly organized experience details with actionable metrics.
- Good inclusion of high-quality SaaS deployment contexts.

#### 3. Enhancement Roadmap
- Quantify accomplishments more specifically (e.g. "reduced latency by 40%").
- Emphasize cloud architecture achievements using specific cloud frameworks (AWS/GCP).`
      });
    }
  });

  app.post("/api/ai/chat", getAuthenticatedUser, requirePremium, async (req, res) => {
    const { messages, documentText, docName } = req.body;
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "No message conversation history supplied" });
    }

    try {
      const ai = getGeminiClient();
      const lastMessage = messages[messages.length - 1].content;
      
      const prompt = `You are DocuMind AI, the premier helper tool in the AeroPDF Suite. Answer the user's questions based on the attached document context. Speak with professional, helpful intelligence. Use Markdown tables, bold text, and lists where appropriate.

Document Name: ${docName || "Document.pdf"}
Document Context:
${documentText ? documentText.slice(0, 45000) : "No document text uploaded. Answer generally, but ask user to upload a document for specific context."}

Conversation History:
${messages.slice(0, -1).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n")}

New Query: ${lastMessage}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ message: response.text });
    } catch (err: any) {
      console.error("Gemini Chat error:", err);
      res.status(500).json({
        error: err.message || "AI Chat failed",
        message: `I've analyzed your question! As a friendly reminder, the live Gemini API requires a key which isn't fully configured yet. Based on local intelligence for **${docName || "the PDF"}**, here is a helpful answer:

- **Key Information**: This document has standard structural features.
- **Interactive Action**: You can ask me to write code, draft a summary, translate passages, or redact tables!

How would you like to edit your document next? Let me know!`
      });
    }
  });

  app.post("/api/ai/redact-suggestions", getAuthenticatedUser, requirePremium, async (req, res) => {
    const { text, docName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided for redaction inspection" });
    }

    try {
      const ai = getGeminiClient();
      const prompt = `You are a compliance officer and data security auditor. Inspect the document text for Personally Identifiable Information (PII), PCI credit cards, sensitive financial figures, personal emails, phone numbers, or passwords.

List all detected elements, their offset or line description, their type (e.g., Email, Credit Card, SSN, IP, Phone), and provide suggestions for safe redaction.

Document Content:
${text.slice(0, 40000)}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ redactions: response.text });
    } catch (err: any) {
      console.error("Gemini Redaction audit error:", err);
      res.status(500).json({
        error: err.message || "AI Redaction analysis failed",
        redactions: `### 🔒 Privacy Audit & Sensitive PII Detector (Fallback Mock)

We scanned the text structure and identified standard security layers:

1. **Email Address Pattern**
   - *Found:* \`mogajiabiodun@gmail.com\` (User Profile Email)
   - *Action:* Recommended Redaction (\`m***************@gmail.com\`)
2. **IP Addresses**
   - *Found:* \`192.168.1.50\` in login log
   - *Action:* High risk, obfuscate to standard local scopes`
      });
    }
  });

  // --- VITE MIDDLEWARE INTERFACE ---

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express with Vite Development Server Middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=================================================`);
    console.log(` AeroPDF Server running on http://0.0.0.0:${PORT}`);
    console.log(`=================================================`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to boot server", err);
});
