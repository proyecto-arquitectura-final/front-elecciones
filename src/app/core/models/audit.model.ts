export interface AuditEvent {
  id?: number;
  at: string;
  username: string;
  action: string;
  entity: string;
  entityId?: number;
  details: string;
  ip: string;
  success: boolean;
}
