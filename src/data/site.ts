export const site = {
  name: "Md Abul Hasnat Saad",
  shortName: "Saad",
  url: "https://saadsrabon.com",
  email: "saadsrabon2@gmail.com",
  location: "Dhaka, Bangladesh",
  github: "https://github.com/saadsrabon",
  linkedin: "https://www.linkedin.com/in/abul-hasnat-saad/",
  role: "Full stack engineer",
  availability: "Open to remote roles and projects",
  intro: "I build products from the first screen to the payment webhook.",
  description: "Full stack engineer in Dhaka, Bangladesh. Building fintech, eSIM, CRM, and real-time products with teams across the US and Australia.",
};

export const concepts = [
  {
    slug: "sunova",
    name: "Sunova",
    category: "Clean energy",
    label: "Independent design concept",
    url: "https://sunova-landing.vercel.app/",
    summary: "A solar-energy landing page concept that brings residential and commercial solutions, illustrated impact stories, and a clear path to get in touch into one bright, nature-led site.",
    desktopImage: "/images/concepts/sunova-desktop.webp",
    mobileImage: "/images/concepts/sunova-mobile.webp",
    note: "The live page labels its energy output and savings as illustrative; the community stories are fictional. No measured business results are claimed here.",
    sections: ["Residential and commercial solar solution sections", "An illustrative energy-performance panel", "Concept stories and FAQs"],
  },
  {
    slug: "atacama",
    name: "Atacama",
    category: "Nature and climate",
    label: "Independent design concept",
    url: "https://atacama-landing-lemon.vercel.app/",
    summary: "A concept community site about conservation and climate, with a vivid desert-led visual identity, initiative listings, environmental explainers, and a newsletter section.",
    desktopImage: "/images/concepts/atacama-desktop.webp",
    mobileImage: "/images/concepts/atacama-mobile.webp",
    note: "Atacama identifies itself as a concept website. Its initiatives are illustrative; this page does not present them as verified events or environmental outcomes.",
    sections: ["Mission and environmental topic sections", "Concept initiative listings", "Newsletter and contact areas"],
  },
  {
    slug: "mindora",
    name: "Mindora",
    category: "Wellbeing",
    label: "Independent design concept",
    url: "https://mindora-landing-one.vercel.app/",
    summary: "A mental-wellbeing service concept with a calm editorial opening, a guided support journey, searchable illustrative profiles, and example pricing.",
    desktopImage: "/images/concepts/mindora-desktop.webp",
    mobileImage: "/images/concepts/mindora-mobile.webp",
    note: "The live concept labels its profiles as illustrative and not a directory of practicing clinicians. Pricing is an example; no service is sold or payment collected.",
    sections: ["A four-step support journey", "Illustrative profile filters and cards", "Example pricing and resource sections"],
  },
  {
    slug: "luxxera",
    name: "Luxxera",
    category: "Care discovery",
    label: "Independent design concept",
    url: "https://luxxera-landing.vercel.app/",
    summary: "A hair-transplant discovery concept focused on treatment information, questions to ask, and a considered care journey rather than clinic listings.",
    desktopImage: "/images/concepts/luxxera-desktop.webp",
    mobileImage: "/images/concepts/luxxera-mobile.webp",
    note: "The live concept states that it is not a medical provider and collects no bookings or patient data. Its clinic spaces are illustrative, not listings or testimonials.",
    sections: ["Treatment information and guided questions", "A care journey and FAQ section", "Illustrative spaces, not clinic listings"],
  },
];

