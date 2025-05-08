// 1) Firebase 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithPopup, GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore, collection, query,
  where, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// → Firebase 콘솔에서 복사해 온 정확한 config 로 교체
const firebaseConfig = {
  apiKey: "AIzaSyDWJ5x3_XZ53QCNto5hhH4u-S3uUFp4b9U",
  authDomain: "song-tracker-80efb.firebaseapp.com",
  projectId: "song-tracker-80efb",
  storageBucket: "song-tracker-80efb.firebasestorage.app",
  messagingSenderId: "792475837523",
  appId: "1:792475837523:web:ccc1921449c2900529d2a6"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// 2) UI 요소
const authEl      = document.getElementById("auth-container");
const appEl       = document.getElementById("app");
const googleBtn   = document.getElementById("google-login-btn");
const logoutBtn   = document.getElementById("logout-btn");
const titlesInput = document.getElementById("titles-input");
const registerBtn = document.getElementById("register-btn");
const resultP     = document.getElementById("result");
const songList    = document.getElementById("song-list");

// 3) normalize: 공백 제거 + 소문자 변환
function normalize(title) {
  return title.replace(/\s+/g, "").toLowerCase();
}

// 4) Google 로그인
googleBtn.addEventListener("click", () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch(e => alert("로그인 오류: " + e.message));
});

// 5) 로그인 상태 변화→화면 전환
onAuthStateChanged(auth, user => {
  if (user) {
    authEl.hidden = true;
    appEl.hidden  = false;
    loadSongs();
  } else {
    authEl.hidden = false;
    appEl.hidden  = true;
  }
});

// 6) 로그아웃
logoutBtn.addEventListener("click", () => signOut(auth));

// 7) 대량 등록 버튼
registerBtn.addEventListener("click", async () => {
  const raw = titlesInput.value;
  if (!raw.trim()) return;

  // 7-1) 기존 DB에서 모두 읽어와 Set에 저장
  const snapAll = await getDocs(query(
    collection(db, "songs"),
    where("uid", "==", auth.currentUser.uid)
  ));
  const existing = new Set(snapAll.docs.map(d => normalize(d.data().title)));

  // 7-2) input을 쉼표로 split + normalize
  const inputs = raw
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length);
  const toRegister = [];
  const duplicates = [];

  for (let t of inputs) {
    if (existing.has(normalize(t))) {
      duplicates.push(t);
    } else {
      existing.add(normalize(t));
      toRegister.push(t);
    }
  }

  // 7-3) 신규 등록
  for (let t of toRegister) {
    await addDoc(collection(db, "songs"), {
      uid: auth.currentUser.uid,
      title: t,
      released: false
    });
  }

  // 7-4) 결과 메시지
  const lines = [];
  if (toRegister.length) {
    lines.push(`등록 완료: ${toRegister.join(", ")}`);
  }
  if (duplicates.length) {
    lines.push(`중복으로 스킵됨: ${duplicates.join(", ")}`);
  }
  resultP.textContent = lines.join(" | ");
  loadSongs();
});

// 8) 등록된 곡 목록
async function loadSongs() {
  songList.innerHTML = "";
  const snap = await getDocs(query(
    collection(db, "songs"),
    where("uid", "==", auth.currentUser.uid)
  ));
  snap.forEach(doc => {
    const d = doc.data();
    const li = document.createElement("li");
    li.textContent = `${d.title} — 발매: ${d.released ? "완료" : "미신청"}`;
    songList.append(li);
  });
}
