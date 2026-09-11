import { Act, Scene } from '../types';

// Heritage assets (Act 1)
import imgChennai from '../assets/media/heritage_01_chennai_central.jpg';
import imgLoom from '../assets/media/heritage_02_kanchipuram_silk_handloom.jpg';
import imgOMR from '../assets/media/heritage_03_chennai_omr_tech_corridor.jpg';
import imgKanyakumari from '../assets/media/heritage_04_kanyakumari_monument_coastline.jpg';

// SBL & STLAP assets (Acts 2, 3, 4, 5)
import imgTambaramEntrance from '../assets/media/stlap_tambaram_branch_entrance.jpg';
import imgTambaramReception from '../assets/media/stlap_tambaram_branch_reception.jpg';
import imgTambaramOperations from '../assets/media/stlap_tambaram_branch_operations.jpg';
import imgTambaramLounge from '../assets/media/stlap_tambaram_branch_consultation_lounge.jpg';
import imgTambaramAdvisory from '../assets/media/stlap_tambaram_branch_customer_advisory.jpg';
import imgSBLCreditCommittee from '../assets/media/sbl_credit_committee_meeting.jpg';
import imgSBLStrategy from '../assets/media/sbl_branch_strategy_deliberation.jpg';
import imgMSMEWorkshop from '../assets/media/sbl_msme_retail_workshop.jpg';

// Product Wheels assets (Acts 2, 3, 5, 6)
import imgCuddaloreWheels from '../assets/media/product_wheels_cuddalore_field_disbursement.jpg';
import imgWheelsConnector from '../assets/media/product_wheels_connector_partner_meet.jpg';
import imgWheelsLogistics from '../assets/media/product_wheels_highway_freight_logistics.jpg';
import imgTirupurIndustrial from '../assets/media/product_wheels_tirupur_fleet_distribution.jpg';

// Legacy & Brand assets (Acts 4, 5, 6)
import imgCrisilRating from '../assets/media/legacy_crisil_icra_aaa_rating.jpg';
import imgTamilNadu333 from '../assets/media/legacy_tamilnadu_future_333_vision.jpg';
import imgOutro from '../assets/media/legacy_arka_kirloskar_brand_outro.jpg';

// Corporate Introduction Video (Act 3: Kirloskar & Arka Intro)
import videoKirloskarIntro from '../assets/media/arka_investor_Intro_Kirloskar.mp4';

// Act-level Master VO Summaries
export const ACT_VOICEOVERS: Record<number, string> = {
  1: 'Vanakkam Tamil Nadu! A land where centuries of rich heritage seamlessly weave with unstoppable modern ambition. From world-renowned textile hubs and agricultural heartlands to high-tech industrial corridors and bustling highways, it is your relentless spirit, integrity, and drive that power the economic engine of India.',
  2: 'Established in 2018 as an RBI-approved NBFC, Arka Fincap is present in over 140 branches nationwide with an 1,800-strong dedicated team. Delivering dependable Small Ticket LAP, Secured Business Loans, and Used Commercial Vehicle finance, our grassroots connector meets support local enterprise and regional mobility.',
  3: 'Backed by the legendary 130-plus year legacy of the Kirloskar Group, our foundation rests on an unshakeable promise of nation-building. Guided by Trust, Empathy, and Partnership, we believe character counts as much as capital — living by: Aapka Apna Arka.',
  4: 'Backing your growth demands rock-solid stability. Proudly rated AAA by CRISIL and ICRA, Arka Fincap represents the gold standard of financial safety, institutional strength, and liquidity—giving our partners complete confidence through every business cycle.',
  5: 'Guided by leadership strategic vision, we are swiftly expanding our regional hub networks across Chennai, Coimbatore, Madurai, Trichy, Salem, and Cuddalore, targeting a ₹1,000 Crore Tamil Nadu footprint with fast, attentive branch service.',
  6: 'Together, let us build a stronger, more prosperous tomorrow. Partner with us as we continue to drive financial progress and business growth. Arka Fincap Limited — Aapka Apna Kirloskar.',
};

