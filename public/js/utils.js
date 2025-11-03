// ✅ utils.js

// 공통 fetch (JWT 자동 포함)
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("jwt");
  const headers = options.headers || {};

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  return fetch(url, {
    ...options,
    headers
  });
}

// ✅ 로그인 여부 체크
export function checkAuth() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    window.location.href = "/login.html";
  }
}
