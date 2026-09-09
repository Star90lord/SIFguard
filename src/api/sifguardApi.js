const BASE_URL = 'http://localhost:8000';

// Toggle this to switch between mock and real API
const USE_MOCK = true;

// ─── Mock data imports ─────────────────────────────────────────────
import {
  mockReports,
  mockTrends,
  mockAnalysisResult,
  mockSampleBatch,
  getMockSites,
} from '../data/mockData';

// ─── Mock helpers ───────────────────────────────────────────────────
function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Real API helpers ───────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Single Report Analysis ─────────────────────────────────────────

export async function analyzeText(text) {
  if (USE_MOCK) {
    await delay(1000);
    // If text contains recognizable keywords, customize the result
    const lower = text.toLowerCase();
    if (lower.includes('confined') || lower.includes('tank')) {
      return {
        ...mockAnalysisResult,
        risk_level: 'SIF-Precursor',
        hazard: 'Confined Space',
        activity: 'Tank Cleaning',
        location: 'Rig Site A',
        barrier_failure: 'Atmospheric Monitoring',
        explanation: 'Confined space entry without verified atmospheric monitoring represents an immediate critical SIF precursor.',
      };
    }
    if (lower.includes('crane') || lower.includes('lift') || lower.includes('drop')) {
      return {
        ...mockAnalysisResult,
        risk_level: 'High',
        hazard: 'Dropped Object',
        activity: 'Lifting Operations',
        location: 'Rig Site A',
        barrier_failure: 'Rigging Inspection',
        explanation: 'Overhead lift with rigging defects poses immediate catastrophic dropped object danger.',
      };
    }
    return { ...mockAnalysisResult };
  }
  return request('/analyze/text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function analyzeFile(file) {
  if (USE_MOCK) {
    await delay(1200);
    return { ...mockAnalysisResult };
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/analyze/file`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

// ─── Batch Analysis Workflow ────────────────────────────────────────

/**
 * Analyzes multiple files sequentially or concurrently, emitting progress callbacks.
 * @param {Array<File|Object>} files - list of File objects or mock file items
 * @param {Object} options - { groupBySite: true, autoMerge: true, depth: 'standard' | 'detailed' }
 * @param {Function} onProgress - callback ({ current, total, currentFile, status, completedFiles })
 */
export async function analyzeFiles(files, options = {}, onProgress = null) {
  if (USE_MOCK) {
    const total = files.length;
    const results = [];
    const completedFiles = [];
    const failedFiles = [];

    // Deterministic matching to mock batch or generated reports
    for (let i = 0; i < total; i++) {
      const file = files[i];
      const filename = file.name || file.filename || `report-0${i + 1}.pdf`;

      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          currentFile: filename,
          status: 'analyzing',
          completedFiles: [...completedFiles],
          failedFiles: [...failedFiles],
          percentage: Math.round((i / total) * 100),
        });
      }

      await delay(450);

      // Check if this file simulates a failure (e.g. named fail or empty)
      if (filename.toLowerCase().includes('corrupt') || filename.toLowerCase().includes('error')) {
        failedFiles.push({
          id: `err-${Date.now()}-${i}`,
          filename,
          size: file.size ? `${(file.size / 1024).toFixed(0)} KB` : '12 KB',
          error: 'Unreadable document encoding or damaged PDF stream',
        });
        continue;
      }

      // Match sample batch if available, otherwise synthesize realistic safety record
      const sampleMatch = mockSampleBatch.find(
        (s) => s.filename.toLowerCase() === filename.toLowerCase()
      );

      let record;
      if (sampleMatch) {
        record = {
          ...sampleMatch,
          id: `batch-${Date.now()}-${i}`,
          batchId: `batch-${Date.now()}`,
          timestamp: new Date(`${sampleMatch.date}T10:00:00Z`).toISOString(),
        };
      } else {
        // Deterministically assign site based on filename or cyclic index
        const sites = ['Rig Site A', 'Rig Site B', 'Processing Unit', 'Warehouse', 'Workshop'];
        const assignedSite =
          filename.toLowerCase().includes('rig-a') || filename.toLowerCase().includes('rig_a')
            ? 'Rig Site A'
            : filename.toLowerCase().includes('rig-b') || filename.toLowerCase().includes('rig_b')
            ? 'Rig Site B'
            : filename.toLowerCase().includes('warehouse')
            ? 'Warehouse'
            : filename.toLowerCase().includes('processing')
            ? 'Processing Unit'
            : sites[i % sites.length];

        const severities = ['High', 'SIF-Precursor', 'Medium', 'Low'];
        const hazards = ['Fall', 'Confined Space', 'Dropped Object', 'Electrical', 'Vehicle Interaction'];
        const dates = ['2026-09-09', '2026-09-08', '2026-09-07', '2026-09-06'];

        const risk_level = severities[i % severities.length];
        const hazard = hazards[i % hazards.length];
        const date = dates[i % dates.length];

        record = {
          id: `batch-${Date.now()}-${i}`,
          batchId: `batch-${Date.now()}`,
          filename,
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.4 MB',
          date,
          site: assignedSite,
          location: `${assignedSite} - Operational Area`,
          report_text: `Automated safety observation from document ${filename}. Incident occurred during routine field activity at ${assignedSite}. Identified primary hazard: ${hazard}.`,
          risk_level,
          hazard,
          activity: 'Field Operations',
          barrier_failure: 'Operational Compliance',
          sif_precursor: risk_level === 'SIF-Precursor' || risk_level === 'High',
          explanation: `System classified report as ${risk_level} due to identified ${hazard} risks and potential barrier breakdown at ${assignedSite}.`,
          timestamp: new Date(`${date}T12:00:00Z`).toISOString(),
        };
      }

      results.push(record);
      completedFiles.push(filename);
    }

    if (onProgress) {
      onProgress({
        current: total,
        total,
        currentFile: null,
        status: 'completed',
        completedFiles: [...completedFiles],
        failedFiles: [...failedFiles],
        percentage: 100,
      });
    }

    return {
      batchId: `batch-${Date.now()}`,
      totalAnalyzed: results.length,
      totalFailed: failedFiles.length,
      results,
      failedFiles,
      durationSeconds: Math.round(total * 0.45 + 1),
    };
  }

  // Real API implementation
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('options', JSON.stringify(options));

  const res = await fetch(`${BASE_URL}/analyze/batch`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Batch upload failed: ${res.status}`);
  }
  return res.json();
}

