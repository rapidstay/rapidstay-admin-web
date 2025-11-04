// ===============================
// 🌐 RapidStay Admin API Helper
// ===============================
import { getToken, clearToken } from "/js/auth.js";

const API_BASE_URL =
  location.hostname.includes("localhost") || location.hostname.includes("127.0.0.1")
    ? "http://localhost:8081"
    : "https://rapidstay-api.onrender.com"; // Render 배포 주소

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
    if (!location.pathname.endsWith("/login.html")) {
      location.replace("/login.html");
    }
    throw new Error("Unauthorized");
  }
  return res;
}

// 🔧 선택적으로 전역 fetch 인터셉트 ON 가능
// window.fetch = (input, init = {}) => {
//   const token = getToken();
//   const headers = new Headers(init.headers || {});
//   if (token) headers.set("Authorization", "Bearer " + token);
//   return fetch(input, { ...init, headers });
// };

export { API_BASE_URL };