export const ACT_1_SCENES: Scene[] = [
  {
    id: 'act1-s1',
    actNumber: 1,
    actTitle: 'Respect to Tamil Nadu Culture & Spirit',
    sceneTitle: 'Heritage Gateway: Chennai Central at Sunrise',
    startTime: 0,
    endTime: 5,
    imageSrc: imgChennai,
    motionType: 'drone_sweep',
    startScale: 1.0,
    endScale: 1.14,
    panDirection: 'left_to_right',
    ostTag: 'VANAKKAM TAMIL NADU',
    ostTitle: 'Land of Culture & Enterprise',
    aiPrompt:
      'Cinematic slow-motion drone sweep flying past the red heritage Victorian gothic architecture of Chennai Central Station during golden hour sunrise. Smooth parallax movement with street traffic moving naturally at the base and warm sunlight reflecting off the clock tower. Visual accents in Dark Teal (#062A30) and Copper (#C37C5B). Professional cinematic lighting, photorealistic 8k.',
    voiceoverText:
      'Vanakkam Tamil Nadu! A land where centuries of rich heritage seamlessly weave with unstoppable modern ambition.',
    audioCues: 'Resonant Nadaswaram melody blending smoothly into an inspiring orchestral buildup.',
  },
  {
    id: 'act1-s2',
    actNumber: 1,
    actTitle: 'Respect to Tamil Nadu Culture & Spirit',
    sceneTitle: 'Artisanal Craft & Kanchipuram Silk Looms',
    startTime: 5,
    endTime: 10,
    imageSrc: imgLoom,
    motionType: 'macro_zoom',
    startScale: 1.05,
    endScale: 1.18,
    panDirection: 'center',
    ostTag: 'VANAKKAM TAMIL NADU',
    ostTitle: 'Centuries of Rich Heritage & Master Craftsmanship',
    aiPrompt:
      "Close-up macro shot of an Indian woman's hands weaving intricate golden silk thread on a traditional wooden loom in Kanchipuram. Soft depth of field, warm indoor lighting, thread moving fluently back and forth. Seamless cross-fade to vibrant festival dancers in traditional sarees celebrating Pongal. Visual accents in Dark Teal (#062A30) and Copper (#C37C5B).",
    voiceoverText:
      'From world-renowned textile craft in Kanchipuram to the agricultural heartlands that feed our nation,',
    audioCues: 'Nadaswaram continues with soft acoustic tanpura drone; gentle loom percussion sync.',
  },
  {
    id: 'act1-s3',
    actNumber: 1,
    actTitle: 'Respect to Tamil Nadu Culture & Spirit',
    sceneTitle: 'Modern Technology & OMR Industrial Corridors',
    startTime: 10,
    endTime: 15,
    imageSrc: imgOMR,
    motionType: 'pan_right',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'left_to_right',
    ostTag: 'VANAKKAM TAMIL NADU',
    ostTitle: 'High-Tech Corridors & Industrial Drives',
    aiPrompt:
      'Hyper-lapse aerial view along the OMR IT Corridor highway in Chennai at dusk. High-rise tech buildings illuminated against a purple and orange sunset sky, with glowing light trails from fast-moving traffic below. Visual accents in Dark Teal (#062A30) and Copper (#C37C5B). Sleek, modern, industrial progress atmosphere.',
    voiceoverText:
      'To the high-tech corridors along Chennai OMR and industrial powerhouses across Coimbatore and Tirupur,',
    audioCues: 'Deep, rhythmic bass kick and modern orchestral strings rise into an uplifting cadence at 0:11.',
  },
  {
    id: 'act1-s4',
    actNumber: 1,
    actTitle: 'Respect to Tamil Nadu Culture & Spirit',
    sceneTitle: 'Coastal Majesty: Thiruvalluvar & Infinite Horizons',
    startTime: 15,
    endTime: 20,
    imageSrc: imgKanyakumari,
    motionType: 'orbital_sweep',
    startScale: 1.15,
    endScale: 1.02,
    panDirection: 'center',
    ostTag: 'VANAKKAM TAMIL NADU',
    ostTitle: 'Relentless Spirit Powering the Economic Engine of India',
    aiPrompt:
      'Sweeping cinematic orbital drone shot around the Thiruvalluvar Statue and Vivekananda Rock Memorial in Kanyakumari. Ocean waves crashing against the rocks with dramatic spray, golden sun rays beaming through clouds. Visual accents in Dark Teal (#062A30) and Copper (#C37C5B). Majestic, inspiring finish.',
    voiceoverText:
      'And bustling highway logistics running to Kanyakumari — your relentless enterprise powers India.',
    audioCues: 'Majestic orchestral strings swell with resonant Indian percussive roll, resolving gracefully into brand transition.',
  },
];

