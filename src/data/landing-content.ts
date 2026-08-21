export interface NavLink {
  label: string
  href: string
}

export interface Feature {
  icon: string
  title: string
  description: string
}

export interface PresetTheme {
  primary: string
  primaryContainer: string
  secondary: string
  surface: string
  onSurface: string
}

export interface Preset {
  id: string
  name: string
  institution: string
  role: string
  theme: PresetTheme
  stats: { totalVerified: string; terminalProgress: number }
}

export interface FAQItem {
  question: string
  answer: string
}

export interface LandingContent {
  company: string
  tagline: string
  navLinks: NavLink[]
  hero: {
    badge: string
    title: string
    subtitle: string
    primaryCta: string
    secondaryCta: string
  }
  trustedBy: { name: string; abbreviation: string }[]
  features: { title: string; items: Feature[] }
  presets: Preset[]
  dashboard: {
    title: string
    institution: string
    role: string
    totalVerified: string
    terminalProgress: number
  }
  faq: FAQItem[]
  footer: {
    description: string
    columns: { title: string; links: { label: string; href: string }[] }[]
    copyright: string
  }
}

export const content: LandingContent = {
  company: 'Chronos',
  tagline: 'Enterprise Biometric Infrastructure',

  navLinks: [
    { label: 'Product', href: '#' },
    { label: 'Solutions', href: '#' },
    { label: 'Docs', href: '#' },
    { label: 'Pricing', href: '#' },
  ],

  hero: {
    badge: 'Deploying at FUT Minna',
    title: 'Identity infrastructure for the physical world.',
    subtitle:
      'The multi-tenant biometric sign-in engine engineered for modern academic institutions and high-security enterprises.',
    primaryCta: 'Request Access',
    secondaryCta: 'Read Documentation',
  },

  trustedBy: [
    { name: 'FUT Minna', abbreviation: 'FUT Minna' },
    { name: 'Kangaroo Technologies', abbreviation: 'Kangaroo Tech' },
    { name: 'Natale', abbreviation: 'Natale' },
  ],

  features: {
    title: 'Engineered for absolute scale.',
    items: [
      {
        icon: 'Zap',
        title: 'Tauri Performance',
        description:
          'Optimized for ARM/x64 hardware with a sub-15MB footprint. No bloat, just lightning-fast biometric processing.',
      },
      {
        icon: 'Layers',
        title: 'Multi-Tenant Logic',
        description:
          'Instantly swap visual identities, schemas, and regional overrides for every campus or department in your system.',
      },
      {
        icon: 'WifiOff',
        title: 'Offline-First Reliability',
        description:
          'Full local processing capability ensures zero downtime during network outages. Syncs automatically when back online.',
      },
    ],
  },

  presets: [
    {
      id: 'futminna',
      name: 'FUT Minna (Education)',
      institution: 'Chronos University Portal',
      role: 'Institutional Control',
      theme: {
        primary: '#570058',
        primaryContainer: '#7c007e',
        secondary: '#ffd700',
        surface: '#f8f9fa',
        onSurface: '#191c1d',
      },
      stats: { totalVerified: '24,500+', terminalProgress: 65 },
    },
    {
      id: 'kangaroo',
      name: 'Kangaroo Technologies (Tech)',
      institution: 'Kangaroo Tech Platform',
      role: 'Enterprise Control',
      theme: {
        primary: '#bf5f1e',
        primaryContainer: '#DF7525',
        secondary: '#2dd4bf',
        surface: '#fafaf9',
        onSurface: '#1c1917',
      },
      stats: { totalVerified: '187,200+', terminalProgress: 42 },
    },
    {
      id: 'natale',
      name: 'Natale (Sports)',
      institution: 'Natale Sports Complex',
      role: 'Venue Control',
      theme: {
        primary: '#000000',
        primaryContainer: '#1a1a1a',
        secondary: '#ffffff',
        surface: '#f5f5f5',
        onSurface: '#0a0a0a',
      },
      stats: { totalVerified: '8,400+', terminalProgress: 91 },
    },
  ],

  dashboard: {
    title: 'Identity as code.',
    institution: 'Chronos University Portal',
    role: 'Institutional Control',
    totalVerified: '24,500+',
    terminalProgress: 65,
  },

  faq: [
    {
      question: 'How are biometric logs stored?',
      answer:
        'Chronos never stores raw images. We use one-way salted hashing to generate unique 512-bit biometric keys. Data is encrypted at rest using AES-256 and in transit using TLS 1.3.',
    },
    {
      question: 'Does it support legacy hardware?',
      answer:
        'Yes. Our Rust-based drivers support DigitalPersona, Futronic, and SecuGen scanners natively, along with generic USB HID devices common in educational settings.',
    },
    {
      question: 'Can departments have isolated configurations?',
      answer:
        'Every department or campus gets its own isolated tenant with independent schema, styling, role-based access, and regional override policies — all from a single deployment.',
    },
    {
      question: 'What happens during a network outage?',
      answer:
        'Chronos operates fully offline with local SQLite-backed storage. When connectivity resumes, it synchronizes automatically via conflict-resolved delta sync.',
    },
  ],

  footer: {
    description:
      'Building the future of physical identity through secure, low-latency biometric infrastructure.',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Features', href: '#' },
          { label: 'Integrations', href: '#' },
          { label: 'Pricing', href: '#' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Docs', href: '#' },
          { label: 'API Specs', href: '#' },
          { label: 'Changelog', href: '#' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', href: '#' },
          { label: 'Contact', href: '#' },
          { label: 'Partners', href: '#' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
          { label: 'Security', href: '#' },
        ],
      },
    ],
    copyright:
      '\u00a9 2025 Chronos Biometrics Inc. All rights reserved. Built with Tauri & Rust.',
  },
}
