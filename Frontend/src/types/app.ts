// Centralized frontend data types for mock data and UI layout tests

export type Id = string;

export interface AppUser {
  _id: Id;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'moderator' | 'staff';
  businessId: Id;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  profileCompleted?: boolean;
}

export interface AppStaff {
  _id: Id;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'staff';
  businessId: Id;
  createAt: string;
  updateAt: string;
}

export interface AppArea {
  _id: Id;
  name: string;
  location: string;
  policy?: string;
  capacity?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppVehicle {
  _id: Id;
  plateNumber: string;
  ownerId?: Id;
  ownerName?: string;
  vehicleType?: string;
  entryTime: string;
  leavingTime?: string;
  areaId: Id;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppParkingRecord {
  _id: Id;
  vehicleId?: Id;
  plateNumber: string;
  areaId: Id;
  datetime?: string;
  entryTime?: string;
  leavingTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppBusiness {
  _id: Id;
  name: string;
}

export interface AppReportPayload {
  name: string;
  areaId: Id;
  type: string;
  chartData: any[];
  chartImage?: string;
  filters: Record<string, unknown>;
  description: string;
}

export interface AppReportSummary {
  _id: Id;
  name: string;
  createdAt: string;
  type: string;
}

export interface AppReportDetail extends AppReportSummary {
  description: string;
  chartData: any[];
  filters: Record<string, unknown>;
  chartImage?: string;
}

export interface AppComment {
  _id: Id;
  reportId: Id;
  authorId: {
    _id: Id;
    firstName: string;
    lastName: string;
    username: string;
    email?: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  _id: Id;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: Id;
  businessId?: Id;
}

export interface AppReportShare {
  _id: Id;
  reportId: Id;
  sharedBy: Id;
  sharedWith: {
    _id: Id;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  };
  businessId: Id;
  permissions: string;
  createdAt: string;
}

export interface AppShareReportRequest {
  reportId: Id;
  userIds: Id[];
}


