/** Local Index / Hub catalog for code-home. Paths are Mac-local; no secrets. */

export const CAREER_OVERNIGHT_DIR =
  '/Users/code/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-48eeae3f-b4d6-451f-89de-1b09603c0dd6/files/docs/vaults/career/overnight'

export const CAREER_VAULT_DIR =
  '/Users/code/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-48eeae3f-b4d6-451f-89de-1b09603c0dd6/files/docs/vaults/career'

export const PROJECT_DOCS_DIR =
  '/Users/code/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-48eeae3f-b4d6-451f-89de-1b09603c0dd6/files/docs'

export const HUB_TOOLS = [
  {
    name: 'DBeaver',
    detail: 'Local Docker DB GUI',
    action: 'open-app',
    app: 'DBeaver',
    command: 'open -a DBeaver',
  },
  {
    name: 'Hoppscotch',
    detail: 'Local API client',
    action: 'open-app',
    app: 'Hoppscotch',
    command: 'open -a Hoppscotch',
  },
  {
    name: 'Twenty CRM',
    detail: 'localhost:3000',
    action: 'url',
    url: 'http://localhost:3000',
  },
  {
    name: 'local-db-forwards',
    detail: '~/Projects/local-db-forwards',
    action: 'command',
    command: '~/Projects/local-db-forwards/dbeaver-db-forwards.sh up',
    path: '/Users/code/Projects/local-db-forwards/dbeaver-db-forwards.sh',
  },
  {
    name: 'GitHub repositories',
    detail: 'github.com',
    action: 'url',
    url: 'https://github.com/orgs/IvyLeagueTech/repositories',
  },
  {
    name: 'Twilio console',
    detail: 'console.twilio.com',
    action: 'url',
    url: 'https://console.twilio.com',
  },
  {
    name: 'Google Cloud',
    detail: 'console.cloud.google.com',
    action: 'url',
    url: 'https://console.cloud.google.com',
  },
  {
    name: 'Snyk',
    detail: 'app.snyk.io',
    action: 'url',
    url: 'https://app.snyk.io',
  },
]

export const HUB_DOCS = [
  {
    name: 'DB ports dashboard',
    file: 'overnight/db-ports-dashboard-2026-11-11.md',
    href: '/vault-docs/overnight/db-ports-dashboard-2026-11-11.md',
  },
  {
    name: 'DBeaver local setup',
    file: 'overnight/dbeaver-local-setup-2026-11-11.md',
    href: '/vault-docs/overnight/dbeaver-local-setup-2026-11-11.md',
  },
  {
    name: 'Hoppscotch local demo',
    file: 'overnight/hoppscotch-local-demo-2026-11-11.md',
    href: '/vault-docs/overnight/hoppscotch-local-demo-2026-11-11.md',
  },
  {
    name: 'Hoppscotch MCP setup',
    file: 'overnight/hoppscotch-mcp-setup-2026-11-11.md',
    href: '/vault-docs/overnight/hoppscotch-mcp-setup-2026-11-11.md',
  },
  {
    name: 'Local-home Index note',
    file: 'overnight/local-home-index-2026-11-11.md',
    href: '/vault-docs/overnight/local-home-index-2026-11-11.md',
  },
  {
    name: 'Career ledger quicklinks',
    file: 'overnight/career-ledger-quicklinks-2026-11-11.md',
    href: '/vault-docs/overnight/career-ledger-quicklinks-2026-11-11.md',
  },
  {
    name: 'CRM quickstart',
    file: 'overnight/crm-quickstart.md',
    href: '/vault-docs/overnight/crm-quickstart.md',
  },
  {
    name: 'Overnight brief',
    file: 'OVERNIGHT-BRIEF.md',
    href: '/vault-docs/OVERNIGHT-BRIEF.md',
  },
  {
    name: 'Career vault README',
    file: 'README.md',
    href: '/vault-docs/README.md',
  },
  {
    name: 'Career quick links',
    file: 'quick-links.md',
    href: '/vault-docs/quick-links.md',
  },
]

export const HUB_LOCATIONS = [
  {
    name: 'Career overnight docs',
    label: 'Agent Store · career/overnight',
    path: CAREER_OVERNIGHT_DIR,
  },
  {
    name: 'Career vault root',
    label: 'Agent Store · docs/vaults/career',
    path: CAREER_VAULT_DIR,
  },
  {
    name: 'Project docs root',
    label: 'Agent Store · docs',
    path: PROJECT_DOCS_DIR,
  },
  {
    name: 'Resource Vaults project store',
    label: 'Agent Store files',
    path: '/Users/code/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-48eeae3f-b4d6-451f-89de-1b09603c0dd6/files',
  },
  {
    name: 'Obsidian personal code hub',
    label: 'Obsidian · personal/code',
    path: '/Users/code/Documents/Obsidian/personal/code',
  },
  {
    name: 'iCloud Drive (CloudDocs)',
    label: 'iCloud Drive',
    path: '/Users/code/Library/Mobile Documents/com~apple~CloudDocs',
  },
  {
    name: 'local-db-forwards pin stack',
    label: 'Projects',
    path: '/Users/code/Projects/local-db-forwards',
  },
  {
    name: 'browser_home / code-home',
    label: 'App source',
    path: '/Users/code/Code/miscellaneous-tools/browser_home',
  },
]

/** Same labeled table as db-ports-dashboard — no passwords. */
export const HUB_DB_PORTS = [
  {
    label: 'privacy-zero Postgres',
    engine: 'Postgres 16',
    host: '127.0.0.1',
    port: 54329,
    database: 'privacy_removal',
    user: 'privacy',
  },
  {
    label: 'Twenty CRM Postgres',
    engine: 'Postgres 16',
    host: '127.0.0.1',
    port: 54330,
    database: 'default',
    user: 'postgres',
  },
  {
    label: 'email-ops Postgres',
    engine: 'Postgres 17',
    host: '127.0.0.1',
    port: 54332,
    database: 'email_ops',
    user: 'email_ops',
  },
  {
    label: 'local-growth MariaDB',
    engine: 'MariaDB 11.4',
    host: '127.0.0.1',
    port: 33060,
    database: 'wordpress',
    user: 'wordpress',
  },
  {
    label: 'agency MySQL',
    engine: 'MySQL 8.0',
    host: '127.0.0.1',
    port: 33061,
    database: 'agency',
    user: 'agency',
  },
  {
    label: 'Twenty Redis',
    engine: 'Redis',
    host: '127.0.0.1',
    port: 63790,
    database: '—',
    user: '—',
  },
]

export const OPEN_APP_ALLOWLIST = new Set(['DBeaver', 'Hoppscotch'])

export const HUB_SECTIONS = [
  { id: 'tools', label: 'Tools' },
  { id: 'docs', label: 'Documentation' },
  { id: 'locations', label: 'Drive / Vault' },
  { id: 'ports', label: 'Local DB ports' },
]
