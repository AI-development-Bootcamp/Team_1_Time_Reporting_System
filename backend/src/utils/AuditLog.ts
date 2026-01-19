import { Request } from 'express';

export type AuditAction =
  | 'CREATE_ATTENDANCE'
  | 'UPDATE_ATTENDANCE'
  | 'CREATE_TIME_LOG'
  | 'UPDATE_TIME_LOG'
  | 'DELETE_TIME_LOG';

export interface AuditLogParams {
  action: AuditAction;
  userId: string | bigint;
  entity: string;
  entityId: string | bigint;
  payload?: Record<string, unknown>;
  req?: Request;
}

/**
 * Log an audit entry to console (temporary solution until proper audit logging is added)
 * Call this AFTER a successful DB write
 */
export function logAudit({ action, userId, entity, entityId, payload, req }: AuditLogParams): void {
  const logEntry = {
    action,
    userId: userId.toString(),
    entity,
    entityId: entityId.toString(),
    payload,
    ip: req?.ip || req?.socket?.remoteAddress || 'unknown',
    userAgent: req?.get('user-agent') || 'unknown',
    at: new Date().toISOString(),
  };

  console.log('[AUDIT]', JSON.stringify(logEntry));
}
