import { PDFDocument, degrees } from "pdf-lib";

/**
 * Helper to download a Uint8Array as a PDF file
 */
export function downloadBlob(data: Uint8Array, fileName: string) {
  const blob = new Blob([data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Real client-side merging of multiple PDF files
 */
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  if (files.length === 0) throw new Error("No files selected for merging.");
  
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
}

/**
 * Real client-side splitting of a PDF file by ranges (e.g. 1-2, or 3)
 */
export async function splitPDF(file: File, rangeString: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const totalPages = srcPdf.getPageCount();
  
  // Parse ranges, e.g. "1-2" or "1, 3, 5" or "2"
  const pagesToKeep: number[] = [];
  const parts = rangeString.split(",");
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) {
            pagesToKeep.push(i - 1); // 0-indexed in pdf-lib
          }
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pagesToKeep.push(pageNum - 1);
      }
    }
  }

  if (pagesToKeep.length === 0) {
    throw new Error(`Invalid page range. This PDF has ${totalPages} pages. Please specify ranges like: 1-2 or 1,3`);
  }

  const splitPdf = await PDFDocument.create();
  const copiedPages = await splitPdf.copyPages(srcPdf, pagesToKeep);
  copiedPages.forEach((page) => splitPdf.addPage(page));
  
  return await splitPdf.save();
}

/**
 * Real client-side page rotations
 */
export async function rotatePDFPages(file: File, rotationDegrees: number): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  
  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
  });
  
  return await pdfDoc.save();
}

/**
 * Real client-side page deletion
 */
export async function deletePDFPages(file: File, pageNumbers: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Sort descending so indices don't shift during removals
  const sortedIndicesToDelete = [...pageNumbers]
    .map(num => num - 1) // convert to 0-indexed
    .filter(idx => idx >= 0 && idx < pdfDoc.getPageCount())
    .sort((a, b) => b - a);

  if (sortedIndicesToDelete.length === 0) {
    throw new Error("No valid page indices selected to delete.");
  }

  if (sortedIndicesToDelete.length >= pdfDoc.getPageCount()) {
    throw new Error("Cannot delete all pages. A PDF must contain at least 1 page.");
  }

  sortedIndicesToDelete.forEach((index) => {
    pdfDoc.removePage(index);
  });
  
  return await pdfDoc.save();
}

/**
 * Real client-side Metadata Editing
 */
export async function editPDFMetadata(
  file: File,
  metadata: { title?: string; author?: string; subject?: string; keywords?: string }
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
  if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) {
    const kwArray = metadata.keywords.split(",").map(k => k.trim());
    pdfDoc.setKeywords(kwArray);
  }
  
  return await pdfDoc.save();
}

/**
 * Convert Image to PDF
 */
export async function convertImagesToPDF(imageFiles: File[]): Promise<Uint8Array> {
  if (imageFiles.length === 0) throw new Error("No images selected for conversion.");
  
  const pdfDoc = await PDFDocument.create();
  
  for (const imgFile of imageFiles) {
    const imgBytes = await imgFile.arrayBuffer();
    const page = pdfDoc.addPage();
    const { width: pageWidth, height: pageHeight } = page.getSize();
    
    let embeddedImg;
    if (imgFile.type === "image/png") {
      embeddedImg = await pdfDoc.embedPng(imgBytes);
    } else if (imgFile.type === "image/jpeg" || imgFile.type === "image/jpg") {
      embeddedImg = await pdfDoc.embedJpg(imgBytes);
    } else {
      // Fallback or skip
      continue;
    }
    
    // Scale image to fit the page constraints
    const imgDims = embeddedImg.scaleToFit(pageWidth - 40, pageHeight - 40);
    
    page.drawImage(embeddedImg, {
      x: pageWidth / 2 - imgDims.width / 2,
      y: pageHeight / 2 - imgDims.height / 2,
      width: imgDims.width,
      height: imgDims.height,
    });
  }
  
  return await pdfDoc.save();
}

/**
 * Convert raw text or markdown to PDF pages
 */
export async function convertTextToPDF(text: string, title = "Converted Document"): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  const fontSize = 11;
  const margin = 50;
  const maxLineHeight = height - margin * 2;
  let currentY = height - margin;
  
  // Split content into printable segments
  const lines = text.split("\n");
  
  // Simple layout printing lines
  page.drawText(title, { x: margin, y: currentY, size: 16, color: undefined });
  currentY -= 30;
  
  for (const line of lines) {
    if (currentY < margin) {
      page = pdfDoc.addPage();
      currentY = height - margin;
    }
    
    // Filter non-printable characters or handle long wraps
    const chunk = line.length > 80 ? line.substring(0, 80) + "..." : line;
    page.drawText(chunk, { x: margin, y: currentY, size: fontSize });
    currentY -= fontSize * 1.5;
  }
  
  return await pdfDoc.save();
}

/**
 * Sign PDF (embed digital signature on selected pages)
 */
export async function signPDFDocument(
  file: File,
  signatureImageBase64: string, // transparent signature image
  pageNum = 1,
  xCoord = 100,
  yCoord = 100,
  widthScale = 150,
  heightScale = 60
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  const pages = pdfDoc.getPages();
  const targetPageIdx = Math.min(Math.max(pageNum - 1, 0), pages.length - 1);
  const page = pages[targetPageIdx];
  
  // Extract transparent signature png
  const base64Data = signatureImageBase64.split(",")[1] || signatureImageBase64;
  const sigBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  const sigImage = await pdfDoc.embedPng(sigBytes);
  
  page.drawImage(sigImage, {
    x: xCoord,
    y: yCoord,
    width: widthScale,
    height: heightScale
  });
  
  return await pdfDoc.save();
}
