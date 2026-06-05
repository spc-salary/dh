'use strict';

const LOG_KEY  = 'homs_activity_logs';
const MAX_LOGS = 2000;

const LOG_TYPES = {
  LOGIN:           'تسجيل دخول',
  LOGOUT:          'تسجيل خروج',
  REGISTER:        'تسجيل حساب جديد',
  LOGIN_FAIL:      'محاولة دخول فاشلة',
  ENTRY_ADD:       'إضافة منشأة',
  ENTRY_VIEW:      'عرض منشأة',
  RATING_ADD:      'تقييم منشأة',
  USER_CREATE:     'إنشاء مستخدم',
  USER_UPDATE:     'تعديل مستخدم',
  USER_DELETE:     'حذف مستخدم',
  USER_SUSPEND:    'إيقاف مستخدم',
  USER_ACTIVATE:   'تفعيل مستخدم',
  ADMIN_ACTION:    'إجراء إداري',
  PASSWORD_RESET:  'إعادة تعيين كلمة مرور',
  SEARCH:          'بحث في الدليل',
  PAGE_VISIT:      'زيارة صفحة',
  MAP_VIEW:        'عرض موقع خريطة',
};

function getLogs() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLogs(logs) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(logs)); } catch {}
}

function logActivity(type, details = '', extraData = {}) {
  const logs = getLogs();

  let username = 'زائر';
  let userId   = null;
  let role     = 'guest';
  try {
    const session = JSON.parse(localStorage.getItem('homs_session') || 'null');
    if (session && session.username) {
      username = session.username;
      userId   = session.userId;
      role     = session.role;
    }
  } catch {}

  const entry = {
    id:        'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    type,
    typeLabel: LOG_TYPES[type] || type,
    username,
    userId,
    role,
    details,
    ip:        'محلي',
    userAgent: navigator.userAgent.slice(0, 80),
    ...extraData,
  };

  logs.unshift(entry);
  if (logs.length > MAX_LOGS) logs.splice(MAX_LOGS);
  saveLogs(logs);
  return entry;
}

function getFilteredLogs({ type, username, dateFrom, dateTo, search, limit = 100, offset = 0 } = {}) {
  let logs = getLogs();
  if (type)     logs = logs.filter(l => l.type === type);
  if (username) logs = logs.filter(l => l.username === username);
  if (dateFrom) logs = logs.filter(l => l.timestamp >= dateFrom);
  if (dateTo)   logs = logs.filter(l => l.timestamp <= dateTo + 'T23:59:59');
  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(l =>
      (l.details && l.details.toLowerCase().includes(q)) ||
      (l.username && l.username.toLowerCase().includes(q)) ||
      (l.typeLabel && l.typeLabel.toLowerCase().includes(q))
    );
  }
  const total = logs.length;
  return { logs: logs.slice(offset, offset + limit), total };
}

function getStats() {
  const logs = getLogs();
  const now  = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisWeek = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const stats = {
    total:         logs.length,
    today:         logs.filter(l => l.timestamp.startsWith(today)).length,
    thisWeek:      logs.filter(l => l.timestamp >= thisWeek).length,
    logins:        logs.filter(l => l.type === 'LOGIN').length,
    loginsFailed:  logs.filter(l => l.type === 'LOGIN_FAIL').length,
    entriesAdded:  logs.filter(l => l.type === 'ENTRY_ADD').length,
    activeUsers:   new Set(logs.filter(l => l.userId).map(l => l.userId)).size,
    byType:        {},
  };

  logs.forEach(l => {
    stats.byType[l.typeLabel] = (stats.byType[l.typeLabel] || 0) + 1;
  });

  return stats;
}

function clearLogs() { saveLogs([]); }

function exportLogsJSON() {
  const logs = getLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `homs-logs-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportLogsCSV() {
  const logs = getLogs();
  const header = ['التاريخ والوقت', 'المستخدم', 'الدور', 'النوع', 'التفاصيل'];
  const rows = logs.map(l => [
    l.timestamp.replace('T', ' ').slice(0, 19),
    l.username,
    l.role,
    l.typeLabel,
    (l.details || '').replace(/,/g, '،'),
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const BOM  = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `homs-logs-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

window.Logger = {
  log: logActivity,
  getLogs,
  getFilteredLogs,
  getStats,
  clearLogs,
  exportLogsJSON,
  exportLogsCSV,
  TYPES: LOG_TYPES,
};
