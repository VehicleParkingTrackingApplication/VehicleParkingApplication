// @ts-check

import { deleteApi, fetchApi, postApi, putApi, fetchAuthApi, postAuthApi, putAuthApi, deleteAuthApi } from "./api";

// Type definitions for your application
export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  _id: string;
  name: string;
  description?: string;
  location: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  _id: string;
  plateNumber: string;
  ownerId: string;
  ownerName: string;
  vehicleType: string;
  entryTime: string;
  exitTime?: string;
  areaId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingRecord {
  _id: string;
  vehicleId: string;
  areaId: string;
  entryTime: string;
  exitTime?: string;
  duration?: number;
  fee?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  _id: string;
  name: string;
  description?: string;
  address: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Statistics {
  totalVehicles: number;
  totalAreas: number;
  totalRecords: number;
  totalRevenue: number;
  activeVehicles: number;
  dailyStats: Array<{
    date: string;
    vehicles: number;
    revenue: number;
  }>;
}

/**
 * @typedef FindVehicleParams
 * @property {string=} plateNumber
 * @property {string=} areaId
 * @property {string=} ownerName
 * @property {boolean=} isActive
 */

/**
 * @param {FindVehicleParams} params
 * @returns {Promise<Vehicle[]>}
 */
export async function findVehicles(params?: {
  plateNumber?: string;
  areaId?: string;
  ownerName?: string;
  isActive?: boolean;
}): Promise<Vehicle[]> {
  const response = await fetchApi("vehicles", params);
  if (!response.ok) {
    return [];
  } else {
    return await response.json();
  }
}

/**
 * @param {string} vehicleId
 * @returns {Promise<Vehicle | null>}
 */
export async function getVehicle(vehicleId: string): Promise<Vehicle | null> {
  const response = await fetchApi("vehicles", { id: vehicleId });
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

/**
 * @returns {Promise<Vehicle[]>}
 */
export async function getVehicles(): Promise<Vehicle[]> {
  const response = await fetchApi("vehicles");
  if (!response.ok) {
    return [];
  }
  return await response.json();
}

/**
 * @param {Partial<Vehicle>} vehicleData
 * @returns {Promise<Vehicle | null>}
 */
export async function createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle | null> {
  const response = await postApi("vehicles", {}, JSON.stringify(vehicleData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} vehicleId
 * @param {Partial<Vehicle>} vehicleData
 * @returns {Promise<Vehicle | null>}
 */
export async function updateVehicle(vehicleId: string, vehicleData: Partial<Vehicle>): Promise<Vehicle | null> {
  const response = await putApi("vehicles", { id: vehicleId }, JSON.stringify(vehicleData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} vehicleId
 * @returns {Promise<boolean>}
 */
export async function deleteVehicle(vehicleId: string): Promise<boolean> {
  const response = await deleteApi("vehicles", { id: vehicleId });
  return response.ok;
}

/**
 * @returns {Promise<Area[]>}
 */
export async function getAreas(): Promise<Area[]> {
  const response = await fetchApi("areas");
  if (!response.ok) {
    return [];
  }
  return await response.json();
}

/**
 * @param {string} areaId
 * @returns {Promise<Area | null>}
 */
export async function getArea(areaId: string): Promise<Area | null> {
  const response = await fetchApi("areas", { id: areaId });
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

/**
 * @param {Partial<Area>} areaData
 * @returns {Promise<Area | null>}
 */
export async function createArea(areaData: Partial<Area>): Promise<Area | null> {
  const response = await postApi("areas", {}, JSON.stringify(areaData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} areaId
 * @param {Partial<Area>} areaData
 * @returns {Promise<Area | null>}
 */
export async function updateArea(areaId: string, areaData: Partial<Area>): Promise<Area | null> {
  const response = await putApi("areas", { id: areaId }, JSON.stringify(areaData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} areaId
 * @returns {Promise<boolean>}
 */
export async function deleteArea(areaId: string): Promise<boolean> {
  const response = await deleteApi("areas", { id: areaId });
  return response.ok;
}

/**
 * @returns {Promise<ParkingRecord[]>}
 */
export async function getRecords(): Promise<ParkingRecord[]> {
  const response = await fetchApi("records");
  if (!response.ok) {
    return [];
  }
  return await response.json();
}

/**
 * @param {string} recordId
 * @returns {Promise<ParkingRecord | null>}
 */
export async function getRecord(recordId: string): Promise<ParkingRecord | null> {
  const response = await fetchApi("records", { id: recordId });
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

/**
 * @param {string=} areaId
 * @returns {Promise<ParkingRecord[]>}
 */
export async function getRecordsByArea(areaId?: string): Promise<ParkingRecord[]> {
  const response = await fetchApi("records", areaId ? { areaId } : undefined);
  if (!response.ok) {
    return [];
  } else {
    return await response.json();
  }
}

/**
 * @param {Partial<ParkingRecord>} recordData
 * @returns {Promise<ParkingRecord | null>}
 */
export async function createRecord(recordData: Partial<ParkingRecord>): Promise<ParkingRecord | null> {
  const response = await postApi("records", {}, JSON.stringify(recordData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} recordId
 * @param {Partial<ParkingRecord>} recordData
 * @returns {Promise<ParkingRecord | null>}
 */
export async function updateRecord(recordId: string, recordData: Partial<ParkingRecord>): Promise<ParkingRecord | null> {
  const response = await putApi("records", { id: recordId }, JSON.stringify(recordData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @returns {Promise<User[]>}
 */
export async function getUsers(): Promise<User[]> {
  const response = await fetchApi("users");
  if (!response.ok) {
    return [];
  }
  return await response.json();
}

/**
 * @param {string} userId
 * @returns {Promise<User | null>}
 */
export async function getUser(userId: string): Promise<User | null> {
  const response = await fetchApi("users", { id: userId });
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

/**
 * @param {Partial<User>} userData
 * @returns {Promise<User | null>}
 */
export async function createUser(userData: Partial<User>): Promise<User | null> {
  const response = await postApi("users", {}, JSON.stringify(userData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} userId
 * @param {Partial<User>} userData
 * @returns {Promise<User | null>}
 */
export async function updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
  const response = await putApi("users", { id: userId }, JSON.stringify(userData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const response = await deleteApi("users", { id: userId });
  return response.ok;
}

/**
 * @returns {Promise<Business[]>}
 */
export async function getBusinesses(): Promise<Business[]> {
  const response = await fetchApi("businesses");
  if (!response.ok) {
    return [];
  }
  return await response.json();
}

/**
 * @param {string} businessId
 * @returns {Promise<Business | null>}
 */
export async function getBusiness(businessId: string): Promise<Business | null> {
  const response = await fetchApi("businesses", { id: businessId });
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

/**
 * @param {Partial<Business>} businessData
 * @returns {Promise<Business | null>}
 */
export async function createBusiness(businessData: Partial<Business>): Promise<Business | null> {
  const response = await postApi("businesses", {}, JSON.stringify(businessData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} businessId
 * @param {Partial<Business>} businessData
 * @returns {Promise<Business | null>}
 */
export async function updateBusiness(businessId: string, businessData: Partial<Business>): Promise<Business | null> {
  const response = await putApi("businesses", { id: businessId }, JSON.stringify(businessData));
  if (!response.ok) {
    return null;
  } else {
    return await response.json();
  }
}

/**
 * @param {string} businessId
 * @returns {Promise<boolean>}
 */
export async function deleteBusiness(businessId: string): Promise<boolean> {
  const response = await deleteApi("businesses", { id: businessId });
  return response.ok;
}

/**
 * @param {Date=} startDate
 * @param {Date=} endDate
 * @returns {Promise<Statistics | null>}
 */
export async function getStatistics(startDate?: Date, endDate?: Date): Promise<Statistics | null> {
  const params: Record<string, any> = {};
  if (startDate) {
    params.startDate = startDate.toISOString();
  }
  if (endDate) {
    params.endDate = endDate.toISOString();
  }

  const response = await fetchApi("statistics", Object.keys(params).length > 0 ? params : undefined);
  if (!response.ok) {
    return {
      totalVehicles: 0,
      totalAreas: 0,
      totalRecords: 0,
      totalRevenue: 0,
      activeVehicles: 0,
      dailyStats: []
    };
  }
  return await response.json();
}

/**
 * @returns {Promise<{ message: string; accessToken: string } | null>}
 */
export async function refreshToken(): Promise<{ message: string; accessToken: string } | null> {
  const response = await postApi("auth/refresh");
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ message: string; accessToken: string } | null>}
 */
export async function login(username: string, password: string): Promise<{ message: string; accessToken: string } | null> {
  const response = await postApi("auth/login", {}, JSON.stringify({ username, password }));
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

/**
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ message: string; accessToken: string } | null>}
 */
export async function register(username: string, email: string, password: string): Promise<{ message: string; accessToken: string } | null> {
  const response = await postApi("auth/register", {}, JSON.stringify({ username, email, password }));
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

/**
 * @returns {Promise<boolean>}
 */
export async function logout(): Promise<boolean> {
  const response = await postApi("auth/logout");
  return response.ok;
}

/**
 * @returns {Promise<User | null>}
 */
export async function getCurrentUser(): Promise<User | null> {
  const response = await fetchAuthApi("auth/me");
  if (!response.ok) {
    return null;
  }
  return await response.json();
} 