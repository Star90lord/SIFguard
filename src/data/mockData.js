// ─── Single Analysis Result Mock (Default Fallback) ──────────────────
export const mockAnalysisResult = {
  risk_level: 'High',
  hazard: 'Fall',
  activity: 'Scaffold Work',
  location: 'Rig Site B',
  barrier_failure: 'PPE Non-compliance',
  explanation:
    'Report describes unsecured work at height without PPE, a known SIF precursor. The worker was operating on an elevated scaffold platform without a harness, and the safety officer on site noted that the guardrails had been removed earlier for material transport and were not reinstalled.',
};

// ─── 5-Report Sample Batch (For 1-Click Testing & Demonstration) ──────
export const mockSampleBatch = [
  {
    id: 'sample-01',
    filename: 'rig-a-incident-01.pdf',
    size: '2.4 MB',
    date: '2026-09-09',
    time: '09:15',
    site: 'Rig Site A',
    siteId: 'rig-site-a',
    siteName: 'Rig Site A',
    location: 'Rig Site A - Mast Section',
    report_text:
      'During derrick inspection on Rig Site A, a loose 4-inch steel casing clamp was found suspended 18 meters above the active drill floor. Vibration dampers were completely deteriorated. Drill crew was operating directly below without overhead safety netting.',
    risk_level: 'High',
    hazard: 'Dropped Object',
    activity: 'Drilling Operations',
    barrier_failure: 'Equipment Maintenance',
    sif_precursor: true,
    explanation:
      'Unsecured 4-inch steel hardware at 18m directly above populated floor. Direct SIF precursor due to high potential energy drop trajectory without physical catch barriers.',
  },
  {
    id: 'sample-02',
    filename: 'rig-a-incident-02.pdf',
    size: '1.8 MB',
    date: '2026-09-08',
    time: '11:00',
    site: 'Rig Site A',
    siteId: 'rig-site-a',
    siteName: 'Rig Site A',
    location: 'Rig Site A - Mud Tank 3',
    report_text:
      'Confined space entry performed inside Mud Tank 3 for routine sludge desilting. Atmospheric testing log was missing calibration stamps, and the emergency retrieval tripod had not been anchored prior to entry.',
    risk_level: 'SIF-Precursor',
    hazard: 'Confined Space',
    activity: 'Tank Cleaning',
    barrier_failure: 'Procedural Violation',
    sif_precursor: true,
    explanation:
      'Atmospheric monitoring deficiency coupled with unanchored emergency retrieval gear inside a confined space constitutes an acute SIF precursor.',
  },
  {
    id: 'sample-03',
    filename: 'rig-a-incident-03.pdf',
    size: '1.5 MB',
    date: '2026-09-07',
    time: '16:45',
    site: 'Rig Site A',
    siteId: 'rig-site-a',
    siteName: 'Rig Site A',
    location: 'Rig Site A - Generator Room',
    report_text:
      'Electrician performing terminal torque verification noticed damaged primary insulation on 480V distribution bus. Breaker was locked out correctly but secondary standby circuit was energized.',
    risk_level: 'Medium',
    hazard: 'Electrical',
    activity: 'Maintenance',
    barrier_failure: 'Isolation Incomplete',
    sif_precursor: false,
    explanation:
      'Incomplete boundary isolation during maintenance on 480V systems. Lockout procedure was partially followed, mitigating immediate arc-flash hazard.',
  },
  {
    id: 'sample-04',
    filename: 'rig-b-safety-report.docx',
    size: '1.2 MB',
    date: '2026-09-09',
    time: '08:30',
    site: 'Rig Site B',
    siteId: 'rig-site-b',
    siteName: 'Rig Site B',
    location: 'Rig Site B - Substructure',
    report_text:
      'Welder was operating on suspended scaffold at 9 meters. Lanyard was secured to a non-engineered structural beam rather than the designated overhead lifeline. Guardrail kickplate was absent.',
    risk_level: 'High',
    hazard: 'Fall',
    activity: 'Scaffold Work',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: true,
    explanation:
      'Attachment to non-engineered structural anchor at 9m height combined with absent kickplates violates primary fall arrest standards.',
  },
  {
    id: 'sample-05',
    filename: 'warehouse-inspection.txt',
    size: '18 KB',
    date: '2026-09-06',
    time: '11:00',
    site: 'Warehouse',
    siteId: 'warehouse',
    siteName: 'Warehouse',
    location: 'Warehouse - Aisle 4',
    report_text:
      'Electric forklift driver observed pedestrian walking through marked heavy-traffic transit corridor without high-visibility vest. Driver sounded horn and braked smoothly with 4 meters clearance.',
    risk_level: 'Low',
    hazard: 'Vehicle Interaction',
    activity: 'Warehouse Operations',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: false,
    explanation:
      'Pedestrian bypassed high-vis requirement in marked lane. Operator attentiveness and braking distance prevented escalation to collision.',
  },
];

