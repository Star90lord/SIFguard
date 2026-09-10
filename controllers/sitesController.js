// controllers/sitesController.js
// SIFguard Sites Controller

const INITIAL_SITES = [
  {
    id: 'rig-site-a',
    name: 'Rig Site A',
    code: 'RSA-01',
    location: 'Gulf of Mexico - Block 42',
    type: 'Offshore Platform',
    status: 'Active',
    description: 'Deepwater production platform operating 12 production wells and subsea tiebacks.',
    totalReports: 14,
    highRiskCount: 5,
    sifCount: 3,
    health: { status: 'Watch', description: 'Recurring moderate risks under active watch', severityIndex: 2 },
    lastActivity: '09 Sep 2026',
    topHazards: [
      { hazard: 'Dropped Object', count: 4 },
      { hazard: 'Pressure Release', count: 3 },
      { hazard: 'Electrical', count: 2 },
      { hazard: 'Confined Space', count: 2 },
    ],
    riskDistribution: { Low: 3, Medium: 3, High: 5, 'SIF-Precursor': 3 },
  },
  {
    id: 'rig-site-b',
    name: 'Rig Site B',
    code: 'RSB-04',
    location: 'North Sea - Sector 12',
    type: 'Drilling Vessel',
    status: 'Watch',
    description: 'Semi-submersible drilling rig engaged in high-pressure exploration drilling.',
    totalReports: 9,
    highRiskCount: 3,
    sifCount: 2,
    health: { status: 'Critical', description: 'Elevated frequency of high-energy barrier failures', severityIndex: 3 },
    lastActivity: '08 Sep 2026',
    topHazards: [
      { hazard: 'Fall from Height', count: 3 },
      { hazard: 'Chemical Exposure', count: 2 },
      { hazard: 'Lifting Operations', count: 2 },
    ],
    riskDistribution: { Low: 2, Medium: 2, High: 3, 'SIF-Precursor': 2 },
  },
  {
    id: 'rig-site-c',
    name: 'Rig Site C',
    code: 'RSC-09',
    location: 'Permian Basin - Pad 7',
    type: 'Onshore Pad',
    status: 'Stable',
    description: 'Multi-well onshore drilling pad with automated pipe-handling equipment.',
    totalReports: 6,
    highRiskCount: 1,
    sifCount: 0,
    health: { status: 'Stable', description: 'Operating within normal safety tolerances', severityIndex: 1 },
    lastActivity: '07 Sep 2026',
    topHazards: [
      { hazard: 'Vehicle Movement', count: 2 },
      { hazard: 'Pinch Point', count: 2 },
      { hazard: 'Noise', count: 1 },
    ],
    riskDistribution: { Low: 3, Medium: 2, High: 1, 'SIF-Precursor': 0 },
  },
  {
    id: 'rig-site-d',
    name: 'Rig Site D',
    code: 'RSD-02',
    location: 'Texas Gulf Coast',
    type: 'Refinery Processing Unit',
    status: 'Stable',
    description: 'Crude distillation and catalytic cracking unit undergoing turnaround maintenance.',
    totalReports: 7,
    highRiskCount: 2,
    sifCount: 1,
    health: { status: 'Stable', description: 'Operating within normal safety tolerances', severityIndex: 1 },
    lastActivity: '06 Sep 2026',
    topHazards: [
      { hazard: 'Hot Work', count: 3 },
      { hazard: 'Toxic Gas', count: 2 },
      { hazard: 'Steam Leak', count: 1 },
    ],
    riskDistribution: { Low: 2, Medium: 2, High: 2, 'SIF-Precursor': 1 },
  },
  {
    id: 'rig-site-e',
    name: 'Rig Site E',
    code: 'RSE-07',
    location: 'Offshore Deepwater',
    type: 'Exploration Rig',
    status: 'Critical',
    description: 'Ultra-deepwater drillship performing exploratory wildcat drilling in challenging formations.',
    totalReports: 8,
    highRiskCount: 4,
    sifCount: 3,
    health: { status: 'Critical', description: 'Multiple SIF precursors detected in last 14 days', severityIndex: 3 },
    lastActivity: '09 Sep 2026',
    topHazards: [
      { hazard: 'Well Control', count: 3 },
      { hazard: 'High Pressure Gas', count: 2 },
      { hazard: 'Dropped Object', count: 2 },
    ],
    riskDistribution: { Low: 1, Medium: 0, High: 4, 'SIF-Precursor': 3 },
  },
];

let sitesStore = [...INITIAL_SITES];

// GET /api/sites
const getSites = async (req, res) => {
  return res.status(200).json(sitesStore);
};

// GET /api/sites/:siteId
const getSite = async (req, res) => {
  const { siteId } = req.params;
  const site = sitesStore.find((s) => s.id === siteId || s.name.toLowerCase() === siteId.toLowerCase());
  if (!site) {
    return res.status(404).json({ message: `Site '${siteId}' not found.` });
  }
  return res.status(200).json(site);
};

// POST /api/sites
const addSite = async (req, res) => {
  const siteData = req.body || {};
  const newSite = {
    id: siteData.id || `site-${Date.now()}`,
    name: siteData.name || 'New Site',
    code: siteData.code || 'NS-01',
    location: siteData.location || 'Unknown Location',
    type: siteData.type || 'Onshore Pad',
    status: siteData.status || 'Active',
    description: siteData.description || '',
    totalReports: 0,
    highRiskCount: 0,
    sifCount: 0,
    health: { status: 'Stable', description: 'New site registered', severityIndex: 1 },
    lastActivity: 'Just added',
    topHazards: [],
    riskDistribution: { Low: 0, Medium: 0, High: 0, 'SIF-Precursor': 0 },
    ...siteData,
  };
  sitesStore.push(newSite);
  return res.status(201).json(newSite);
};

// PUT /api/sites/:siteId
const updateSite = async (req, res) => {
  const { siteId } = req.params;
  const idx = sitesStore.findIndex((s) => s.id === siteId);
  if (idx === -1) {
    return res.status(404).json({ message: `Site '${siteId}' not found.` });
  }
  sitesStore[idx] = { ...sitesStore[idx], ...req.body };
  return res.status(200).json(sitesStore[idx]);
};

// GET /api/sites/compare
const compareSites = async (req, res) => {
  const siteIdsParam = req.query.sites || '';
  const siteIds = siteIdsParam ? siteIdsParam.split(',') : sitesStore.map((s) => s.id);
  const matchedSites = sitesStore.filter((s) => siteIds.includes(s.id));
  return res.status(200).json(matchedSites);
};

// GET /api/sites/:siteId/history
const getSiteHistory = async (req, res) => {
  const { siteId } = req.params;
  const site = sitesStore.find((s) => s.id === siteId);
  const history = [
    { period: '2026-05', total: 10, sif: 1, high: 3, medium: 4, low: 2 },
    { period: '2026-06', total: 14, sif: 2, high: 4, medium: 5, low: 3 },
    { period: '2026-07', total: 12, sif: 1, high: 3, medium: 5, low: 3 },
    { period: '2026-08', total: 16, sif: 3, high: 5, medium: 4, low: 4 },
    { period: '2026-09', total: site?.totalReports || 14, sif: site?.sifCount || 3, high: site?.highRiskCount || 5, medium: 3, low: 3 },
  ];
  return res.status(200).json({ siteId, siteName: site?.name || siteId, history });
};

module.exports = {
  getSites,
  getSite,
  addSite,
  updateSite,
  compareSites,
  getSiteHistory,
};
