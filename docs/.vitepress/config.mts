import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ValkáriaV2',
  description: 'RPG chatbot with intelligent NPCs via LangGraph',
  base: '/ValkariaChatBot-v2/',
  ignoreDeadLinks: [/^http:\/\/localhost/],

  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Services', link: '/services/auth-service' },
      { text: 'Development', link: '/development/getting-started' },
      { text: 'Changelog', link: '/changelog/' },
    ],

    sidebar: {
      '/architecture/': [
        { text: 'Overview', link: '/architecture/overview' },
        { text: 'Decisions (ADRs)', link: '/architecture/decisions' },
        { text: 'Data Model', link: '/architecture/data-model' },
      ],
      '/services/': [
        { text: 'auth-service', link: '/services/auth-service' },
        { text: 'chat-service', link: '/services/chat-service' },
        { text: 'world-service', link: '/services/world-service' },
        { text: 'ingestion-worker', link: '/services/ingestion-worker' },
      ],
      '/development/': [
        { text: 'Getting Started', link: '/development/getting-started' },
        { text: 'Environment Vars', link: '/development/environment' },
        { text: 'Stack Reference', link: '/development/stack' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/FelipeAmalfi/ValkariaChatBot-v2' },
    ],

    search: { provider: 'local' },

    footer: {
      message: 'ValkáriaV2 — spec-driven RPG chatbot',
    },
  },
})
