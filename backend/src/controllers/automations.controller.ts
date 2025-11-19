import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { automationService } from '../services/automations/automation.service';

export const getAutomations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { trigger, enabled } = req.query;

    const where: any = {};
    if (trigger) where.trigger = trigger;
    if (enabled !== undefined) where.enabled = enabled === 'true';

    const automations = await prisma.automation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: automations,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAutomation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return next(createError('Automation not found', 404));
    }

    res.json({
      success: true,
      data: automation,
    });
  } catch (error: any) {
    next(error);
  }
};

export const createAutomation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { name, description, trigger, conditions, actions, enabled } = req.body;

    if (!name || !trigger || !actions || !Array.isArray(actions)) {
      return next(createError('Name, trigger, and actions are required', 400));
    }

    // Validate actions structure
    for (const action of actions) {
      if (!action.type) {
        return next(createError('Each action must have a type', 400));
      }
    }

    const automation = await prisma.automation.create({
      data: {
        name,
        description: description || null,
        trigger,
        conditions: conditions || null,
        actions,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    // Audit log
    await auditLog('create', 'automations', automation.id, req.user.userId, {
      name: automation.name,
      trigger: automation.trigger,
    });

    res.status(201).json({
      success: true,
      data: automation,
      message: 'Automation created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateAutomation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const { name, description, trigger, conditions, actions, enabled } = req.body;

    // Check if automation exists
    const existing = await prisma.automation.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(createError('Automation not found', 404));
    }

    // Validate actions if provided
    if (actions && Array.isArray(actions)) {
      for (const action of actions) {
        if (!action.type) {
          return next(createError('Each action must have a type', 400));
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (actions !== undefined) updateData.actions = actions;
    if (enabled !== undefined) updateData.enabled = enabled;

    const automation = await prisma.automation.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await auditLog('update', 'automations', id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: automation,
      message: 'Automation updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteAutomation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if automation exists
    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return next(createError('Automation not found', 404));
    }

    await prisma.automation.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'automations', id, req.user.userId, {
      name: automation.name,
      trigger: automation.trigger,
    });

    res.json({
      success: true,
      message: 'Automation deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const triggerAutomation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { trigger, data } = req.body;

    const result = await automationService.triggerAutomation(trigger, data || {});

    res.json({
      success: true,
      data: result,
      message: `Triggered ${result.triggered} automation(s)`,
    });
  } catch (error: any) {
    next(error);
  }
};

