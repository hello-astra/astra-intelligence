import {
  Activity,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ChartColumnBig,
  ChartLine,
  ChartSpline,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Database,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Filter,
  Gauge,
  GitBranch,
  Globe,
  Headset,
  Layers,
  ListChecks,
  MessagesSquare,
  Package,
  PanelsTopLeft,
  PiggyBank,
  Radar,
  Receipt,
  ScanText,
  ShieldCheck,
  Sparkles,
  SquareKanban,
  Tags,
  Target,
  Truck,
  Users,
  UsersRound,
  Wallet,
  Webhook,
  Workflow,
} from 'lucide-react'
import type { Solution, SolutionSlug, SolutionSummary } from '@/types/content'
import { SOLUTION_INDEX } from './solution-index'

/** Long-form page content; identity fields (name, icon, colours…) come from ./solution-index.ts. */
type SolutionContent = Pick<Solution, 'slug' | 'description' | 'whatItIs' | 'whyItMatters' | 'capabilities' | 'problemsSolved' | 'technologies' | 'useCases' | 'deliverables'> & {
  demo: Pick<Solution['demo'], 'summary' | 'tryThis' | 'simulated'>
}

const CONTENT: SolutionContent[] = [
  {
    slug: 'saas-development',
    description:
      'Cloud-native SaaS products with tenant isolation, role-based access, subscription billing, usage metering and public APIs — built as a scalable foundation for your product.',
    whatItIs:
      'Custom SaaS development covers the full lifecycle of a subscription software product: multi-tenant architecture, authentication and authorization, plans and billing, usage metering, admin consoles and public APIs. We engineer the platform foundations so your team can focus on the features customers pay for.',
    whyItMatters: [
      'Off-the-shelf tools rarely fit a differentiated product or business model.',
      'Tenant isolation, roles and billing are hard to retrofit once customers are onboard.',
      'Usage-based pricing depends on accurate metering and transparent reporting.',
      'Enterprise buyers expect SSO, audit trails and API access from day one.',
    ],
    capabilities: [
      { title: 'Multi-tenant architecture', description: 'Isolated data and configuration per organization, on shared infrastructure.', icon: Building2 },
      { title: 'Roles & access control', description: 'Granular RBAC, invitations, SSO and audit logging for every workspace.', icon: ShieldCheck },
      { title: 'Subscriptions & billing', description: 'Plans, trials, upgrades, proration and invoices via your payment provider.', icon: CreditCard },
      { title: 'Usage metering & quotas', description: 'Track API calls, seats and storage; enforce limits and surface usage to customers.', icon: Gauge },
      { title: 'Admin consoles & portals', description: 'Internal operations consoles and self-service customer portals.', icon: PanelsTopLeft },
      { title: 'APIs, webhooks & integrations', description: 'Documented REST APIs, event webhooks and connectors to the tools customers use.', icon: Webhook },
    ],
    problemsSolved: [
      'Manual onboarding and provisioning of customer accounts',
      'No visibility into how each customer uses the product',
      'Pricing changes that require engineering work every time',
      'Security gaps from shared logins and missing permission levels',
    ],
    technologies: ['react', 'nextjs', 'typescript', 'nodejs', 'postgresql', 'redis', 'docker', 'aws'],
    useCases: [
      { industry: 'professional-services', title: 'Client portals', description: 'Per-client workspaces with permissions, documents and reporting.' },
      { industry: 'education', title: 'Multi-campus learning platforms', description: 'Plan-based features and isolated data for each institution.' },
      { industry: 'startups', title: 'MVP to scale-ready product', description: 'Launch quickly on foundations that support billing and growth.' },
      { industry: 'healthcare', title: 'Clinic management SaaS', description: 'Strict tenant isolation for patient and practice data.' },
    ],
    deliverables: [
      'Product architecture and multi-tenant data model',
      'Customer web application and internal admin console',
      'Authentication, RBAC and audit logging',
      'Subscription billing integration and usage metering',
      'Documented REST API and webhooks',
      'CI/CD pipeline, cloud deployment and monitoring',
    ],
    demo: {
      summary: 'A multi-tenant admin console with organizations, users and roles, subscription plans, usage metering and API integrations.',
      tryThis: [
        'Switch between Acme Technologies, Nova Retail and Vertex Solutions',
        'Invite a demo user and change their role',
        'Switch a subscription plan and watch quotas and MRR update',
        'Run a simulated integration health check',
      ],
      simulated: ['Billing and plan changes (no charges are made)', 'API keys and integration health checks', 'Invitation emails (none are sent)'],
    },
  },
  {
    slug: 'ecommerce-inventory',
    description:
      'Online stores connected to real-time inventory, order workflows, customer records and payment status — so what you sell is always what you have.',
    whatItIs:
      'We build commerce platforms where the customer-facing storefront and the operational back office share one source of truth: catalog, stock levels, orders, customers and payments. Every order reserves inventory, updates analytics and moves through a defined fulfilment workflow.',
    whyItMatters: [
      'Disconnected storefront and stock systems cause overselling and stock-outs.',
      'Orders tracked across spreadsheets and chat threads slow down fulfilment.',
      'Without unified data you cannot see which products and customers drive revenue.',
      'Growth into new channels and warehouses needs a system that scales with it.',
    ],
    capabilities: [
      { title: 'Product catalog', description: 'Products, categories, pricing and rich details managed in one place.', icon: Package },
      { title: 'Real-time inventory', description: 'Stock reserved at checkout, with reorder levels and low-stock alerts.', icon: Boxes },
      { title: 'Order workflows', description: 'Pending → processing → shipped → delivered, with cancellations and refunds.', icon: ClipboardList },
      { title: 'Customer records', description: 'Profiles, segments and full purchase history for every customer.', icon: UsersRound },
      { title: 'Payment status', description: 'Gateway integration with paid, pending, failed and refunded states.', icon: CreditCard },
      { title: 'Sales analytics', description: 'Revenue, order value and product performance that update with every sale.', icon: ChartColumnBig },
    ],
    problemsSolved: [
      'Overselling items that are already out of stock',
      'Delayed fulfilment from manual order tracking',
      'Time lost reconciling stock counts by hand',
      'Customer data scattered across channels',
    ],
    technologies: ['react', 'nextjs', 'nodejs', 'express', 'mongodb', 'redis', 'rest', 'aws'],
    useCases: [
      { industry: 'retail', title: 'D2C storefront', description: 'Branded store with warehouse-synced inventory and order tracking.' },
      { industry: 'manufacturing', title: 'B2B ordering portal', description: 'Distributors place orders against live stock and price lists.' },
      { industry: 'startups', title: 'Launch-ready commerce', description: 'A custom store and admin without platform lock-in.' },
      { industry: 'logistics', title: 'Multi-hub fulfilment', description: 'Order routing and status tracking across fulfilment hubs.' },
    ],
    deliverables: [
      'Storefront (web or PWA) and admin dashboard',
      'Inventory and order management backend',
      'Payment gateway integration',
      'Order notifications by email, SMS or WhatsApp',
      'Sales and inventory reporting',
      'Migration from existing catalogs and spreadsheets',
    ],
    demo: {
      summary: 'A storefront and admin back office sharing one dataset: catalog, inventory, orders, customers, payments and sales analytics.',
      tryThis: [
        'Place a simulated order from the storefront and watch stock and sales update',
        'Add or edit a product, or restock a low-stock item',
        'Move an order from Pending to Delivered',
        'Search and filter the catalog',
      ],
      simulated: ['Checkout and payments (no real transactions)', 'Customer notifications (none are sent)'],
    },
  },
  {
    slug: 'business-dashboards',
    description:
      'Interactive BI dashboards that unify sales, finance, customer and operational data into KPIs your teams can filter, explore and act on.',
    whatItIs:
      'Smart dashboards connect your data sources — databases, spreadsheets, CRMs and ERPs — into a consistent data model and present it as interactive, filterable views. Leaders see KPIs at a glance, analysts drill into detail, and everyone works from the same numbers.',
    whyItMatters: [
      'Weekly reports assembled by hand are slow and error-prone.',
      'Different teams quote different numbers for the same metric.',
      'Answers to simple questions wait in an analyst queue.',
      'Data locked in separate systems hides the full picture.',
    ],
    capabilities: [
      { title: 'KPI monitoring', description: 'Headline metrics with comparisons against the previous period.', icon: Target },
      { title: 'Interactive filters', description: 'Date ranges, regions and categories that update every chart at once.', icon: Filter },
      { title: 'Revenue & P&L views', description: 'Revenue, cost, margin and profit trends in one consistent model.', icon: ChartLine },
      { title: 'Geographic analysis', description: 'Regional performance and contribution at a glance.', icon: Globe },
      { title: 'Exports & reports', description: 'CSV exports and scheduled reports for stakeholders.', icon: FileSpreadsheet },
      { title: 'Governed data model', description: 'Shared metric definitions so every dashboard agrees.', icon: Database },
    ],
    problemsSolved: [
      'Hours spent compiling spreadsheets for weekly reviews',
      'Conflicting numbers between departments',
      'Slow access to answers for decision-makers',
      'No single view across sales, finance and operations',
    ],
    technologies: ['react', 'typescript', 'python', 'postgresql', 'mysql', 'dataviz', 'rest', 'aws'],
    useCases: [
      { industry: 'retail', title: 'Category & region performance', description: 'Sales, margin and growth by store, region and category.' },
      { industry: 'banking', title: 'Portfolio & collections KPIs', description: 'Disbursement, collection efficiency and risk indicators.' },
      { industry: 'manufacturing', title: 'Production visibility', description: 'Output, downtime and yield tracked across lines.' },
      { industry: 'healthcare', title: 'Operational dashboards', description: 'Patient flow and department utilization.' },
    ],
    deliverables: [
      'KPI definition workshop and metric dictionary',
      'Data pipelines from your source systems',
      'Interactive web dashboards',
      'Role-based access and sharing',
      'CSV/Excel exports and scheduled reports',
      'Documentation and handover',
    ],
    demo: {
      summary: 'A BI dashboard over a sample retail dataset with date, region and category filters, switchable chart types, P&L and CSV export.',
      tryThis: [
        'Change the date range and filter by region or category',
        'Switch the trend chart between area, line and bar',
        'Select a different KPI to analyze',
        'Export a sample report as CSV',
      ],
      simulated: ['Dataset is synthetic sample data, generated deterministically'],
    },
  },
  {
    slug: 'ai-chatbots',
    description:
      'AI assistants for support and sales that understand intent, answer from your knowledge base, qualify leads and hand off to people with full context.',
    whatItIs:
      'An AI customer agent is a conversational interface connected to your business knowledge and systems — order data, policies, product catalogs and CRM. It identifies what the customer wants, responds with grounded answers, captures leads and escalates to your team when a person is needed.',
    whyItMatters: [
      'Support teams spend most of their time on repetitive questions.',
      'Customers expect answers outside business hours.',
      'Leads go cold when follow-up is slow.',
      'Agents lose time re-asking for context after a handoff.',
    ],
    capabilities: [
      { title: 'Intent detection', description: 'Classify what each message is about and extract key details.', icon: Target },
      { title: 'Grounded answers', description: 'Responses drawn from your knowledge base and policies (RAG).', icon: FileSearch },
      { title: 'System lookups', description: 'Order status, account details and bookings via your APIs.', icon: Database },
      { title: 'Lead qualification', description: 'Capture requirements, score leads and sync them to your CRM.', icon: BadgeCheck },
      { title: 'Sentiment monitoring', description: 'Detect frustration early and adapt the response.', icon: Activity },
      { title: 'Human escalation', description: 'Hand off with a conversation summary so nobody repeats themselves.', icon: Headset },
    ],
    problemsSolved: [
      'High volumes of repetitive support queries',
      'Slow responses outside business hours',
      'Leads lost before a salesperson follows up',
      'Context lost when conversations move between people',
    ],
    technologies: ['openai', 'llm', 'python', 'fastapi', 'nodejs', 'mongodb', 'redis', 'rest'],
    useCases: [
      { industry: 'retail', title: 'Order & returns assistant', description: 'Order tracking, returns and product questions, any time of day.' },
      { industry: 'banking', title: 'Service request routing', description: 'Account FAQs answered; service requests routed to the right team.' },
      { industry: 'education', title: 'Admissions assistant', description: 'Course guidance and enquiry capture during admission season.' },
      { industry: 'real-estate', title: 'Property enquiry agent', description: 'Qualify buyers and schedule site visits.' },
    ],
    deliverables: [
      'Conversation design and intent taxonomy',
      'LLM integration with knowledge-base retrieval',
      'Web chat widget and/or WhatsApp integration',
      'Agent console with human handoff workflow',
      'Analytics on intents, resolution and sentiment',
      'Guardrails, logging and evaluation',
    ],
    demo: {
      summary: 'A support console with a simulated AI agent: intent detection, sentiment, order lookups, lead qualification and human escalation.',
      tryThis: [
        'Ask "Where is my order ORD-10482?"',
        'Request a refund and watch intent detection respond',
        'Express frustration to see sentiment change',
        'Ask about bulk pricing to start lead qualification',
      ],
      simulated: [
        'Responses come from a rule-based engine and a sample knowledge base (no LLM is called)',
        'Human escalation and agent replies',
      ],
    },
  },
  {
    slug: 'predictive-analytics',
    description:
      'Statistical and machine-learning models that forecast revenue and demand, surface anomalies and turn patterns into planning recommendations.',
    whatItIs:
      'Predictive analytics uses historical data to estimate what is likely to happen next — sales, demand, cash flow, churn — with explicit uncertainty. We build the data pipelines, models and interfaces that turn forecasts into planning decisions, and we measure model accuracy honestly.',
    whyItMatters: [
      'Inventory and staffing are planned on intuition.',
      'Drops and spikes are noticed weeks too late.',
      'Seasonality is ignored when budgets are set.',
      'There is no safe way to test what-if scenarios.',
    ],
    capabilities: [
      { title: 'Revenue & sales forecasting', description: 'Forecasts with confidence ranges, not single-point guesses.', icon: ChartSpline },
      { title: 'Demand forecasting', description: 'Product-level demand for replenishment and production planning.', icon: Package },
      { title: 'Trend & seasonality', description: 'Decompose growth, seasonal peaks and one-off effects.', icon: ChartLine },
      { title: 'Anomaly detection', description: 'Flag values that deviate from what the model expected.', icon: Radar },
      { title: 'Scenario modelling', description: 'Explore marketing, pricing and growth assumptions.', icon: Workflow },
      { title: 'Accuracy monitoring', description: 'Backtesting and drift tracking keep models trustworthy.', icon: Gauge },
    ],
    problemsSolved: [
      'Stock-outs and overstock from inaccurate demand estimates',
      'Late reaction to unusual drops or spikes',
      'Budgets that ignore seasonal patterns',
      'Decisions made without quantified scenarios',
    ],
    technologies: ['python', 'ml', 'predictive', 'fastapi', 'postgresql', 'dataviz', 'docker', 'aws'],
    useCases: [
      { industry: 'retail', title: 'Replenishment planning', description: 'SKU-level demand forecasts feeding purchase orders.' },
      { industry: 'manufacturing', title: 'Production planning', description: 'Order forecasts translated into capacity plans.' },
      { industry: 'banking', title: 'Cash-flow forecasting', description: 'Collections and liquidity projections.' },
      { industry: 'logistics', title: 'Capacity forecasting', description: 'Shipment volumes for fleet and warehouse planning.' },
    ],
    deliverables: [
      'Data audit and feature engineering',
      'Forecasting models with backtested accuracy',
      'Anomaly detection and alerting',
      'Scenario-planning interface',
      'Model deployment as an API',
      'Retraining and monitoring pipeline',
    ],
    demo: {
      summary: 'Forecast sample business datasets with real statistical models (Holt-Winters, regression), backtests, anomaly detection and scenario inputs.',
      tryThis: [
        'Choose a dataset and forecast horizon',
        'Compare models by backtested error',
        'Adjust marketing and pricing assumptions',
        'Review detected anomalies and recommendations',
      ],
      simulated: [
        'Historical datasets are synthetic sample data',
        'Scenario adjustments apply stated assumptions on top of the statistical forecast',
      ],
    },
  },
  {
    slug: 'collaborative-workspace',
    description:
      'Custom project and collaboration platforms with Kanban workflows, assignments, deadlines, activity tracking and shared documents.',
    whatItIs:
      'Collaborative workspaces bring projects, tasks, people and documents into one structured environment designed around how your teams actually work — your stages, your approval rules and your reporting needs.',
    whyItMatters: [
      'Work is tracked across chat, email and spreadsheets.',
      'Ownership and deadlines are unclear.',
      'Managers lack visibility into progress and workload.',
      'Generic tools do not match internal processes.',
    ],
    capabilities: [
      { title: 'Workspaces & projects', description: 'Separate spaces per team, client or initiative.', icon: Layers },
      { title: 'Kanban workflows', description: 'Custom stages with drag-and-drop task movement.', icon: SquareKanban },
      { title: 'Assignments & deadlines', description: 'Owners, priorities and due dates on every task.', icon: CalendarClock },
      { title: 'Team workload', description: 'See who is working on what, and who has capacity.', icon: Users },
      { title: 'Activity timeline', description: 'A complete history of changes across projects.', icon: Bell },
      { title: 'Shared documents', description: 'Specs, notes and decisions next to the work.', icon: FileText },
    ],
    problemsSolved: [
      'Tasks falling through the cracks between tools',
      'Unclear owners and missed deadlines',
      'No real-time view of project progress',
      'Status meetings that exist only to share updates',
    ],
    technologies: ['react', 'typescript', 'nodejs', 'express', 'postgresql', 'redis', 'docker', 'vercel'],
    useCases: [
      { industry: 'professional-services', title: 'Client engagements', description: 'Deliverables, approvals and documents per client.' },
      { industry: 'education', title: 'Course production', description: 'Faculty and content teams coordinating course launches.' },
      { industry: 'real-estate', title: 'Project handover', description: 'Snagging lists and handover checklists for developments.' },
      { industry: 'startups', title: 'Product sprints', description: 'Roadmaps, sprints and specs in one workspace.' },
    ],
    deliverables: [
      'Workflow mapping and information architecture',
      'Web app with boards, lists and timelines',
      'Roles, permissions and guest access',
      'Notifications and integrations (email, chat, calendar)',
      'Progress and workload reporting',
      'Data import from existing tools',
    ],
    demo: {
      summary: 'A project workspace with Kanban boards, task assignment, priorities, deadlines, team workload, activity and shared documents.',
      tryThis: [
        'Drag a task across the Kanban board',
        'Create a project and add a task',
        'Assign a team member and change priority',
        'Filter tasks by member or status',
      ],
      simulated: ['Team members and notifications are sample data'],
    },
  },
  {
    slug: 'fintech-automation',
    description:
      'Financial platforms that capture transactions, categorize spend automatically, enforce budgets and generate reports in real time.',
    whatItIs:
      'FinTech and expense automation replaces manual bookkeeping steps — collecting transactions, categorizing spend, checking budgets, reconciling and reporting — with software that runs continuously and flags only what needs a human decision.',
    whyItMatters: [
      'Hours are spent categorizing expenses by hand.',
      'Budget overruns are discovered after month-end.',
      'Receipts and statements are scattered.',
      'Financial reports are slow to produce and error-prone.',
    ],
    capabilities: [
      { title: 'Transaction ingestion', description: 'Bank, card and UPI transactions collected automatically.', icon: Receipt },
      { title: 'AI categorization', description: 'Spend categorized by rules and models, with human review.', icon: Sparkles },
      { title: 'Budgets & alerts', description: 'Category budgets with utilization tracking and alerts.', icon: PiggyBank },
      { title: 'Financial reporting', description: 'Income, expenses and cash flow by month and category.', icon: ChartColumnBig },
      { title: 'Approvals & audit trail', description: 'Approval workflows with a complete change history.', icon: ClipboardCheck },
      { title: 'Accounting integrations', description: 'Sync with accounting software and payment gateways.', icon: GitBranch },
    ],
    problemsSolved: [
      'Manual expense categorization every month',
      'Overspending noticed too late to act',
      'Slow month-end close and reporting',
      'No single view of income and expenses',
    ],
    technologies: ['react', 'typescript', 'python', 'ml', 'fastapi', 'postgresql', 'kafka', 'aws'],
    useCases: [
      { industry: 'startups', title: 'Spend management', description: 'Category budgets and automated expense tracking.' },
      { industry: 'banking', title: 'Personal finance features', description: 'Spending insights for retail banking customers.' },
      { industry: 'professional-services', title: 'Project expenses', description: 'Expense tracking and client re-billing.' },
      { industry: 'real-estate', title: 'Property ledgers', description: 'Income and expenses tracked per property.' },
    ],
    deliverables: [
      'Ledger and transaction data model',
      'Bank and statement import with reconciliation',
      'Categorization engine (rules + ML)',
      'Budgets, alerts and reports',
      'Role-based approvals and audit logs',
      'Security review and compliance-ready architecture',
    ],
    demo: {
      summary: 'A finance dashboard in INR with transactions, AI-assisted categorization, budgets, savings and monthly reports.',
      tryThis: [
        'Add a transaction and edit its category',
        'Import a sample statement and auto-categorize it',
        'Set a monthly budget and watch utilization',
        'Generate and export a monthly report',
      ],
      simulated: [
        'Bank feeds are sample data — no accounts are connected',
        'AI categorization uses a rule-based classifier in place of a trained model',
      ],
    },
  },
  {
    slug: 'erp-automation',
    description:
      'Integrated ERP modules for HR, attendance, payroll, procurement, vendors and logistics — connected by automated workflows.',
    whatItIs:
      'Enterprise resource planning connects the core operations of an organization in a single system. We build modular ERPs — or extend existing ones — with automation that removes re-keying between HR, finance, procurement and supply chain.',
    whyItMatters: [
      'HR, finance and procurement tools do not talk to each other.',
      'Payroll is calculated manually from attendance sheets.',
      'Purchase orders and shipments have no real-time status.',
      'Vendor performance is never measured.',
    ],
    capabilities: [
      { title: 'HR & employee directory', description: 'Employee records, departments and reporting lines.', icon: Users },
      { title: 'Attendance & leave', description: 'Daily attendance, leave and work-from-home tracking.', icon: CalendarClock },
      { title: 'Payroll processing', description: 'Earnings, deductions and payslips computed from attendance.', icon: Wallet },
      { title: 'Procurement', description: 'Purchase orders with approvals and budget control.', icon: ClipboardList },
      { title: 'Vendor management', description: 'Vendor records, scorecards and spend analysis.', icon: Building2 },
      { title: 'Supply chain tracking', description: 'Shipment milestones, delays and delivery confirmation.', icon: Truck },
    ],
    problemsSolved: [
      'Re-keying the same data into several systems',
      'Payroll errors from manual calculation',
      'No visibility into orders in transit',
      'Vendor decisions without performance data',
    ],
    technologies: ['react', 'typescript', 'python', 'django', 'postgresql', 'kafka', 'n8n', 'docker'],
    useCases: [
      { industry: 'manufacturing', title: 'Plant operations', description: 'Workforce, procurement and inventory in one system.' },
      { industry: 'logistics', title: 'Fleet & vendor coordination', description: 'Shipments, carriers and vendor performance.' },
      { industry: 'healthcare', title: 'Hospital operations', description: 'Staff rostering, payroll and supplies procurement.' },
      { industry: 'education', title: 'Campus administration', description: 'Faculty HR, payroll and campus purchasing.' },
    ],
    deliverables: [
      'Process mapping and module roadmap',
      'HR, attendance and payroll modules',
      'Procurement, vendor and supply chain modules',
      'Workflow automation and approvals',
      'Integrations with accounting and banking systems',
      'Operational dashboards and reports',
    ],
    demo: {
      summary: 'An integrated ERP with employees, attendance, simulated payroll, departments, purchase orders, shipments and vendors.',
      tryThis: [
        'Add an employee and update their details',
        'Run a simulated payroll for the month',
        'Update a shipment status',
        'Compare department performance',
      ],
      simulated: ['Payroll processing — no payments are initiated', 'Shipment tracking events'],
    },
  },
  {
    slug: 'document-intelligence',
    description:
      'Document pipelines that read receipts, invoices and forms, extract the fields you need and validate them before they reach your systems.',
    whatItIs:
      'Document intelligence combines optical character recognition with layout analysis and validation rules to convert scanned or photographed documents into structured data — merchant, dates, amounts, tax and line items — ready for your accounting or ERP system.',
    whyItMatters: [
      'Teams re-type data from invoices and receipts every day.',
      'Errors in amounts and tax details cause rework.',
      'Approvals and reimbursements wait on manual entry.',
      'Paper and PDF archives cannot be searched.',
    ],
    capabilities: [
      { title: 'Receipt & invoice OCR', description: 'Read printed text from scans, photos and PDFs.', icon: ScanText },
      { title: 'Field extraction', description: 'Merchant, invoice number, dates, totals, tax and line items.', icon: ListChecks },
      { title: 'Document classification', description: 'Route receipts, invoices and bills automatically.', icon: Tags },
      { title: 'Validation rules', description: 'Check totals, tax maths and duplicates before export.', icon: BadgeCheck },
      { title: 'Human review', description: 'Correct low-confidence fields in a review interface.', icon: MessagesSquare },
      { title: 'Exports & integrations', description: 'CSV, JSON or direct sync to accounting and ERP.', icon: FileSpreadsheet },
    ],
    problemsSolved: [
      'Manual data entry from invoices and receipts',
      'Mistakes in amounts and tax calculations',
      'Slow reimbursement and approval cycles',
      'Unsearchable document archives',
    ],
    technologies: ['python', 'ocr', 'ml', 'llm', 'fastapi', 'mongodb', 'aws', 'n8n'],
    useCases: [
      { industry: 'banking', title: 'KYC document capture', description: 'Identity and address documents extracted and verified.' },
      { industry: 'healthcare', title: 'Claims & intake forms', description: 'Patient forms and claims digitized on arrival.' },
      { industry: 'logistics', title: 'Delivery paperwork', description: 'Delivery notes and bills of lading captured in the field.' },
      { industry: 'professional-services', title: 'Expense receipts', description: 'Employee receipts and vendor invoices processed automatically.' },
    ],
    deliverables: [
      'Document taxonomy and extraction schema',
      'OCR pipeline (cloud or self-hosted)',
      'Validation rules and confidence thresholds',
      'Review interface for corrections',
      'Exports and system integrations',
      'Accuracy measurement on your own documents',
    ],
    demo: {
      summary: 'Process sample receipts and invoices: simulated scanning, field and line-item extraction, validation, corrections and CSV/JSON export.',
      tryThis: [
        'Process a sample receipt or invoice',
        'Correct an extracted field and watch validation update',
        'Export the results as CSV or JSON',
        'Upload your own image to see the pipeline',
      ],
      simulated: [
        'OCR results for samples are predefined (no OCR engine is configured)',
        'Uploaded files stay in your browser and are not read automatically',
      ],
    },
  },
]

const CONTENT_BY_SLUG = Object.fromEntries(CONTENT.map((c) => [c.slug, c])) as Record<SolutionSlug, SolutionContent>

const withContent = (summary: SolutionSummary): Solution => {
  const content = CONTENT_BY_SLUG[summary.slug]
  return { ...summary, ...content, demo: { ...summary.demo, ...content.demo } }
}

export const SOLUTIONS: Solution[] = SOLUTION_INDEX.map(withContent)

export const SOLUTION_BY_SLUG: Record<SolutionSlug, Solution> = Object.fromEntries(
  SOLUTIONS.map((s) => [s.slug, s]),
) as Record<SolutionSlug, Solution>

export function getSolution(slug: string | undefined): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug)
}

export { isSolutionSlug } from './solution-index'