// ─── 38 Domain-Accurate Safety Reports Across 5 Industrial Facilities ─
export const mockReports = [
  // ── Rig Site A (8 reports, multiple dates including same-date clusters)
  {
    id: 1,
    date: '2026-09-09',
    time: '09:15',
    site: 'Rig Site A',
    location: 'Rig Site A - Mast Section',
    text_snippet:
      'Unsecured 4-inch steel casing clamp suspended 18 meters above active drill floor without overhead safety netting.',
    full_text:
      'During derrick inspection on September 9, 2026 on Rig Site A, a loose 4-inch steel casing clamp was found suspended 18 meters above the active drill floor. Vibration dampers were completely deteriorated. Drill crew was operating directly below without overhead safety netting. Work was halted immediately.',
    risk_level: 'High',
    hazard: 'Dropped Object',
    activity: 'Drilling Operations',
    barrier_failure: 'Equipment Maintenance',
    sif_precursor: true,
    explanation:
      'Direct SIF precursor: dropped object from 18m height with potential fatal energy rating over populated drill floor.',
    timestamp: '2026-09-09T09:15:00Z',
  },
  {
    id: 2,
    date: '2026-09-09',
    time: '14:30',
    site: 'Rig Site A',
    location: 'Rig Site A - Mud Pumps',
    text_snippet:
      'Pressure relief valve bypass line showed severe external pitting and improper seal clamp installation.',
    full_text:
      'On September 9, 2026 at 14:30, routine walkaround by HSE supervisor at Rig Site A mud pump room identified severe corrosion pitting on high-pressure relief line. Temporary hose clamp had been placed instead of certified flange.',
    risk_level: 'Medium',
    hazard: 'Pressure Release',
    activity: 'Maintenance',
    barrier_failure: 'Improper Modification',
    sif_precursor: false,
    explanation:
      'Uncertified temporary repair on pressure manifold. Addressed prior to 3000 PSI pump startup.',
    timestamp: '2026-09-09T14:30:00Z',
  },
  {
    id: 3,
    date: '2026-09-08',
    time: '11:00',
    site: 'Rig Site A',
    location: 'Rig Site A - Mud Tank 3',
    text_snippet:
      'Confined space entry performed without atmospheric testing calibration and unanchored rescue tripod.',
    full_text:
      'On September 8, 2026, confined space entry was executed inside Mud Tank 3 for desilting on Rig Site A. Atmospheric meter calibration logs were out of date by 6 months, and entry attendant was not positioned at manway.',
    risk_level: 'SIF-Precursor',
    hazard: 'Confined Space',
    activity: 'Tank Cleaning',
    barrier_failure: 'Procedural Violation',
    sif_precursor: true,
    explanation:
      'Confined space entry into toxic vapor environment without calibrated instrumentation or emergency standby. Direct life-threatening precursor.',
    timestamp: '2026-09-08T11:00:00Z',
  },
  {
    id: 4,
    date: '2026-09-07',
    time: '16:45',
    site: 'Rig Site A',
    location: 'Rig Site A - Generator Room',
    text_snippet:
      'Electrician performing terminal torque verification noticed damaged insulation on 480V line.',
    full_text:
      'On September 7, 2026, an electrician observed cracked cable insulation on a 480V generator feeder during scheduled maintenance on Rig Site A. Panel had been de-energized, preventing injury.',
    risk_level: 'Medium',
    hazard: 'Electrical',
    activity: 'Maintenance',
    barrier_failure: 'Isolation Incomplete',
    sif_precursor: false,
    explanation:
      'Electrical degradation identified during de-energized check. Good isolation protocol prevented flashover.',
    timestamp: '2026-09-07T16:45:00Z',
  },
  {
    id: 5,
    date: '2026-09-05',
    time: '10:30',
    site: 'Rig Site A',
    location: 'Rig Site A - Pipe Rack',
    text_snippet:
      'Near-miss: crane hoist wire showed 3 broken strands during 12-ton drill collar lift. Lift paused.',
    full_text:
      'On September 5, 2026 at Rig Site A pipe rack, crane rigger halted lift of 12-ton drill collars when broken outer wire strands were observed on the hoist rope. The exclusion perimeter held personnel clear.',
    risk_level: 'High',
    hazard: 'Dropped Object',
    activity: 'Lifting Operations',
    barrier_failure: 'Equipment Failure',
    sif_precursor: true,
    explanation:
      'Critical lifting equipment compromise under heavy static load. Catastrophic parting averted by alert rigger.',
    timestamp: '2026-09-05T10:30:00Z',
  },
  {
    id: 6,
    date: '2026-09-03',
    time: '13:00',
    site: 'Rig Site A',
    location: 'Rig Site A - Workshop Annex',
    text_snippet:
      'Pipefitter sustained laceration to left hand from using improper cutting tool rather than pipe beveler.',
    full_text:
      'On September 3, 2026 at Rig Site A workshop annex, a contractor used a handheld angle grinder without guard to bevel a 3-inch pipe, resulting in a cut requiring 4 sutures.',
    risk_level: 'Medium',
    hazard: 'Hand Injury',
    activity: 'Pipe Fitting',
    barrier_failure: 'Improper Tool Use',
    sif_precursor: false,
    explanation:
      'Removal of grinder safety guard led to kickback and hand laceration.',
    timestamp: '2026-09-03T13:00:00Z',
  },
  {
    id: 7,
    date: '2026-09-01',
    time: '15:45',
    site: 'Rig Site A',
    location: 'Rig Site A - Chemical Skid',
    text_snippet:
      'Chemical splash of corrosion inhibitor during transfer pump hookup. Safety glasses worn, face shield omitted.',
    full_text:
      'On September 1, 2026 at Rig Site A chemical skid, biocide transfer hose released spray under pressure when camlock was engaged improperly. Worker received facial skin contact; eyewash used immediately.',
    risk_level: 'High',
    hazard: 'Chemical Exposure',
    activity: 'Chemical Transfer',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: false,
    explanation:
      'Pressurized chemical release with inadequate facial barrier. Medical evaluation required.',
    timestamp: '2026-09-01T15:45:00Z',
  },
  {
    id: 8,
    date: '2026-08-29',
    time: '08:00',
    site: 'Rig Site A',
    location: 'Rig Site A - Drill Floor',
    text_snippet:
      'Routine safety audit: 100% compliance on personal fall arrest harness inspections and tagging.',
    full_text:
      'On August 29, 2026, drill crew on Rig Site A completed full monthly harness and lanyard retirement audit with zero defects recorded.',
    risk_level: 'Low',
    hazard: 'None',
    activity: 'General Operations',
    barrier_failure: 'None',
    sif_precursor: false,
    explanation:
      'Exemplary proactive verification of critical life-saving personal equipment.',
    timestamp: '2026-08-29T08:00:00Z',
  },

  // ── Rig Site B (9 reports, multiple dates including SIF precursor)
  {
    id: 9,
    date: '2026-09-09',
    time: '08:30',
    site: 'Rig Site B',
    location: 'Rig Site B - Derrick Level 3',
    text_snippet:
      'Employee welding on scaffold at 12m height without harness lanyard anchored. Mid-rails missing.',
    full_text:
      'On September 9, 2026 at Rig Site B, welder was observed standing on third-level scaffold platform 12m elevated without shock-absorbing lanyard tied off. Guardrails had been dismantled for material hoist.',
    risk_level: 'High',
    hazard: 'Fall',
    activity: 'Scaffold Work',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: true,
    explanation:
      'Work at height on compromised staging without fall protection. Severe SIF precursor.',
    timestamp: '2026-09-09T08:30:00Z',
  },
  {
    id: 10,
    date: '2026-09-08',
    time: '14:20',
    site: 'Rig Site B',
    location: 'Rig Site B - Wellhead Cellar',
    text_snippet:
      'Hydrocarbon vapor monitor detected 35% LEL in cellar during valve grease pack. Ignition sources in area.',
    full_text:
      'On September 8, 2026 at Rig Site B wellhead cellar, gas sniffing probe triggered visual alarm at 35% LEL. Diesel generator exhaust was routed within 6 meters of cellar grating. Engine shutdown executed.',
    risk_level: 'SIF-Precursor',
    hazard: 'Flammable Atmosphere',
    activity: 'Wellhead Maintenance',
    barrier_failure: 'Containment Failure',
    sif_precursor: true,
    explanation:
      'Combustible gas accumulation in confined cellar with adjacent active diesel exhaust. High potential for vapor cloud fire/explosion.',
    timestamp: '2026-09-08T14:20:00Z',
  },
  {
    id: 11,
    date: '2026-09-06',
    time: '11:45',
    site: 'Rig Site B',
    location: 'Rig Site B - Motor Control Center',
    text_snippet:
      'Electrician received minor arc flash singe when testing 480V breaker with uninsulated probe.',
    full_text:
      'On September 6, 2026 at Rig Site B MCC room, an electrician brushed an uninsulated multimeter probe tip against an energized bus rail. Spark caused flash singe to hand; flame-retardant shirt protected torso.',
    risk_level: 'Medium',
    hazard: 'Electrical',
    activity: 'Maintenance',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: false,
    explanation:
      'Arc flash incident caused by substandard test leads. FR clothing prevented severe burns.',
    timestamp: '2026-09-06T11:45:00Z',
  },
  {
    id: 12,
    date: '2026-09-04',
    time: '08:30',
    site: 'Rig Site B',
    location: 'Rig Site B - Mud Pit Deck',
    text_snippet:
      'Worker slipped on oily residue on pit walkway. Area had been washed down without degreaser.',
    full_text:
      'On September 4, 2026 on Rig Site B mud pit deck, deckhand slipped and contused right elbow. Surface had standing synthetic oil film after water rinse without detergent spray.',
    risk_level: 'Low',
    hazard: 'Slip/Trip/Fall',
    activity: 'Housekeeping',
    barrier_failure: 'Housekeeping',
    sif_precursor: false,
    explanation:
      'Low-severity slip on slippery deck surface. First aid administered on site.',
    timestamp: '2026-09-04T08:30:00Z',
  },
  {
    id: 13,
    date: '2026-09-02',
    time: '10:00',
    site: 'Rig Site B',
    location: 'Rig Site B - Casing Staging',
    text_snippet:
      'Scaffold inspection found missing toe-boards and green status tag unsigned for 48 hours.',
    full_text:
      'On September 2, 2026 at Rig Site B casing staging, safety audit noted 4 missing toe-boards on 5-meter scaffold platform. Work was halted until contractor rectified tagging and containment.',
    risk_level: 'Low',
    hazard: 'Fall',
    activity: 'Scaffold Work',
    barrier_failure: 'Inspection Gap',
    sif_precursor: false,
    explanation:
      'Proactive inspection defect identification prior to incident occurrence.',
    timestamp: '2026-09-02T10:00:00Z',
  },
  {
    id: 14,
    date: '2026-08-30',
    time: '16:00',
    site: 'Rig Site B',
    location: 'Rig Site B - Shaker Screen House',
    text_snippet:
      'Mud shaker screen ventilation duct disconnected. High oil-based mist concentration reported.',
    full_text:
      'On August 30, 2026 at Rig Site B, extraction flex duct had slipped off shaker exhaust collar. Two roustabouts reported eye stinging after 30 minutes. Duct reattached and clamped.',
    risk_level: 'Medium',
    hazard: 'Chemical Exposure',
    activity: 'Drilling Operations',
    barrier_failure: 'Ventilation Failure',
    sif_precursor: false,
    explanation:
      'Inadequate local exhaust ventilation caused localized vapor buildup.',
    timestamp: '2026-08-30T16:00:00Z',
  },
  {
    id: 15,
    date: '2026-08-27',
    time: '13:15',
    site: 'Rig Site B',
    location: 'Rig Site B - Highline Yard',
    text_snippet:
      'Forklift transported 8-meter drill pipe bundle without side chocks. Bundle shifted on turn.',
    full_text:
      'On August 27, 2026 at Rig Site B highline yard, rough terrain forklift turned at 15 km/h with 4 unsecured casing joints. One joint rolled off onto gravel pathway. No pedestrians nearby.',
    risk_level: 'High',
    hazard: 'Dropped Object',
    activity: 'Material Handling',
    barrier_failure: 'Cargo Restraint Failure',
    sif_precursor: true,
    explanation:
      'Unsecured tubular load transit on rough terrain. High risk of pedestrian crush injury.',
    timestamp: '2026-08-27T13:15:00Z',
  },
  {
    id: 16,
    date: '2026-08-25',
    time: '09:00',
    site: 'Rig Site B',
    location: 'Rig Site B - Flare Knockout Drum',
    text_snippet:
      'Pressure transmitter bleed valve found plugged with paraffin wax. Gauge read zero falsely.',
    full_text:
      'On August 25, 2026 at Rig Site B flare drum, instrumentation tech cleared wax blockage in gauge line, revealing 42 PSI trapped system pressure.',
    risk_level: 'Medium',
    hazard: 'Pressure Release',
    activity: 'Maintenance',
    barrier_failure: 'Instrumentation Failure',
    sif_precursor: false,
    explanation:
      'Trapped pressure behind blinded instrumentation line. Procedural bleeder check prevented blowout.',
    timestamp: '2026-08-25T09:00:00Z',
  },
  {
    id: 17,
    date: '2026-08-20',
    time: '15:30',
    site: 'Rig Site B',
    location: 'Rig Site B - Camp Generator Area',
    text_snippet:
      'Secondary containment berm on 2000L diesel day tank showed torn geomembrane liner.',
    full_text:
      'On August 20, 2026, weekly environmental sweep identified 1.2m tear in diesel containment liner below fueling nozzle. Liner patched within 4 hours; no soil contamination.',
    risk_level: 'Low',
    hazard: 'Environmental',
    activity: 'Inspection',
    barrier_failure: 'Containment Failure',
    sif_precursor: false,
    explanation:
      'Minor physical tear in tertiary spill prevention barrier. Remediated rapidly.',
    timestamp: '2026-08-20T15:30:00Z',
  },

  // ── Processing Unit (7 reports, critical plant operations)
  {
    id: 18,
    date: '2026-09-09',
    time: '11:15',
    site: 'Processing Unit',
    location: 'Processing Unit - Fractionation Column 2',
    text_snippet:
      'Hot work permit issued for flange grinding while adjacent sampling tap was leaking natural gas condensate.',
    full_text:
      'On September 9, 2026 at 11:15 at Processing Unit Column 2, hot work grinding permit was authorized without gas sniff verification within 15 meters. Condensate drip was burning 1.5 meters away upon first spark. Fire watch used dry chemical extinguisher immediately.',
    risk_level: 'SIF-Precursor',
    hazard: 'Fire/Explosion',
    activity: 'Hot Work',
    barrier_failure: 'Permit Violation',
    sif_precursor: true,
    explanation:
      'Hot work executed directly in flammable hydrocarbon plume. Fire watch extinguished flash flame. Critical life-safety barrier failure.',
    timestamp: '2026-09-09T11:15:00Z',
  },
  {
    id: 19,
    date: '2026-09-07',
    time: '14:00',
    site: 'Processing Unit',
    location: 'Processing Unit - Compressor Station B',
    text_snippet:
      'Reciprocating compressor cylinder head vibration exceeded trip threshold. High-vibration interlock was in manual bypass.',
    full_text:
      'On September 7, 2026 at Processing Unit Compressor B, operators discovered that the automatic vibration shutdown interlock had been overridden with a software force during previous shift commissioning.',
    risk_level: 'High',
    hazard: 'Mechanical Rupture',
    activity: 'Operations',
    barrier_failure: 'Interlock Bypass',
    sif_precursor: true,
    explanation:
      'Critical protective interlock defeated without management of change (MOC). Catastrophic compressor disintegration risk.',
    timestamp: '2026-09-07T14:00:00Z',
  },
  {
    id: 20,
    date: '2026-09-04',
    time: '09:40',
    site: 'Processing Unit',
    location: 'Processing Unit - Amine Treater',
    text_snippet:
      'Worker draining amine filter without acid-gas cartridge respirator experienced severe throat irritation.',
    full_text:
      'On September 4, 2026 at Processing Unit amine treater, operator changed cartridge filter wearing standard dust mask instead of full-face gas respirator. Rich amine vapor released. Worker sent to medical.',
    risk_level: 'Medium',
    hazard: 'Chemical Exposure',
    activity: 'Maintenance',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: false,
    explanation:
      'Inappropriate respiratory protection during hazardous amine handling.',
    timestamp: '2026-09-04T09:40:00Z',
  },
  {
    id: 21,
    date: '2026-09-01',
    time: '16:10',
    site: 'Processing Unit',
    location: 'Processing Unit - Tank Farm 4',
    text_snippet:
      'Overfill radar gauge stuck at 82% during diesel transfer. Manual tape gauge proved level was at 96%.',
    full_text:
      'On September 1, 2026 at Processing Unit Tank Farm 4, transfer pump was 4 minutes from overflowing 50,000 barrel tank before operator noticed stagnant radar trend and checked manual dip tape.',
    risk_level: 'High',
    hazard: 'Containment Loss',
    activity: 'Product Transfer',
    barrier_failure: 'Instrumentation Failure',
    sif_precursor: false,
    explanation:
      'Primary instrumentation failure during high-volume hydrocarbon storage transfer.',
    timestamp: '2026-09-01T16:10:00Z',
  },
  {
    id: 22,
    date: '2026-08-28',
    time: '10:00',
    site: 'Processing Unit',
    location: 'Processing Unit - Boiler House',
    text_snippet:
      'Steam valve packing gland packing blew out under 150 PSI saturated steam. Area was cordoned.',
    full_text:
      'On August 28, 2026 at Processing Unit boiler house, high-pressure steam valve packing failed during startup. Steam plume filled catwalk. Zero personnel in blast radius.',
    risk_level: 'Medium',
    hazard: 'Thermal/Steam',
    activity: 'Startup',
    barrier_failure: 'Equipment Degradation',
    sif_precursor: false,
    explanation:
      'Steam valve rupture with localized high-temperature jet hazard.',
    timestamp: '2026-08-28T10:00:00Z',
  },
  {
    id: 23,
    date: '2026-08-24',
    time: '13:00',
    site: 'Processing Unit',
    location: 'Processing Unit - Control Room',
    text_snippet:
      'Alarm flood event: 142 alarms annunciated in 10 minutes following cooling tower fan trip.',
    full_text:
      'On August 24, 2026, control room operators managed severe alarm flood after electrical substation glitch tripped auxiliary cooling. System stabilized safely without emergency flaring.',
    risk_level: 'Low',
    hazard: 'Alarm Overload',
    activity: 'Operations',
    barrier_failure: 'Design Gap',
    sif_precursor: false,
    explanation:
      'Alarm rationalization deficiency during upset condition. Handled cleanly by senior operators.',
    timestamp: '2026-08-24T13:00:00Z',
  },
  {
    id: 24,
    date: '2026-08-19',
    time: '11:00',
    site: 'Processing Unit',
    location: 'Processing Unit - Nitrogen Header',
    text_snippet:
      'Nitrogen purge valve locked closed and tagged per procedure. Routine positive observation.',
    full_text:
      'On August 19, 2026, audit of inerting line lockouts confirmed 100% padlock serial number verification and zero leakage on blind flanges.',
    risk_level: 'Low',
    hazard: 'None',
    activity: 'Lockout/Tagout',
    barrier_failure: 'None',
    sif_precursor: false,
    explanation:
      'Positive observation of rigorous isolation protocol.',
    timestamp: '2026-08-19T11:00:00Z',
  },

  // ── Warehouse (7 reports, logistics, racking, vehicles)
  {
    id: 25,
    date: '2026-09-08',
    time: '15:20',
    site: 'Warehouse',
    location: 'Warehouse - Bay 2 Loading Dock',
    text_snippet:
      'Forklift fell off dock edge when semi-trailer pulled away prematurely during pallet loading.',
    full_text:
      'On September 8, 2026 at Warehouse Bay 2, third-party logistics truck pulled forward while forklift mast was entering the trailer. Dock lock was defective and wheel chocks were not set. Forklift front wheels dropped into 1.2m gap. Operator buckled and unhurt.',
    risk_level: 'SIF-Precursor',
    hazard: 'Vehicle Interaction',
    activity: 'Loading Dock Operations',
    barrier_failure: 'Interlock Failure',
    sif_precursor: true,
    explanation:
      'Dock drive-away event resulting in forklift tip hazard into dock pit. Primary mechanical trailer restraint not engaged.',
    timestamp: '2026-09-08T15:20:00Z',
  },
  {
    id: 26,
    date: '2026-09-06',
    time: '11:00',
    site: 'Warehouse',
    location: 'Warehouse - High Bay Aisle 4',
    text_snippet:
      'Pedestrian walked into active forklift turning corridor without high-visibility vest.',
    full_text:
      'On September 6, 2026 at Warehouse High Bay Aisle 4, contractor walking between racking entered forklift lane without vest. Forklift operator stopped 3m away.',
    risk_level: 'Low',
    hazard: 'Vehicle Interaction',
    activity: 'Warehouse Operations',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: false,
    explanation:
      'Pedestrian crossed into designated vehicle transit lane without required visibility apparel.',
    timestamp: '2026-09-06T11:00:00Z',
  },
  {
    id: 27,
    date: '2026-09-03',
    time: '16:00',
    site: 'Warehouse',
    location: 'Warehouse - Racking Row G',
    text_snippet:
      'Heavy pallet of steel valves (1800kg) loaded on rack tier rated for 1200kg. Upright post buckled.',
    full_text:
      'On September 3, 2026 at Warehouse Row G, warehouseman placed an overweight crate onto level 3 rack. The vertical upright bowed 3cm. Aisle closed and load de-stacked immediately.',
    risk_level: 'High',
    hazard: 'Structural Collapse',
    activity: 'Material Stacking',
    barrier_failure: 'Overloading',
    sif_precursor: true,
    explanation:
      'Severe structural overload on warehouse racking system. High risk of progressive racking collapse.',
    timestamp: '2026-09-03T16:00:00Z',
  },
  {
    id: 28,
    date: '2026-08-31',
    time: '10:30',
    site: 'Warehouse',
    location: 'Warehouse - Chemical Room',
    text_snippet:
      'Drum of solvent stored without grounding bonding wire during decanting into metal dispenser.',
    full_text:
      'On August 31, 2026 at Warehouse chemical store, operator began dispensing toluene solvent into safety can without connecting static ground lead. Corrected prior to dispensing.',
    risk_level: 'Medium',
    hazard: 'Static Spark',
    activity: 'Chemical Handling',
    barrier_failure: 'Grounding Incomplete',
    sif_precursor: false,
    explanation:
      'Absence of static dissipation bonding during transfer of Class 1 flammable liquids.',
    timestamp: '2026-08-31T10:30:00Z',
  },
  {
    id: 29,
    date: '2026-08-26',
    time: '14:00',
    site: 'Warehouse',
    location: 'Warehouse - Staging Lane 1',
    text_snippet:
      'Banding strap snapped under high tension during pallet unpacking, grazing worker cheek.',
    full_text:
      'On August 26, 2026 at Warehouse lane 1, storeman cut high-tensile steel strapping with straight snips instead of safety strap shears. Strap whipped outward.',
    risk_level: 'Low',
    hazard: 'Stored Energy',
    activity: 'Material Handling',
    barrier_failure: 'Improper Tool Use',
    sif_precursor: false,
    explanation:
      'Use of non-retaining shear for steel banding. First aid dressing applied.',
    timestamp: '2026-08-26T14:00:00Z',
  },
  {
    id: 30,
    date: '2026-08-22',
    time: '08:45',
    site: 'Warehouse',
    location: 'Warehouse - Charging Station',
    text_snippet:
      'Battery charging bay eyewash station water stream was rusty and pressure was below 15 PSI.',
    full_text:
      'On August 22, 2026, monthly safety check discovered plumbed eyewash in battery room had sediment buildup. Plumber flushed and replaced supply filter.',
    risk_level: 'Low',
    hazard: 'Emergency Equipment',
    activity: 'Inspection',
    barrier_failure: 'Maintenance Gap',
    sif_precursor: false,
    explanation:
      'Substandard emergency eyewash pressure identified during scheduled test.',
    timestamp: '2026-08-22T08:45:00Z',
  },
  {
    id: 31,
    date: '2026-08-18',
    time: '13:30',
    site: 'Warehouse',
    location: 'Warehouse - Receiving Ramp',
    text_snippet:
      'Driver wheel chocking audit: 100% compliance over 24 delivery trucks inspected.',
    full_text:
      'On August 18, 2026, receiving dock supervisor performed dock compliance audit with zero violations noted across all inbound trailers.',
    risk_level: 'Low',
    hazard: 'None',
    activity: 'Audit',
    barrier_failure: 'None',
    sif_precursor: false,
    explanation:
      'Positive observation: perfect dock wheel chock compliance.',
    timestamp: '2026-08-18T13:30:00Z',
  },

  // ── Workshop (7 reports, machine shop, fabrication, hand tools)
  {
    id: 32,
    date: '2026-09-09',
    time: '10:00',
    site: 'Workshop',
    location: 'Workshop - Lathe Bay',
    text_snippet:
      'Machinist operated 3-jaw lathe while wearing loose long sleeves and cotton work gloves. Chuck guard interlock bypassed.',
    full_text:
      'On September 9, 2026 at 10:00 at Workshop Lathe Bay, machinist was polishing a 4-inch shaft on rotating lathe chuck wearing loose canvas gloves. Acrylic chuck chip guard was tied back with wire.',
    risk_level: 'SIF-Precursor',
    hazard: 'Rotating Machinery',
    activity: 'Machining',
    barrier_failure: 'Guard Interlock Defeated',
    sif_precursor: true,
    explanation:
      'Gloves worn around high-torque rotating lathe chuck with defeated guard interlock. Extreme entrainment / amputation SIF precursor.',
    timestamp: '2026-09-09T10:00:00Z',
  },
  {
    id: 33,
    date: '2026-09-07',
    time: '15:30',
    site: 'Workshop',
    location: 'Workshop - Welding Booth 3',
    text_snippet:
      'Oxygen and acetylene cylinder cart parked 1 meter from active MIG welding sparks without firewall partition.',
    full_text:
      'On September 7, 2026 at Workshop Welding Booth 3, portable oxy-acetylene cylinder rig was left directly in spark shower without non-combustible barrier. Cylinders relocated immediately.',
    risk_level: 'High',
    hazard: 'Fire/Explosion',
    activity: 'Welding',
    barrier_failure: 'Safe Clearance Violated',
    sif_precursor: true,
    explanation:
      'Compressed fuel gas cylinders exposed directly to hot slag and sparks.',
    timestamp: '2026-09-07T15:30:00Z',
  },
  {
    id: 34,
    date: '2026-09-05',
    time: '11:15',
    site: 'Workshop',
    location: 'Workshop - Overhead Crane 5T',
    text_snippet:
      '5-ton overhead crane upper limit switch failed during empty block hoist test. Upper hook contacted drum housing.',
    full_text:
      'On September 5, 2026 at Workshop, pre-shift crane test revealed the anti-two-block limit switch failed to cut motor power. Crane tagged out for limit switch replacement.',
    risk_level: 'Medium',
    hazard: 'Equipment Failure',
    activity: 'Testing',
    barrier_failure: 'Interlock Failure',
    sif_precursor: false,
    explanation:
      'Crane upper travel limit switch failure caught during daily pre-use verification.',
    timestamp: '2026-09-05T11:15:00Z',
  },
  {
    id: 35,
    date: '2026-09-02',
    time: '14:20',
    site: 'Workshop',
    location: 'Workshop - Paint Booth',
    text_snippet:
      'Epoxy primer spray application conducted with paint booth exhaust filter manometer in red zone.',
    full_text:
      'On September 2, 2026 at Workshop Paint Booth, overspray mist accumulated due to fully clogged fiberglass exhaust arrestors. Work halted; filters replaced.',
    risk_level: 'Low',
    hazard: 'Chemical Exposure',
    activity: 'Painting',
    barrier_failure: 'Ventilation Degradation',
    sif_precursor: false,
    explanation:
      'Ventilation filter saturation caused minor vapor buildup in enclosure.',
    timestamp: '2026-09-02T14:20:00Z',
  },
  {
    id: 36,
    date: '2026-08-28',
    time: '09:30',
    site: 'Workshop',
    location: 'Workshop - Pedestal Grinder',
    text_snippet:
      'Tool rest gap on 10-inch bench grinder was 8mm (standard is maximum 3mm). Workpiece jammed.',
    full_text:
      'On August 28, 2026 at Workshop, small steel bracket caught in the tool rest gap during deburring. Grinding wheel chipped slightly; operator was wearing full face shield.',
    risk_level: 'Medium',
    hazard: 'Flying Debris',
    activity: 'Grinding',
    barrier_failure: 'Machine Adjustment Gap',
    sif_precursor: false,
    explanation:
      'Excessive tool rest clearance allowed workpiece pinching and wheel gouging. Face shield prevented eye impact.',
    timestamp: '2026-08-28T09:30:00Z',
  },
  {
    id: 37,
    date: '2026-08-23',
    time: '16:00',
    site: 'Workshop',
    location: 'Workshop - Scrap Yard',
    text_snippet:
      'Employee tossed metal scrap into dumpster without wearing cut-resistant Level 5 gloves. Minor knuckle abrasion.',
    full_text:
      'On August 23, 2026 at Workshop scrap yard, worker handling sheared sheet metal edges wore light cotton gloves instead of Kevlar-lined gloves. Superficial abrasion treated with antiseptic.',
    risk_level: 'Low',
    hazard: 'Hand Injury',
    activity: 'Housekeeping',
    barrier_failure: 'PPE Non-compliance',
    sif_precursor: false,
    explanation:
      'Inadequate cut resistance glove selection for handling sharp scrap metal.',
    timestamp: '2026-08-23T16:00:00Z',
  },
  {
    id: 38,
    date: '2026-08-17',
    time: '10:00',
    site: 'Workshop',
    location: 'Workshop - Electrical Bench',
    text_snippet:
      'Monthly portable appliance test (PAT) completed on 42 handheld power tools. 100% pass rate.',
    full_text:
      'On August 17, 2026 at Workshop, electrical safety team verified earth ground continuity and insulation resistance on all grinders, drills, and extension cords.',
    risk_level: 'Low',
    hazard: 'None',
    activity: 'Audit',
    barrier_failure: 'None',
    sif_precursor: false,
    explanation:
      'Comprehensive proactive testing and recertification of portable tools.',
    timestamp: '2026-08-17T10:00:00Z',
  },
];