// ─── Query Endpoints ────────────────────────────────────────────────

export async function getReports() {
  if (USE_MOCK) {
    await delay(300);
    return [...mockReports];
  }
  return request('/reports');
}

export async function getReport(reportId) {
  if (USE_MOCK) {
    await delay(200);
    const report = mockReports.find((r) => String(r.id) === String(reportId));
    if (!report) throw new Error(`Report ${reportId} not found`);

    // Related reports from the same site (excluding self)
    const relatedReports = mockReports
      .filter((r) => r.site === report.site && String(r.id) !== String(reportId))
      .slice(0, 4);

    return {
      ...report,
      relatedReports,
    };
  }
  return request(`/reports/${reportId}`);
}

export async function getSites() {
  if (USE_MOCK) {
    await delay(300);
    return getMockSites();
  }
  return request('/sites');
}

export async function getSiteReports(siteId) {
  if (USE_MOCK) {
    await delay(250);
    const sites = getMockSites();
    const site = sites.find(
      (s) => s.id === siteId || s.name.toLowerCase().replace(/\s+/g, '-') === siteId
    );
    if (!site) throw new Error(`Site ${siteId} not found`);
    return site;
  }
  return request(`/sites/${siteId}`);
}

export async function getTrends() {
  if (USE_MOCK) {
    await delay(300);
    return { ...mockTrends };
  }
  return request('/trends');
}
