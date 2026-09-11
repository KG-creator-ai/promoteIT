import { CampaignPreset, Scene } from '../types';
import {
  ACT_1_SCENES,
  FULL_AV_SCENES,
} from './scriptData';

import imgChennai from '../assets/media/heritage_01_chennai_central.jpg';
import imgLoom from '../assets/media/heritage_02_kanchipuram_silk_handloom.jpg';
import imgOMR from '../assets/media/heritage_03_chennai_omr_tech_corridor.jpg';
import imgKanyakumari from '../assets/media/heritage_04_kanyakumari_monument_coastline.jpg';
import imgCommercialVehicle from '../assets/media/product_wheels_highway_freight_logistics.jpg';
import imgMSMEStore from '../assets/media/sbl_msme_retail_workshop.jpg';
import imgTirupur from '../assets/media/product_wheels_tirupur_fleet_distribution.jpg';
import imgCrisilRating from '../assets/media/legacy_crisil_icra_aaa_rating.jpg';
import imgTamilNadu333 from '../assets/media/legacy_tamilnadu_future_333_vision.jpg';
import imgOutro from '../assets/media/legacy_arka_kirloskar_brand_outro.jpg';
import imgConnector from '../assets/media/product_wheels_connector_partner_meet.jpg';
import imgOffice1 from '../assets/media/sbl_credit_committee_meeting.jpg';
import imgOffice2 from '../assets/media/sbl_branch_strategy_deliberation.jpg';
import videoKirloskarIntro from '../assets/media/arka_investor_Intro_Kirloskar.mp4';

// Standard Tamil Nadu Flagship
export const TAMIL_NADU_SCENES: Scene[] = FULL_AV_SCENES;

