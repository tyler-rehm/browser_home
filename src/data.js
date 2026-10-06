export const DEFAULT_LINKS = [
  { name: 'GitHub', url: 'https://github.com/IvyLeagueTech', short: 'GH' },
  { name: 'Cursor', url: 'https://cursor.com/dashboard', short: 'CU' },
  { name: 'Gmail', url: 'https://mail.google.com', short: 'GM' },
  { name: 'Sheets', url: 'https://docs.google.com/spreadsheets', short: 'SH' },
  { name: 'Slack', url: 'https://app.slack.com', short: 'SL' },
  { name: 'Lightsail', url: 'https://lightsail.aws.amazon.com', short: 'LS' },
  { name: 'Cloudflare', url: 'https://dash.cloudflare.com', short: 'CF' },
  { name: 'Stripe', url: 'https://dashboard.stripe.com', short: 'ST' },
]
export const TOOLS = [
  {
    name: 'GitHub repositories',
    detail: 'github.com',
    url: 'https://github.com/orgs/IvyLeagueTech/repositories',
  },
  { name: 'Twilio console', detail: 'console.twilio.com', url: 'https://console.twilio.com' },
  {
    name: 'Google Cloud',
    detail: 'console.cloud.google.com',
    url: 'https://console.cloud.google.com',
  },
  { name: 'Snyk', detail: 'app.snyk.io', url: 'https://app.snyk.io' },
]
export const DEFAULT_PREFERENCES = {
  paper: '#eff1e9',
  ink: '#182019',
  accent: '#e56636',
  secondary: '#4c7358',
  font: 'Manrope',
  openInNewTab: true,
}
export const PRESETS = {
  field: DEFAULT_PREFERENCES,
  ink: {
    paper: '#17181b',
    ink: '#f3f1ea',
    accent: '#c8ff45',
    secondary: '#79a7ad',
    font: 'Manrope',
  },
  clay: {
    paper: '#e8ded2',
    ink: '#382b26',
    accent: '#b84c35',
    secondary: '#67745c',
    font: 'Georgia',
  },
  ocean: {
    paper: '#e7f0f1',
    ink: '#132b32',
    accent: '#1b7895',
    secondary: '#547d72',
    font: 'Avenir Next',
  },
}