// Ensure all reports in mockReports strictly reference siteId and siteName
mockReports.forEach((r) => {
  if (!r.siteId && r.site) {
    r.siteId = r.site.toLowerCase().replace(/\s+/g, '-');
  }
  if (!r.siteName && r.site) {
    r.siteName = r.site;
  }
});

// ─── Canonical Industrial Site Definitions ──────────────────────────
export const initialSites = [
  {
    id: 'rig-site-b',
    name: 'Rig Site B',
    code: 'RSB-002',
    location: 'Assam',
    type: 'Rig Site',
    status: 'Active',
  },
  {
    id: 'rig-site-a',
    name: 'Rig Site A',
    code: 'RSA-001',
    location: 'Assam',
    type: 'Rig Site',
    status: 'Active',
  },
  {
    id: 'processing-unit',
    name: 'Processing Unit',
    code: 'PU-010',
    location: 'Duliajan',
    type: 'Processing Unit',
    status: 'Active',
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    code: 'WH-004',
    location: 'Duliajan',
    type: 'Warehouse',
    status: 'Active',
  },
  {
    id: 'workshop',
    name: 'Workshop',
    code: 'WS-005',
    location: 'Duliajan',
    type: 'Workshop',
    status: 'Active',
  },
];

// In-memory custom sites added via Add Site modal during the session
let sessionSites = [];

