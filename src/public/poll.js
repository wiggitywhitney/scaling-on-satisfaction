// ABOUTME: Polling state machine for audience story loading
// ABOUTME: Guards against overlapping fetches during slow LLM generation

/**
 * Creates a polling controller that prevents overlapping story fetches.
 * During LLM generation (which can take seconds), multiple poll cycles
 * would otherwise each trigger a new fetch, creating duplicate sessions.
 */
export function createPollController({ fetchStoryStatus, fetchStoryPart, onPart, onLoading, onError }) {
  let displayedPart = 0;
  let fetchingPart = 0;

  async function fetchPart(part) {
    if (fetchingPart >= part) return;
    fetchingPart = part;
    onLoading();

    try {
      const data = await fetchStoryPart(part);
      displayedPart = data.part;
      onPart(data);
    } catch (err) {
      fetchingPart = 0;
      onError(err);
    }
  }

  async function poll() {
    try {
      const data = await fetchStoryStatus();
      if (data.currentPart > displayedPart) {
        fetchPart(data.currentPart);
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
