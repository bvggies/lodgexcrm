// Automation model definition (to be added to Prisma schema)
// This is a TypeScript interface representing the automation table

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions?: Record<string, any>;
  actions: Array<{
    type: string;
    params: Record<string, any>;
  }>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

