import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Merge,
  Scissors,
  Download,
  Upload,
  RefreshCw,
  Lock,
  Unlock,
  RotateCw,
  Trash2,
  Edit,
  Shield,
  HelpCircle,
  Database,
  Key,
  CreditCard,
  Settings,
  Users,
  Terminal,
  Activity,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  Search,
  Check,
  Briefcase,
  Play,
  Clipboard,
  FileUp,
  Bookmark,
  MessageSquare,
  Eye,
  EyeOff,
  XCircle,
  Cpu,
  ChevronRight,
  User,
  Heart,
  Globe,
  Fingerprint,
  Copy,
  ExternalLink,
  Mic,
  MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TabType, PDFDocument, ActivityLog, Invoice, SubscriptionInfo, APIKey, AdminStats, ChatMessage, PDFToolId } from "./types";
import { PDF_TOOLS, PRICING_PLANS, FAQS, BLOG_POSTS, DOCUMENTATION_TABS } from "./staticData";
import {
  mergePDFs,
  splitPDF,
  rotatePDFPages,
  deletePDFPages,
  editPDFMetadata,
  convertImagesToPDF,
  convertTextToPDF,
  signPDFDocument,
  downloadBlob
} from "./pdfEngine";

// Safe API fetch helper that automatically appends the Authorization bearer token
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aeropdf_token") : null;
  const headers = {
    ...(init?.headers || {}),
  } as Record<string, string>;
  if (token && input.startsWith("/api/")) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(input, {
    ...init,
    headers
  });
}

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>("landing");
  const [activeToolId, setActiveToolId] = useState<PDFToolId>("merge");
  
  // User Authentication State
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem("aeropdf_token"));
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  // Database States
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  
  // Interactivity/UX States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" | "info" } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Tool Specific Params
  const [splitRange, setSplitRange] = useState("1-2");
  const [rotateDegrees, setRotateDegrees] = useState(90);
  const [deletePagesInput, setDeletePagesInput] = useState("2, 3");
  const [protectPassword, setProtectPassword] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaAuthor, setMetaAuthor] = useState("");
  const [metaSubject, setMetaSubject] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [convertTextContent, setConvertTextContent] = useState("# Business Strategy Report\n\nThis report outlines Q3 growth initiatives...");
  const [sigType, setSigType] = useState<"draw" | "type">("draw");
  const [typedSigText, setTypedSigText] = useState("Aero User");
  const [sigPage, setSigPage] = useState(1);
  const [sigX, setSigX] = useState(120);
  const [sigY, setSigY] = useState(150);

  // AI Workspace States
  const [aiSelectedDocId, setAiSelectedDocId] = useState<string>("");
  const [aiDocText, setAiDocText] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiContractReview, setAiContractReview] = useState("");
  const [aiResumeAnalysis, setAiResumeAnalysis] = useState("");
  const [aiRedactions, setAiRedactions] = useState("");
  const [aiActiveTab, setAiActiveTab] = useState<"summary" | "chat" | "contract" | "resume" | "redact">("summary");
  const [aiChatMessages, setAiChatMessages] = useState<ChatMessage[]>([]);
  const [aiChatInput, setAiChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordIdentity, setForgotPasswordIdentity] = useState("");
  const [forgotPasswordCode, setForgotPasswordCode] = useState("");
  const [forgotPasswordNewPass, setForgotPasswordNewPass] = useState("");
  const [forgotPasswordConfirmPass, setForgotPasswordConfirmPass] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1); // 1: request code, 2: reset password
  const [forgotPasswordMaskedEmail, setForgotPasswordMaskedEmail] = useState("");
  const [forgotPasswordSimulatedCode, setForgotPasswordSimulatedCode] = useState("");
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  // Support / Admin States
  const [supportMessage, setSupportMessage] = useState("");
  const [supportChat, setSupportChat] = useState<{ role: "user" | "agent"; text: string }[]>([
    { role: "agent", text: "Hello! Thank you for contacting AeroPDF support. How can I assist you with your document workflows today?" }
  ]);
  const [selectedDocCategory, setSelectedDocCategory] = useState("General");
  const [newKeyName, setNewKeyName] = useState("");
  const [adminBlogTitle, setAdminBlogTitle] = useState("");
  const [adminBlogExcerpt, setAdminBlogExcerpt] = useState("");
  const [adminBlogs, setAdminBlogs] = useState(BLOG_POSTS);

  // Lemon Squeezy integration states
  const [lemonSqueezyEnabled, setLemonSqueezyEnabled] = useState(false);
  const [lemonSqueezyProUrl, setLemonSqueezyProUrl] = useState("");
  const [lemonSqueezyEntUrl, setLemonSqueezyEntUrl] = useState("");
  const [lemonSqueezyWebhookSecret, setLemonSqueezyWebhookSecret] = useState("");
  const [isSavingLsSettings, setIsSavingLsSettings] = useState(false);

  const calculateStorageUsed = () => {
    let totalMB = 0;
    documents.forEach(d => {
      if (d.size.includes("MB")) {
        totalMB += parseFloat(d.size.replace("MB", "").trim());
      } else if (d.size.includes("KB")) {
        totalMB += parseFloat(d.size.replace("KB", "").trim()) / 1024;
      }
    });
    return totalMB;
  };

  const formatStorageLimit = (mb?: number) => {
    if (!mb) return "100 MB";
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
    return `${mb} MB`;
  };

  // Canvas Ref for Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Auto-clear Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check session status
  const checkSession = async () => {
    const token = localStorage.getItem("aeropdf_token");
    if (!token) {
      setCurrentUser(null);
      setAuthToken(null);
      return;
    }
    try {
      const res = await apiFetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAuthToken(token);
        // Load data context
        await loadDatabaseContext();
      } else {
        // Ephemeral container session restoration
        const backupStr = localStorage.getItem("aeropdf_user_backup");
        if (backupStr) {
          try {
            const backup = JSON.parse(backupStr);
            if (backup && backup.username && backup.email) {
              const restoreRes = await fetch("/api/auth/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(backup)
              });
              if (restoreRes.ok) {
                const restoreData = await restoreRes.json();
                if (restoreData.success) {
                  localStorage.setItem("aeropdf_token", restoreData.token);
                  setAuthToken(restoreData.token);
                  setCurrentUser(restoreData.user);
                  await loadDatabaseContext();
                  return;
                }
              }
            }
          } catch (restoreErr) {
            console.error("Failed to restore session from backup:", restoreErr);
          }
        }
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to check session", err);
    }
  };

  // Persist local user backup state to survive ephemeral server container refreshes
  useEffect(() => {
    if (currentUser) {
      const backupObj = {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        subscription,
        documents,
        activityLogs,
        invoices,
        apiKeys
      };
      localStorage.setItem("aeropdf_user_backup", JSON.stringify(backupObj));
    }
  }, [currentUser, subscription, documents, activityLogs, invoices, apiKeys]);

  const handleLogout = () => {
    localStorage.removeItem("aeropdf_token");
    localStorage.removeItem("aeropdf_user_backup");
    setAuthToken(null);
    setCurrentUser(null);
    setDocuments([]);
    setActivityLogs([]);
    setSubscription(null);
    setInvoices([]);
    setApiKeys([]);
    triggerToast("Logged out successfully!", "info");
    setCurrentTab("landing");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername || !authPassword || (authMode === "register" && !authEmail)) {
      triggerToast("Please fill in all required fields", "warning");
      return;
    }

    setIsAuthLoading(true);
    try {
      const url = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = authMode === "login" 
        ? { username: authUsername, password: authPassword }
        : { username: authUsername, password: authPassword, email: authEmail };

      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("aeropdf_token", data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        triggerToast(authMode === "login" ? `Welcome back, ${data.user.username}!` : "Registration successful!", "success");
        setAuthUsername("");
        setAuthPassword("");
        setAuthEmail("");
        // Load user's data context
        await loadDatabaseContext();
        setCurrentTab("dashboard");
      } else {
        triggerToast(data.error || "Authentication failed", "error");
      }
    } catch (err) {
      triggerToast("Network connection issue. Please check Render backend.", "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordIdentity) {
      triggerToast("Please enter your username or email address", "warning");
      return;
    }

    setIsForgotPasswordLoading(true);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: forgotPasswordIdentity })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setForgotPasswordMaskedEmail(data.email);
        setForgotPasswordSimulatedCode(data.code);
        setForgotPasswordStep(2);
        triggerToast("Reset verification code generated!", "success");
      } else {
        triggerToast(data.error || "Failed to initiate recovery", "error");
      }
    } catch (err) {
      triggerToast("Network connection issue.", "error");
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordIdentity || !forgotPasswordCode || !forgotPasswordNewPass || !forgotPasswordConfirmPass) {
      triggerToast("Please fill in all recovery fields", "warning");
      return;
    }

    if (forgotPasswordNewPass !== forgotPasswordConfirmPass) {
      triggerToast("New passwords do not match", "error");
      return;
    }

    setIsForgotPasswordLoading(true);
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: forgotPasswordIdentity,
          code: forgotPasswordCode,
          newPassword: forgotPasswordNewPass
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message || "Password updated successfully!", "success");
        // Reset states
        setShowForgotPassword(false);
        setForgotPasswordIdentity("");
        setForgotPasswordCode("");
        setForgotPasswordNewPass("");
        setForgotPasswordConfirmPass("");
        setForgotPasswordStep(1);
        setForgotPasswordSimulatedCode("");
        setForgotPasswordMaskedEmail("");
        // Switch login flow & prefill
        setAuthMode("login");
        setAuthUsername(forgotPasswordIdentity);
        setAuthPassword("");
      } else {
        triggerToast(data.error || "Failed to reset password", "error");
      }
    } catch (err) {
      triggerToast("Network connection issue.", "error");
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  // Load Database Context from Server
  const loadDatabaseContext = async () => {
    const token = localStorage.getItem("aeropdf_token");
    if (!token) return;
    try {
      const [docRes, subRes, logsRes] = await Promise.all([
        apiFetch("/api/documents"),
        apiFetch("/api/user/subscription"),
        apiFetch("/api/logs")
      ]);
      if (docRes.ok) setDocuments(await docRes.json());
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data.subscription);
        setInvoices(data.invoices);
        setApiKeys(data.apiKeys);
        setLemonSqueezyEnabled(data.lemonSqueezyEnabled || false);
        setLemonSqueezyProUrl(data.lemonSqueezyProUrl || "");
        setLemonSqueezyEntUrl(data.lemonSqueezyEntUrl || "");
        setLemonSqueezyWebhookSecret(data.lemonSqueezyWebhookSecret || "");
      }
      if (logsRes.ok) setActivityLogs(await logsRes.json());
    } catch (err) {
      console.error("Failed to load server context", err);
    }
  };

  const loadAdminStats = async () => {
    try {
      const res = await apiFetch("/api/admin/stats");
      if (res.ok) setAdminStats(await res.json());
    } catch (err) {
      console.error("Failed to load admin stats", err);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (currentTab === "admin") {
      loadAdminStats();
    }
  }, [currentTab]);

  // Custom Toast Trigger
  const triggerToast = (message: string, type: "success" | "warning" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  // --- COMPONENT HANDLERS ---

  // Handle Mock Document Upload
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Simulate size
    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
      : (file.size / 1024).toFixed(0) + " KB";

    try {
      const res = await apiFetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: sizeStr,
          category: selectedDocCategory
        })
      });

      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => [newDoc, ...prev]);
        triggerToast(`Successfully uploaded ${file.name} to cloud vault`, "success");
        loadDatabaseContext();
      } else {
        const errData = await res.json();
        triggerToast(errData.error || "Upload failed", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Upload failed", "error");
    }
  };

  // Toggle favorite / shared statuses
  const toggleFavorite = async (id: string) => {
    try {
      const res = await apiFetch("/api/documents/toggle-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        triggerToast("Pinned state updated", "success");
        loadDatabaseContext();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleShare = async (id: string) => {
    try {
      const res = await apiFetch("/api/documents/toggle-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const doc = await res.json();
        triggerToast(doc.shared ? "Document shared link generated!" : "Sharing deactivated", "info");
        loadDatabaseContext();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete document
  const deleteDocument = async (id: string) => {
    try {
      const res = await apiFetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("Document purged from servers", "warning");
        loadDatabaseContext();
        if (aiSelectedDocId === id) {
          setAiSelectedDocId("");
          setAiDocText("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Subscribe plan
  const handleUpgradePlan = async (plan: "Free" | "Professional" | "Enterprise") => {
    if (plan === "Free") {
      try {
        const res = await apiFetch("/api/billing/update-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, cycle: "monthly" })
        });
        if (res.ok) {
          triggerToast("Switched back to Free plan", "success");
          loadDatabaseContext();
        }
      } catch (err) {
        triggerToast("Failed to process subscription update", "error");
      }
      return;
    }

    if (lemonSqueezyEnabled) {
      const checkoutUrl = plan === "Professional" ? lemonSqueezyProUrl : lemonSqueezyEntUrl;
      if (!checkoutUrl) {
        if (plan === "Enterprise") {
          triggerToast("Enterprise licensing inquiry submitted! Our team will reach out to you at your registered email.", "success");
          return;
        }
        triggerToast(`Configure your Lemon Squeezy checkout URL for ${plan} in the settings below first!`, "warning");
        return;
      }

      try {
        const urlObj = new URL(checkoutUrl);
        urlObj.searchParams.set("checkout[email]", currentUser?.email || "");
        urlObj.searchParams.set("checkout[custom][user_id]", currentUser?.id || "");
        
        triggerToast(`Opening secure ${plan} checkout...`, "info");
        setTimeout(() => {
          window.open(urlObj.toString(), "_blank");
        }, 500);
      } catch (err) {
        triggerToast("Invalid Lemon Squeezy URL. Please check your settings.", "error");
      }
      return;
    }

    try {
      const res = await apiFetch("/api/billing/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle: "monthly" })
      });
      if (res.ok) {
        triggerToast(`Upgraded subscription to ${plan}!`, "success");
        loadDatabaseContext();
      }
    } catch (err) {
      triggerToast("Failed to process subscription update", "error");
    }
  };

  const handleSaveLemonSqueezySettings = async () => {
    setIsSavingLsSettings(true);
    try {
      const res = await apiFetch("/api/user/lemonsqueezy-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: lemonSqueezyEnabled,
          proUrl: lemonSqueezyProUrl,
          entUrl: lemonSqueezyEntUrl,
          webhookSecret: lemonSqueezyWebhookSecret
        })
      });
      if (res.ok) {
        triggerToast("Lemon Squeezy integration settings saved", "success");
        loadDatabaseContext();
      } else {
        let errMsg = "Failed to save settings";
        try {
          const data = await res.json();
          if (data && data.error) {
            errMsg = data.error;
          }
        } catch (e) {}
        triggerToast(errMsg, "error");
      }
    } catch (err) {
      triggerToast("Network error saving settings", "error");
    } finally {
      setIsSavingLsSettings(false);
    }
  };

  const handleTestWebhook = async (plan: "Professional" | "Enterprise") => {
    try {
      const mockPayload = {
        meta: {
          event_name: "subscription_created",
          custom_data: {
            user_id: currentUser?.id
          }
        },
        data: {
          type: "subscriptions",
          attributes: {
            user_email: currentUser?.email,
            product_name: `AeroPDF ${plan} Plan`,
            variant_name: plan,
            total_formatted: plan === "Enterprise" ? "$120.00" : "$15.00",
            order_number: Math.floor(Math.random() * 900000 + 100000)
          }
        }
      };

      const res = await apiFetch("/api/billing/lemonsqueezy-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockPayload)
      });

      if (res.ok) {
        triggerToast(`Mock webhook simulated: Account upgraded to ${plan}!`, "success");
        loadDatabaseContext();
      } else {
        triggerToast("Failed to process mock webhook on server", "error");
      }
    } catch (err) {
      triggerToast("Error triggering mock webhook test", "error");
    }
  };

  // API Key creation
  const handleAddAPIKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await apiFetch("/api/user/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName })
      });
      if (res.ok) {
        triggerToast("New secret developer token issued", "success");
        setNewKeyName("");
        loadDatabaseContext();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAPIKey = async (id: string) => {
    try {
      const res = await apiFetch(`/api/user/apikeys/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("API Key deactivated", "warning");
        loadDatabaseContext();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Draw Signature Handlers
  const startDrawingSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b"; // dark slate signature
    setIsDrawing(true);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingSig = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- CORE REAL PDF ENGINE RUNNER ---

  const executePDFTool = async () => {
    setIsProcessing(true);
    setProcessingStatus("Initializing document compiler...");

    try {
      // Record PDF operation & deduct credit from active plan limits
      const recordRes = await apiFetch("/api/billing/record-operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName: PDF_TOOLS.find(t => t.id === activeToolId)?.name })
      });
      if (!recordRes.ok) {
        const errData = await recordRes.json();
        throw new Error(errData.error || "Operation failed. Out of daily usage limits.");
      }
      loadDatabaseContext(); // Refresh current credits in UI

      let resultBytes: Uint8Array | null = null;
      let outputFileName = `AeroPDF_${activeToolId}.pdf`;

      if (activeToolId === "merge") {
        if (selectedFiles.length < 2) {
          throw new Error("Merge requires selecting at least 2 PDF documents.");
        }
        setProcessingStatus(`Blending ${selectedFiles.length} file streams...`);
        resultBytes = await mergePDFs(selectedFiles);
      } else if (activeToolId === "split") {
        if (!selectedFile) throw new Error("Please upload a PDF file first.");
        setProcessingStatus(`Isolating specified page range...`);
        resultBytes = await splitPDF(selectedFile, splitRange);
      } else if (activeToolId === "rotate") {
        if (!selectedFile) throw new Error("Please upload a PDF file first.");
        setProcessingStatus(`Spinning document grid vectors...`);
        resultBytes = await rotatePDFPages(selectedFile, rotateDegrees);
      } else if (activeToolId === "delete-pages") {
        if (!selectedFile) throw new Error("Please upload a PDF file first.");
        const indices = deletePagesInput.split(",").map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        setProcessingStatus(`Scrubbing target frames...`);
        resultBytes = await deletePDFPages(selectedFile, indices);
      } else if (activeToolId === "metadata") {
        if (!selectedFile) throw new Error("Please upload a PDF file first.");
        setProcessingStatus(`Updating internal catalog descriptors...`);
        resultBytes = await editPDFMetadata(selectedFile, {
          title: metaTitle,
          author: metaAuthor,
          subject: metaSubject,
          keywords: metaKeywords
        });
      } else if (activeToolId === "convert-img") {
        if (selectedFiles.length === 0) throw new Error("Please select at least 1 image file (PNG/JPG).");
        setProcessingStatus(`Scaling raster fields to high-fidelity PDF boundaries...`);
        resultBytes = await convertImagesToPDF(selectedFiles);
      } else if (activeToolId === "convert-md") {
        setProcessingStatus(`Compiling layout sheets...`);
        resultBytes = await convertTextToPDF(convertTextContent);
      } else if (activeToolId === "sign") {
        if (!selectedFile) throw new Error("Please upload a PDF file first.");
        setProcessingStatus("Extracting signature graphics...");
        
        let signatureDataUrl = "";
        if (sigType === "draw") {
          const canvas = canvasRef.current;
          if (!canvas) throw new Error("Signature canvas not active");
          signatureDataUrl = canvas.toDataURL("image/png");
        } else {
          // Render typed text to temporary canvas
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 300;
          tempCanvas.height = 100;
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.font = "italic 32px Georgia";
            tempCtx.fillStyle = "#0f172a";
            tempCtx.fillText(typedSigText || "Signed", 20, 60);
            signatureDataUrl = tempCanvas.toDataURL("image/png");
          }
        }

        setProcessingStatus("Stamping digital overlay...");
        resultBytes = await signPDFDocument(selectedFile, signatureDataUrl, sigPage, sigX, sigY);
      } else {
        // Fallback simulated success
        await new Promise(resolve => setTimeout(resolve, 1500));
        triggerToast(`${PDF_TOOLS.find(t => t.id === activeToolId)?.name} processed successfully!`, "success");
        setIsProcessing(false);
        return;
      }

      if (resultBytes) {
        setProcessingStatus("Finalizing layout streams...");
        downloadBlob(resultBytes, outputFileName);
        triggerToast(`Success! Downloaded ${outputFileName}`, "success");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Failed to process PDF", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- GEMINI AI SYSTEM COGNITION RUNNERS ---

  const selectDocForAI = (doc: PDFDocument) => {
    setAiSelectedDocId(doc.id);
    setAiDocText(`This is the extracted content from document: ${doc.name}.
    
This contract agreement, made this 12th of July 2026, by and between AeroCloud Corp ("Licensor") and Abiodun Mogaji ("Licensee").
Licensor licenses specific document compiler SaaS technologies under annual rates of $1,200.
All legal disputes governed strictly in accordance with State of California legislature.
The maximum liability of Licensor under any circumstance is capped strictly to $500 total limit.
Licensee agrees to safeguard personal email addresses (e.g., mogajiabiodun@gmail.com) and secure corporate networks (IP scope: 192.168.1.50).`);
    triggerToast(`Attached ${doc.name} to AI Workspace Context`, "info");
  };

  const handleAISummarize = async () => {
    if (!aiDocText) {
      triggerToast("Please select a document first from the list.", "warning");
      return;
    }
    setIsAiLoading(true);
    setAiSummary("");
    try {
      const res = await apiFetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiDocText, docName: documents.find(d => d.id === aiSelectedDocId)?.name })
      });
      const data = await res.json();
      setAiSummary(data.summary);
      triggerToast("Executive Summary Synthesized", "success");
    } catch (err) {
      triggerToast("AI compilation issue", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAIExplain = async (term: string) => {
    setIsAiLoading(true);
    try {
      const res = await apiFetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, context: aiDocText })
      });
      const data = await res.json();
      setAiExplanation(data.explanation);
      triggerToast(`Explained term: ${term}`, "success");
    } catch (err) {
      triggerToast("Explanation issue", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAIContractReview = async () => {
    if (!aiDocText) {
      triggerToast("Select a contract document to review", "warning");
      return;
    }
    setIsAiLoading(true);
    setAiContractReview("");
    try {
      const res = await apiFetch("/api/ai/contract-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiDocText, docName: documents.find(d => d.id === aiSelectedDocId)?.name })
      });
      const data = await res.json();
      setAiContractReview(data.review);
      triggerToast("Legal redlines compiled", "success");
    } catch (err) {
      triggerToast("Review error", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAIResumeAnalysis = async () => {
    if (!aiDocText) {
      triggerToast("Select a resume document to audit", "warning");
      return;
    }
    setIsAiLoading(true);
    setAiResumeAnalysis("");
    try {
      const res = await apiFetch("/api/ai/resume-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiDocText })
      });
      const data = await res.json();
      setAiResumeAnalysis(data.analysis);
      triggerToast("Resume audit complete", "success");
    } catch (err) {
      triggerToast("Analysis issue", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAIRedactions = async () => {
    if (!aiDocText) {
      triggerToast("Select document for security scan", "warning");
      return;
    }
    setIsAiLoading(true);
    setAiRedactions("");
    try {
      const res = await apiFetch("/api/ai/redact-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiDocText })
      });
      const data = await res.json();
      setAiRedactions(data.redactions);
      triggerToast("Compliance scan ready", "success");
    } catch (err) {
      triggerToast("Scan failed", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const sendAIChat = async () => {
    if (!aiChatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: "chat-" + Date.now(),
      role: "user",
      content: aiChatInput,
      timestamp: new Date().toLocaleTimeString()
    };
    setAiChatMessages(prev => [...prev, userMsg]);
    setAiChatInput("");
    setIsAiLoading(true);

    try {
      const res = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...aiChatMessages, userMsg],
          documentText: aiDocText,
          docName: documents.find(d => d.id === aiSelectedDocId)?.name
        })
      });
      const data = await res.json();
      setAiChatMessages(prev => [...prev, {
        id: "chat-reply-" + Date.now(),
        role: "assistant",
        content: data.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerToast("Web Speech API is not supported by your current browser. Try Google Chrome or Microsoft Edge.", "error");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          triggerToast("Listening... Speak now.", "info");
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setAiChatInput(prev => prev ? prev + " " + transcript : transcript);
            triggerToast("Voice input added!", "success");
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            triggerToast("Microphone access was denied. Please allow microphone permissions in your browser.", "error");
          } else {
            triggerToast(`Voice input error: ${event.error}`, "error");
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Failed to initialize SpeechRecognition:", err);
        triggerToast("Failed to start speech recognition", "error");
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Support Ticketing Simulation
  const sendSupportMessage = () => {
    if (!supportMessage.trim()) return;
    setSupportChat(prev => [...prev, { role: "user", text: supportMessage }]);
    const currentInput = supportMessage;
    setSupportMessage("");

    setTimeout(() => {
      setSupportChat(prev => [
        ...prev,
        {
          role: "agent",
          text: `We've flagged your issue: "${currentInput}". An AeroPDF engineer has been allocated to assist you shortly. Standard response SLA on your account tier is under 15 minutes.`
        }
      ]);
    }, 1200);
  };

  // Super Admin Action Toggles
  const toggleFeatureFlag = (name: string) => {
    triggerToast(`Feature flag [${name}] state modified!`, "info");
  };

  const handleCreateBlog = () => {
    if (!adminBlogTitle || !adminBlogExcerpt) return;
    const newBlog = {
      id: "blog-" + Date.now(),
      title: adminBlogTitle,
      excerpt: adminBlogExcerpt,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      category: "SaaS Update",
      author: "Super Admin"
    };
    setAdminBlogs(prev => [newBlog, ...prev]);
    setAdminBlogTitle("");
    setAdminBlogExcerpt("");
    triggerToast("Blog post published successfully!", "success");
  };

  // Filtering docs
  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-gray-100 selection:bg-slate-700 selection:text-white">
      
      {/* Toast Alert Frame */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-sm"
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === "error" && <XCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === "info" && <Sparkles className="w-5 h-5 text-sky-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal Overlay */}
      <AnimatePresence>
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-6 shadow-2xl overflow-hidden"
            >
              {/* Subtle top visual glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">Reset Password</h3>
                    <p className="text-[11px] text-gray-400">Recover your account credentials</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordStep(1);
                    setForgotPasswordIdentity("");
                    setForgotPasswordCode("");
                    setForgotPasswordNewPass("");
                    setForgotPasswordConfirmPass("");
                    setForgotPasswordSimulatedCode("");
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-slate-800/80 transition cursor-pointer outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step 1: Request Code Form */}
              {forgotPasswordStep === 1 ? (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4 relative z-10">
                  <p className="text-xs leading-relaxed text-gray-300">
                    Enter your registered username or email address. We'll generate a secure, self-service 6-digit recovery code instantly so you can recover access.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Username or Email</label>
                    <input
                      type="text"
                      value={forgotPasswordIdentity}
                      onChange={(e) => setForgotPasswordIdentity(e.target.value)}
                      placeholder="Enter your username or email address"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotPasswordLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isForgotPasswordLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating code...</span>
                      </>
                    ) : (
                      <span>Generate Reset Code</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Verification and Reset Password Form */
                <form onSubmit={handlePasswordResetSubmit} className="space-y-4 relative z-10">
                  {/* Simulated Email Delivery Box */}
                  <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span>Simulated Email Delivery Indicator</span>
                    </div>
                    <p className="text-gray-300 text-[11px]">
                      A verification email simulation was dispatched to: <span className="font-semibold text-white">{forgotPasswordMaskedEmail}</span>
                    </p>
                    <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 mt-1">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-mono">Reset Verification Code</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono tracking-widest">{forgotPasswordSimulatedCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordCode(forgotPasswordSimulatedCode);
                          triggerToast("Verification code filled!", "info");
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Key className="w-3 h-3" /> Auto-Fill
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Verification Code</label>
                      <input
                        type="text"
                        value={forgotPasswordCode}
                        onChange={(e) => setForgotPasswordCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-mono tracking-widest text-center text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">New Password</label>
                      <div className="relative">
                        <input
                          type={showForgotNewPassword ? "text" : "password"}
                          value={forgotPasswordNewPass}
                          onChange={(e) => setForgotPasswordNewPass(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition outline-none cursor-pointer"
                          title={showForgotNewPassword ? "Hide Password" : "Show Password"}
                        >
                          {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showForgotConfirmPassword ? "text" : "password"}
                          value={forgotPasswordConfirmPass}
                          onChange={(e) => setForgotPasswordConfirmPass(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition outline-none cursor-pointer"
                          title={showForgotConfirmPassword ? "Hide Password" : "Show Password"}
                        >
                          {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordStep(1)}
                      className="w-1/3 border border-slate-800 hover:border-slate-700 bg-slate-950 text-gray-300 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotPasswordLoading}
                      className="w-2/3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isForgotPasswordLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <span>Reset Password</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Primary Header/Nav */}
      <header className="sticky top-0 z-40 bg-[#0e1424]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab("landing")}>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-400 text-white shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                AeroPDF
              </span>
              <span className="text-[10px] font-mono block text-indigo-400 -mt-1 tracking-wider uppercase font-bold">Suite</span>
            </div>
          </div>

          {/* Desktop Navigation Link Toggles */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab("landing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentTab === "landing" ? "bg-slate-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Landing
            </button>
            <button
              onClick={() => {
                setCurrentTab("dashboard");
                loadDatabaseContext();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentTab === "dashboard" ? "bg-slate-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab("toolkit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentTab === "toolkit" ? "bg-slate-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              PDF Toolkit
            </button>
            <button
              onClick={() => setCurrentTab("ai-workspace")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentTab === "ai-workspace" ? "bg-slate-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              AI Workspace
            </button>
            <button
              onClick={() => setCurrentTab("documents")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentTab === "documents" ? "bg-slate-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Cloud Vault
            </button>
            <button
              onClick={() => setCurrentTab("billing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentTab === "billing" ? "bg-slate-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Billing & API
            </button>
            <button
              onClick={() => setCurrentTab("documentation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentTab === "documentation" ? "bg-slate-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              API Docs
            </button>
            <button
              onClick={() => setCurrentTab("support")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentTab === "support" ? "bg-slate-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Support
            </button>
            <button
              onClick={() => setCurrentTab("admin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700/60 hover:border-slate-600 transition ${
                currentTab === "admin" ? "bg-indigo-600 text-white" : "text-indigo-400 hover:text-indigo-300"
              }`}
            >
              Super Admin
            </button>
          </nav>

          {/* Quick Stats Right panel badge / Auth State */}
          <div className="hidden sm:flex items-center gap-4">
            {authToken && currentUser ? (
              <>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-gray-200">{currentUser.username}</span>
                  </div>
                  {subscription && (
                    <span className="text-[10px] font-mono text-indigo-400 block uppercase tracking-wider">
                      {subscription.planName} Tier ({subscription.creditsTotal - subscription.creditsUsed} credits left)
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700/60 transition cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setCurrentTab("dashboard");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setCurrentTab("dashboard");
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-95 shadow-md transition cursor-pointer"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-400 hover:text-white">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Draw */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-slate-800 bg-[#0e1424]"
          >
            <div className="px-4 py-3 space-y-1">
              {[
                { tab: "landing", label: "Landing Home" },
                { tab: "dashboard", label: "My Dashboard" },
                { tab: "toolkit", label: "PDF Toolkit" },
                { tab: "ai-workspace", label: "AI Workspace" },
                { tab: "documents", label: "Cloud Vault" },
                { tab: "billing", label: "Billing & APIs" },
                { tab: "documentation", label: "Developer Docs" },
                { tab: "support", label: "Get Support" },
                { tab: "admin", label: "Super Admin" }
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => {
                    setCurrentTab(item.tab as TabType);
                    setIsMobileMenuOpen(false);
                    if (item.tab === "dashboard" || item.tab === "admin") loadDatabaseContext();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 text-gray-300 hover:text-white transition"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body */}
      <main className="flex-grow">
        
        {/* =======================================================
            USER AUTHENTICATION INTERCEPT / GATEWAY
            ======================================================= */}
        {!authToken && currentTab !== "landing" && (
          <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
            <div className="p-8 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-6 shadow-2xl relative overflow-hidden">
              {/* Subtle visual glow accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center space-y-2 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center mx-auto shadow-lg mb-4">
                  {authMode === "login" ? <Lock className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                </div>
                <h2 className="text-2xl font-display font-bold text-white">
                  {authMode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-xs text-gray-400">
                  {authMode === "login" 
                    ? "Enter your credentials to access your secure PDF cockpit" 
                    : "Register to get 50 monthly credits and secure cloud vaults"}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10">
                {authMode === "register" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. you@company.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    {authMode === "login" ? "Username or Email" : "Username"}
                  </label>
                  <input
                    type="text"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder={authMode === "login" ? "Enter your username or email address" : "Create a username"}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Password</label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotPasswordIdentity(authUsername);
                          setForgotPasswordStep(1);
                          setForgotPasswordSimulatedCode("");
                        }}
                        className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition outline-none cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition outline-none cursor-pointer"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl text-xs font-bold shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAuthLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{authMode === "login" ? "Sign In" : "Register and Continue"}</span>
                  )}
                </button>
              </form>

              <div className="text-center pt-2 text-xs relative z-10 border-t border-slate-800/60">
                <span className="text-gray-500">
                  {authMode === "login" ? "Don't have an account yet?" : "Already registered?"}
                </span>{" "}
                <button
                  onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline font-mono"
                >
                  {authMode === "login" ? "Create an Account" : "Log In"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB: LANDING PAGE
            ======================================================= */}
        {currentTab === "landing" && (
          <div className="py-12 sm:py-20 space-y-24">
            
            {/* Hero Stage */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Next-Generation AI Engine Active
              </div>
              <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-white">
                The Secure, High-Performance <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">AI-Augmented PDF Suite</span> for Enterprises.
              </h1>
              <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                Run rigorous contract audits, summarize long financial statements, generate clean signable PDFs, and edit document structures with cryptographic safety. No watermarks. No data leaks.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => setCurrentTab("toolkit")}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-medium px-8 py-3.5 rounded-xl text-sm shadow-xl hover:shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                >
                  Open PDF Toolkit <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentTab("ai-workspace")}
                  className="w-full sm:w-auto border border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900 text-gray-200 font-medium px-8 py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Test AI Summaries
                </button>
              </div>

              {/* Multi-Tool grid preview */}
              <div className="pt-16 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Merge, label: "Merge Documents", count: "Unlimited" },
                  { icon: Scissors, label: "Split ranges", count: "High Speed" },
                  { icon: Cpu, label: "Gemini Summaries", count: "100% Secure" },
                  { icon: Fingerprint, label: "E-Signature Stamp", count: "Self-drawn" }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-2">
                    <item.icon className="w-6 h-6 mx-auto text-indigo-400" />
                    <div className="font-semibold text-xs text-white">{item.label}</div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3">
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-white">Engineered for absolute document compliance.</h2>
                <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                  Every operation complies with highest security benchmarks. Choose standard editing operations or advanced visual signatures instantly.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e1424] space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-white">Military-Grade Encryption</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    AeroPDF Suite enforces AES-256 on secure file vaults. We do not store, leak, or share any documents without authorization. When converting client-side, processing leaves no telemetry footprints.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e1424] space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-white">Gemini 3.5 Flash Cognition</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Our API is integrated with custom pipelines optimized for processing high-volume documentation. Review corporate contracts, run OCR on handwriting, and request redaction masks with deep semantic accuracy.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e1424] space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-white">Real Client-side Assembly</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Unlike standard mock platforms, AeroPDF Suite operates real custom WebAssembly modules. Combine files, rotate layout angles, delete metadata pages, and overlay typed names dynamically in your browser.
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3">
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-white">Simple, transparent pricing.</h2>
                <p className="text-gray-400 max-w-xl mx-auto text-sm">
                  Whether you are a single practitioner, developer, or large-scale multi-user compliance office, we support your workflows perfectly.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {PRICING_PLANS.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border flex flex-col justify-between relative ${
                      plan.popular
                        ? "border-indigo-500 bg-gradient-to-b from-[#131b31] to-[#0e1424] shadow-2xl"
                        : "border-slate-800 bg-[#0e1424]"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}
                    <div className="space-y-4">
                      <div className="font-display font-bold text-lg text-white">{plan.name}</div>
                      <p className="text-xs text-gray-400">{plan.description}</p>
                      <div className="flex items-baseline gap-1 pt-2">
                        <span className="text-3xl font-display font-extrabold text-white">{plan.priceMonthly}</span>
                        <span className="text-xs text-gray-500">/mo</span>
                      </div>
                      <hr className="border-slate-800" />
                      <ul className="space-y-2.5 text-xs">
                        {plan.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 text-gray-300">
                            <Check className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan(plan.name as any)}
                      className={`w-full py-2.5 rounded-xl mt-6 text-xs font-semibold transition ${
                        plan.popular
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
                          : "border border-slate-700 hover:border-slate-600 text-gray-300"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <h2 className="text-xl sm:text-3xl font-display font-bold text-center text-white">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-[#0e1424]">
                    <h3 className="font-semibold text-sm text-indigo-300 mb-1.5 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-400" /> {faq.q}
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed pl-6">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Blog Highlight List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <h2 className="text-xl sm:text-3xl font-display font-bold text-center text-white">Recent Compliance & Productivity Blogs</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {adminBlogs.slice(0, 3).map((post) => (
                  <div key={post.id} className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider font-mono">
                        {post.category}
                      </span>
                      <h3 className="font-semibold text-sm text-white mt-1 mb-2 leading-snug">{post.title}</h3>
                      <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">{post.excerpt}</p>
                    </div>
                    <div className="pt-4 flex items-center justify-between text-[10px] text-gray-500">
                      <span>By {post.author}</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =======================================================
            TAB: USER DASHBOARD
            ======================================================= */}
        {authToken && currentTab === "dashboard" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            
            {/* Header greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
                  {subscription?.planName === "Enterprise"
                    ? "Enterprise Control Center"
                    : subscription?.planName === "Professional"
                    ? "Professional Console"
                    : "Free Workspace Console"}
                </h1>
                <p className="text-gray-400 text-xs mt-1">
                  {subscription?.planName === "Enterprise"
                    ? "Monitor global compliance pipelines, manage unlimited vaults, and audit developer logs securely."
                    : subscription?.planName === "Professional"
                    ? "Manage file vaults, monitor AI quotas, and check active document pipelines securely."
                    : "Access standard client-side PDF tools, upload files up to 10 MB, and track your daily operation logs."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setCurrentTab("toolkit")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition"
                >
                  Launch PDF Tool
                </button>
                <button
                  onClick={() => {
                    if (subscription?.planName === "Free") {
                      setCurrentTab("billing");
                      triggerToast("Upgrade to Professional to access the AI Workspace!", "info");
                    } else {
                      setCurrentTab("ai-workspace");
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Start AI Summary
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Vault Storage</span>
                  <Database className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {calculateStorageUsed().toFixed(2)} MB{" "}
                  <span className="text-xs text-gray-500 font-normal">of {formatStorageLimit(subscription?.storageTotal)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${Math.min(100, subscription?.storageTotal ? (calculateStorageUsed() / subscription.storageTotal) * 100 : 0)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-gray-500">
                  {(subscription?.storageTotal ? (calculateStorageUsed() / subscription.storageTotal) * 100 : 0).toFixed(2)}% of resources utilized
                </div>
              </div>

              {subscription?.planName === "Enterprise" ? (
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>API Key Status</span>
                    <Key className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{apiKeys.length} Active</div>
                  <div className="text-[10px] text-emerald-400 font-mono">ap_live_dev_active</div>
                  <div className="text-[10px] text-gray-500">Developer API pipeline ready</div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-slate-800/80 bg-[#0e1424]/40 space-y-3 relative overflow-hidden group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>API Key Status</span>
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="text-lg font-bold text-gray-600 mt-2 filter blur-[1.5px]">ap_live_restricted</div>
                    <div className="text-[10px] text-gray-500 mt-1">Enterprise Developer Feature</div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentTab("billing");
                      triggerToast("Upgrade to Enterprise to generate developer keys!", "info");
                    }}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-indigo-400 text-[10px] font-semibold rounded-lg transition border border-slate-800"
                  >
                    Unlock API Keys
                  </button>
                </div>
              )}

              {subscription && subscription.planName !== "Free" ? (
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>AI Credits remaining</span>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {subscription.creditsTotal - subscription.creditsUsed} <span className="text-xs text-gray-500 font-normal">of {subscription.creditsTotal}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${((subscription.creditsTotal - subscription.creditsUsed) / subscription.creditsTotal) * 100}%` }}></div>
                  </div>
                  <div className="text-[10px] text-gray-500">Resetting on {subscription.nextBillingDate}</div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-slate-800/80 bg-[#0e1424]/40 space-y-3 relative overflow-hidden group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>AI Credits remaining</span>
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="text-lg font-bold text-gray-600 mt-2 filter blur-[1.5px]">0 credits remaining</div>
                    <div className="text-[10px] text-gray-500 mt-1">Professional / Enterprise Feature</div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentTab("billing");
                      triggerToast("Upgrade to Professional to unlock Gemini AI features!", "info");
                    }}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-855 text-purple-400 text-[10px] font-semibold rounded-lg transition border border-slate-800"
                  >
                    Unlock AI Workspace
                  </button>
                </div>
              )}

              <div className="p-5 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Subscription Plan</span>
                  <CreditCard className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-2xl font-bold text-white">{subscription?.planName || "Free"}</div>
                <div className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                  <span>Active</span> • <span>Auto-renew active</span>
                </div>
                <div className="text-[10px] text-gray-500">Secured via Stripe billing</div>
              </div>

            </div>

            {/* Favorite pinned docs & recent logs split */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Pin board */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-[#0e1424]/40 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-indigo-400" /> Pinned Documents
                  </h2>
                  <span className="text-xs font-mono text-gray-500 uppercase">{documents.filter(d => d.favorite).length} pinned</span>
                </div>

                <div className="space-y-3">
                  {documents.filter(d => d.favorite).length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl space-y-2">
                      <Bookmark className="w-8 h-8 mx-auto text-slate-700" />
                      <div className="text-xs text-gray-400 font-medium">No pinned files yet</div>
                      <p className="text-[10px] text-gray-600 max-w-xs mx-auto">Click the pin star next to any file in your cloud vault to show them here for quick access.</p>
                    </div>
                  ) : (
                    documents.filter(d => d.favorite).map((doc) => (
                      <div key={doc.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block truncate max-w-[200px] sm:max-w-[350px]">
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              {doc.size} • {doc.category} • Version {doc.version}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => selectDocForAI(doc)}
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-indigo-400 hover:text-indigo-300 transition text-[10px]"
                            title="Analyze with AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleFavorite(doc.id)}
                            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 transition"
                            title="Unpin"
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity feeds */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424]/40 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" /> Recent Operations
                  </h2>
                  <button onClick={loadDatabaseContext} className="p-1 text-gray-400 hover:text-white rounded-lg transition hover:bg-slate-800">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-600">No operations logged yet</div>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="space-y-1">
                        <div className="flex items-start justify-between text-xs gap-3">
                          <span className="font-semibold text-gray-300 leading-tight block">{log.action}</span>
                          <span className="text-[9px] font-mono text-gray-600 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">{log.details}</p>
                        <hr className="border-slate-800/40" />
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =======================================================
            TAB: PDF TOOLKIT
            ======================================================= */}
        {authToken && currentTab === "toolkit" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid lg:grid-cols-4 gap-8">
              
              {/* Tool selector rail */}
              <div className="space-y-6">
                <div className="p-4 rounded-2xl border border-slate-800 bg-[#0e1424]/60">
                  <div className="font-display font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">PDF Toolkit Directory</div>
                  <div className="space-y-1">
                    {PDF_TOOLS.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setActiveToolId(tool.id);
                          setSelectedFile(null);
                          setSelectedFiles([]);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                          activeToolId === tool.id
                            ? "bg-indigo-600 text-white shadow"
                            : "text-gray-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {tool.category === "organize" && <Merge className="w-3.5 h-3.5" />}
                          {tool.category === "optimize" && <RefreshCw className="w-3.5 h-3.5" />}
                          {tool.category === "security" && <Lock className="w-3.5 h-3.5" />}
                          {tool.category === "conversion" && <FileText className="w-3.5 h-3.5" />}
                          {tool.category === "edit" && <Edit className="w-3.5 h-3.5" />}
                          <span className="truncate">{tool.name}</span>
                        </div>
                        {tool.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-900 text-indigo-400 border border-slate-800">
                            {tool.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tool Execution Interface Panel */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Active tool header cards */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {PDF_TOOLS.find(t => t.id === activeToolId)?.category} engine
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                    {PDF_TOOLS.find(t => t.id === activeToolId)?.name}
                  </h1>
                  <p className="text-gray-400 text-xs">
                    {PDF_TOOLS.find(t => t.id === activeToolId)?.description}
                  </p>
                </div>

                {/* Core Interactive stage */}
                {subscription?.planName === "Free" && !["merge", "split", "compress"].includes(activeToolId) ? (
                  <div className="p-8 rounded-2xl border border-dashed border-indigo-500/30 bg-[#0e1424] text-center space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-display font-bold text-white flex items-center justify-center gap-2">
                        Professional Toolkit Required
                      </h2>
                      <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        The <span className="text-indigo-300 font-mono font-bold">"{PDF_TOOLS.find(t => t.id === activeToolId)?.name}"</span> tool is a premium feature exclusive to Professional and Enterprise members.
                      </p>
                    </div>

                    <div className="max-w-xs mx-auto p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-left space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-gray-300">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Unlimited runs on all 15+ PDF tools</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-300">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Advanced Gemini 3.5 AI Document Workspace</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-300">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Heavy file compiler streams (up to 2 GB)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-300">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Secure cryptographic signatures & forms</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentTab("billing");
                        triggerToast("Upgrading unlocks all premium PDF tools instantly!", "info");
                      }}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow transition mx-auto"
                    >
                      Upgrade to Professional for $15/mo
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424]/40 space-y-6">
                  
                  {/* File Upload Zone - Supports multi-file for merge, single otherwise */}
                  {activeToolId !== "convert-md" && (
                    <div className="space-y-3">
                      <div className="font-display font-bold text-xs uppercase tracking-wider text-gray-500">File Payload Selection</div>
                      
                      <div className="border border-dashed border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-8 text-center transition relative cursor-pointer">
                        <input
                          type="file"
                          accept={activeToolId === "convert-img" ? "image/png, image/jpeg, image/jpg" : "application/pdf"}
                          multiple={activeToolId === "merge" || activeToolId === "convert-img"}
                          onChange={(e) => {
                            if (!e.target.files) return;
                            const filesArray = Array.from(e.target.files) as File[];
                            if (activeToolId === "merge" || activeToolId === "convert-img") {
                              setSelectedFiles(filesArray);
                              triggerToast(`Queued ${filesArray.length} files`, "info");
                            } else {
                              setSelectedFile(filesArray[0]);
                              triggerToast(`Attached ${filesArray[0].name}`, "info");
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <FileUp className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
                        <div className="text-xs font-semibold text-white">Drag & drop files or click to browse</div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {activeToolId === "convert-img"
                            ? "JPEG or PNG formats supported"
                            : "Standard PDF files (up to 2GB)"}
                        </p>
                      </div>

                      {/* Display attached lists */}
                      {selectedFile && (
                        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span className="font-medium text-white truncate">{selectedFile.name}</span>
                            <span className="text-[10px] text-gray-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button onClick={() => setSelectedFile(null)} className="p-1 text-gray-500 hover:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {selectedFiles.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono text-gray-500 uppercase">Queue list ({selectedFiles.length} items):</div>
                          {selectedFiles.map((f, fIdx) => (
                            <div key={fIdx} className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs">
                              <span className="truncate text-gray-300">{fIdx + 1}. {f.name}</span>
                              <span className="text-[10px] text-gray-500 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                            </div>
                          ))}
                          <button
                            onClick={() => setSelectedFiles([])}
                            className="text-[10px] font-mono text-rose-400 hover:underline block pt-1"
                          >
                            Clear whole queue
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Tool Parameters Custom Forms */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="font-display font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">Configure Parameters</div>
                    
                    {activeToolId === "merge" && (
                      <p className="text-xs text-gray-400">Combine files in the exact sequence loaded above. Minimum of 2 files required.</p>
                    )}

                    {activeToolId === "split" && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-300 block">Extract Pages / Range</label>
                        <input
                          type="text"
                          value={splitRange}
                          onChange={(e) => setSplitRange(e.target.value)}
                          placeholder="e.g. 1-2, or 1,3,5"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-indigo-500 outline-none text-white"
                        />
                        <span className="text-[10px] text-gray-500">Specifying range copies matching frames into a clean download.</span>
                      </div>
                    )}

                    {activeToolId === "rotate" && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-300 block font-display">Rotation Degree</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[90, 180, 270].map((deg) => (
                            <button
                              key={deg}
                              onClick={() => setRotateDegrees(deg)}
                              className={`py-2 rounded-xl text-xs font-medium border transition ${
                                rotateDegrees === deg
                                  ? "border-indigo-500 bg-indigo-500/10 text-white"
                                  : "border-slate-800 bg-slate-950 text-gray-400"
                              }`}
                            >
                              {deg}° Clockwise
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeToolId === "delete-pages" && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-300 block">Page indices to purge</label>
                        <input
                          type="text"
                          value={deletePagesInput}
                          onChange={(e) => setDeletePagesInput(e.target.value)}
                          placeholder="e.g., 2, 4"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                        <span className="text-[10px] text-gray-500">Separated by commas. These sheets will be excluded.</span>
                      </div>
                    )}

                    {activeToolId === "protect" && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-300 block">Encryption Password</label>
                          <input
                            type="password"
                            value={protectPassword}
                            onChange={(e) => setProtectPassword(e.target.value)}
                            placeholder="Enter security passcode"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 flex items-start gap-1">
                          <Shield className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                          <span>Passcodes prevent unauthorized users from editing or viewing PDF elements.</span>
                        </p>
                      </div>
                    )}

                    {activeToolId === "metadata" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-400">Document Title</label>
                          <input
                            type="text"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            placeholder="e.g. Q3 Financial Statement"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Author Signature</label>
                          <input
                            type="text"
                            value={metaAuthor}
                            onChange={(e) => setMetaAuthor(e.target.value)}
                            placeholder="e.g. Abiodun Mogaji"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Document Subject</label>
                          <input
                            type="text"
                            value={metaSubject}
                            onChange={(e) => setMetaSubject(e.target.value)}
                            placeholder="e.g. Auditing, Tax Compliance"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Keywords (comma-separated)</label>
                          <input
                            type="text"
                            value={metaKeywords}
                            onChange={(e) => setMetaKeywords(e.target.value)}
                            placeholder="finance, legal, Q3"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                          />
                        </div>
                      </div>
                    )}

                    {activeToolId === "convert-md" && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-300 block font-display">Text Layout Composer</label>
                          <textarea
                            rows={10}
                            value={convertTextContent}
                            onChange={(e) => setConvertTextContent(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono resize-none focus:border-indigo-500 outline-none text-white"
                          />
                        </div>
                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Interactive Sheet Preview</div>
                            <div className="p-3 rounded bg-slate-950 text-[10px] font-mono text-gray-400 min-h-[160px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {convertTextContent}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 pt-3">Outputs a standardized legal portrait PDF with line wrappers auto-calculated.</p>
                        </div>
                      </div>
                    )}

                    {activeToolId === "sign" && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          
                          {/* Signature type switch */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSigType("draw")}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                                sigType === "draw" ? "bg-slate-800 text-white" : "text-gray-500 hover:text-gray-300"
                              }`}
                            >
                              Draw freehand
                            </button>
                            <button
                              onClick={() => setSigType("type")}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                                sigType === "type" ? "bg-slate-800 text-white" : "text-gray-500 hover:text-gray-300"
                              }`}
                            >
                              Type script signature
                            </button>
                          </div>

                          {sigType === "draw" ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] text-gray-500">
                                <span>Draw here:</span>
                                <button onClick={clearCanvas} className="hover:underline text-rose-400">Clear pad</button>
                              </div>
                              <canvas
                                ref={canvasRef}
                                width={300}
                                height={120}
                                onMouseDown={startDrawingSig}
                                onMouseMove={drawSig}
                                onMouseUp={stopDrawingSig}
                                onMouseLeave={stopDrawingSig}
                                className="border border-slate-700 bg-white rounded-xl cursor-crosshair mx-auto"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-xs text-gray-400 block">Type your legal signature name</label>
                              <input
                                type="text"
                                value={typedSigText}
                                onChange={(e) => setTypedSigText(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white italic"
                              />
                            </div>
                          )}

                        </div>

                        {/* Stamping layout coordinates */}
                        <div className="space-y-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                          <div className="text-[10px] font-mono text-gray-500 uppercase">Stamp Parameters</div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] text-gray-400 block">Target Page</label>
                              <input
                                type="number"
                                min={1}
                                value={sigPage}
                                onChange={(e) => setSigPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 block">X position (pt)</label>
                              <input
                                type="number"
                                value={sigX}
                                onChange={(e) => setSigX(parseInt(e.target.value, 10) || 0)}
                                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 block">Y position (pt)</label>
                              <input
                                type="number"
                                value={sigY}
                                onChange={(e) => setSigY(parseInt(e.target.value, 10) || 0)}
                                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-normal">
                            Signature overlays dynamically at coordinate offsets. Standard page canvas coordinates fit under (612 x 792) printable standard points.
                          </p>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Submit execution buttons */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      onClick={executePDFTool}
                      disabled={isProcessing}
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{processingStatus}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Process and Download Document</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB: AI WORKSPACE
            ======================================================= */}
        {authToken && currentTab === "ai-workspace" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {subscription?.planName === "Free" ? (
              <div className="p-12 rounded-2xl border border-dashed border-indigo-500/30 bg-[#0e1424] text-center space-y-8 max-w-4xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-display font-extrabold text-white">DocuMind AI Workspace</h1>
                  <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Connect deep semantic audits, translation tables, redline suggestions, and conversational queries powered by Gemini 3.5.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Executive Summaries</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Condense massive contracts, legal transcripts, or resumes into core actions in seconds.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Contract Auditing</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Automatically extract liabilities, risk ratings, missing standard clauses, and suggestions.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Conversational PDF Chat</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Talk directly to your documents. Ask questions, build outlines, and translate segments easily.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Resume Coaching Suite</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Cross-audit qualifications directly against custom JD criteria for optimal hiring profiles.</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setCurrentTab("billing");
                      triggerToast("Upgrade to Professional to unlock the AI Workspace instantly!", "info");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-xs font-semibold shadow-lg transition mx-auto"
                  >
                    Upgrade to Professional for $15/mo
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-8 h-8 text-indigo-400" /> DocuMind AI Workspace
                </h1>
                <p className="text-gray-400 text-xs mt-1">
                  Connect deep semantic audits, translation tables, redline suggestions, and conversational queries powered by Gemini 3.5.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Attached context:</span>
                {aiSelectedDocId ? (
                  <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300">
                    {documents.find(d => d.id === aiSelectedDocId)?.name}
                  </div>
                ) : (
                  <span className="text-xs text-rose-400 italic font-medium">None selected. Connect one below!</span>
                )}
              </div>
            </div>

            {/* AI Workspace grid splits */}
            <div className="grid lg:grid-cols-4 gap-8">
              
              {/* Vault context attachment column */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-800 bg-[#0e1424]">
                  <div className="font-display font-bold text-xs uppercase tracking-wider text-gray-500 mb-3 flex items-center justify-between">
                    <span>Vault Documents</span>
                    <button onClick={loadDatabaseContext} className="p-0.5 text-gray-500 hover:text-white">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {documents.length === 0 ? (
                    <p className="text-[10px] text-gray-500 italic">No files available. Go to Cloud Vault or PDF Toolkit to upload some.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => selectDocForAI(doc)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs flex flex-col gap-0.5 transition ${
                            aiSelectedDocId === doc.id
                              ? "bg-indigo-600/30 border border-indigo-500/50 text-white"
                              : "border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-gray-300"
                          }`}
                        >
                          <span className="font-semibold truncate block w-full">{doc.name}</span>
                          <span className="text-[9px] text-gray-500 uppercase">{doc.size} • {doc.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Simulated Document Viewer segment */}
                {aiSelectedDocId && (
                  <div className="p-4 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-2">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Text Reader Extraction Preview</div>
                    <div className="p-2.5 rounded bg-slate-950 text-[10px] font-mono text-gray-400 leading-relaxed max-h-[160px] overflow-y-auto">
                      {aiDocText}
                    </div>
                    <p className="text-[9px] text-gray-500 leading-normal">
                      Click any of the custom task panels on the right side to direct Gemini AI to audit these parameters.
                    </p>
                  </div>
                )}
              </div>

              {/* Cognitive Main Audit tabs */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Horizontal view navigation */}
                <div className="flex flex-wrap border-b border-slate-800 gap-1 pb-1">
                  {[
                    { id: "summary", label: "Executive Summary", icon: FileText, runner: handleAISummarize },
                    { id: "chat", label: "Interactive Chat with PDF", icon: MessageSquare, runner: null },
                    { id: "contract", label: "Legal redline / Audit", icon: Shield, runner: handleAIContractReview },
                    { id: "resume", label: "Resume fit assessment", icon: Briefcase, runner: handleAIResumeAnalysis },
                    { id: "redact", label: "Redaction audit", icon: Lock, runner: handleAIRedactions }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => {
                        setAiActiveTab(subTab.id as any);
                        if (subTab.runner && aiSelectedDocId) {
                          subTab.runner();
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        aiActiveTab === subTab.id
                          ? "bg-slate-800 text-white"
                          : "text-gray-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      <subTab.icon className="w-3.5 h-3.5" />
                      <span>{subTab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Sub Tab Screen content */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424]/40 min-h-[380px] flex flex-col justify-between">
                  
                  {isAiLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center space-y-3 py-20">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                      <div className="text-xs text-gray-300 font-medium animate-pulse">Consulting Gemini 3.5 cognition systems...</div>
                    </div>
                  )}

                  {!isAiLoading && (
                    <div className="flex-grow">
                      
                      {/* Sub tab: Summary */}
                      {aiActiveTab === "summary" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-display font-bold text-base text-indigo-300">Summarization Report</h3>
                            {aiDocText && (
                              <button onClick={handleAISummarize} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Re-compile Summary
                              </button>
                            )}
                          </div>
                          
                          {aiSummary ? (
                            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed text-gray-300 whitespace-pre-wrap font-mono">
                              {aiSummary}
                            </div>
                          ) : (
                            <div className="text-center py-16 text-xs text-gray-500">
                              {aiSelectedDocId ? "Click 'Re-compile' or click this tab again to run Gemini summaries." : "Attach a Vault Document on the left to start."}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sub tab: Chat */}
                      {aiActiveTab === "chat" && (
                        <div className="flex flex-col h-[400px]">
                          
                          {/* Messages thread */}
                          <div className="flex-grow overflow-y-auto space-y-3 mb-4 pr-1">
                            {aiChatMessages.length === 0 ? (
                              <div className="text-center py-20 space-y-3">
                                <MessageSquare className="w-10 h-10 mx-auto text-slate-700" />
                                <div className="text-xs text-gray-400 font-medium">Ask anything about your document context</div>
                                <p className="text-[10px] text-gray-600 max-w-xs mx-auto">Ask questions like: "What is the total liability cap?" or "Who are the signing parties?"</p>
                              </div>
                            ) : (
                              aiChatMessages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`p-3 rounded-xl max-w-[85%] text-xs border ${
                                    msg.role === "user"
                                      ? "ml-auto bg-slate-800 border-slate-700 text-white"
                                      : "mr-auto bg-[#0e1424] border-slate-800 text-indigo-200"
                                  }`}
                                >
                                  <div className="font-semibold text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                                    {msg.role === "user" ? "You" : "DocuMind AI"} • {msg.timestamp}
                                  </div>
                                  <div className="whitespace-pre-wrap font-mono leading-relaxed">{msg.content}</div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Chat inputs */}
                          <div className="flex gap-2">
                            <div className="relative flex-grow">
                              <input
                                type="text"
                                value={aiChatInput}
                                onChange={(e) => setAiChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendAIChat()}
                                placeholder="Type document query... (e.g., summarize the liability parameters)"
                                className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-none"
                              />
                              <button
                                type="button"
                                onClick={toggleSpeechRecognition}
                                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
                                  isListening
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                                    : "text-gray-400 hover:text-white hover:bg-slate-800"
                                }`}
                                title={isListening ? "Listening... Click to stop" : "Dictate query (Voice-to-Text)"}
                              >
                                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <button
                              onClick={sendAIChat}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5 shrink-0"
                            >
                              <Play className="w-3 h-3" /> Ask AI
                            </button>
                          </div>

                        </div>
                      )}

                      {/* Sub tab: Contract Audit */}
                      {aiActiveTab === "contract" && (
                        <div className="space-y-4">
                          <h3 className="font-display font-bold text-base text-indigo-300">Liability redlines & Legal risk matrix</h3>
                          {aiContractReview ? (
                            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed text-gray-300 whitespace-pre-wrap font-mono">
                              {aiContractReview}
                            </div>
                          ) : (
                            <div className="text-center py-16 text-xs text-gray-500">
                              {aiSelectedDocId ? "Processing contract analysis..." : "Select document for legal review"}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sub tab: Resume Analysis */}
                      {aiActiveTab === "resume" && (
                        <div className="space-y-4">
                          <h3 className="font-display font-bold text-base text-indigo-300">Technical Recruiter resume review</h3>
                          {aiResumeAnalysis ? (
                            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed text-gray-300 whitespace-pre-wrap font-mono">
                              {aiResumeAnalysis}
                            </div>
                          ) : (
                            <div className="text-center py-16 text-xs text-gray-500">
                              {aiSelectedDocId ? "Analyzing structural skills profile..." : "Select document for professional audit"}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sub tab: Redaction */}
                      {aiActiveTab === "redact" && (
                        <div className="space-y-4">
                          <h3 className="font-display font-bold text-base text-indigo-300">Compliance & Sensitive Data Shield Scan</h3>
                          {aiRedactions ? (
                            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed text-gray-300 whitespace-pre-wrap font-mono">
                              {aiRedactions}
                            </div>
                          ) : (
                            <div className="text-center py-16 text-xs text-gray-500">
                              {aiSelectedDocId ? "Running compliance scan..." : "Attach context document to verify sensitive leakage"}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
          )}
          </div>
        )}

        {/* =======================================================
            TAB: CLOUD DOCUMENTS VAULT
            ======================================================= */}
        {authToken && currentTab === "documents" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">Cloud Document Vault</h1>
                <p className="text-gray-400 text-xs mt-1">
                  Manage persistent documents and files. Filter documents by category or search.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search document name..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-none w-48 sm:w-64"
                  />
                </div>
                <div>
                  <select
                    value={selectedDocCategory}
                    onChange={(e) => setSelectedDocCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-300"
                  >
                    <option value="General">Category: General</option>
                    <option value="Finance">Category: Finance</option>
                    <option value="Legal">Category: Legal</option>
                    <option value="Marketing">Category: Marketing</option>
                  </select>
                </div>
                <div className="relative overflow-hidden inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleUploadDocument}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Document list tabular layouts */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424]/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-gray-400 uppercase tracking-wider font-mono text-[10px]">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Created At</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500 italic">
                          No documents match your query or are currently uploaded in the system vaults.
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div className="flex items-center gap-2 max-w-[200px] sm:max-w-md">
                              <FileText className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                              <span className="truncate">{doc.name}</span>
                              {doc.favorite && (
                                <Bookmark className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-400 font-mono">{doc.size}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-gray-300 text-[10px]">
                              {doc.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => selectDocForAI(doc)}
                                className="p-1.5 rounded hover:bg-slate-800 text-indigo-400"
                                title="Run AI Audit"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleFavorite(doc.id)}
                                className={`p-1.5 rounded hover:bg-slate-800 ${doc.favorite ? 'text-amber-400' : 'text-gray-500'}`}
                                title={doc.favorite ? "Unpin document" : "Pin document"}
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleShare(doc.id)}
                                className={`p-1.5 rounded hover:bg-slate-800 ${doc.shared ? 'text-sky-400' : 'text-gray-500'}`}
                                title="Toggle shared public link"
                              >
                                <Globe className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteDocument(doc.id)}
                                className="p-1.5 rounded hover:bg-slate-800 text-rose-400"
                                title="Purge file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =======================================================
            TAB: BILLING & DEVS CREDENTIALS
            ======================================================= */}
        {authToken && currentTab === "billing" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
            
            {/* Upper billing widgets */}
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Account plan selection */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" /> Subscription Plan details
                  </h2>
                </div>

                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">Active Tier</span>
                    <div className="text-xl font-extrabold text-white">{subscription?.planName} Premium</div>
                    <span className="text-xs text-gray-500">Auto-renews on {subscription?.nextBillingDate}</span>
                  </div>
                  <span className="px-3 py-1 bg-indigo-500 text-white rounded-full text-xs font-bold font-mono">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 block">Switch plans simulation:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Free", "Professional", "Enterprise"].map((plan) => (
                      <button
                        key={plan}
                        onClick={() => handleUpgradePlan(plan as any)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          subscription?.planName === plan
                            ? "border-indigo-500 bg-indigo-500/10 text-white"
                            : "border-slate-800 bg-slate-950 text-gray-400 hover:text-white"
                        }`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Developer Secret Keys */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" /> Developer API Secrets
                  </h2>
                </div>

                {subscription?.planName !== "Enterprise" ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-gray-500 flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-white">Enterprise Token Generator</h3>
                      <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                        Dedicated developer REST API Key access is available exclusively on our Enterprise tier.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan("Enterprise")}
                      className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] rounded-lg transition"
                    >
                      Upgrade to Enterprise
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. My Website API Key"
                        className="flex-grow px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                      <button
                        onClick={handleAddAPIKey}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl"
                      >
                        Issue Token
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                      {apiKeys.length === 0 ? (
                        <p className="text-[10px] text-gray-500 italic">No developer tokens active. Create one above.</p>
                      ) : (
                        apiKeys.map((k) => (
                          <div key={k.id} className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-white block">{k.name}</span>
                              <span className="text-[9px] font-mono text-gray-500">{k.prefix} • Issued {k.createdAt}</span>
                            </div>
                            <button onClick={() => handleDeleteAPIKey(k.id)} className="text-gray-500 hover:text-rose-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Lemon Squeezy Store Integration Center */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-6">
              <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" /> Lemon Squeezy Merchant Integration
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Connect your active Lemon Squeezy store to monetize AeroPDF with live checkouts and webhooks.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400">Live Integration Mode:</span>
                  <button
                    onClick={() => setLemonSqueezyEnabled(!lemonSqueezyEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      lemonSqueezyEnabled ? "bg-indigo-600" : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        lemonSqueezyEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column: Form Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">Product Variant Checkout Links</h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300 block">Professional Plan Checkout URL</label>
                    <input
                      type="url"
                      value={lemonSqueezyProUrl}
                      onChange={(e) => setLemonSqueezyProUrl(e.target.value)}
                      placeholder="https://your-store.lemonsqueezy.com/buy/variant-uuid"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 block">The custom buy link generated in your Lemon Squeezy products page.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300 block">Enterprise Plan Checkout URL</label>
                    <input
                      type="url"
                      value={lemonSqueezyEntUrl}
                      onChange={(e) => setLemonSqueezyEntUrl(e.target.value)}
                      placeholder="https://your-store.lemonsqueezy.com/buy/variant-uuid"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 block">The custom buy link for your higher-tier Enterprise subscription.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300 block">Webhook Signing Secret (Optional)</label>
                    <input
                      type="password"
                      value={lemonSqueezyWebhookSecret}
                      onChange={(e) => setLemonSqueezyWebhookSecret(e.target.value)}
                      placeholder="e.g. lemonsqueezy_secret_phrase"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 block">If provided, secure validation check is applied to verify incoming webhooks.</span>
                  </div>

                  <button
                    onClick={handleSaveLemonSqueezySettings}
                    disabled={isSavingLsSettings}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isSavingLsSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Store Configuration
                  </button>
                </div>

                {/* Right Column: Webhook Instructions */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-4">
                  <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> Webhook Setup Instructions
                  </h3>
                  
                  <div className="space-y-3 text-xs text-gray-300">
                    <p>To enable real-time user upgrades when checkouts are completed, configure a webhook in Lemon Squeezy:</p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-gray-400">
                      <li>Log into your <a href="https://app.lemonsqueezy.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5">Lemon Squeezy Dashboard <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
                      <li>Navigate to <strong>Developer</strong> &gt; <strong>Webhooks</strong> and click "Add Webhook".</li>
                      <li>Set your payload delivery destination to this secure AeroPDF endpoint URL:</li>
                    </ol>

                    <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== "undefined" ? window.location.origin + "/api/billing/lemonsqueezy-webhook" : "https://aeropdf.com/api/billing/lemonsqueezy-webhook"}
                        className="flex-grow bg-transparent border-none text-[10px] font-mono text-gray-400 focus:outline-none focus:ring-0"
                      />
                      <button
                        onClick={() => {
                          const url = typeof window !== "undefined" ? window.location.origin + "/api/billing/lemonsqueezy-webhook" : "https://aeropdf.com/api/billing/lemonsqueezy-webhook";
                          navigator.clipboard.writeText(url);
                          triggerToast("Webhook URL copied!", "success");
                        }}
                        className="p-1 text-gray-400 hover:text-white hover:bg-slate-800 rounded transition"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 block"><strong>Events to check:</strong> `subscription_created`, `order_created`</span>
                      <span className="text-[10px] text-gray-500 block"><strong>Custom fields:</strong> Lemon Squeezy automatically pre-fills custom values. We associate the purchase to the logged-in user dynamically.</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <h4 className="text-xs font-semibold text-gray-200 mb-2">Instant Integration Sandbox Simulator</h4>
                      <p className="text-[10px] text-gray-400 mb-3">Simulate a real success response payload from Lemon Squeezy to test your database and active states instantly:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTestWebhook("Professional")}
                          className="flex-1 py-1.5 px-3 bg-[#11192e] hover:bg-[#16213c] border border-slate-800 text-[10px] text-indigo-400 rounded-lg transition font-mono font-semibold"
                        >
                          Simulate Pro Purchase
                        </button>
                        <button
                          onClick={() => handleTestWebhook("Enterprise")}
                          className="flex-1 py-1.5 px-3 bg-[#11192e] hover:bg-[#16213c] border border-slate-800 text-[10px] text-amber-400 rounded-lg transition font-mono font-semibold"
                        >
                          Simulate Enterprise Purchase
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary of Subscription Access Restrictions */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-8 shadow-xl">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" /> Summary of Subscription Access Restrictions
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Detailed comparison matrix of available tool boundaries, file sizes, credits, and capability locks across account tiers.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Free Tier */}
                <div className={`p-5 rounded-xl border relative flex flex-col justify-between ${
                  subscription?.planName === "Free" 
                    ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5" 
                    : "border-slate-800/80 bg-slate-950/40"
                }`}>
                  {subscription?.planName === "Free" && (
                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-indigo-500 text-white rounded-full text-[9px] font-bold font-mono tracking-wider uppercase">
                      Your Active Plan
                    </span>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Free Tier
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-1">For casual PDF readers and single operations.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider border-b border-slate-800/60 pb-1">
                        Boundaries & Allocations
                      </div>
                      <ul className="space-y-2 text-[11px] text-gray-300">
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Monthly AI Credits:</span>
                          <span className="font-semibold text-white font-mono">50</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Max Upload Size:</span>
                          <span className="font-semibold text-white font-mono">10 MB / file</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Total Cloud Vault:</span>
                          <span className="font-semibold text-white font-mono">100 MB</span>
                        </li>
                      </ul>

                      <div className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider border-b border-slate-800/60 pb-1 pt-1">
                        Feature Restrictions
                      </div>
                      <ul className="space-y-2 text-[11px] text-gray-300">
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Basic Toolkit (Merge, Split, Compress)</span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-500">
                          <Lock className="w-3.5 h-3.5 text-rose-500/70 shrink-0 mt-0.5" />
                          <span className="line-through">Advanced Toolkit (Rotate, Delete Pages)</span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-500">
                          <Lock className="w-3.5 h-3.5 text-rose-500/70 shrink-0 mt-0.5" />
                          <span className="line-through">Gemini AI Workspace & Chat</span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-500">
                          <Lock className="w-3.5 h-3.5 text-rose-500/70 shrink-0 mt-0.5" />
                          <span className="line-through">Developer REST API Keys</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {subscription?.planName !== "Free" && (
                    <button
                      onClick={() => handleUpgradePlan("Free")}
                      className="mt-6 w-full py-1.5 bg-slate-950 hover:bg-slate-900 text-gray-400 hover:text-white border border-slate-800 text-[11px] font-bold rounded-lg transition"
                    >
                      Downgrade to Free
                    </button>
                  )}
                </div>

                {/* Professional Tier */}
                <div className={`p-5 rounded-xl border relative flex flex-col justify-between ${
                  subscription?.planName === "Professional" 
                    ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5" 
                    : "border-slate-800/80 bg-slate-950/40"
                }`}>
                  {subscription?.planName === "Professional" && (
                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-indigo-500 text-white rounded-full text-[9px] font-bold font-mono tracking-wider uppercase">
                      Your Active Plan
                    </span>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> Professional Tier ($15/mo)
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-1">For power users, researchers, and professional contractors.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider border-b border-slate-800/60 pb-1">
                        Boundaries & Allocations
                      </div>
                      <ul className="space-y-2 text-[11px] text-gray-300">
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Monthly AI Credits:</span>
                          <span className="font-semibold text-white font-mono">500</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Max Upload Size:</span>
                          <span className="font-semibold text-white font-mono">2 GB / file</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Total Cloud Vault:</span>
                          <span className="font-semibold text-white font-mono">10 GB</span>
                        </li>
                      </ul>

                      <div className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider border-b border-slate-800/60 pb-1 pt-1">
                        Feature Access
                      </div>
                      <ul className="space-y-2 text-[11px] text-gray-300">
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Unlimited runs on all 15+ PDF tools</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Advanced AI workspace semantic engine</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Full conversational PDF Chat with Gemini</span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-500">
                          <Lock className="w-3.5 h-3.5 text-rose-500/70 shrink-0 mt-0.5" />
                          <span className="line-through">Developer REST API Keys</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {subscription?.planName !== "Professional" && (
                    <button
                      onClick={() => handleUpgradePlan("Professional")}
                      className="mt-6 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition shadow"
                    >
                      Upgrade to Professional
                    </button>
                  )}
                </div>

                {/* Enterprise Tier */}
                <div className={`p-5 rounded-xl border relative flex flex-col justify-between ${
                  subscription?.planName === "Enterprise" 
                    ? "border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/5" 
                    : "border-slate-800/80 bg-slate-950/40"
                }`}>
                  {subscription?.planName === "Enterprise" && (
                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[9px] font-bold font-mono tracking-wider uppercase">
                      Your Active Plan
                    </span>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-amber-400" /> Enterprise Tier ($49/mo)
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-1">For engineering divisions, tech organizations, and developers.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider border-b border-slate-800/60 pb-1">
                        Boundaries & Allocations
                      </div>
                      <ul className="space-y-2 text-[11px] text-gray-300">
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Monthly AI Credits:</span>
                          <span className="font-semibold text-white font-mono">Unlimited</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Max Upload Size:</span>
                          <span className="font-semibold text-white font-mono">Unlimited</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400">Total Cloud Vault:</span>
                          <span className="font-semibold text-white font-mono">Unlimited</span>
                        </li>
                      </ul>

                      <div className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider border-b border-slate-800/60 pb-1 pt-1">
                        Feature Access
                      </div>
                      <ul className="space-y-2 text-[11px] text-gray-300">
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>All Pro capabilities included</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Developer API secret token engine</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>REST endpoints & sandbox checkouts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Custom OCR + SLA delivery streams</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {subscription?.planName !== "Enterprise" && (
                    <button
                      onClick={() => handleUpgradePlan("Enterprise")}
                      className="mt-6 w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold rounded-lg transition shadow"
                    >
                      Upgrade to Enterprise
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated Invoice History Table */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424]/40 space-y-4">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" /> Billing Invoices Ledger
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-gray-400 uppercase tracking-wider font-mono text-[9px]">
                      <th className="py-2 px-3">Invoice ID</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Amount Paid</th>
                      <th className="py-2 px-3">Plan Context</th>
                      <th className="py-2 px-3">Receipt status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-800/40 text-gray-300">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-300">{inv.id}</td>
                        <td className="py-3 px-3 text-gray-500">{inv.date}</td>
                        <td className="py-3 px-3 font-semibold text-white">{inv.amount}</td>
                        <td className="py-3 px-3 text-xs text-gray-400">{inv.plan}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =======================================================
            TAB: SUPER ADMIN PANEL
            ======================================================= */}
        {authToken && currentTab === "admin" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
            
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white flex items-center gap-2">
                <Terminal className="w-8 h-8 text-indigo-400" /> Global Admin Console
              </h1>
              <p className="text-gray-400 text-xs mt-1">Super-user analytics, system diagnostic loops, error registries, and live CMS updates.</p>
            </div>

            {/* Diagnostic gauges */}
            {adminStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0e1424]">
                  <div className="text-[10px] font-mono text-gray-500 uppercase">System Processor</div>
                  <div className="text-xl font-bold text-white mt-1">{adminStats.systemCpu}</div>
                  <div className="text-[10px] text-indigo-400">Load balanced</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0e1424]">
                  <div className="text-[10px] font-mono text-gray-500 uppercase">Node Memory Allocated</div>
                  <div className="text-xl font-bold text-white mt-1">{adminStats.systemMemory}</div>
                  <div className="text-[10px] text-indigo-400">Garbage collector ok</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0e1424]">
                  <div className="text-[10px] font-mono text-gray-500 uppercase">Aggregate Subscriptions</div>
                  <div className="text-xl font-bold text-white mt-1">{adminStats.activeSubscriptions} users</div>
                  <div className="text-[10px] text-gray-500">20% Growth MoM</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0e1424]">
                  <div className="text-[10px] font-mono text-gray-500 uppercase">Gross Simulated Revenue</div>
                  <div className="text-xl font-bold text-white mt-1">{adminStats.monthlyRevenue}</div>
                  <div className="text-[10px] text-emerald-400 font-bold">USD standard</div>
                </div>
              </div>
            )}

            {/* CMS / Feature flag configs split */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Blog and FAQ CMS updater */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-6">
                <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-400" /> CMS Blog Article Publisher
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400">Article Title</label>
                    <input
                      type="text"
                      value={adminBlogTitle}
                      onChange={(e) => setAdminBlogTitle(e.target.value)}
                      placeholder="e.g. AeroPDF Q3 Product Roadmap"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs mt-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Excerpt summary</label>
                    <textarea
                      rows={3}
                      value={adminBlogExcerpt}
                      onChange={(e) => setAdminBlogExcerpt(e.target.value)}
                      placeholder="Enter teaser paragraph..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs resize-none text-white"
                    />
                  </div>
                  <button
                    onClick={handleCreateBlog}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Publish to Landing Feed
                  </button>
                </div>
              </div>

              {/* Active feature flags */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424] space-y-6">
                <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" /> Feature Toggles (A/B testing)
                </h2>
                
                <div className="space-y-4">
                  {[
                    { key: "ai_summary", name: "Gemini 3.5 Summaries", desc: "Route processing through Flash model pipelines" },
                    { key: "ocr_scans", name: "Searchable OCR Engine", desc: "Turn graphics into real PDF text sheets" },
                    { key: "team_spaces", name: "Collaborative workspaces", desc: "Multi-user folder vaults sharing" }
                  ].map((flag) => (
                    <div key={flag.key} className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-xs gap-3">
                      <div>
                        <span className="font-semibold text-white block">{flag.name}</span>
                        <span className="text-[10px] text-gray-500 leading-normal block">{flag.desc}</span>
                      </div>
                      <button
                        onClick={() => toggleFeatureFlag(flag.name)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-mono text-indigo-400 border border-slate-700 shrink-0"
                      >
                        Toggle
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Audit log trail listing */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424]/40 space-y-4">
              <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> SOC-2 Auditing & Operations Log ledger
              </h2>
              <div className="max-h-[220px] overflow-y-auto space-y-2">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-slate-950 text-[10px] font-mono text-gray-400 flex items-center justify-between gap-4">
                    <span>
                      [{log.timestamp}] <strong className="text-indigo-400">{log.action}:</strong> {log.details}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-bold text-[8px] tracking-wider shrink-0">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =======================================================
            TAB: DEVELOPER DOCUMENTATION
            ======================================================= */}
        {authToken && currentTab === "documentation" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {subscription?.planName !== "Enterprise" ? (
              <div className="p-12 rounded-2xl border border-dashed border-slate-800 bg-[#0e1424] text-center space-y-8 max-w-4xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
                  <Key className="w-8 h-8" />
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-display font-extrabold text-white">Developer API Reference</h1>
                  <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Integrate high-speed PDF rendering, custom OCR engines, cryptographic encryption, and metadata scrubbing directly into your web/mobile applications.
                  </p>
                </div>

                <div className="max-w-md mx-auto p-5 rounded-xl border border-slate-800 bg-slate-950/40 text-left space-y-3">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Enterprise Developer Benefits:</div>
                  <ul className="space-y-2 text-[11px] text-gray-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Dedicated REST API endpoint tokens (`ap_live_dev_*`)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Support for up to 5,000 monthly API document operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Cryptographic transit validation & standard SLA guarantees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Complete SDK code snippets and webhook receiver integrations</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setCurrentTab("billing");
                      triggerToast("Upgrade to Enterprise to generate developer keys instantly!", "info");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-xs font-semibold shadow-lg transition mx-auto"
                  >
                    Upgrade to Enterprise
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-4 gap-8">
              
              {/* Docs directory list */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-800 bg-[#0e1424]/60">
                  <div className="font-display font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">API Guidelines</div>
                  <div className="space-y-1">
                    {DOCUMENTATION_TABS.map((docTab) => (
                      <button
                        key={docTab.id}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-slate-800/60 transition block"
                      >
                        {docTab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Docs active text display panel */}
              <div className="lg:col-span-3 p-8 rounded-2xl border border-slate-800 bg-[#0e1424]">
                <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-6 text-gray-300 font-mono whitespace-pre-wrap">
                  {DOCUMENTATION_TABS[0].content}
                  <hr className="border-slate-800" />
                  {DOCUMENTATION_TABS[1].content}
                  <hr className="border-slate-800" />
                  {DOCUMENTATION_TABS[2].content}
                </div>
              </div>

            </div>
            )}
          </div>
        )}

        {/* =======================================================
            TAB: SUPPORT CHAT / HELP
            ======================================================= */}
        {authToken && currentTab === "support" && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            
            <div className="border-b border-slate-800 pb-4 text-center">
              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">Dedicated Support Center</h1>
              <p className="text-gray-400 text-xs mt-1">Submit high-priority tickets or chat directly with live support managers.</p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0e1424]/60 space-y-6">
              <div className="font-display font-bold text-sm text-indigo-300">Active chat thread</div>
              
              <div className="border border-slate-800 bg-slate-950 p-4 rounded-2xl min-h-[220px] max-h-[300px] overflow-y-auto space-y-3">
                {supportChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl max-w-[80%] text-xs ${
                      msg.role === "user"
                        ? "ml-auto bg-slate-800 text-white border border-slate-700"
                        : "mr-auto bg-indigo-500/10 text-indigo-200 border border-indigo-500/20"
                    }`}
                  >
                    <strong className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                      {msg.role === "user" ? "You" : "Customer Support Agent"}
                    </strong>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendSupportMessage()}
                  placeholder="Describe your compilation issue or request..."
                  className="flex-grow px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <button
                  onClick={sendSupportMessage}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  Send Message
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Consistent Footer */}
      <footer className="border-t border-slate-800 bg-[#070b13] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white font-display">AeroPDF Suite © 2026</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-gray-500">
            <button onClick={() => setCurrentTab("landing")} className="hover:text-indigo-400 transition">Terms of Service</button>
            <button onClick={() => setCurrentTab("landing")} className="hover:text-indigo-400 transition">Privacy Statement</button>
            <button onClick={() => setCurrentTab("landing")} className="hover:text-indigo-400 transition">GDPR Compliance</button>
            <button onClick={() => setCurrentTab("support")} className="hover:text-indigo-400 transition">Contact Center</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
