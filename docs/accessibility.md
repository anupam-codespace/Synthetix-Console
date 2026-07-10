# Accessibility Guide

This document describes the accessibility implementations in **Synthetix Console**.

---

## 1. Keyboard Navigability

Synthetix Console is designed to be fully navigable without a mouse:
* **Interactive Modals**: The Command Palette (`⌘K`) and Shortcuts Modal (`?`) automatically capture and release focus on mount and unmount.
* **Vim Navigation**: Users can scroll lists using Vim-like keys (`J`/`K` keys), open dynamic drawer inspectors using `Enter`, and dismiss views using `Escape`.
* **Focus Overrides**: Pressing `Esc` or toggling search panels closes overlays instantly, even if text input controls are currently active.

---

## 2. Text Readability & Contrast

* **Contrast Ratios**: The dark mode matches WCAG AA recommendations, pairing high-contrast light grays (`#fafafa` / `#ededed`) against dark slate backdrops (`#09090b` / `#0a0a0a`).
* **Semantic Hierarchies**: Layout headers leverage strict, linear heading orders (`h1` for page titles, `h2`/`h3` for subsection cards), ensuring screen readers parse content correctly.
* **Readable Fonts**: We load standard sans-serif system fonts with fallback values (Arial, Segoe UI, Roboto) to prevent rendering lag on assistive devices.

---

## 3. Screen Reader Labels

* **Visual Icons**: Custom control triggers (like theme toggles, search inputs, play/pause replay, and logging copy buttons) include clean descriptive `title` attributes.
* **Unique Key Identifiers**: Dynamic row grids map specific, unique data keys (UUID strings) directly to IDs, helping screen readers list rows.
* **Alt Fallbacks**: Screen graphics use descriptive text tags.
