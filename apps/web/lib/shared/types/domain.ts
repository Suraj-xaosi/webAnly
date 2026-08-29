// Domain/project model types
export interface Domain {
  id: string;
  domainName: string;
  apikey: string;
  isActive: boolean;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Session/User types (extend as needed)
export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
}
