/* ===== TOC (post pages only) ===== */

const tocToggle = document.getElementById("tocToggle");
const overlay   = document.getElementById("overlay");
const tocList   = document.getElementById("tocList");
const tocBox    = document.querySelector("#tocBox ul");
const article   = document.getElementById("article");

if (tocToggle && overlay && article) {

  /* ===== Open / Close ===== */

  function openToc() {
    document.body.classList.add("toc-open");
  }

  function closeToc() {
    document.body.classList.remove("toc-open");
  }

  tocToggle.addEventListener("click", () => {
    document.body.classList.toggle("toc-open");
  });

  overlay.addEventListener("click", closeToc);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeToc();
  });

  /* ===== Generate TOC ===== */

  const headings = article.querySelectorAll("h2, h3, h4");  // h4まで対象

  headings.forEach((heading, index) => {
    const id = "section-" + index;
    heading.id = id;

    function createLink() {
      const link = document.createElement("a");
      link.href = "#" + id;
      link.textContent = heading.textContent;
      // インデントをタグ名で制御
      if (heading.tagName === "H3") link.classList.add("h3");
      if (heading.tagName === "H4") link.classList.add("h4");
      return link;
    }

    /* Sidebar */
    if (tocList) tocList.appendChild(createLink());

    /* TOC Box */
    if (tocBox) {
      const li = document.createElement("li");
      if (heading.tagName === "H3") li.classList.add("h3");
      if (heading.tagName === "H4") li.classList.add("h4");
      li.appendChild(createLink());
      tocBox.appendChild(li);
    }
  });

  /* ===== Smooth Scroll ===== */

  document.addEventListener("click", function (e) {
    if (e.target.matches(".toc a, .toc-box a")) {
      e.preventDefault();
      const target = document.querySelector(e.target.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      closeToc();
    }
  });

  /* ===== Active Highlight ===== */

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll(".toc a").forEach(a => {
          a.classList.remove("active");
        });
        const activeLink = document.querySelector(`.toc a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add("active");
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px" });

  headings.forEach(h => observer.observe(h));
}