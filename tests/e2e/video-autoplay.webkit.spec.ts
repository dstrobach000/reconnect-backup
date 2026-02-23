import { expect, test } from '@playwright/test';

type PlaybackAttempt = {
  blocked: boolean;
  errorName: string | null;
  paused: boolean;
};

test.describe('Video autoplay contract (WebKit)', () => {
  test('renders required attributes and hides controls', async ({ page }) => {
    await page.goto('/');

    const allVideos = page.locator('video');
    await expect(allVideos.first()).toBeVisible();
    expect(await allVideos.count()).toBeGreaterThan(1);

    const states = await allVideos.evaluateAll((elements) =>
      elements.map((video) => ({
        muted: video.muted,
        autoplay: video.autoplay,
        playsInline: video.playsInline,
        controls: video.controls,
        hasControlsAttr: video.hasAttribute('controls'),
      })),
    );

    for (const state of states) {
      expect(state.muted).toBe(true);
      expect(state.autoplay).toBe(true);
      expect(state.playsInline).toBe(true);
      expect(state.controls).toBe(false);
      expect(state.hasControlsAttr).toBe(false);
    }

    const heroAttrs = await page.locator('video.hero-overlay-video').first().evaluate((video) => ({
      hasWebkitPlaysInlineAttr: video.hasAttribute('webkit-playsinline'),
      hasAirplayDenyAttr: video.getAttribute('x-webkit-airplay') === 'deny',
      disableRemotePlayback: (video as HTMLVideoElement).disableRemotePlayback,
    }));

    expect(heroAttrs.hasWebkitPlaysInlineAttr).toBe(true);
    expect(heroAttrs.hasAirplayDenyAttr).toBe(true);
    expect(heroAttrs.disableRemotePlayback).toBe(true);

    const inlineAttrs = await page.locator('video.inline-autoplay-video').evaluateAll((videos) =>
      videos.map((video) => ({
        hasWebkitPlaysInlineAttr: video.hasAttribute('webkit-playsinline'),
        hasAirplayDenyAttr: video.getAttribute('x-webkit-airplay') === 'deny',
        disableRemotePlayback: (video as HTMLVideoElement).disableRemotePlayback,
      })),
    );

    expect(inlineAttrs.length).toBeGreaterThan(0);
    for (const attrs of inlineAttrs) {
      expect(attrs.hasWebkitPlaysInlineAttr).toBe(true);
      expect(attrs.hasAirplayDenyAttr).toBe(true);
      expect(attrs.disableRemotePlayback).toBe(true);
    }
  });

  test('plays videos after first gesture and autoplays when policy allows', async ({ page }) => {
    await page.goto('/');

    const heroVideo = page.locator('video.hero-overlay-video').first();
    await heroVideo.scrollIntoViewIfNeeded();

    const firstInlineVideo = page.locator('video.inline-autoplay-video').first();
    await firstInlineVideo.scrollIntoViewIfNeeded();

    const attemptPlayback = async (selector: string): Promise<PlaybackAttempt> =>
      page.locator(selector).first().evaluate(async (video) => {
        try {
          await video.play();
          return { blocked: false, errorName: null, paused: video.paused };
        } catch (error) {
          const domError = error as DOMException;
          return { blocked: true, errorName: domError?.name ?? 'UnknownError', paused: video.paused };
        }
      });

    const heroBeforeGesture = await attemptPlayback('video.hero-overlay-video');
    const inlineBeforeGesture = await attemptPlayback('video.inline-autoplay-video');

    if (!heroBeforeGesture.blocked) {
      expect(heroBeforeGesture.paused).toBe(false);
    }
    if (!inlineBeforeGesture.blocked) {
      expect(inlineBeforeGesture.paused).toBe(false);
    }

    await page.mouse.click(8, 8);

    await expect.poll(
      () => heroVideo.evaluate((video) => video.paused),
      { timeout: 8_000, message: 'Hero video should play after first user gesture.' },
    ).toBe(false);

    await expect.poll(
      () => firstInlineVideo.evaluate((video) => video.paused),
      { timeout: 8_000, message: 'Inline content video should play after first user gesture.' },
    ).toBe(false);
  });
});
