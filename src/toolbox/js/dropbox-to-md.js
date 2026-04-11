function convertLinks() {
  const input = document.getElementById("inputLinks").value.trim();
  const statusEl = document.getElementById("statusMessage");
  const outputEl = document.getElementById("outputMarkdown");
  const copyBtn = document.getElementById("copyBtn");

  statusEl.className = "status";
  statusEl.textContent = "";

  if (!input) {
    statusEl.className = "status error";
    statusEl.textContent = "Please enter at least one link.";
    outputEl.value = "";
    copyBtn.disabled = true;
    return;
  }

  const links = input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const converted = [];
  const errors = [];
  const warnings = [];

  links.forEach((link, i) => {
    try {
      if (!link.includes("dropbox.com")) {
        errors.push(`Line ${i + 1}: Not a Dropbox link.`);
        return;
      }
      const url = new URL(link);
      const isNewFormat = link.includes("/scl/");
      if (isNewFormat && !url.searchParams.has("rlkey")) {
        warnings.push(`Line ${i + 1}: Missing rlkey (may cause 403 errors).`);
      }
      url.searchParams.delete("dl");
      url.searchParams.set("raw", "1");
      converted.push(`![](${url.toString()})`);
    } catch (e) {
      errors.push(`Line ${i + 1}: ${e.message}`);
    }
  });

  if (converted.length > 0) {
    outputEl.value = converted.join("\n");
    copyBtn.disabled = false;

    if (errors.length === 0 && warnings.length === 0) {
      statusEl.className = "status success";
      statusEl.textContent = `Converted ${converted.length} link(s).`;
    } else if (warnings.length > 0) {
      statusEl.className = "status warning";
      statusEl.textContent =
        `Converted ${converted.length} link(s).\n` + warnings.join("\n");
    }
    if (errors.length > 0) {
      statusEl.textContent +=
        (statusEl.textContent ? "\n" : "") + errors.join("\n");
    }
  } else {
    statusEl.className = "status error";
    statusEl.textContent = "Conversion failed.\n" + errors.join("\n");
    outputEl.value = "";
    copyBtn.disabled = true;
  }
}

async function copyToClipboard() {
  const text = document.getElementById("outputMarkdown").value;
  const btn = document.getElementById("copyBtn");
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  const prev = btn.textContent;
  btn.textContent = "Copied";
  setTimeout(() => {
    btn.textContent = prev;
  }, 2000);
}

function clearAll() {
  document.getElementById("inputLinks").value = "";
  document.getElementById("outputMarkdown").value = "";
  document.getElementById("statusMessage").className = "status";
  document.getElementById("statusMessage").textContent = "";
  document.getElementById("copyBtn").disabled = true;
}

document.getElementById("inputLinks").addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") convertLinks();
});