// Wheels & Commercial Vehicle Campaign
export const WHEELS_CAMPAIGN_SCENES: Scene[] = [
  {
    id: 'wheels-act1-s1',
    actNumber: 1,
    actTitle: 'Arterial Lifelines: Highway Logistics & Fleet Spirit',
    sceneTitle: 'National Highway Transit Corridor at Sunrise',
    startTime: 0,
    endTime: 10,
    imageSrc: imgCommercialVehicle,
    motionType: 'drone_sweep',
    startScale: 1.0,
    endScale: 1.15,
    panDirection: 'left_to_right',
    ostTag: 'ARKA WHEELS EXPRESS',
    ostTitle: 'Powering India’s Commercial Transport Backbone',
    aiPrompt:
      'Cinematic aerial tracking shot over modern multi-lane highway at sunrise. Modern heavy transport trucks and commercial haulers cruising smoothly. Brand color accents in Dark Teal (#062A30) and Copper (#C37C5B). High production value 8k.',
    voiceoverText:
      'Across every highway, corridor, and logistics hub, it is the tireless commercial vehicle fleet operator who keeps the economic pulse of India beating strong. Arka Wheels stands beside you on every mile of your journey.',
    audioCues: 'Deep rhythmic highway cadence with melodic strings building momentum.',
  },
  {
    id: 'wheels-act1-s2',
    actNumber: 1,
    actTitle: 'Arterial Lifelines: Highway Logistics & Fleet Spirit',
    sceneTitle: 'Urban Transit Corridors & Supply Chains',
    startTime: 10,
    endTime: 20,
    imageSrc: imgOMR,
    motionType: 'pan_right',
    startScale: 1.02,
    endScale: 1.14,
    panDirection: 'left_to_right',
    ostTag: 'ARKA WHEELS EXPRESS',
    ostTitle: 'Seamless Connectivity Across Industrial Hubs',
    aiPrompt:
      'Cinematic hyperlapse of busy commercial transport intersection at dusk with logistics vehicles moving steadily under illuminated highways. Dark Teal (#062A30) and Copper (#C37C5B) tones.',
    voiceoverText:
      'From industrial export corridors to regional wholesale freight lines, your dedication fuels commerce and keeps markets thriving. We understand the relentless heartbeat of commercial transport.',
    audioCues: 'Acoustic Indian percussion blends with dynamic cello cadence.',
  },
  // Act 2: Entrance & Wheels Financing
  {
    id: 'wheels-act2-s1',
    actNumber: 2,
    actTitle: 'Arka Entrance & Wheels Financing Relevance',
    sceneTitle: 'Field Connector Meet & Fleet Partnerships',
    startTime: 20,
    endTime: 31,
    imageSrc: imgConnector,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'USED COMMERCIAL VEHICLE LOANS',
    ostTitle: 'Direct On-Ground Fleet Empowerment',
    aiPrompt:
      'Authentic documentary style camera push in showing Arka Wheels relationship team engaging with channel connectors and transport partners. Warm, professional, supportive atmosphere.',
    voiceoverText:
      'Established in 2018 as an RBI-approved NBFC, Arka Fincap delivers tailored Used Commercial Vehicle loans with quick turnarounds, accessible documentation, and transparent terms designed for transport operators.',
    audioCues: 'Confident, warm corporate tempo with subtle brass accents.',
  },
  {
    id: 'wheels-act2-s2',
    actNumber: 2,
    actTitle: 'Arka Entrance & Wheels Financing Relevance',
    sceneTitle: 'Fleet Expansion & High-Disbursement Logistics',
    startTime: 31,
    endTime: 42,
    imageSrc: imgCommercialVehicle,
    motionType: 'orbital_sweep',
    startScale: 1.12,
    endScale: 1.02,
    panDirection: 'center',
    ostTag: 'WHEELS FINANCING',
    ostTitle: 'Empowering Fleets from Single Trucks to Multi-Axles',
    aiPrompt:
      'Smooth tracking shot of commercial truck driver and logistics partner smiling warmly with truck keys in hand. Rich teal and copper brand tones.',
    voiceoverText:
      'Whether upgrading a single tipper or expanding a regional freight fleet, our dedicated Wheels finance specialists walk with you at every stage, turning ambition into road-ready reality.',
    audioCues: 'Uplifting string swell syncing to visual key hand-off.',
  },
  // Act 3: Kirloskar Group Legacy
  {
    id: 'wheels-act3-s1',
    actNumber: 3,
    actTitle: '130+ Year Kirloskar Pedigree & Engineering Trust',
    sceneTitle: 'Industrial Foundry & Precision Heritage (Kirloskar & Arka Intro)',
    startTime: 42,
    endTime: 64,
    imageSrc: imgOutro,
    videoSrc: videoKirloskarIntro,
    mediaType: 'video',
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: '130+ YEAR KIRLOSKAR LEGACY',
    ostTitle: 'Aapka Apna Kirloskar — Foundation of Trust',
    aiPrompt:
      'Official corporate introduction video showcasing the 130+ year Kirloskar legacy and the inception of Arka Fincap Limited.',
    voiceoverText:
      'Backed by the legendary 130-plus year heritage of the Kirloskar Group, our values remain uncompromised. Built on trust, empathy, and lifelong partnership—Aapka Apna Arka.',
    audioCues: 'Deep orchestral brass swell and majestic resonance.',
  },
  // Act 4: AAA Strength
  {
    id: 'wheels-act4-s1',
    actNumber: 4,
    actTitle: 'Institutional Safety & AAA Fortress Rating',
    sceneTitle: 'Highest Credit Safety Certification',
    startTime: 64,
    endTime: 84,
    imageSrc: imgCrisilRating,
    motionType: 'macro_zoom',
    startScale: 1.0,
    endScale: 1.14,
    panDirection: 'center',
    ostTag: 'CRISIL & ICRA AAA RATED',
    ostTitle: 'Rock-Solid Safety & Continuous Liquidity',
    aiPrompt:
      'Macro luxury corporate shot of burnished copper shield with glowing AAA emblems and fortress vault doors. Dark Teal (#062A30) and Copper (#C37C5B).',
    voiceoverText:
      'Rated AAA by CRISIL and ICRA, Arka Fincap represents the pinnacle of institutional safety, liquidity, and stability—ensuring your financing partner is as dependable as your fleet.',
    audioCues: 'Resonant metallic shimmer, deep percussion, and assured corporate cadence.',
  },
  // Act 5: 333 Vision & Regional Branch Growth
  {
    id: 'wheels-act5-s1',
    actNumber: 5,
    actTitle: 'Strategic Vision & Regional Network Expansion',
    sceneTitle: 'Branch Operations & Fast-Track Disbursements',
    startTime: 84,
    endTime: 90,
    imageSrc: imgOffice1,
    motionType: 'pan_right',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'left_to_right',
    ostTag: 'REGIONAL EXPANSION',
    ostTitle: 'Fast Disbursements & Dedicated Branch Support',
    aiPrompt:
      'Documentary camera view inside modern Arka branch office with loan managers approving disbursements and consulting customers. Teal and copper branding.',
    voiceoverText:
      'Championed by MD and CEO Samrat Gupta, the 333 Vision drives our relentless expansion. Our regional branches provide fast loan processing, transparent underwriting, and dedicated relationship managers.',
    audioCues: 'Dynamic ascending synthesizer and orchestral strings.',
  },
  {
    id: 'wheels-act5-s2',
    actNumber: 5,
    actTitle: 'Strategic Vision & Regional Network Expansion',
    sceneTitle: 'Branch Team Strategy & Fleet Empowerment',
    startTime: 90,
    endTime: 96,
    imageSrc: imgOffice2,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: '333 STRATEGIC EXPANSION',
    ostTitle: 'Reaching Every Transport Hub & Commercial District',
    aiPrompt:
      'Corporate conference room with Arka team aligning on regional growth charts and vehicle loan delivery metrics. Warm, optimistic lighting.',
    voiceoverText:
      'With ambitious regional disbursement targets, we are expanding our reach to every major highway corridor and logistics district, unlocking opportunity for commercial drivers and transport enterprises.',
    audioCues: 'Uplifting crescendo with driving rhythm.',
  },
  // Act 6: CTA & Conclusion
  {
    id: 'wheels-act6-s1',
    actNumber: 6,
    actTitle: 'Partnership, Call to Action & Conclusion',
    sceneTitle: 'Arka Wheels — Aapka Apna Kirloskar',
    startTime: 96,
    endTime: 105,
    imageSrc: imgOutro,
    motionType: 'outro_reveal',
    startScale: 1.05,
    endScale: 1.18,
    panDirection: 'center',
    ostTag: 'PARTNER WITH ARKA FINCAP',
    ostTitle: 'Aapka Apna Kirloskar — Accelerate Your Fleet',
    aiPrompt:
      'Cinematic closing shot featuring the Arka Fincap and Kirloskar crests glowing in rich copper over dark teal textured metal. Elegant lens flare and crisp typography.',
    voiceoverText:
      'Partner with Arka Wheels today. Drive your transport business forward with financing built on heritage, speed, and genuine trust. Arka Fincap — Aapka Apna Kirloskar.',
    audioCues: 'Inspiring orchestral finale resolving gracefully into the resonant brand audio signature.',
  },
];