export const projects = [
  { slug: "simfree", name: "SimFree", url: "https://simfree.io/en", group: "Travel eSIM", description: "Backend for a global travel eSIM platform covering 200+ countries and 800+ networks. Redis cache windows with tag invalidation and an eight-day idempotency window for Stripe and BTCPay webhooks.", tags: ["NestJS", "Redis", "Stripe", "BTCPay"] },
  { slug: "leadpylot-email-service", name: "LeadPylot email service", group: "CRM · email", description: "IMAP mailbox sync, Gmail OAuth, SMTP delivery, approvals, and inbound-email lead creation. Includes duplicate-import protection and quarantine and replay for failed imports.", tags: ["IMAP", "OAuth", "Redis"] },
  { slug: "visaroles", name: "VisaRoles", group: "Jobs · data", description: "A job platform for 76,000 users. Six NHS job boards feed into a 39-field PostgreSQL record, with Stripe HMAC verification and shared Zod schemas.", tags: ["PostgreSQL", "Zod", "Vitest"] },
  { slug: "prepcirca", name: "PrepCirca", group: "Learning · real time", description: "WebRTC calling for sessions of 50+ concurrent participants, including camera and microphone recovery.", tags: ["WebRTC", "Node.js"] },
  { slug: "hrm-and-client-portals", name: "HRM and client portals", group: "Internal products", description: "Two products built end to end at Dashur AI, supported by API and database optimization and multi-region AWS hosting.", tags: ["Node.js", "AWS"] },
  { slug: "investbank", name: "InvestBank", group: "Fintech", description: "React, Vite, and Expo applications on Express and PostgreSQL, with JWT, roles, and Zod validation for money movement and IBANs.", tags: ["Expo", "JWT", "Zod"] },
  { slug: "job-engineer", name: "Job Engineer", url: "https://job-engineer-landing-7mxt.vercel.app/", group: "Hiring tools", description: "A Next.js and NestJS monorepo with a dashboard, API, BullMQ worker, Chrome extension, resume scoring, and email workflows.", tags: ["Clerk", "Prisma", "BullMQ"] },
  { slug: "chilahati-archive", name: "Chilahati Archive", group: "Community · publishing", description: "A Next.js and Firestore archive with Bengali rich text, 14 categories, search, and moderated submissions.", tags: ["Firebase", "Next.js"] },
  { slug: "shomajgori-foundation", name: "Shomajgori Foundation", url: "https://shomajgori.org/", group: "Nonprofit · commerce", description: "WordPress theme and page-builder customization, WooCommerce storefront interfaces, and production fixes.", tags: ["WordPress", "WooCommerce"] },
];

export const conceptProjects = concepts.map((project) => ({
  ...project,
  tags: [project.category, "Responsive landing page"],
  type: "Independent concept",
  role: "Independent design and frontend concept",
  gallery: [
    { src: project.desktopImage, alt: `${project.name} live concept page, captured at desktop width`, label: "Desktop view" },
    { src: project.mobileImage, alt: `${project.name} live concept page, captured at mobile width`, label: "Mobile view" },
  ],
  process: [
    "Explored a clear visual direction for the subject and audience.",
    "Organized the page around the questions a visitor would need answered.",
    "Built a responsive concept and reviewed the live desktop and mobile experience.",
  ],
}));

