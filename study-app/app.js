/**
 * Tree & Shrub Study App
 * Reads species_data.json from the Species_Database folder
 * Works as a static file — no server required
 */

// ─── Configuration ──────────────────────────────────────────────
// Path to the species_data.json relative to this HTML file.
// When hosted on GitHub Pages with Species_Database/ at the same level as study-app/:
const DATA_URL = '../Species_Database/species_data.json';

// ─── State ──────────────────────────────────────────────────────
let allSpecies = [];
let filteredSpecies = [];
let activeTags = new Set();
let activeHabits = new Set();
let searchQuery = '';
let currentSpecies = null;
let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

// ─── Tag colors ─────────────────────────────────────────────────
function tagClass(tag) {
  const t = tag.toLowerCase();
  if (t.includes('tree')) return 'tag-tree';
  if (t.includes('shrub')) return 'tag-shrub';
  if (t.includes('native')) return 'tag-native';
  if (t.includes('invasive')) return 'tag-invasive';
  if (t.includes('conifer') || t.includes('evergreen')) return 'tag-conifer';
  if (t.includes('deciduous')) return 'tag-deciduous';
  if (t.includes('planted') || t.includes('introduced')) return 'tag-planted';
  return 'tag-default';
}

// ─── Init ────────────────────────────────────────────────────────
async function init() {
  try {
    showLoading();
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allSpecies = await res.json();

    if (!Array.isArray(allSpecies) || allSpecies.length === 0) {
      throw new Error('No species data found in JSON file');
    }

    filteredSpecies = [...allSpecies];
    document.getElementById('species-count').textContent = `${allSpecies.length} species`;

    buildTagFilters();
    buildHabitFilters();
    renderList();
    setupEventListeners();
    showWelcome();

    document.getElementById('quiz-fab').style.display = 'block';
  } catch (err) {
    showError(err);
  }
}

function showLoading() {
  document.getElementById('species-list').innerHTML =
    '<li class="loading-msg">Loading species data…</li>';
}

function showError(err) {
  document.getElementById('species-list').innerHTML =
    `<li class="error-msg">
      <strong>Could not load species_data.json</strong><br>
      ${err.message}<br><br>
      <small>Make sure Species_Database/species_data.json exists relative to this page.<br>
      For local testing, you may need to run a simple HTTP server (e.g. <code>python -m http.server</code>).</small>
    </li>`;
}

// ─── Build Filters ───────────────────────────────────────────────
function buildTagFilters() {
  const tagSet = new Set();
  allSpecies.forEach(s => (s.tags || []).forEach(t => tagSet.add(t)));

  const container = document.getElementById('tag-filters');
  tagSet.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-tag';
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.addEventListener('click', () => toggleTag(tag, btn, activeTags));
    container.appendChild(btn);
  });
}

function buildHabitFilters() {
  const habitSet = new Set();
  allSpecies.forEach(s => {
    if (s.usda?.growthHabit) {
      s.usda.growthHabit.split(',').forEach(h => habitSet.add(h.trim()));
    }
  });

  const container = document.getElementById('habit-filters');
  if (habitSet.size === 0) {
    container.closest('.filter-section').style.display = 'none';
    return;
  }
  habitSet.forEach(habit => {
    const btn = document.createElement('button');
    btn.className = 'filter-tag';
    btn.textContent = habit;
    btn.dataset.tag = habit;
    btn.addEventListener('click', () => toggleTag(habit, btn, activeHabits));
    container.appendChild(btn);
  });
}

function toggleTag(tag, btn, set) {
  if (set.has(tag)) {
    set.delete(tag);
    btn.classList.remove('active');
  } else {
    set.add(tag);
    btn.classList.add('active');
  }
  applyFilters();
}

// ─── Filtering ───────────────────────────────────────────────────
function applyFilters() {
  const q = searchQuery.toLowerCase();

  filteredSpecies = allSpecies.filter(s => {
    // Search
    if (q) {
      const common = (s.commonName || '').toLowerCase();
      const sci = (s.scientificName || '').toLowerCase();
      const family = (s.family || '').toLowerCase();
      if (!common.includes(q) && !sci.includes(q) && !family.includes(q)) return false;
    }

    // Tag filters
    if (activeTags.size > 0) {
      const sTags = s.tags || [];
      if (![...activeTags].some(t => sTags.includes(t))) return false;
    }

    // Habit filters
    if (activeHabits.size > 0) {
      const habit = s.usda?.growthHabit || '';
      if (![...activeHabits].some(h => habit.includes(h))) return false;
    }

    return true;
  });

  document.getElementById('filtered-count').textContent =
    filteredSpecies.length === allSpecies.length
      ? `Showing all ${allSpecies.length}`
      : `Showing ${filteredSpecies.length} of ${allSpecies.length}`;

  renderList();
}

