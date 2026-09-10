// controllers/reportsController.js
// SIFguard Reports Controller

const { Report } = require("../models/document");

// Baseline safety incident reports for complete intelligence coverage
const BASELINE_REPORTS = [
  {
    id: 'rep-001',
    filename: 'rig-a-inc-01.pdf',
    date: '2026-09-09',
    time: '09:15',
    site: 'Rig Site A',
    siteId: 'rig-site-a',
    siteName: 'Rig Site A',
    location: 'Rig Site A - Mast Section',
    report_text: 'During derrick inspection on Rig Site A, a loose 4-inch steel casing clamp was found suspended 18 meters above the active drill floor. Vibration dampers were completely deteriorated. Drill crew was operating directly below without overhead safety netting.',
    full_text: 'During derrick inspection on Rig Site A, a loose 4-inch steel casing clamp was found suspended 18 meters above the active drill floor. Vibration dampers were completely deteriorated. Drill crew was operating directly below without overhead safety netting.',
    text_snippet: 'Loose 4-inch casing clamp suspended 18m above active drill floor without drop netting.',
    risk_level: 'High',
    hazard: 'Dropped Object',
    activity: 'Drilling Operations',
    barrier_failure: 'Equipment Maintenance',
    sif_precursor: true,
    explanation: 'Unsecured 4-inch steel hardware at 18m directly above populated floor. Direct SIF precursor due to high potential energy drop trajectory without physical catch barriers.',
    entities: {
      hazards: ['Dropped Object'],
      energies: ['Gravity'],
      activities: ['Drilling Operations'],
      equipment: ['Casing Clamp', 'Derrick'],
      locations: ['Mast Section'],
      barrierFailures: ['Equipment Maintenance'],
    },
    riskAssessment: {
      likelihood: 4,
      severity: 4,
      riskScore: 16,
      riskLevel: 'High',
      sifPotential: true,
      reasons: ['High kinetic energy drop trajectory directly over active workforce.'],
    },
  },
  {
    id: 'rep-002',
    filename: 'rig-a-inc-02.pdf',
    date: '2026-09-08',
    time: '11:00',
    site: 'Rig Site A',
    siteId: 'rig-site-a',
    siteName: 'Rig Site A',
    location: 'Rig Site A - Mud Tank 3',
    report_text: 'Confined space entry performed inside Mud Tank 3 for routine sludge desilting. Atmospheric testing log was missing calibration stamps, and the emergency retrieval tripod had not been anchored prior to entry.',
    full_text: 'Confined space entry performed inside Mud Tank 3 for routine sludge desilting. Atmospheric testing log was missing calibration stamps, and the emergency retrieval tripod had not been anchored prior to entry.',
    text_snippet: 'Confined space entry executed without calibrated atmospheric monitor or anchored rescue tripod.',
    risk_level: 'SIF-Precursor',
    hazard: 'Confined Space',
    activity: 'Tank Cleaning',
    barrier_failure: 'Procedural Violation',
    sif_precursor: true,
    explanation: 'Atmospheric monitoring deficiency coupled with unanchored emergency retrieval gear inside a confined space constitutes an acute SIF precursor.',
    entities: {
      hazards: ['Confined Space', 'Toxic Atmosphere'],
      energies: ['Atmospheric'],
      activities: ['Tank Cleaning'],
      equipment: ['Retrieval Tripod', 'Gas Detector'],
      locations: ['Mud Tank 3'],
      barrierFailures: ['Procedural Violation'],
    },
    riskAssessment: {
      likelihood: 3,
      severity: 5,
      riskScore: 15,
      riskLevel: 'Extreme',
      sifPotential: true,
      reasons: ['Unverified atmosphere in enclosed compartment with high asphyxiation potential.'],
    },
  },
  {
    id: 'rep-003',
    filename: 'rig-b-inc-01.pdf',
    date: '2026-09-07',
    time: '14:20',
    site: 'Rig Site B',
    siteId: 'rig-site-b',
    siteName: 'Rig Site B',
    location: 'Rig Site B - Substructure Deck',
    report_text: 'Scaffold dismantle work was taking place on cantilever deck 12 meters above open water. Scaffolder removed harness lanyard to cross beam gap because static line was terminated 2 meters short of working position.',
    full_text: 'Scaffold dismantle work was taking place on cantilever deck 12 meters above open water. Scaffolder removed harness lanyard to cross beam gap because static line was terminated 2 meters short of working position.',
    text_snippet: 'Worker disconnected fall arrest harness while traversing open beam 12m above water.',
    risk_level: 'SIF-Precursor',
    hazard: 'Fall from Height',
    activity: 'Scaffold Work',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: true,
    explanation: '100% tie-off violation at 12 meters above open water with incomplete lifeline coverage represents an immediate life-critical SIF precursor.',
    entities: {
      hazards: ['Fall from Height'],
      energies: ['Gravity'],
      activities: ['Scaffold Work'],
      equipment: ['Harness', 'Lifeline', 'Scaffolding'],
      locations: ['Substructure Deck'],
      barrierFailures: ['PPE Non-compliance'],
    },
    riskAssessment: {
      likelihood: 3,
      severity: 5,
      riskScore: 15,
      riskLevel: 'Extreme',
      sifPotential: true,
      reasons: ['Unprotected fall from height exceeding critical threshold.'],
    },
  },
  {
    id: 'rep-004',
    filename: 'rig-b-inc-02.pdf',
    date: '2026-09-06',
    time: '16:45',
    site: 'Rig Site B',
    siteId: 'rig-site-b',
    siteName: 'Rig Site B',
    location: 'Rig Site B - Chemical Mixing Room',
    report_text: 'Operator transferring liquid biocide experienced splash to forearm when uncoupling quick-release hose. Face shield was worn but chemical-resistant gloves were not donned as required by chemical handling permit.',
    full_text: 'Operator transferring liquid biocide experienced splash to forearm when uncoupling quick-release hose. Face shield was worn but chemical-resistant gloves were not donned as required by chemical handling permit.',
    text_snippet: 'Biocide chemical splash to worker forearm during pressurized transfer hose uncoupling.',
    risk_level: 'Medium',
    hazard: 'Chemical Exposure',
    activity: 'Chemical Handling',
    barrier_failure: 'PPE Inadequate',
    sif_precursor: false,
    explanation: 'Corrosive chemical splash occurred due to residual line pressure and omission of chemical gauntlets.',
    entities: {
      hazards: ['Chemical Exposure'],
      energies: ['Chemical', 'Pressure'],
      activities: ['Chemical Handling'],
      equipment: ['Transfer Hose', 'Chemical Gauntlets'],
      locations: ['Chemical Mixing Room'],
      barrierFailures: ['PPE Inadequate'],
    },
    riskAssessment: {
      likelihood: 3,
      severity: 2,
      riskScore: 6,
      riskLevel: 'Medium',
      sifPotential: false,
      reasons: ['Direct skin contact with hazardous fluid prevented from critical escalation.'],
    },
  },
  {
    id: 'rep-005',
    filename: 'rig-e-inc-01.pdf',
    date: '2026-09-05',
    time: '03:30',
    site: 'Rig Site E',
    siteId: 'rig-site-e',
    siteName: 'Rig Site E',
    location: 'Rig Site E - Wellhead Moonpool',
    report_text: 'During high-pressure formation testing at 8,200 PSI, surface choke manifold hydraulic actuator valve jammed partially open. Backpressure spiked 1,400 PSI above maximum safe limit before secondary relief valve cracked.',
    full_text: 'During high-pressure formation testing at 8,200 PSI, surface choke manifold hydraulic actuator valve jammed partially open. Backpressure spiked 1,400 PSI above maximum safe limit before secondary relief valve cracked.',
    text_snippet: 'Surface choke manifold actuator seized during 8,200 PSI test causing severe pressure surge.',
    risk_level: 'SIF-Precursor',
    hazard: 'Pressure Release',
    activity: 'Well Testing',
    barrier_failure: 'Equipment Jam / Defect',
    sif_precursor: true,
    explanation: 'Overpressure condition on high-pressure surface manifold during live well flow. Major SIF precursor with catastrophic blowout or fragment dispersion potential.',
    entities: {
      hazards: ['Pressure Release', 'Well Control'],
      energies: ['High Pressure Gas'],
      activities: ['Well Testing'],
      equipment: ['Choke Manifold', 'Relief Valve'],
      locations: ['Wellhead Moonpool'],
      barrierFailures: ['Equipment Jam / Defect'],
    },
    riskAssessment: {
      likelihood: 2,
      severity: 5,
      riskScore: 10,
      riskLevel: 'Extreme',
      sifPotential: true,
      reasons: ['Exceeded maximum allowable working pressure on high-pressure hydrocarbon manifold.'],
    },
  },
  {
    id: 'rep-006',
    filename: 'rig-d-inc-01.pdf',
    date: '2026-09-04',
    time: '13:10',
    site: 'Rig Site D',
    siteId: 'rig-site-d',
    siteName: 'Rig Site D',
    location: 'Rig Site D - Crude Unit Heater',
    report_text: 'During burner tube maintenance on fired heater H-101, hot work permit was issued without LEL atmospheric gas testing within 15 meters. Trace hydrocarbon vapors from neighboring drain seal ignited upon torch ignition.',
    full_text: 'During burner tube maintenance on fired heater H-101, hot work permit was issued without LEL atmospheric gas testing within 15 meters. Trace hydrocarbon vapors from neighboring drain seal ignited upon torch ignition.',
    text_snippet: 'Flash ignition during hot work near open sewer drain due to omitted explosive gas survey.',
    risk_level: 'High',
    hazard: 'Fire / Explosion',
    activity: 'Hot Work',
    barrier_failure: 'Gas Testing Omitted',
    sif_precursor: true,
    explanation: 'Hot work ignition source in close proximity to hydrocarbon drain with missing combustible gas verification represents a major SIF precursor.',
    entities: {
      hazards: ['Fire / Explosion', 'Flammable Gas'],
      energies: ['Thermal', 'Chemical'],
      activities: ['Hot Work'],
      equipment: ['Cutting Torch', 'LEL Meter'],
      locations: ['Crude Unit Heater'],
      barrierFailures: ['Gas Testing Omitted'],
    },
    riskAssessment: {
      likelihood: 3,
      severity: 4,
      riskScore: 12,
      riskLevel: 'High',
      sifPotential: true,
      reasons: ['Hydrocarbon atmosphere ignition risk absent mandatory continuous monitoring.'],
    },
  },
  {
    id: 'rep-007',
    filename: 'rig-c-inc-01.pdf',
    date: '2026-09-03',
    time: '10:00',
    site: 'Rig Site C',
    siteId: 'rig-site-c',
    siteName: 'Rig Site C',
    location: 'Rig Site C - Pipe Arm Feed',
    report_text: 'Assistant driller reached inside hydraulic pipe arm swing radius to clear debris while machine remained energized in auto mode. Proximity safety light curtain was found bypassed with reflective tape.',
    full_text: 'Assistant driller reached inside hydraulic pipe arm swing radius to clear debris while machine remained energized in auto mode. Proximity safety light curtain was found bypassed with reflective tape.',
    text_snippet: 'Worker entered automated pipe handling sweep path with optical safety interlock defeated.',
    risk_level: 'SIF-Precursor',
    hazard: 'Pinch Point / Crushing',
    activity: 'Pipe Handling',
    barrier_failure: 'Safety Interlock Bypassed',
    sif_precursor: true,
    explanation: 'Intentional defeat of optical machine safety interlocks inside 20-ton hydraulic arm travel path is a direct life-threatening SIF precursor.',
    entities: {
      hazards: ['Pinch Point / Crushing'],
      energies: ['Mechanical'],
      activities: ['Pipe Handling'],
      equipment: ['Hydraulic Pipe Arm', 'Light Curtain'],
      locations: ['Pipe Arm Feed'],
      barrierFailures: ['Safety Interlock Bypassed'],
    },
    riskAssessment: {
      likelihood: 3,
      severity: 5,
      riskScore: 15,
      riskLevel: 'Extreme',
      sifPotential: true,
      reasons: ['Defeated engineering control protecting personnel from crush zone.'],
    },
  },
];

