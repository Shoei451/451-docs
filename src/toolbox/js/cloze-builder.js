// ── State ──
let currentFilename = "";
let activeTab = "editor";

const mdInput = document.getElementById("mdInput");
const preview = document.getElementById("preview");

// ── Tab switch ──
function switchTab(tab) {
  activeTab = tab;
  ["editor", "preview"].forEach((t) => {
    document.getElementById("tab-" + t).classList.toggle("active", t === tab);
    document.getElementById("panel-" + t).classList.toggle("active", t === tab);
  });
  if (tab === "preview") render();
  else mdInput.focus();
}

// ── Render preview ──
function render() {
  const raw = mdInput.value;
  if (!raw.trim()) {
    preview.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⟦⟦⟧⟧</div>
      <p>エディタにMDを入力すると穴埋めプレビューが表示されます</p>
    </div>`;
    return;
  }

  // Protect ⟦⟦…⟧⟧ from marked.js
  const ph = [];
  const escaped = raw.replace(/⟦⟦([\s\S]*?)⟧⟧/g, (_, t) => {
    ph.push(t);
    return `CLZPH_${ph.length - 1}_END`;
  });

  let html = marked.parse(escaped);

  html = html.replace(/CLZPH_(\d+)_END/g, (_, i) => {
    const text = escHtml(ph[+i]);
    return `<span class="cloze-word cloze-hidden" onclick="toggleCloze(this)" title="${text}">${text}</span>`;
  });

  preview.innerHTML = html;
}

// ── Stats ──
function updateStats() {
  const raw = mdInput.value;
  const count = (raw.match(/⟦⟦[\s\S]*?⟧⟧/g) || []).length;
  const lines = raw ? raw.split("\n").length : 0;

  document.getElementById("sbCloze").textContent = count;
  document.getElementById("sbChars").textContent = raw.length;
  document.getElementById("sbLines").textContent = lines;

  const badge = document.getElementById("clozeBadge");
  badge.textContent = `⟦⟦ ${count} ⟧⟧`;
  badge.classList.toggle("has-cloze", count > 0);

  document.getElementById("dlBtn").disabled = !raw.trim();
}

// ── Toggle ──
function toggleCloze(el) {
  el.classList.toggle("cloze-hidden");
  el.classList.toggle("revealed");
}
function revealAll() {
  document.querySelectorAll(".cloze-word").forEach((el) => {
    el.classList.remove("cloze-hidden");
    el.classList.add("revealed");
  });
}
function hideAll() {
  document.querySelectorAll(".cloze-word").forEach((el) => {
    el.classList.add("cloze-hidden");
    el.classList.remove("revealed");
  });
}

// ── Wrap / Unwrap ──
function wrapSelection() {
  const s = mdInput.selectionStart,
    e = mdInput.selectionEnd;
  if (s === e) {
    showToast("語句を選択してから穴埋め化してください");
    return;
  }
  const sel = mdInput.value.slice(s, e);
  if (sel.includes("⟦⟦")) {
    showToast("すでに ⟦⟦⟧⟧ が含まれています");
    return;
  }
  const wrapped = `⟦⟦${sel}⟧⟧`;
  mdInput.value = mdInput.value.slice(0, s) + wrapped + mdInput.value.slice(e);
  mdInput.setSelectionRange(s + wrapped.length, s + wrapped.length);
  mdInput.focus();
  mdInput.dispatchEvent(new Event("input"));
  showToast(`⟦⟦ ${sel} ⟧⟧`);
}

function unwrapSelection() {
  const s = mdInput.selectionStart,
    e = mdInput.selectionEnd;
  const sel = mdInput.value.slice(s, e);
  const unwrapped = sel.replace(/⟦⟦([\s\S]*?)⟧⟧/g, "$1");
  if (unwrapped === sel) {
    showToast("選択範囲に ⟦⟦⟧⟧ がありません");
    return;
  }
  mdInput.value =
    mdInput.value.slice(0, s) + unwrapped + mdInput.value.slice(e);
  mdInput.setSelectionRange(s, s + unwrapped.length);
  mdInput.dispatchEvent(new Event("input"));
  showToast("解除しました");
}

function removeClozeAll() {
  if (!confirm("⟦⟦⟧⟧ 記号をすべて削除しますか？（テキストは残ります）")) return;
  mdInput.value = mdInput.value.replace(/⟦⟦([\s\S]*?)⟧⟧/g, "$1");
  mdInput.dispatchEvent(new Event("input"));
  showToast("⟦⟦⟧⟧ を全削除しました");
}

// ── File drop ──
const editorPanel = document.getElementById("panel-editor");
const dropOverlay = document.getElementById("dropOverlay");

editorPanel.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropOverlay.classList.add("active");
});
editorPanel.addEventListener("dragleave", () =>
  dropOverlay.classList.remove("active"),
);
editorPanel.addEventListener("drop", (e) => {
  e.preventDefault();
  dropOverlay.classList.remove("active");
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (!/\.(md|txt)$/i.test(file.name)) {
    showToast("⚠ .md または .txt ファイルをドロップしてください");
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    mdInput.value = ev.target.result;
    currentFilename = file.name;
    document.getElementById("sbFile").textContent = file.name;
    mdInput.dispatchEvent(new Event("input"));
    showToast(`📄 ${file.name} を読み込みました`);
  };
  reader.readAsText(file, "UTF-8");
});

// ── Download ──
function downloadMd() {
  const content = mdInput.value;
  if (!content.trim()) return;
  const name = currentFilename
    ? currentFilename.replace(/\.md$/i, "") + "-cloze.md"
    : "unit-cloze.md";
  const blob = new Blob([content], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), {
    href: url,
    download: name,
  }).click();
  URL.revokeObjectURL(url);
  showToast(`⬇ ${name} をダウンロードしました`);
}

// ── Clear ──
function clearAll() {
  if (mdInput.value.trim() && !confirm("内容をクリアしますか？")) return;
  mdInput.value = "";
  currentFilename = "";
  document.getElementById("sbFile").textContent = "";
  mdInput.dispatchEvent(new Event("input"));
  if (activeTab === "preview") render();
}

// ── Input handler ──
mdInput.addEventListener("input", () => {
  updateStats();
  if (activeTab === "preview") render();
});

// ── Keyboard shortcut ──
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key === "w") {
    e.preventDefault();
    wrapSelection();
  }
});

// ── Utils ──
function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let _tt;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove("show"), 2100);
}

updateStats();
