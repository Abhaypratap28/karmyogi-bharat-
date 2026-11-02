export type UserRole = 'worker' | 'seeker';

export const OCCUPATIONS = [
  // Existing KARMYOGI occupations
  'Carpenter', 'Electrician', 'Plumber', 'Teacher / Tutor', 'Mason / Construction', 'Painter',
  'AC & Appliance Tech', 'Welder / Fabricator', 'House Cleaner', 'Gardener / Landscaper',
  'Auto / Two-Wheeler Mechanic', 'Tailor / Fashion Designer', 'Security & Guard', 'Catering / Chef',
  'CCTV & Electronics Tech', 'Tile & Marble Layer',
  // Banking, hospitality, transport and local services
  'Private Bank Employee', 'Insurance Agent', 'Financial Adviser', 'Real Estate Agent', 'Security Guard',
  'Hotel Receptionist', 'Chef', 'Waiter', 'E-rickshaw Driver', 'Auto-rickshaw Driver',
  'Cycle-rickshaw Driver', 'Delivery Worker', 'Transport Helper', 'Local Goods Carrier', 'Taxi Driver',
  'Private Bus Driver', 'Truck Driver', 'Courier Delivery Executive', 'Logistics Assistant',
  // Artisan, retail and street-vending work
  'Tailor', 'Cobbler', 'Barber', 'Laundry Worker', 'Domestic Worker', 'Potter', 'Handloom Worker',
  'Handicraft Maker', 'Embroidery Worker', 'Basket Maker', 'Goldsmith', 'Furniture Maker',
  'Vegetable and Fruit Seller', 'Street Food Vendor', 'Tea Stall Owner', 'Small Grocery Shop Helper',
  'Newspaper Vendor', 'Scrap Collector', 'Handcart Vendor', 'Flower Seller', 'Milk Seller',
  'Street-side Garment Seller',
  // Construction, factory and agriculture
  'Construction Helper', "Mason's Assistant", 'Road Construction Worker', 'Loading and Unloading Worker',
  'Factory Labourer', 'Packaging Worker', "House Painter's Assistant", 'Warehouse Worker',
  'Production Worker', 'Machine Operator', 'Agricultural Labourer', 'Small or Marginal Farmer',
  'Dairy Worker', 'Cattle Herder', 'Poultry Farm Worker', 'Fishing Worker', 'Harvesting Worker',
  'Plantation Worker', 'Private Farm Supervisor', 'Dairy Farm Owner',
  // Technical and trade services
  'Mechanic', 'Welder', 'AC and Refrigeration Technician', 'Computer Repair Technician',
  'Automobile Service Technician', 'Mobile Repair Technician', 'Construction Contractor',
  'CNC Machine Operator', 'Solar Panel Technician', 'Lift Maintenance Technician', 'Electrical Contractor',
  // Healthcare
  'Private Hospital Nurse', 'Pharmacist', 'Laboratory Technician', 'Medical Representative',
  'Physiotherapist', 'Clinic Administrator', 'Healthcare Assistant', 'Medical Coder',
  'Medical Billing Executive', 'Hospital Receptionist', 'Pharmaceutical Production Worker',
  // IT and engineering
  'Software Developer', 'IT Support Technician', 'Electronics Technician', 'Electrical Engineer',
  'Mechanical Engineer', 'Civil Engineer', 'VLSI Engineer', 'Network Engineer', 'Cybersecurity Analyst',
  'Data Analyst', 'Web Developer', 'Hardware Engineer', 'Embedded Systems Engineer', 'Software Tester',
  'Cloud Engineer',
  // Office, education and creative work
  'Office Administrator', 'Accountant', 'HR Executive', 'Customer Support Executive', 'Sales Executive',
  'Operations Executive', 'Receptionist', 'Data Entry Operator', 'Back-office Executive',
  'Office Assistant', 'Personal Assistant', 'Document Controller', 'Private School Teacher',
  'Private College Lecturer', 'Tuition Teacher', 'Coaching Centre Teacher', 'Online Tutor',
  'Computer Instructor', 'Lab Assistant', 'Academic Counsellor', 'Housekeeping Worker',
  'Photographer', 'Video Editor', 'Graphic Designer', 'Content Writer', 'Digital Marketing Executive',
  'Event Management Assistant',
] as const;

export type Occupation = (typeof OCCUPATIONS)[number];

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  completedDate: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  age: number;
  phone: string;
  aadhaarNumber: string; // Stored securely, shown masked e.g. "XXXX-XXXX-1234"
  address: string;
  city: string;
  pincode: string;
  location: {
    lat: number;
    lng: number;
  };
  profilePic: string;
  idProofDocument?: string;
  idProofType?: string;
  backgroundCert?: string;
  isVerified: boolean;
  emailVerified?: boolean;
  verifiedAt?: string;
  encryptionBadge: boolean;
  createdAt: string;

  // Worker specific fields
  occupation?: Occupation;
  skills?: string[];
  ratePerHour?: number;
  ratePerMonth?: number;
  rateUnit?: 'hour' | 'month' | 'project';
  experienceYears?: number;
  bio?: string;
  portfolio?: PortfolioItem[];
  isAvailable?: boolean;
  rating?: number;
  reviewCount?: number;
  completedJobsCount?: number;
  distanceKm?: number; // Calculated dynamically relative to current seeker
}

export interface Booking {
  id: string;
  seekerId: string;
  seekerName: string;
  seekerPhone: string;
  seekerAddress: string;
  seekerCity: string;
  seekerLocation: {
    lat: number;
    lng: number;
  };
  seekerPic: string;
  workerId: string;
  workerName: string;
  workerOccupation: string;
  workerPhone: string;
  workerPic: string;
  workerAddress: string;
  workerCity: string;
  workerLocation: {
    lat: number;
    lng: number;
  };
  projectTitle: string;
  projectDescription: string;
  serviceDate: string;
  serviceTime?: string;
  agreedRate: number;
  rateType: 'hour' | 'month' | 'project';
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  mutualDetailsShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  text: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    address?: string;
    sharedAt: string;
  };
  attachmentUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  workerId: string;
  seekerId: string;
  seekerName: string;
  seekerPic: string;
  seekerCity: string;
  rating: number;
  comment: string;
  serviceName: string;
  tags: string[];
  workPhotos?: string[];
  createdAt: string;
}

export interface JobLead {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhone: string;
  creatorType: 'homeowner' | 'contractor';
  title: string;
  description: string;
  occupation: Occupation;
  budget: number;
  budgetType: 'fixed' | 'hourly' | 'monthly';
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
  urgency: 'immediate' | 'within_week' | 'flexible';
  requiredSkills: string[];
  status: 'open' | 'matched' | 'closed';
  proposalsCount: number;
  acceptedWorkerId?: string;
  createdAt: string;
}

export interface LeadProposal {
  id: string;
  leadId: string;
  workerId: string;
  workerName: string;
  workerOccupation?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FeedPost {
  id: string;
  workerId: string;
  workerName: string;
  workerOccupation: string;
  workerPic: string;
  workerCity: string;
  isVerified: boolean;
  title: string;
  content: string;
  photos: string[];
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: {
    id: string;
    authorId: string;
    authorName: string;
    authorPic: string;
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'booking_request' | 'booking_accepted' | 'booking_declined' | 'new_message' | 'new_lead_match' | 'lead_proposal_sent' | 'lead_accepted' | 'review_received';
  title: string;
  description: string;
  linkId?: string; // bookingId or leadId
  isRead: boolean;
  createdAt: string;
}