// Helper: map a MongoDB Document to standard report shape
function mapMongoDocToReport(doc) {
  const dateStr = doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : '2026-09-09';
  const timeStr = doc.createdAt ? new Date(doc.createdAt).toTimeString().slice(0, 5) : '14:30';

  const hazards = doc.entities?.hazards || [];
  const primaryHazard = hazards[0] || 'Safety Incident';
  const activities = doc.entities?.activities || [];
  const primaryActivity = activities[0] || 'Field Operations';
  const barriers = doc.entities?.barrierFailures || [];
  const primaryBarrier = barriers[0] || 'Procedural Compliance';
  const locations = doc.entities?.locations || [];
  const primaryLocation = locations[0] || 'Rig Site A';

  const riskAssessment = doc.riskAssessment || {};
  let riskLevel = riskAssessment.riskLevel || 'Medium';
  if (riskLevel === 'Extreme') riskLevel = 'SIF-Precursor';

  const sifPotential = Boolean(
    doc.sif_precursor?.sifPotential ||
    riskAssessment.sifPotential ||
    doc.sifPrecursorSeverity?.sifPotential ||
    riskLevel === 'SIF-Precursor' ||
    riskLevel === 'Extreme'
  );

  return {
    id: String(doc._id),
    filename: doc.originalName || 'Uploaded Safety Report.pdf',
    date: dateStr,
    time: timeStr,
    site: primaryLocation.includes('Site') ? primaryLocation : 'Rig Site A',
    siteId: primaryLocation.toLowerCase().replace(/\s+/g, '-').includes('site')
      ? primaryLocation.toLowerCase().replace(/\s+/g, '-')
      : 'rig-site-a',
    siteName: primaryLocation.includes('Site') ? primaryLocation : 'Rig Site A',
    location: locations.length > 0 ? locations.join(' - ') : 'Rig Site A - Operations Area',
    report_text: doc.cleanedText || doc.extractedText || doc.rawText || doc.originalName,
    full_text: doc.rawText || doc.extractedText || doc.cleanedText || doc.originalName,
    text_snippet: (doc.cleanedText || doc.extractedText || doc.rawText || '').slice(0, 160) || 'Analyzed safety incident report with DistilBERT NER entity mapping.',
    risk_level: riskLevel,
    hazard: primaryHazard,
    activity: primaryActivity,
    barrier_failure: primaryBarrier,
    sif_precursor: sifPotential,
    explanation: riskAssessment.reasons?.join('. ') || 'Processed by SIFguard NLP intelligence model.',
    entities: doc.entities || { hazards: [], energies: [], activities: [], equipment: [], locations: [], barrierFailures: [] },
    riskAssessment: doc.riskAssessment || null,
    rawNerEntities: doc.rawNerEntities || [],
    processingStatus: doc.processingStatus || doc.status || 'Completed',
    status: doc.status || 'Completed',
  };
}

