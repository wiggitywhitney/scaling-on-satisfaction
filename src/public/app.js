const POLL_INTERVAL_MS = 2000;

let displayedPart = 0;
let polling = null;

const welcome = document.getElementById('welcome');
const story = document.getElementById('story');
const storyText = document.getElementById('story-text');
const loading = document.getElementById('loading');
const waiting = document.getElementById('waiting');
const progress = document.getElementById('progress');

function showStory(data) {
  welcome.classList.add('hidden');
  story.classList.add('active');
  loading.classList.remove('active');
  waiting.classList.remove('active');
  storyText.textContent = data.text;
  storyText.classList.add('visible');
  progress.textContent = `Part ${data.part} of ${data.totalParts}`;
  displayedPart = data.part;
}

function showLoading() {
  welcome.classList.add('hidden');
  story.classList.add('active');
  waiting.classList.remove('active');
  storyText.classList.remove('visible');
  loading.classList.add('active');
}

function showWaitingForNext() {
  loading.classList.remove('active');
  storyText.classList.remove('visible');
  waiting.classList.add('active');
}

async function fetchPart(part) {
  showLoading();

  try {
    const res = await fetch(`/api/story/${part}`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    showStory(data);
  } catch (err) {
    loading.classList.remove('active');
    storyText.textContent = `Error loading story: ${err.message}`;
    storyText.classList.add('visible');
  }
}

async function pollForNext() {
  try {
    const res = await fetch('/api/story/status');
    if (!res.ok) return;
    const data = await res.json();

    if (data.currentPart > displayedPart) {
      fetchPart(data.currentPart);
    }
  } catch {
    // Silently retry on next poll
  }
}

function startPolling() {
  polling = setInterval(pollForNext, POLL_INTERVAL_MS);
}

startPolling();
