import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDismissMenu } from './useDismissMenu';

/** Minimal trigger + panel harness exercising the hook's full contract. */
function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = React.useState(true);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => {
    setOpen(false);
    onClose();
  }, [onClose]);
  const { rootRef, onPanelKeyDown } = useDismissMenu(open, close, triggerRef);

  return (
    <div>
      <button type="button">buiten</button>
      <div ref={rootRef}>
        <button ref={triggerRef} type="button">
          trigger
        </button>
        {open ? (
          <div role="menu" onKeyDown={onPanelKeyDown}>
            <button type="button" role="menuitemradio" aria-checked="true">
              een
            </button>
            <button type="button" role="menuitemradio" aria-checked="false">
              twee
            </button>
            <button type="button" role="menuitemradio" aria-checked="false">
              drie
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

describe('useDismissMenu', () => {
  it('closes on an outside click', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('button', { name: 'buiten' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not close on a click inside the scoped root', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.mouseDown(screen.getByRole('menuitemradio', { name: 'twee' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    screen.getByRole('menuitemradio', { name: 'een' }).focus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'trigger' })).toHaveFocus();
  });

  it('roves focus across menuitemradio options with ArrowDown/ArrowUp, wrapping around', () => {
    render(<Harness onClose={vi.fn()} />);
    const menu = screen.getByRole('menu');
    const options = screen.getAllByRole('menuitemradio');

    options[0].focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(options[1]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(options[2]).toHaveFocus();

    // Wraps past the last option back to the first.
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(options[0]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(options[2]).toHaveFocus();
  });

  it('Home/End jump to the first/last option', () => {
    render(<Harness onClose={vi.fn()} />);
    const menu = screen.getByRole('menu');
    const options = screen.getAllByRole('menuitemradio');

    options[1].focus();
    fireEvent.keyDown(menu, { key: 'End' });
    expect(options[2]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'Home' });
    expect(options[0]).toHaveFocus();
  });

  it('does not return focus to the trigger when no triggerRef is supplied', () => {
    function NoTriggerHarness() {
      const [open, setOpen] = React.useState(true);
      const { rootRef } = useDismissMenu(open, () => setOpen(false));
      return <div ref={rootRef}>{open ? <div role="menu">panel</div> : null}</div>;
    }
    render(<NoTriggerHarness />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    // No trigger was registered; nothing throws, and focus stays on <body>.
    expect(document.body).toHaveFocus();
  });
});
