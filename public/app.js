const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function navigate() {
  const id = (location.hash || "#beranda").slice(1);
  const page = document.getElementById(id) ? id : "beranda";
  $$(".page").forEach(el => el.classList.toggle("active-page", el.id === page));
  $$(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  const active = $(`.nav-link[data-page="${page}"]`);
  $("#pageName").textContent = active ? active.textContent.trim().replace("Live", "").trim() : (page === "tentang" ? "Tentang" : "Beranda");
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.addEventListener("hashchange", navigate);
navigate();
$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
document.addEventListener("click", e => {
  if (window.innerWidth <= 900 && $("#sidebar").classList.contains("open") && !$("#sidebar").contains(e.target) && !$("#menuToggle").contains(e.target)) $("#sidebar").classList.remove("open");
});
$("#contrastToggle").addEventListener("click", () => {
  document.body.classList.toggle("high-contrast");
  toast(document.body.classList.contains("high-contrast") ? "Kontras tinggi diaktifkan." : "Kontras normal diaktifkan.");
});
$("#fontToggle").addEventListener("click", () => {
  document.body.classList.toggle("large-text");
  toast(document.body.classList.contains("large-text") ? "Ukuran teks diperbesar." : "Ukuran teks normal.");
});

const chatMessages = $("#chatMessages");
let messages = [];
function renderMessages() {
  chatMessages.querySelectorAll(".message").forEach(el => el.remove());
  $("#chatEmpty").style.display = messages.length ? "none" : "block";
  messages.forEach(message => {
    const node = document.createElement("article");
    node.className = "message" + (message.sender === "partner" ? " partner" : "");
    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = message.text;
    const meta = document.createElement("div");
    meta.className = "message-meta";
    const time = document.createElement("span");
    time.textContent = new Date(message.createdAt || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const sender = document.createElement("span");
    sender.textContent = message.sender === "partner" ? "Lawan bicara" : "Kamu";
    meta.append(sender, time);
    const tools = document.createElement("div");
    tools.className = "message-tools";
    const speak = document.createElement("button");
    speak.type = "button"; speak.textContent = "◖ Bacakan";
    speak.addEventListener("click", () => speakText(message.text));
    const copy = document.createElement("button");
    copy.type = "button"; copy.textContent = "Salin";
    copy.addEventListener("click", () => copyText(message.text));
    tools.append(speak, copy);
    node.append(text, meta, tools);
    chatMessages.append(node);
  });
  $("#messageCount").textContent = messages.length;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
async function loadMessages() {
  try {
    const res = await fetch("/api/messages");
    if (!res.ok) throw new Error();
    messages = await res.json();
    renderMessages();
  } catch {
    toast("Server belum terhubung. Jalankan npm start terlebih dahulu.");
  }
}
async function sendMessage(text, sender = "you", mode = "text") {
  const clean = String(text || "").trim();
  if (!clean) { toast("Tulis pesan terlebih dahulu."); return false; }
  try {
    const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: clean, sender, mode }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Pesan gagal disimpan.");
    messages.push(data);
    renderMessages();
    return true;
  } catch (error) {
    toast(error.message || "Pesan gagal dikirim. Periksa server.");
    return false;
  }
}
$("#chatForm").addEventListener("submit", async e => {
  e.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (await sendMessage(text)) { input.value = ""; $("#charCount").textContent = "0 / 2000"; }
});
$("#chatInput").addEventListener("input", () => $("#charCount").textContent = `${$("#chatInput").value.length} / 2000`);
$("#chatInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 520) { e.preventDefault(); $("#chatForm").requestSubmit(); }
});
$("#clearChat").addEventListener("click", async () => {
  if (!confirm("Hapus semua riwayat percakapan dari server lokal?")) return;
  try {
    const res = await fetch("/api/messages", { method: "DELETE" });
    if (!res.ok) throw new Error();
    messages = []; renderMessages(); toast("Riwayat percakapan dibersihkan.");
  } catch { toast("Tidak dapat menghapus riwayat."); }
});
$("#speakLast").addEventListener("click", () => {
  const last = messages[messages.length - 1];
  if (last) speakText(last.text); else toast("Belum ada pesan untuk dibacakan.");
});

function copyText(text) {
  if (!text) return toast("Belum ada teks untuk disalin.");
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast("Teks berhasil disalin.")).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text) {
  const area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.opacity = "0";
  document.body.append(area); area.select();
  try { document.execCommand("copy"); toast("Teks berhasil disalin."); } catch { toast("Gagal menyalin teks. Silakan salin manual."); }
  area.remove();
}
$("#copyTranscript").addEventListener("click", () => copyText($("#transcriptText").dataset.text || ""));
$("#clearTranscript").addEventListener("click", () => { $("#transcriptText").textContent = "Hasil ucapan akan muncul di sini..."; $("#transcriptText").dataset.text = ""; });
$("#sendTranscript").addEventListener("click", async () => {
  const text = $("#transcriptText").dataset.text || "";
  if (await sendMessage(text, "you", "speech-to-text")) { location.hash = "#percakapan"; toast("Transkripsi dikirim ke percakapan."); }
});
$("#sendTts").addEventListener("click", async () => {
  if (await sendMessage($("#ttsInput").value, "you", "text-to-speech")) { location.hash = "#percakapan"; toast("Pesan dikirim ke percakapan."); }
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null, listening = false, finalTranscript = "";
const micStage = $(".mic-stage");
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "id-ID";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onstart = () => { listening = true; $("#speechStatus").textContent = "Mendengarkan"; $("#speechStatus").className = "pill pill-green"; $("#startSpeech").innerHTML = "■ Berhenti mendengarkan"; $("#micHint").textContent = "Mikrofon aktif. Silakan berbicara."; micStage.classList.add("listening"); };
  recognition.onresult = event => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += transcript + " ";
      else interim += transcript;
    }
    const combined = (finalTranscript + interim).trim();
    $("#transcriptText").textContent = combined || "Sedang mendengarkan...";
    $("#transcriptText").dataset.text = combined;
  };
  recognition.onerror = event => {
    const messages = { "not-allowed": "Izin mikrofon ditolak. Izinkan melalui pengaturan browser.", "no-speech": "Suara belum terdeteksi. Coba bicara lebih jelas.", "network": "Pengenalan suara membutuhkan koneksi jaringan pada browser ini." };
    toast(messages[event.error] || `Terjadi kendala mikrofon: ${event.error}`);
  };
  recognition.onend = () => {
    listening = false; $("#speechStatus").textContent = "Belum aktif"; $("#speechStatus").className = "pill pill-blue"; $("#startSpeech").innerHTML = "<span>◖</span> Mulai mikrofon"; $("#micHint").textContent = "Tekan tombol untuk mulai mendengarkan."; micStage.classList.remove("listening");
  };
} else {
  $("#startSpeech").disabled = true;
  $("#startSpeech").textContent = "Browser tidak mendukung";
  $("#micHint").textContent = "Gunakan Google Chrome atau Microsoft Edge versi terbaru untuk fitur transkripsi.";
  $("#speechStatus").textContent = "Tidak didukung";
}
$("#startSpeech").addEventListener("click", () => {
  if (!recognition) return toast("Browser ini tidak mendukung pengenalan suara.");
  if (listening) { recognition.stop(); return; }
  finalTranscript = "";
  $("#transcriptText").dataset.text = "";
  try { recognition.start(); } catch { toast("Mikrofon sedang memulai. Coba lagi sebentar."); }
});

