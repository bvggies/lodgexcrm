export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'assistant' | 'cleaner' | 'maintenance' | 'owner_view';
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}
