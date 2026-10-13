/* ==========================================================
   Array Music Player
   The whole app is built around ONE array: `playlist`.
   Each element is an object: { title, artist, src, duration }
   ========================================================== */

// ---------- THE ARRAY (core data structure) ----------
let playlist = [
  { title: "SoundHelix Song 1", artist: "T. Schürger", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 0 },
  { title: "SoundHelix Song 2", artist: "T. Schürger", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: 0 },
  { title: "SoundHelix Song 3", artist: "T. Schürger", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", duration: 0 },
  { title: "SoundHelix Song 4", artist: "T. Schürger", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", duration: 0 },
];

let currentIndex = 0;
let repeatOn = false;
let searchTerm = "";

const STORAGE_KEY = "arrayMusicPlayer.playlist";

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const audio = $("audio");
const playBtn = $("playBtn");
const disc = $("disc");

// ---------- Helpers ----------
function formatTime(sec) {
  if (!isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function save() {
  const savable = playlist.filter((t) => !t.src.startsWith("blob:"));
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
}

// ---------- ARRAY OPERATIONS ----------

// ADD: push() appends to the end of the array
function addSong(title, artist, src) {
  const track = { title, artist, src, duration: 0 };
  playlist.push(track);
  fetchDuration(track);
  save();
  render();
}

// REMOVE: splice() deletes the element at an index
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

// REORDER: swap two elements using destructuring
function moveSong(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= playlist.length) return;

  [playlist[index], playlist[target]] = [playlist[target], playlist[index]];

  if (currentIndex === index) currentIndex = target;
  else if (currentIndex === target) currentIndex = index;

  save();
  render();
}

// SHUFFLE: Fisher-Yates algorithm
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

// SORT: sort() with a comparison function
function sortByTitle() {
  const current = playlist[currentIndex];
  playlist.sort((a, b) => a.title.localeCompare(b.title));
  currentIndex = playlist.indexOf(current);
  save();
  render();
}

// NEXT / PREVIOUS
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
    playlist.map((t, i) => ({ index: i, title: t.title, artist: t.artist })),
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
}

function renderList() {
  const ul = $("playlist");
  ul.innerHTML = "";

  // FILTER: build a new array of songs matching the search text
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

  // MAP/forEach: turn each array element into a list item
  visible.forEach(({ track, index }) => {
    const li = document.createElement("li");
    if (index === currentIndex) li.classList.add("current");
    li.innerHTML = `
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
  // REDUCE: add up all durations into a single number
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

audio.addEventListener("play", () => { playBtn.textContent = "⏸"; disc.classList.add("spinning"); });
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
  const file = $("newFile").files[0];

  const src = file ? URL.createObjectURL(file) : url;
  if (!title || !artist || !src) {
    alert("Please enter a title, an artist, and either an audio URL or a file.");
    return;
  }
  addSong(title, artist, src);
  e.target.reset();
});

// ---------- START ----------
load();
audio.volume = 0.8;
playlist.forEach(fetchDuration);
loadTrack(currentIndex);