// SBL & MSME Loan Campaign
export const SBL_CAMPAIGN_SCENES: Scene[] = [
  {
    id: 'sbl-act1-s1',
    actNumber: 1,
    actTitle: 'Saluting the Entrepreneurial Spirit',
    sceneTitle: 'Master Weavers & Craftsmanship Heritage',
    startTime: 0,
    endTime: 10,
    imageSrc: imgLoom,
    motionType: 'macro_zoom',
    startScale: 1.0,
    endScale: 1.15,
    panDirection: 'center',
    ostTag: 'ARKA SECURED BUSINESS LOANS',
    ostTitle: 'Honoring Local Craft, Enterprise & Ambition',
    aiPrompt:
      'Macro cinematic view of golden silk thread on traditional loom. Dark Teal (#062A30) and Copper (#C37C5B) accents.',
    voiceoverText:
      'Across every town and market square, the spirit of enterprise drives the nation. From generations of artisanal weavers to modern shopfloor entrepreneurs, your hard work builds India.',
    audioCues: 'Gentle traditional acoustic melodies ascending into confident corporate harmonies.',
  },
  {
    id: 'sbl-act1-s2',
    actNumber: 1,
    actTitle: 'Saluting the Entrepreneurial Spirit',
    sceneTitle: 'Industrial Textile & Manufacturing Hubs',
    startTime: 10,
    endTime: 20,
    imageSrc: imgTirupur,
    motionType: 'pan_right',
    startScale: 1.02,
    endScale: 1.14,
    panDirection: 'left_to_right',
    ostTag: 'ARKA SECURED BUSINESS LOANS',
    ostTitle: 'Empowering Manufacturing, Trade & Innovation',
    aiPrompt:
      'Wide cinematic pan across thriving modern manufacturing facility with active production lines and skilled workers. Clean lighting with copper highlights.',
    voiceoverText:
      'In bustling manufacturing zones and wholesale hubs, business owners constantly push boundaries. Arka Fincap is proud to fuel your next quantum leap in growth.',
    audioCues: 'Ascending strings and energetic rhythmic kick.',
  },
  // Act 2: Small Ticket LAP & SBL
  {
    id: 'sbl-act2-s1',
    actNumber: 2,
    actTitle: 'Arka Entrance & Small Business Lending',
    sceneTitle: 'Retail Enterprise & Small Ticket LAP (STLAP)',
    startTime: 20,
    endTime: 31,
    imageSrc: imgMSMEStore,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'SMALL TICKET LAP',
    ostTitle: 'Unlocking Property Value for Business Growth',
    aiPrompt:
      'Cinematic interior of thriving retail electronics store with proud owner standing confidently. Dark teal and copper accents.',
    voiceoverText:
      'Established in 2018 as an RBI-approved NBFC, Arka Fincap delivers accessible Small Ticket Loans Against Property, empowering shop owners, distributors, and service providers with rapid working capital.',
    audioCues: 'Warm, reassuring acoustic guitar and orchestral strings.',
  },
  {
    id: 'sbl-act2-s2',
    actNumber: 2,
    actTitle: 'Arka Entrance & Small Business Lending',
    sceneTitle: 'Branch Operations & Credit Approval Session',
    startTime: 31,
    endTime: 42,
    imageSrc: imgOffice1,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'MSME FINANCE',
    ostTitle: 'Tailored Underwriting for Grassroots Enterprises',
    aiPrompt:
      'Documentary view of branch credit managers evaluating retail loan proposals with care and transparency. Professional branch environment.',
    voiceoverText:
      'We recognize the true strength of your cash flows. With customized loan terms and dedicated branch assistance, securing business finance has never been simpler or more transparent.',
    audioCues: 'Smooth melodic cadence with inspiring undertones.',
  },
  // Act 3: Kirloskar Legacy
  {
    id: 'sbl-act3-s1',
    actNumber: 3,
    actTitle: '130+ Year Kirloskar Heritage & Brand Pillars',
    sceneTitle: 'Nation-Building Foundation of Trust (Kirloskar & Arka Intro)',
    startTime: 42,
    endTime: 64,
    imageSrc: imgOutro,
    videoSrc: videoKirloskarIntro,
    mediaType: 'video',
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: '130+ YEAR KIRLOSKAR LINEAGE',
    ostTitle: 'Trust, Empathy, Partnership — Aapka Apna Arka',
    aiPrompt:
      'Official corporate introduction video showcasing the 130+ year Kirloskar legacy and the inception of Arka Fincap Limited.',
    voiceoverText:
      'Rooted in the 130-plus year heritage of the Kirloskar Group, our commitments are etched in stone. Built upon trust, empathy, and enduring partnership—Aapka Apna Arka.',
    audioCues: 'Deep orchestral brass swell and resonant bells.',
  },
  // Act 4: AAA Strength
  {
    id: 'sbl-act4-s1',
    actNumber: 4,
    actTitle: 'CRISIL & ICRA AAA Fortress Strength',
    sceneTitle: 'Highest Credit Safety Certification',
    startTime: 64,
    endTime: 84,
    imageSrc: imgCrisilRating,
    motionType: 'macro_zoom',
    startScale: 1.0,
    endScale: 1.14,
    panDirection: 'center',
    ostTag: 'CRISIL & ICRA AAA RATED',
    ostTitle: 'Highest Financial Safety & Unmatched Liquidity',
    aiPrompt:
      'Macro luxury corporate shield with glowing AAA seal. Dark Teal (#062A30) and Copper (#C37C5B).',
    voiceoverText:
      'Proudly rated AAA by CRISIL and ICRA, Arka Fincap ensures unmatched stability, institutional liquidity, and fiscal discipline—giving your business an unshakable financial partner.',
    audioCues: 'Resonant metallic chime and deep orchestral percussion.',
  },
  // Act 5: 333 Vision & Regional Branch Targets
  {
    id: 'sbl-act5-s1',
    actNumber: 5,
    actTitle: '333 Vision & Branch Network Growth',
    sceneTitle: 'Branch Team Strategy & Regional Targets',
    startTime: 84,
    endTime: 96,
    imageSrc: imgOffice2,
    motionType: 'pan_right',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'left_to_right',
    ostTag: '333 STRATEGIC VISION',
    ostTitle: 'Expanding Fast-Track MSME Finance Across Branches',
    aiPrompt:
      'Branch team collaborating energetically on customer reach and loan disbursement milestones. Warm ambient lighting.',
    voiceoverText:
      'Led by MD and CEO Samrat Gupta, our 333 Vision is accelerating regional growth. Across over 140 branches nationwide, we are committed to delivering swift disbursements and personalized financial care.',
    audioCues: 'Dynamic modern corporate crescendo.',
  },
  // Act 6: Conclusion
  {
    id: 'sbl-act6-s1',
    actNumber: 6,
    actTitle: 'Call to Action & Partnership',
    sceneTitle: 'Grow With Arka Fincap',
    startTime: 96,
    endTime: 105,
    imageSrc: imgOutro,
    motionType: 'outro_reveal',
    startScale: 1.05,
    endScale: 1.18,
    panDirection: 'center',
    ostTag: 'APPLY FOR SECURED LOANS',
    ostTitle: 'Arka Fincap — Aapka Apna Kirloskar',
    aiPrompt:
      'Closing branded frame with glowing Arka Fincap crest in copper over dark teal backdrop.',
    voiceoverText:
      'Transform your business ambitions into enduring success. Partner with Arka Fincap today for loans crafted for your growth. Arka Fincap — Aapka Apna Kirloskar.',
    audioCues: 'Full orchestral finish resolving with signature brand chord.',
  },
];

