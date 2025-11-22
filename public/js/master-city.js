// ===============================
// 🧭 RapidStay Admin - City Master Detail
// ===============================
console.log("✅ master-city.js loaded");

// main.js 에서 이미 제공하는 것 재사용:
// - const API_BASE = ...
// - async function fetchJson(url, options)
// - const $ = (id) => document.getElementById(id);

const LANGS = ["ko", "en", "ja", "zh"];

// ------------------------------
// 폼 초기화
// ------------------------------
function resetMasterCityForm() {
  // 공통 필드
  ["mcCityCode", "mcCountryCode", "mcAreaName", "mcLat", "mcLon", "mcImageUrl"].forEach(
    (id) => {
      const el = $(id);
      if (el) el.value = "";
    }
  );

  const chk = $("mcIsActive");
  if (chk) chk.checked = false;

  const img = $("mcImagePreview");
  if (img) img.src = "./img/placeholder.png";

  // 언어별 필드
  LANGS.forEach((lang) => {
    ["Id", "Name", "Highlights", "Overview"].forEach((field) => {
      const el = $("mc" + field + "_" + lang);
      if (el) el.value = "";
    });
  });
}

// ------------------------------
// 상세 응답 → 폼 채우기
// ------------------------------
function fillMasterCityForm(list) {
  if (!Array.isArray(list) || list.length === 0) {
    resetMasterCityForm();
    return;
  }

  const base = list.find((c) => c.lang === "ko") || list[0];

  $("mcCityCode").value = base.cityCode ?? "";
  $("mcCountryCode").value = base.countryCode ?? "";
  $("mcAreaName").value = base.areaName ?? "";
  $("mcLat").value = base.lat ?? "";
  $("mcLon").value = base.lon ?? "";
  $("mcImageUrl").value = base.imageUrl ?? "";
  $("mcIsActive").checked = !!base.isActive;

  const img = $("mcImagePreview");
  if (img) img.src = base.imageUrl || "./img/placeholder.png";

  LANGS.forEach((lang) => {
    const row = list.find((c) => c.lang === lang) || {};
    $("mcId_" + lang).value = row.id ?? "";
    $("mcName_" + lang).value = row.name ?? "";
    $("mcHighlights_" + lang).value = row.highlights ?? "";
    $("mcOverview_" + lang).value = row.overview ?? "";
  });
}

// ------------------------------
// 상세 조회
// ------------------------------
async function loadMasterCityDetail(cityCode) {
  if (!cityCode) {
    resetMasterCityForm();
    return;
  }

  try {
    console.log("📡 loadMasterCityDetail:", cityCode);
    const list = await fetchJson(
      `${API_BASE}/master-cities/code/${encodeURIComponent(cityCode)}`
    );
    fillMasterCityForm(list);
  } catch (err) {
    console.error("❌ 도시 상세 로딩 실패:", err);
    alert("도시 상세 정보를 불러오지 못했습니다.");
  }
}

// ------------------------------
// 저장
// ------------------------------
async function saveMasterCity() {
  const cityCode = $("mcCityCode").value.trim();
  if (!cityCode) {
    alert("도시코드를 입력해주세요.");
    return;
  }

  const countryCode = $("mcCountryCode").value.trim();
  const areaName = $("mcAreaName").value.trim();
  const latStr = $("mcLat").value.trim();
  const lonStr = $("mcLon").value.trim();
  const imageUrl = $("mcImageUrl").value.trim();
  const isActive = $("mcIsActive").checked;

  const lat = latStr ? Number(latStr) : null;
  const lon = lonStr ? Number(lonStr) : null;

  try {
    for (const lang of LANGS) {
      const id = $("mcId_" + lang).value.trim();
      const name = $("mcName_" + lang).value.trim();
      const highlights = $("mcHighlights_" + lang).value.trim();
      const overview = $("mcOverview_" + lang).value.trim();

      // 해당 언어 필드 모두 비어 있으면 skip
      if (!name && !highlights && !overview) {
        continue;
      }

      const dto = {
        id: id || null,
        cityCode,
        countryCode,
        areaName,
        lat,
        lon,
        imageUrl,
        isActive,
        name,
        highlights,
        overview,
        lang,
        level: 3,
      };

      const url = id
        ? `${API_BASE}/master-cities/row/${id}`
        : `${API_BASE}/master-cities/row`;
      const method = id ? "PUT" : "POST";

      await fetchJson(url, {
        method,
        body: JSON.stringify(dto),
      });
    }

    alert("도시 정보가 저장되었습니다.");
    await loadMasterCityDetail(cityCode);
  } catch (err) {
    console.error("❌ 도시 저장 실패:", err);
    alert("도시 저장 중 오류가 발생했습니다.");
  }
}

// ------------------------------
// 삭제
// ------------------------------
async function deleteMasterCity() {
  const cityCode = $("mcCityCode").value.trim();
  if (!cityCode) {
    alert("삭제할 도시코드가 없습니다.");
    return;
  }
  if (!confirm(`${cityCode} 도시의 모든 언어 데이터를 삭제하시겠습니까?`)) return;

  try {
    await fetchJson(
      `${API_BASE}/master-cities/code/${encodeURIComponent(cityCode)}`,
      { method: "DELETE" }
    );
    alert("삭제 완료");
    resetMasterCityForm();
  } catch (err) {
    console.error("❌ 도시 삭제 실패:", err);
    alert("도시 삭제 중 오류가 발생했습니다.");
  }
}

// ------------------------------
// DOM 로딩 시 초기화
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ master-city DOM ready");

  // 언어 탭 클릭
  document.querySelectorAll(".lang-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;

      document
        .querySelectorAll(".lang-tab")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".lang-pane")
        .forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const pane = document.querySelector(`.lang-pane[data-lang="${lang}"]`);
      if (pane) pane.classList.add("active");
    });
  });

  // 이미지 미리보기
  $("mcImageUrl")?.addEventListener("input", (e) => {
    const v = e.target.value.trim();
    const img = $("mcImagePreview");
    if (img) img.src = v || "./img/placeholder.png";
  });

  // 저장 / 초기화 / 삭제 버튼
  $("btnMasterSave")?.addEventListener("click", saveMasterCity);
  $("btnMasterReset")?.addEventListener("click", resetMasterCityForm);
  $("btnMasterDelete")?.addEventListener("click", deleteMasterCity);

  // ⭐ 목록 버튼: 검색 조건은 main.js 에서 sessionStorage 로 관리
  $("btnMasterBack")?.addEventListener("click", () => {
    window.location.href = "./index.html";
  });

  // URL 파라미터로부터 cityCode / keyword 읽어서 자동 로드
  const params = new URLSearchParams(location.search);
  const initialCityCode = params.get("cityCode");
  const keyword = params.get("keyword") || "";

  // 리스트에서 넘어온 검색어가 있으면 세션에 다시 저장
  if (keyword) {
    sessionStorage.setItem("adminCitySearchKeyword", keyword);
  }

  if (initialCityCode) {
    $("mcCityCode").value = initialCityCode;
    loadMasterCityDetail(initialCityCode);
  } else {
    resetMasterCityForm();
  }
});
