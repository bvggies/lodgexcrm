import prisma from '../../config/database';
import { automationQueue, emailQueue, syncQueue } from '../jobs/queue';

export interface AutomationRule {
  id?: string;
  name: string;
  trigger: string; // 'booking.created', 'booking.checkin', 'booking.checkout', 'scheduled.daily', 'scheduled.monthly'
  conditions?: Record<string, any>;
  actions: Array<{
    type: string;
    params: Record<string, any>;
  }>;
  enabled: boolean;
}

export class AutomationService {
  /**
   * Trigger automation based on event
   */
  async triggerAutomation(
    trigger: string,
    data: Record<string, any>
  ): Promise<{ triggered: number; errors: string[] }> {
    const result = { triggered: 0, errors: [] as string[] };

    try {
      // Get enabled automations for this trigger
      const automations = await prisma.automation.findMany({
        where: {
          trigger,
          enabled: true,
        },
      });

      for (const automation of automations) {
        try {
          // Check conditions if any
          if (automation.conditions) {
            const conditionsMet = this.evaluateConditions(
              automation.conditions as Record<string, any>,
              data
            );

            if (!conditionsMet) {
              continue;
            }
          }

          // Execute actions
          for (const action of automation.actions as Array<{
            type: string;
            params: Record<string, any>;
          }>) {
            await this.executeAction(action.type, { ...action.params, ...data });
          }

          result.triggered++;
        } catch (error: any) {
          result.errors.push(`Automation ${automation.name}: ${error.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Failed to trigger automations: ${error.message}`);
    }

    return result;
  }

  /**
   * Evaluate automation conditions
   * Supports: equals, notEquals, greaterThan, lessThan, contains, in, notIn
   */
  private evaluateConditions(
    conditions: Record<string, any>,
    data: Record<string, any>
  ): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions means always true
    }

    for (const [key, condition] of Object.entries(conditions)) {
      const dataValue = data[key];

      // Support for object conditions: { operator: 'equals', value: 'something' }
      if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
        const { operator, value } = condition;

        switch (operator) {
          case 'equals':
            if (dataValue !== value) return false;
            break;
          case 'notEquals':
            if (dataValue === value) return false;
            break;
          case 'greaterThan':
            if (!(dataValue > value)) return false;
            break;
          case 'lessThan':
            if (!(dataValue < value)) return false;
            break;
          case 'greaterThanOrEqual':
            if (!(dataValue >= value)) return false;
            break;
          case 'lessThanOrEqual':
            if (!(dataValue <= value)) return false;
            break;
          case 'contains':
            if (typeof dataValue === 'string' && !dataValue.includes(value)) return false;
            break;
          case 'in':
            if (!Array.isArray(value) || !value.includes(dataValue)) return false;
            break;
          case 'notIn':
            if (Array.isArray(value) && value.includes(dataValue)) return false;
            break;
          case 'exists':
            if (dataValue === undefined || dataValue === null) return false;
            break;
          case 'notExists':
            if (dataValue !== undefined && dataValue !== null) return false;
            break;
          default:
            // Fallback to simple equality
            if (dataValue !== value) return false;
        }
      } else {
        // Simple equality check (backward compatibility)
        if (dataValue !== condition) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Execute automation action
   */
  private async executeAction(
    actionType: string,
    params: Record<string, any>
  ): Promise<void> {
    switch (actionType) {
      case 'create_cleaning_task':
        await automationQueue.add('create_cleaning_task', {
          type: 'create_cleaning_task',
          data: params,
        });
        break;

      case 'send_email':
        await emailQueue.add('send-email', {
          to: params.to,
          subject: params.subject,
          template: params.template,
          data: params.data,
        });
        break;

      case 'send_checkin_email':
        await automationQueue.add('send_checkin_email', {
          type: 'send_checkin_email',
          data: params,
        });
        break;

      case 'send_checkout_email':
        await automationQueue.add('send_checkout_email', {
          type: 'send_checkout_email',
          data: params,
        });
        break;

      case 'create_maintenance_reminder':
        await automationQueue.add('maintenance_reminder', {
          type: 'maintenance_reminder',
          data: params,
        });
        break;

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Schedule recurring jobs
   */
  async scheduleRecurringJobs(): Promise<void> {
    // Daily sync jobs
    await syncQueue.add(
      'daily-sync-airbnb',
      {
        provider: 'airbnb',
        propertyMapping: {}, // Should be loaded from config
      },
      {
        repeat: {
          pattern: '0 2 * * *', // 2 AM daily
        },
      }
    );

    await syncQueue.add(
      'daily-sync-bookingcom',
      {
        provider: 'bookingcom',
        propertyMapping: {}, // Should be loaded from config
      },
      {
        repeat: {
          pattern: '0 3 * * *', // 3 AM daily
        },
      }
    );

    // Daily check-in/check-out reminders
    await automationQueue.add(
      'daily-checkin-reminders',
      {
        type: 'send_checkin_email',
        data: {},
      },
      {
        repeat: {
          pattern: '0 9 * * *', // 9 AM daily
        },
      }
    );

    await automationQueue.add(
      'daily-checkout-reminders',
      {
        type: 'send_checkout_email',
        data: {},
      },
      {
        repeat: {
          pattern: '0 9 * * *', // 9 AM daily
        },
      }
    );

    // Monthly owner statements
    await automationQueue.add(
      'monthly-owner-statements',
      {
        type: 'generate_owner_statement',
        data: {},
      },
      {
        repeat: {
          pattern: '0 10 1 * *', // 10 AM on 1st of every month
        },
      }
    );
  }
}

export const automationService = new AutomationService();