// ─── Render Species List ─────────────────────────────────────────
function renderList() {
  const ul = document.getElementById('species-list');
  ul.innerHTML = '';

  if (filteredSpecies.length === 0) {
    ul.innerHTML = '<li class="loading-msg">No species match your filters.</li>';
    return;
  }

  filteredSpecies.forEach(s => {
    const li = document.createElement('li');
    if (currentSpecies && currentSpecies.id === s.id) li.classList.add('active');

    const tags = (s.tags || []).slice(0, 3);
    const tagHtml = tags.map(t =>
      `<span class="list-tag ${tagClass(t)}">${t}</span>`
    ).join('');

    li.innerHTML = `
      <div class="list-common">${s.commonName || s.id}</div>
      <div class="list-scientific">${s.scientificName || ''}</div>
      <div class="list-tags">${tagHtml}</div>
    `;
    li.addEventListener('click', () => showSpeciesDetail(s));
    ul.appendChild(li);
  });
}

// ─── Species Detail ──────────────────────────────────────────────
function showWelcome() {
  document.getElementById('welcome-screen').style.display = '';
  document.getElementById('species-detail').style.display = 'none';
}

function showSpeciesDetail(species) {
  currentSpecies = species;

  // Highlight in list
  document.querySelectorAll('.species-list li').forEach(li => li.classList.remove('active'));
  const items = document.querySelectorAll('.species-list li');
  const idx = filteredSpecies.findIndex(s => s.id === species.id);
  if (items[idx]) items[idx].classList.add('active');

  document.getElementById('welcome-screen').style.display = 'none';
  const detail = document.getElementById('species-detail');
  detail.style.display = '';

  // Names
  document.getElementById('detail-common-name').textContent = species.commonName || species.id;
  document.getElementById('detail-scientific-name').textContent = species.scientificName || '';
  document.getElementById('detail-family').textContent = species.family ? `Family: ${species.family}` : '';

  // Tags
  const tagsEl = document.getElementById('detail-tags');
  tagsEl.innerHTML = (species.tags || []).map(t =>
    `<span class="tag-badge ${tagClass(t)}">${t}</span>`
  ).join('');

  // Gallery
  const images = (species.images || []).filter(img => !img.isMap);
  const mainImg = document.getElementById('gallery-main-img');
  const mainAlt = document.getElementById('gallery-main-alt');
  const thumbsEl = document.getElementById('gallery-thumbs');
  thumbsEl.innerHTML = '';

  if (images.length > 0) {
    setGalleryMain(images[0], species);

    images.forEach((img, i) => {
      const thumb = document.createElement('img');
      thumb.className = 'thumb' + (i === 0 ? ' active' : '');
      thumb.src = `../Species_Database/${img.file}`;
      thumb.alt = img.alt || '';
      thumb.loading = 'lazy';
      thumb.addEventListener('click', () => {
        setGalleryMain(img, species);
        thumbsEl.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumb.onerror = () => { thumb.style.display = 'none'; };
      thumbsEl.appendChild(thumb);
    });
  } else {
    mainImg.src = '';
    mainImg.alt = 'No images available';
    mainAlt.textContent = 'No images available for this species.';
  }

  // Map
  const mapSection = document.getElementById('map-section');
  const mapImg = document.getElementById('detail-map');
  if (species.mapImage) {
    mapImg.src = `../Species_Database/${species.mapImage}`;
    mapImg.alt = `${species.commonName} range map`;
    mapImg.onerror = () => { mapSection.style.display = 'none'; };
    mapSection.style.display = '';
  } else {
    mapSection.style.display = 'none';
  }

  // USDA data
  const usdaGrid = document.getElementById('usda-grid');
  const usda = species.usda || {};
  const usdaFields = [
    { label: 'Symbol', value: usda.symbol },
    { label: 'Group', value: usda.group },
    { label: 'Duration', value: usda.duration },
    { label: 'Growth Habit', value: usda.growthHabit },
    { label: 'Native Status', value: usda.nativeStatus }
  ];
  usdaGrid.innerHTML = usdaFields.map(f => `
    <div class="usda-cell">
      <div class="usda-label">${f.label}</div>
      <div class="usda-value ${f.value ? '' : 'empty'}">${f.value || 'Not available'}</div>
    </div>
  `).join('');

  // Description
  const desc = document.getElementById('detail-description');
  if (species.description) {
    desc.innerHTML = species.description
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('');
  } else {
    desc.innerHTML = '<p><em>No description available.</em></p>';
  }

  // PDFs
  const pdfSection = document.getElementById('pdf-section');
  const pdfLinks = document.getElementById('pdf-links');
  if (species.pdfs && species.pdfs.length > 0) {
    pdfLinks.innerHTML = species.pdfs.map(p => {
      const label = p.includes('fact') ? 'Fact Sheet' : p.includes('guide') ? 'Plant Guide' : 'Document';
      return `<a class="pdf-link" href="../Species_Database/${p}" target="_blank" rel="noopener">
        <span class="pdf-icon">📄</span> ${label}
      </a>`;
    }).join('');
    pdfSection.style.display = '';
  } else {
    pdfSection.style.display = 'none';
  }

  // Scroll to top of detail panel
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setGalleryMain(img, species) {
  const mainImg = document.getElementById('gallery-main-img');
  const mainAlt = document.getElementById('gallery-main-alt');
  mainImg.src = `../Species_Database/${img.file}`;
  mainImg.alt = img.alt || species.commonName;
  mainImg.onerror = () => {
    mainImg.alt = 'Image not found';
  };
  mainAlt.textContent = img.alt || '';
}

// ─── Event Listeners ─────────────────────────────────────────────
function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    clearBtn.classList.toggle('visible', searchQuery.length > 0);
    applyFilters();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.classList.remove('visible');
    applyFilters();
  });

  document.getElementById('reset-filters').addEventListener('click', () => {
    activeTags.clear();
    activeHabits.clear();
    searchQuery = '';
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    applyFilters();
  });

  document.getElementById('quiz-fab').addEventListener('click', startQuiz);
  document.getElementById('quiz-close').addEventListener('click', closeQuiz);
  document.getElementById('quiz-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('quiz-overlay')) closeQuiz();
  });
}