export function addMockSite(siteData) {
  const id = siteData.id || siteData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const existing = [...initialSites, ...sessionSites].find((s) => s.id === id);
  if (existing) {
    return existing;
  }
  const newSite = {
    id,
    name: siteData.name,
    code: siteData.code || `${siteData.name.slice(0, 3).toUpperCase()}-00${sessionSites.length + 6}`,
    location: siteData.location || 'Assam',
    type: siteData.type || 'Rig Site',
    status: siteData.status || 'Active',
  };
  sessionSites.push(newSite);
  return newSite;
}

export function updateMockSite(siteId, updatedData) {
  const allDefs = [...initialSites, ...sessionSites];
  const target = allDefs.find(
    (s) => s.id === siteId || s.name.toLowerCase().replace(/\s+/g, '-') === siteId
  );
  if (!target) {
    throw new Error(`Site with ID "${siteId}" was not found.`);
  }

  const oldName = target.name;

  if (updatedData.name !== undefined) target.name = updatedData.name.trim();
  if (updatedData.code !== undefined) target.code = updatedData.code.trim();
  if (updatedData.location !== undefined) target.location = updatedData.location.trim();
  if (updatedData.type !== undefined) target.type = updatedData.type;
  if (updatedData.status !== undefined) target.status = updatedData.status;

  // If site name changed, synchronize reports referencing this site
  if (updatedData.name && updatedData.name.trim() !== oldName) {
    const newName = updatedData.name.trim();
    mockReports.forEach((r) => {
      if (r.siteId === target.id || r.site === oldName || r.siteName === oldName) {
        r.site = newName;
        r.siteName = newName;
      }
    });
  }

  // Return full site profile with recomputed metrics
  const updatedList = getMockSites();
  return updatedList.find((s) => s.id === target.id) || target;
}

