/** Display metadata for conversation statuses. */
export const STATUS_META = {
  bot: { label: 'Bot handling', tone: 'cyan' },
  escalated: { label: 'With human agent', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'green' },
} as const
