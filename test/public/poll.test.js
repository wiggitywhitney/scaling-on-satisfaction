// ABOUTME: Tests for audience polling controller — guards against overlapping fetches
// ABOUTME: Verifies that slow LLM generation doesn't cause duplicate sessions
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPollController } from '../../src/public/poll.js';

describe('poll controller', () => {
  let fetchStoryStatus;
  let fetchStoryPart;
  let onPart;
  let onLoading;
  let onError;
  let controller;

  beforeEach(() => {
    fetchStoryStatus = vi.fn();
    fetchStoryPart = vi.fn();
    onPart = vi.fn();
    onLoading = vi.fn();
    onError = vi.fn();
    controller = createPollController({ fetchStoryStatus, fetchStoryPart, onPart, onLoading, onError });
  });

  it('fetches part when poll detects advancement', async () => {
    fetchStoryStatus.mockResolvedValue({ currentPart: 1 });
    fetchStoryPart.mockResolvedValue({ part: 1, text: 'Story text', totalParts: 5, vote: null });

    await controller.poll();
    // Let the fetchPart promise settle
    await vi.waitFor(() => expect(onPart).toHaveBeenCalled());

    expect(fetchStoryPart).toHaveBeenCalledWith(1);
    expect(onPart).toHaveBeenCalledWith({ part: 1, text: 'Story text', totalParts: 5, vote: null });
  });

  it('does not fetch when currentPart equals displayedPart', async () => {
    fetchStoryStatus.mockResolvedValue({ currentPart: 0 });

    await controller.poll();

    expect(fetchStoryPart).not.toHaveBeenCalled();
  });

  it('prevents overlapping fetches for the same part', async () => {
    let resolveFirst;
    fetchStoryPart.mockImplementation(() => new Promise((resolve) => {
      resolveFirst = resolve;
    }));

    // First fetch starts but doesn't complete
    controller.fetchPart(1);
    // Second fetch for same part should be blocked
    controller.fetchPart(1);

    expect(fetchStoryPart).toHaveBeenCalledTimes(1);

    // Complete the first fetch
    resolveFirst({ part: 1, text: 'Story', totalParts: 5, vote: null });
    await vi.waitFor(() => expect(onPart).toHaveBeenCalled());
  });

  it('prevents overlapping fetches across multiple polls during slow generation', async () => {
    let resolveGeneration;
    fetchStoryStatus.mockResolvedValue({ currentPart: 1 });
    fetchStoryPart.mockImplementation(() => new Promise((resolve) => {
      resolveGeneration = resolve;
    }));

    // Simulate 5 rapid poll cycles while generation is in flight
    await controller.poll();
    await controller.poll();
    await controller.poll();
    await controller.poll();
    await controller.poll();

    expect(fetchStoryPart).toHaveBeenCalledTimes(1);

    resolveGeneration({ part: 1, text: 'Story', totalParts: 5, vote: null });
    await vi.waitFor(() => expect(onPart).toHaveBeenCalled());
    expect(onPart).toHaveBeenCalledTimes(1);
  });

  it('allows fetching next part after current completes', async () => {
    fetchStoryPart.mockResolvedValueOnce({ part: 1, text: 'Part 1', totalParts: 5, vote: null });
    fetchStoryPart.mockResolvedValueOnce({ part: 2, text: 'Part 2', totalParts: 5, vote: null });

    await controller.fetchPart(1);
    await controller.fetchPart(2);

    expect(fetchStoryPart).toHaveBeenCalledTimes(2);
    expect(onPart).toHaveBeenCalledTimes(2);
  });

  it('resets fetch guard on error so retry is possible', async () => {
    fetchStoryPart.mockRejectedValueOnce(new Error('Network error'));
    fetchStoryPart.mockResolvedValueOnce({ part: 1, text: 'Story', totalParts: 5, vote: null });

    await controller.fetchPart(1);
    expect(onError).toHaveBeenCalled();
    expect(controller.getState().fetchingPart).toBe(0);

    await controller.fetchPart(1);
    expect(fetchStoryPart).toHaveBeenCalledTimes(2);
    expect(onPart).toHaveBeenCalledTimes(1);
  });

  it('calls onLoading before fetch starts', async () => {
    fetchStoryPart.mockResolvedValue({ part: 1, text: 'Story', totalParts: 5, vote: null });

    await controller.fetchPart(1);

    expect(onLoading).toHaveBeenCalled();
    const loadingOrder = onLoading.mock.invocationCallOrder[0];
    const partOrder = onPart.mock.invocationCallOrder[0];
    expect(loadingOrder).toBeLessThan(partOrder);
  });

  it('ignores status fetch failures silently', async () => {
    fetchStoryStatus.mockRejectedValue(new Error('Network error'));

    await controller.poll();

    expect(fetchStoryPart).not.toHaveBeenCalled();
  });

  describe('server reset detection', () => {
    let onReset;

    beforeEach(() => {
      onReset = vi.fn();
      controller = createPollController({
        fetchStoryStatus,
        fetchStoryPart,
        onPart,
        onLoading,
        onError,
        onReset,
      });
    });

    it('resets client state when server currentPart drops below displayedPart', async () => {
      // First, advance to part 2
      fetchStoryStatus.mockResolvedValue({ currentPart: 2 });
      fetchStoryPart.mockResolvedValue({ part: 2, text: 'Part 2', totalParts: 5, vote: null });
      await controller.poll();
      await vi.waitFor(() => expect(onPart).toHaveBeenCalled());
      expect(controller.getState().displayedPart).toBe(2);

      // Server resets to 0
      fetchStoryStatus.mockResolvedValue({ currentPart: 0 });
      await controller.poll();

      expect(onReset).toHaveBeenCalled();
      expect(controller.getState().displayedPart).toBe(0);
      expect(controller.getState().fetchingPart).toBe(0);
    });

    it('resets when server goes back to part 1 from part 3', async () => {
      // Advance to part 3
      fetchStoryStatus.mockResolvedValue({ currentPart: 3 });
      fetchStoryPart.mockResolvedValue({ part: 3, text: 'Part 3', totalParts: 5, vote: null });
      await controller.poll();
      await vi.waitFor(() => expect(onPart).toHaveBeenCalled());

      // Server resets to part 1
      fetchStoryStatus.mockResolvedValue({ currentPart: 1 });
      fetchStoryPart.mockResolvedValue({ part: 1, text: 'New Part 1', totalParts: 5, vote: null });
      await controller.poll();

      expect(onReset).toHaveBeenCalled();
      // After reset, displayedPart is 0, so currentPart (1) > displayedPart (0) triggers fetch
      await vi.waitFor(() => expect(onPart).toHaveBeenCalledTimes(2));
      expect(onPart).toHaveBeenLastCalledWith({ part: 1, text: 'New Part 1', totalParts: 5, vote: null });
    });

    it('works without onReset callback', async () => {
      controller = createPollController({
        fetchStoryStatus,
        fetchStoryPart,
        onPart,
        onLoading,
        onError,
      });

      fetchStoryStatus.mockResolvedValue({ currentPart: 2 });
      fetchStoryPart.mockResolvedValue({ part: 2, text: 'Part 2', totalParts: 5, vote: null });
      await controller.poll();
      await vi.waitFor(() => expect(onPart).toHaveBeenCalled());

      // Server resets — should not throw even without onReset
      fetchStoryStatus.mockResolvedValue({ currentPart: 0 });
      await controller.poll();

      expect(controller.getState().displayedPart).toBe(0);
    });
  });

  describe('synchronized loading', () => {
    let onWaitingForReady;

    beforeEach(() => {
      onWaitingForReady = vi.fn();
      controller = createPollController({
        fetchStoryStatus,
        fetchStoryPart,
        onPart,
        onLoading,
        onError,
        onWaitingForReady,
      });
    });

    it('holds content when story is fetched but ready is false', async () => {
      fetchStoryStatus.mockResolvedValue({ currentPart: 1, ready: false });
      fetchStoryPart.mockResolvedValue({ part: 1, text: 'Story', totalParts: 5, vote: null });

      await controller.poll();
      await vi.waitFor(() => expect(fetchStoryPart).toHaveBeenCalled());

      expect(onPart).not.toHaveBeenCalled();
      expect(onWaitingForReady).toHaveBeenCalled();
    });

    it('shows content immediately when ready is true', async () => {
      fetchStoryStatus.mockResolvedValue({ currentPart: 1, ready: true });
      fetchStoryPart.mockResolvedValue({ part: 1, text: 'Story', totalParts: 5, vote: null });

      await controller.poll();
      await vi.waitFor(() => expect(onPart).toHaveBeenCalled());

      expect(onWaitingForReady).not.toHaveBeenCalled();
    });

    it('releases held content when ready becomes true on subsequent poll', async () => {
      fetchStoryStatus.mockResolvedValueOnce({ currentPart: 1, ready: false });
      fetchStoryPart.mockResolvedValue({ part: 1, text: 'Story', totalParts: 5, vote: null });

      await controller.poll();
      await vi.waitFor(() => expect(onWaitingForReady).toHaveBeenCalled());
      expect(onPart).not.toHaveBeenCalled();

      fetchStoryStatus.mockResolvedValueOnce({ currentPart: 1, ready: true });
      await controller.poll();

      expect(onPart).toHaveBeenCalledWith({ part: 1, text: 'Story', totalParts: 5, vote: null });
    });

    it('does not re-fetch story when releasing held content', async () => {
      fetchStoryStatus.mockResolvedValueOnce({ currentPart: 1, ready: false });
      fetchStoryPart.mockResolvedValue({ part: 1, text: 'Story', totalParts: 5, vote: null });

      await controller.poll();
      await vi.waitFor(() => expect(fetchStoryPart).toHaveBeenCalledTimes(1));

      fetchStoryStatus.mockResolvedValueOnce({ currentPart: 1, ready: true });
      await controller.poll();

      expect(fetchStoryPart).toHaveBeenCalledTimes(1);
      expect(onPart).toHaveBeenCalledTimes(1);
    });

    it('works without onWaitingForReady callback (backward compat)', async () => {
      controller = createPollController({
        fetchStoryStatus,
        fetchStoryPart,
        onPart,
        onLoading,
        onError,
      });

      fetchStoryStatus.mockResolvedValue({ currentPart: 1, ready: false });
      fetchStoryPart.mockResolvedValue({ part: 1, text: 'Story', totalParts: 5, vote: null });

      await controller.poll();
      await vi.waitFor(() => expect(fetchStoryPart).toHaveBeenCalled());

      expect(onPart).not.toHaveBeenCalled();
    });

    it('treats missing ready field as ready (backward compat)', async () => {
      fetchStoryStatus.mockResolvedValue({ currentPart: 1 });
      fetchStoryPart.mockResolvedValue({ part: 1, text: 'Story', totalParts: 5, vote: null });

      await controller.poll();
      await vi.waitFor(() => expect(onPart).toHaveBeenCalled());
    });
  });
});
