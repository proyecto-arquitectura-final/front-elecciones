export interface AuditEvent {
  id: number;
  at: string;
  username: string;
  action: string;
  entity: string;
  entityId?: number | null;
  details: string;
  ip: string;
  success: boolean;
}

export interface AuditCounters {
  total: number;
  successful: number;
  failed: number;
  users: number;
}

export interface AuditPage {
  items: AuditEvent[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditManagement {
  counters: AuditCounters;
  events: AuditPage;
  actions: string[];
  entities: string[];
  generatedAt: string;
}

export interface AuditFilters {
  search?: string;
  action?: string;
  entity?: string;
  success?: boolean | null;
  page?: number;
  size?: number;
}
