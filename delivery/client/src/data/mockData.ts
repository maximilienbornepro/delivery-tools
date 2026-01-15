import type { Sprint, Release, ConfidenceData } from '../types';

export const sprints: Sprint[] = [
  { id: 's1', name: 'S1 PI 1 2026', startDate: '2026-01-19', endDate: '2026-02-01' },
  { id: 's2', name: 'S2 PI 1 2026', startDate: '2026-02-02', endDate: '2026-02-15' },
  { id: 's3', name: 'S3 PI 1 2026', startDate: '2026-02-16', endDate: '2026-03-01' },
];

export const releases: Release[] = [
  {
    id: 'r1',
    date: '07/11/2025',
    version: '5.9.0',
    issues: [
      { key: 'TVSMART-1', summary: 'MVP Jeunesse (recherche, menu dedie)' },
      { key: 'TVSMART-2', summary: 'Menu TV via l\'API (ftv et jeunesse)' },
    ],
  },
  {
    id: 'r2',
    date: 'XX/XX/XXXX',
    version: '11.10.0',
    issues: [
      { key: 'TVSMART-3', summary: 'Page Article' },
      { key: 'TVSMART-4', summary: 'MAJ Player 7.14.2 (Quantatec)' },
    ],
  },
  {
    id: 'r3',
    date: 'XX/XX/XXXX',
    version: '5.10.0',
    issues: [
      { key: 'TVSMART-5', summary: 'MVP Jeunesse (retrait bloc reco)' },
      { key: 'TVSMART-6', summary: 'SFR Logs' },
    ],
  },
];

export const confidenceData: ConfidenceData = {
  piId: 'pi1',
  projectId: 'TVSMART',
  score: 3.6,
  questions: [],
  improvements: [
    { id: 1, label: 'conges non obligatoire' },
    { id: 2, label: 'visibilite des RC (QA)' },
  ],
};
