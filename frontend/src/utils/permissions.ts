export type StaffRole = 'admin' | 'assistant' | 'cleaner' | 'maintenance' | 'owner_view';

export interface User {
  id: string;
  role: StaffRole;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Permission utility functions for role-based access control
 */
export const permissions = {
  /**
   * Check if user is admin
   */
  isAdmin: (role?: StaffRole): boolean => role === 'admin',

  /**
   * Check if user is assistant or admin
   */
  isAssistant: (role?: StaffRole): boolean => role === 'assistant' || role === 'admin',

  /**
   * Check if user is cleaner or admin
   */
  isCleaner: (role?: StaffRole): boolean => role === 'cleaner' || role === 'admin',

  /**
   * Check if user is maintenance or admin
   */
  isMaintenance: (role?: StaffRole): boolean => role === 'maintenance' || role === 'admin',

  /**
   * Check if user is owner view or admin
   */
  isOwnerView: (role?: StaffRole): boolean => role === 'owner_view' || role === 'admin',

  /**
   * Check if user can manage bookings
   */
  canManageBookings: (role?: StaffRole): boolean =>
    role === 'admin' || role === 'assistant',

  /**
   * Check if user can manage guests
   */
  canManageGuests: (role?: StaffRole): boolean =>
    role === 'admin' || role === 'assistant',

  /**
   * Check if user can manage properties
   */
  canManageProperties: (role?: StaffRole): boolean =>
    role === 'admin' || role === 'assistant',

  /**
   * Check if user can manage finance
   */
  canManageFinance: (role?: StaffRole): boolean =>
    role === 'admin' || role === 'assistant',

  /**
   * Check if user can manage staff
   */
  canManageStaff: (role?: StaffRole): boolean => role === 'admin',

  /**
   * Check if user can view analytics
   */
  canViewAnalytics: (role?: StaffRole): boolean =>
    role === 'admin' || role === 'assistant' || role === 'owner_view',

  /**
   * Check if user can manage integrations
   */
  canManageIntegrations: (role?: StaffRole): boolean => role === 'admin',

  /**
   * Check if user can manage automations
   */
  canManageAutomations: (role?: StaffRole): boolean => role === 'admin',

  /**
   * Check if user can view audit logs
   */
  canViewAuditLogs: (role?: StaffRole): boolean => role === 'admin',

  /**
   * Check if user can import data
   */
  canImportData: (role?: StaffRole): boolean => role === 'admin',

  /**
   * Check if user can delete records
   */
  canDelete: (role?: StaffRole): boolean => role === 'admin',

  /**
   * Check if user can edit records
   */
  canEdit: (role?: StaffRole, resourceType?: string): boolean => {
    if (role === 'admin') return true;
    if (role === 'assistant') {
      // Assistants can edit most things except staff and system settings
      return resourceType !== 'staff' && resourceType !== 'system';
    }
    if (role === 'cleaner') {
      // Cleaners can only edit their own cleaning tasks
      return resourceType === 'cleaning';
    }
    if (role === 'maintenance') {
      // Maintenance can only edit their own maintenance tasks
      return resourceType === 'maintenance';
    }
    return false;
  },

  /**
   * Get allowed actions for a role
   */
  getAllowedActions: (role?: StaffRole): string[] => {
    if (!role) return [];
    
    const actions: string[] = ['view'];
    
    if (permissions.isAdmin(role)) {
      return ['view', 'create', 'edit', 'delete', 'manage'];
    }
    
    if (permissions.isAssistant(role)) {
      return ['view', 'create', 'edit'];
    }
    
    if (permissions.isCleaner(role)) {
      return ['view', 'edit']; // Can edit their own tasks
    }
    
    if (permissions.isMaintenance(role)) {
      return ['view', 'edit']; // Can edit their own tasks
    }
    
    if (permissions.isOwnerView(role)) {
      return ['view']; // Read-only
    }
    
    return actions;
  },
};

/**
 * Higher-order component or hook helper to check permissions
 */
export const hasPermission = (
  user: User | null | undefined,
  permission: (role?: StaffRole) => boolean
): boolean => {
  if (!user) return false;
  return permission(user.role);
};