// Maharashtra & Western Hub Expansion Campaign
export const MAHARASHTRA_CAMPAIGN_SCENES: Scene[] = [
  {
    id: 'mh-act1-s1',
    actNumber: 1,
    actTitle: 'Respect to Maharashtra’s Commercial Powerhouse',
    sceneTitle: 'Mumbai Financial Skyline & Gateway at Dawn',
    startTime: 0,
    endTime: 10,
    imageSrc: imgOMR,
    motionType: 'drone_sweep',
    startScale: 1.0,
    endScale: 1.14,
    panDirection: 'left_to_right',
    ostTag: 'NAMASKAR MAHARASHTRA',
    ostTitle: 'Engine of Indian Industry, Trade & Innovation',
    aiPrompt:
      'Sweeping cinematic sunrise drone view over Mumbai financial district and sea link. Teal and copper accents.',
    voiceoverText:
      'Namaskar Maharashtra! The undisputed economic engine of India, where industrious spirit and relentless vision have built nations of commerce and enterprise.',
    audioCues: 'Inspiring orchestral swell with subtle regional acoustic melodies.',
  },
  {
    id: 'mh-act1-s2',
    actNumber: 1,
    actTitle: 'Respect to Maharashtra’s Commercial Powerhouse',
    sceneTitle: 'Auto Clusters & Engineering Belts',
    startTime: 10,
    endTime: 20,
    imageSrc: imgTirupur,
    motionType: 'pan_right',
    startScale: 1.02,
    endScale: 1.14,
    panDirection: 'left_to_right',
    ostTag: 'NAMASKAR MAHARASHTRA',
    ostTitle: 'From Pune Auto Corridors to Nashik Engineering Hubs',
    aiPrompt:
      'Modern industrial manufacturing shopfloor in Chakan industrial belt. Deep teal and copper grading.',
    voiceoverText:
      'From the bustling industrial corridors of Pune and Chakan to trade hubs across Nashik, Nagpur, and Kolhapur, your ambition drives Indian manufacturing forward.',
    audioCues: 'Deep rhythmic percussion rising into corporate momentum.',
  },
  {
    id: 'mh-act2-s1',
    actNumber: 2,
    actTitle: 'The Arka Entrance & Western Offerings',
    sceneTitle: 'Fast-Track SBL & Commercial Transport Solutions',
    startTime: 20,
    endTime: 42,
    imageSrc: imgMSMEStore,
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: 'ARKA FINCAP WESTERN HUB',
    ostTitle: 'Small Ticket LAP, Wheels & MSME Financing',
    aiPrompt:
      'Authentic retail enterprise in Pune with owner holding shop expansion plans with Arka relationship officer. Dark teal and copper accents.',
    voiceoverText:
      'Established in 2018 as an RBI-approved NBFC, Arka Fincap delivers tailored Small Ticket LAP, Used Commercial Vehicle loans, and SME business capital backed by 140-plus branches nationwide.',
    audioCues: 'Warm corporate tempo with acoustic confidence.',
  },
  {
    id: 'mh-act3-s1',
    actNumber: 3,
    actTitle: '130+ Year Kirloskar Legacy Rooted in Maharashtra',
    sceneTitle: 'Industrial Pedigree Born in Maharashtra’s Soil (Kirloskar & Arka Intro)',
    startTime: 42,
    endTime: 64,
    imageSrc: imgOutro,
    videoSrc: videoKirloskarIntro,
    mediaType: 'video',
    motionType: 'slow_push_in',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'center',
    ostTag: '130+ YEARS OF INDUSTRIAL PEDIGREE',
    ostTitle: 'Aapka Apna Kirloskar — Foundation of Trust',
    aiPrompt:
      'Official corporate introduction video celebrating the 130+ year Kirloskar heritage in Maharashtra and the inception of Arka Fincap Limited.',
    voiceoverText:
      'Maharashtra is the very cradle of the 130-plus year Kirloskar heritage. Grounded in trust, empathy, and enduring partnership, we are proudly Aapka Apna Arka.',
    audioCues: 'Majestic orchestral crescendo and resonant bells.',
  },
  {
    id: 'mh-act4-s1',
    actNumber: 4,
    actTitle: 'CRISIL & ICRA AAA Fortress Strength',
    sceneTitle: 'Highest Credit Safety Certification',
    startTime: 64,
    endTime: 84,
    imageSrc: imgCrisilRating,
    motionType: 'macro_zoom',
    startScale: 1.0,
    endScale: 1.14,
    panDirection: 'center',
    ostTag: 'CRISIL & ICRA AAA RATED',
    ostTitle: 'Rock-Solid Safety & Continuous Liquidity',
    aiPrompt:
      'Macro luxury corporate shield with glowing AAA seal. Dark Teal (#062A30) and Copper (#C37C5B).',
    voiceoverText:
      'Rated AAA by CRISIL and ICRA, Arka Fincap guarantees the highest degree of institutional safety and liquidity—standing as an unshakeable rock beside your business.',
    audioCues: 'Resonant metallic chime and deep percussive strike.',
  },
  {
    id: 'mh-act5-s1',
    actNumber: 5,
    actTitle: '333 Vision & Western Hub Expansion',
    sceneTitle: '₹2,500 Crore Western Region Milestone',
    startTime: 84,
    endTime: 96,
    imageSrc: imgOffice2,
    motionType: 'pan_right',
    startScale: 1.0,
    endScale: 1.12,
    panDirection: 'left_to_right',
    ostTag: '333 STRATEGIC VISION',
    ostTitle: 'Targeting ₹2,500 Cr Portfolio Across Maharashtra',
    aiPrompt:
      'Modern Arka corporate meeting in Mumbai with leadership team reviewing regional disbursement targets.',
    voiceoverText:
      'Under the visionary leadership of MD and CEO Samrat Gupta, our 333 Vision sets bold sights on a ₹2,500 Crore portfolio across Maharashtra, backing local entrepreneurs at every turn.',
    audioCues: 'Uplifting modern corporate cadence.',
  },
  {
    id: 'mh-act6-s1',
    actNumber: 6,
    actTitle: 'Call to Action & Partnership Close',
    sceneTitle: 'Partner with Arka Fincap',
    startTime: 96,
    endTime: 105,
    imageSrc: imgOutro,
    motionType: 'outro_reveal',
    startScale: 1.05,
    endScale: 1.18,
    panDirection: 'center',
    ostTag: 'PARTNER WITH US',
    ostTitle: 'Arka Fincap — Aapka Apna Kirloskar',
    aiPrompt:
      'Cinematic outro frame featuring Arka Fincap and Kirloskar crests glowing proudly.',
    voiceoverText:
      'Build your future with a partner who believes in your enterprise. Partner with Arka Fincap today. Arka Fincap — Aapka Apna Kirloskar.',
    audioCues: 'Full orchestral finish resolving gracefully into brand signature.',
  },
];

