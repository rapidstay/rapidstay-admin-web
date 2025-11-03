// ===============================
// 🧭 RapidStay Admin Main Script (완성형)
// ===============================

// ✅ API 기본 URL
const AUTH_BASE =
  location.hostname.includes("localhost") || location.hostname.includes("127.0.0.1")
    ? "http://localhost:8082"
    : "https://rapidstay-api.onrender.com";

const API_BASE = AUTH_BASE;

const $ = (id) => document.getElementById(id);

// ===============================
// 🔐 JWT 토큰 유틸
// ===============================
const TOKEN_KEY = "jwt";
function saveToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

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

function isTokenValid() {
  const token = getToken();
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  return Date.now() < payload.exp * 1000;
}

// 로그인 페이지 감시
if (location.pathname.endsWith("/login.html")) {
  if (isTokenValid()) location.replace("/index.html");
}

// 보호 페이지 감시
if (!location.pathname.endsWith("/login.html") && !isTokenValid()) {
  clearToken();
  location.replace("/login.html");
}

// ===============================
// 🔧 fetchJson
// ===============================
async function fetchJson(url, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", "Bearer " + token);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    location.replace("/login.html");
    throw new Error("인증 만료");
  }

  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    console.warn("⚠️ JSON 파싱 실패, 원문 반환:", text);
    return text;
  }
}

// ===============================
// 🔑 로그인
// ===============================
async function login() {
  const username = $("username").value;
  const password = $("password").value;

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
  if (!data?.token) {
    alert("토큰 수신 실패");
    return;
  }

  saveToken(data.token);
  window.location.href = "/index.html";
}

$("loginBtn")?.addEventListener("click", login);

// ===============================
// 🏙️ 도시 관리
// ===============================
let selectedCityId = null;

async function loadCities(query = "") {
  try {
    const url = API_BASE + "/admin/cities" + (query ? `?query=${encodeURIComponent(query)}` : "");
    const list = await fetchJson(url);

    $("cityRows").innerHTML = list
      .map(
        (c) => `
          <tr
            data-id="${c.id ?? ''}"
            data-city-en="${c.cityName ?? ''}"
            data-city-kr="${c.cityNameKr ?? ''}"
            data-country="${c.country ?? ''}"
            data-lat="${c.lat ?? ''}"
            data-lon="${c.lon ?? ''}"
          >
            <td>${c.id ?? ""}</td>
            <td>${c.cityName ?? ""}</td>
            <td>${c.cityNameKr ?? ""}</td>
            <td>${c.country ?? ""}</td>
            <td>${c.lat ?? ""}</td>
            <td>${c.lon ?? ""}</td>
            <td><button class="btn-del" data-id="${c.id}">삭제</button></td>
          </tr>
        `
      )
      .join("");

    const tbody = $("cityRows");
    if (!tbody._bound) {
      tbody.addEventListener("click", (e) => {
        const delBtn = e.target.closest(".btn-del");
        if (delBtn) {
          e.stopPropagation();
          const id = Number(delBtn.dataset.id);
          if (id) delCity(id);
          return;
        }
        const tr = e.target.closest("tr[data-id]");
        if (tr) fillCityFormFromRow(tr);
      });
      tbody._bound = true;
    }
  } catch (err) {
    console.error("❌ 도시 목록 로드 실패:", err);
    alert("도시 목록을 불러오지 못했습니다.");
  }
}

function fillCityFormFromRow(tr) {
  selectedCityId = Number(tr.dataset.id) || null;
  $("cityEn").value = tr.dataset.cityEn || "";
  $("cityKr").value = tr.dataset.cityKr || "";
  $("country").value = tr.dataset.country || "";
  $("lat").value = tr.dataset.lat || "";
  $("lon").value = tr.dataset.lon || "";
}

async function delCity(id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  try {
    await fetchJson(`${API_BASE}/admin/cities/${id}`, { method: "DELETE" });
    await loadCities();
  } catch (err) {
    console.error("❌ 삭제 실패:", err);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

// ===============================
// ⚙️ 캐시/배치 관리
// ===============================
$("btnSearch")?.addEventListener("click", () => loadCities($("search").value));
$("btnAll")?.addEventListener("click", () => loadCities());

$("btnFlush")?.addEventListener("click", async () => {
  const res = await fetchJson(API_BASE + "/admin/ops/cache/flush", { method: "DELETE" });
  $("result").textContent = JSON.stringify(res, null, 2);
});

$("btnRebuild")?.addEventListener("click", async () => {
  const res = await fetchJson(API_BASE + "/admin/ops/cache/rebuild", { method: "POST" });
  $("result").textContent = JSON.stringify(res, null, 2);
});

$("btnBatch")?.addEventListener("click", async () => {
  const res = await fetchJson(API_BASE + "/admin/ops/batch/city-collector", { method: "POST" });
  $("result").textContent = JSON.stringify(res, null, 2);
});

// ===============================
// 첫 페이지 진입 시 자동 로드
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  if ($("cityRows")) setTimeout(() => loadCities(), 200);
});

// ===============================
// 🏗️ 도시 생성 / 수정 폼
// ===============================
function collectCityForm() {
  return {
    id: selectedCityId,
    cityName: $("cityEn").value.trim(),
    cityNameKr: $("cityKr").value.trim(),
    country: $("country").value.trim(),
    lat: $("lat").value ? parseFloat($("lat").value) : 0,
    lon: $("lon").value ? parseFloat($("lon").value) : 0,
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

  // 🧱 방어 로직 추가: 이미 id 값이 있으면 등록 불가
  if (dto.id) {
    alert("이미 등록된 도시입니다. 새 도시를 추가하려면 폼을 초기화하세요.");
    return;
  }

  if (!dto.cityName || !dto.cityNameKr) {
    alert("도시명(영문/한글)을 모두 입력해주세요.");
    return;
  }

  try {
    await fetchJson(`${API_BASE}/admin/cities`, {
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
    await fetchJson(`${API_BASE}/admin/cities/${dto.id}`, {
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

// ✅ 버튼 이벤트
$("btnAdd")?.addEventListener("click", createCity);
$("btnUpdate")?.addEventListener("click", updateCity);
$("btnReset")?.addEventListener("click", clearCityForm);