export const FULL_AV_SCENES: Scene[] = [
  ...ACT_1_SCENES,
  {
    id: 'act2-s1',
    actNumber: 2,
    actTitle: 'The Arka Entrance & Product Relevance',
    sceneTitle: 'Arka Entrance: 140+ Branches & Regional Gateway',
    startTime: 20,
    endTime: 24,
    imageSrc: imgTambaramEntrance,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'ARKA FINCAP LIMITED',
    ostTitle: 'RBI-Approved NBFC • 140+ Branches Nationwide',
    aiPrompt:
      'Grand architectural entrance shot of an Arka Fincap regional branch in Tamil Nadu with signature teal and copper signage. Welcoming glass facade symbolizing transparency and financial inclusion.',
    voiceoverText:
      'Established in 2018 as an RBI-approved NBFC, Arka Fincap is present in over 140 branches nationwide with an 1,800-strong dedicated team.',
    audioCues: 'Upbeat, inspiring background score with a steady rhythmic pulse.',
  },
  {
    id: 'act2-s2',
    actNumber: 2,
    actTitle: 'The Arka Entrance & Product Relevance',
    sceneTitle: 'Branch Presence & Dedicated 1,800+ Team',
    startTime: 24,
    endTime: 28,
    imageSrc: imgTambaramReception,
    motionType: 'pan_right',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'left_to_right',
    ostTag: 'GRASSROOTS BRANCH NETWORK',
    ostTitle: 'Dedicated Relationship Managers Serving Every Borrower',
    aiPrompt:
      'Professional corporate footage of an Arka Fincap regional branch operational team engaged in collaborative customer support at reception desk. Clean modern office setting.',
    voiceoverText:
      'With dedicated branch desks across Tamil Nadu, our teams provide personalized guidance to every business owner and applicant.',
    audioCues: 'Warm acoustic guitar building melodic clarity with gentle rhythm.',
  },
  {
    id: 'act2-s3',
    actNumber: 2,
    actTitle: 'The Arka Entrance & Product Relevance',
    sceneTitle: 'Small Ticket LAP (STLAP) & Secured Business Loans',
    startTime: 28,
    endTime: 32,
    imageSrc: imgMSMEWorkshop,
    motionType: 'macro_zoom',
    startScale: 1.02,
    endScale: 1.14,
    panDirection: 'center',
    ostTag: 'SMALL TICKET LAP & SBL LOANS',
    ostTitle: 'Empowering Local Traders, Workshops & Retail Enterprises',
    aiPrompt:
      'Crisp cinematic footage of an Arka Fincap loan advisor warmly discussing Small Ticket LAP with local shop owners and workshop entrepreneurs in Tamil Nadu. Visual accents in Teal (#19988B) and Copper (#C37C5B).',
    voiceoverText:
      'We deliver dependable Small Ticket LAP and Secured Business Loans to workshop owners, traders, and retail entrepreneurs.',
    audioCues: 'Warm acoustic guitars building melodic clarity.',
  },
  {
    id: 'act2-s4',
    actNumber: 2,
    actTitle: 'The Arka Entrance & Product Relevance',
    sceneTitle: 'Used Commercial Vehicle (UCV) Fleet Logistics',
    startTime: 32,
    endTime: 36,
    imageSrc: imgWheelsLogistics,
    motionType: 'pan_right',
    startScale: 1.02,
    endScale: 1.15,
    panDirection: 'left_to_right',
    ostTag: 'USED COMMERCIAL VEHICLE (UCV) FINANCE',
    ostTitle: 'Powering Highway Logistics & Fleet Operators',
    aiPrompt:
      'High-energy tracking shot alongside a commercial vehicle and truck transport fleet cruising on a national highway. Arka relationship manager handing over vehicle keys to a transport operator.',
    voiceoverText:
      'Our specialized Used Commercial Vehicle financing keeps transport operators and fleet owners driving forward without pause.',
    audioCues: 'Rhythmic drum build with modern acoustic guitar accents.',
  },
  {
    id: 'act2-s5',
    actNumber: 2,
    actTitle: 'The Arka Entrance & Product Relevance',
    sceneTitle: 'Wheels Ground Disbursement: Cuddalore Hub',
    startTime: 36,
    endTime: 39,
    imageSrc: imgCuddaloreWheels,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'WHEELS FIELD OPERATIONS',
    ostTitle: 'Active Vehicle Loan Disbursements • Cuddalore Hub',
    aiPrompt:
      'Field photo captured by GPS Map Camera: commercial fleet and vehicle loan disbursements in Cuddalore regional hub, showing real on-ground loan fulfillment.',
    voiceoverText:
      'From Cuddalore to Coimbatore, our Wheels division delivers rapid on-ground vehicle loan disbursements.',
    audioCues: 'Dynamic brass swells with steady percussion.',
  },
  {
    id: 'act2-s6',
    actNumber: 2,
    actTitle: 'The Arka Entrance & Product Relevance',
    sceneTitle: 'Grassroots Partner Network & Field Connectors',
    startTime: 39,
    endTime: 42,
    imageSrc: imgWheelsConnector,
    motionType: 'pan_right',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'left_to_right',
    ostTag: 'FIELD PARTNERSHIPS & CONNECTORS',
    ostTitle: 'Grassroots Partner Network • Fueling Regional Mobility',
    aiPrompt:
      'On-ground field photo of Arka relationship managers meeting with regional commercial transport connectors and vehicle channel partners. Open collaborative atmosphere.',
    voiceoverText:
      'Through on-ground connector partner meets and dedicated local relationship teams, we fuel grassroots enterprise and regional mobility.',
    audioCues: 'Dynamic rhythmic drum groove with energetic percussive accents.',
  },
  {
    id: 'act3-s1',
    actNumber: 3,
    actTitle: 'Kirloskar Group Philosophy & Brand Pillars',
    sceneTitle: '130+ Years Legacy & Industrial Backbone (Kirloskar Group & Arka Intro)',
    startTime: 42,
    endTime: 50,
    imageSrc: imgTirupurIndustrial,
    videoSrc: videoKirloskarIntro,
    mediaType: 'video',
    motionType: 'macro_zoom',
    startScale: 1.12,
    endScale: 1.0,
    panDirection: 'bottom_to_top',
    ostTag: '130+ YEARS OF KIRLOSKAR GROUP HERITAGE',
    ostTitle: 'Built on Unshakable Foundations of Nation-Building',
    aiPrompt:
      'Official corporate introductory video footage showcasing the 130+ year legacy of the Kirloskar Group and the inception of Arka Fincap Limited ("Arka – Aapka Apna Kirloskar").',
    voiceoverText:
      'Backed by the legendary 130-plus year legacy of the Kirloskar Group, our foundation rests on an unshakeable promise of nation-building.',
    audioCues: 'Warm, reassuring acoustic score emphasizing heritage and human connection.',
  },
  {
    id: 'act3-s2',
    actNumber: 3,
    actTitle: 'Kirloskar Group Philosophy & Brand Pillars',
    sceneTitle: 'Brand Pillars: Trust, Empathy & Partnership',
    startTime: 50,
    endTime: 57,
    imageSrc: imgSBLStrategy,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'AAPKA APNA ARKA',
    ostTitle: 'Trust • Empathy • Partnership Across Every Relationship',
    aiPrompt:
      'Arka branch leadership team in active consultation. Warm smiles, transparent discussions with regional business clients. Graphic overlays highlight the brand pillars: Trust • Empathy • Partnership.',
    voiceoverText:
      'Guided by Trust, Empathy, and Partnership, we believe character counts as much as capital — living by: Aapka Apna Arka.',
    audioCues: 'Acoustic guitar and gentle strings underscoring empathy and partnership.',
  },
  {
    id: 'act3-s3',
    actNumber: 3,
    actTitle: 'Kirloskar Group Philosophy & Brand Pillars',
    sceneTitle: 'Character & Capital: Client Relationship Lounge',
    startTime: 57,
    endTime: 64,
    imageSrc: imgTambaramLounge,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.1,
    panDirection: 'center',
    ostTag: 'HUMAN CONNECTION FIRST',
    ostTitle: 'Listening to Ambitions • Crafting Custom Solutions',
    aiPrompt:
      'Comfortable customer consultation lounge inside Arka branch where loan officers engage with entrepreneurs to understand their personal journey and business dreams.',
    voiceoverText:
      'We stand as lifelong partners, ensuring your aspirations are met with genuine empathy and tailored financial support.',
    audioCues: 'Gentle piano melody weaving with warm cello harmonies.',
  },
  {
    id: 'act4-s1',
    actNumber: 4,
    actTitle: 'Financial Strength & AAA Rating',
    sceneTitle: 'CRISIL & ICRA AAA Vault Emblem',
    startTime: 64,
    endTime: 71,
    imageSrc: imgCrisilRating,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.15,
    panDirection: 'center',
    ostTag: 'CRISIL & ICRA AAA RATED',
    ostTitle: 'Gold Standard of Financial Safety & Institutional Strength',
    aiPrompt:
      'High-tech 3D motion graphic featuring a metallic shield emblem in Copper (#C37C5B) and Teal (#19988B) locking into place, displaying CRISIL & ICRA AAA rating badges alongside the "Aapka Apna Arka" seal.',
    voiceoverText:
      'Proudly rated AAA by CRISIL and ICRA, Arka Fincap represents the gold standard of financial safety and rock-solid liquidity.',
    audioCues: 'Confident audio crescendo with a clean metallic chime.',
  },
  {
    id: 'act4-s2',
    actNumber: 4,
    actTitle: 'Financial Strength & AAA Rating',
    sceneTitle: 'Prudent Underwriting & Institutional Safety',
    startTime: 71,
    endTime: 78,
    imageSrc: imgSBLCreditCommittee,
    motionType: 'drone_sweep',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'left_to_right',
    ostTag: 'HIGHEST CREDIT SAFETY BENCHMARK',
    ostTitle: 'Rock-Solid Liquidity & Enduring Security for All Partners',
    aiPrompt:
      'Arka operational review meeting with branch credit underwriters and managers reviewing secure loan files with diligence and speed.',
    voiceoverText:
      'Giving our borrowers, channel connectors, and institutional partners complete confidence through every business cycle.',
    audioCues: 'Stable, deep orchestral drone providing foundational strength.',
  },
  {
    id: 'act4-s3',
    actNumber: 4,
    actTitle: 'Financial Strength & AAA Rating',
    sceneTitle: 'Seamless Processing & Operations Hall',
    startTime: 78,
    endTime: 84,
    imageSrc: imgTambaramOperations,
    motionType: 'pan_right',
    startScale: 1.02,
    endScale: 1.12,
    panDirection: 'left_to_right',
    ostTag: 'OPERATIONAL EXCELLENCE',
    ostTitle: 'Fast Turnaround Time & Digital Underwriting Backbone',
    aiPrompt:
      'Spacious modern operations floor inside regional branch with digital workstations processing loans quickly and safely.',
    voiceoverText:
      'Our state-of-the-art underwriting and swift disbursements ensure your capital needs are met without delays.',
    audioCues: 'Pulsing modern synthesizer arpeggio over steady kick.',
  },
  {
    id: 'act5-s1',
    actNumber: 5,
    actTitle: 'The "Vision forward" & ₹1,000 Crore Target',
    sceneTitle: 'Strategic Scaling & High-Growth Corridors',
    startTime: 84,
    endTime: 90,
    imageSrc: imgTamilNadu333,
    motionType: 'drone_sweep',
    startScale: 1.0,
    endScale: 1.15,
    panDirection: 'left_to_right',
    ostTag: 'DRIVEN BY THE REMARKABLES & 333 VISION',
    ostTitle: 'Strategic Scaling Under MD & CEO Leadership',
    aiPrompt:
      'Dynamic graphic display showing Arka leadership vision. An interactive map of Tamil Nadu lights up key regional hubs (Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem) with a bold graphic projection: Target: ₹1,000 Crore Tamil Nadu Footprint.',
    voiceoverText:
      "Guided by leadership's bold vision and the drive of the Remarkables, we are expanding our presence across key industrial corridors.",
    audioCues: 'Fast-paced, high-energy forward-moving rhythm with modern electronic-orchestral fusion.',
  },
  {
    id: 'act5-s2',
    actNumber: 5,
    actTitle: 'The "Vision forward" & ₹1,000 Crore Target',
    sceneTitle: 'Tamil Nadu Regional Hubs & ₹1,000 Cr Milestone',
    startTime: 90,
    endTime: 96,
    imageSrc: imgTambaramAdvisory,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'TARGET: ₹1,000 CR TAMIL NADU MILESTONE',
    ostTitle: 'Expanding Chennai, Coimbatore, Madurai, Trichy, Salem & Cuddalore',
    aiPrompt:
      'Arka regional branch customer advisory hall with business consultants counseling borrowers on enterprise scaling and vehicle fleet expansion.',
    voiceoverText:
      'Set on a bold ambition to reach a ₹1,000 Crore portfolio in Tamil Nadu, we support businesses with swift disbursements and attentive local service.',
    audioCues: 'Crescendo of inspiring cinematic brass and driving rhythm.',
  },
  {
    id: 'act6-s1',
    actNumber: 6,
    actTitle: 'Call to Action',
    sceneTitle: 'Partners in Financial Progress & Enterprise',
    startTime: 96,
    endTime: 100.5,
    imageSrc: imgWheelsConnector,
    motionType: 'slow_push_in',
    startScale: 1.02,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'PARTNERS IN FINANCIAL PROGRESS',
    ostTitle: 'Together Building a Stronger, More Prosperous Tomorrow',
    aiPrompt:
      'High-energy montage of Arka branch managers shaking hands with clients, team celebrations, and collaborative partnership in branch premises.',
    voiceoverText:
      'Together, let us build a stronger, more prosperous tomorrow. Partner with us as we continue to drive financial progress.',
    audioCues: 'Grand, triumphant orchestral finale resolving into a warm chord sustain.',
  },
  {
    id: 'act6-s2',
    actNumber: 6,
    actTitle: 'Call to Action',
    sceneTitle: 'Arka Fincap Limited — Aapka Apna Kirloskar',
    startTime: 100.5,
    endTime: 105,
    imageSrc: imgOutro,
    motionType: 'outro_reveal',
    startScale: 1.05,
    endScale: 1.0,
    panDirection: 'center',
    ostTag: 'ARKA FINCAP LIMITED',
    ostTitle: 'Aapka Apna Kirloskar • www.arkafincap.com',
    aiPrompt:
      'Animated closing frame featuring the Arka logo, CRISIL/ICRA AAA rating seal, website, and brand palette accents (#062A30, #C37C5B, #19988B).',
    voiceoverText:
      'Arka Fincap Limited — Aapka Apna Kirloskar.',
    audioCues: 'Final warm resonant chord with crystalline chime flourish.',
  },
];

