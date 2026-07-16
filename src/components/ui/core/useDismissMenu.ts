'use client';

import React from 'react';

/**
 * Shared dismiss + keyboard-navigation behavior for a trigger-and-panel pair
 * (a dropdown, mega-menu, or drawer): closes the panel on an outside click or
 * the Escape key, returns focus to the trigger on Escape, and provides
 * arrow-key roving across the panel's options. One hook backs every
 * dismissible menu in the header so the outside-click/Escape/focus-return
 * wiring is implemented once, not per component.
 */
export interface UseDismissMenuResult {
  /**
   * Attach to the element wrapping the trigger + panel. Scopes "outside" to
   * this subtree so a click anywhere inside it (including the trigger and
   * the panel itself) does not count as dismissal.
   */
  rootRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Attach to the open panel's `onKeyDown`. ArrowDown/ArrowUp move focus
   * across every `[role="menuitemradio"]` descendant, with wrap-around;
   * Home/End jump to the first/last option.
   */
  onPanelKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}

export function useDismissMenu(
  open: boolean,
  onClose: () => void,
  /** Optional: focus returns here on Escape. Omit when there is no single trigger to return to. */
  triggerRef?: React.RefObject<HTMLElement | null>,
): UseDismissMenuResult {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onDocMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        triggerRef?.current?.focus();
      }
    }

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, triggerRef]);

  const onPanelKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const { key } = event;
    if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') {
      return;
    }
    const panel = event.currentTarget;
    const items = Array.from(
      panel.querySelectorAll<HTMLElement>('[role="menuitemradio"]'),
    );
    if (items.length === 0) return;

    event.preventDefault();
    const active = document.activeElement as HTMLElement | null;
    const current = active ? items.indexOf(active) : -1;

    let next: number;
    if (key === 'Home') next = 0;
    else if (key === 'End') next = items.length - 1;
    else {
      const delta = key === 'ArrowDown' ? 1 : -1;
      next = current === -1 ? 0 : (current + delta + items.length) % items.length;
    }
    items[next]?.focus();
  }, []);

  return { rootRef, onPanelKeyDown };
}
