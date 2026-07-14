import { PDFTool } from "./types";

export const PDF_TOOLS: PDFTool[] = [
  // Organize
  { id: "merge", name: "Merge PDFs", description: "Combine multiple PDF files into a single document in any order.", category: "organize" },
  { id: "split", name: "Split PDF", description: "Extract specific page ranges or split each page into a separate file.", category: "organize" },
  { id: "rotate", name: "Rotate Pages", description: "Rotate specific pages or entire documents clockwise dynamically.", category: "organize" },
  { id: "delete-pages", name: "Delete Pages", description: "Remove unwanted pages from your document seamlessly.", category: "organize" },
  { id: "organize", name: "Reorder & Organize", description: "Rearrange pages, insert blank pages, or rotate specific pages.", category: "organize", badge: "Hot" },
  
  // Optimize
  { id: "compress", name: "Compress PDF", description: "Reduce file size while maintaining maximum quality and resolution.", category: "optimize" },
  { id: "ocr", name: "Optical Character Recognition (OCR)", description: "Convert scanned PDFs into searchable, selectable text documents.", category: "optimize", badge: "AI" },

  // Security
  { id: "protect", name: "Protect PDF", description: "Encrypt your PDF with strong passwords and access restrictions.", category: "security" },
  { id: "unlock", name: "Unlock PDF", description: "Remove owner security restrictions and passwords from authorized files.", category: "security" },
  { id: "metadata", name: "Metadata Editor", description: "Edit title, author, subject, keywords, and creation dates.", category: "security" },

  // Conversion
  { id: "convert-img", name: "Image to PDF", description: "Convert JPG, PNG, WebP, or SVG images into standardized PDFs.", category: "conversion" },
  { id: "convert-md", name: "Markdown / Text to PDF", description: "Compile stylized markdown or raw text into structured PDF pages.", category: "conversion" },
  { id: "pdf-to-word", name: "PDF to Word", description: "Convert your PDF documents into editable Microsoft Word DOCX files.", category: "conversion", badge: "Pro" },
  { id: "pdf-to-excel", name: "PDF to Excel", description: "Extract tables from your PDF files into structured Microsoft Excel spreadsheets.", category: "conversion", badge: "Pro" },
  { id: "pdf-to-ppt", name: "PDF to PowerPoint", description: "Convert PDF documents into editable Microsoft PowerPoint PPTX slides.", category: "conversion", badge: "Pro" },
  { id: "pdf-to-jpg", name: "PDF to JPG", description: "Extract pages from your PDF document as high-quality JPEG images.", category: "conversion" },
  { id: "word-to-pdf", name: "Word to PDF", description: "Convert Microsoft Word DOCX files into beautiful, standardized PDFs.", category: "conversion" },
  { id: "excel-to-pdf", name: "Excel to PDF", description: "Convert spreadsheet XLSX worksheets into cleanly formatted PDF reports.", category: "conversion" },
  { id: "ppt-to-pdf", name: "PPT to PDF", description: "Convert PowerPoint PPTX slide presentations into standard PDF files.", category: "conversion" },

  // Edit / Form
  { id: "sign", name: "Digital Signatures", description: "Draw, upload, or type your secure digital signature directly on pages.", category: "edit", badge: "Pro" },
  { id: "form-fill", name: "Fill PDF Forms", description: "Complete form fields, add checkboxes, radio buttons, or custom text.", category: "edit" },
  { id: "edit-text", name: "Edit Text", description: "Reflow paragraphs and edit text directly within your PDF document.", category: "edit", badge: "Hot" }
];

