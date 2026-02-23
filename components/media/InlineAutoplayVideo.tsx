'use client';

import { useEffect, useMemo, useRef, useState, type VideoHTMLAttributes } from 'react';

type InlineAutoplayVideoProps = Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'autoPlay' | 'muted' | 'playsInline' | 'controls'
> & {
  deferUntilInView?: boolean;
  inViewRootMargin?: string;
};

const AUTOPLAY_RETRY_DELAYS_MS = [0, 200, 700, 1500];
const DEFAULT_CONTROLS_LIST = 'nodownload noplaybackrate noremoteplayback nofullscreen';
const SAFARI_INLINE_VIDEO_ATTRS: Record<string, string> = {
  'webkit-playsinline': 'true',
  'x-webkit-airplay': 'deny',
};

export default function InlineAutoplayVideo({
  className,
  src,
  loop,
  preload,
  deferUntilInView,
  inViewRootMargin,
  disablePictureInPicture,
  disableRemotePlayback,
  controlsList,
  ...rest
}: InlineAutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldLoop = loop ?? true;
  const shouldDeferUntilInView = deferUntilInView ?? true;
  const resolvedControlsList = controlsList ?? DEFAULT_CONTROLS_LIST;
  const resolvedInViewRootMargin = inViewRootMargin ?? '500px 0px';
  const [hasEnteredViewport, setHasEnteredViewport] = useState(!shouldDeferUntilInView);
  const activeSrc = useMemo(
    () => (hasEnteredViewport ? src : undefined),
    [hasEnteredViewport, src],
  );

  useEffect(() => {
    if (!shouldDeferUntilInView) {
      setHasEnteredViewport(true);
      return;
    }

    if (hasEnteredViewport) return;

    const video = videoRef.current;
    if (!video) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasEnteredViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const shouldLoad = entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0);
        if (!shouldLoad) return;
        setHasEnteredViewport(true);
        observer.disconnect();
      },
      {
        rootMargin: resolvedInViewRootMargin,
        threshold: 0.01,
      },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [hasEnteredViewport, resolvedInViewRootMargin, shouldDeferUntilInView]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    const timeoutIds: number[] = [];
    let userGestureListenersRemoved = false;

    const hardenVideoElement = () => {
      video.defaultMuted = true;
      video.muted = true;
      video.volume = 0;
      video.autoplay = true;
      video.loop = shouldLoop;
      video.playsInline = true;
      video.controls = false;
      video.disablePictureInPicture = disablePictureInPicture ?? true;
      video.disableRemotePlayback = disableRemotePlayback ?? true;

      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x-webkit-airplay', 'deny');
      video.setAttribute('disableremoteplayback', 'true');
      video.setAttribute('controlsList', resolvedControlsList);

      if (shouldLoop) {
        video.setAttribute('loop', '');
      } else {
        video.removeAttribute('loop');
      }

      video.removeAttribute('controls');
    };

    const attemptPlay = () => {
      hardenVideoElement();
      if (video.readyState === HTMLMediaElement.HAVE_NOTHING) {
        video.load();
      }
      const maybePromise = video.play();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {});
      }
    };

    const removeUserGestureListeners = () => {
      if (userGestureListenersRemoved) return;
      userGestureListenersRemoved = true;
      document.removeEventListener('touchstart', handleUserGesture, true);
      document.removeEventListener('pointerdown', handleUserGesture, true);
      document.removeEventListener('click', handleUserGesture, true);
      document.removeEventListener('keydown', handleUserGesture, true);
    };

    const handleUserGesture = () => {
      attemptPlay();
      if (!video.paused) {
        removeUserGestureListeners();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        attemptPlay();
      }
    };

    const handlePause = () => {
      if (document.visibilityState === 'visible') {
        attemptPlay();
      }
    };

    const handleLoadedData = () => {
      attemptPlay();
    };

    hardenVideoElement();
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('pause', handlePause);
    video.addEventListener('playing', removeUserGestureListeners);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);
    document.addEventListener('touchstart', handleUserGesture, true);
    document.addEventListener('pointerdown', handleUserGesture, true);
    document.addEventListener('click', handleUserGesture, true);
    document.addEventListener('keydown', handleUserGesture, true);

    AUTOPLAY_RETRY_DELAYS_MS.forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        if (document.visibilityState === 'visible' && video.paused) {
          attemptPlay();
        }
      }, delay);
      timeoutIds.push(timeoutId);
    });

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('playing', removeUserGestureListeners);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
      removeUserGestureListeners();
    };
  }, [activeSrc, disablePictureInPicture, disableRemotePlayback, resolvedControlsList, shouldLoop]);

  return (
    <video
      ref={videoRef}
      src={activeSrc}
      {...rest}
      {...SAFARI_INLINE_VIDEO_ATTRS}
      className={['inline-autoplay-video', className].filter(Boolean).join(' ')}
      data-inline-autoplay-video
      autoPlay
      muted
      playsInline
      controls={false}
      loop={shouldLoop}
      disablePictureInPicture={disablePictureInPicture ?? true}
      disableRemotePlayback={disableRemotePlayback ?? true}
      controlsList={resolvedControlsList}
      preload={preload ?? 'metadata'}
    />
  );
}
