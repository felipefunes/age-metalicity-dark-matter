import { useCallback, useEffect, useState } from "react";

/** Minimal hand-rolled router -- no react-router-dom, matching this
 * project's precedent of hand-rolling over adding a dependency for this
 * kind of thing (useUrlState.ts instead of a router; hand-rolled i18n
 * instead of a library). Only two real destinations exist ("/" and
 * "/galaxies"), so a full routing library isn't warranted. */
export interface RouteState {
  path: string;
  /** Navigates to an internal href ("/", "/galaxies", "/#datos", ...).
   * If the pathname differs from the current one, pushes history and
   * swaps the page, then scrolls to the hash (if any) once rendered. If
   * the pathname is the same as the current one, this just sets
   * location.hash -- native anchor-scroll behavor, unchanged from before
   * this hook existed (e.g. clicking "Fuentes" while already on "/"). */
  navigateTo: (href: string) => void;
}

function currentPath(): string {
  return window.location.pathname;
}

function scrollToHashIfPresent(hash: string) {
  if (!hash) return;
  // Wait a tick for the destination page to render before looking up the
  // element -- relevant when navigateTo also changes the page.
  requestAnimationFrame(() => {
    const id = hash.replace(/^#/, "");
    document.getElementById(id)?.scrollIntoView();
  });
}

export function useRoute(): RouteState {
  const [path, setPath] = useState<string>(currentPath);

  useEffect(() => {
    function onPopState() {
      setPath(currentPath());
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = useCallback((href: string) => {
    const url = new URL(href, window.location.origin);

    if (url.pathname !== window.location.pathname) {
      window.history.pushState(null, "", url.pathname + url.hash);
      setPath(url.pathname);
      scrollToHashIfPresent(url.hash);
    } else if (url.hash) {
      window.location.hash = url.hash;
    }
  }, []);

  return { path, navigateTo };
}
