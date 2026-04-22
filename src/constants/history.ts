import { VersionEntry } from '../types';

export const APP_HISTORY: VersionEntry[] = [
  {
    version: '1.3.0',
    date: '2026-04-22',
    changes: {
      added: [
        'Adaptive Theme System (Light, Dark, System)',
        'Soft Dark Mode styles (Soft Purple & Soft Blue)',
        'Appearance management section in settings'
      ],
      improved: [
        'Color consistency across all UI components',
        'Smooth theme transitions'
      ]
    }
  },
  {
    version: '1.2.0',
    date: '2026-04-22',
    changes: {
      added: [
        'Dynamic App Version History system',
        'Automatic version incrementing logic',
        'Expandable update log UI in settings'
      ],
      improved: [
        'System initialization sequence for PWA stability',
        'Metadata persistence across updates'
      ]
    }
  },
  {
    version: '1.1.0',
    date: '2026-04-21',
    changes: {
      added: [
        'Offline-first PWA conversion',
        'IndexedDB persistent storage for absolute offline reliability',
        'Service Worker with Cache-First strategy',
        'Standalone mode support'
      ],
      improved: [
        'Fast load from cache',
        'Offline Mode UI indicator (floating pill)',
        'Import flow stabilization'
      ]
    }
  },
  {
    version: '1.0.5',
    date: '2026-04-21',
    changes: {
      added: [
        'Smart Grouping by minutes/numbers',
        'Group-level multi-selection in library',
        'Selection count indicator'
      ],
      fixed: [
        'Race condition in multi-file imports',
        'Playlist scroll behavior overlap issue'
      ]
    }
  }
];

export const CURRENT_VERSION = APP_HISTORY[0].version;
