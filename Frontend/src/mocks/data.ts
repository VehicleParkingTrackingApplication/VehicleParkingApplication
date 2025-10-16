import type {
  AppUser,
  AppStaff,
  AppArea,
  AppVehicle,
  AppParkingRecord,
  AppBusiness,
  AppReportPayload,
  AppReportSummary,
  AppReportDetail,
  AppComment,
  AppNotification,
  AppReportShare,
} from '@/types/app';

// Helpers
const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000);

export const mockBusiness: AppBusiness = {
  _id: 'biz_001',
  name: 'Acme Parking Co.',
};

export const mockUsers: AppUser[] = [
  {
    _id: 'user_admin',
    username: 'admin',
    email: 'admin@acme.test',
    role: 'admin',
    businessId: mockBusiness._id,
    createdAt: iso(daysAgo(120)),
    firstName: 'Ada',
    lastName: 'Lovelace',
    profileCompleted: true,
  },
  {
    _id: 'user_jane',
    username: 'jane',
    email: 'jane@acme.test',
    role: 'user',
    businessId: mockBusiness._id,
    createdAt: iso(daysAgo(60)),
    firstName: 'Jane',
    lastName: 'Doe',
    profileCompleted: true,
  },
];

export const mockStaff: AppStaff[] = [
  {
    _id: 'staff_001',
    username: 'staffer',
    firstName: 'Sam',
    lastName: 'Staff',
    email: 'sam.staff@acme.test',
    role: 'staff',
    businessId: mockBusiness._id,
    createAt: iso(daysAgo(30)),
    updateAt: iso(daysAgo(1)),
  },
];

export const mockAreas: AppArea[] = [
  {
    _id: 'area_a',
    name: 'Lot A',
    location: 'North Entrance',
    policy: '2 hours free',
    capacity: 120,
    isActive: true,
    createdAt: iso(daysAgo(200)),
    updatedAt: iso(daysAgo(1)),
  },
  {
    _id: 'area_b',
    name: 'Lot B',
    location: 'South Wing',
    policy: 'Paid parking',
    capacity: 80,
    isActive: true,
    createdAt: iso(daysAgo(150)),
    updatedAt: iso(daysAgo(2)),
  },
];

export const mockVehicles: AppVehicle[] = [
  {
    _id: 'veh_001',
    plateNumber: 'ABC123',
    ownerName: 'John Carter',
    vehicleType: 'Sedan',
    entryTime: iso(hoursAgo(5)),
    areaId: 'area_a',
  },
  {
    _id: 'veh_002',
    plateNumber: 'XYZ789',
    ownerName: 'Mary Sue',
    vehicleType: 'SUV',
    entryTime: iso(hoursAgo(2)),
    leavingTime: iso(hoursAgo(1)),
    areaId: 'area_b',
  },
];

export const mockRecords: AppParkingRecord[] = [
  {
    _id: 'rec_001',
    plateNumber: 'ABC123',
    areaId: 'area_a',
    entryTime: iso(hoursAgo(5)),
    leavingTime: undefined,
    createdAt: iso(hoursAgo(5)),
  },
  {
    _id: 'rec_002',
    plateNumber: 'XYZ789',
    areaId: 'area_b',
    entryTime: iso(hoursAgo(2)),
    leavingTime: iso(hoursAgo(1)),
    createdAt: iso(hoursAgo(2)),
  },
  {
    _id: 'rec_003',
    plateNumber: 'DPG85M',
    areaId: 'area_a',
    datetime: iso(hoursAgo(26)),
    createdAt: iso(hoursAgo(26)),
  },
];

export const mockReports: AppReportDetail[] = [
  {
    _id: 'rpt_001',
    name: 'Hourly Activity - Lot A',
    createdAt: iso(daysAgo(3)),
    type: 'hourly-activity',
    description: 'Distribution of entries per hour',
    chartData: [
      { hour: '08:00', entries: 12 },
      { hour: '09:00', entries: 20 },
      { hour: '10:00', entries: 17 },
    ],
    filters: { startDate: iso(daysAgo(7)).substring(0, 10), endDate: iso(now).substring(0, 10), areaId: 'area_a' },
  },
  {
    _id: 'rpt_002',
    name: 'Entries Over Time - Lot B',
    createdAt: iso(daysAgo(10)),
    type: 'entries-over-time',
    description: 'Entries trend for last 2 weeks',
    chartData: [
      { date: iso(daysAgo(14)).substring(0, 10), entries: 30 },
      { date: iso(daysAgo(7)).substring(0, 10), entries: 45 },
      { date: iso(daysAgo(0)).substring(0, 10), entries: 40 },
    ],
    filters: { areaId: 'area_b' },
  },
];

export const mockComments: AppComment[] = [
  {
    _id: 'cmt_001',
    reportId: 'rpt_001',
    authorId: {
      _id: 'user_admin',
      firstName: 'Ada',
      lastName: 'Lovelace',
      username: 'admin',
      email: 'admin@acme.test',
    },
    content: 'Looks good. Can we add a comparison to last week?',
    createdAt: iso(daysAgo(2)),
    updatedAt: iso(daysAgo(2)),
  },
  {
    _id: 'cmt_002',
    reportId: 'rpt_001',
    authorId: {
      _id: 'user_jane',
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'jane',
      email: 'jane@acme.test',
    },
    content: 'Added chart image in the latest save.',
    createdAt: iso(daysAgo(1)),
    updatedAt: iso(daysAgo(1)),
  },
];

export const mockNotifications: AppNotification[] = [
  {
    _id: 'ntf_001',
    title: 'System Maintenance',
    message: 'We will have maintenance at 2 AM UTC.',
    type: 'info',
    isRead: false,
    createdAt: iso(daysAgo(1)),
    updatedAt: iso(daysAgo(1)),
    businessId: mockBusiness._id,
  },
  {
    _id: 'ntf_002',
    title: 'High Traffic Alert',
    message: 'Lot A is nearing capacity.',
    type: 'warning',
    isRead: false,
    createdAt: iso(hoursAgo(3)),
    updatedAt: iso(hoursAgo(3)),
    businessId: mockBusiness._id,
  },
  {
    _id: 'ntf_003',
    title: 'New Report Shared',
    message: 'A report has been shared with you.',
    type: 'success',
    isRead: true,
    createdAt: iso(daysAgo(5)),
    updatedAt: iso(daysAgo(5)),
    userId: 'user_jane',
  },
];

export const mockShares: AppReportShare[] = [
  {
    _id: 'shr_001',
    reportId: 'rpt_001',
    sharedBy: 'user_admin',
    sharedWith: {
      _id: 'user_jane',
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'jane',
      email: 'jane@acme.test',
    },
    businessId: mockBusiness._id,
    permissions: 'read',
    createdAt: iso(daysAgo(2)),
  },
];

// Convenience projections used by some components/services
export const mockReportSummaries: AppReportSummary[] = mockReports.map(r => ({
  _id: r._id,
  name: r.name,
  createdAt: r.createdAt,
  type: r.type,
}));