// GET /api/reports
const getReports = async (req, res) => {
  try {
    let mongoReports = [];
    try {
      const docs = await Report.find().sort({ createdAt: -1 }).lean();
      mongoReports = docs.map(mapMongoDocToReport);
    } catch (dbErr) {
      console.warn('MongoDB query warning in getReports:', dbErr.message);
    }

    // Merge MongoDB analyzed reports with baseline safety reports
    const combined = [...mongoReports, ...BASELINE_REPORTS];

    // Optional query filtering
    const { site, siteId, risk_level, hazard } = req.query;
    let filtered = combined;
    if (siteId && siteId !== 'ALL') {
      filtered = filtered.filter((r) => r.siteId === siteId);
    }
    if (site && site !== 'ALL') {
      filtered = filtered.filter((r) => r.site === site || r.siteName === site);
    }
    if (risk_level) {
      filtered = filtered.filter((r) => r.risk_level.toLowerCase() === risk_level.toLowerCase());
    }
    if (hazard) {
      filtered = filtered.filter((r) => r.hazard.toLowerCase().includes(hazard.toLowerCase()));
    }

    return res.status(200).json(filtered);
  } catch (error) {
    console.error('getReports error:', error);
    return res.status(500).json({ message: 'Failed to retrieve reports', error: error.message });
  }
};