// All Preset Campaigns
export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: 'preset-tamilnadu-branch',
    title: 'Tamil Nadu Regional Launch',
    region: 'Tamil Nadu',
    targetAudience: 'MSME Entrepreneurs, Textile Units & Transport Fleets',
    products: ['STLAP', 'Used Commercial Vehicle', 'MSME Loans'],
    businessTarget: '₹1,000 Crore Tamil Nadu regional disbursement milestone',
    languageTone: 'Indian English / Tamil Respectful & Authoritative',
    badge: 'Flagship Launch',
    description:
      'Celebrates Tamil Nadu’s heritage, OMR tech corridors, Kanchipuram looms, and ₹1,000 Cr growth target.',
    scenes: TAMIL_NADU_SCENES,
  },
  {
    id: 'preset-wheels-express',
    title: 'Arka Wheels (Commercial Vehicles)',
    region: 'Pan-India / Regional Highways',
    targetAudience: 'Commercial Vehicle Owners, Fleet Operators & Highway Logistics',
    products: ['Used Commercial Vehicle Loans', 'Fleet Refinance'],
    businessTarget: 'Empowering 50,000+ commercial vehicle operators nationwide',
    languageTone: 'Dynamic, Confident & Grounded',
    badge: 'Wheels Focus',
    description:
      'Focuses on commercial transport, road logistics, fleet expansion, and field partner connector meets.',
    scenes: WHEELS_CAMPAIGN_SCENES,
  },
  {
    id: 'preset-sbl-retail',
    title: 'Secured Business Loans (SBL & STLAP)',
    region: 'Tier 2 & Tier 3 Business Centers',
    targetAudience: 'Retail Store Owners, Workshop Proprietors & MSMEs',
    products: ['Small Ticket LAP (STLAP)', 'Secured MSME Finance'],
    businessTarget: 'Fast-track liquidity for 100,000+ local shopfloor enterprises',
    languageTone: 'Warm, Reassuring & Growth-Oriented',
    badge: 'SBL Focus',
    description:
      'Highlights Small Ticket Loans Against Property, store expansion, branch credit reviews, and fast capital.',
    scenes: SBL_CAMPAIGN_SCENES,
  },
  {
    id: 'preset-maharashtra-hub',
    title: 'Maharashtra Commercial Hub Expansion',
    region: 'Maharashtra',
    targetAudience: 'Western India MSMEs, Auto Clusters & Corporate Borrowers',
    products: ['STLAP', 'Used Commercial Vehicle', 'Corporate Lending'],
    businessTarget: '₹2,500 Crore Western Hub portfolio milestone',
    languageTone: 'Prestigious, High-Impact & Proud',
    badge: 'Regional Hub',
    description:
      'Celebrates Mumbai, Pune Chakan auto belt, 130-year Kirloskar home lineage, and ₹2,500 Cr target.',
    scenes: MAHARASHTRA_CAMPAIGN_SCENES,
  },
];

