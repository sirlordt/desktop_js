/**
 * Directly set simulate-focus on an element.
 */
export function applySimulateFocus(el: HTMLElement, value: boolean): void {
  if (value) {
    el.setAttribute('data-simulate-focus', '')
  } else {
    el.removeAttribute('data-simulate-focus')
  }
}

/**
 * Dispatch a bubbling event from `anchor` upward.
 * Any UI* component ancestor listening for this event
 * will activate/deactivate its simulateFocus.
 */
export function dispatchSimulateFocus(anchor: HTMLElement, active: boolean): void {
  anchor.dispatchEvent(new CustomEvent('simulate-focus', {
    bubbles: true,
    composed: true,
    detail: { active },
  }))
}

/**
 * Listen for simulate-focus events on an element.
 * Call this in a component's constructor to auto-respond.
 * Returns a cleanup function.
 */
export function listenSimulateFocus(el: HTMLElement, apply: (active: boolean) => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail && typeof detail.active === 'boolean') {
      apply(detail.active)
    }
  }
  el.addEventListener('simulate-focus', handler)
  return () => el.removeEventListener('simulate-focus', handler)
}
