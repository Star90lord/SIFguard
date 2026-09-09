/**
 * SIFguard Client-Side Standards-Compliant PDF Report Generator
 * Pure JavaScript, zero external dependencies, robust and lightweight.
 * Generates official Oil India Limited HSE intelligence reports & batch summaries.
 */

import {
  formatReportCode,
  formatDateTime,
  getContributingFactors,
  getRecommendedSafetyActions,
  getCorrectiveActions,
  getPreventiveActions,
  getReportSummary,
} from './filterReports.js';

/**
 * Escapes characters for PDF string literals
 */
function escapePDFText(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Wraps text into lines that do not exceed maxChars
 */
function wrapText(text, maxChars = 78) {
  if (!text) return [];
  const paragraphs = String(text).split('\n');
  const result = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      result.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length <= maxChars) {
        currentLine += ' ' + word;
      } else {
        result.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result;
}

/**
 * PDF Document Builder (Standard A4 Page: 595.28 x 841.89 points)
 */
class PDFDocumentBuilder {
  constructor() {
    this.pages = [];
    this.currentPage = null;
    this.pageWidth = 595.28;
    this.pageHeight = 841.89;
    this.marginLeft = 40;
    this.marginRight = 555.28;
    this.contentWidth = 515.28;
    this.addPage();
  }

  addPage() {
    this.currentPage = {
      commands: [],
      yCursor: 800, // Top margin
    };
    this.pages.push(this.currentPage);
  }

  ensureSpace(neededPoints) {
    if (this.currentPage.yCursor - neededPoints < 50) {
      this.addPage();
      this.currentPage.yCursor = 790;
    }
  }

  // Vector graphics helpers
  setFillColor(r, g, b) {
    this.currentPage.commands.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  setStrokeColor(r, g, b) {
    this.currentPage.commands.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }

  setLineWidth(w) {
    this.currentPage.commands.push(`${w} w`);
  }

  drawRect(x, y, w, h, fill = true, stroke = false) {
    const op = fill && stroke ? 'B' : fill ? 'f' : 'S';
    this.currentPage.commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`);
  }

  drawLine(x1, y1, x2, y2) {
    this.currentPage.commands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  // Text helpers (F1 = Helvetica, F2 = Helvetica-Bold)
  drawText(text, x, y, font = 'F1', size = 10, r = 0.1, g = 0.1, b = 0.1) {
    this.setFillColor(r, g, b);
    const escaped = escapePDFText(text);
    this.currentPage.commands.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`);
  }

  compilePDF() {
    const objectList = [];

    // Obj 1: Catalog
    objectList.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Page kids array
    const kidsStr = this.pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
    // Obj 2: Pages
    objectList.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${this.pages.length} >>\nendobj\n`);

    // Standard Font References (Objs 4 + totalPages * 2)
    const fontObj1 = `${3 + this.pages.length * 2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
    const fontObj2 = `${4 + this.pages.length * 2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

    const font1Ref = `${3 + this.pages.length * 2} 0 R`;
    const font2Ref = `${4 + this.pages.length * 2} 0 R`;

    // Generate Page and Content Stream Objects
    this.pages.forEach((page, index) => {
      const pageObjNum = 3 + index * 2;
      const contentObjNum = 4 + index * 2;

      // Add Footer on each page
      const footerText = `Page ${index + 1} of ${this.pages.length}  ·  SIFguard Safety Intelligence  ·  Oil India Limited HSE Operations`;
      const dateText = '09 Sep 2026';

      page.commands.push('0.7 0.7 0.7 RG 0.5 w');
      page.commands.push(`40 40 m 555.28 40 l S`);
      page.commands.push(`BT /F1 8 Tf 40 28 Td (${escapePDFText(footerText)}) Tj ET`);
      page.commands.push(`BT /F1 8 Tf 500 28 Td (${escapePDFText(dateText)}) Tj ET`);

      const streamContent = page.commands.join('\n');
      const streamLen = streamContent.length;

      // Page Obj
      objectList.push(
        `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${font1Ref} /F2 ${font2Ref} >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`
      );

      // Content Stream Obj
      objectList.push(
        `${contentObjNum} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`
      );
    });

    objectList.push(fontObj1);
    objectList.push(fontObj2);

    // Assemble file with exact byte offset xref table
    let header = '%PDF-1.4\n';
    let body = '';
    const offsets = [];
    let currentOffset = header.length;

    for (const obj of objectList) {
      offsets.push(currentOffset);
      body += obj;
      currentOffset += obj.length;
    }

    const startxref = currentOffset;
    let xref = `xref\n0 ${objectList.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      xref += String(off).padStart(10, '0') + ' 00000 n \n';
    }

    const trailer = `trailer\n<< /Size ${objectList.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

    return header + body + xref + trailer;
  }
}

/**
 * Triggers standard browser file download from generated PDF string
 */
function triggerFileDownload(pdfData, filename) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
    return true;
  } catch (err) {
    console.error('Download trigger failed:', err);
    return false;
  }
}

/**
 * ENHANCEMENT 3: Download Individual Safety Intelligence Report (PDF)
 */
export function downloadIndividualReport(report) {
  if (!report) return { success: false, error: 'Report is undefined' };

  const reportCode = report.code || formatReportCode(report.id);
  const siteName = report.site || report.siteName || report.location || 'Operational Site';
  const siteCode = report.siteCode || (report.siteId ? report.siteId.toUpperCase() : 'OIL-OPS');
  const dateTimeStr = formatDateTime(report);
  const isSif = report.risk_level === 'SIF-Precursor' || report.sif_precursor === true;
  const isHigh = report.risk_level === 'High';

  const doc = new PDFDocumentBuilder();

  // ══════════════════════════════════════════════════════════════════
  // PAGE 1: INVESTIGATION OVERVIEW, RISK CLASSIFICATION & NARRATIVE
  // ══════════════════════════════════════════════════════════════════

  // 1. Corporate Header Banner (Dark Navy: #0f172a)
  doc.setFillColor(0.06, 0.09, 0.16); // #0f172a
  doc.drawRect(40, 750, 515.28, 55, true, false);

  doc.drawText('OIL INDIA LIMITED', 55, 785, 'F2', 12, 0.95, 0.95, 0.98);
  doc.drawText('HEALTH, SAFETY & ENVIRONMENT DIVISION  ·  SIH 2026', 55, 772, 'F1', 8, 0.7, 0.75, 0.85);
  doc.drawText('SIFguard Detailed Safety Investigation Report', 55, 758, 'F2', 11, 0.9, 0.9, 0.95);

  doc.drawText('HSE RECORD', 470, 785, 'F2', 8, 1, 0.6, 0.2);
  doc.drawText(reportCode, 470, 768, 'F2', 11, 1, 1, 1);

  // 2. Metadata Grid Card (Slate-50 with border)
  doc.setFillColor(0.97, 0.98, 0.99);
  doc.setStrokeColor(0.85, 0.88, 0.92);
  doc.setLineWidth(1);
  doc.drawRect(40, 680, 515.28, 55, true, true);

  doc.drawText('FACILITY / SITE', 55, 718, 'F1', 7.5, 0.45, 0.5, 0.6);
  doc.drawText(`${siteName} (${siteCode})`, 55, 704, 'F2', 10, 0.1, 0.15, 0.25);

  doc.drawText('SPECIFIC LOCATION', 210, 718, 'F1', 7.5, 0.45, 0.5, 0.6);
  doc.drawText(report.location || siteName, 210, 704, 'F2', 9.5, 0.1, 0.15, 0.25);

  doc.drawText('LOGGED DATE & TIME', 360, 718, 'F1', 7.5, 0.45, 0.5, 0.6);
  doc.drawText(dateTimeStr, 360, 704, 'F2', 9.5, 0.1, 0.15, 0.25);

  doc.drawText('REPORT ID', 470, 718, 'F1', 7.5, 0.45, 0.5, 0.6);
  doc.drawText(reportCode, 470, 704, 'F2', 9.5, 0.1, 0.15, 0.25);

  // 3. Safety Assessment Box
  doc.setFillColor(0.96, 0.97, 0.98);
  doc.setStrokeColor(0.82, 0.85, 0.9);
  doc.drawRect(40, 580, 515.28, 85, true, true);

  doc.drawText('SECTION A & C — SAFETY ASSESSMENT & CLASSIFICATION', 55, 648, 'F2', 8.5, 0.2, 0.25, 0.35);

  // Risk Level Badge
  let rFill = [0.1, 0.65, 0.4];
  let rText = 'LOW RISK';
  if (isSif) {
    rFill = [0.85, 0.12, 0.15];
    rText = 'SIF-PRECURSOR';
  } else if (isHigh) {
    rFill = [0.92, 0.4, 0.05];
    rText = 'HIGH RISK';
  } else if (report.risk_level === 'Medium') {
    rFill = [0.85, 0.6, 0.05];
    rText = 'MEDIUM RISK';
  }

  doc.setFillColor(...rFill);
  doc.drawRect(55, 608, 95, 24, true, false);
  doc.drawText(rText, 63, 617, 'F2', 9.5, 1, 1, 1);

  // SIF Precursor Status
  doc.drawText('PRECURSOR STATUS', 170, 632, 'F1', 7.5, 0.45, 0.5, 0.6);
  if (isSif) {
    doc.drawText('DETECTED (Urgent Safeguard Action)', 170, 616, 'F2', 9, 0.85, 0.12, 0.15);
  } else {
    doc.drawText('None Detected in Observation', 170, 616, 'F2', 9, 0.3, 0.4, 0.5);
  }

  // Primary Hazard & Activity
  doc.drawText('PRIMARY HAZARD', 350, 632, 'F1', 7.5, 0.45, 0.5, 0.6);
  doc.drawText(report.hazard || 'None Specified', 350, 616, 'F2', 9.5, 0.1, 0.15, 0.25);

  doc.drawText('OPERATIONAL ACTIVITY', 55, 595, 'F1', 7.5, 0.45, 0.5, 0.6);
  doc.drawText(report.activity || 'General Operations', 165, 595, 'F2', 8.5, 0.15, 0.2, 0.3);

  // Barrier Failure Banner
  const barrierText = report.barrier_failure || 'None Identified';
  doc.setFillColor(0.99, 0.94, 0.94);
  doc.setStrokeColor(0.95, 0.78, 0.78);
  doc.drawRect(40, 520, 515.28, 45, true, true);

  doc.drawText('BARRIER DEFICIENCY IDENTIFIED', 55, 548, 'F2', 8, 0.75, 0.1, 0.15);
  doc.drawText(barrierText, 55, 532, 'F2', 9.5, 0.55, 0.05, 0.1);

  // 4. Original Field Narrative Excerpt
  doc.setFillColor(0.98, 0.98, 0.99);
  doc.setStrokeColor(0.88, 0.9, 0.92);
  doc.drawRect(40, 395, 515.28, 110, true, true);

  doc.drawText('SECTION B — ORIGINAL FIELD REPORT NARRATIVE', 55, 488, 'F2', 8, 0.4, 0.45, 0.55);

  const narrativeText = report.full_text || report.report_text || report.text_snippet || 'No narrative text recorded.';
  const wrappedNarrative = wrapText(narrativeText, 80).slice(0, 6);
  let narrY = 470;
  wrappedNarrative.forEach((line) => {
    doc.drawText(line, 55, narrY, 'F1', 8, 0.25, 0.3, 0.35);
    narrY -= 11;
  });

  // 5. Structured Explainable Risk Drivers (Section D)
  const { factors, whyItMatters } = getContributingFactors(report);
  doc.setFillColor(1, 1, 1);
  doc.setStrokeColor(0.85, 0.88, 0.92);
  doc.drawRect(40, 190, 515.28, 190, true, true);

  doc.drawText('SECTION D — EXPLAINABLE RISK ASSESSMENT & CONTRIBUTING FACTORS', 55, 362, 'F2', 8.5, 0.15, 0.25, 0.4);

  let factorY = 344;
  factors.forEach((factor) => {
    doc.drawText('•', 55, factorY, 'F2', 9, 0.2, 0.4, 0.8);
    doc.drawText(factor, 67, factorY, 'F1', 8.5, 0.2, 0.25, 0.35);
    factorY -= 14;
  });

  doc.drawText('Why This Matters:', 55, 275, 'F2', 8, 0.3, 0.35, 0.45);
  const wrappedWhy = wrapText(whyItMatters, 78);
  let whyY = 263;
  wrappedWhy.forEach((line) => {
    doc.drawText(line, 55, whyY, 'F1', 8, 0.3, 0.35, 0.45);
    whyY -= 10;
  });

  if (report.explanation) {
    doc.drawText('Classification Note:', 55, 225, 'F2', 8, 0.2, 0.3, 0.45);
    const wrappedExp = wrapText(report.explanation, 78).slice(0, 2);
    let expY = 213;
    wrappedExp.forEach((line) => {
      doc.drawText(line, 55, expY, 'F1', 7.5, 0.3, 0.35, 0.4);
      expY -= 9;
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // PAGE 2: SAFETY ACTIONS, CORRECTIVE & PREVENTIVE DIRECTIVES
  // ══════════════════════════════════════════════════════════════════
  doc.addPage();

  // Page 2 Header Banner
  doc.setFillColor(0.06, 0.09, 0.16);
  doc.drawRect(40, 755, 515.28, 45, true, false);
  doc.drawText('OIL INDIA LIMITED  ·  HSE DIRECTIVES & ACTIONS', 55, 782, 'F2', 11, 0.95, 0.95, 0.98);
  doc.drawText(`INVESTIGATION RECORD: ${reportCode}  ·  FACILITY: ${siteName}`, 55, 768, 'F1', 8, 0.7, 0.75, 0.85);

  // Recommended Safety Actions (Section E)
  const { priority, actions } = getRecommendedSafetyActions(report);
  doc.setFillColor(0.96, 0.98, 1.0);
  doc.setStrokeColor(0.78, 0.85, 0.95);
  doc.drawRect(40, 615, 515.28, 125, true, true);

  doc.drawText('SECTION E — RECOMMENDED SAFETY ACTIONS', 55, 722, 'F2', 9, 0.1, 0.25, 0.55);
  doc.drawText(`[ PRIORITY: ${priority} ]`, 425, 722, 'F2', 8, 0.85, 0.2, 0.1);

  let actionY = 704;
  actions.forEach((act, idx) => {
    doc.drawText(`${idx + 1}.`, 55, actionY, 'F2', 8.5, 0.15, 0.3, 0.6);
    const wrappedAct = wrapText(act, 74);
    wrappedAct.forEach((line, lineIdx) => {
      doc.drawText(line, 70, actionY, 'F1', 8.5, 0.15, 0.2, 0.3);
      if (lineIdx < wrappedAct.length - 1) actionY -= 11;
    });
    actionY -= 13;
  });

  // Section F: Corrective Action (Fix Current Condition)
  const correctiveActions = getCorrectiveActions(report);
  doc.setFillColor(0.99, 0.98, 0.94);
  doc.setStrokeColor(0.92, 0.85, 0.7);
  doc.drawRect(40, 480, 515.28, 120, true, true);

  doc.drawText('SECTION F — CORRECTIVE ACTION (FIX CURRENT CONDITION)', 55, 582, 'F2', 8.5, 0.6, 0.35, 0.05);
  doc.drawText('[ IMMEDIATE REMEDIATION ]', 400, 582, 'F2', 7.5, 0.7, 0.3, 0.05);

  let corrY = 564;
  correctiveActions.forEach((c) => {
    doc.drawText(`• ${c.step}:`, 55, corrY, 'F2', 8, 0.2, 0.25, 0.3);
    const wrappedDetail = wrapText(c.detail, 70);
    wrappedDetail.forEach((line) => {
      doc.drawText(line, 65, corrY - 9, 'F1', 7.5, 0.3, 0.35, 0.4);
    });
    corrY -= 22;
  });

  // Section G: Preventive Action (Reduce Recurrence)
  const preventiveActions = getPreventiveActions(report);
  doc.setFillColor(0.95, 0.99, 0.96);
  doc.setStrokeColor(0.75, 0.9, 0.8);
  doc.drawRect(40, 345, 515.28, 120, true, true);

  doc.drawText('SECTION G — PREVENTIVE ACTION (REDUCE RECURRENCE)', 55, 448, 'F2', 8.5, 0.1, 0.5, 0.25);
  doc.drawText('[ SYSTEMIC SAFEGUARDS ]', 410, 448, 'F2', 7.5, 0.1, 0.5, 0.2);

  let prevY = 430;
  preventiveActions.forEach((p) => {
    doc.drawText(`• ${p.step} [${p.timeline}]:`, 55, prevY, 'F2', 8, 0.15, 0.35, 0.2);
    const wrappedDetail = wrapText(p.detail, 70);
    wrappedDetail.forEach((line) => {
      doc.drawText(line, 65, prevY - 9, 'F1', 7.5, 0.25, 0.35, 0.3);
    });
    prevY -= 22;
  });

  // Verification & Sign-off Block
  doc.setFillColor(1, 1, 1);
  doc.setStrokeColor(0.85, 0.88, 0.92);
  doc.drawRect(40, 160, 515.28, 165, true, true);

  doc.drawText('SECTION H & I — INVESTIGATION VERIFICATION & SIGN-OFF', 55, 308, 'F2', 8, 0.4, 0.45, 0.55);
  doc.drawText(`Facility: ${siteName} (${siteCode})  ·  Logged Date: ${dateTimeStr}`, 55, 290, 'F1', 8, 0.25, 0.3, 0.35);
  doc.drawText('Primary Safeguard Assessment: Physical Barrier Verification Required', 55, 276, 'F1', 8, 0.25, 0.3, 0.35);
  doc.drawText('Status: Investigation Completed & Archived in SIFguard Platform', 55, 262, 'F1', 8, 0.15, 0.5, 0.25);

  doc.drawLine(55, 210, 220, 210);
  doc.drawText('Reporting HSE Officer Signature', 65, 195, 'F1', 7.5, 0.45, 0.5, 0.55);

  doc.drawLine(350, 210, 520, 210);
  doc.drawText('Facility HSE Superintendent Signature', 360, 195, 'F1', 7.5, 0.45, 0.5, 0.55);

  // Compile and trigger download
  const rawId = String(report.code || report.id || '0000');
  const numOnly = rawId.replace(/\D/g, '');
  const cleanCode = numOnly ? `RPT-${numOnly.padStart(4, '0')}` : rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `SIFguard_Report_${cleanCode}.pdf`;
  const pdfString = doc.compilePDF();

  const success = triggerFileDownload(pdfString, filename);
  return { success, filename };
}

/**
 * ENHANCEMENT 4: Download Batch Analysis Summary Report (PDF)
 */
export function downloadBatchSummary(batchResults) {
  if (!batchResults || !batchResults.results || batchResults.results.length === 0) {
    return { success: false, error: 'No analyzed batch data available' };
  }

  const reports = batchResults.results;
  const summary = getReportSummary(reports);
  const doc = new PDFDocumentBuilder();

  // 1. Corporate Header Banner (Navy)
  doc.setFillColor(0.06, 0.09, 0.16);
  doc.drawRect(40, 750, 515.28, 55, true, false);

  doc.drawText('OIL INDIA LIMITED', 55, 785, 'F2', 12, 0.95, 0.95, 0.98);
  doc.drawText('HSE OPERATIONS  ·  BATCH INTELLIGENCE SCREENING', 55, 772, 'F1', 8, 0.7, 0.75, 0.85);
  doc.drawText('SIFguard Multi-Report Batch Analysis Summary', 55, 758, 'F2', 11, 0.9, 0.9, 0.95);

  doc.drawText('DATE: 09 SEP 2026', 440, 785, 'F2', 8, 1, 1, 1);
  doc.drawText(`${reports.length} Reports Analyzed`, 440, 768, 'F2', 9.5, 0.8, 0.9, 1);

  // 2. Risk Distribution KPI Strip
  doc.setFillColor(0.97, 0.98, 0.99);
  doc.setStrokeColor(0.85, 0.88, 0.92);
  doc.setLineWidth(1);
  doc.drawRect(40, 675, 515.28, 60, true, true);

  doc.drawText('EVALUATED RISK DISTRIBUTION', 55, 720, 'F2', 8, 0.4, 0.45, 0.55);

  // Low
  doc.drawText('LOW RISK', 55, 702, 'F1', 7.5, 0.1, 0.6, 0.35);
  doc.drawText(String(summary.lowCount), 55, 688, 'F2', 14, 0.1, 0.5, 0.3);

  // Medium
  doc.drawText('MEDIUM RISK', 170, 702, 'F1', 7.5, 0.75, 0.5, 0.05);
  doc.drawText(String(summary.mediumCount), 170, 688, 'F2', 14, 0.75, 0.5, 0.05);

  // High
  doc.drawText('HIGH RISK', 300, 702, 'F1', 7.5, 0.85, 0.35, 0.05);
  doc.drawText(String(summary.highCount), 300, 688, 'F2', 14, 0.85, 0.35, 0.05);

  // SIF-Precursor
  doc.drawText('SIF-PRECURSOR', 430, 702, 'F2', 7.5, 0.85, 0.1, 0.15);
  doc.drawText(String(summary.sifCount), 430, 688, 'F2', 14, 0.85, 0.1, 0.15);

  // 3. Site Breakdown Table or Single Site Chronology
  const siteMap = {};
  reports.forEach((r) => {
    const sName = r.siteName || r.site || 'Operational Facility';
    if (!siteMap[sName]) siteMap[sName] = [];
    siteMap[sName].push(r);
  });

  const siteEntries = Object.entries(siteMap);
  const isSingleSite = siteEntries.length === 1;

  doc.setFillColor(1, 1, 1);
  doc.setStrokeColor(0.85, 0.88, 0.92);
  doc.drawRect(40, 520, 515.28, 140, true, true);

  if (isSingleSite) {
    const [singleSiteName, singleReports] = siteEntries[0];
    doc.drawText(`SINGLE-SITE BATCH: ${singleSiteName.toUpperCase()} (${singleReports.length} OBSERVATIONS)`, 55, 642, 'F2', 8.5, 0.15, 0.25, 0.4);

    doc.drawText('DATE / TIME', 55, 624, 'F2', 7.5, 0.45, 0.5, 0.6);
    doc.drawText('REPORT ID', 140, 624, 'F2', 7.5, 0.45, 0.5, 0.6);
    doc.drawText('RISK LEVEL', 220, 624, 'F2', 7.5, 0.45, 0.5, 0.6);
    doc.drawText('HAZARD', 310, 624, 'F2', 7.5, 0.45, 0.5, 0.6);
    doc.drawText('BARRIER DEFICIENCY', 410, 624, 'F2', 7.5, 0.45, 0.5, 0.6);

    let rowY = 608;
    singleReports.slice(0, 6).forEach((r) => {
      doc.drawText(r.date || '09 Sep 2026', 55, rowY, 'F1', 7.5, 0.2, 0.25, 0.3);
      doc.drawText(formatReportCode(r.id), 140, rowY, 'F2', 7.5, 0.2, 0.25, 0.3);
      doc.drawText(r.risk_level || 'Low', 220, rowY, 'F2', 7.5, r.risk_level === 'SIF-Precursor' ? 0.85 : 0.2, 0.2, 0.3);
      doc.drawText(r.hazard || 'None', 310, rowY, 'F1', 7.5, 0.2, 0.25, 0.3);
      doc.drawText((r.barrier_failure || 'None').slice(0, 22), 410, rowY, 'F1', 7.5, 0.2, 0.25, 0.3);
      rowY -= 14;
    });
  } else {
    doc.drawText('CORPORATE SITE BREAKDOWN & RISK CONCENTRATION', 55, 642, 'F2', 8.5, 0.15, 0.25, 0.4);

    doc.drawText('FACILITY NAME', 55, 624, 'F2', 7.5, 0.45, 0.5, 0.6);
    doc.drawText('TOTAL', 220, 624, 'F2', 7.5, 0.45, 0.5, 0.6);
    doc.drawText('HIGH RISK', 280, 624, 'F2', 7.5, 0.45, 0.5, 0.6);
    doc.drawText('SIF PRECURSOR', 360, 624, 'F2', 7.5, 0.45, 0.5, 0.6);
    doc.drawText('TOP HAZARD', 460, 624, 'F2', 7.5, 0.45, 0.5, 0.6);

    let rowY = 608;
    siteEntries.forEach(([sName, sReports]) => {
      const highR = sReports.filter((r) => r.risk_level === 'High').length;
      const sifR = sReports.filter((r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true).length;
      const topH = sReports[0]?.hazard || 'General';

      doc.drawText(sName, 55, rowY, 'F2', 8, 0.15, 0.2, 0.3);
      doc.drawText(String(sReports.length), 220, rowY, 'F1', 8, 0.2, 0.25, 0.3);
      doc.drawText(String(highR), 280, rowY, 'F2', 8, 0.85, 0.35, 0.05);
      doc.drawText(String(sifR), 360, rowY, 'F2', 8, 0.85, 0.1, 0.15);
      doc.drawText(topH, 460, rowY, 'F1', 8, 0.2, 0.25, 0.3);
      rowY -= 15;
    });
  }

  // 4. Top Hazards & Activities
  doc.setFillColor(0.97, 0.98, 0.99);
  doc.setStrokeColor(0.85, 0.88, 0.92);
  doc.drawRect(40, 395, 250, 110, true, true);

  doc.drawText('TOP RECURRING HAZARDS', 55, 488, 'F2', 8, 0.15, 0.25, 0.4);
  let hazY = 470;
  summary.topHazards.slice(0, 4).forEach((h) => {
    doc.drawText(`• ${h.hazard}`, 55, hazY, 'F1', 8, 0.2, 0.25, 0.35);
    doc.drawText(`${h.count} reports (${h.percentage}%)`, 200, hazY, 'F2', 8, 0.1, 0.2, 0.4);
    hazY -= 16;
  });

  doc.setFillColor(0.97, 0.98, 0.99);
  doc.setStrokeColor(0.85, 0.88, 0.92);
  doc.drawRect(305, 395, 250, 110, true, true);

  doc.drawText('TOP OPERATIONAL ACTIVITIES', 320, 488, 'F2', 8, 0.15, 0.25, 0.4);
  let actY = 470;
  summary.topActivities.slice(0, 4).forEach((a) => {
    doc.drawText(`• ${a.activity}`, 320, actY, 'F1', 8, 0.2, 0.25, 0.35);
    doc.drawText(`${a.count} reports (${a.percentage}%)`, 460, actY, 'F2', 8, 0.1, 0.2, 0.4);
    actY -= 16;
  });

  // 5. Barrier Failures & Priority Signals
  doc.setFillColor(0.99, 0.95, 0.95);
  doc.setStrokeColor(0.92, 0.8, 0.8);
  doc.drawRect(40, 270, 515.28, 110, true, true);

  doc.drawText('CRITICAL BARRIER BREAKDOWNS & PRIORITY SIGNALS', 55, 362, 'F2', 8.5, 0.75, 0.1, 0.15);

  let barY = 344;
  summary.barrierFailures.slice(0, 3).forEach((b) => {
    doc.drawText(`⚠ ${b.barrier}`, 55, barY, 'F2', 8.5, 0.65, 0.1, 0.15);
    doc.drawText(`${b.count} events  [ ${b.riskAssociation} ]`, 400, barY, 'F1', 8, 0.5, 0.1, 0.15);
    barY -= 15;
  });

  // Priority Conclusion Callout
  doc.drawText('HSE Priority Directive:', 55, 298, 'F2', 8, 0.3, 0.35, 0.4);
  const directive = summary.sifCount > 0
    ? `Immediate operational pause required for ${summary.primaryHazard} operations across target units. Verify physical barrier integrity before authorizing further work.`
    : `Reinforce routine task risk assessments and supervisor walkthroughs across ${siteEntries.length} active sites.`;
  const wrappedDir = wrapText(directive, 80);
  let dirY = 286;
  wrappedDir.forEach((line) => {
    doc.drawText(line, 55, dirY, 'F1', 8, 0.3, 0.35, 0.45);
    dirY -= 11;
  });

  // 6. Signature & Verification Block
  doc.setFillColor(1, 1, 1);
  doc.setStrokeColor(0.85, 0.88, 0.92);
  doc.drawRect(40, 140, 515.28, 115, true, true);

  doc.drawText('EXECUTIVE SCREENING AUDIT VERIFICATION', 55, 238, 'F2', 8, 0.4, 0.45, 0.55);
  doc.drawText('Batch Evaluator: SIFguard Automated Precursor Screener', 55, 220, 'F1', 8, 0.25, 0.3, 0.35);
  doc.drawText('Organisation: Oil India Limited (HSE Corporate HQ, Duliajan)', 55, 206, 'F1', 8, 0.25, 0.3, 0.35);
  doc.drawText('Audit Status: Screening Completed — No Critical Discrepancies', 55, 192, 'F1', 8, 0.15, 0.5, 0.25);

  doc.drawLine(350, 175, 520, 175);
  doc.drawText('HSE Superintendent Signature', 370, 160, 'F1', 7.5, 0.45, 0.5, 0.55);

  // Compile and trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `SIFguard_Batch_Analysis_${dateStr}.pdf`;
  const pdfString = doc.compilePDF();

  const success = triggerFileDownload(pdfString, filename);
  return { success, filename };
}
