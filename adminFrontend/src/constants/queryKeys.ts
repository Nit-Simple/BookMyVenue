export const queryKeys = {
  venues: {
    all: ['admin', 'venues'] as const,
    list: (filters?: Record<string, string>) => ['admin', 'venues', 'list', filters ?? {}] as const,
  },
  applications: {
    all: ['admin', 'applications'] as const,
    list: (status: string) => ['admin', 'applications', 'list', status] as const,
    detail: (id: string) => ['admin', 'applications', 'detail', id] as const,
  },
  dashboard: {
    data: () => ['admin', 'dashboard'] as const,
  },
};