// ─── Quiz ────────────────────────────────────────────────────────
function startQuiz() {
  const pool = filteredSpecies.filter(s =>
    (s.images || []).some(img => !img.isMap)
  );

  if (pool.length < 2) {
    alert('Need at least 2 species with images for a quiz. Try removing some filters.');
    return;
  }

  quizQueue = shuffle([...pool]).slice(0, Math.min(10, pool.length));
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;

  document.getElementById('quiz-overlay').style.display = 'flex';
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const content = document.getElementById('quiz-content');

  if (quizIndex >= quizQueue.length) {
    content.innerHTML = `
      <div class="quiz-score">
        <h3>${quizScore} / ${quizQueue.length}</h3>
        <p>${quizScore === quizQueue.length ? '🌟 Perfect score!' :
          quizScore >= quizQueue.length * 0.7 ? '🌿 Great job!' :
          'Keep studying — you\'ll get there!'}</p>
        <button class="quiz-next-btn" onclick="startQuiz()">Try Again</button>
      </div>`;
    return;
  }

  quizAnswered = false;
  const correct = quizQueue[quizIndex];
  const wrongPool = allSpecies.filter(s => s.id !== correct.id);
  const wrongs = shuffle(wrongPool).slice(0, 3);
  const options = shuffle([correct, ...wrongs]);

  const img = (correct.images || []).find(i => !i.isMap);

  content.innerHTML = `
    <img class="quiz-img" src="../Species_Database/${img?.file || ''}"
         alt="Identify this species"
         onerror="this.style.display='none'">
    <p class="quiz-question">What species is shown above?</p>
    <div class="quiz-options" id="quiz-options">
      ${options.map(opt => `
        <button class="quiz-option" data-id="${opt.id}" onclick="handleQuizAnswer(this, '${correct.id}')">
          ${opt.commonName || opt.id}
          <small style="display:block;font-style:italic;opacity:.7">${opt.scientificName || ''}</small>
        </button>
      `).join('')}
    </div>
    <div id="quiz-feedback" style="display:none"></div>
  `;
}

function handleQuizAnswer(btn, correctId) {
  if (quizAnswered) return;
  quizAnswered = true;

  const isCorrect = btn.dataset.id === correctId;
  if (isCorrect) quizScore++;

  document.querySelectorAll('.quiz-option').forEach(b => {
    b.disabled = true;
    if (b.dataset.id === correctId) b.classList.add('correct');
    else if (b === btn && !isCorrect) b.classList.add('wrong');
  });

  const feedback = document.getElementById('quiz-feedback');
  const correct = quizQueue[quizIndex];
  feedback.style.display = '';
  feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`;
  feedback.innerHTML = isCorrect
    ? `✅ Correct! <strong>${correct.commonName}</strong> (${correct.scientificName || ''})`
    : `❌ The answer was <strong>${correct.commonName}</strong> (${correct.scientificName || ''})`;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'quiz-next-btn';
  nextBtn.textContent = quizIndex + 1 < quizQueue.length ? 'Next →' : 'See Results';
  nextBtn.onclick = () => {
    quizIndex++;
    renderQuizQuestion();
  };
  feedback.appendChild(nextBtn);
}

function closeQuiz() {
  document.getElementById('quiz-overlay').style.display = 'none';
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Start ───────────────────────────────────────────────────────
init();
