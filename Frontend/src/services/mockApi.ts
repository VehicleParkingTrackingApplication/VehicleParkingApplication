import {
  mockAreas,
  mockVehicles,
  mockRecords,
  mockUsers,
  mockReports,
  mockReportSummaries,
  mockComments,
  mockNotifications,
  mockShares,
} from '@/mocks/data';

// Utility to build a Fetch-like Response from JSON
function jsonResponse(data: unknown, _ok = true, status = 200): Response {
  const body = JSON.stringify(data);
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Basic in-memory handlers keyed by pathname
export async function mockFetch(urlString: string, options?: RequestInit): Promise<Response> {
  const url = new URL(urlString, window.location.href);
  const { pathname, searchParams } = url;

  // Auth
  if (pathname.endsWith('/auth/me')) {
    return jsonResponse(mockUsers[0]);
  }

  // Areas
  if (pathname.endsWith('/area') || pathname.endsWith('/parking/area')) {
    return jsonResponse(mockAreas);
  }

  // Parking: existing vehicles and all records
  const existingVehiclesMatch = pathname.match(/parking\/vehicle\/(.+)\/existing-vehicles$/);
  if (existingVehiclesMatch) {
    const areaId = existingVehiclesMatch[1];
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    const filtered = mockVehicles.filter(v => v.areaId === areaId);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return jsonResponse({ success: true, data, page, limit, total: filtered.length });
  }

  const allRecordsMatch = pathname.match(/parking\/vehicle\/(.+)\/all-records$/);
  if (allRecordsMatch) {
    const areaId = allRecordsMatch[1];
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    const records = mockRecords.filter(r => r.areaId === areaId);
    const start = (page - 1) * limit;
    const data = records.slice(start, start + limit);
    // Some components expect either {data} or {records}; include both
    return jsonResponse({ success: true, data, records: data, page, limit, total: records.length });
  }

  // Reports
  if (pathname.endsWith('/reports')) {
    if (options?.method === 'POST') {
      // Naive echo save
      return jsonResponse({ success: true, report: { _id: 'rpt_new', ...(options?.body ? JSON.parse(String(options.body)) : {}) } });
    }
    return jsonResponse({ success: true, data: mockReportSummaries });
  }

  const reportByIdMatch = pathname.match(/\/reports\/(.+)$/);
  if (reportByIdMatch) {
    const id = reportByIdMatch[1];
    const found = mockReports.find(r => r._id === id) || mockReports[0];
    return jsonResponse(found);
  }

  // Shares
  if (pathname.includes('/shares')) {
    return jsonResponse({ success: true, data: mockShares });
  }

  // Comments
  const commentsForReport = pathname.match(/\/comments\/(.+)$/);
  if (commentsForReport && (!options || options.method === 'GET')) {
    const reportId = commentsForReport[1];
    const data = mockComments.filter(c => c.reportId === reportId);
    return jsonResponse({ success: true, data, message: 'ok' });
  }
  if (pathname.endsWith('/comments') && options?.method === 'POST') {
    const body = options?.body ? JSON.parse(String(options.body)) : { content: '' };
    const newItem = {
      _id: `cmt_${Date.now()}`,
      reportId: body.reportId || 'rpt_001',
      authorId: {
        _id: 'user_admin', firstName: 'Ada', lastName: 'Lovelace', username: 'admin', email: 'admin@acme.test'
      },
      content: body.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return jsonResponse({ success: true, data: newItem, message: 'created' }, true, 201);
  }

  // Notifications
  if (pathname.includes('/notification/')) {
    if (pathname.endsWith('/getAllNotifications') || pathname.endsWith('/recent')) {
      const unreadCount = mockNotifications.filter(n => !n.isRead).length;
      return jsonResponse({ notifications: mockNotifications, unreadCount });
    }
    return jsonResponse({ notifications: mockNotifications, unreadCount: 3 });
  }

  // Fallback: return 404-like JSON
  return jsonResponse({ message: `No mock for ${pathname}` }, false, 404);
}


