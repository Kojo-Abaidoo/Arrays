/* ==========================================================
   Array Music Player — with thumbnails
   The whole app is built around ONE array: `playlist`.
   Each element is an object:
     { title, artist, src, cover, duration }
   ========================================================== */

// ---------- Inline SVG cover generator (always works, no network) ----------
function makeCover(letter, c1, c2) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#g)"/>
      <text x="100" y="130" font-size="90"
            font-family="Segoe UI, sans-serif" font-weight="700"
            text-anchor="middle" fill="#ffffff" opacity="0.9">${letter}</text>
    </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const DEFAULT_COVER = makeCover("♪", "#9d4dff", "#ff2e88");

// ---------- THE ARRAY (core data structure) ----------
// 10 built-in tracks. Covers are inline SVG so they ALWAYS render,
// even offline or when the page is opened from file://.
let playlist = [
  { title: "Neon Skyline",    artist: "SoundHelix 1",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",  cover: makeCover("N", "#00e5ff", "#9d4dff"), duration: 0 },
  { title: "Midnight Pulse",  artist: "SoundHelix 2",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",  cover: makeCover("M", "#9d4dff", "#ff2e88"), duration: 0 },
  { title: "Electric Dreams", artist: "SoundHelix 3",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",  cover: makeCover("E", "#ff2e88", "#ffd166"), duration: 0 },
  { title: "Velvet Groove",   artist: "SoundHelix 4",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",  cover: makeCover("V", "#ffd166", "#06ffa5"), duration: 0 },
  { title: "Aurora Bloom",    artist: "SoundHelix 5",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",  cover: makeCover("A", "#06ffa5", "#00e5ff"), duration: 0 },
  { title: "Cosmic Drift",    artist: "SoundHelix 6",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",  cover: makeCover("C", "#00e5ff", "#ff2e88"), duration: 0 },
  { title: "Starlit Avenue",  artist: "SoundHelix 7",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",  cover: makeCover("S", "#9d4dff", "#06ffa5"), duration: 0 },
  { title: "Chrome Sunset",   artist: "SoundHelix 8",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",  cover: makeCover("C", "#ffd166", "#ff2e88"), duration: 0 },
  { title: "Solar Flare",     artist: "SoundHelix 9",  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",  cover: makeCover("S", "#ff2e88", "#9d4dff"), duration: 0 },
  { title: "Afterglow",       artist: "SoundHelix 10", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", cover: makeCover("A", "#00e5ff", "#ffd166"), duration: 0 },
];

let currentIndex = 0;
let repeatOn = false;
let searchTerm = "";

const STORAGE_KEY = "arrayMusicPlayer.playlist.v2"; // bump version to discard broken old saves

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const audio = $("audio");
const playBtn = $("playBtn");
const disc = $("disc");
const discCover = $("discCover");

// ---------- Helpers ----------
function formatTime(sec) {
  if (!isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function save() {
  const savable = playlist.filter(
    (t) => !t.src.startsWith("blob:") && !t.cover?.startsWith("blob:")
  );
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savable)); } catch (e) {}
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) playlist = saved;
  } catch (e) {}
}

function fetchDuration(track) {
  if (track.duration) return;
  const probe = new Audio();
  probe.preload = "metadata";
  probe.src = track.src;
  probe.addEventListener("loadedmetadata", () => {
    track.duration = probe.duration;
    render();
  });
  probe.addEventListener("error", () => {
    console.warn("Could not load metadata:", track.src);
  });
}

// ---------- ARRAY OPERATIONS ----------
function addSong(title, artist, src, cover) {
  const track = { title, artist, src, cover: cover || DEFAULT_COVER, duration: 0 };
  playlist.push(track);
  fetchDuration(track);
  save();
  render();
}

function removeSong(index) {
  const wasCurrent = index === currentIndex;
  playlist.splice(index, 1);

  if (playlist.length === 0) {
    audio.pause();
    audio.removeAttribute("src");
    currentIndex = 0;
  } else if (index < currentIndex) {
    currentIndex--;
  } else if (wasCurrent) {
    currentIndex = Math.min(currentIndex, playlist.length - 1);
    loadTrack(currentIndex, !audio.paused);
  }
  save();
  render();
}

function moveSong(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= playlist.length) return;
  [playlist[index], playlist[target]] = [playlist[target], playlist[index]];
  if (currentIndex === index) currentIndex = target;
  else if (currentIndex === target) currentIndex = index;
  save();
  render();
}

function shufflePlaylist() {
  if (playlist.length < 2) return;
  const current = playlist[currentIndex];
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
  currentIndex = playlist.indexOf(current);
  save();
  render();
}

function sortByTitle() {
  const current = playlist[currentIndex];
  playlist.sort((a, b) => a.title.localeCompare(b.title));
  currentIndex = playlist.indexOf(current);
  save();
  render();
}

function nextSong() {
  if (!playlist.length) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  loadTrack(currentIndex, true);
}

function prevSong() {
  if (!playlist.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentIndex, true);
}

// ---------- PLAYBACK ----------
function loadTrack(index, autoplay = false) {
  const track = playlist[index];
  if (!track) return;
  currentIndex = index;
  audio.src = track.src;
  if (autoplay) audio.play().catch(() => {});
  render();
}

function togglePlay() {
  if (!playlist.length) return;
  if (!audio.src) loadTrack(currentIndex);
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

// ---------- RENDERING ----------
function render() {
  renderNowPlaying();
  renderList();
  renderStats();
  $("arrayView").textContent = JSON.stringify(
    playlist.map((t, i) => ({
      index: i,
      title: t.title,
      artist: t.artist,
      hasCover: !!t.cover
    })),
    null,
    2
  );
}

function renderNowPlaying() {
  const track = playlist[currentIndex];
  $("trackTitle").textContent = track ? track.title : "No song loaded";
  $("trackArtist").textContent = track ? track.artist : "—";
  $("trackIndex").textContent = track
    ? `playlist[${currentIndex}] • song ${currentIndex + 1} of ${playlist.length}`
    : "";

  if (track && track.cover) {
    discCover.src = track.cover;
    discCover.onerror = () => { discCover.src = DEFAULT_COVER; };
    disc.classList.add("has-cover");
  } else {
    discCover.removeAttribute("src");
    disc.classList.remove("has-cover");
  }
}

function renderList() {
  const ul = $("playlist");
  ul.innerHTML = "";

  const term = searchTerm.trim().toLowerCase();
  const visible = playlist
    .map((track, index) => ({ track, index }))
    .filter(({ track }) =>
      track.title.toLowerCase().includes(term) ||
      track.artist.toLowerCase().includes(term)
    );

  if (!visible.length) {
    ul.innerHTML = `<li class="empty">${playlist.length ? "No matching songs." : "Playlist is empty. Add a song below."}</li>`;
    return;
  }

  visible.forEach(({ track, index }) => {
    const li = document.createElement("li");
    if (index === currentIndex) li.classList.add("current");
    li.innerHTML = `
      <img class="row-thumb" alt="" />
      <span class="idx">${index}</span>
      <div class="info">
        <strong></strong>
        <span></span>
      </div>
      <span class="dur">${formatTime(track.duration)}</span>
      <div class="actions">
        <button data-act="up" title="Move up">↑</button>
        <button data-act="down" title="Move down">↓</button>
        <button data-act="del" title="Remove">✕</button>
      </div>`;

    const thumb = li.querySelector(".row-thumb");
    thumb.src = track.cover || DEFAULT_COVER;
    thumb.onerror = () => { thumb.src = DEFAULT_COVER; };

    li.querySelector("strong").textContent = track.title;
    li.querySelector(".info span").textContent = track.artist;

    li.querySelector(".info").addEventListener("click", () => loadTrack(index, true));
    li.querySelector('[data-act="up"]').addEventListener("click", () => moveSong(index, -1));
    li.querySelector('[data-act="down"]').addEventListener("click", () => moveSong(index, 1));
    li.querySelector('[data-act="del"]').addEventListener("click", () => removeSong(index));
    ul.appendChild(li);
  });
}

function renderStats() {
  const total = playlist.reduce((sum, t) => sum + (t.duration || 0), 0);
  $("stats").textContent =
    `${playlist.length} song${playlist.length === 1 ? "" : "s"} • total length ${formatTime(total)}`;
}

// ---------- EVENTS ----------
playBtn.addEventListener("click", togglePlay);
$("nextBtn").addEventListener("click", nextSong);
$("prevBtn").addEventListener("click", prevSong);
$("shuffleBtn").addEventListener("click", shufflePlaylist);
$("sortBtn").addEventListener("click", sortByTitle);

$("repeatBtn").addEventListener("click", () => {
  repeatOn = !repeatOn;
  $("repeatBtn").classList.toggle("active", repeatOn);
});

$("search").addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderList();
});

$("volume").addEventListener("input", (e) => { audio.volume = e.target.value; });

$("progress").addEventListener("input", (e) => {
  if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});

audio.addEventListener("play",  () => { playBtn.textContent = "⏸"; disc.classList.add("spinning"); });
audio.addEventListener("pause", () => { playBtn.textContent = "▶"; disc.classList.remove("spinning"); });

audio.addEventListener("loadedmetadata", () => {
  $("totalTime").textContent = formatTime(audio.duration);
  const track = playlist[currentIndex];
  if (track && !track.duration) { track.duration = audio.duration; renderList(); renderStats(); }
});

audio.addEventListener("timeupdate", () => {
  $("currentTime").textContent = formatTime(audio.currentTime);
  if (audio.duration) $("progress").value = (audio.currentTime / audio.duration) * 100;
});

audio.addEventListener("ended", () => {
  const isLast = currentIndex === playlist.length - 1;
  if (isLast && !repeatOn) {
    audio.currentTime = 0;
    audio.pause();
  } else {
    nextSong();
  }
});

$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("newTitle").value.trim();
  const artist = $("newArtist").value.trim();
  const url = $("newUrl").value.trim();
  const coverUrl = $("newCover").value.trim();
  const audioFile = $("newFile").files[0];
  const coverFile = $("newCoverFile").files[0];

  const src = audioFile ? URL.createObjectURL(audioFile) : url;
  const cover = coverFile
    ? URL.createObjectURL(coverFile)
    : (coverUrl || DEFAULT_COVER);

  if (!title || !artist || !src) {
    alert("Please enter a title, an artist, and either an audio URL or a file.");
    return;
  }
  addSong(title, artist, src, cover);
  e.target.reset();
});

// ---------- START ----------
load();
audio.volume = 0.8;
playlist.forEach(fetchDuration);
loadTrack(currentIndex);
render();
