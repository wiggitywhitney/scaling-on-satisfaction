// ABOUTME: Client-side audience UI that polls for story parts and handles voting
// ABOUTME: Auto-loads new parts when presenter advances, sends thumbs-up/down votes
import { createPollController } from './poll.js';

const POLL_INTERVAL_MS = 2000;

let voteLocked = false;

const welcome = document.getElementById('welcome');
const story = document.getElementById('story');
const storyText = document.getElementById('story-text');
const loading = document.getElementById('loading');
const preparing = document.getElementById('preparing');
const waiting = document.getElementById('waiting');
const progress = document.getElementById('progress');
const voteButtons = document.getElementById('vote-buttons');
const voteBtns = document.querySelectorAll('.vote-btn');

let currentDisplayedPart = 0;

function showVoteButtons(existingVote) {
  voteButtons.classList.add('active');
  voteLocked = !!existingVote;
  voteBtns.forEach((btn) => {
    btn.classList.remove('selected', 'dimmed');
    btn.disabled = !!existingVote;
    if (existingVote) {
      if (btn.dataset.vote === existingVote) {
        btn.classList.add('selected');
      } else {
        btn.classList.add('dimmed');
      }
    }
  });
}

function hideVoteButtons() {
  voteButtons.classList.remove('active');
  voteLocked = false;
  voteBtns.forEach((btn) => {
    btn.classList.remove('selected', 'dimmed');
    btn.disabled = false;
  });
}

async function submitVote(vote) {
  if (voteLocked) return;
  try {
    const res = await fetch(`/api/story/${currentDisplayedPart}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    });
    if (!res.ok) return;

    showVoteButtons(vote);
  } catch {
    // Vote failed silently — not critical to UX
  }
}

voteBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    submitVote(btn.dataset.vote);
  });
});

function showWaitingForNext() {
  loading.classList.remove('active');
  preparing.classList.remove('active');
  storyText.classList.remove('visible');
  waiting.classList.add('active');
  hideVoteButtons();
}

const controller = createPollController({
  fetchStoryStatus: async () => {
    const res = await fetch('/api/story/status');
    if (!res.ok) throw new Error(`status ${res.status}`);
    return res.json();
  },
  fetchStoryPart: async (part) => {
    const res = await fetch(`/api/story/${part}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return res.json();
  },
  onLoading: () => {
    welcome.classList.add('hidden');
    story.classList.add('active');
    waiting.classList.remove('active');
    preparing.classList.remove('active');
    storyText.classList.remove('visible');
    loading.classList.add('active');
    hideVoteButtons();
  },
  onWaitingForReady: () => {
    welcome.classList.add('hidden');
    story.classList.add('active');
    loading.classList.remove('active');
    waiting.classList.remove('active');
    storyText.classList.remove('visible');
    preparing.classList.add('active');
    hideVoteButtons();
  },
  onPart: (data) => {
    welcome.classList.add('hidden');
    story.classList.add('active');
    loading.classList.remove('active');
    preparing.classList.remove('active');
    waiting.classList.remove('active');
    storyText.textContent = data.text;
    storyText.classList.add('visible');
    progress.textContent = `Part ${data.part} of ${data.totalParts}`;
    currentDisplayedPart = data.part;
    showVoteButtons(data.vote);
  },
  onError: (err) => {
    loading.classList.remove('active');
    storyText.textContent = `Error loading story: ${err.message}`;
    storyText.classList.add('visible');
  },
});

// Eagerly pre-generate Part 1 so it's cached before admin advances
fetch('/api/story/warmup', { method: 'POST' }).catch(() => {});

setInterval(() => controller.poll(), POLL_INTERVAL_MS);