export const MASTER_ACTS: Act[] = [
  {
    number: 1,
    title: 'Respect to Tamil Nadu Culture & Spirit',
    subtitle: 'Vanakkam Tamil Nadu — Land of Culture & Enterprise',
    timeRange: '0:00 – 0:20',
    startTime: 0,
    endTime: 20,
    scenes: FULL_AV_SCENES.filter((s) => s.actNumber === 1),
    summary:
      'Celebrates the soul and enterprise of Tamil Nadu: Chennai Central sunrise, Kanchipuram silk looms, OMR IT highway, and Thiruvalluvar coastal majesty.',
  },
  {
    number: 2,
    title: 'The Arka Entrance & Product Relevance',
    subtitle: 'Arka Fincap Limited • RBI-Approved NBFC • 140+ Branches Nationwide',
    timeRange: '0:20 – 0:42',
    startTime: 20,
    endTime: 42,
    scenes: FULL_AV_SCENES.filter((s) => s.actNumber === 2),
    summary:
      'Established in 2018 as an RBI-approved NBFC with 140+ branches and 1,800+ team members, delivering Small Ticket LAP, Secured Business Loans, and Used Commercial Vehicle financing with active field connector networks across Tambaram, Cuddalore, and Tamil Nadu.',
  },
  {
    number: 3,
    title: 'Kirloskar Group Philosophy & Brand Pillars',
    subtitle: '130+ Years of Unwavering Legacy • A Kirloskar Group Company • "Aapka Apna Arka"',
    timeRange: '0:42 – 1:04',
    startTime: 42,
    endTime: 64,
    scenes: FULL_AV_SCENES.filter((s) => s.actNumber === 3),
    summary:
      'Rooted in the 130+ year Kirloskar Group lineage, upholding Trust, Empathy, and Partnership — living by the core belief: "Aapka Apna Arka".',
  },
  {
    number: 4,
    title: 'Financial Strength & AAA Rating',
    subtitle: 'CRISIL & ICRA AAA Rated • Gold Standard of Financial Safety & Liquidity',
    timeRange: '1:04 – 1:24',
    startTime: 64,
    endTime: 84,
    scenes: FULL_AV_SCENES.filter((s) => s.actNumber === 4),
    summary:
      'Highest safety benchmark: CRISIL and ICRA AAA rated, representing institutional stability, rock-solid liquidity, and enduring business security.',
  },
  {
    number: 5,
    title: 'The "Vision forward" & ₹1,000 Crore Target',
    subtitle: 'Driven by the Remarkables and the legacy of Kirloskar group • Target: ₹1,000 Cr Tamil Nadu Milestone',
    timeRange: '1:24 – 1:36',
    startTime: 84,
    endTime: 96,
    scenes: FULL_AV_SCENES.filter((s) => s.actNumber === 5),
    summary:
      'Guided by leadership strategic vision, expanding regional hub networks across Chennai, Coimbatore, Madurai, Trichy, Salem, and Cuddalore targeting a ₹1,000 Cr footprint.',
  },
  {
    number: 6,
    title: 'Call to Action',
    subtitle: 'Arka Fincap Limited — Aapka Apna Kirloskar',
    timeRange: '1:36 – 1:45',
    startTime: 96,
    endTime: 105,
    scenes: FULL_AV_SCENES.filter((s) => s.actNumber === 6),
    summary:
      'An inspiring closing invitation to build a stronger, more prosperous tomorrow with Arka Fincap — Aapka Apna Kirloskar.',
  },
];

