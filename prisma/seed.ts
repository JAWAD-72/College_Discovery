/**
 * Seed script for College Discovery platform.
 *
 * Generates 300+ realistic Indian colleges across engineering, medicine,
 * management, law, and design disciplines with:
 *   - 3–8 courses per college
 *   - 3 years of placement data per college
 *   - 5–15 reviews per college
 *   - Full category-wise cutoff rows per course
 *
 * Run: npx tsx prisma/seed.ts
 *
 * Data is deterministic (seeded PRNG) so repeated runs produce identical data.
 * All names, cities, fees, and statistics are plausible for Indian higher education.
 */

import {
  PrismaClient,
  CollegeType,
  DegreeLevel,
  Category,
} from "@prisma/client";

const prisma = new PrismaClient();

// ─── Deterministic PRNG (mulberry32) ─────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((rand() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Realistic Indian Data Pools ─────────────────────────────────────────────

const STATES_CITIES: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Delhi": ["New Delhi"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Kanpur", "Varanasi", "Allahabad"],
  "Telangana": ["Hyderabad", "Warangal"],
  "West Bengal": ["Kolkata", "Kharagpur", "Durgapur", "Siliguri"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Gujarat": ["Ahmedabad", "Vadodara", "Surat", "Rajkot"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati", "Guntur"],
  "Punjab": ["Chandigarh", "Jalandhar", "Amritsar", "Ludhiana"],
  "Haryana": ["Gurugram", "Faridabad", "Rohtak", "Hisar"],
  "Bihar": ["Patna", "Muzaffarpur", "Gaya"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar"],
  "Uttarakhand": ["Dehradun", "Roorkee", "Haridwar"],
  "Goa": ["Panaji", "Margao"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  "Chandigarh": ["Chandigarh"],
  "Puducherry": ["Puducherry"],
  "Meghalaya": ["Shillong"],
  "Tripura": ["Agartala"],
  "Manipur": ["Imphal"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Mizoram": ["Aizawl"],
  "Sikkim": ["Gangtok"],
};

const NAAC_GRADES = ["A++", "A+", "A", "B++", "B+", "B", "C"] as const;

// ─── College name templates ──────────────────────────────────────────────────

interface CollegeTemplate {
  namePattern: string;
  discipline: "engineering" | "medicine" | "management" | "law" | "design";
  typeWeights: Record<CollegeType, number>;
}

const ENGINEERING_PREFIXES = [
  "Indian Institute of Technology",
  "National Institute of Technology",
  "Indian Institute of Information Technology",
  "Birla Institute of Technology and Science",
  "Vellore Institute of Technology",
  "SRM Institute of Science and Technology",
  "Manipal Institute of Technology",
  "Thapar Institute of Engineering and Technology",
  "Delhi Technological University",
  "Netaji Subhas University of Technology",
  "PES University",
  "RV College of Engineering",
  "BMS College of Engineering",
  "College of Engineering",
  "Government Engineering College",
  "Jadavpur University",
  "Anna University",
  "PSG College of Technology",
  "MITS",
  "Institute of Engineering and Technology",
] as const;

const MEDICAL_PREFIXES = [
  "All India Institute of Medical Sciences",
  "Government Medical College",
  "Armed Forces Medical College",
  "Christian Medical College",
  "Kasturba Medical College",
  "Maulana Azad Medical College",
  "Grant Medical College",
  "Seth GS Medical College",
  "King George Medical University",
  "Institute of Medical Sciences",
  "Jawaharlal Institute of Postgraduate Medical Education",
  "Sri Ramachandra Medical College",
  "Amrita Institute of Medical Sciences",
  "Dayanand Medical College",
  "JSS Medical College",
] as const;

const MANAGEMENT_PREFIXES = [
  "Indian Institute of Management",
  "Xavier School of Management",
  "Faculty of Management Studies",
  "SP Jain Institute of Management and Research",
  "Management Development Institute",
  "Symbiosis Institute of Business Management",
  "NMIMS School of Business Management",
  "Institute of Management Technology",
  "International Management Institute",
  "Loyola Institute of Business Administration",
  "Great Lakes Institute of Management",
  "TA Pai Management Institute",
  "Goa Institute of Management",
  "Lal Bahadur Shastri Institute of Management",
  "Institute of Management Studies",
] as const;

const LAW_PREFIXES = [
  "National Law School of India University",
  "National Academy of Legal Studies and Research",
  "National Law University",
  "West Bengal National University of Juridical Sciences",
  "National Law Institute University",
  "Rajiv Gandhi National University of Law",
  "Gujarat National Law University",
  "Ram Manohar Lohia National Law University",
  "Chanakya National Law University",
  "Damodaram Sanjivayya National Law University",
  "Tamil Nadu National Law University",
  "Maharashtra National Law University",
  "School of Law",
  "Faculty of Law",
  "Institute of Law",
] as const;

const DESIGN_PREFIXES = [
  "National Institute of Design",
  "National Institute of Fashion Technology",
  "Srishti Manipal Institute of Art Design and Technology",
  "MIT Institute of Design",
  "Pearl Academy",
  "Symbiosis Institute of Design",
  "DJ Academy of Design",
  "Indian Institute of Crafts and Design",
  "Arch College of Design and Business",
  "WOXSEN University School of Art and Design",
  "Chitkara School of Art and Design",
  "LPU School of Design",
] as const;

// ─── Course definitions by discipline ────────────────────────────────────────

interface CourseTemplate {
  name: string;
  degreeLevel: DegreeLevel;
  branch: string;
  durationYears: number;
  exam: string;
}

const ENGINEERING_COURSES: CourseTemplate[] = [
  { name: "B.Tech Computer Science and Engineering", degreeLevel: "UG", branch: "Computer Science", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Electronics and Communication", degreeLevel: "UG", branch: "Electronics", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Mechanical Engineering", degreeLevel: "UG", branch: "Mechanical", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Electrical Engineering", degreeLevel: "UG", branch: "Electrical", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Civil Engineering", degreeLevel: "UG", branch: "Civil", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Chemical Engineering", degreeLevel: "UG", branch: "Chemical", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Information Technology", degreeLevel: "UG", branch: "Information Technology", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Artificial Intelligence and ML", degreeLevel: "UG", branch: "Artificial Intelligence", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Data Science", degreeLevel: "UG", branch: "Data Science", durationYears: 4, exam: "JEE Main" },
  { name: "B.Tech Biotechnology", degreeLevel: "UG", branch: "Biotechnology", durationYears: 4, exam: "JEE Main" },
  { name: "M.Tech Computer Science", degreeLevel: "PG", branch: "Computer Science", durationYears: 2, exam: "GATE" },
  { name: "M.Tech VLSI Design", degreeLevel: "PG", branch: "Electronics", durationYears: 2, exam: "GATE" },
  { name: "M.Tech Structural Engineering", degreeLevel: "PG", branch: "Civil", durationYears: 2, exam: "GATE" },
];

const MEDICAL_COURSES: CourseTemplate[] = [
  { name: "MBBS", degreeLevel: "UG", branch: "Medicine", durationYears: 5, exam: "NEET UG" },
  { name: "BDS", degreeLevel: "UG", branch: "Dentistry", durationYears: 5, exam: "NEET UG" },
  { name: "B.Sc Nursing", degreeLevel: "UG", branch: "Nursing", durationYears: 4, exam: "NEET UG" },
  { name: "BAMS", degreeLevel: "UG", branch: "Ayurveda", durationYears: 5, exam: "NEET UG" },
  { name: "BPT", degreeLevel: "UG", branch: "Physiotherapy", durationYears: 4, exam: "NEET UG" },
  { name: "MD General Medicine", degreeLevel: "PG", branch: "Medicine", durationYears: 3, exam: "NEET PG" },
  { name: "MS General Surgery", degreeLevel: "PG", branch: "Surgery", durationYears: 3, exam: "NEET PG" },
  { name: "MD Paediatrics", degreeLevel: "PG", branch: "Paediatrics", durationYears: 3, exam: "NEET PG" },
];

const MANAGEMENT_COURSES: CourseTemplate[] = [
  { name: "MBA", degreeLevel: "PG", branch: "Management", durationYears: 2, exam: "CAT" },
  { name: "MBA Finance", degreeLevel: "PG", branch: "Finance", durationYears: 2, exam: "CAT" },
  { name: "MBA Marketing", degreeLevel: "PG", branch: "Marketing", durationYears: 2, exam: "CAT" },
  { name: "MBA Human Resource Management", degreeLevel: "PG", branch: "Human Resources", durationYears: 2, exam: "CAT" },
  { name: "MBA Operations Management", degreeLevel: "PG", branch: "Operations", durationYears: 2, exam: "CAT" },
  { name: "MBA Business Analytics", degreeLevel: "PG", branch: "Business Analytics", durationYears: 2, exam: "XAT" },
  { name: "PGDM", degreeLevel: "PG", branch: "Management", durationYears: 2, exam: "CAT" },
  { name: "BBA", degreeLevel: "UG", branch: "Management", durationYears: 3, exam: "CUET" },
];

const LAW_COURSES: CourseTemplate[] = [
  { name: "BA LLB (Hons)", degreeLevel: "UG", branch: "Law", durationYears: 5, exam: "CLAT" },
  { name: "BBA LLB (Hons)", degreeLevel: "UG", branch: "Law", durationYears: 5, exam: "CLAT" },
  { name: "B.Sc LLB (Hons)", degreeLevel: "UG", branch: "Law", durationYears: 5, exam: "CLAT" },
  { name: "LLB", degreeLevel: "UG", branch: "Law", durationYears: 3, exam: "CLAT" },
  { name: "LLM Constitutional Law", degreeLevel: "PG", branch: "Constitutional Law", durationYears: 1, exam: "CLAT PG" },
  { name: "LLM Corporate Law", degreeLevel: "PG", branch: "Corporate Law", durationYears: 1, exam: "CLAT PG" },
];

const DESIGN_COURSES: CourseTemplate[] = [
  { name: "B.Des Industrial Design", degreeLevel: "UG", branch: "Industrial Design", durationYears: 4, exam: "UCEED" },
  { name: "B.Des Communication Design", degreeLevel: "UG", branch: "Communication Design", durationYears: 4, exam: "UCEED" },
  { name: "B.Des Fashion Design", degreeLevel: "UG", branch: "Fashion Design", durationYears: 4, exam: "NIFT" },
  { name: "B.Des Textile Design", degreeLevel: "UG", branch: "Textile Design", durationYears: 4, exam: "NIFT" },
  { name: "B.Des Product Design", degreeLevel: "UG", branch: "Product Design", durationYears: 4, exam: "UCEED" },
  { name: "M.Des Industrial Design", degreeLevel: "PG", branch: "Industrial Design", durationYears: 2, exam: "CEED" },
  { name: "M.Des Interaction Design", degreeLevel: "PG", branch: "Interaction Design", durationYears: 2, exam: "CEED" },
];

const DISCIPLINE_COURSES = {
  engineering: ENGINEERING_COURSES,
  medicine: MEDICAL_COURSES,
  management: MANAGEMENT_COURSES,
  law: LAW_COURSES,
  design: DESIGN_COURSES,
};

// ─── Placement data pools ────────────────────────────────────────────────────

const TOP_RECRUITERS_ENGINEERING = [
  "Google", "Microsoft", "Amazon", "Flipkart", "Goldman Sachs", "Morgan Stanley",
  "JP Morgan", "Deloitte", "McKinsey", "BCG", "Bain", "Infosys", "TCS", "Wipro",
  "HCL", "Cognizant", "Accenture", "Oracle", "Adobe", "Samsung", "Intel",
  "Qualcomm", "Texas Instruments", "Uber", "Ola", "Paytm", "PhonePe", "CRED",
  "Atlassian", "ServiceNow", "Salesforce", "IBM", "Capgemini", "Tech Mahindra",
  "L&T Infotech", "Mindtree", "Mphasis", "Persistent Systems", "Siemens",
  "Bosch", "Tata Motors", "Mahindra", "Reliance", "Larsen & Toubro",
];

const TOP_RECRUITERS_MEDICAL = [
  "Apollo Hospitals", "Fortis Healthcare", "Max Healthcare", "Narayana Health",
  "Manipal Hospitals", "AIIMS", "Medanta", "Columbia Asia", "Aster DM Healthcare",
  "HCG Hospitals", "Wockhardt", "Kokilaben Hospital", "Lilavati Hospital",
  "Sir Ganga Ram Hospital", "Breach Candy Hospital",
];

const TOP_RECRUITERS_MANAGEMENT = [
  "McKinsey", "BCG", "Bain", "Deloitte", "EY", "PwC", "KPMG", "Goldman Sachs",
  "JP Morgan", "Morgan Stanley", "Citibank", "HSBC", "Deutsche Bank", "Barclays",
  "Amazon", "Google", "Microsoft", "Flipkart", "Unilever", "P&G", "Nestle",
  "ITC", "Marico", "Asian Paints", "Aditya Birla Group", "Reliance Industries",
  "Tata Group", "Mahindra Group", "Godrej", "Bajaj",
];

const TOP_RECRUITERS_LAW = [
  "AZB & Partners", "Cyril Amarchand Mangaldas", "Khaitan & Co",
  "Shardul Amarchand Mangaldas", "Trilegal", "Luthra & Luthra",
  "J Sagar Associates", "Nishith Desai Associates", "S&R Associates",
  "Economic Laws Practice", "Lakshmikumaran & Sridharan", "IndusLaw",
];

const TOP_RECRUITERS_DESIGN = [
  "Titan", "Tata Elxsi", "Samsung Design", "Godrej Design Lab",
  "Asian Paints", "Wipro Digital", "Infosys Design", "Accenture Interactive",
  "Zomato", "Swiggy", "CRED", "Razorpay", "PhonePe", "Ola",
];

const DISCIPLINE_RECRUITERS = {
  engineering: TOP_RECRUITERS_ENGINEERING,
  medicine: TOP_RECRUITERS_MEDICAL,
  management: TOP_RECRUITERS_MANAGEMENT,
  law: TOP_RECRUITERS_LAW,
  design: TOP_RECRUITERS_DESIGN,
};

// ─── Review templates ────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
  "Krishna", "Ishaan", "Ananya", "Priya", "Sneha", "Diya", "Riya", "Pooja",
  "Kavya", "Neha", "Shreya", "Isha", "Rohan", "Karan", "Rahul", "Amit",
  "Vikram", "Mohit", "Nikhil", "Siddharth", "Tushar", "Gaurav", "Meera",
  "Divya", "Nandini", "Tanvi", "Simran", "Anjali", "Sakshi", "Aarohi",
  "Ritika", "Khushi", "Harsh", "Dev", "Yash", "Om", "Parth", "Sahil",
  "Raj", "Akash", "Deepak", "Manish",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Reddy", "Kumar", "Singh", "Gupta", "Joshi",
  "Nair", "Menon", "Iyer", "Rao", "Pillai", "Das", "Bose", "Chatterjee",
  "Banerjee", "Mukherjee", "Mishra", "Pandey", "Agarwal", "Jain", "Mehta",
  "Shah", "Desai", "Patil", "Kulkarni", "Deshpande", "Kaur", "Chauhan",
  "Tiwari", "Yadav", "Dubey", "Srivastava", "Saxena", "Kapoor", "Khanna",
  "Malhotra", "Chopra", "Bhatia",
];

const REVIEW_TITLES_POSITIVE = [
  "Great campus life and academics",
  "Excellent placement opportunities",
  "Worth every rupee spent here",
  "Strong faculty and curriculum",
  "Good infrastructure and labs",
  "Wonderful learning environment",
  "Best decision of my life",
  "Top-notch facilities",
  "Industry-ready education",
  "Amazing peer group and exposure",
  "Well-structured curriculum",
  "Solid placements year after year",
  "Campus is beautiful and well-maintained",
  "Faculty genuinely cares about students",
  "Great return on investment",
];

const REVIEW_TITLES_MIXED = [
  "Good academics, average infrastructure",
  "Decent college, could improve placements",
  "Mixed experience overall",
  "Academics are great, campus needs work",
  "Good for some branches, average for others",
  "Faculty is hit or miss",
  "Placement cell needs improvement",
  "Average experience with some highlights",
  "Good value for the fees charged",
  "Some departments are excellent, others lag",
];

const REVIEW_TITLES_NEGATIVE = [
  "Did not meet expectations",
  "Placements are overhyped",
  "Infrastructure needs serious upgrades",
  "Not worth the fees",
  "Management needs to listen to students",
];

const REVIEW_BODIES_POSITIVE = [
  "The college provided me with excellent technical skills and real-world exposure through industry projects. The placement cell is very active and brings top companies on campus every year. Labs are well-equipped and the library has an extensive collection of journals and research papers.",
  "Faculty members are highly qualified and approachable. The curriculum is regularly updated to match industry standards. Hostel facilities are comfortable and the mess food is decent. Overall a great experience that prepared me well for my career.",
  "Campus placements are the highlight of this institution. The training and placement office works tirelessly to ensure maximum placements. The average package has been consistently increasing over the past few years. Extracurricular activities and clubs add to the overall development.",
  "World-class infrastructure with smart classrooms, advanced laboratories, and a sprawling green campus. The college organizes regular workshops, hackathons, and guest lectures from industry leaders. The alumni network is very strong and helpful for career guidance.",
  "The academics here are rigorous and the evaluation system is fair. Professors encourage independent thinking and research. The college has collaborations with international universities for exchange programs. The placement record speaks for itself.",
  "Exceptional learning environment with a good mix of theory and practical exposure. The college fest is one of the largest in the state and attracts participants from across the country. Sports facilities are top-notch with a full-size cricket ground and swimming pool.",
  "I had a transformative experience at this institution. The project-based learning approach helped me develop practical skills that were invaluable during placements. The incubation center supports student startups with funding and mentorship.",
  "The college has invested significantly in upgrading its labs and computing infrastructure in recent years. Wi-Fi connectivity is reliable across the campus. The central library is open until midnight during exam season. Career counselling services are helpful.",
];

const REVIEW_BODIES_MIXED = [
  "Academics are strong but the infrastructure needs modernization. Some buildings are quite old and could use renovation. The placement cell is active for computer science and electronics branches but other departments get fewer opportunities. Hostel rooms are cramped but manageable.",
  "The college has a good reputation and decent faculty. However, the administration can be slow and bureaucratic. Placements are good for the top 50% of the batch but the rest struggle. Campus food could be better. Overall a reasonable choice for the fees.",
  "Teaching quality varies significantly across departments. The computer science department is excellent with industry-experienced faculty, while some other departments rely heavily on guest lecturers. Infrastructure is adequate but not exceptional. Location is convenient with good connectivity.",
  "Decent college with a mix of strengths and weaknesses. The curriculum could be more practical and industry-oriented. Labs need better equipment. On the plus side, the alumni network is helpful and the college brand carries weight in the job market.",
  "The college provides a solid foundation in fundamentals. However, students need to put in extra effort for competitive exams and higher studies. The placement percentage is good but the average package could be better. Hostel life is enjoyable with a vibrant student community.",
];

const REVIEW_BODIES_NEGATIVE = [
  "The college does not live up to its reputation. Infrastructure is outdated and labs lack modern equipment. Faculty absenteeism is a recurring issue. Placement figures are inflated by including mass recruiters offering packages below industry average. I expected much more for the fees I paid.",
  "Management is more focused on revenue than education quality. The campus needs urgent maintenance and renovation. Wi-Fi is unreliable and computer labs have outdated hardware. Some professors are knowledgeable but their teaching methods are outdated. Would not recommend at this fee range.",
];

// ─── College generation logic ────────────────────────────────────────────────

interface CollegeSpec {
  name: string;
  shortName: string;
  discipline: "engineering" | "medicine" | "management" | "law" | "design";
  tier: 1 | 2 | 3; // affects fees, packages, ranks
  type: CollegeType;
  state: string;
  city: string;
}

function generateCollegeSpecs(): CollegeSpec[] {
  const specs: CollegeSpec[] = [];
  const usedNames = new Set<string>();

  function addCollege(
    nameBase: string,
    city: string,
    state: string,
    discipline: CollegeSpec["discipline"],
    tier: CollegeSpec["tier"],
    type: CollegeType
  ) {
    // Make name unique by appending city if needed
    let name = nameBase;
    if (usedNames.has(name)) {
      name = `${nameBase}, ${city}`;
    }
    if (usedNames.has(name)) {
      name = `${nameBase}, ${city} (${state})`;
    }
    if (usedNames.has(name)) return; // Skip true duplicates
    usedNames.add(name);

    const words = nameBase.split(" ");
    let shortName: string;
    if (words.length <= 3) {
      shortName = nameBase;
    } else {
      shortName = words
        .filter((w) => w.length > 2 && w[0] === w[0].toUpperCase())
        .map((w) => w[0])
        .join("");
    }

    specs.push({ name, shortName, discipline, tier, type, state, city });
  }

  // ── IITs (Tier 1 Engineering, Govt) ──
  const iitCities = [
    ["Mumbai", "Maharashtra"], ["Delhi", "Delhi"], ["Kanpur", "Uttar Pradesh"],
    ["Kharagpur", "West Bengal"], ["Chennai", "Tamil Nadu"], ["Roorkee", "Uttarakhand"],
    ["Guwahati", "Assam"], ["Hyderabad", "Telangana"], ["Indore", "Madhya Pradesh"],
    ["Varanasi", "Uttar Pradesh"], ["Dhanbad", "Jharkhand"], ["Bhubaneswar", "Odisha"],
    ["Jodhpur", "Rajasthan"], ["Patna", "Bihar"], ["Tirupati", "Andhra Pradesh"],
    ["Mandi", "Himachal Pradesh"], ["Gandhinagar", "Gujarat"], ["Palakkad", "Kerala"],
    ["Ropar", "Punjab"], ["Jammu", "Jammu and Kashmir"], ["Goa", "Goa"],
    ["Bhilai", "Chhattisgarh"],
  ];
  for (const [city, state] of iitCities) {
    addCollege(`Indian Institute of Technology ${city}`, city, state, "engineering", 1, "Govt");
  }

  // ── NITs (Tier 1-2 Engineering, Govt) ──
  const nitLocations = [
    ["Tiruchirappalli", "Tamil Nadu"], ["Warangal", "Telangana"],
    ["Surathkal", "Karnataka"], ["Rourkela", "Odisha"],
    ["Calicut", "Kerala"], ["Nagpur", "Maharashtra"],
    ["Allahabad", "Uttar Pradesh"], ["Jaipur", "Rajasthan"],
    ["Kurukshetra", "Haryana"], ["Durgapur", "West Bengal"],
    ["Silchar", "Assam"], ["Srinagar", "Jammu and Kashmir"],
    ["Hamirpur", "Himachal Pradesh"], ["Patna", "Bihar"],
    ["Bhopal", "Madhya Pradesh"], ["Raipur", "Chhattisgarh"],
    ["Agartala", "Tripura"], ["Jamshedpur", "Jharkhand"],
    ["Surat", "Gujarat"], ["Aizawl", "Mizoram"],
  ];
  for (const [city, state] of nitLocations) {
    const tier = rand() < 0.4 ? 1 : 2;
    addCollege(`National Institute of Technology ${city}`, city, state, "engineering", tier as 1 | 2, "Govt");
  }

  // ── IIITs (Tier 1-2 Engineering, Govt) ──
  const iiitLocations = [
    ["Hyderabad", "Telangana"], ["Bengaluru", "Karnataka"],
    ["Allahabad", "Uttar Pradesh"], ["Delhi", "Delhi"],
    ["Jabalpur", "Madhya Pradesh"], ["Kanchipuram", "Tamil Nadu"],
    ["Gwalior", "Madhya Pradesh"], ["Lucknow", "Uttar Pradesh"],
    ["Kota", "Rajasthan"], ["Vadodara", "Gujarat"],
  ];
  for (const [city, state] of iiitLocations) {
    addCollege(`Indian Institute of Information Technology ${city}`, city, state, "engineering", rand() < 0.3 ? 1 : 2 as 1 | 2, "Govt");
  }

  // ── BITS campuses (Tier 1, Deemed) ──
  for (const [city, state] of [["Pilani", "Rajasthan"], ["Goa", "Goa"], ["Hyderabad", "Telangana"]]) {
    addCollege(`Birla Institute of Technology and Science ${city}`, city, state, "engineering", 1, "Deemed");
  }

  // ── Top Private Engineering ──
  const topPrivateEng: [string, string, string][] = [
    ["Vellore Institute of Technology", "Vellore", "Tamil Nadu"],
    ["SRM Institute of Science and Technology", "Chennai", "Tamil Nadu"],
    ["Manipal Institute of Technology", "Manipal", "Karnataka"],
    ["Thapar Institute of Engineering and Technology", "Patiala", "Punjab"],
    ["PES University", "Bengaluru", "Karnataka"],
    ["RV College of Engineering", "Bengaluru", "Karnataka"],
    ["BMS College of Engineering", "Bengaluru", "Karnataka"],
    ["PSG College of Technology", "Coimbatore", "Tamil Nadu"],
    ["Amity University", "Noida", "Uttar Pradesh"],
    ["LPU Lovely Professional University", "Jalandhar", "Punjab"],
    ["Kalinga Institute of Industrial Technology", "Bhubaneswar", "Odisha"],
    ["SASTRA Deemed University", "Thanjavur", "Tamil Nadu"],
    ["Nirma University", "Ahmedabad", "Gujarat"],
    ["Sathyabama Institute of Science and Technology", "Chennai", "Tamil Nadu"],
    ["Shiv Nadar University", "Greater Noida", "Uttar Pradesh"],
  ];
  for (const [name, city, state] of topPrivateEng) {
    addCollege(name, city, state, "engineering", rand() < 0.3 ? 1 : 2 as 1 | 2, "Private");
  }

  // ── Govt Engineering Colleges (Tier 2-3) ──
  const govtEngStates = Object.entries(STATES_CITIES);
  for (let i = 0; i < 40; i++) {
    const [state, cities] = govtEngStates[i % govtEngStates.length];
    const city = pick(cities);
    const prefixIdx = i % 5;
    const prefixes = [
      "Government College of Engineering",
      "University Institute of Engineering and Technology",
      "State Engineering College",
      "Regional Engineering College",
      "Government Institute of Technology",
    ];
    addCollege(`${prefixes[prefixIdx]} ${city}`, city, state, "engineering", rand() < 0.3 ? 2 : 3 as 2 | 3, "Govt");
  }

  // ── Private Engineering Colleges (Tier 2-3) ──
  const privateEngNames = [
    "Dayananda Sagar College of Engineering",
    "New Horizon College of Engineering",
    "MS Ramaiah Institute of Technology",
    "JSS Science and Technology University",
    "KLE Technological University",
    "Rajalakshmi Engineering College",
    "Sri Sivasubramaniya Nadar College of Engineering",
    "Kumaraguru College of Technology",
    "Kongu Engineering College",
    "KJ Somaiya College of Engineering",
    "DJ Sanghvi College of Engineering",
    "Sardar Patel Institute of Technology",
    "Dwarkadas J Sanghvi College of Engineering",
    "Bharati Vidyapeeth College of Engineering",
    "MIT World Peace University",
    "Symbiosis Institute of Technology",
    "Christ University Faculty of Engineering",
    "Chandigarh University",
    "Chitkara University",
    "Bennett University",
    "GITAM University",
    "KL University",
    "Centurion University of Technology",
    "Karunya Institute of Technology",
    "Hindustan Institute of Technology and Science",
  ];
  const privateEngLocations: [string, string][] = [
    ["Bengaluru", "Karnataka"], ["Bengaluru", "Karnataka"],
    ["Bengaluru", "Karnataka"], ["Mysuru", "Karnataka"],
    ["Hubballi", "Karnataka"], ["Chennai", "Tamil Nadu"],
    ["Chennai", "Tamil Nadu"], ["Coimbatore", "Tamil Nadu"],
    ["Coimbatore", "Tamil Nadu"], ["Mumbai", "Maharashtra"],
    ["Mumbai", "Maharashtra"], ["Mumbai", "Maharashtra"],
    ["Mumbai", "Maharashtra"], ["Pune", "Maharashtra"],
    ["Pune", "Maharashtra"], ["Pune", "Maharashtra"],
    ["Bengaluru", "Karnataka"], ["Chandigarh", "Chandigarh"],
    ["Chandigarh", "Chandigarh"], ["Greater Noida", "Uttar Pradesh"],
    ["Visakhapatnam", "Andhra Pradesh"], ["Vijayawada", "Andhra Pradesh"],
    ["Bhubaneswar", "Odisha"], ["Coimbatore", "Tamil Nadu"],
    ["Chennai", "Tamil Nadu"],
  ];
  for (let i = 0; i < privateEngNames.length; i++) {
    const [city, state] = privateEngLocations[i];
    addCollege(privateEngNames[i], city, state, "engineering", rand() < 0.2 ? 2 : 3 as 2 | 3, "Private");
  }

  // ── Delhi Govt Engineering ──
  addCollege("Delhi Technological University", "New Delhi", "Delhi", "engineering", 1, "Govt");
  addCollege("Netaji Subhas University of Technology", "New Delhi", "Delhi", "engineering", 1, "Govt");
  addCollege("Indraprastha Institute of Information Technology Delhi", "New Delhi", "Delhi", "engineering", 1, "Govt");

  // ── Jadavpur, Anna, etc. ──
  addCollege("Jadavpur University Faculty of Engineering", "Kolkata", "West Bengal", "engineering", 1, "Govt");
  addCollege("Anna University College of Engineering Guindy", "Chennai", "Tamil Nadu", "engineering", 1, "Govt");
  addCollege("College of Engineering Pune", "Pune", "Maharashtra", "engineering", 1, "Govt");
  addCollege("Visvesvaraya National Institute of Technology", "Nagpur", "Maharashtra", "engineering", 1, "Govt");

  // ── AIIMS (Tier 1 Medical, Govt) ──
  const aiimsCities: [string, string][] = [
    ["New Delhi", "Delhi"], ["Jodhpur", "Rajasthan"], ["Bhopal", "Madhya Pradesh"],
    ["Rishikesh", "Uttarakhand"], ["Patna", "Bihar"], ["Raipur", "Chhattisgarh"],
    ["Bhubaneswar", "Odisha"], ["Nagpur", "Maharashtra"], ["Mangalagiri", "Andhra Pradesh"],
    ["Gorakhpur", "Uttar Pradesh"],
  ];
  for (const [city, state] of aiimsCities) {
    addCollege(`All India Institute of Medical Sciences ${city}`, city, state, "medicine", 1, "Govt");
  }

  // ── Top Medical Colleges ──
  const topMedical: [string, string, string, CollegeType][] = [
    ["Armed Forces Medical College", "Pune", "Maharashtra", "Govt"],
    ["Christian Medical College", "Vellore", "Tamil Nadu", "Private"],
    ["Kasturba Medical College", "Manipal", "Karnataka", "Private"],
    ["Maulana Azad Medical College", "New Delhi", "Delhi", "Govt"],
    ["Grant Medical College", "Mumbai", "Maharashtra", "Govt"],
    ["Seth GS Medical College", "Mumbai", "Maharashtra", "Govt"],
    ["King George Medical University", "Lucknow", "Uttar Pradesh", "Govt"],
    ["Jawaharlal Institute of Postgraduate Medical Education and Research", "Puducherry", "Puducherry", "Govt"],
    ["Sri Ramachandra Medical College", "Chennai", "Tamil Nadu", "Deemed"],
    ["Amrita Institute of Medical Sciences", "Kochi", "Kerala", "Deemed"],
    ["Dayanand Medical College", "Ludhiana", "Punjab", "Private"],
    ["JSS Medical College", "Mysuru", "Karnataka", "Deemed"],
  ];
  for (const [name, city, state, type] of topMedical) {
    addCollege(name, city, state, "medicine", rand() < 0.5 ? 1 : 2 as 1 | 2, type);
  }

  // ── Govt Medical Colleges (Tier 2-3) ──
  const medStates = Object.entries(STATES_CITIES).slice(0, 20);
  for (let i = 0; i < 25; i++) {
    const [state, cities] = medStates[i % medStates.length];
    const city = pick(cities);
    addCollege(`Government Medical College ${city}`, city, state, "medicine", rand() < 0.3 ? 2 : 3 as 2 | 3, "Govt");
  }

  // ── IIMs (Tier 1 Management, Govt) ──
  const iimCities: [string, string][] = [
    ["Ahmedabad", "Gujarat"], ["Bengaluru", "Karnataka"], ["Kolkata", "West Bengal"],
    ["Lucknow", "Uttar Pradesh"], ["Indore", "Madhya Pradesh"], ["Kozhikode", "Kerala"],
    ["Shillong", "Meghalaya"], ["Ranchi", "Jharkhand"], ["Raipur", "Chhattisgarh"],
    ["Tiruchirappalli", "Tamil Nadu"], ["Udaipur", "Rajasthan"], ["Kashipur", "Uttarakhand"],
    ["Nagpur", "Maharashtra"], ["Visakhapatnam", "Andhra Pradesh"], ["Rohtak", "Haryana"],
    ["Amritsar", "Punjab"], ["Jammu", "Jammu and Kashmir"], ["Bodh Gaya", "Bihar"],
    ["Sirmaur", "Himachal Pradesh"], ["Sambalpur", "Odisha"],
  ];
  for (const [city, state] of iimCities) {
    const tier = rand() < 0.3 ? 1 : 2;
    addCollege(`Indian Institute of Management ${city}`, city, state, "management", tier as 1 | 2, "Govt");
  }

  // ── Top Private B-Schools ──
  const topBSchools: [string, string, string][] = [
    ["Xavier School of Management", "Jamshedpur", "Jharkhand"],
    ["Faculty of Management Studies University of Delhi", "New Delhi", "Delhi"],
    ["SP Jain Institute of Management and Research", "Mumbai", "Maharashtra"],
    ["Management Development Institute", "Gurugram", "Haryana"],
    ["Symbiosis Institute of Business Management", "Pune", "Maharashtra"],
    ["NMIMS School of Business Management", "Mumbai", "Maharashtra"],
    ["Institute of Management Technology Ghaziabad", "Ghaziabad", "Uttar Pradesh"],
    ["International Management Institute New Delhi", "New Delhi", "Delhi"],
    ["Great Lakes Institute of Management", "Chennai", "Tamil Nadu"],
    ["TA Pai Management Institute", "Manipal", "Karnataka"],
    ["Goa Institute of Management", "Panaji", "Goa"],
    ["Loyola Institute of Business Administration", "Chennai", "Tamil Nadu"],
    ["Lal Bahadur Shastri Institute of Management", "New Delhi", "Delhi"],
    ["MICA Ahmedabad", "Ahmedabad", "Gujarat"],
    ["Mudra Institute of Communications Ahmedabad", "Ahmedabad", "Gujarat"],
  ];
  for (const [name, city, state] of topBSchools) {
    addCollege(name, city, state, "management", rand() < 0.4 ? 1 : 2 as 1 | 2, "Private");
  }

  // ── NLUs (Tier 1 Law, Govt) ──
  const nluLocations: [string, string, string][] = [
    ["National Law School of India University", "Bengaluru", "Karnataka"],
    ["National Academy of Legal Studies and Research", "Hyderabad", "Telangana"],
    ["National Law University Delhi", "New Delhi", "Delhi"],
    ["West Bengal National University of Juridical Sciences", "Kolkata", "West Bengal"],
    ["National Law Institute University", "Bhopal", "Madhya Pradesh"],
    ["Rajiv Gandhi National University of Law", "Patiala", "Punjab"],
    ["Gujarat National Law University", "Gandhinagar", "Gujarat"],
    ["Ram Manohar Lohia National Law University", "Lucknow", "Uttar Pradesh"],
    ["Chanakya National Law University", "Patna", "Bihar"],
    ["Damodaram Sanjivayya National Law University", "Visakhapatnam", "Andhra Pradesh"],
    ["Tamil Nadu National Law University", "Tiruchirappalli", "Tamil Nadu"],
    ["Maharashtra National Law University Mumbai", "Mumbai", "Maharashtra"],
    ["Maharashtra National Law University Nagpur", "Nagpur", "Maharashtra"],
    ["Maharashtra National Law University Aurangabad", "Aurangabad", "Maharashtra"],
    ["Himachal Pradesh National Law University", "Shimla", "Himachal Pradesh"],
  ];
  for (const [name, city, state] of nluLocations) {
    addCollege(name, city, state, "law", rand() < 0.4 ? 1 : 2 as 1 | 2, "Govt");
  }

  // ── Private Law Colleges ──
  const privateLaw: [string, string, string][] = [
    ["Symbiosis Law School", "Pune", "Maharashtra"],
    ["Jindal Global Law School", "Sonipat", "Haryana"],
    ["School of Law Christ University", "Bengaluru", "Karnataka"],
    ["Amity Law School", "Noida", "Uttar Pradesh"],
    ["Army Institute of Law", "Mohali", "Punjab"],
    ["ILS Law College", "Pune", "Maharashtra"],
    ["Government Law College", "Mumbai", "Maharashtra"],
    ["Faculty of Law University of Delhi", "New Delhi", "Delhi"],
  ];
  for (const [name, city, state] of privateLaw) {
    addCollege(name, city, state, "law", rand() < 0.3 ? 2 : 3 as 2 | 3, "Private");
  }

  // ── Design Colleges ──
  const designColleges: [string, string, string, CollegeType][] = [
    ["National Institute of Design Ahmedabad", "Ahmedabad", "Gujarat", "Govt"],
    ["National Institute of Design Gandhinagar", "Gandhinagar", "Gujarat", "Govt"],
    ["National Institute of Design Bengaluru", "Bengaluru", "Karnataka", "Govt"],
    ["National Institute of Design Kurukshetra", "Kurukshetra", "Haryana", "Govt"],
    ["National Institute of Fashion Technology Delhi", "New Delhi", "Delhi", "Govt"],
    ["National Institute of Fashion Technology Mumbai", "Mumbai", "Maharashtra", "Govt"],
    ["National Institute of Fashion Technology Bengaluru", "Bengaluru", "Karnataka", "Govt"],
    ["National Institute of Fashion Technology Kolkata", "Kolkata", "West Bengal", "Govt"],
    ["National Institute of Fashion Technology Chennai", "Chennai", "Tamil Nadu", "Govt"],
    ["National Institute of Fashion Technology Hyderabad", "Hyderabad", "Telangana", "Govt"],
    ["Srishti Manipal Institute of Art Design and Technology", "Bengaluru", "Karnataka", "Private"],
    ["MIT Institute of Design Pune", "Pune", "Maharashtra", "Private"],
    ["Pearl Academy Delhi", "New Delhi", "Delhi", "Private"],
    ["Pearl Academy Mumbai", "Mumbai", "Maharashtra", "Private"],
    ["Symbiosis Institute of Design", "Pune", "Maharashtra", "Private"],
    ["DJ Academy of Design", "Coimbatore", "Tamil Nadu", "Private"],
    ["Indian Institute of Crafts and Design", "Jaipur", "Rajasthan", "Govt"],
    ["Arch College of Design and Business", "Jaipur", "Rajasthan", "Private"],
  ];
  for (const [name, city, state, type] of designColleges) {
    addCollege(name, city, state, "design", rand() < 0.4 ? 1 : 2 as 1 | 2, type);
  }

  // ── Additional Private/Deemed Engineering (to reach 300+) ──
  const additionalEngineering: [string, string, string, CollegeType][] = [
    ["Amrita Vishwa Vidyapeetham", "Coimbatore", "Tamil Nadu", "Deemed"],
    ["Dhirubhai Ambani Institute of Information and Communication Technology", "Gandhinagar", "Gujarat", "Private"],
    ["International Institute of Information Technology Hyderabad", "Hyderabad", "Telangana", "Deemed"],
    ["IIIT Bangalore", "Bengaluru", "Karnataka", "Deemed"],
    ["Motilal Nehru National Institute of Technology", "Allahabad", "Uttar Pradesh", "Govt"],
    ["Maulana Abul Kalam Azad University of Technology", "Kolkata", "West Bengal", "Govt"],
    ["Cochin University of Science and Technology", "Kochi", "Kerala", "Govt"],
    ["Osmania University College of Engineering", "Hyderabad", "Telangana", "Govt"],
    ["University Visvesvaraya College of Engineering", "Bengaluru", "Karnataka", "Govt"],
    ["Jamia Millia Islamia Faculty of Engineering", "New Delhi", "Delhi", "Govt"],
    ["Aligarh Muslim University Faculty of Engineering", "Aligarh", "Uttar Pradesh", "Govt"],
    ["Sardar Vallabhbhai National Institute of Technology", "Surat", "Gujarat", "Govt"],
    ["Malaviya National Institute of Technology", "Jaipur", "Rajasthan", "Govt"],
    ["Madan Mohan Malaviya University of Technology", "Gorakhpur", "Uttar Pradesh", "Govt"],
    ["Harcourt Butler Technical University", "Kanpur", "Uttar Pradesh", "Govt"],
    ["Rajasthan Technical University", "Kota", "Rajasthan", "Govt"],
    ["Visvesvaraya Technological University", "Belagavi", "Karnataka", "Govt"],
    ["APJ Abdul Kalam Technological University", "Thiruvananthapuram", "Kerala", "Govt"],
    ["Savitribai Phule Pune University", "Pune", "Maharashtra", "Govt"],
    ["Bharathiar University", "Coimbatore", "Tamil Nadu", "Govt"],
    ["SRM University AP", "Vijayawada", "Andhra Pradesh", "Private"],
    ["Woxsen University", "Hyderabad", "Telangana", "Private"],
    ["FLAME University", "Pune", "Maharashtra", "Private"],
    ["Ashoka University", "Sonipat", "Haryana", "Private"],
    ["Plaksha University", "Mohali", "Punjab", "Private"],
  ];
  for (const [name, city, state, type] of additionalEngineering) {
    addCollege(name, city, state, "engineering", rand() < 0.4 ? 1 : 2 as 1 | 2, type);
  }

  // ── Additional Medical Colleges ──
  const additionalMedical: [string, string, string, CollegeType][] = [
    ["Madras Medical College", "Chennai", "Tamil Nadu", "Govt"],
    ["BJ Medical College", "Ahmedabad", "Gujarat", "Govt"],
    ["Stanley Medical College", "Chennai", "Tamil Nadu", "Govt"],
    ["Osmania Medical College", "Hyderabad", "Telangana", "Govt"],
    ["Government Medical College Kozhikode", "Kozhikode", "Kerala", "Govt"],
    ["Government Medical College Thiruvananthapuram", "Thiruvananthapuram", "Kerala", "Govt"],
    ["Rajendra Institute of Medical Sciences", "Ranchi", "Jharkhand", "Govt"],
    ["Indira Gandhi Medical College", "Shimla", "Himachal Pradesh", "Govt"],
    ["Pt Jawaharlal Nehru Memorial Medical College", "Raipur", "Chhattisgarh", "Govt"],
    ["Calcutta Medical College", "Kolkata", "West Bengal", "Govt"],
  ];
  for (const [name, city, state, type] of additionalMedical) {
    addCollege(name, city, state, "medicine", rand() < 0.3 ? 1 : 2 as 1 | 2, type);
  }

  // ── Additional Management Institutes ──
  const additionalManagement: [string, string, string][] = [
    ["Jamnalal Bajaj Institute of Management Studies", "Mumbai", "Maharashtra"],
    ["Indian School of Business", "Hyderabad", "Telangana"],
    ["Narsee Monjee Institute of Management Studies", "Mumbai", "Maharashtra"],
    ["Welingkar Institute of Management", "Mumbai", "Maharashtra"],
    ["Christ University Institute of Management", "Bengaluru", "Karnataka"],
    ["Xavier Institute of Management Bhubaneswar", "Bhubaneswar", "Odisha"],
    ["KJ Somaiya Institute of Management", "Mumbai", "Maharashtra"],
    ["Bharathidasan Institute of Management", "Tiruchirappalli", "Tamil Nadu"],
    ["Institute of Management Nirma University", "Ahmedabad", "Gujarat"],
    ["Fore School of Management", "New Delhi", "Delhi"],
  ];
  for (const [name, city, state] of additionalManagement) {
    addCollege(name, city, state, "management", rand() < 0.3 ? 1 : 2 as 1 | 2, "Private");
  }

  return specs;
}

// ─── Fee generation by discipline & tier ─────────────────────────────────────

function generateFees(
  discipline: CollegeSpec["discipline"],
  tier: CollegeSpec["tier"],
  type: CollegeType
): number {
  // Returns total program fees in INR
  const base: Record<string, Record<number, [number, number]>> = {
    engineering: { 1: [200000, 1000000], 2: [150000, 600000], 3: [80000, 400000] },
    medicine: { 1: [50000, 300000], 2: [500000, 1500000], 3: [1000000, 2500000] },
    management: { 1: [1000000, 2500000], 2: [500000, 1500000], 3: [200000, 800000] },
    law: { 1: [200000, 800000], 2: [300000, 1000000], 3: [100000, 500000] },
    design: { 1: [500000, 1500000], 2: [300000, 1000000], 3: [150000, 600000] },
  };

  const [min, max] = base[discipline][tier];
  let fees = randInt(min, max);

  // Govt colleges tend to be cheaper
  if (type === "Govt") {
    fees = Math.floor(fees * randFloat(0.3, 0.7));
  }

  // Round to nearest 5000
  return Math.round(fees / 5000) * 5000;
}

// ─── Placement data generation ───────────────────────────────────────────────

function generatePlacementData(
  discipline: CollegeSpec["discipline"],
  tier: CollegeSpec["tier"]
) {
  const packageRanges: Record<string, Record<number, { avg: [number, number]; high: [number, number]; pct: [number, number] }>> = {
    engineering: {
      1: { avg: [12, 25], high: [50, 250], pct: [85, 99] },
      2: { avg: [6, 14], high: [20, 80], pct: [70, 95] },
      3: { avg: [3, 8], high: [10, 30], pct: [50, 85] },
    },
    medicine: {
      1: { avg: [8, 15], high: [20, 50], pct: [90, 100] },
      2: { avg: [5, 10], high: [12, 30], pct: [80, 95] },
      3: { avg: [3, 7], high: [8, 20], pct: [60, 85] },
    },
    management: {
      1: { avg: [20, 35], high: [50, 150], pct: [95, 100] },
      2: { avg: [10, 22], high: [25, 60], pct: [80, 98] },
      3: { avg: [5, 12], high: [12, 30], pct: [60, 90] },
    },
    law: {
      1: { avg: [12, 25], high: [30, 80], pct: [85, 100] },
      2: { avg: [6, 14], high: [15, 40], pct: [65, 90] },
      3: { avg: [3, 8], high: [8, 20], pct: [45, 75] },
    },
    design: {
      1: { avg: [8, 18], high: [25, 60], pct: [80, 98] },
      2: { avg: [5, 12], high: [15, 35], pct: [60, 90] },
      3: { avg: [3, 7], high: [8, 20], pct: [40, 75] },
    },
  };

  const range = packageRanges[discipline][tier];
  const years = [2023, 2024, 2025, 2026];
  const recruiters = DISCIPLINE_RECRUITERS[discipline];

  return years.map((year, idx) => {
    // Slight upward trend year over year
    const trendMultiplier = 1 + idx * randFloat(0.02, 0.06);
    const avgPkg = randFloat(range.avg[0], range.avg[1]) * trendMultiplier;
    const medianPkg = avgPkg * randFloat(0.75, 0.95);
    const highPkg = randFloat(range.high[0], range.high[1]) * trendMultiplier;
    const pct = Math.min(100, randFloat(range.pct[0], range.pct[1]) + idx * randFloat(0, 2));

    return {
      year,
      highestPackageLpa: parseFloat(highPkg.toFixed(2)),
      averagePackageLpa: parseFloat(avgPkg.toFixed(2)),
      medianPackageLpa: parseFloat(medianPkg.toFixed(2)),
      placementPercentage: parseFloat(pct.toFixed(1)),
      topRecruiters: pickN(recruiters, randInt(5, 10)),
    };
  });
}

// ─── Review generation ───────────────────────────────────────────────────────

function generateReviews(tier: CollegeSpec["tier"], count: number) {
  const reviews = [];

  for (let i = 0; i < count; i++) {
    const sentiment = rand();
    let overallBias: number;
    let title: string;
    let body: string;

    if (tier === 1) {
      // Tier 1: mostly positive
      if (sentiment < 0.65) {
        overallBias = randFloat(4.0, 5.0);
        title = pick(REVIEW_TITLES_POSITIVE);
        body = pick(REVIEW_BODIES_POSITIVE);
      } else if (sentiment < 0.9) {
        overallBias = randFloat(3.0, 4.2);
        title = pick(REVIEW_TITLES_MIXED);
        body = pick(REVIEW_BODIES_MIXED);
      } else {
        overallBias = randFloat(2.0, 3.5);
        title = pick(REVIEW_TITLES_NEGATIVE);
        body = pick(REVIEW_BODIES_NEGATIVE);
      }
    } else if (tier === 2) {
      // Tier 2: mixed
      if (sentiment < 0.4) {
        overallBias = randFloat(3.5, 4.8);
        title = pick(REVIEW_TITLES_POSITIVE);
        body = pick(REVIEW_BODIES_POSITIVE);
      } else if (sentiment < 0.8) {
        overallBias = randFloat(2.5, 3.8);
        title = pick(REVIEW_TITLES_MIXED);
        body = pick(REVIEW_BODIES_MIXED);
      } else {
        overallBias = randFloat(1.5, 3.0);
        title = pick(REVIEW_TITLES_NEGATIVE);
        body = pick(REVIEW_BODIES_NEGATIVE);
      }
    } else {
      // Tier 3: more mixed/negative
      if (sentiment < 0.25) {
        overallBias = randFloat(3.2, 4.5);
        title = pick(REVIEW_TITLES_POSITIVE);
        body = pick(REVIEW_BODIES_POSITIVE);
      } else if (sentiment < 0.65) {
        overallBias = randFloat(2.0, 3.5);
        title = pick(REVIEW_TITLES_MIXED);
        body = pick(REVIEW_BODIES_MIXED);
      } else {
        overallBias = randFloat(1.0, 2.8);
        title = pick(REVIEW_TITLES_NEGATIVE);
        body = pick(REVIEW_BODIES_NEGATIVE);
      }
    }

    // Individual ratings cluster around overall but vary
    const jitter = () => Math.max(1, Math.min(5, overallBias + randFloat(-0.8, 0.8)));

    reviews.push({
      authorName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      batchYear: randInt(2019, 2025),
      ratingOverall: parseFloat(Math.max(1, Math.min(5, overallBias)).toFixed(1)),
      ratingAcademics: parseFloat(jitter().toFixed(1)),
      ratingInfrastructure: parseFloat(jitter().toFixed(1)),
      ratingPlacements: parseFloat(jitter().toFixed(1)),
      ratingFaculty: parseFloat(jitter().toFixed(1)),
      title,
      body,
      createdAt: new Date(
        2023 + Math.floor(rand() * 3),
        Math.floor(rand() * 12),
        Math.floor(rand() * 28) + 1
      ),
    });
  }

  return reviews;
}

// ─── Cutoff generation ───────────────────────────────────────────────────────

function generateCutoffs(
  courseId: number,
  exam: string,
  tier: CollegeSpec["tier"]
) {
  const categories: Category[] = ["General", "OBC", "SC", "ST", "EWS"];
  const years = [2023, 2024, 2025, 2026];

  // Base closing rank depends on tier
  const baseRanks: Record<number, [number, number]> = {
    1: [100, 5000],
    2: [3000, 30000],
    3: [15000, 100000],
  };

  // Exam-specific multiplier (NEET ranks go higher, JEE lower)
  const examMultiplier: Record<string, number> = {
    "JEE Main": 1,
    "JEE Advanced": 0.5,
    "GATE": 0.3,
    "NEET UG": 3,
    "NEET PG": 2,
    "CAT": 0.5,
    "XAT": 0.6,
    "CLAT": 1.5,
    "CLAT PG": 0.8,
    "UCEED": 0.4,
    "CEED": 0.3,
    "NIFT": 0.6,
    "CUET": 2,
  };

  const multiplier = examMultiplier[exam] || 1;
  const cutoffs = [];

  for (const year of years) {
    for (const category of categories) {
      const [minRank, maxRank] = baseRanks[tier];
      let baseClosing = randInt(
        Math.floor(minRank * multiplier),
        Math.floor(maxRank * multiplier)
      );

      // Category-wise relaxation
      const categoryMultiplier: Record<Category, number> = {
        General: 1,
        EWS: 1.2,
        OBC: 1.5,
        SC: 2.5,
        ST: 3.5,
      };

      baseClosing = Math.floor(baseClosing * categoryMultiplier[category]);

      // Opening rank is tighter than closing
      const openingRank = Math.max(1, Math.floor(baseClosing * randFloat(0.3, 0.7)));

      // Slight variation year-to-year
      const yearVariation = 1 + (year - 2025) * randFloat(-0.05, 0.05);
      const closingRank = Math.max(
        openingRank + 1,
        Math.floor(baseClosing * yearVariation)
      );

      cutoffs.push({
        courseId,
        exam,
        category,
        year,
        openingRank,
        closingRank,
      });
    }
  }

  return cutoffs;
}

// ─── About text generation ───────────────────────────────────────────────────

function generateAbout(spec: CollegeSpec, establishedYear: number): string {
  const disciplineNames: Record<string, string> = {
    engineering: "engineering and technology",
    medicine: "medical sciences",
    management: "management and business administration",
    law: "legal studies",
    design: "design and creative arts",
  };

  return `${spec.name} is a premier ${spec.type === "Govt" ? "government-funded" : spec.type === "Deemed" ? "deemed" : "private"} institution located in ${spec.city}, ${spec.state}. Established in ${establishedYear}, the institution has been at the forefront of ${disciplineNames[spec.discipline]} education in India.

The institution is known for its rigorous academic programs, distinguished faculty, and strong industry connections. With a focus on both theoretical foundations and practical application, graduates are well-prepared for careers in their chosen fields.

The campus features modern infrastructure including well-equipped laboratories, a comprehensive library, sports facilities, and comfortable hostel accommodation. The institution actively promotes research and innovation through various centers of excellence and industry partnerships.

Students benefit from a vibrant campus life with numerous clubs, societies, and annual festivals that contribute to their holistic development. The strong alumni network spanning across industries provides valuable mentorship and career opportunities to current students.`;
}

// ─── Main seed function ──────────────────────────────────────────────────────

async function main() {
  console.log("Starting seed...\n");

  // Clean existing data
  console.log("Cleaning existing data...");
  await prisma.cutoff.deleteMany();
  await prisma.review.deleteMany();
  await prisma.placement.deleteMany();
  await prisma.course.deleteMany();
  await prisma.savedCollege.deleteMany();
  await prisma.savedComparison.deleteMany();
  await prisma.college.deleteMany();
  console.log("Done.\n");

  const specs = generateCollegeSpecs();
  console.log(`Generated ${specs.length} college specifications.\n`);

  let totalCourses = 0;
  let totalPlacements = 0;
  let totalReviews = 0;
  let totalCutoffs = 0;

  // Track used slugs for uniqueness
  const usedSlugs = new Set<string>();

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];

    if ((i + 1) % 50 === 0) {
      console.log(`  Seeding college ${i + 1}/${specs.length}...`);
    }

    // Generate base slug, ensure uniqueness
    let baseSlug = slugify(spec.name);
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    usedSlugs.add(slug);

    const establishedYear = spec.tier === 1
      ? randInt(1900, 1990)
      : spec.tier === 2
        ? randInt(1960, 2010)
        : randInt(1990, 2020);

    const campusAcres = spec.type === "Govt"
      ? randFloat(50, 800)
      : randFloat(10, 200);

    const naacGrade = rand() < 0.8
      ? pick(
          spec.tier === 1
            ? (["A++", "A+", "A"] as const)
            : spec.tier === 2
              ? (["A+", "A", "B++", "B+"] as const)
              : (["B+", "B", "B++", "C"] as const)
        )
      : null;

    // NIRF rank — not all colleges are ranked
    let nirfRank: number | null = null;
    if (rand() < (spec.tier === 1 ? 0.95 : spec.tier === 2 ? 0.7 : 0.3)) {
      nirfRank = spec.tier === 1
        ? randInt(1, 50)
        : spec.tier === 2
          ? randInt(30, 150)
          : randInt(100, 300);
    }

    // Generate courses
    const courseCandidates = DISCIPLINE_COURSES[spec.discipline];
    const numCourses = randInt(3, Math.min(8, courseCandidates.length));
    const selectedCourses = pickN(courseCandidates, numCourses);

    const coursesData = selectedCourses.map((ct) => {
      const totalFees = generateFees(spec.discipline, spec.tier, spec.type);
      const totalSeats = spec.type === "Govt"
        ? randInt(30, 180)
        : randInt(60, 300);

      // For top IITs, JEE Advanced; others JEE Main
      let exam = ct.exam;
      if (spec.discipline === "engineering" && spec.tier === 1 && spec.name.includes("Indian Institute of Technology")) {
        exam = ct.degreeLevel === "UG" ? "JEE Advanced" : "GATE";
      }

      return {
        name: ct.name,
        degreeLevel: ct.degreeLevel,
        branch: ct.branch,
        durationYears: ct.durationYears,
        totalSeats,
        totalFees,
        examAccepted: exam,
      };
    });

    // Calculate min/max fees across courses
    const allFees = coursesData.map((c) => c.totalFees);
    const minFeesTotal = Math.min(...allFees);
    const maxFeesTotal = Math.max(...allFees);

    // Generate reviews
    const reviewCount = randInt(5, 15);
    const reviewsData = generateReviews(spec.tier, reviewCount);

    // Calculate avg rating from reviews
    const avgRating = parseFloat(
      (reviewsData.reduce((sum, r) => sum + r.ratingOverall, 0) / reviewsData.length).toFixed(1)
    );

    // Generate placement data
    const placementsData = generatePlacementData(spec.discipline, spec.tier);

    // Create college with courses, placements, reviews
    const college = await prisma.college.create({
      data: {
        slug,
        name: spec.name,
        shortName: spec.shortName,
        city: spec.city,
        state: spec.state,
        type: spec.type,
        establishedYear,
        campusAcres,
        hostelAvailable: rand() < 0.9,
        naacGrade,
        nirfRank,
        avgRating,
        reviewCount,
        minFeesTotal,
        maxFeesTotal,
        logoUrl: null,
        coverUrl: null,
        aboutMd: generateAbout(spec, establishedYear),
        courses: {
          create: coursesData,
        },
        placements: {
          create: placementsData,
        },
        reviews: {
          create: reviewsData,
        },
      },
      include: {
        courses: true,
      },
    });

    totalCourses += coursesData.length;
    totalPlacements += placementsData.length;
    totalReviews += reviewCount;

    // Generate cutoffs for each course
    for (const course of college.courses) {
      const cutoffs = generateCutoffs(
        course.id,
        course.examAccepted,
        spec.tier
      );

      // Batch insert cutoffs
      await prisma.cutoff.createMany({
        data: cutoffs.map((c) => ({
          ...c,
          collegeId: college.id,
        })),
      });

      totalCutoffs += cutoffs.length;
    }
  }

  console.log("\n=== Seed Complete ===\n");

  // Report counts
  const counts = {
    colleges: await prisma.college.count(),
    courses: await prisma.course.count(),
    placements: await prisma.placement.count(),
    reviews: await prisma.review.count(),
    cutoffs: await prisma.cutoff.count(),
    savedColleges: await prisma.savedCollege.count(),
    savedComparisons: await prisma.savedComparison.count(),
  };

  console.log("Row counts per table:");
  console.log("─".repeat(40));
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(20)} ${count.toString().padStart(8)}`);
  }
  console.log("─".repeat(40));

  // Print 3 sample joined records
  console.log("\n=== Sample Joined Records ===\n");

  const samples = await prisma.college.findMany({
    take: 3,
    orderBy: { nirfRank: "asc" },
    where: { nirfRank: { not: null } },
    include: {
      courses: { take: 2 },
      placements: { take: 1, orderBy: { year: "desc" } },
      reviews: { take: 1, orderBy: { createdAt: "desc" } },
      cutoffs: { take: 2 },
    },
  });

  for (const college of samples) {
    console.log(`\n${"━".repeat(60)}`);
    console.log(`College: ${college.name}`);
    console.log(`  Slug: ${college.slug}`);
    console.log(`  Location: ${college.city}, ${college.state}`);
    console.log(`  Type: ${college.type} | Est: ${college.establishedYear} | NAAC: ${college.naacGrade}`);
    console.log(`  NIRF Rank: ${college.nirfRank} | Rating: ${college.avgRating}/5 (${college.reviewCount} reviews)`);
    console.log(`  Fees: ₹${(college.minFeesTotal / 100000).toFixed(1)}L — ₹${(college.maxFeesTotal / 100000).toFixed(1)}L`);

    if (college.courses.length > 0) {
      console.log(`  Courses (showing ${college.courses.length}):`);
      for (const c of college.courses) {
        console.log(`    - ${c.name} (${c.degreeLevel}, ${c.durationYears}yr, ₹${(c.totalFees / 100000).toFixed(1)}L, ${c.examAccepted})`);
      }
    }

    if (college.placements.length > 0) {
      const p = college.placements[0];
      console.log(`  Latest Placement (${p.year}):`);
      console.log(`    Avg: ₹${p.averagePackageLpa}L | Median: ₹${p.medianPackageLpa}L | Highest: ₹${p.highestPackageLpa}L | ${p.placementPercentage}%`);
      console.log(`    Top Recruiters: ${p.topRecruiters.slice(0, 5).join(", ")}`);
    }

    if (college.reviews.length > 0) {
      const r = college.reviews[0];
      console.log(`  Latest Review: "${r.title}" by ${r.authorName} (${r.ratingOverall}/5)`);
    }

    if (college.cutoffs.length > 0) {
      console.log(`  Sample Cutoffs:`);
      for (const co of college.cutoffs) {
        console.log(`    - ${co.exam} ${co.category} ${co.year}: Opening ${co.openingRank}, Closing ${co.closingRank}`);
      }
    }
  }

  console.log(`\n${"━".repeat(60)}\n`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
