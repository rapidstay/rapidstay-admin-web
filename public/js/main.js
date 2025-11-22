// ===============================
// 🧭 RapidStay Admin Main Script (완성형 / AWS EC2 54.79.1.230:8082 버전)
// ===============================
console.log("✅ main.js loaded");
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM ready");
  console.log("✅ loginBtn:", document.getElementById("loginBtn"));
});

// ✅ API 기본 URL
const isLocal =
  location.hostname.includes("localhost") || location.hostname.includes("127.0.0.1");

const AUTH_BASE = isLocal
  ? "http://localhost:8082"          // 로컬 개발용
  : "https://54.79.1.230:8082";      // 운영 서버는 HTTPS로
const API_BASE = AUTH_BASE;

// 간단 DOM 헬퍼
const $ = (id) => document.getElementById(id);

// ⭐ 도시 목록 검색 키워드 저장용
const CITY_SEARCH_KEY = "adminCitySearchKeyword";

// ===============================
// 🔐 JWT 토큰 유틸 (auth.js와 키 통일)
// ===============================
const TOKEN_KEY = "jwt"; // ✅ auth.js와 동일

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ===============================
// 🔧 fetchJson (401/403 발생 시 로그인으로)
// ===============================
async function fetchJson(url, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
    clearToken();
    // 절대 경로로 이동
    window.location.href = "/login.html";
    return;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

// ===============================
// 🔑 로그인 처리 (login.html에서만 동작)
// ===============================
async function login() {
  console.log("✅ 로그인 버튼 클릭됨");

  const username = $("username")?.value || "";
  const password = $("password")?.value || "";

  const res = await fetch(`${AUTH_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    alert("로그인 실패");
    return;
  }

  const data = await res.json();
  console.log("✅ 로그인 응답:", data);

  if (!data?.token) {
    alert("토큰 수신 실패");
    return;
  }

  // 토큰 저장
  saveToken(data.token);
  console.log("✅ 저장된 토큰:", getToken());

  // 살짝 여유를 두고 메인 페이지로 이동
  setTimeout(() => {
    window.location.href = "/index.html";
  }, 200);
}

// 로그인 페이지에 있을 때만 버튼 바인딩
const loginBtn = $("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", login);
}

// ===============================
// 🔓 로그아웃 버튼 (index.html 등 보호 페이지 공통)
// ===============================
const logoutBtn = $("btnLogout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    clearToken();
    window.location.href = "/login.html";
  });
}

// ===============================
// 🏙️ 도시 관리 + 페이징
// ===============================
let selectedCityId = null;

// 클라이언트 페이징용 상태
let allCities = [];
let currentPage = 1;
const PAGE_SIZE = 10;

function renderCityTable() {
  const tbody = $("cityRows");
  if (!tbody) return;

  const total = allCities.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = allCities.slice(start, end);

  tbody.innerHTML = pageItems
    .map(
      (c) => `
        <tr
          data-id="${c.id ?? ""}"
          data-country-code="${c.countryCode ?? ""}"
          data-area-name="${c.areaName ?? ""}"
          data-city-code="${c.cityCode ?? ""}"
          data-name="${c.name ?? ""}"
          data-lat="${c.lat ?? ""}"
          data-lon="${c.lon ?? ""}"
          data-level="${c.level ?? ""}"
        >
          <td>${c.id ?? ""}</td>
          <td>${c.countryCode ?? ""}</td>
          <td>${c.areaName ?? ""}</td>
          <td>${c.name ?? ""}</td>
          <td>${c.lat ?? ""}</td>
          <td>${c.lon ?? ""}</td>
          <td>${c.level ?? ""}</td>
          <td>
            <button class="btn-del" data-city-code="${c.cityCode ?? ""}">삭제</button>
          </td>
        </tr>
      `
    )
    .join("");

  // 페이징 버튼 상태 업데이트
  const pageInfo = $("pageInfo");
  if (pageInfo) {
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
  }
  const btnPrev = $("btnPrev");
  const btnNext = $("btnNext");
  if (btnPrev) btnPrev.disabled = currentPage <= 1;
  if (btnNext) btnNext.disabled = currentPage >= totalPages;

  // 행 클릭 / 삭제 이벤트 바인딩 (최초 한 번만)
  if (!tbody._bound) {
    tbody.addEventListener("click", (e) => {
      const delBtn = e.target.closest(".btn-del");
      if (delBtn) {
        e.stopPropagation();
        const cityCode = delBtn.dataset.cityCode;
        if (cityCode) delCity(cityCode);
        return;
      }

      const tr = e.target.closest("tr[data-id]");
      if (tr) {
        const cityCode = tr.dataset.cityCode;
        if (cityCode) {
          // ⭐ 현재 검색어는 sessionStorage 에 이미 저장돼 있음
          const kw = sessionStorage.getItem(CITY_SEARCH_KEY) || "";
          const params = new URLSearchParams();
          params.set("cityCode", cityCode);
          if (kw) params.set("keyword", kw);

          window.location.href = `/master-city.html?${params.toString()}`;
        }
      }
    });
    tbody._bound = true;
  }
}

async function loadCities(keyword = "") {
  try {
    console.log("📡 loadCities 호출, keyword =", keyword);

    // ⭐ 기본값: 세션에 저장된 검색어 사용
    if (!keyword) {
      const saved = sessionStorage.getItem(CITY_SEARCH_KEY) || "";
      keyword = saved;
    }

    const url =
      API_BASE +
      "/master-cities" +
      (keyword ? `?keyword=${encodeURIComponent(keyword)}` : "");
    const list = (await fetchJson(url)) || [];

    allCities = list;
    currentPage = 1;
    renderCityTable();
  } catch (err) {
    console.error("❌ 도시 목록 로드 실패:", err);
    alert("도시 목록을 불러오지 못했습니다.");
  }
}

// (index.html에서는 더 이상 사용하지 않지만, 다른 페이지 재사용 대비해서 남겨둠)
function fillCityFormFromRow(tr) {
  selectedCityId = Number(tr.dataset.id) || null;
  $("cityEn") && ($("cityEn").value = tr.dataset.name || "");
  $("cityKr") && ($("cityKr").value = tr.dataset.name || "");
  $("country") && ($("country").value = tr.dataset.countryCode || "");
  $("lat") && ($("lat").value = tr.dataset.lat || "");
  $("lon") && ($("lon").value = tr.dataset.lon || "");
}

async function delCity(cityCode) {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    await fetchJson(
      `${API_BASE}/master-cities/code/${encodeURIComponent(cityCode)}`,
      { method: "DELETE" }
    );
    // 삭제 후 현재 페이지 데이터 갱신
    allCities = allCities.filter((c) => c.cityCode !== cityCode);
    renderCityTable();
  } catch (err) {
    console.error("❌ 삭제 실패:", err);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

// ===============================
// ⚙️ 캐시/배치 관리 + 검색 이벤트
// ===============================

// ⭐ 검색 버튼 클릭 시: 세션에 검색어 저장 후 검색
$("btnSearch")?.addEventListener("click", () => {
  const kw = $("search")?.value.trim() || "";
  sessionStorage.setItem(CITY_SEARCH_KEY, kw);
  loadCities(kw);
});

// ⭐ 전체보기: 검색어 초기화
$("btnAll")?.addEventListener("click", () => {
  if ($("search")) $("search").value = "";
  sessionStorage.removeItem(CITY_SEARCH_KEY);
  loadCities("");
});

// ⭐ 검색 인풋에서 Enter 눌러도 검색
const searchInput = $("search");
if (searchInput) {
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("btnSearch")?.click();
    }
  });
}

// 페이징 버튼
$("btnPrev")?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderCityTable();
  }
});

$("btnNext")?.addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(allCities.length / PAGE_SIZE));
  if (currentPage < totalPages) {
    currentPage += 1;
    renderCityTable();
  }
});

$("btnFlush")?.addEventListener("click", async () => {
  const res = await fetchJson(API_BASE + "/admin/ops/cache/flush", {
    method: "DELETE",
  });
  $("result").textContent = JSON.stringify(res, null, 2);
});

$("btnRebuild")?.addEventListener("click", async () => {
  const res = await fetchJson(API_BASE + "/admin/ops/cache/rebuild", {
    method: "POST",
  });
  $("result").textContent = JSON.stringify(res, null, 2);
});

$("btnBatch")?.addEventListener("click", async () => {
  const res = await fetchJson(API_BASE + "/admin/ops/batch/city-collector", {
    method: "POST",
  });
  $("result").textContent = JSON.stringify(res, null, 2);
});

// ===============================
// 첫 페이지(index.html) 진입 시 자동 로드
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // index.html 에서만 동작 (도시 목록이 있을 때)
  if ($("cityRows")) {
    const saved = sessionStorage.getItem(CITY_SEARCH_KEY) || "";
    if ($("search")) $("search").value = saved;
    setTimeout(() => loadCities(saved), 200);
  }
});

// ===============================
// 🏗️ 도시 생성 / 수정 폼 (다른 페이지에서 재사용 가능하도록 유지)
// ===============================
function collectCityForm() {
  return {
    id: selectedCityId,
    cityName: $("cityEn")?.value.trim() || "",
    cityNameKr: $("cityKr")?.value.trim() || "",
    country: $("country")?.value.trim() || "",
    lat: $("lat")?.value ? parseFloat($("lat").value) : 0,
    lon: $("lon")?.value ? parseFloat($("lon").value) : 0,
  };
}

function clearCityForm() {
  selectedCityId = null;
  ["cityEn", "cityKr", "country", "lat", "lon"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

async function createCity() {
  const dto = collectCityForm();

  if (dto.id) {
    alert("이미 등록된 도시입니다. 새 도시를 추가하려면 폼을 초기화하세요.");
    return;
  }

  if (!dto.cityName || !dto.cityNameKr) {
    alert("도시명(영문/한글)을 모두 입력해주세요.");
    return;
  }

  try {
    await fetchJson(`${API_BASE}/master-cities/row`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
    alert("등록 완료");
    clearCityForm();
    await loadCities();
  } catch (err) {
    console.error("❌ 등록 실패:", err);
    alert("등록 중 오류 발생");
  }
}

async function updateCity() {
  const dto = collectCityForm();
  if (!dto.id) {
    alert("수정할 도시를 먼저 선택하세요.");
    return;
  }
  try {
    await fetchJson(`${API_BASE}/master-cities/row/${dto.id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
    alert("수정 완료");
    clearCityForm();
    await loadCities();
  } catch (err) {
    console.error("❌ 수정 실패:", err);
    alert("수정 중 오류 발생");
  }
}

// ✅ (master-city.html에서 필요하면 이 버튼 id만 쓰면 됨)
$("btnAdd")?.addEventListener("click", createCity);
$("btnUpdate")?.addEventListener("click", updateCity);
$("btnReset")?.addEventListener("click", clearCityForm);
