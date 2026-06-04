'use strict';

const AUTH_KEYS = {
  USERS:    'homs_users',
  SESSION:  'homs_session',
  SETTINGS: 'homs_settings',
};

const SALT = 'HoMS_DiR_2026_@#$';

async function hashPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data    = encoder.encode(password + SALT);
    const hash    = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 0;
    const s = password + SALT;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(16).padStart(8, '0') + '_fallback';
  }
}

const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

async function initDefaultAdmin() {
  try {
    const users = store.get(AUTH_KEYS.USERS, []);
    const adminExists = users.some(u => u.username === 'admin');
    if (!adminExists) {
      const hashed = await hashPassword('Admin@2026');
      users.unshift({
        id:         'admin_001',
        username:   'admin',
        name:       'مدير النظام',
        email:      'admin@homs.sy',
        password:   hashed,
        role:       'admin',
        status:     'active',
        createdAt:  new Date().toISOString(),
        lastLogin:  null,
      });
      store.set(AUTH_KEYS.USERS, users);
    }
  } catch (e) {
    console.warn('initDefaultAdmin error:', e);
  }
}

async function login(username, password) {
  const users  = store.get(AUTH_KEYS.USERS, []);
  const hashed = await hashPassword(password);
  const user   = users.find(u =>
    (u.username === username || u.email === username) && u.password === hashed
  );

  if (!user)              return { ok: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  if (user.status !== 'active') return { ok: false, error: 'هذا الحساب موقوف. تواصل مع المدير.' };

  user.lastLogin = new Date().toISOString();
  store.set(AUTH_KEYS.USERS, users);

  const session = {
    userId:    user.id,
    username:  user.username,
    name:      user.name,
    role:      user.role,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  };
  store.set(AUTH_KEYS.SESSION, session);

  return { ok: true, user: { ...user, password: undefined } };
}

async function register(data) {
  const { username, name, email, password, role = 'user', securityQuestion = '', securityAnswer = '' } = data;
  const users = store.get(AUTH_KEYS.USERS, []);

  if (!username || username.length < 3)
    return { ok: false, error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' };
  if (!password || password.length < 6)
    return { ok: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
  if (users.some(u => u.username === username))
    return { ok: false, error: 'اسم المستخدم موجود مسبقاً' };
  if (email && users.some(u => u.email === email))
    return { ok: false, error: 'البريد الإلكتروني موجود مسبقاً' };

  const hashed = await hashPassword(password);
  const newUser = {
    id:        'usr_' + Date.now(),
    username,
    name:      name || username,
    email:     email || '',
    password:  hashed,
    role,
    status:    'active',
    securityQuestion,
    securityAnswer,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  };
  users.push(newUser);
  store.set(AUTH_KEYS.USERS, users);
  return { ok: true, user: { ...newUser, password: undefined } };
}

function logout() {
  store.remove(AUTH_KEYS.SESSION);
}

function getCurrentUser() {
  try {
    const session = store.get(AUTH_KEYS.SESSION);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      store.remove(AUTH_KEYS.SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === 'admin';
}

function checkAuth(requireAdmin = false) {
  const user = getCurrentUser();
  if (!user) {
    window.location.replace('login.html');
    return null;
  }
  if (requireAdmin && !isAdmin()) {
    window.location.replace('index.html');
    return null;
  }
  return user;
}

function getAllUsers() {
  return store.get(AUTH_KEYS.USERS, []).map(u => ({ ...u, password: undefined }));
}

async function updateUser(id, changes) {
  const users = store.get(AUTH_KEYS.USERS, []);
  const idx   = users.findIndex(u => u.id === id);
  if (idx === -1) return { ok: false, error: 'المستخدم غير موجود' };

  if (changes.username && changes.username !== users[idx].username) {
    if (users.some((u, i) => i !== idx && u.username === changes.username))
      return { ok: false, error: 'اسم المستخدم موجود مسبقاً' };
  }
  if (changes.password) {
    changes.password = await hashPassword(changes.password);
  }
  users[idx] = { ...users[idx], ...changes };
  store.set(AUTH_KEYS.USERS, users);
  return { ok: true };
}

function deleteUser(id) {
  const users = store.get(AUTH_KEYS.USERS, []);
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return { ok: false, error: 'المستخدم غير موجود' };
  store.set(AUTH_KEYS.USERS, filtered);
  return { ok: true };
}

async function resetPasswordBySecurity(username, securityAnswer, newPassword) {
  const users = store.get(AUTH_KEYS.USERS, []);
  const user  = users.find(u => u.username === username);
  if (!user) return { ok: false, error: 'اسم المستخدم غير موجود' };
  if (!user.securityAnswer) return { ok: false, error: 'لا يوجد سؤال سري مسجل لهذا الحساب' };

  const hashedAnswer = await hashPassword(securityAnswer.trim().toLowerCase());
  if (hashedAnswer !== user.securityAnswer)
    return { ok: false, error: 'إجابة السؤال السري غير صحيحة' };

  if (!newPassword || newPassword.length < 6)
    return { ok: false, error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' };

  user.password = await hashPassword(newPassword);
  store.set(AUTH_KEYS.USERS, users);
  return { ok: true };
}

window._authReady = initDefaultAdmin();

window.Auth = {
  login,
  register,
  logout,
  getCurrentUser,
  isAdmin,
  checkAuth,
  getAllUsers,
  updateUser,
  deleteUser,
  hashPassword,
  resetPasswordBySecurity,
};
