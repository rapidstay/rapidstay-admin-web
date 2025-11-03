import { authFetch, checkAuth } from "./utils.js";

checkAuth(); // 페이지 진입 시 토큰 검사

async function loadCities() {
  const res = await authFetch("http://localhost:8082/admin/cities");
  const data = await res.json();
  console.log(data);
}

loadCities();