// Helper to generate a dynamic custom campaign for ANY region or product
export function generateDynamicCustomCampaign(params: {
  region: string;
  targetAudience: string;
  products: string[];
  businessTarget: string;
  languageTone: string;
  customNotes?: string;
  selectedAssetImages?: string[];
}): CampaignPreset {
  const reg = params.region.trim() || 'Regional Hub';
  const prodNames = params.products.length > 0 ? params.products.join(', ') : 'STLAP & Business Loans';
  const target = params.businessTarget.trim() || '₹1,000 Cr regional portfolio milestone';
  const aud = params.targetAudience.trim() || 'Local Entrepreneurs & Borrowers';

  const defaultImg1 = params.selectedAssetImages?.[0] || imgOMR;
  const defaultImg2 = params.selectedAssetImages?.[1] || imgMSMEStore;
  const defaultImg3 = params.selectedAssetImages?.[2] || imgCommercialVehicle;
  const defaultImg4 = imgCrisilRating;
  const defaultImg5 = params.selectedAssetImages?.[3] || imgOffice1;
  const defaultImg6 = imgOutro;

  const scenes: Scene[] = [
    // Act 1: Culture & Regional Honor
    {
      id: `custom-${Date.now()}-act1`,
      actNumber: 1,
      actTitle: `Honoring ${reg} Culture & Enterprise`,
      sceneTitle: `${reg} Regional Skyline & Economic Spirit`,
      startTime: 0,
      endTime: 20,
      imageSrc: defaultImg1,
      motionType: 'drone_sweep',
      startScale: 1.0,
      endScale: 1.15,
      panDirection: 'left_to_right',
      ostTag: `WELCOME TO ${reg.toUpperCase()}`,
      ostTitle: `Land of Energy, Enterprise & Enterprise`,
      aiPrompt: `Cinematic drone sweep across ${reg} skyline at sunrise. Visual accents in Dark Teal (#062A30) and Copper (#C37C5B). High production value 8k.`,
      voiceoverText: `Warm greetings to ${reg}! A vibrant land where heritage seamlessly blends with boundless modern ambition. It is your hardworking entrepreneurs and relentless drive that power India forward.`,
      audioCues: `Resonant regional melody blending into an uplifting corporate cadence.`,
    },
    // Act 2: Entrance & Product Relevance
    {
      id: `custom-${Date.now()}-act2`,
      actNumber: 2,
      actTitle: `Arka Fincap Entrance & Product Relevance`,
      sceneTitle: `Delivering ${prodNames} Solutions`,
      startTime: 20,
      endTime: 42,
      imageSrc: defaultImg2,
      motionType: 'slow_push_in',
      startScale: 1.0,
      endScale: 1.12,
      panDirection: 'center',
      ostTag: `CUSTOMER-FIRST FINANCING`,
      ostTitle: `Empowering ${aud}`,
      aiPrompt: `Documentary shot of local business owners in ${reg} consulting with Arka loan officers. Dark Teal (#062A30) and Copper (#C37C5B) accents.`,
      voiceoverText: `Established in 2018 as an RBI-approved NBFC, Arka Fincap brings accessible loan solutions to ${reg}. Across more than 140 branches nationwide, we champion ${aud} with ${prodNames}.`,
      audioCues: `Confident corporate strings and acoustic rhythm.`,
    },
    // Act 3: Kirloskar Group Legacy
    {
      id: `custom-${Date.now()}-act3`,
      actNumber: 3,
      actTitle: `130+ Year Kirloskar Pedigree & Brand Pillars`,
      sceneTitle: `Unshakeable Foundation of Trust (Kirloskar & Arka Intro)`,
      startTime: 42,
      endTime: 64,
      imageSrc: defaultImg6,
      videoSrc: videoKirloskarIntro,
      mediaType: 'video',
      motionType: 'slow_push_in',
      startScale: 1.0,
      endScale: 1.12,
      panDirection: 'center',
      ostTag: `130+ YEAR KIRLOSKAR LEGACY`,
      ostTitle: `Trust, Empathy, Partnership — Aapka Apna Arka`,
      aiPrompt: `Official corporate introduction video showcasing the 130+ year Kirloskar legacy and the inception of Arka Fincap Limited.`,
      voiceoverText: `Backed by the legendary 130-plus year heritage of the Kirloskar Group, our values remain unwavering. Built on trust, empathy, and enduring partnership—Aapka Apna Arka.`,
      audioCues: `Deep orchestral brass swell with rich harmonic resonance.`,
    },
    // Act 4: AAA Strength
    {
      id: `custom-${Date.now()}-act4`,
      actNumber: 4,
      actTitle: `Institutional Power & CRISIL/ICRA AAA Safety`,
      sceneTitle: `Highest Credit Safety & Liquid Strength`,
      startTime: 64,
      endTime: 84,
      imageSrc: defaultImg4,
      motionType: 'macro_zoom',
      startScale: 1.0,
      endScale: 1.14,
      panDirection: 'center',
      ostTag: `CRISIL & ICRA AAA RATED`,
      ostTitle: `Highest Safety Rating & Fortress Balance Sheet`,
      aiPrompt: `Macro shot of glowing AAA shield and burnished copper vault doors. Dark Teal (#062A30) and Copper (#C37C5B).`,
      voiceoverText: `Rated AAA by CRISIL and ICRA, Arka Fincap guarantees the highest degree of financial safety, institutional liquidity, and stability—giving our borrowers rock-solid security.`,
      audioCues: `Metallic chime and deep percussion strike.`,
    },
    // Act 5: Vision & Growth Targets
    {
      id: `custom-${Date.now()}-act5`,
      actNumber: 5,
      actTitle: `333 Vision & Leadership Expansion`,
      sceneTitle: `Aiming for ${target} in ${reg}`,
      startTime: 84,
      endTime: 96,
      imageSrc: defaultImg5,
      motionType: 'pan_right',
      startScale: 1.0,
      endScale: 1.12,
      panDirection: 'left_to_right',
      ostTag: `333 STRATEGIC VISION`,
      ostTitle: `Target: ${target}`,
      aiPrompt: `Arka branch team in ${reg} holding strategy review and approving loan files. Warm ambient lighting.`,
      voiceoverText: `Guided by the 333 Vision championed by MD and CEO Samrat Gupta, we are swiftly expanding across ${reg}. Target set on ${target}, we provide rapid disbursements and dedicated branch support.`,
      audioCues: `Inspiring ascending synthesizer and energetic string crescendo.`,
    },
    // Act 6: Call to Action
    {
      id: `custom-${Date.now()}-act6`,
      actNumber: 6,
      actTitle: `Call to Action & Inspiring Conclusion`,
      sceneTitle: `Partner with Arka Fincap in ${reg}`,
      startTime: 96,
      endTime: 105,
      imageSrc: defaultImg6,
      motionType: 'outro_reveal',
      startScale: 1.05,
      endScale: 1.18,
      panDirection: 'center',
      ostTag: `GROW WITH ARKA FINCAP`,
      ostTitle: `Arka Fincap — Aapka Apna Kirloskar`,
      aiPrompt: `Branded outro closing scene with Arka Fincap emblem glowing warmly in copper against dark teal backdrop.`,
      voiceoverText: `Together, let us build a stronger, more prosperous tomorrow. Partner with Arka Fincap today. Arka Fincap — Aapka Apna Kirloskar.`,
      audioCues: `Grand orchestral resolution with signature brand audio chord.`,
    },
  ];

  return {
    id: `custom-${Date.now()}`,
    title: `${reg} Custom Campaign`,
    region: reg,
    targetAudience: aud,
    products: params.products,
    businessTarget: target,
    languageTone: params.languageTone,
    badge: 'Custom Generated',
    description: `Custom video campaign for ${reg} targeting ${aud} with ${prodNames} and milestone of ${target}.`,
    scenes,
  };
}
