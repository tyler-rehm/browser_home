export const DEFAULT_LINKS = [
  { name: 'GitHub', url: 'https://github.com', short: 'GH' },
  { name: 'ChatGPT', url: 'https://chatgpt.com', short: 'AI' },
  { name: 'Vercel', url: 'https://vercel.com/dashboard', short: '▲' },
  { name: 'Linear', url: 'https://linear.app', short: 'LI' },
  { name: 'Google Drive', url: 'https://drive.google.com', short: 'GD' },
  { name: 'Gmail', url: 'https://mail.google.com', short: 'GM' },
  { name: 'Notion', url: 'https://notion.so', short: 'NO' },
  { name: 'localhost', url: 'http://localhost:3000', short: '::' },
]
export const TOOLS = [
  {
    name: 'GitHub repositories',
    detail: 'github.com',
    url: 'https://github.com/?tab=repositories',
  },
  { name: 'Vercel deployments', detail: 'vercel.com', url: 'https://vercel.com/dashboard' },
  { name: 'OpenAI platform', detail: 'platform.openai.com', url: 'https://platform.openai.com' },
  { name: 'Can I use', detail: 'browser support', url: 'https://caniuse.com' },
]
export const DEFAULT_PREFERENCES = {
  paper: '#eff1e9',
  ink: '#182019',
  accent: '#e56636',
  secondary: '#4c7358',
  font: 'Manrope',
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