// ─── Deterministic Site Health Calculation ──────────────────────────
export function calculateSiteHealth(reports) {
  const sifCount = reports.filter((r) => r.risk_level === 'SIF-Precursor').length;
  const highCount = reports.filter((r) => r.risk_level === 'High').length;
  const medCount = reports.filter((r) => r.risk_level === 'Medium').length;

  if (sifCount >= 1 || highCount >= 3) {
    return {
      status: 'Critical',
      description: 'Immediate operational intervention required',
      severityIndex: 4,
    };
  }
  if (highCount >= 1) {
    return {
      status: 'Elevated',
      description: 'Elevated safety risk; heightened supervision',
      severityIndex: 3,
    };
  }
  if (medCount >= 3) {
    return {
      status: 'Watch',
      description: 'Recurring moderate risks under active watch',
      severityIndex: 2,
    };
  }
  return {
    status: 'Stable',
    description: 'Operating within normal safety tolerances',
    severityIndex: 1,
  };
}

function formatReportDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// ─── Pre-Aggregated Site Profiles ───────────────────────────────────
export function getMockSites() {
  const allSiteDefinitions = [...initialSites, ...sessionSites];

  return allSiteDefinitions.map((def) => {
    const siteReports = mockReports
      .filter((r) => r.siteId === def.id || r.site === def.name)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const health = calculateSiteHealth(siteReports);
    const uniqueDays = new Set(siteReports.map((r) => r.date)).size;

    const riskCounts = {
      Low: siteReports.filter((r) => r.risk_level === 'Low').length,
      Medium: siteReports.filter((r) => r.risk_level === 'Medium').length,
      High: siteReports.filter((r) => r.risk_level === 'High').length,
      'SIF-Precursor': siteReports.filter((r) => r.risk_level === 'SIF-Precursor').length,
    };

    const latest = siteReports[0] || null;

    // Top hazards calculation
    const hazardMap = {};
    siteReports.forEach((r) => {
      if (r.hazard && r.hazard !== 'None') {
        hazardMap[r.hazard] = (hazardMap[r.hazard] || 0) + 1;
      }
    });

    const topHazards = Object.entries(hazardMap)
      .map(([hazard, count]) => ({ hazard, count }))
      .sort((a, b) => b.count - a.count);

    return {
      id: def.id,
      name: def.name,
      code: def.code,
      location: def.location,
      type: def.type,
      status: def.status,
      totalReports: siteReports.length,
      highRiskCount: riskCounts.High,
      sifCount: riskCounts['SIF-Precursor'],
      lastActivity: latest ? formatReportDate(latest.date) : 'No Activity',
      uniqueDays,
      healthStatus: health.status,
      healthDescription: health.description,
      riskCounts,
      topHazards,
      latestReport: latest
        ? {
            date: latest.date,
            hazard: latest.hazard,
            risk_level: latest.risk_level,
            text_snippet: latest.text_snippet,
          }
        : null,
      reports: siteReports,
    };
  });
}

// ─── Dashboard Trends Mock ──────────────────────────────────────────
export const mockTrends = {
  by_risk_level: {
    Low: 13,
    Medium: 11,
    High: 9,
    'SIF-Precursor': 5,
  },
  top_hazards: {
    Fall: 9,
    'Dropped Object': 7,
    'Confined Space': 6,
    Electrical: 5,
    'Chemical Exposure': 4,
    'Vehicle Interaction': 3,
  },
  by_location: {
    'Rig Site B': 9,
    'Rig Site A': 8,
    'Processing Unit': 7,
    Warehouse: 7,
    Workshop: 7,
  },
  by_activity: {
    'Scaffold Work': 8,
    Maintenance: 8,
    'Drilling Operations': 6,
    'Material Handling': 5,
    'Tank Cleaning': 4,
  },
};
