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

// Boot database
loadDatabase();

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

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
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
        creditsTotal: 50,
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
    const user = dbData.users.find(u => u.username.toLowerCase() === normalizedUsername);

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

  // Get current subscription & stats
  app.get("/api/user/subscription", getAuthenticatedUser, (req, res) => {
    const user = (req as any).user;
    res.json({
      subscription: user.subscription,
      invoices: user.invoices,
      apiKeys: user.apiKeys
    });
  });

  // Add virtual API Key
  app.post("/api/user/apikeys", getAuthenticatedUser, (req, res) => {
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
  app.delete("/api/user/apikeys/:id", getAuthenticatedUser, (req, res) => {
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
    user.subscription.creditsTotal = plan === "Enterprise" ? 5000 : plan === "Professional" ? 500 : 50;
    user.subscription.storageTotal = plan === "Enterprise" ? 500000 : plan === "Professional" ? 10000 : 100;
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

    res.json({ success: true, subscription: user.subscription });
  });

  // --- GEMINI AI CHAT & DOCUMENT WORKSPACE ENDPOINTS ---

  app.post("/api/ai/summarize", getAuthenticatedUser, async (req, res) => {
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

  app.post("/api/ai/explain", getAuthenticatedUser, async (req, res) => {
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

  app.post("/api/ai/contract-review", getAuthenticatedUser, async (req, res) => {
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

  app.post("/api/ai/resume-analysis", getAuthenticatedUser, async (req, res) => {
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

  app.post("/api/ai/chat", getAuthenticatedUser, async (req, res) => {
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

  app.post("/api/ai/redact-suggestions", getAuthenticatedUser, async (req, res) => {
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
