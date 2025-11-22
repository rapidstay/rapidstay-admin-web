// ===============================
// 🌐 RapidStay Admin API Helper (EC2 + Firebase 대응 버전)
// ===============================
import { getToken, clearToken } from "/js/auth.js";

const API_BASE_URL =
  location.hostname.includes("localhost") || location.hostname.includes("127.0.0.1")
    ? "http://localhost:8082"    // 로컬 백엔드로 연결
    : "http://54.79.1.230:8082"; // 운영 서버

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", "Bearer " + token);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(API_BASE_URL + path, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    // ✅ 로그인 페이지로 이동 (rewrite 대응)
    if (!location.pathname.includes("login")) {
      location.href = "/login.html";
    }
    throw new Error("Unauthorized");
  }

  return res;
}

export { API_BASE_URL };
