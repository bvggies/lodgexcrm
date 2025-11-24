export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'assistant' | 'cleaner' | 'maintenance' | 'owner_view' | 'guest';
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  guestId?: string | null;
  owner?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  createdAt: string;
}
