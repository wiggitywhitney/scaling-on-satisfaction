// ABOUTME: Polling state machine for audience story loading
// ABOUTME: Guards against overlapping fetches and gates display on variant readiness

/**
 * Creates a polling controller that prevents overlapping story fetches.
 * During LLM generation (which can take seconds), multiple poll cycles
 * would otherwise each trigger a new fetch, creating duplicate sessions.
 *
 * When synchronized loading is active (ready: false in status), the
 * controller fetches the story (overlapping generation with the sync
 * window) but holds the content until ready becomes true.
 */
export function createPollController({ fetchStoryStatus, fetchStoryPart, onPart, onLoading, onError, onWaitingForReady }) {
  let displayedPart = 0;
  let fetchingPart = 0;
  let heldData = null;
  let lastReady = true;

  function releaseHeld() {
    if (!heldData) return;
    displayedPart = heldData.part;
    onPart(heldData);
    heldData = null;
  }

  async function fetchPart(part) {
    if (fetchingPart >= part) return;
    fetchingPart = part;
    onLoading();

    try {
      const data = await fetchStoryPart(part);
      heldData = data;
      if (lastReady) {
        releaseHeld();
      } else if (onWaitingForReady) {
        onWaitingForReady();
      }
    } catch (err) {
      fetchingPart = 0;
      onError(err);
    }
  }

  async function poll() {
    try {
      const data = await fetchStoryStatus();
      const ready = data.ready !== false;
      lastReady = ready;

      if (data.currentPart > displayedPart) {
        fetchPart(data.currentPart);
      }

      if (heldData && ready) {
        releaseHeld();
      } else if (heldData && !ready && onWaitingForReady) {
        onWaitingForReady();
      }
    } catch {
      // Silently retry on next poll
    }
  }

  function getState() {
    return { displayedPart, fetchingPart };
  }

  return { poll, fetchPart, getState };
}
