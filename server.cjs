var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_google_auth_library = require("google-auth-library");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_node_crypto = require("node:crypto");
var import_node_http = require("node:http");
var import_node_fs = require("node:fs");
import_dotenv.default.config({ quiet: true });
import_dotenv.default.config({ path: "SMTP", override: false, quiet: true });
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
var MAX_LOCATION_ACCURACY_METERS = 100;
var MAX_LOCATION_FIX_AGE_MS = 2 * 6e4;
var reverseLocationCache = /* @__PURE__ */ new Map();
var reverseLocationCacheKey = (lat, lng) => `${lat.toFixed(4)},${lng.toFixed(4)}`;
var formatCityRegion = (city, region) => {
  const cleanCity = city?.trim() || "";
  const cleanRegion = region?.trim() || "";
  if (!cleanCity) return cleanRegion;
  if (!cleanRegion || cleanCity.localeCompare(cleanRegion, void 0, { sensitivity: "accent" }) === 0) return cleanCity;
  return `${cleanCity}, ${cleanRegion}`;
};
var getGoogleLocation = async (lat, lng, mapsApiKey) => {
  const response = await fetch(
    `https://geocode.googleapis.com/v4/geocode/location/${encodeURIComponent(lat)},${encodeURIComponent(lng)}?languageCode=en`,
    {
      headers: {
        "X-Goog-Api-Key": mapsApiKey,
        "X-Goog-FieldMask": "results.formattedAddress,results.addressComponents"
      },
      signal: AbortSignal.timeout(8e3)
    }
  );
  if (!response.ok) return null;
  const result = await response.json();
  const bestMatch = result.results?.[0];
  if (!bestMatch) return null;
  const components = bestMatch.addressComponents || [];
  const findComponent = (types) => components.find((component) => component.types?.some((type) => types.includes(type)))?.longText || "";
  const city = findComponent(["locality", "postal_town", "administrative_area_level_2", "administrative_area_level_3"]);
  const region = findComponent(["administrative_area_level_1"]);
  return { city: formatCityRegion(city, region), region, address: bestMatch.formattedAddress || "", source: "google" };
};
var getOpenStreetMapLocation = async (lat, lng) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
    {
      headers: {
        // Nominatim requires an identifying User-Agent for server-side requests.
        "User-Agent": "KARMYOGI-location-service/1.0",
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(8e3)
    }
  );
  if (!response.ok) return null;
  const result = await response.json();
  const address = result.address || {};
  const city = address.city || address.town || address.village || address.municipality || address.county || address.state_district || "";
  const region = address.state || address.state_district || "";
  const formattedCity = formatCityRegion(city, region);
  if (!formattedCity && !result.display_name) return null;
  return { city: formattedCity, region, address: result.display_name || formattedCity, source: "openstreetmap" };
};
var users = [
  {
    id: "w-1",
    name: 'Rameshwar "Ramu" Sharma',
    email: "ramu.carpenter@karmyogi.in",
    role: "worker",
    age: 38,
    phone: "+91 98712 34501",
    aadhaarNumber: "XXXX-XXXX-7812",
    address: "Shop 14, Timber Market, Sector 18",
    city: "Noida, Uttar Pradesh",
    pincode: "201301",
    location: { lat: 28.5708, lng: 77.3261 },
    profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "Aadhaar_Verified_Govt_Portal.pdf",
    idProofType: "Aadhaar Card",
    backgroundCert: "Police_Clearance_Noida_Sec18.pdf",
    isVerified: true,
    verifiedAt: "2024-01-15",
    encryptionBadge: true,
    createdAt: "2023-11-10",
    occupation: "Carpenter",
    skills: ["Modular Kitchen Design", "Teak Wood Furniture", "Door & Window Fitting", "Wardrobe Polishing", "Wood Repair"],
    ratePerHour: 350,
    ratePerMonth: 28e3,
    rateUnit: "hour",
    experienceYears: 14,
    bio: "Government Trade Certified Master Carpenter with 14+ years crafting premium modular kitchens, wardrobes, and antique wooden restoration in Delhi NCR.",
    isAvailable: true,
    rating: 4.9,
    reviewCount: 48,
    completedJobsCount: 142,
    portfolio: [
      {
        id: "p-1",
        title: "Custom Rosewood Dining & Modular Kitchen",
        description: "Completed solid rosewood 8-seater dining setup with soft-close acrylic modular cabinets in Sector 62.",
        imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
        category: "Carpentry",
        completedDate: "Feb 2024"
      },
      {
        id: "p-2",
        title: "Floor-to-Ceiling Master Wardrobe",
        description: "Modern sliding wardrobe with internal LED profile lighting and velvet jewelry drawer organizers.",
        imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80",
        category: "Carpentry",
        completedDate: "Jan 2024"
      }
    ]
  },
  {
    id: "w-2",
    name: "Rajesh Kumar Maurya",
    email: "rajesh.electric@karmyogi.in",
    role: "worker",
    age: 32,
    phone: "+91 98109 87654",
    aadhaarNumber: "XXXX-XXXX-4521",
    address: "B-42, Vikas Marg, Laxmi Nagar",
    city: "East Delhi, Delhi",
    pincode: "110092",
    location: { lat: 28.6304, lng: 77.2773 },
    profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "Aadhaar_Govt_EID_9921.pdf",
    idProofType: "Aadhaar Card",
    backgroundCert: "ITI_Electrical_Diploma_A_Grade.pdf",
    isVerified: true,
    verifiedAt: "2023-12-05",
    encryptionBadge: true,
    createdAt: "2023-10-18",
    occupation: "Electrician",
    skills: ["Complete House Rewiring", "Inverter & UPS Setup", "MCB Tripping Diagnosis", "Smart Home Automation", "Heavy Load Industrial Setup"],
    ratePerHour: 300,
    ratePerMonth: 25e3,
    rateUnit: "hour",
    experienceYears: 10,
    bio: "ITI Certified Grade-A Electrical Technician specializing in short-circuit prevention, 3-phase wiring, smart switches, and power backup setups.",
    isAvailable: true,
    rating: 4.8,
    reviewCount: 62,
    completedJobsCount: 210,
    portfolio: [
      {
        id: "p-3",
        title: "Complete 3BHK Concealed Conduit Rewiring",
        description: "Installed Havells flame-retardant cabling, 12-way distribution board, and smart Wi-Fi touch switches.",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
        category: "Electrical",
        completedDate: "Jan 2024"
      }
    ]
  },
  {
    id: "w-3",
    name: "Sunita Devi (M.Sc. B.Ed.)",
    email: "sunita.teacher@karmyogi.in",
    role: "worker",
    age: 29,
    phone: "+91 97113 45890",
    aadhaarNumber: "XXXX-XXXX-9034",
    address: "Flat 302, Green View Apts, Indirapuram",
    city: "Ghaziabad, Uttar Pradesh",
    pincode: "201014",
    location: { lat: 28.6415, lng: 77.3686 },
    profilePic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "Aadhaar_BEd_Verified.pdf",
    idProofType: "Aadhaar Card",
    backgroundCert: "CTET_Qualified_Cert_2022.pdf",
    isVerified: true,
    verifiedAt: "2024-02-01",
    encryptionBadge: true,
    createdAt: "2023-09-12",
    occupation: "Teacher / Tutor",
    skills: ["CBSE Class 8-12 Mathematics", "Physics Foundations", "IIT-JEE Foundation", "Vedic Math Shortcuts", "One-on-One Remedial Tutoring"],
    ratePerHour: 500,
    ratePerMonth: 12e3,
    rateUnit: "hour",
    experienceYears: 7,
    bio: "CTET Qualified Post-Graduate in Mathematics with 7+ years track record. Helped over 80+ students score 95%+ in CBSE Board exams.",
    isAvailable: true,
    rating: 5,
    reviewCount: 39,
    completedJobsCount: 84,
    portfolio: [
      {
        id: "p-4",
        title: "Class 10 & 12 Board Maths Batch Results",
        description: "14 out of 16 students in 2023 batch scored above 92/100 in CBSE Class 10 Board exam.",
        imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80",
        category: "Education",
        completedDate: "Dec 2023"
      }
    ]
  },
  {
    id: "w-4",
    name: "Mukesh Bhai Prajapati",
    email: "mukesh.plumber@karmyogi.in",
    role: "worker",
    age: 41,
    phone: "+91 98251 77312",
    aadhaarNumber: "XXXX-XXXX-3341",
    address: "Near Old Bus Stand, Karol Bagh",
    city: "Central Delhi, Delhi",
    pincode: "110005",
    location: { lat: 28.6517, lng: 77.1906 },
    profilePic: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "Aadhaar_Delhi_Govt_221.pdf",
    idProofType: "Aadhaar Card",
    backgroundCert: "National_Skill_Dev_Plumbing_Cert.pdf",
    isVerified: true,
    verifiedAt: "2024-01-20",
    encryptionBadge: true,
    createdAt: "2023-08-15",
    occupation: "Plumber",
    skills: ["CPVC / UPVC Pipeline Leakage", "Overhead Tank Installation", "Bathroom Sanitary Fixtures", "Water Pressure Pump Setup", "Underground Drainage"],
    ratePerHour: 280,
    ratePerMonth: 24e3,
    rateUnit: "hour",
    experienceYears: 16,
    bio: "NSDC Certified Master Plumber. Expert in diagnosing stubborn concealed wall leaks with acoustic detectors and modern bathroom sanitary fittings.",
    isAvailable: true,
    rating: 4.7,
    reviewCount: 54,
    completedJobsCount: 195,
    portfolio: [
      {
        id: "p-5",
        title: "Luxury Italian Fixture Bathroom Overhaul",
        description: "Installed wall-hung commode with concealed cistern, rain shower, and thermostatic diverter valves.",
        imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
        category: "Plumbing",
        completedDate: "Jan 2024"
      }
    ]
  },
  {
    id: "w-5",
    name: "Balwant Singh Mason & Contractors",
    email: "balwant.mason@karmyogi.in",
    role: "worker",
    age: 46,
    phone: "+91 98112 09845",
    aadhaarNumber: "XXXX-XXXX-6612",
    address: "Near Metro Pillar 310, Dwarka Mor",
    city: "South West Delhi, Delhi",
    pincode: "110059",
    location: { lat: 28.6186, lng: 77.0319 },
    profilePic: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "Aadhaar_Balwant_Singh.pdf",
    idProofType: "Aadhaar Card",
    backgroundCert: "Labour_Dept_Master_Mason_Card.pdf",
    isVerified: true,
    verifiedAt: "2023-11-28",
    encryptionBadge: true,
    createdAt: "2023-07-20",
    occupation: "Mason / Construction",
    skills: ["Brick & Concrete Masonry", "Plastering & POP Work", "Tile & Granite Flooring", "Structural Crack Repair", "Waterproofing Terrace"],
    ratePerHour: 400,
    ratePerMonth: 32e3,
    rateUnit: "hour",
    experienceYears: 22,
    bio: "Veteran Head Mason managing skilled mistri & beldar teams for residential home extensions, tile laying, and terrace waterproofing.",
    isAvailable: true,
    rating: 4.9,
    reviewCount: 31,
    completedJobsCount: 118,
    portfolio: [
      {
        id: "p-6",
        title: "Second Floor 1200 Sq.Ft House Extension",
        description: "Complete red brick masonry with 9-inch load bearing pillars, cement plastering and waterproofing.",
        imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=600&auto=format&fit=crop&q=80",
        category: "Masonry",
        completedDate: "Nov 2023"
      }
    ]
  },
  {
    id: "w-6",
    name: "Arjun Rathore (Wall Art & Texture)",
    email: "arjun.painter@karmyogi.in",
    role: "worker",
    age: 30,
    phone: "+91 99104 55678",
    aadhaarNumber: "XXXX-XXXX-8921",
    address: "Street 4, Govindpuri, Kalkaji",
    city: "South Delhi, Delhi",
    pincode: "110019",
    location: { lat: 28.5355, lng: 77.2612 },
    profilePic: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "Aadhaar_Arjun_Verified.pdf",
    idProofType: "Aadhaar Card",
    backgroundCert: "Asian_Paints_Master_Applicator_Cert.pdf",
    isVerified: true,
    verifiedAt: "2024-02-10",
    encryptionBadge: true,
    createdAt: "2023-12-01",
    occupation: "Painter",
    skills: ["Royal Luxury Emulsion Painting", "3D Metallic Wall Texture", "Waterproofing Base Coat", "Wood PU & Melamine Polish", "Exterior Weatherproof Shield"],
    ratePerHour: 320,
    ratePerMonth: 26e3,
    rateUnit: "hour",
    experienceYears: 9,
    bio: "Certified Master Applicator in Royal Luxury & Stucco marble textures. Fast, clean laser masking with zero paint drip guarantee.",
    isAvailable: true,
    rating: 4.9,
    reviewCount: 44,
    completedJobsCount: 156,
    portfolio: [
      {
        id: "p-7",
        title: "Venetian Stucco Texture Feature Wall",
        description: "Created stunning Italian marble texture finish in drawing room with golden metallic highlights.",
        imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80",
        category: "Painting",
        completedDate: "Jan 2024"
      }
    ]
  },
  {
    id: "w-7",
    name: "Deepak Kumar Saini",
    email: "deepak.ac@karmyogi.in",
    role: "worker",
    age: 28,
    phone: "+91 98733 22119",
    aadhaarNumber: "XXXX-XXXX-1190",
    address: "Pocket C, Mayur Vihar Phase 2",
    city: "East Delhi, Delhi",
    pincode: "110091",
    location: { lat: 28.6143, lng: 77.3025 },
    profilePic: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "Aadhaar_Deepak_AC.pdf",
    idProofType: "Aadhaar Card",
    backgroundCert: "Daikin_LG_Certified_Service_Tech.pdf",
    isVerified: true,
    verifiedAt: "2024-01-08",
    encryptionBadge: true,
    createdAt: "2023-11-25",
    occupation: "AC & Appliance Tech",
    skills: ["Inverter Split AC Jet Pump Service", "Gas Leakage & R32/R410 Topup", "PCB Circuit Board Repair", "Refrigerator Compressor Replacement", "Washing Machine Drum Fix"],
    ratePerHour: 350,
    ratePerMonth: 28e3,
    rateUnit: "hour",
    experienceYears: 8,
    bio: "Ex-Authorized Brand Senior Technician. Specialized in inverter AC PCB chip repairs, pressure jet washing, and high-efficiency gas charging.",
    isAvailable: true,
    rating: 4.8,
    reviewCount: 71,
    completedJobsCount: 280,
    portfolio: [
      {
        id: "p-8",
        title: "Multi-Split AC Deep Jet Foam Cleaning",
        description: "Complete indoor and outdoor unit servicing using high-pressure foam sprayer and antibacterial coat.",
        imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80",
        category: "Appliance",
        completedDate: "Feb 2024"
      }
    ]
  },
  {
    id: "s-1",
    name: "Priya Verma",
    email: "priya.verma@gmail.com",
    role: "seeker",
    age: 34,
    phone: "+91 98110 44321",
    aadhaarNumber: "XXXX-XXXX-9912",
    address: "Tower B, Flat 804, Express Greens, Sector 44",
    city: "Noida, Uttar Pradesh",
    pincode: "201303",
    location: { lat: 28.5612, lng: 77.3341 },
    profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "Aadhaar_Priya_Homeowner.pdf",
    idProofType: "Aadhaar Card",
    backgroundCert: "Resident_Verification_Society.pdf",
    isVerified: true,
    verifiedAt: "2023-10-12",
    encryptionBadge: true,
    createdAt: "2023-10-01"
  },
  {
    id: "s-2",
    name: 'Vikramaditya "Vikram" Singh',
    email: "vikram.buildcon@gmail.com",
    role: "seeker",
    age: 42,
    phone: "+91 98711 88990",
    aadhaarNumber: "XXXX-XXXX-5544",
    address: "Singh Infra Developers, Connaught Place",
    city: "New Delhi, Delhi",
    pincode: "110001",
    location: { lat: 28.6328, lng: 77.2197 },
    profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    idProofDocument: "GST_Contractor_Reg_9921.pdf",
    idProofType: "Trade Guild Pass",
    backgroundCert: "Govt_Contractor_Class1_Licence.pdf",
    isVerified: true,
    verifiedAt: "2023-09-18",
    encryptionBadge: true,
    createdAt: "2023-09-01"
  }
];
var seededProfileIds = new Set(users.map((user) => user.id));
users.length = 0;
var credentials = /* @__PURE__ */ new Map();
var accountStoreDirectory = import_path.default.join(process.cwd(), "data");
var accountStorePath = import_path.default.join(accountStoreDirectory, "accounts.json");
var isStoredUser = (value) => {
  if (!value || typeof value !== "object") return false;
  const user = value;
  return typeof user.id === "string" && typeof user.name === "string" && typeof user.email === "string" && (user.role === "worker" || user.role === "seeker") && Boolean(user.location) && Number.isFinite(user.location?.lat) && Number.isFinite(user.location?.lng);
};
var saveAccountState = () => {
  try {
    (0, import_node_fs.mkdirSync)(accountStoreDirectory, { recursive: true });
    const state = {
      users,
      credentials: [...credentials.entries()],
      savedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const temporaryPath = `${accountStorePath}.${process.pid}.tmp`;
    (0, import_node_fs.writeFileSync)(temporaryPath, JSON.stringify(state, null, 2), "utf8");
    (0, import_node_fs.renameSync)(temporaryPath, accountStorePath);
    return true;
  } catch (error) {
    console.error("Unable to persist account and location data:", error);
    return false;
  }
};
var loadAccountState = () => {
  if (!(0, import_node_fs.existsSync)(accountStorePath)) return;
  try {
    const stored = JSON.parse((0, import_node_fs.readFileSync)(accountStorePath, "utf8"));
    if (!Array.isArray(stored.users) || !stored.users.every(isStoredUser)) {
      throw new Error("The saved account list is invalid.");
    }
    const restoredUsers = stored.users.filter((user) => !seededProfileIds.has(user.id));
    const removedSeededProfiles = restoredUsers.length !== stored.users.length;
    users.splice(0, users.length, ...restoredUsers);
    credentials.clear();
    if (Array.isArray(stored.credentials)) {
      for (const entry of stored.credentials) {
        if (!Array.isArray(entry) || typeof entry[0] !== "string" || !entry[1] || typeof entry[1].userId !== "string") continue;
        if (users.some((user) => user.id === entry[1].userId)) credentials.set(entry[0], entry[1]);
      }
    }
    console.log(`Restored ${users.length} accounts from local storage.`);
    if (removedSeededProfiles) saveAccountState();
  } catch (error) {
    console.warn("Saved account data could not be loaded.", error);
  }
};
loadAccountState();
var googleOAuthClient = new import_google_auth_library.OAuth2Client();
var emailVerifications = /* @__PURE__ */ new Map();
var passwordResetVerifications = /* @__PURE__ */ new Map();
var passwordSetups = /* @__PURE__ */ new Map();
var smtpPort = Number(process.env.SMTP_PORT || 587);
var isConfiguredSmtpValue = (value) => Boolean(
  value && !/(your-|replace-with|example\.com)/i.test(value)
);
var smtpConfigured = [process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASS, process.env.SMTP_FROM].every(isConfiguredSmtpValue);
var smtpTransport = smtpConfigured ? import_nodemailer.default.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.isInteger(smtpPort) ? smtpPort : 587,
  secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 12e3,
  greetingTimeout: 12e3,
  socketTimeout: 2e4
}) : null;
var hashVerificationCode = (code) => (0, import_node_crypto.createHash)("sha256").update(code).digest("hex");
var createEmailVerification = (email, store = emailVerifications) => {
  const code = (0, import_node_crypto.randomInt)(1e5, 1e6).toString();
  store.set(email, {
    codeHash: hashVerificationCode(code),
    expiresAt: Date.now() + 10 * 60 * 1e3,
    attempts: 0,
    lastSentAt: Date.now()
  });
  return code;
};
var sendVerificationEmail = async (email, code) => {
  if (!smtpTransport || !process.env.SMTP_FROM) {
    throw new Error("SMTP is not configured.");
  }
  const delivery = await smtpTransport.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your KARMYOGI email address",
    text: `Your KARMYOGI verification code is ${code}. It expires in 10 minutes. If you did not create this account, you can ignore this email.`,
    html: `<p>Your KARMYOGI verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes. If you did not create this account, you can ignore this email.</p>`
  });
  if (!delivery.accepted.includes(email)) {
    throw new Error(`Gmail did not accept the recipient (${delivery.rejected.join(", ") || "unknown recipient"}).`);
  }
};
var sendPasswordResetEmail = async (email, code) => {
  if (!smtpTransport || !process.env.SMTP_FROM) {
    throw new Error("SMTP is not configured.");
  }
  const delivery = await smtpTransport.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your KARMYOGI password",
    text: `Your KARMYOGI password reset code is ${code}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`,
    html: `<p>Your KARMYOGI password reset code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.</p>`
  });
  if (!delivery.accepted.includes(email)) {
    throw new Error(`Gmail did not accept the recipient (${delivery.rejected.join(", ") || "unknown recipient"}).`);
  }
};
var recentLoginAccounts = /* @__PURE__ */ new Map();
var keepNewestLoginAccount = (userId, username) => {
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const newestEntry = {
    userId,
    username: normalizedUsername,
    lastUsedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (recentLoginAccounts.size > 0) {
    const oldestKey = [...recentLoginAccounts.keys()].sort((a, b) => {
      const first = recentLoginAccounts.get(a)?.lastUsedAt || "1970-01-01T00:00:00.000Z";
      const second = recentLoginAccounts.get(b)?.lastUsedAt || "1970-01-01T00:00:00.000Z";
      return new Date(first).getTime() - new Date(second).getTime();
    })[0];
    if (oldestKey) recentLoginAccounts.delete(oldestKey);
  }
  recentLoginAccounts.clear();
  recentLoginAccounts.set(normalizedUsername, newestEntry);
};
var leadProposals = [];
var bookings = [
  {
    id: "b-101",
    seekerId: "s-1",
    seekerName: "Priya Verma",
    seekerPhone: "+91 98110 44321",
    seekerAddress: "Tower B, Flat 804, Express Greens, Sector 44",
    seekerCity: "Noida, Uttar Pradesh",
    seekerLocation: { lat: 28.5612, lng: 77.3341 },
    seekerPic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    workerId: "w-1",
    workerName: 'Rameshwar "Ramu" Sharma',
    workerOccupation: "Carpenter",
    workerPhone: "+91 98712 34501",
    workerPic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    workerAddress: "Shop 14, Timber Market, Sector 18",
    workerCity: "Noida, Uttar Pradesh",
    workerLocation: { lat: 28.5708, lng: 77.3261 },
    projectTitle: "Modular Kitchen Cabinets & Hydraulic Hinge Repair",
    projectDescription: "Need 4 overhead kitchen shutters aligned and hydraulic hinges replaced with soft-close Blum hinges.",
    serviceDate: "2026-08-28",
    serviceTime: "10:30 AM",
    agreedRate: 350,
    rateType: "hour",
    status: "accepted",
    mutualDetailsShared: true,
    createdAt: "2026-08-25T14:30:00Z",
    updatedAt: "2026-08-25T15:00:00Z"
  },
  {
    id: "b-102",
    seekerId: "s-2",
    seekerName: 'Vikramaditya "Vikram" Singh',
    seekerPhone: "+91 98711 88990",
    seekerAddress: "Singh Infra Developers, Connaught Place",
    seekerCity: "New Delhi, Delhi",
    seekerLocation: { lat: 28.6328, lng: 77.2197 },
    seekerPic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    workerId: "w-2",
    workerName: "Rajesh Kumar Maurya",
    workerOccupation: "Electrician",
    workerPhone: "+91 98109 87654",
    workerPic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    workerAddress: "B-42, Vikas Marg, Laxmi Nagar",
    workerCity: "East Delhi, Delhi",
    workerLocation: { lat: 28.6304, lng: 77.2773 },
    projectTitle: "Commercial Office 3-Phase Main Panel Wiring",
    projectDescription: "Installation of 63A 4-pole MCB with automatic generator changeover switch for 2000 sq.ft co-working floor.",
    serviceDate: "2026-08-29",
    serviceTime: "09:00 AM",
    agreedRate: 4500,
    rateType: "project",
    status: "accepted",
    mutualDetailsShared: true,
    createdAt: "2026-08-24T11:20:00Z",
    updatedAt: "2026-08-24T12:00:00Z"
  }
];
var messages = [
  {
    id: "m-1",
    bookingId: "b-101",
    senderId: "s-1",
    senderName: "Priya Verma",
    senderRole: "seeker",
    receiverId: "w-1",
    text: "Namaste Ramu ji! I have booked you for our kitchen cabinets on Friday at 10:30 AM.",
    createdAt: "2026-08-25T15:05:00Z",
    isRead: true
  },
  {
    id: "m-2",
    bookingId: "b-101",
    senderId: "w-1",
    senderName: 'Rameshwar "Ramu" Sharma',
    senderRole: "worker",
    receiverId: "s-1",
    text: "Namaste Priya ji! Yes, I saw the booking. I will bring genuine soft-close hydraulic hinges and drill sets with me. Sector 44 is just 2.4 km from my shop.",
    createdAt: "2026-08-25T15:08:00Z",
    isRead: true
  },
  {
    id: "m-3",
    bookingId: "b-101",
    senderId: "s-1",
    senderName: "Priya Verma",
    senderRole: "seeker",
    receiverId: "w-1",
    text: "Great! My full address is Flat 804, Express Greens. The guard will allow you in directly under Karmyogi appointment.",
    createdAt: "2026-08-25T15:10:00Z",
    isRead: true
  }
];
var reviews = [
  {
    id: "r-1",
    bookingId: "b-101",
    workerId: "w-1",
    seekerId: "s-1",
    seekerName: "Priya Verma",
    seekerPic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    seekerCity: "Noida",
    rating: 5,
    comment: "Ramu Sharma is an exceptional master craftsman. Arrived strictly on time, brought all laser alignment tools, and repaired our modular cabinets seamlessly without any mess.",
    serviceName: "Modular Kitchen Carpentry",
    tags: ["Super Punctual", "Clean Workmanship", "Fair Pricing", "Aadhaar Verified"],
    workPhotos: ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80"],
    createdAt: "2026-08-20"
  },
  {
    id: "r-2",
    bookingId: "b-99",
    workerId: "w-2",
    seekerId: "s-2",
    seekerName: 'Vikramaditya "Vikram" Singh',
    seekerPic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    seekerCity: "Delhi",
    rating: 5,
    comment: "Rajesh ji solved a severe MCB tripping issue in our Connaught Place commercial office within 45 minutes that two previous electricians failed to trace. Highly recommended!",
    serviceName: "3-Phase Electrical Panel Fix",
    tags: ["Technical Expert", "Quick Response", "Transparent Rates"],
    createdAt: "2026-08-18"
  },
  {
    id: "r-3",
    bookingId: "b-98",
    workerId: "w-3",
    seekerId: "s-1",
    seekerName: "Priya Verma",
    seekerPic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    seekerCity: "Indirapuram",
    rating: 5,
    comment: "Sunita ma\u2019am taught my daughter Class 10 Trigonometry and Calculus. Her step-by-step methods and patience are world-class. My daughter\u2019s marks went from 68% to 94%!",
    serviceName: "Class 10 CBSE Math Coaching",
    tags: ["Patient Mentor", "Exam Oriented", "Concept Clarity"],
    createdAt: "2026-08-12"
  }
];
var jobLeads = [
  {
    id: "lead-1",
    creatorId: "s-2",
    creatorName: "Vikramaditya Singh (Contractor)",
    creatorPhone: "+91 98711 88990",
    creatorType: "contractor",
    title: "Urgent: 4 Skilled Carpenters needed for 3BHK Penthouse Interior Fitout",
    description: "Looking for verified master carpenters for false ceiling wooden rafters, flush doors fitting, and TV unit lamination. Material already at site.",
    occupation: "Carpenter",
    budget: 65e3,
    budgetType: "fixed",
    location: {
      lat: 28.58,
      lng: 77.34,
      address: "Express View Luxury Towers, Sector 93A",
      city: "Noida"
    },
    urgency: "immediate",
    requiredSkills: ["Modular Furniture", "Flush Doors", "Veneer Finishing"],
    status: "open",
    proposalsCount: 3,
    createdAt: "2026-08-25T18:00:00Z"
  },
  {
    id: "lead-2",
    creatorId: "s-1",
    creatorName: "Priya Verma",
    creatorPhone: "+91 98110 44321",
    creatorType: "homeowner",
    title: "Full House Royal Emulsion Painting & 1 Accent Stucco Wall",
    description: "Need full interior repaint for 1800 sq ft flat before Diwali. Asian Paints Royale with putty base and laser protection.",
    occupation: "Painter",
    budget: 35e3,
    budgetType: "fixed",
    location: {
      lat: 28.5612,
      lng: 77.3341,
      address: "Tower B, Flat 804, Sector 44",
      city: "Noida"
    },
    urgency: "within_week",
    requiredSkills: ["Royale Emulsion", "Stucco Texture", "Waterproofing"],
    status: "open",
    proposalsCount: 2,
    createdAt: "2026-08-26T02:00:00Z"
  },
  {
    id: "lead-3",
    creatorId: "s-2",
    creatorName: "Vikramaditya Singh",
    creatorPhone: "+91 98711 88990",
    creatorType: "contractor",
    title: "Commercial Kitchen Plumbing & High Pressure Water Lines",
    description: "Require certified plumber for 4 commercial sink drainages, grease trap connection, and 1.5 HP pressure booster pump installation.",
    occupation: "Plumber",
    budget: 18e3,
    budgetType: "fixed",
    location: {
      lat: 28.6328,
      lng: 77.2197,
      address: "Middle Circle, Connaught Place",
      city: "New Delhi"
    },
    urgency: "immediate",
    requiredSkills: ["Pressure Pump", "Grease Trap", "CPVC Fitting"],
    status: "open",
    proposalsCount: 4,
    createdAt: "2026-08-25T09:30:00Z"
  }
];
var feedPosts = [
  {
    id: "post-1",
    workerId: "w-1",
    workerName: 'Rameshwar "Ramu" Sharma',
    workerOccupation: "Master Carpenter",
    workerPic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    workerCity: "Noida, UP",
    isVerified: true,
    title: "Hand-Carved Solid Teak Wood Mandir & Modular Kitchen Completed! \u{1FA9A}\u2728",
    content: "Proud to deliver this 8-day custom woodwork project in Sector 50! Handcrafted Indian teak mandir with brass bell insets and soft-close marine-ply kitchen shutters. Hard work and honesty always pays off on Karmyogi.",
    photos: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80"
    ],
    tags: ["CarpentryCraft", "MakeInIndia", "ModularKitchen", "KarmyogiPride"],
    likes: 34,
    likedBy: ["s-1", "s-2", "w-2"],
    comments: [
      {
        id: "c-1",
        authorId: "s-2",
        authorName: "Vikramaditya Singh (Contractor)",
        authorPic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
        text: "Superb craftsmanship Ramu ji! I have a 4BHK villa project starting next week in Greater Noida, will book your team on Karmyogi.",
        createdAt: "2026-08-25T17:00:00Z"
      }
    ],
    createdAt: "2026-08-25T16:00:00Z"
  },
  {
    id: "post-2",
    workerId: "w-6",
    workerName: "Arjun Rathore",
    workerOccupation: "Wall Texture Artist & Painter",
    workerPic: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    workerCity: "South Delhi",
    isVerified: true,
    title: "Transforming a dull drawing room into an Italian Marble Texture masterpiece! \u{1F3A8}",
    content: "Before and After! Done with Asian Paints Royale Play Stucco. 3 layers of microfiber putty, tinted metallic coat, and smooth diamond buffing. No chemical smell!",
    photos: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80"
    ],
    tags: ["InteriorDesign", "WallTexture", "PaintingPros", "KarmyogiNetwork"],
    likes: 47,
    likedBy: ["s-1", "w-1", "w-3"],
    comments: [],
    createdAt: "2026-08-24T19:30:00Z"
  }
];
var notifications = [
  {
    id: "notif-1",
    userId: "w-1",
    type: "booking_request",
    title: "New Booking Request Received! \u{1F528}",
    description: 'Priya Verma requested a booking for "Modular Kitchen Cabinets" on 28 Aug.',
    linkId: "b-101",
    isRead: false,
    createdAt: "2026-08-25T14:30:00Z"
  },
  {
    id: "notif-2",
    userId: "s-1",
    type: "booking_accepted",
    title: "Booking Confirmed by Ramu Sharma! \u2705",
    description: "Ramu Sharma accepted your request. Real-time chat and direct contact details are now unlocked.",
    linkId: "b-101",
    isRead: true,
    createdAt: "2026-08-25T15:00:00Z"
  }
];
var registeredUsers = new Map(users.map((user) => [user.id, user]));
bookings.splice(
  0,
  bookings.length,
  ...bookings.filter(
    (booking) => registeredUsers.get(booking.seekerId)?.role === "seeker" && registeredUsers.get(booking.workerId)?.role === "worker"
  )
);
var registeredBookingIds = new Set(bookings.map((booking) => booking.id));
messages.splice(
  0,
  messages.length,
  ...messages.filter(
    (message) => registeredBookingIds.has(message.bookingId) && registeredUsers.has(message.senderId) && registeredUsers.has(message.receiverId)
  )
);
reviews.splice(
  0,
  reviews.length,
  ...reviews.filter(
    (review) => registeredUsers.get(review.workerId)?.role === "worker" && registeredUsers.get(review.seekerId)?.role === "seeker"
  )
);
jobLeads.splice(0, jobLeads.length, ...jobLeads.filter((lead) => registeredUsers.has(lead.creatorId)));
feedPosts.splice(
  0,
  feedPosts.length,
  ...feedPosts.filter((post) => registeredUsers.get(post.workerId)?.role === "worker")
);
notifications.splice(
  0,
  notifications.length,
  ...notifications.filter((notification) => registeredUsers.has(notification.userId))
);
var notificationSequence = 0;
var notificationId = () => `notif-${Date.now()}-${++notificationSequence}`;
async function startServer() {
  const app = (0, import_express.default)();
  const requestedPort = Number(process.env.PORT);
  const PORT = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 3e3;
  app.use(import_express.default.json({ limit: "15mb" }));
  let ai = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new import_genai.GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    } catch (e) {
      console.warn("Gemini initialization skipped or failed:", e);
    }
  }
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", platform: "Karmyogi Platform", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/location/reverse", async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "Valid latitude and longitude are required." });
    }
    const cacheKey = reverseLocationCacheKey(lat, lng);
    const cached = reverseLocationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);
    try {
      const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
      const hasGoogleKey = Boolean(mapsApiKey && !/^(your-|replace-with|example)/i.test(mapsApiKey));
      let googleLocation = null;
      if (hasGoogleKey) {
        try {
          googleLocation = await getGoogleLocation(lat, lng, mapsApiKey);
        } catch (error) {
          console.warn("Google Maps reverse geocoding request failed:", error);
        }
      }
      const location = googleLocation || await getOpenStreetMapLocation(lat, lng);
      if (!location) return res.status(502).json({ error: "No address could be found for this location." });
      if (reverseLocationCache.size >= 500) reverseLocationCache.delete(reverseLocationCache.keys().next().value);
      reverseLocationCache.set(cacheKey, { value: location, expiresAt: Date.now() + 5 * 6e4 });
      res.json(location);
    } catch (error) {
      console.warn("Reverse geocoding request failed:", error);
      res.status(502).json({ error: "Location lookup is temporarily unavailable. Your GPS coordinates were captured successfully." });
    }
  });
  app.patch("/api/users/:userId/location", (req, res) => {
    const { userId } = req.params;
    const { lat, lng, city, accuracy } = req.body;
    const latitude = Number(lat);
    const longitude = Number(lng);
    const user = users.find((item) => item.id === userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    const locationAccuracy = Number(accuracy);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || !Number.isFinite(locationAccuracy) || locationAccuracy <= 0 || locationAccuracy > MAX_LOCATION_ACCURACY_METERS) {
      return res.status(400).json({ error: `A fresh location accurate to within ${MAX_LOCATION_ACCURACY_METERS} metres is required.` });
    }
    user.location = { lat: latitude, lng: longitude };
    if (typeof city === "string" && city.trim()) user.city = city.trim().slice(0, 120);
    if (!saveAccountState()) return res.status(500).json({ error: "Your location was captured but could not be saved. Please try again." });
    res.json({ success: true, user });
  });
  app.patch("/api/users/:userId/profile", (req, res) => {
    const user = users.find((item) => item.id === req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    const name = String(req.body?.name || "").trim();
    const username = String(req.body?.username || "").trim().toLowerCase();
    const phone = String(req.body?.phone || "").trim();
    const address = String(req.body?.address || "").trim();
    const city = String(req.body?.city || "").trim();
    const password = req.body?.password;
    if (!name || !username || !phone || !address || !city) {
      return res.status(400).json({ error: "Name, username, phone, address, and city are required." });
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return res.status(400).json({ error: "Username must contain 3 to 30 letters, numbers, dots, underscores, or hyphens." });
    }
    const existingCredential = credentials.get(username);
    if (existingCredential && existingCredential.userId !== user.id) {
      return res.status(409).json({ error: "That username is already registered." });
    }
    if (password !== void 0 && password !== "" && String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    const age = Number(req.body?.age);
    if (!Number.isInteger(age) || age < 18 || age > 120) {
      return res.status(400).json({ error: "Age must be a whole number from 18 to 120." });
    }
    const location = req.body?.location;
    const latitude = Number(location?.lat);
    const longitude = Number(location?.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "A valid profile location is required." });
    }
    user.name = name.slice(0, 120);
    user.username = username;
    user.age = age;
    user.phone = phone.slice(0, 40);
    user.address = address.slice(0, 300);
    user.city = city.slice(0, 120);
    user.pincode = String(req.body?.pincode || "").trim().slice(0, 20);
    user.location = { lat: latitude, lng: longitude };
    if (typeof req.body?.profilePic === "string" && req.body.profilePic.length <= 4e6) {
      user.profilePic = req.body.profilePic;
    }
    if (user.role === "worker") {
      const workerFields = req.body;
      if (typeof workerFields.occupation === "string" && workerFields.occupation.trim()) {
        user.occupation = workerFields.occupation.trim();
      }
      if (Array.isArray(workerFields.skills)) {
        user.skills = workerFields.skills.filter((skill) => typeof skill === "string").map((skill) => skill.trim().slice(0, 80)).filter(Boolean).slice(0, 20);
      }
      for (const field of ["ratePerHour", "ratePerMonth", "experienceYears"]) {
        if (workerFields[field] !== void 0) {
          const value = Number(workerFields[field]);
          if (!Number.isFinite(value) || value < 0) {
            return res.status(400).json({ error: `Invalid ${field}.` });
          }
          user[field] = value;
        }
      }
      if (typeof workerFields.bio === "string") user.bio = workerFields.bio.trim().slice(0, 2e3);
    }
    const savedCredential = [...credentials.values()].find((credential) => credential.userId === user.id) || { userId: user.id };
    if (password) savedCredential.password = String(password);
    for (const [key, credential] of credentials) {
      if (credential.userId === user.id) credentials.delete(key);
    }
    credentials.set(username, savedCredential);
    credentials.set(user.email.toLowerCase(), savedCredential);
    if (!saveAccountState()) return res.status(500).json({ error: "Profile changes could not be saved. Please try again." });
    res.json({ success: true, user });
  });
  app.get("/api/auth/users", (req, res) => {
    const sanitized = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username || u.email,
      email: u.email,
      role: u.role,
      occupation: u.occupation,
      phone: u.phone,
      city: u.city,
      profilePic: u.profilePic,
      isVerified: u.isVerified,
      rating: u.rating,
      ratePerHour: u.ratePerHour
    }));
    res.json(sanitized);
  });
  app.get("/api/auth/recent-login", (req, res) => {
    const newest = [...recentLoginAccounts.values()].sort(
      (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    )[0];
    res.json({ latest: newest || null, totalTracked: recentLoginAccounts.size });
  });
  app.get("/api/auth/google-config", (req, res) => {
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID || "" });
  });
  app.post("/api/auth/google", async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const credential = String(req.body?.credential || "");
    if (!clientId || !credential) return res.status(400).json({ error: "Google sign-in is unavailable." });
    try {
      const ticket = await googleOAuthClient.verifyIdToken({ idToken: credential, audience: clientId });
      const profile = ticket.getPayload();
      const email = profile?.email?.toLowerCase();
      if (!email || !profile.email_verified) return res.status(401).json({ error: "Google could not verify this email address." });
      const existing = credentials.get(email);
      let user = existing && users.find((item) => item.id === existing.userId);
      if (!user) {
        const baseUsername = (email.split("@")[0].replace(/[^a-z0-9._-]/g, "").slice(0, 24) || "googleuser").toLowerCase();
        let username = baseUsername;
        let suffix = 1;
        while (credentials.has(username)) username = `${baseUsername.slice(0, 24)}${suffix++}`;
        user = {
          id: `google-${Date.now()}`,
          name: profile.name || email.split("@")[0],
          username,
          email,
          role: "seeker",
          age: 18,
          phone: "",
          aadhaarNumber: "Not provided",
          address: "",
          city: "",
          pincode: "",
          location: { lat: 0, lng: 0 },
          profilePic: profile.picture || "",
          isVerified: true,
          emailVerified: true,
          verifiedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          encryptionBadge: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        users.push(user);
        const newCredential = { userId: user.id };
        credentials.set(email, newCredential);
        credentials.set(username, newCredential);
      }
      if (!saveAccountState()) return res.status(500).json({ error: "Your Google account could not be saved. Please try again." });
      keepNewestLoginAccount(user.id, user.username || user.email);
      res.json({ success: true, user });
    } catch {
      res.status(401).json({ error: "Google sign-in verification failed." });
    }
  });
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const identifier = String(username || "").trim().toLowerCase();
    const account = credentials.get(identifier);
    const found = account && users.find((u) => u.id === account.userId);
    if (!account || !found) return res.status(401).json({ error: "Invalid username or password." });
    if (found.emailVerified === false) {
      return res.status(403).json({
        error: "Verify your email address before signing in.",
        requiresEmailVerification: true,
        email: found.email
      });
    }
    if (!account.password || account.password !== password) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    keepNewestLoginAccount(found.id, found.username || found.email);
    res.json({ success: true, user: found });
  });
  app.get("/api/auth/email-verification-status", (req, res) => {
    res.json({ available: Boolean(smtpTransport) });
  });
  app.post("/api/auth/register", async (req, res) => {
    const {
      name,
      username,
      email,
      role,
      age,
      phone,
      aadhaarNumber,
      address,
      city,
      pincode,
      lat,
      lng,
      accuracy,
      capturedAt,
      profilePic,
      idProofDocument,
      idProofType,
      backgroundCert,
      occupation,
      skills,
      ratePerHour,
      ratePerMonth,
      rateUnit,
      experienceYears,
      bio
    } = req.body;
    if (!name || !username || !email || !phone || !aadhaarNumber || !role) {
      return res.status(400).json({ error: "Name, username, email, phone, Aadhaar, and role are required." });
    }
    if (!["worker", "seeker"].includes(role)) {
      return res.status(400).json({ error: "Choose a valid role." });
    }
    const latitude = Number(lat);
    const longitude = Number(lng);
    const locationAccuracy = Number(accuracy);
    const locationCapturedAt = Number(capturedAt);
    const hasFreshLocation = Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && Number.isFinite(locationAccuracy) && locationAccuracy > 0 && locationAccuracy <= MAX_LOCATION_ACCURACY_METERS && Number.isFinite(locationCapturedAt) && Math.abs(Date.now() - locationCapturedAt) <= MAX_LOCATION_FIX_AGE_MS;
    const normalizedUsername = String(username).trim().toLowerCase();
    const suppliedEmail = String(email || "").trim().toLowerCase();
    const normalizedEmail = suppliedEmail;
    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
      return res.status(400).json({ error: "Username format is invalid." });
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Email format is invalid." });
    }
    const existingEmailCredential = credentials.get(normalizedEmail);
    const existingUnverifiedUser = existingEmailCredential && users.find((user) => user.id === existingEmailCredential.userId);
    if (existingUnverifiedUser && existingUnverifiedUser.emailVerified === false) {
      if (!smtpTransport) return res.status(503).json({ error: "Email verification is unavailable. Configure SMTP settings and try again." });
      const currentVerification = emailVerifications.get(normalizedEmail);
      if (currentVerification && Date.now() - currentVerification.lastSentAt < 6e4) {
        return res.status(429).json({ error: "Please wait one minute before requesting another code." });
      }
      const verificationCode2 = createEmailVerification(normalizedEmail);
      try {
        await sendVerificationEmail(normalizedEmail, verificationCode2);
        return res.json({ success: true, requiresEmailVerification: true, email: normalizedEmail, username: existingUnverifiedUser.username || normalizedUsername });
      } catch (error) {
        console.error("Verification email resend failed during registration:", error);
        emailVerifications.delete(normalizedEmail);
        return res.status(502).json({ error: "Unable to send the verification email. Check your SMTP settings and try again." });
      }
    }
    if (credentials.has(normalizedUsername) || credentials.has(normalizedEmail)) {
      return res.status(409).json({ error: "That username or email is already registered." });
    }
    if (!smtpTransport) {
      return res.status(503).json({ error: "Email verification is unavailable. Configure SMTP settings and try again." });
    }
    const cleanAadhaar = String(aadhaarNumber).replace(/\s+/g, "");
    const maskedAadhaar = cleanAadhaar.length >= 4 ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : `XXXX-XXXX-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const newUser = {
      id: `u-${Date.now()}`,
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      role,
      age: Number(age) || 28,
      phone: phone.startsWith("+91") ? phone : `+91 ${phone}`,
      aadhaarNumber: maskedAadhaar,
      address: address || "Main City Area",
      city: city || "New Delhi",
      pincode: pincode || "110001",
      location: {
        // 0,0 explicitly represents “not shared yet”; it can be updated
        // from the profile or location button after registration.
        lat: hasFreshLocation ? latitude : 0,
        lng: hasFreshLocation ? longitude : 0
      },
      profilePic: profilePic || (role === "worker" ? "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"),
      idProofDocument: idProofDocument || "Govt_ID_Verification_Token.pdf",
      idProofType: idProofType || "Aadhaar Card",
      backgroundCert: backgroundCert || "Background_Check_Clearance.pdf",
      isVerified: true,
      emailVerified: false,
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      encryptionBadge: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...role === "worker" && {
        occupation: occupation || "Carpenter",
        skills: Array.isArray(skills) ? skills : skills ? String(skills).split(",").map((s) => s.trim()) : ["Skilled Craftsmanship"],
        ratePerHour: Number(ratePerHour) || 300,
        ratePerMonth: Number(ratePerMonth) || 25e3,
        rateUnit: rateUnit || "hour",
        experienceYears: Number(experienceYears) || 5,
        bio: bio || `Certified ${occupation} with strong attention to quality and client satisfaction.`,
        isAvailable: true,
        rating: 5,
        reviewCount: 0,
        completedJobsCount: 0,
        portfolio: []
      }
    };
    users.push(newUser);
    const newCredential = { userId: newUser.id };
    credentials.set(normalizedUsername, newCredential);
    credentials.set(normalizedEmail, newCredential);
    const verificationCode = createEmailVerification(normalizedEmail);
    try {
      await sendVerificationEmail(normalizedEmail, verificationCode);
    } catch (error) {
      console.error("Verification email delivery failed:", error);
      users.splice(users.indexOf(newUser), 1);
      credentials.delete(normalizedUsername);
      credentials.delete(normalizedEmail);
      emailVerifications.delete(normalizedEmail);
      return res.status(502).json({ error: "Unable to send the verification email. Check your SMTP settings and try again." });
    }
    notifications.push({
      id: `notif-${Date.now()}`,
      userId: newUser.id,
      type: "review_received",
      title: "Welcome to KARMYOGI! \u{1F1EE}\u{1F1F3}",
      description: "Your Aadhaar and background verification is completed. You are now live for nearby hires.",
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (!saveAccountState()) {
      return res.status(500).json({ error: "Your registration could not be saved. Please try again." });
    }
    res.status(201).json({
      success: true,
      requiresEmailVerification: true,
      email: normalizedEmail,
      username: normalizedUsername
    });
  });
  app.post("/api/auth/verify-email", (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const verification = emailVerifications.get(email);
    const user = users.find((item) => item.email.toLowerCase() === email);
    if (!user || !verification) return res.status(400).json({ error: "Request a new verification code and try again." });
    if (verification.expiresAt < Date.now()) {
      emailVerifications.delete(email);
      return res.status(400).json({ error: "This verification code has expired. Request a new one." });
    }
    if (!/^\d{6}$/.test(code) || hashVerificationCode(code) !== verification.codeHash) {
      verification.attempts += 1;
      if (verification.attempts >= 5) emailVerifications.delete(email);
      return res.status(400).json({ error: "That verification code is invalid." });
    }
    user.emailVerified = true;
    emailVerifications.delete(email);
    if (!saveAccountState()) return res.status(500).json({ error: "Email was verified but the account could not be saved. Please try again." });
    const passwordSetupToken = (0, import_node_crypto.randomBytes)(32).toString("hex");
    passwordSetups.set(email, {
      userId: user.id,
      tokenHash: hashVerificationCode(passwordSetupToken),
      expiresAt: Date.now() + 10 * 60 * 1e3
    });
    res.json({ success: true, user, passwordSetupToken });
  });
  app.post("/api/auth/password-setup", (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");
    if (password.length < 6) return res.status(400).json({ error: "Your password must be at least 6 characters." });
    const setup = passwordSetups.get(email);
    const user = users.find((item) => item.email.toLowerCase() === email);
    if (!setup || !user || setup.userId !== user.id || setup.expiresAt < Date.now() || hashVerificationCode(token) !== setup.tokenHash) {
      passwordSetups.delete(email);
      return res.status(400).json({ error: "Your password setup session has expired. Register again or verify your email again." });
    }
    const credential = { userId: user.id, password };
    for (const [key, item] of credentials) {
      if (item.userId === user.id) credentials.delete(key);
    }
    credentials.set(email, credential);
    if (user.username) credentials.set(user.username.toLowerCase(), credential);
    if (!saveAccountState()) return res.status(500).json({ error: "Your password could not be saved. Please try again." });
    passwordSetups.delete(email);
    keepNewestLoginAccount(user.id, user.username || user.email);
    res.json({ success: true, user });
  });
  app.post("/api/auth/resend-verification", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const user = users.find((item) => item.email.toLowerCase() === email);
    if (!user || user.emailVerified) return res.status(400).json({ error: "This account does not need email verification." });
    if (!smtpTransport) return res.status(503).json({ error: "Email verification is unavailable. Configure SMTP settings and try again." });
    const currentVerification = emailVerifications.get(email);
    if (currentVerification && Date.now() - currentVerification.lastSentAt < 6e4) {
      return res.status(429).json({ error: "Please wait one minute before requesting another code." });
    }
    const verificationCode = createEmailVerification(email);
    try {
      await sendVerificationEmail(email, verificationCode);
      res.json({ success: true });
    } catch (error) {
      console.error("Verification email resend failed:", error);
      emailVerifications.delete(email);
      res.status(502).json({ error: "Unable to send the verification email. Check your SMTP settings and try again." });
    }
  });
  app.post("/api/auth/password-reset/request", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter the email address registered with your account." });
    if (!smtpTransport) return res.status(503).json({ error: "Password reset email is unavailable. Configure SMTP settings and try again." });
    const user = users.find((item) => item.email.toLowerCase() === email);
    if (!user) return res.json({ success: true });
    const currentReset = passwordResetVerifications.get(email);
    if (currentReset && Date.now() - currentReset.lastSentAt < 6e4) {
      return res.status(429).json({ error: "Please wait one minute before requesting another code." });
    }
    const code = createEmailVerification(email, passwordResetVerifications);
    try {
      await sendPasswordResetEmail(email, code);
      res.json({ success: true });
    } catch (error) {
      console.error("Password reset email delivery failed:", error);
      passwordResetVerifications.delete(email);
      res.status(502).json({ error: "Unable to send the password-reset email. Check your SMTP settings and try again." });
    }
  });
  app.post("/api/auth/password-reset/confirm", (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const password = String(req.body?.password || "");
    if (password.length < 6) return res.status(400).json({ error: "Your new password must be at least 6 characters." });
    const verification = passwordResetVerifications.get(email);
    const user = users.find((item) => item.email.toLowerCase() === email);
    if (!user || !verification) return res.status(400).json({ error: "Request a new password-reset code and try again." });
    if (verification.expiresAt < Date.now()) {
      passwordResetVerifications.delete(email);
      return res.status(400).json({ error: "This password-reset code has expired. Request a new one." });
    }
    if (!/^\d{6}$/.test(code) || hashVerificationCode(code) !== verification.codeHash) {
      verification.attempts += 1;
      if (verification.attempts >= 5) passwordResetVerifications.delete(email);
      return res.status(400).json({ error: "That password-reset code is invalid." });
    }
    const credential = credentials.get(email) || [...credentials.values()].find((item) => item.userId === user.id) || { userId: user.id };
    credential.password = password;
    for (const [key, item] of credentials) {
      if (item.userId === user.id) credentials.delete(key);
    }
    credentials.set(email, credential);
    if (user.username) credentials.set(user.username.toLowerCase(), credential);
    if (!saveAccountState()) return res.status(500).json({ error: "Your new password could not be saved. Please try again." });
    passwordResetVerifications.delete(email);
    res.json({ success: true });
  });
  app.get("/api/workers", (req, res) => {
    const {
      search,
      query,
      occupation,
      lat,
      lng,
      sortBy = "distance",
      minRating,
      maxRate,
      onlyVerified
    } = req.query;
    const userLat = Number(lat);
    const userLng = Number(lng);
    if (!Number.isFinite(userLat) || !Number.isFinite(userLng) || userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
      return res.status(400).json({ error: "A valid live location is required to find nearby workers." });
    }
    let workerList = users.filter((u) => u.role === "worker");
    if (occupation && occupation !== "All") {
      workerList = workerList.filter(
        (w) => w.occupation?.toLowerCase() === String(occupation).toLowerCase()
      );
    }
    const searchQuery = String(search || query || "").trim().toLowerCase();
    if (searchQuery) {
      workerList = workerList.filter(
        (w) => w.name.toLowerCase().includes(searchQuery) || w.occupation?.toLowerCase().includes(searchQuery) || w.city.toLowerCase().includes(searchQuery) || w.skills?.some((s) => s.toLowerCase().includes(searchQuery))
      );
    }
    if (minRating) {
      workerList = workerList.filter((w) => (w.rating || 0) >= Number(minRating));
    }
    if (maxRate) {
      workerList = workerList.filter((w) => (w.ratePerHour || 0) <= Number(maxRate));
    }
    if (onlyVerified === "true") {
      workerList = workerList.filter((w) => w.isVerified);
    }
    const enrichedWorkers = workerList.map((w) => {
      const dist = calculateDistanceKm(userLat, userLng, w.location.lat, w.location.lng);
      return {
        ...w,
        distanceKm: dist
      };
    });
    enrichedWorkers.sort((a, b) => {
      if (sortBy === "distance") {
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      }
      if (sortBy === "rate_asc") {
        return (a.ratePerHour || 0) - (b.ratePerHour || 0);
      }
      if (sortBy === "rate_desc") {
        return (b.ratePerHour || 0) - (a.ratePerHour || 0);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === "experience") {
        return (b.experienceYears || 0) - (a.experienceYears || 0);
      }
      return 0;
    });
    res.json(enrichedWorkers);
  });
  app.get("/api/workers/:id", (req, res) => {
    const { id } = req.params;
    const { lat, lng } = req.query;
    const worker = users.find((u) => u.id === id && u.role === "worker");
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }
    let dist = void 0;
    if (lat && lng) {
      dist = calculateDistanceKm(Number(lat), Number(lng), worker.location.lat, worker.location.lng);
    }
    const workerReviews = reviews.filter((r) => r.workerId === id);
    res.json({
      ...worker,
      distanceKm: dist,
      reviews: workerReviews
    });
  });
  app.post("/api/bookings/create", (req, res) => {
    const {
      seekerId,
      workerId,
      projectTitle,
      projectDescription,
      serviceDate,
      serviceTime,
      agreedRate,
      rateType
    } = req.body;
    const seeker = users.find((u) => u.id === seekerId);
    const worker = users.find((u) => u.id === workerId);
    if (!seeker || !worker) {
      return res.status(404).json({ error: "Invalid seeker or worker ID" });
    }
    if (seeker.role !== "seeker" || worker.role !== "worker" || seeker.id === worker.id) {
      return res.status(400).json({ error: "A service seeker can only book a registered worker." });
    }
    if (!String(projectTitle || "").trim() || !String(projectDescription || "").trim()) {
      return res.status(400).json({ error: "Project title and description are required." });
    }
    const numericRate = Number(agreedRate);
    if (!Number.isFinite(numericRate) || numericRate <= 0 || !["hour", "month", "project"].includes(rateType)) {
      return res.status(400).json({ error: "Provide a valid rate and billing basis." });
    }
    const newBooking = {
      id: `b-${Date.now()}`,
      seekerId: seeker.id,
      seekerName: seeker.name,
      seekerPhone: seeker.phone,
      seekerAddress: seeker.address,
      seekerCity: seeker.city,
      seekerLocation: seeker.location,
      seekerPic: seeker.profilePic,
      workerId: worker.id,
      workerName: worker.name,
      workerOccupation: worker.occupation || "Professional",
      workerPhone: worker.phone,
      workerPic: worker.profilePic,
      workerAddress: worker.address,
      workerCity: worker.city,
      workerLocation: worker.location,
      projectTitle: projectTitle || "Service Request",
      projectDescription: projectDescription || "Work requirement",
      serviceDate: serviceDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      serviceTime: serviceTime || "10:00 AM",
      agreedRate: numericRate,
      rateType,
      status: "pending",
      mutualDetailsShared: true,
      // Seeker and worker details exchanged on booking
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    bookings.unshift(newBooking);
    notifications.unshift({
      id: notificationId(),
      userId: worker.id,
      type: "booking_request",
      title: `New Hire Request from ${seeker.name}! \u{1F514}`,
      description: `Project: "${projectTitle || "Service Request"}" on ${serviceDate || "Upcoming"}. Rate: \u20B9${newBooking.agreedRate}/${newBooking.rateType}.`,
      linkId: newBooking.id,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true, booking: newBooking });
  });
  app.get("/api/bookings/user/:userId", (req, res) => {
    const { userId } = req.params;
    const userBookings = bookings.filter((b) => b.seekerId === userId || b.workerId === userId);
    res.json(userBookings);
  });
  const updateBookingStatusHandler = (req, res) => {
    const { id } = req.params;
    const { status, actorId } = req.body;
    const bookingIndex = bookings.findIndex((b) => b.id === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const currentBooking = bookings[bookingIndex];
    const transitions = {
      pending: ["accepted", "declined", "cancelled"],
      accepted: ["in_progress", "completed", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      declined: [],
      cancelled: []
    };
    if (!transitions[currentBooking.status].includes(status)) {
      return res.status(400).json({ error: "This booking cannot be moved to that status." });
    }
    if (!actorId) {
      return res.status(400).json({ error: "The user updating this booking is required." });
    }
    if (actorId !== currentBooking.workerId && actorId !== currentBooking.seekerId) {
      return res.status(403).json({ error: "Only the assigned worker or client can update this booking." });
    }
    if ((status === "accepted" || status === "declined") && actorId !== currentBooking.workerId) {
      return res.status(403).json({ error: "Only the assigned worker can accept or decline this booking." });
    }
    currentBooking.status = status;
    currentBooking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (status === "accepted") {
      notifications.unshift({
        id: notificationId(),
        userId: currentBooking.seekerId,
        type: "booking_accepted",
        title: `Hire Confirmed by ${currentBooking.workerName}! \u{1F389}`,
        description: `Your booking for "${currentBooking.projectTitle}" is accepted. Real-time chat & contact numbers are fully unlocked.`,
        linkId: currentBooking.id,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else if (status === "declined" || status === "cancelled") {
      notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: currentBooking.seekerId,
        type: "booking_declined",
        title: `Booking Update from ${currentBooking.workerName}`,
        description: `Booking was ${status}. You can explore other nearby workers on Karmyogi.`,
        linkId: currentBooking.id,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else if (status === "completed") {
      notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: currentBooking.seekerId,
        type: "review_received",
        title: `Work Completed: ${currentBooking.projectTitle}! \u2B50`,
        description: `Please leave a star review and feedback for ${currentBooking.workerName}.`,
        linkId: currentBooking.id,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: currentBooking.workerId,
        type: "review_received",
        title: `Job completion recorded for ${currentBooking.projectTitle}! \u2705`,
        description: `The client has marked this job as complete. Your portfolio has been updated with the new completed work entry.`,
        linkId: currentBooking.id,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json({ success: true, booking: currentBooking });
  };
  app.post("/api/bookings/:id/respond", updateBookingStatusHandler);
  app.patch("/api/bookings/:id/respond", updateBookingStatusHandler);
  app.post("/api/bookings/:id/status", updateBookingStatusHandler);
  app.patch("/api/bookings/:id/status", updateBookingStatusHandler);
  app.get("/api/messages/thread", (req, res) => {
    const { userId1, userId2, bookingId } = req.query;
    let targetBooking;
    if (bookingId) {
      targetBooking = bookings.find((b) => b.id === String(bookingId));
    } else if (userId1 && userId2) {
      const pairBookings = bookings.filter(
        (b) => b.seekerId === userId1 && b.workerId === userId2 || b.seekerId === userId2 && b.workerId === userId1
      );
      targetBooking = pairBookings.filter((b) => ["accepted", "in_progress", "completed"].includes(b.status)).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] || pairBookings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    }
    if (!targetBooking) {
      return res.json({
        isChatEnabled: false,
        reason: "TALK_LOCKED: You must first select and book this worker to unlock real-time messaging.",
        booking: null,
        messages: []
      });
    }
    if (!["accepted", "in_progress", "completed"].includes(targetBooking.status)) {
      return res.json({
        isChatEnabled: false,
        reason: targetBooking.status === "pending" ? "Messaging unlocks after the worker accepts this booking." : `Chat is closed because the booking was ${targetBooking.status}.`,
        booking: targetBooking,
        messages: messages.filter((m) => m.bookingId === targetBooking?.id)
      });
    }
    const threadMessages = messages.filter((m) => m.bookingId === targetBooking?.id);
    res.json({
      isChatEnabled: true,
      booking: targetBooking,
      messages: threadMessages
    });
  });
  app.post("/api/messages/send", (req, res) => {
    const { bookingId, senderId, receiverId, text, attachmentUrl, location } = req.body;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || !["accepted", "in_progress", "completed"].includes(booking.status)) {
      return res.status(403).json({ error: "Chat is locked until the booking has been accepted." });
    }
    const sender = users.find((u) => u.id === senderId);
    const receiver = users.find((u) => u.id === receiverId);
    if (!sender || !receiver) {
      return res.status(404).json({ error: "Sender not found" });
    }
    const participants = [booking.seekerId, booking.workerId];
    if (!participants.includes(senderId) || !participants.includes(receiverId) || senderId === receiverId) {
      return res.status(403).json({ error: "Messages can only be sent between the booking participants." });
    }
    if (!String(text || "").trim() && !attachmentUrl) {
      return res.status(400).json({ error: "A message or attachment is required." });
    }
    const sharedLocation = location && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng)) && Number(location.lat) >= -90 && Number(location.lat) <= 90 && Number(location.lng) >= -180 && Number(location.lng) <= 180 && Number.isFinite(Number(location.accuracy)) && Number(location.accuracy) > 0 && Number(location.accuracy) <= MAX_LOCATION_ACCURACY_METERS ? {
      lat: Number(location.lat),
      lng: Number(location.lng),
      accuracy: Number.isFinite(Number(location.accuracy)) ? Number(location.accuracy) : void 0,
      address: typeof location.address === "string" ? location.address.slice(0, 300) : void 0,
      sharedAt: (/* @__PURE__ */ new Date()).toISOString()
    } : void 0;
    const newMsg = {
      id: `m-${Date.now()}`,
      bookingId,
      senderId,
      senderName: sender.name,
      senderRole: sender.role,
      receiverId,
      text: String(text || "").trim(),
      location: sharedLocation,
      attachmentUrl,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    };
    messages.push(newMsg);
    notifications.unshift({
      id: notificationId(),
      userId: receiverId,
      type: "new_message",
      title: `New Message from ${sender.name} \u{1F4AC}`,
      description: text ? text.length > 50 ? `${text.slice(0, 47)}...` : text : "Sent an attachment",
      linkId: bookingId,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true, message: newMsg });
  });
  app.get("/api/leads", (req, res) => {
    const { occupation, city, contractorOnly } = req.query;
    let list = [...jobLeads];
    if (occupation && occupation !== "All") {
      list = list.filter((l) => l.occupation.toLowerCase() === String(occupation).toLowerCase());
    }
    if (city) {
      list = list.filter((l) => l.location.city.toLowerCase().includes(String(city).toLowerCase()));
    }
    if (contractorOnly === "true") {
      list = list.filter((l) => l.creatorType === "contractor");
    }
    res.json(list);
  });
  app.get("/api/leads/proposals/:leadId", (req, res) => {
    const { leadId } = req.params;
    res.json(leadProposals.filter((proposal) => proposal.leadId === leadId));
  });
  app.post("/api/leads/:leadId/propose", (req, res) => {
    const { leadId } = req.params;
    const { workerId, message } = req.body;
    const lead = jobLeads.find((item) => item.id === leadId);
    const worker = users.find((item) => item.id === workerId && item.role === "worker");
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    if (lead.creatorId === worker.id) return res.status(400).json({ error: "You cannot propose to your own lead." });
    if (lead.status !== "open") return res.status(400).json({ error: "This lead is no longer accepting proposals." });
    if (leadProposals.some((item) => item.leadId === leadId && item.workerId === worker.id)) {
      return res.status(409).json({ error: "You have already sent a proposal for this lead." });
    }
    const newProposal = {
      id: `lead-proposal-${Date.now()}`,
      leadId,
      workerId: worker.id,
      workerName: worker.name,
      workerOccupation: worker.occupation || "Professional",
      message: String(message || "I am interested in this project and can deliver quality work.").trim(),
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    leadProposals.unshift(newProposal);
    lead.proposalsCount = (lead.proposalsCount || 0) + 1;
    notifications.unshift({
      id: notificationId(),
      userId: lead.creatorId,
      type: "lead_proposal_sent",
      title: `New work proposal for ${lead.title}`,
      description: `${worker.name} sent a proposal for your project in ${lead.location.city}.`,
      linkId: lead.id,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true, proposal: newProposal });
  });
  app.patch("/api/leads/:leadId/accept", (req, res) => {
    const { leadId } = req.params;
    const { actorId, proposalId, workerId } = req.body;
    const lead = jobLeads.find((item) => item.id === leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (!actorId || actorId !== lead.creatorId) {
      return res.status(403).json({ error: "Only the lead creator can accept a proposal." });
    }
    const proposal = leadProposals.find((item) => item.leadId === leadId && item.id === proposalId);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });
    if (workerId && proposal.workerId !== workerId) {
      return res.status(400).json({ error: "The selected worker does not match this proposal." });
    }
    if (proposal.status !== "pending" || lead.status !== "open") {
      return res.status(400).json({ error: "This proposal is no longer available." });
    }
    proposal.status = "accepted";
    lead.status = "matched";
    lead.acceptedWorkerId = proposal.workerId;
    leadProposals.filter((item) => item.leadId === leadId && item.id !== proposal.id && item.status === "pending").forEach((item) => {
      item.status = "rejected";
    });
    notifications.unshift({
      id: notificationId(),
      userId: proposal.workerId,
      type: "lead_accepted",
      title: `${lead.creatorName} accepted your proposal`,
      description: `Your work proposal for "${lead.title}" was accepted. The contractor can now contact you for the project in ${lead.location.city}.`,
      linkId: lead.id,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    notifications.unshift({
      id: notificationId(),
      userId: lead.creatorId,
      type: "lead_accepted",
      title: `Worker ${proposal.workerName} accepted for ${lead.title}`,
      description: `Your project is now matched with ${proposal.workerName}. You can contact the worker to coordinate the work.`,
      linkId: lead.id,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true, lead, proposal });
  });
  app.post("/api/leads/create", (req, res) => {
    const {
      creatorId,
      title,
      description,
      occupation,
      budget,
      budgetType,
      address,
      city,
      lat,
      lng,
      urgency,
      requiredSkills
    } = req.body;
    const creator = users.find((u) => u.id === creatorId);
    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }
    const newLead = {
      id: `lead-${Date.now()}`,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorPhone: creator.phone,
      creatorType: creator.id === "s-2" ? "contractor" : "homeowner",
      title,
      description,
      occupation,
      budget: Number(budget) || 1e4,
      budgetType: budgetType || "fixed",
      location: {
        lat: Number(lat) || creator.location.lat,
        lng: Number(lng) || creator.location.lng,
        address: address || creator.address,
        city: city || creator.city
      },
      urgency: urgency || "immediate",
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : String(requiredSkills || "").split(",").map((s) => s.trim()).filter(Boolean),
      status: "open",
      proposalsCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    jobLeads.unshift(newLead);
    const matchingWorkers = users.filter(
      (u) => u.role === "worker" && u.occupation === newLead.occupation
    );
    matchingWorkers.forEach((w) => {
      notifications.unshift({
        id: `notif-${Date.now()}-${w.id}`,
        userId: w.id,
        type: "new_lead_match",
        title: `\u{1F525} New Nearby Job Lead: ${newLead.title}`,
        description: `Budget: \u20B9${newLead.budget} in ${newLead.location.city}. Tap to view project scope and apply.`,
        linkId: newLead.id,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    res.json({ success: true, lead: newLead, matchingWorkersNotified: matchingWorkers.length });
  });
  app.post("/api/ai/match", async (req, res) => {
    const { projectDescription, occupation, city, budgetRange } = req.body;
    const targetWorkers = users.filter((u) => u.role === "worker" && (!occupation || occupation === "All" || u.occupation === occupation)).map((w) => ({
      id: w.id,
      name: w.name,
      occupation: w.occupation,
      skills: w.skills,
      ratePerHour: w.ratePerHour,
      ratePerMonth: w.ratePerMonth,
      experienceYears: w.experienceYears,
      rating: w.rating,
      city: w.city
    }));
    if (ai) {
      try {
        const prompt = `You are KARMYOGI's Lead Matching and Scope Estimator AI for Indian trade workers and contractors.
Task: Analyze the client's project description and recommend the best matching workers, estimate fair market pricing in INR, and suggest recommended technical checkpoints.

Client Project: "${projectDescription || "Need high quality residential service"}"
Occupation Needed: "${occupation || "Any"}"
City: "${city || "Delhi NCR"}"
Budget Range: "${budgetRange || "Market standard"}"

Available Karmyogi Registered Workers:
${JSON.stringify(targetWorkers, null, 2)}

Provide a structured JSON output with:
1. "suggestedFairEstimate": estimated price range in INR and time to complete
2. "recommendedWorkerIds": array of worker IDs in priority order with match reasons
3. "technicalScopePoints": array of 4-5 bullet points specifying materials, steps, and quality checks
4. "aiSummary": a concise, encouraging recommendation in professional Indian trade context.
`;
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        const parsed = JSON.parse(response.text || "{}");
        return res.json({ success: true, aiResult: parsed, workers: targetWorkers });
      } catch (err) {
        console.error("Gemini AI match error:", err);
      }
    }
    const rankedWorkers = targetWorkers.slice(0, 3).map((w, idx) => ({
      workerId: w.id,
      matchScore: 98 - idx * 6,
      reason: `Verified ${w.occupation} with ${w.experienceYears} yrs experience and ${w.rating}\u2605 client rating in ${w.city}.`
    }));
    res.json({
      success: true,
      aiResult: {
        suggestedFairEstimate: "\u20B94,500 - \u20B98,500 (Estimated duration: 1-2 days based on standard CPWD/market rate)",
        recommendedWorkerIds: rankedWorkers.map((r) => r.workerId),
        matchDetails: rankedWorkers,
        technicalScopePoints: [
          "Site inspection & measurement verification before material purchase",
          "Use of ISI marked components and genuine fittings",
          "Concealed pressure/load testing after initial assembly",
          "Final cleanup and joint sealing warranty"
        ],
        aiSummary: `Matched top-rated certified ${occupation || "specialists"} nearest to your location with verified Aadhaar badges.`
      },
      workers: targetWorkers
    });
  });
  app.get("/api/reviews/:workerId", (req, res) => {
    const { workerId } = req.params;
    const workerReviews = reviews.filter((r) => r.workerId === workerId);
    res.json(workerReviews);
  });
  app.post("/api/reviews/create", (req, res) => {
    const { bookingId, workerId, seekerId, rating, comment, serviceName, tags, workPhotos } = req.body;
    const seeker = users.find((u) => u.id === seekerId);
    const worker = users.find((u) => u.id === workerId);
    const booking = bookings.find((item) => item.id === bookingId);
    if (!seeker || !worker || !booking) {
      return res.status(404).json({ error: "Invalid seeker or worker ID" });
    }
    if (booking.seekerId !== seekerId || booking.workerId !== workerId || booking.status !== "completed") {
      return res.status(400).json({ error: "Reviews are available only to the seeker after a completed booking." });
    }
    if (reviews.some((review) => review.bookingId === bookingId && review.seekerId === seekerId)) {
      return res.status(409).json({ error: "You have already reviewed this booking." });
    }
    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5 || !String(comment || "").trim()) {
      return res.status(400).json({ error: "Provide a rating from 1 to 5 and review feedback." });
    }
    const newReview = {
      id: `r-${Date.now()}`,
      bookingId: bookingId || `b-${Date.now()}`,
      workerId,
      seekerId: seeker.id,
      seekerName: seeker.name,
      seekerPic: seeker.profilePic,
      seekerCity: seeker.city,
      rating: normalizedRating,
      comment: String(comment).trim(),
      serviceName: serviceName || worker.occupation || "Service",
      tags: Array.isArray(tags) ? tags : ["Verified Hire", "Master Work"],
      workPhotos: Array.isArray(workPhotos) ? workPhotos : [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    reviews.unshift(newReview);
    const portfolioEntry = {
      id: `portfolio-${Date.now()}`,
      title: `${booking.projectTitle || worker.occupation || "Completed Work"}`,
      description: `${newReview.comment} (${newReview.rating}\u2605 reviewed by ${seeker.name})`,
      imageUrl: (Array.isArray(workPhotos) ? workPhotos[0] : void 0) || worker.profilePic || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
      category: worker.occupation || "Service",
      completedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    worker.portfolio = [portfolioEntry, ...worker.portfolio || []].slice(0, 12);
    const allWorkerReviews = reviews.filter((r) => r.workerId === workerId);
    const totalRating = allWorkerReviews.reduce((sum, r) => sum + r.rating, 0);
    worker.rating = Math.round(totalRating / allWorkerReviews.length * 10) / 10;
    worker.reviewCount = allWorkerReviews.length;
    worker.completedJobsCount = (worker.completedJobsCount || 0) + 1;
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: worker.id,
      type: "review_received",
      title: `New ${newReview.rating}\u2605 Review from ${seeker.name}! \u2B50`,
      description: `"${newReview.comment.slice(0, 60)}..."`,
      linkId: newReview.id,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true, review: newReview, updatedRating: worker.rating, portfolio: worker.portfolio });
  });
  app.get("/api/feed", (req, res) => {
    res.json(feedPosts);
  });
  app.post("/api/feed/create", (req, res) => {
    const { workerId, title, content, caption, photos, imageUrl, tags } = req.body;
    const worker = users.find((u) => u.id === workerId);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ error: "Worker not found" });
    }
    const postPhotos = Array.isArray(photos) ? photos : photos ? [photos] : imageUrl ? [imageUrl] : [];
    const newPost = {
      id: `post-${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      workerOccupation: worker.occupation || "Professional",
      workerPic: worker.profilePic,
      workerCity: worker.city,
      isVerified: worker.isVerified,
      title: title || caption || "New Completed Work Showcase",
      content: content || caption || "",
      photos: postPhotos,
      tags: Array.isArray(tags) ? tags : ["Karmyogi", "Craftsmanship"],
      likes: 1,
      likedBy: [worker.id],
      comments: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    feedPosts.unshift(newPost);
    res.json({ success: true, post: newPost });
  });
  app.post("/api/feed/:id/like", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body || {};
    const post = feedPosts.find((p) => p.id === id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const uId = userId || "demo-user";
    if (post.likedBy.includes(uId)) {
      post.likedBy = post.likedBy.filter((u) => u !== uId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(uId);
      post.likes += 1;
    }
    res.json({ success: true, post, likes: post.likes, likedBy: post.likedBy });
  });
  app.post("/api/feed/:id/comment", (req, res) => {
    const { id } = req.params;
    const { authorId, text, userName, userPic, comment } = req.body;
    const post = feedPosts.find((p) => p.id === id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const author = users.find((u) => u.id === authorId);
    const commentText = String(text || comment || "").trim();
    if (!commentText) return res.status(400).json({ error: "A comment cannot be empty." });
    const newComment = {
      id: `c-${Date.now()}`,
      authorId: author?.id || authorId || "user-anon",
      authorName: author?.name || userName || "Verified Client",
      authorPic: author?.profilePic || userPic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      text: commentText,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    post.comments.push(newComment);
    res.json({ success: true, post, comment: newComment });
  });
  app.get("/api/notifications/:userId", (req, res) => {
    const { userId } = req.params;
    const userNotifs = notifications.filter((n) => n.userId === userId);
    res.set("Cache-Control", "no-store, max-age=0");
    res.json(userNotifs);
  });
  const markNotificationReadHandler = (req, res) => {
    const { id } = req.params;
    const notif = notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
    res.json({ success: true });
  };
  app.post("/api/notifications/:id/read", markNotificationReadHandler);
  app.patch("/api/notifications/:id/read", markNotificationReadHandler);
  const isProduction = process.env.NODE_ENV === "production" || /[\\/]dist[\\/]server\.cjs$/.test(process.argv[1] || "");
  if (!isProduction) {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const server = (0, import_node_http.createServer)(app);
  server.on("error", (error) => {
    const detail = error.code === "EADDRINUSE" ? `Port ${PORT} is already in use. Stop the other KARMYOGI server or set a different PORT.` : `KARMYOGI server could not start: ${error.message}`;
    console.error(detail);
    process.exitCode = 1;
  });
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`KARMYOGI Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((error) => {
  console.error("KARMYOGI failed to initialise:", error);
  process.exitCode = 1;
});
//# sourceMappingURL=server.cjs.map
