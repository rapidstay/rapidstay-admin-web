// public/js/layout.js
console.log("✅ layout.js loaded");

// JWT payload 파싱
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT 파싱 실패:", e);
    return null;
  }
}

function buildAdminHeader() {
  const header = document.querySelector("header.admin-header");
  if (!header) return; // 이 페이지에 모듈형 헤더가 없으면 패스

  // body data-page-title 에서 페이지 제목 읽기
  const pageTitle = document.body.dataset.pageTitle || "";

  // 헤더 HTML 공통 템플릿
  header.innerHTML = `
    <div class="topbar">
      <div class="topbar-left">
        <h1 class="brand-title">🧭 RapidStay Admin Console</h1>
        <p class="subtitle" id="pageTitle">${pageTitle}</p>
      </div>
      <div class="topbar-right">
        <span id="currentUser" class="topbar-username"></span>
        <button id="btnLogout" class="logout-btn">로그아웃</button>
      </div>
    </div>
  `;

  // ===== 사용자 / 권한 정보 =====
  const token =
    typeof getToken === "function"
      ? getToken()
      : localStorage.getItem("jwt");

  let username = "";
  let roles = [];

  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      // username
      username = payload.sub || payload.username || "";

      // roles (배열 또는 문자열 대응)
      const claim = payload.roles || payload.authorities || payload.role;
      if (Array.isArray(claim)) roles = claim;
      else if (typeof claim === "string") roles = [claim];
    }
  }

  // 헤더에 사용자명 반영
  const userSpan = document.getElementById("currentUser");
  if (userSpan) {
    userSpan.textContent = username || "";
  }

  // ADMIN 권한 여부
  const isAdmin =
    roles.includes("ADMIN") || roles.includes("ROLE_ADMIN");

  // ADMIN 전용 메뉴 숨기기 (data-requires-admin="true")
  document
    .querySelectorAll("[data-requires-admin='true']")
    .forEach((el) => {
      el.style.display = isAdmin ? "" : "none";
    });

  // 로그아웃 버튼 동작
  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (typeof clearToken === "function") {
        clearToken();
      } else {
        localStorage.removeItem("jwt");
      }
      window.location.href = "/login.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", buildAdminHeader);
