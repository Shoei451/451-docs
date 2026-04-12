const input = document.getElementById("password-input");

input.addEventListener("input", () => {
  const val = input.value;
  const row = document.getElementById("strength-row");
  if (!val) {
    row.style.display = "none";
    return;
  }
  row.style.display = "flex";

  let score = 0;
  if (val.length >= 8) score++;
  if (val.length >= 12) score++;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
  if (/[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) score++;

  const bars = [1, 2, 3, 4].map((n) => document.getElementById("bar" + n));
  const label = document.getElementById("strength-label");
  const levels = {
    0: { cls: "active-weak", text: "Weak", fill: 1 },
    1: { cls: "active-weak", text: "Weak", fill: 1 },
    2: { cls: "active-medium", text: "Medium", fill: 2 },
    3: { cls: "active-medium", text: "Medium", fill: 3 },
    4: { cls: "active-strong", text: "Strong", fill: 4 },
  };
  const lv = levels[score];
  bars.forEach((b, i) => {
    b.className = "strength-bar" + (i < lv.fill ? " " + lv.cls : "");
  });
  label.textContent = lv.text;
});

function toggleVisibility() {
  const isPass = input.type === "password";
  input.type = isPass ? "text" : "password";
  document.getElementById("eye-icon").style.display = isPass ? "none" : "";
  document.getElementById("eye-off-icon").style.display = isPass ? "" : "none";
}

async function doHash() {
  const pw = input.value.trim();
  if (!pw) {
    input.focus();
    return;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  document.getElementById("hash-value").textContent = hash;
  document.getElementById("copy-hash-btn").textContent = "Copy";
  document.getElementById("copy-hash-btn").className = "copy-hash-btn";
  document.getElementById("result-section").classList.add("show");
}

async function copyHash() {
  const hash = document.getElementById("hash-value").textContent;
  const btn = document.getElementById("copy-hash-btn");
  try {
    await navigator.clipboard.writeText(hash);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = hash;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  btn.textContent = "Copied";
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = "Copy";
    btn.classList.remove("copied");
  }, 2000);
}

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") doHash();
});

window.addEventListener("DOMContentLoaded", () => input.focus());
