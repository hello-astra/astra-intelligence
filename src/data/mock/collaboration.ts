import type { Activity, CollabState, Member, Priority, Project, SharedDoc, Task, TaskStatus } from '@/types/collaboration'
import { daysAgoISO, hoursAgo, isoDateFromToday, minutesAgo } from '@/utils/dates'

const MEMBERS: Member[] = [
  { id: 'm_aditi', name: 'Aditi Rao', role: 'Product Manager', email: 'aditi.rao@novaretail.example', capacity: 6 },
  { id: 'm_karan', name: 'Karan Shah', role: 'Tech Lead', email: 'karan.shah@novaretail.example', capacity: 6 },
  { id: 'm_meera', name: 'Meera Iyer', role: 'Frontend Engineer', email: 'meera.iyer@novaretail.example', capacity: 5 },
  { id: 'm_arjun', name: 'Arjun Nair', role: 'Backend Engineer', email: 'arjun.nair@novaretail.example', capacity: 5 },
  { id: 'm_sana', name: 'Sana Qureshi', role: 'Product Designer', email: 'sana.qureshi@novaretail.example', capacity: 5 },
  { id: 'm_vikram', name: 'Vikram Joshi', role: 'QA Engineer', email: 'vikram.joshi@novaretail.example', capacity: 6 },
  { id: 'm_rhea', name: 'Rhea Kapoor', role: 'Marketing Manager', email: 'rhea.kapoor@novaretail.example', capacity: 6 },
  { id: 'm_dev', name: 'Dev Malhotra', role: 'Data Engineer', email: 'dev.malhotra@novaretail.example', capacity: 5 },
]

const PROJECTS: Project[] = [
  {
    id: 'p_chk',
    workspaceId: 'ws_digital',
    key: 'CHK',
    name: 'Checkout Revamp',
    description: 'One-page checkout with UPI intent, saved addresses and faster payments.',
    color: '#4f86ff',
    memberIds: ['m_aditi', 'm_karan', 'm_meera', 'm_arjun', 'm_sana', 'm_vikram'],
    startDate: isoDateFromToday(-40),
    dueDate: isoDateFromToday(24),
    status: 'active',
  },
  {
    id: 'p_mob',
    workspaceId: 'ws_digital',
    key: 'MOB',
    name: 'Mobile App 2.0',
    description: 'React Native rebuild with offline cart, biometrics and push notifications.',
    color: '#8b74ff',
    memberIds: ['m_aditi', 'm_karan', 'm_meera', 'm_sana', 'm_vikram'],
    startDate: isoDateFromToday(-20),
    dueDate: isoDateFromToday(52),
    status: 'active',
  },
  {
    id: 'p_dat',
    workspaceId: 'ws_digital',
    key: 'DAT',
    name: 'Data Platform Migration',
    description: 'Move order events to Kafka and the sales mart to PostgreSQL 16 with dbt.',
    color: '#2dd4bf',
    memberIds: ['m_karan', 'm_arjun', 'm_dev'],
    startDate: isoDateFromToday(-30),
    dueDate: isoDateFromToday(38),
    status: 'active',
  },
  {
    id: 'p_fst',
    workspaceId: 'ws_marketing',
    key: 'FST',
    name: 'Festive Campaign 2026',
    description: 'Integrated festive-season campaign across email, social and the storefront.',
    color: '#f59e0b',
    memberIds: ['m_rhea', 'm_sana', 'm_aditi', 'm_dev'],
    startDate: isoDateFromToday(-25),
    dueDate: isoDateFromToday(10),
    status: 'active',
  },
  {
    id: 'p_brd',
    workspaceId: 'ws_marketing',
    key: 'BRD',
    name: 'Brand Refresh',
    description: 'Updated visual identity, guidelines and website typography.',
    color: '#f472b6',
    memberIds: ['m_rhea', 'm_sana'],
    startDate: isoDateFromToday(-8),
    dueDate: isoDateFromToday(70),
    status: 'active',
  },
]

type Seed = [title: string, status: TaskStatus, priority: Priority, assignee: string | null, due: number | null, tags: string[], description?: string]

