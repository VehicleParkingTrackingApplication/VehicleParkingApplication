import { 
  fetchAuthApi, 
  postAuthApi
} from '@/services/api';


export interface FtpPayload {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  secureOptions?: object;
  selectedFolder?: string;
}

export interface AreaPayload {
  name: string;
}

export interface CreateAreaPayload {
  name: string;
  capacity: number;
  location: string;
  policy?: string;
}

export const getAllParkingAreas = async () => {
  const res = await fetchAuthApi('parking/area');
  if (!res.ok) throw new Error('Failed to fetch parking areas');
  return res.json();
};

export const createParkingArea = async (payload: AreaPayload) => {
  const res = await postAuthApi('parking/area', undefined, JSON.stringify(payload));
  if (!res.ok) throw new Error('Failed to create parking area');
  return res.json();
};

export const inputParkingArea = async (payload: CreateAreaPayload) => {
  const res = await postAuthApi('parking/area/input-area', undefined, JSON.stringify(payload));
  if (!res.ok) throw new Error('Failed to create parking area');
  return res.json();
};

export const saveFtpServer = async (areaId: string, ftp: FtpPayload) => {
  const res = await postAuthApi(`parking/area/${areaId}/input-ftpserver`, undefined, JSON.stringify(ftp));
  if (!res.ok) throw new Error('Failed to save FTP server');
  return res.json();
};

export const checkFtpServerStatus = async (areaId: string, ftp: FtpPayload) => {
  const res = await postAuthApi(`parking/area/${areaId}/status-ftpserver`, undefined, JSON.stringify(ftp));
  if (!res.ok) throw new Error('Failed to check FTP server status');
  return res.json();
};

export const getRecentRecords = async (areaId: string) => {
  const res = await fetchAuthApi(`parking/vehicle/${areaId}/recent-records`);
  if (!res.ok) throw new Error('Failed to fetch recent records');
  return res.json();
};

export const getExistingVehicles = async (areaId: string, page: number = 1, limit: number = 10) => {
  const res = await fetchAuthApi(`parking/vehicle/${areaId}/existing-vehicles`, { page: page.toString(), limit: limit.toString() });
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
};

export const getAllRecords = async (areaId: string, page: number = 1, limit: number = 10) => {
  const res = await fetchAuthApi(`parking/vehicle/${areaId}/all-records`, { page: page.toString(), limit: limit.toString() });
  if (!res.ok) throw new Error('Failed to fetch records');
  return res.json();
};

export const getVehicleEntryPredictions = async (timestamps: string[]) => {
  const res = await fetch('http://localhost:5001/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamps }),
  });
  if (!res.ok) throw new Error('Failed to fetch vehicle entry predictions');
  return res.json();
};

export const triggerFtpFetch = async (areaId: string) => {
  const res = await postAuthApi(`parking/area/${areaId}/trigger-ftp`);
  if (!res.ok) throw new Error('Failed to trigger FTP fetch');
  return res.json();
};