export const PRICING_PLANS = [
  {
    name: "Free",
    priceMonthly: "$0",
    priceYearly: "$0",
    description: "Perfect for quick, casual file updates.",
    features: [
      "100 monthly operations / credits",
      "Up to 10 MB per file limit",
      "Basic Merge, Split & Compress",
      "Standard client-side processing",
      "Ad-supported customer support"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Professional",
    priceMonthly: "$15",
    priceYearly: "$12",
    description: "Designed for power users & active creators.",
    features: [
      "Unlimited PDF operations",
      "Up to 2 GB per file limit",
      "Advanced AI Document Suite (Flash 3.5)",
      "High-speed OCR & Batch processing",
      "Full digital signing & Form creation",
      "Priority customer service (24/7)"
    ],
    cta: "Upgrade to Pro",
    popular: true
  },
  {
    name: "Enterprise",
    priceMonthly: "$120",
    priceYearly: "$99",
    description: "For corporate compliance, teams, and high-volume APIs.",
    features: [
      "Everything in Professional",
      "Collaborative Team Workspaces",
      "Unlimited secure Cloud Storage",
      "Dedicated developer API Key access",
      "SOC-2 compliance and SLA guarantees",
      "Custom branding & white-labeled portal"
    ],
    cta: "Contact Enterprise",
    popular: false
  }
];

export const FAQS = [
  {
    q: "How does the AI Document feature work?",
    a: "Our AI workspace leverages Google's advanced Gemini 3.5 models. When you upload a PDF, the text is securely extracted and analyzed to generate summaries, contract audits, resume coaching, or interactive chat answers instantly."
  },
  {
    q: "Is my personal data and document content secure?",
    a: "Absolutely. We enforce end-to-end transport encryption and immediate local data cleaning. Converted files are held in sandboxed memory and never shared with third parties or used for AI training models without explicit consent."
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, you can cancel, upgrade, or downgrade your subscription at any time. When canceled, you will retain access to your plan features until the end of your billing cycle."
  },
  {
    q: "Does your system support scanned documents?",
    a: "Yes! Our high-precision Optical Character Recognition (OCR) engine processes scanned files, handwriting, and photos to transform them into fully searchable and highlightable text formats."
  }
];

export const BLOG_POSTS = [
  {
    id: "blog-1",
    title: "Unlocking Productivity: The Ultimate Guide to AI PDF Summaries",
    excerpt: "Discover how legal and finance teams save up to 12 hours a week using next-generation LLM summaries for long-form reports.",
    date: "July 10, 2026",
    category: "Productivity",
    author: "Elena Vance"
  },
  {
    id: "blog-2",
    title: "Understanding SOC-2 and Cloud Document Compliance",
    excerpt: "What enterprise compliance guidelines mean for your cloud documents, and how to verify cryptographic security in digital signatures.",
    date: "June 28, 2026",
    category: "Security",
    author: "Marcus Brodie"
  },
  {
    id: "blog-3",
    title: "Top 5 PDF Secrets of High-Performance Legal Teams",
    excerpt: "From deep metadata scrubbing to structural page-level redaction, explore the processes elite legal councils use before filing.",
    date: "May 15, 2026",
    category: "Business",
    author: "Sarah Sterling"
  }
];

export const DOCUMENTATION_TABS = [
  {
    id: "getting-started",
    label: "Getting Started",
    content: `### Welcome to AeroPDF Suite

AeroPDF Suite is the absolute pinnacle of high-performance cloud document solutions. This platform empowers you to merge, compress, extract, protect, and augment your files with AI-driven summaries and audits.

#### Quick Start Guide:
1. **Choose a Tool**: Go to the **PDF Toolkit** tab to edit pages directly in the browser.
2. **AI Analysis**: Go to the **AI Workspace** to run audits or ask questions about complex contracts.
3. **Workspace Documents**: The **My Cloud Storage** tab lets you manage and pin important files with virtual folder structures.
4. **Developer APIs**: If you are on the Enterprise tier, generate secret API credentials instantly from your dashboard.`
  },
  {
    id: "api-reference",
    label: "API Reference",
    content: `### AeroPDF REST API Guide

Integrate high-speed PDF rendering, conversion, and metadata editing directly into your applications using our global JSON-based API structures.

#### Authentication
All requests must pass your secret bearer token in the headers:
\`\`\`bash
Authorization: Bearer ap_live_your_api_key_here
\`\`\`

#### Endpoints

##### 1. Merge PDF Documents
\`\`\`http
POST /api/v1/pdf/merge
Content-Type: multipart/form-data
\`\`\`
**Parameters:**
- \`files\`: Array of files to combine.

##### 2. Compress PDF
\`\`\`http
POST /api/v1/pdf/compress
Content-Type: multipart/form-data
\`\`\`
**Parameters:**
- \`file\`: The PDF document to optimize.
- \`quality\`: \`high\` | \`medium\` | \`low\`

##### 3. Searchable OCR
\`\`\`http
POST /api/v1/pdf/ocr
Content-Type: multipart/form-data
\`\`\`
**Parameters:**
- \`file\`: Image or scanned PDF.
- \`lang\`: \`eng\` | \`spa\` | \`deu\` | \`fra\``
  },
  {
    id: "security-compliance",
    label: "Security & Compliance",
    content: `### Enterprise Compliance & SOC-2 Overview

We treat data confidentiality with sacred importance. Below are our core protection standards designed for high-volume enterprise compliance.

#### Cryptographic Protections
- **Encryption in Transit**: Every connection is strictly locked under modern TLS 1.3 algorithms.
- **Encryption at Rest**: Files are held inside private buckets encrypted via AES-256 with key rotation.
- **Immediate Scrubbing**: When downloading or converting client-only files, temporary workspaces are fully sanitized using secure memory scrubbers within 15 minutes of completion.

#### Compliance Badges
- **SOC-2 Ready**: Document lineage, activity registries, and administrative auditing logs are continually captured.
- **GDPR & CCPA**: Exercise full control over your data with single-click Account Deletion in the Billing portal.`
  }
];
