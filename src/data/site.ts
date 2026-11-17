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

export const projects = [
  { name: "SimFree", group: "Travel eSIM", description: "Backend for a global travel eSIM platform covering 200+ countries and 800+ networks. Redis cache windows with tag invalidation and an eight-day idempotency window for Stripe and BTCPay webhooks.", tags: ["NestJS", "Redis", "Stripe", "BTCPay"] },
  { name: "LeadPylot email service", group: "CRM · email", description: "IMAP mailbox sync, Gmail OAuth, SMTP delivery, approvals, and inbound-email lead creation. Includes duplicate-import protection and quarantine and replay for failed imports.", tags: ["IMAP", "OAuth", "Redis"] },
  { name: "VisaRoles", group: "Jobs · data", description: "A job platform for 76,000 users. Six NHS job boards feed into a 39-field PostgreSQL record, with Stripe HMAC verification and shared Zod schemas.", tags: ["PostgreSQL", "Zod", "Vitest"] },
  { name: "PrepCirca", group: "Learning · real time", description: "WebRTC calling for sessions of 50+ concurrent participants, including camera and microphone recovery.", tags: ["WebRTC", "Node.js"] },
  { name: "HRM and client portals", group: "Internal products", description: "Two products built end to end at Dashur AI, supported by API and database optimization and multi-region AWS hosting.", tags: ["Node.js", "AWS"] },
  { name: "InvestBank", group: "Fintech", description: "React, Vite, and Expo applications on Express and PostgreSQL, with JWT, roles, and Zod validation for money movement and IBANs.", tags: ["Expo", "JWT", "Zod"] },
  { name: "Job Engineer", group: "Hiring tools", description: "A Next.js and NestJS monorepo with a dashboard, API, BullMQ worker, Chrome extension, resume scoring, and email workflows.", tags: ["Clerk", "Prisma", "BullMQ"] },
  { name: "Chilahati Archive", group: "Community · publishing", description: "A Next.js and Firestore archive with Bengali rich text, 14 categories, search, and moderated submissions.", tags: ["Firebase", "Next.js"] },
  { name: "Shomajgori Foundation", group: "Nonprofit · commerce", description: "WordPress theme and page-builder customization, WooCommerce storefront interfaces, and production fixes.", tags: ["WordPress", "WooCommerce"] },
];

export const journey = [
  { period: "2026 to now", title: "Full Stack Engineer", place: "Digital Pylot · Dhaka", current: true, body: "I own backends for eSIM, hosting and admin tools, CRM, email systems, and card-payment integrations. I also review and ship code across the team.", tags: ["NestJS", "Redis", "Stripe", "BTCPay", "CI/CD"] },
  { period: "2023 to 2026", title: "Software Engineer", place: "Dashur AI · United States, remote", body: "Built fintech dashboards and WebRTC calling for 50+ participants, HRM and client portals, multi-region EC2 infrastructure on AWS, and API and database improvements.", tags: ["Next.js", "Node.js", "AWS", "WebRTC", "PostgreSQL"] },
  { period: "2022", title: "Frontend Developer", place: "Damaska Digital · Australia, remote", body: "Built client sites with React, Vue, and WordPress. Frontend performance work cut page-load time by 30%.", tags: ["React", "Vue", "WordPress", "WooCommerce"] },
  { period: "2019 to 2020", title: "BSc and MSc in Botany", place: "Government Titumir College", body: "Studying living systems taught me to observe first and respect how small parts affect the whole. Software gave me a way to build and test those ideas.", tags: ["Botany"] },
];

export const drafts = [
  { slug: "payments-that-can-be-retried", title: "Designing payment flows that can be retried", summary: "A draft on idempotency, webhook verification, and keeping payment state consistent across retries.", readTime: "6 min read", paragraphs: [
    "Payment systems have to expect repetition. A network can fail after a provider accepts a request, and a webhook can arrive more than once. Treating every delivery as a new event makes duplicate work likely.",
    "In the SimFree backend, payment webhooks use an eight-day idempotency window. That detail sits beside verification and catalog caching: a provider event should be checked, recorded, and applied in a way that remains safe if the same event is seen again.",
    "A useful starting point is to give each provider event a stable identity, verify its signature before changing state, and make the state transition conditional on what the system has already recorded. Retries then become a recovery path rather than a second payment.",
    "This is an unpublished draft based on project notes. It needs review before it is presented as a final technical article."
  ] },
  { slug: "email-imports-that-recover", title: "Email imports need a recovery path", summary: "A draft about duplicate protection, quarantine, and replay in a mailbox sync workflow.", readTime: "5 min read", paragraphs: [
    "Mailbox sync is not a one-time import. Messages can be retried, providers can return incomplete data, and an operator sometimes needs to understand why a record did not arrive.",
    "The LeadPylot email service combines IMAP sync with Gmail OAuth, SMTP delivery, approvals, and inbound-email lead creation. Its import workflow includes duplicate protection plus quarantine and replay for failed imports.",
    "Those pieces make failures easier to inspect and recover from. A quarantine keeps a problematic item from silently disappearing into the happy path; replay gives the system a deliberate way to try again after the cause is understood.",
    "This is an unpublished draft based on project notes. It needs review before it is presented as a final technical article."
  ] },
];