const caseNarratives = {
  simfree: {
    role: "Backend engineering",
    problem: "A travel eSIM service has to make plans easy to discover while coordinating multiple providers, payment methods, and asynchronous payment callbacks.",
    solution: "Built backend support for the destination and plan catalogue with Redis cache windows and tag invalidation. Stripe and BTCPay webhook handling uses an eight-day idempotency window to safely recognize retries.",
    impact: "The platform supports coverage across 200+ countries and 800+ networks. Payment callbacks can be retried without repeating the same operation during the idempotency window.",
  },
  "leadpylot-email-service": {
    role: "Email pipeline engineering",
    problem: "Lead information arrives through connected mailboxes, so imports need to handle OAuth, duplicate messages, delivery and failures without losing an operator’s ability to recover.",
    solution: "Implemented IMAP mailbox sync, Gmail OAuth, SMTP delivery, approval steps and inbound-email lead creation, with duplicate-import protection and quarantine/replay for failed imports.",
    impact: "The workflow connects mailbox activity to CRM leads and gives operators a recovery path for imports that fail, while preventing the same message from being imported twice.",
  },
  visaroles: {
    role: "Data platform engineering",
    problem: "Job listings from multiple NHS boards need a consistent record shape before they can be searched and used across the platform.",
    solution: "Connected six NHS job boards to a shared 39-field PostgreSQL record and used shared Zod schemas and Stripe HMAC verification in the platform’s data and payment boundaries.",
    impact: "The job platform serves 76,000 users, with listings organized into a consistent 39-field structure from six source boards.",
  },
  prepcirca: {
    role: "Real-time product engineering",
    problem: "A live learning session becomes difficult to use when many participants join or a device’s camera or microphone drops out.",
    solution: "Built WebRTC calling for sessions with 50+ concurrent participants and added camera and microphone recovery paths.",
    impact: "Sessions support 50+ concurrent participants, and users have a recovery path when camera or microphone access is interrupted.",
  },
  "hrm-and-client-portals": {
    role: "Full-stack product engineering",
    problem: "HR operations and client-facing workflows needed dedicated products, supported by APIs and infrastructure that could serve users across regions.",
    solution: "Built two products end to end, improved API and database performance, and supported multi-region hosting on AWS.",
    impact: "The work brought HRM and client portal workflows into dedicated products backed by optimized APIs, databases and multi-region infrastructure.",
  },
  investbank: {
    role: "Fintech application engineering",
    problem: "Money-movement interfaces need consistent validation and access control across web and mobile clients and their API.",
    solution: "Built React, Vite and Expo applications on an Express and PostgreSQL backend, using JWT authentication, role-based access and Zod validation for payment details and IBANs.",
    impact: "The web and mobile clients share a backend with explicit role checks and validated money-movement and IBAN inputs.",
  },
  "job-engineer": {
    role: "Full-stack product engineering",
    problem: "A job-search product spans a candidate dashboard, browser workflow, resume evaluation and email tasks; those parts need to work together across web and background processing.",
    solution: "The product is organized as a Next.js and NestJS monorepo with a dashboard, API, BullMQ worker, Chrome extension, resume scoring and email workflows, using Clerk and Prisma.",
    impact: "Candidates can reach the platform’s dashboard, browser extension, resume scoring and email workflows as parts of one connected product. The public site presents this product as JobOS.",
  },
  "chilahati-archive": {
    role: "Full-stack archive engineering",
    problem: "A community archive needs to present Bengali writing clearly while helping visitors find material across topics and giving submissions a moderation path.",
    solution: "Built a Next.js and Firestore archive with Bengali rich text, 14 categories, search and moderated submissions.",
    impact: "The archive organizes content across 14 categories, supports search, and routes submissions through moderation.",
  },
  "shomajgori-foundation": {
    role: "WordPress and commerce engineering",
    problem: "The foundation’s public site combines informational pages with a WooCommerce storefront, so both the content system and shopping interfaces need to fit the organization’s site.",
    solution: "Customized the WordPress theme and page builder, shaped WooCommerce storefront interfaces and resolved production issues.",
    impact: "The work connects the foundation’s informational site and storefront within its WordPress experience, with production fixes supporting the live site.",
  },
};

export const caseStudies = projects.map((project) => ({
  ...project,
  type: "Selected product work",
  ...caseNarratives[project.slug as keyof typeof caseNarratives],
  gallery: [],
  process: [],
}));

export const journey = [
  { period: "2026 to now", title: "Full Stack Engineer", place: "Digital Pylot · Dhaka", current: true, body: "I own backends for eSIM, hosting and admin tools, CRM, email systems, and card-payment integrations. I also review and ship code across the team.", tags: ["NestJS", "Redis", "Stripe", "BTCPay", "CI/CD"] },
  { period: "2023 to 2026", title: "Software Engineer", place: "Dashur AI · United States, remote", body: "Built fintech dashboards and WebRTC calling for 50+ participants, HRM and client portals, multi-region EC2 infrastructure on AWS, and API and database improvements.", tags: ["Next.js", "Node.js", "AWS", "WebRTC", "PostgreSQL"] },
  { period: "2022", title: "Frontend Developer", place: "Damaska Digital · Australia, remote", body: "Built client sites with React, Vue, and WordPress. Frontend performance work cut page-load time by 30%.", tags: ["React", "Vue", "WordPress", "WooCommerce"] },
  { period: "2019 to 2020", title: "BSc and MSc in Botany", place: "Government Titumir College", body: "Studying living systems taught me to observe first and respect how small parts affect the whole. Software gave me a way to build and test those ideas.", tags: ["Botany"] },
];
