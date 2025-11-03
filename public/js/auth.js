// ===============================
// 🔐 RapidStay Admin Auth Utility
// ===============================
const TOKEN_KEY = "rapidstay_admin_token";
const CLOCK_SKEW_MS = 30 * 1000; // 시간 오차 보정

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenValid() {
  const token = getToken();
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  return Date.now() + CLOCK_SKEW_MS < payload.exp * 1000;
}

// 로그인 페이지에서 토큰이 있으면 index로 보냄
export function requireGuest() {
  if (isTokenValid()) {
    location.replace("/index.html");
  }
}

// 보호 페이지에서 토큰 없으면 로그인으로 보냄
export function requireAuth() {
  if (!isTokenValid()) {
    clearToken();
    location.replace("/login.html");
  }
}
