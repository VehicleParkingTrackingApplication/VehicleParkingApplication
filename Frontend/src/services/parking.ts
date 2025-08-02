import { fetchApi, postApi, putApi } from '@/services/api';

export interface FtpPayload {
  protocol: string;
  encryption: string;
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface AreaPayload {
  name: string;
}

export const getAllParkingAreas = async () => {
  const res = await fetchApi('parking-areas');
  if (!res.ok) throw new Error('Failed to fetch parking areas');
  return res.json();
};

export const createParkingArea = async (payload: AreaPayload) => {
  const res = await postApi('parking-areas', undefined, JSON.stringify(payload));
  if (!res.ok) throw new Error('Failed to create parking area');
  return res.json();
};

export const updateFtpServer = async (areaId: string, ftp: FtpPayload) => {
  const res = await putApi(`parking-areas/${areaId}/ftp`, undefined, JSON.stringify(ftp));
  if (!res.ok) throw new Error('Failed to update FTP server');
  return res.json();
};

export const getRecentRecords = async (areaId: string) => {
  const res = await fetchApi(`parking-areas/${areaId}/recent-records`);
  if (!res.ok) throw new Error('Failed to fetch recent records');
  return res.json();
};

export const getAllVehicles = async (areaId: string, page: number = 1, limit: number = 20) => {
  const res = await fetchApi(`parking-areas/${areaId}/vehicles`, { page: page.toString(), limit: limit.toString() });
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
};