// GET /api/reports/:reportId
const getReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Check MongoDB first
    try {
      if (reportId.match(/^[0-9a-fA-F]{24}$/)) {
        const doc = await Report.findById(reportId).lean();
        if (doc) return res.status(200).json(mapMongoDocToReport(doc));
      }
    } catch (e) {
      // Not a mongo ObjectId, continue
    }

    // Check baseline reports
    const found = BASELINE_REPORTS.find((r) => r.id === reportId);
    if (found) return res.status(200).json(found);

    return res.status(404).json({ message: `Report '${reportId}' not found.` });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving report', error: error.message });
  }
};

// GET /api/reports/:reportId/related
const getRelatedReports = async (req, res) => {
  try {
    const { reportId } = req.params;
    const all = await getCombinedReportsList();
    const target = all.find((r) => r.id === reportId);

    const related = all.filter(
      (r) => r.id !== reportId && (r.hazard === target?.hazard || r.siteId === target?.siteId)
    ).slice(0, 4);

    return res.status(200).json(related);
  } catch (error) {
    return res.status(200).json([]);
  }
};

// GET /api/reports/sif-precursors
const getSifPrecursors = async (req, res) => {
  try {
    const all = await getCombinedReportsList();
    const precursors = all.filter((r) => r.sif_precursor || r.risk_level === 'SIF-Precursor');
    return res.status(200).json(precursors);
  } catch (error) {
    return res.status(200).json([]);
  }
};

async function getCombinedReportsList() {
  try {
    const docs = await Report.find().sort({ createdAt: -1 }).lean();
    return [...docs.map(mapMongoDocToReport), ...BASELINE_REPORTS];
  } catch {
    return [...BASELINE_REPORTS];
  }
}

module.exports = {
  getReports,
  getReport,
  getRelatedReports,
  getSifPrecursors,
};