const SEEDS: Record<string, Seed[]> = {
  p_chk: [
    ['Redesign cart summary component', 'review', 'high', 'm_meera', 2, ['frontend', 'design'], 'Collapse line items on mobile and show savings prominently.'],
    ['Integrate UPI intent flow', 'in_progress', 'urgent', 'm_arjun', 3, ['backend', 'payments'], 'Support UPI intent on Android and collect-request fallback on desktop.'],
    ['Saved addresses API', 'in_progress', 'high', 'm_arjun', 6, ['backend', 'api']],
    ['Coupon validation service', 'todo', 'medium', 'm_karan', 9, ['backend']],
    ['Checkout analytics events', 'todo', 'medium', 'm_dev', 12, ['data', 'analytics']],
    ['Load test payment service', 'todo', 'high', 'm_vikram', 14, ['qa', 'performance']],
    ['Accessibility audit of checkout', 'backlog', 'medium', 'm_vikram', 18, ['qa', 'a11y']],
    ['Fix tax rounding on invoices', 'done', 'urgent', 'm_arjun', -4, ['backend', 'bug']],
    ['Pincode-based address autocomplete', 'in_progress', 'medium', 'm_meera', -1, ['frontend']],
    ['A/B test one-page checkout', 'backlog', 'low', 'm_aditi', 20, ['experiment']],
    ['Payment failure retry UX', 'review', 'high', 'm_sana', 1, ['design']],
    ['Checkout design QA', 'done', 'medium', 'm_sana', -6, ['design', 'qa']],
  ],
  p_mob: [
    ['Set up React Native navigation', 'done', 'high', 'm_meera', -9, ['mobile', 'frontend']],
    ['Push notification service', 'in_progress', 'high', 'm_karan', 8, ['mobile', 'backend']],
    ['Offline cart sync', 'todo', 'high', 'm_meera', 15, ['mobile']],
    ['Biometric login', 'todo', 'medium', null, 21, ['mobile', 'security']],
    ['App store listing assets', 'backlog', 'low', 'm_sana', 40, ['design']],
    ['Crash reporting integration', 'review', 'medium', 'm_karan', 4, ['mobile', 'observability']],
    ['Onboarding screens', 'in_progress', 'medium', 'm_sana', 7, ['design', 'mobile']],
    ['Regression test plan', 'backlog', 'medium', 'm_vikram', 30, ['qa']],
  ],
  p_dat: [
    ['Kafka topic design for order events', 'done', 'high', 'm_dev', -12, ['data', 'kafka']],
    ['Migrate orders table to PostgreSQL 16', 'in_progress', 'urgent', 'm_arjun', 5, ['data', 'backend']],
    ['dbt models for sales mart', 'in_progress', 'high', 'm_dev', 9, ['data']],
    ['Backfill historical orders', 'todo', 'medium', 'm_dev', 16, ['data']],
    ['Data quality checks', 'todo', 'medium', 'm_dev', 22, ['data', 'qa']],
    ['Retire legacy ETL jobs', 'backlog', 'low', 'm_karan', 35, ['data']],
  ],
  p_fst: [
    ['Finalize campaign creatives', 'review', 'urgent', 'm_sana', 1, ['design', 'creative']],
    ['Influencer shortlist', 'done', 'medium', 'm_rhea', -5, ['social']],
    ['Landing page copy', 'in_progress', 'high', 'm_rhea', 2, ['content']],
    ['Email sequence (3 emails)', 'todo', 'high', 'm_rhea', 4, ['email', 'content']],
    ['Budget allocation by channel', 'done', 'high', 'm_aditi', -3, ['planning']],
    ['Coupon codes and limits', 'todo', 'medium', 'm_dev', 5, ['ops']],
    ['Campaign performance dashboard', 'backlog', 'medium', 'm_dev', 8, ['data', 'analytics']],
    ['Social media calendar', 'in_progress', 'medium', 'm_rhea', -2, ['social']],
  ],
  p_brd: [
    ['Logo exploration — round 2', 'in_progress', 'medium', 'm_sana', 12, ['design']],
    ['Brand guidelines document', 'todo', 'medium', 'm_rhea', 30, ['content', 'design']],
    ['Website typography update', 'backlog', 'low', 'm_sana', 45, ['design', 'frontend']],
  ],
}

const COMMENTS: Record<string, [string, string, number][]> = {
  'CHK-2': [
    ['m_karan', 'Sandbox credentials are in the vault. Watch the 30-second intent timeout on older Android versions.', 180],
    ['m_arjun', 'Intent flow works on Pixel and Samsung test devices; desktop fallback is next.', 75],
  ],
  'CHK-1': [['m_aditi', 'Looks great — can we show the “You saved ₹X” line above the total?', 240]],
  'FST-1': [
    ['m_rhea', 'Final versions needed by tomorrow for the email send.', 300],
    ['m_sana', 'Uploading the last two banner sizes this afternoon.', 90],
  ],
}