let voices = [];
function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  voices = speechSynthesis.getVoices();
  const select = $("#voiceSelect");
  const selected = select.value;
  select.innerHTML = '<option value="">Suara default perangkat</option>';
  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = String(i); option.textContent = `${voice.name} (${voice.lang})`;
    select.append(option);
  });
  if (selected) select.value = selected;
}
if ("speechSynthesis" in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
function speakText(text) {
  if (!("speechSynthesis" in window)) return toast("Browser ini tidak mendukung fitur teks ke suara.");
  const clean = String(text || "").trim();
  if (!clean) return toast("Tulis teks yang ingin dibacakan terlebih dahulu.");
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = "id-ID";
  const voiceIndex = $("#voiceSelect").value;
  if (voiceIndex !== "" && voices[Number(voiceIndex)]) utterance.voice = voices[Number(voiceIndex)];
  utterance.rate = Number($("#speechRate").value || 1);
  utterance.onstart = () => { if ($("#ttsStatus")) $("#ttsStatus").textContent = "Sedang membacakan teks…"; };
  utterance.onend = () => { if ($("#ttsStatus")) $("#ttsStatus").textContent = "Selesai membacakan teks."; };
  utterance.onerror = () => { if ($("#ttsStatus")) $("#ttsStatus").textContent = "Pembacaan suara tidak berhasil."; };
  speechSynthesis.speak(utterance);
}
$("#speakText").addEventListener("click", () => speakText($("#ttsInput").value));
$("#stopSpeech").addEventListener("click", () => {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  $("#ttsStatus").textContent = "Pembacaan dihentikan.";
});
$("#speechRate").addEventListener("input", () => $("#rateValue").textContent = `${Number($("#speechRate").value).toFixed(1).replace(".0","")}×`);

let cameraStream = null;
$("#startCamera").addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast("Kamera memerlukan browser modern dan localhost atau HTTPS.");
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    const video = $("#cameraVideo");
    video.srcObject = cameraStream; video.hidden = false;
    $(".camera-placeholder").hidden = true;
    $("#cameraStatus").textContent = "Kamera aktif"; $("#cameraStatus").className = "pill pill-green";
    $("#startCamera").disabled = true; $("#stopCamera").disabled = false;
  } catch (error) {
    toast(error.name === "NotAllowedError" ? "Izin kamera ditolak. Ubah izin kamera di browser." : "Kamera tidak dapat diakses. Periksa perangkat atau izin kamera.");
  }
});
$("#stopCamera").addEventListener("click", stopCamera);
function stopCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = null;
  const video = $("#cameraVideo"); video.srcObject = null; video.hidden = true;
  $(".camera-placeholder").hidden = false;
  $("#cameraStatus").textContent = "Kamera mati"; $("#cameraStatus").className = "pill pill-blue";
  $("#startCamera").disabled = false; $("#stopCamera").disabled = true;
}
window.addEventListener("beforeunload", stopCamera);
loadMessages();
