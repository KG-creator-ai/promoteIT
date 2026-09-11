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
import imgRating from '../assets/media/legacy_crisil_icra_aaa_rating.jpg';
import imgTamilNadu333 from '../assets/media/legacy_tamilnadu_future_333_vision.jpg';
import imgLegacy from '../assets/media/legacy_arka_kirloskar_brand_outro.jpg';

// Corporate Introduction Video (Act 3: Kirloskar & Arka Intro)
import videoKirloskarIntro from '../assets/media/arka_investor_Intro_Kirloskar.mp4';

export interface MediaAsset {
  id: string;
  title: string;
  category: 'heritage' | 'products' | 'legacy' | 'ratings' | 'leadership' | 'branch_team' | 'partner_connector' | 'custom';
  description: string;
  imageSrc: string;
  videoSrc?: string;
  mediaType?: 'image' | 'video';
  tags: string[];
  recommendedActs: number[];
  isCustom?: boolean;
}

export const PRESET_ASSET_LIBRARY: MediaAsset[] = [
  // Corporate Video Intro
  {
    id: 'asset-kirloskar-arka-intro-video',
    title: 'HD MP4 Video: 130+ Years Kirloskar Legacy & Arka Inception',
    category: 'legacy',
    description: 'Corporate introduction video clip showcasing the 130+ year Kirloskar heritage and the inception of Arka Fincap Limited ("Aapka Apna Kirloskar").',
    imageSrc: imgLegacy,
    videoSrc: videoKirloskarIntro,
    mediaType: 'video',
    tags: ['Video Clip', 'MP4', 'Kirloskar Legacy', 'Arka Intro', 'Act 3', 'Corporate AV', '130+ Years'],
    recommendedActs: [3, 2],
  },
  // STLAP: Tambaram Branch Suite
  {
    id: 'asset-tambaram-branch-01',
    title: 'STLAP: Tambaram Regional Inauguration & Entrance',
    category: 'branch_team',
    description: 'Arka Fincap Tambaram branch welcoming entrance and corporate identity (#062A30 & #C37C5B).',
    imageSrc: imgTambaramEntrance,
    tags: ['STLAP', 'tambaram_branch', 'sbl_stlap', 'Branch Inauguration', '140+ Branches', 'Gateway'],
    recommendedActs: [2],
  },
  {
    id: 'asset-tambaram-branch-02',
    title: 'STLAP: Tambaram Branch Front & Customer Reception',
    category: 'branch_team',
    description: 'Arka Fincap Tambaram branch facility with customer helpdesk and dedicated relationship team.',
    imageSrc: imgTambaramReception,
    tags: ['STLAP', 'tambaram_branch', 'sbl_stlap', 'Reception', 'Customer Service', 'Retail'],
    recommendedActs: [2, 5],
  },
  {
    id: 'asset-tambaram-branch-03',
    title: 'STLAP: Tambaram Operations & Credit Review Lounge',
    category: 'branch_team',
    description: 'Active branch credit review and fast-track loan processing counter at Tambaram regional office.',
    imageSrc: imgTambaramOperations,
    tags: ['STLAP', 'tambaram_branch', 'sbl_stlap', 'Operations', 'Credit Processing', 'Fast Track'],
    recommendedActs: [2, 4],
  },
  {
    id: 'asset-tambaram-branch-04',
    title: 'STLAP: Tambaram Customer Consultation Lounge',
    category: 'branch_team',
    description: 'Branch relationship managers and sales consultants assisting retail and business borrowers in lounge.',
    imageSrc: imgTambaramLounge,
    tags: ['STLAP', 'tambaram_branch', 'sbl_stlap', 'Consultation Lounge', 'Relationship Managers'],
    recommendedActs: [2, 3, 6],
  },
  {
    id: 'asset-tambaram-branch-05',
    title: 'STLAP: Tambaram Branch Customer Advisory Hall',
    category: 'branch_team',
    description: 'Dedicated financial advisory workstation supporting small business entrepreneurs across Chennai.',
    imageSrc: imgTambaramAdvisory,
    tags: ['STLAP', 'tambaram_branch', 'sbl_stlap', 'Advisory', 'MSME', 'Empowerment'],
    recommendedActs: [2, 5, 6],
  },

  // SBL: Meetings & Enterprise
  {
    id: 'asset-sbl-credit-committee',
    title: 'SBL: Credit Committee & Underwriting Review',
    category: 'branch_team',
    description: 'Arka branch underwriters and credit committee reviewing Small Ticket LAP applications with diligence.',
    imageSrc: imgSBLCreditCommittee,
    tags: ['productSBL', 'sbl_stlap', 'candid_meetings', 'Credit Review', 'Disbursement', 'Safety'],
    recommendedActs: [2, 4],
  },
  {
    id: 'asset-sbl-strategy-meeting',
    title: 'SBL: Branch Strategy & Customer Empowerment Deliberation',
    category: 'branch_team',
    description: 'Branch management and relationship managers aligning on STLAP expansion, trust, and empathy pillars.',
    imageSrc: imgSBLStrategy,
    tags: ['productSBL', 'sbl_stlap', 'candid_meetings', 'Branch Strategy', 'Trust', 'Empathy'],
    recommendedActs: [2, 3, 6],
  },
  {
    id: 'asset-msme-workshop',
    title: 'SBL: MSME Retail & Workshop Enterprise',
    category: 'products',
    description: 'Thriving local retail enterprise and workshop owner empowered by Small Ticket LAP & SME loans.',
    imageSrc: imgMSMEWorkshop,
    tags: ['productSBL', 'sbl_stlap', 'enterprise_workshops', 'STLAP', 'MSME Loans', 'Retail', 'Workshop'],
    recommendedActs: [2, 5],
  },

  // Product Wheels & UCV
  {
    id: 'asset-cuddalore-wheels',
    title: 'Product Wheels: Cuddalore Branch Ground Disbursement',
    category: 'products',
    description: 'Field photo captured by GPS Map Camera: commercial fleet and vehicle loan disbursements in Cuddalore hub.',
    imageSrc: imgCuddaloreWheels,
    tags: ['productWheels', 'cuddalore_branch', 'business_activity', 'UCV', 'Commercial Transport'],
    recommendedActs: [2, 5],
  },
  {
    id: 'asset-wheels-connector',
    title: 'Product Wheels: Grassroots Connector Partner Meet',
    category: 'partner_connector',
    description: 'Arka Wheels & Commercial Vehicle loan team collaborating with on-ground transport connectors and channel partners.',
    imageSrc: imgWheelsConnector,
    tags: ['productWheels', 'partner_visits', 'Connector Meet', 'Channel Partner', 'Field Team'],
    recommendedActs: [2, 5, 6],
  },
  {
    id: 'asset-wheels-freight',
    title: 'Product Wheels: Commercial Highway Freight Logistics',
    category: 'products',
    description: 'Heavy commercial transport vehicle cruising on national highway; Used Commercial Vehicle (UCV) financing.',
    imageSrc: imgWheelsLogistics,
    tags: ['productWheels', 'commercial_logistics', 'UCV', 'Fleet Finance', 'Logistics', 'Highway'],
    recommendedActs: [2, 5],
  },
  {
    id: 'asset-wheels-industrial',
    title: 'Product Wheels: Industrial Fleet & Textile Transport',
    category: 'products',
    description: 'High-volume regional manufacturing and industrial logistics transport powering Tirupur & Coimbatore hubs.',
    imageSrc: imgTirupurIndustrial,
    tags: ['productWheels', 'commercial_logistics', 'Industrial Logistics', 'Tirupur', 'Textile Transport'],
    recommendedActs: [1, 2, 3],
  },

  // Heritage Suite
  {
    id: 'asset-chennai-central',
    title: 'Chennai Central Heritage Gateway',
    category: 'heritage',
    description: 'Iconic Victorian Gothic railway terminus at golden hour sunrise with bustling morning transit.',
    imageSrc: imgChennai,
    tags: ['Chennai', 'Heritage', 'Sunrise', 'Architecture', 'Culture'],
    recommendedActs: [1],
  },
  {
    id: 'asset-kanchipuram-loom',
    title: 'Kanchipuram Silk Loom & Master Weavers',
    category: 'heritage',
    description: 'Macro detail of golden silk threads woven on traditional pit loom celebrating Tamil artisanal mastery.',
    imageSrc: imgLoom,
    tags: ['Kanchipuram', 'Silk Loom', 'Craft', 'MSME', 'Artisan'],
    recommendedActs: [1, 2],
  },
  {
    id: 'asset-omr-corridor',
    title: 'OMR IT Expressway & Tech Parks',
    category: 'heritage',
    description: 'Modern twilight view of Chennai high-tech industrial expressway and tech skyscrapers with glowing trails.',
    imageSrc: imgOMR,
    tags: ['OMR', 'Chennai', 'Expressway', 'Technology', 'Modern'],
    recommendedActs: [1],
  },
  {
    id: 'asset-kanyakumari-statue',
    title: 'Thiruvalluvar Statue & Kanyakumari Coast',
    category: 'heritage',
    description: 'Majestic 133-foot stone statue at confluence of three seas symbolizing cultural wisdom and nation-building.',
    imageSrc: imgKanyakumari,
    tags: ['Kanyakumari', 'Thiruvalluvar', 'Ocean', 'Wisdom', 'Pride'],
    recommendedActs: [1, 6],
  },

  // Legacy & Ratings Suite
  {
    id: 'asset-kirloskar-legacy',
    title: '130+ Year Kirloskar Engineering Pedigree',
    category: 'legacy',
    description: 'Nation-building iron engineering foundry transitioning to modern precision manufacturing.',
    imageSrc: imgLegacy,
    tags: ['Kirloskar', '130+ Years', 'Heritage', 'Engineering', 'Trust'],
    recommendedActs: [3, 6],
  },
  {
    id: 'asset-aaa-rating',
    title: 'CRISIL & ICRA AAA Institutional Strength',
    category: 'ratings',
    description: 'Sleek corporate metallic vault and burnished copper shield representing AAA Highest Safety certification.',
    imageSrc: imgRating,
    tags: ['AAA Rating', 'CRISIL', 'ICRA', 'Safety', 'Fortress Balance Sheet'],
    recommendedActs: [4],
  },
  {
    id: 'asset-tamilnadu-333',
    title: 'Tamil Nadu 333 Vision & Leadership Map',
    category: 'leadership',
    description: 'Strategic nodal expansion across Chennai, Coimbatore, Madurai, Salem, and Trichy spearheaded by MD & CEO Samrat Puri.',
    imageSrc: imgTamilNadu333,
    tags: ['333 Vision', 'Samrat Puri', 'Expansion', 'Tamil Nadu', 'Future'],
    recommendedActs: [5],
  },
];