export function createInitialCollabState(): CollabState {
  const tasks: Task[] = []
  for (const project of PROJECTS) {
    SEEDS[project.id].forEach(([title, status, priority, assignee, due, tags, description], i) => {
      const key = `${project.key}-${i + 1}`
      tasks.push({
        id: `t_${project.key.toLowerCase()}_${i + 1}`,
        key,
        projectId: project.id,
        title,
        description: description ?? '',
        status,
        priority,
        assigneeId: assignee,
        dueDate: due === null ? null : isoDateFromToday(due),
        tags,
        createdAt: daysAgoISO(20 - (i % 15)),
        updatedAt: hoursAgo(2 + i * 3),
        comments: (COMMENTS[key] ?? []).map(([authorId, text, mins], ci) => ({ id: `c_${key}_${ci}`, authorId, text, at: minutesAgo(mins) })),
      })
    })
  }

  const activity: Activity[] = [
    { id: 'a1', at: minutesAgo(12), actorId: 'm_sana', projectId: 'p_fst', taskId: 't_fst_1', text: 'moved FST-1 “Finalize campaign creatives” to Review' },
    { id: 'a2', at: minutesAgo(48), actorId: 'm_arjun', projectId: 'p_chk', taskId: 't_chk_2', text: 'commented on CHK-2 “Integrate UPI intent flow”' },
    { id: 'a3', at: hoursAgo(2), actorId: 'm_meera', projectId: 'p_chk', taskId: 't_chk_1', text: 'moved CHK-1 “Redesign cart summary component” to Review' },
    { id: 'a4', at: hoursAgo(4), actorId: 'm_karan', projectId: 'p_mob', taskId: 't_mob_6', text: 'opened a pull request for MOB-6 “Crash reporting integration”' },
    { id: 'a5', at: hoursAgo(6), actorId: 'm_dev', projectId: 'p_dat', taskId: 't_dat_3', text: 'raised the priority of DAT-3 “dbt models for sales mart” to High' },
    { id: 'a6', at: hoursAgo(9), actorId: 'm_rhea', projectId: 'p_fst', taskId: 't_fst_2', text: 'completed FST-2 “Influencer shortlist”' },
    { id: 'a7', at: daysAgoISO(1, 16), actorId: 'm_aditi', projectId: 'p_fst', taskId: 't_fst_5', text: 'completed FST-5 “Budget allocation by channel”' },
    { id: 'a8', at: daysAgoISO(1, 11), actorId: 'm_arjun', projectId: 'p_chk', taskId: 't_chk_8', text: 'completed CHK-8 “Fix tax rounding on invoices”' },
    { id: 'a9', at: daysAgoISO(2, 15), actorId: 'm_sana', projectId: 'p_chk', text: 'updated the document “Checkout revamp — PRD”' },
    { id: 'a10', at: daysAgoISO(3, 10), actorId: 'm_aditi', projectId: 'p_brd', text: 'created the project “Brand Refresh”' },
  ]

  const docs: SharedDoc[] = [
    {
      id: 'd1',
      projectId: 'p_chk',
      title: 'Checkout revamp — PRD',
      kind: 'Spec',
      authorId: 'm_aditi',
      updatedAt: daysAgoISO(2, 15),
      content:
        'Goal\nReduce checkout abandonment from 61% to below 50% by Q1.\n\nScope\n- One-page checkout on web and mobile web\n- UPI intent and saved addresses\n- Clear savings and delivery-date messaging\n\nSuccess metrics\n- Checkout conversion\n- Payment success rate\n- Time to complete checkout',
    },
    {
      id: 'd2',
      projectId: 'p_chk',
      title: 'API contract: saved addresses',
      kind: 'Spec',
      authorId: 'm_arjun',
      updatedAt: daysAgoISO(4, 12),
      content: 'GET /v1/customers/{id}/addresses\nPOST /v1/customers/{id}/addresses\nPATCH /v1/addresses/{id}\nDELETE /v1/addresses/{id}\n\nAddresses are validated against the pincode service before saving.',
    },
    {
      id: 'd3',
      projectId: 'p_chk',
      title: 'Decision: payment provider failover',
      kind: 'Decision',
      authorId: 'm_karan',
      updatedAt: daysAgoISO(6, 17),
      content: 'Decision\nRoute card payments to the secondary provider when the primary error rate exceeds 5% over 5 minutes.\n\nWhy\nAvoids lost orders during provider incidents.\n\nOwner\nKaran Shah',
    },
    {
      id: 'd4',
      projectId: 'p_mob',
      title: 'Sprint 14 retro notes',
      kind: 'Notes',
      authorId: 'm_meera',
      updatedAt: daysAgoISO(1, 18),
      content: 'Went well\n- Navigation shipped early\n- Design handoff was smooth\n\nTo improve\n- Flaky end-to-end tests\n- Late API changes\n\nActions\n- Vikram to stabilise the test suite\n- Freeze API contracts by mid-sprint',
    },
    {
      id: 'd5',
      projectId: 'p_fst',
      title: 'Festive campaign brief',
      kind: 'Brief',
      authorId: 'm_rhea',
      updatedAt: daysAgoISO(3, 11),
      content: 'Audience\nExisting customers plus first-time buyers aged 22–40.\n\nChannels\nEmail, Instagram, YouTube pre-roll, on-site banners.\n\nKey message\n“Gift smarter this festive season.”\n\nTimeline\nTeasers from next week; main push for 10 days.',
    },
  ]

  return {
    workspaces: [
      { id: 'ws_digital', name: 'Nova Retail · Product & Engineering', description: 'Product, engineering and data teams' },
      { id: 'ws_marketing', name: 'Nova Retail · Marketing', description: 'Campaigns, brand and content' },
    ],
    activeWorkspaceId: 'ws_digital',
    projects: PROJECTS,
    members: MEMBERS,
    tasks,
    activity,
    docs,
    currentUserId: 'm_aditi',
  }
}
