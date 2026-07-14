export type TabType =
  | "landing"
  | "dashboard"
  | "toolkit"
  | "ai-workspace"
  | "documents"
  | "billing"
  | "admin"
  | "documentation"
  | "support";

export interface PDFDocument {
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

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  status: "success" | "warning" | "error";
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  plan: string;
}

export interface SubscriptionInfo {
  planName: "Free" | "Professional" | "Enterprise";
  status: "active" | "past_due" | "canceled";
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  creditsUsed: number;
  creditsTotal: number;
  storageUsed: number;
  storageTotal: number;
}

export interface APIKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: string;
  totalDocumentsProcessed: number;
  activeJobs: number;
  systemCpu: string;
  systemMemory: string;
  storageUsageTotal: string;
  recentLogs: ActivityLog[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type PDFToolId =
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "delete-pages"
  | "organize"
  | "watermark"
  | "protect"
  | "unlock"
  | "metadata"
  | "ocr"
  | "convert-img"
  | "convert-md"
  | "sign"
  | "form-fill"
  | "pdf-to-word"
  | "pdf-to-excel"
  | "pdf-to-ppt"
  | "pdf-to-jpg"
  | "word-to-pdf"
  | "excel-to-pdf"
  | "ppt-to-pdf"
  | "edit-text";

export interface PDFTool {
  id: PDFToolId;
  name: string;
  description: string;
  category: "organize" | "optimize" | "security" | "conversion" | "edit";
  badge?: string;
}
