# Capture Constraints And Plan

This document explains an important product constraint in VisualSprint:

How much can a web app really capture from browser meetings like Google Meet or Zoom-in-browser, and what happens when the meeting is running in an external desktop app like Zoom?

Use this together with:

- [Google Cloud Agent Builder plan](./google-cloud-agent-builder.md)
- [Elastic integration handoff](./elastic-integration-handoff.md)

## Short answer

VisualSprint is currently a web app, so it follows browser capture rules.

That means:

- it can capture a browser tab if the user explicitly shares that tab
- it can capture a browser window if the user explicitly shares that window
- it can capture the whole screen if the user explicitly shares the screen
- it cannot silently inspect other tabs or external desktop apps
- it cannot automatically read a desktop Zoom app without user-approved screen or window sharing

## Current implementation status

The current repo is already beyond pure planning for capture.

Built now:

- browser-first capture in `apps/web` using `getDisplayMedia`
- incremental chunk recording with `MediaRecorder`
- optional microphone merge when the browser allows it
- explicit chunk flow through the API:
  - register chunk
  - mark upload complete
  - run chunk reasoning
- capture readiness UX in the meeting setup and live views

Partial:

- user-approved window or full-screen capture works only through the browser share picker
- desktop Zoom can be observed only if the user explicitly shares that window or the full screen
- browser and OS audio support still varies and is not normalized by a native helper

Not built yet:

- a native desktop helper or extension
- a fully productionized cloud media pipeline for every capture mode
- guaranteed desktop-app-specific UX beyond the standard browser share flow

## What works well today

These are the cases a browser-first VisualSprint flow can support well.

### Browser-based Google Meet

If the meeting runs in a browser tab, the user can usually share that tab into VisualSprint.

This is the cleanest first connector because:

- tab capture is predictable
- browser content is easier to reason over
- the user consent flow is clear
- the product stays fully web-native

### Browser-based Zoom

If Zoom is running in a browser tab instead of the desktop app, the same tab-sharing model works.

This is still browser-native capture, so it fits the current architecture well.

### User-approved window or full-screen sharing

If the user chooses a window or an entire screen in the browser share picker, VisualSprint can observe what is visible there.

That can include:

- a browser tab
- a browser window
- an external meeting app window
- a full desktop screen

## What does not work automatically

These are the important limitations to keep in mind.

### The web app cannot silently read another browser tab

The browser share picker is user-controlled.

So VisualSprint cannot:

- inspect another tab in the background
- bypass the user selection step
- automatically switch capture targets without permission

### The web app cannot silently read the Zoom desktop app

If Zoom runs as a separate desktop app, the web app cannot directly inspect it like normal page content.

VisualSprint only gets access if the user explicitly shares:

- the Zoom window
- or the full screen

### Audio capture can vary by browser and OS

Even when screen or window capture is allowed, system-audio behavior can be inconsistent.

So we should treat:

- visual capture support
- microphone capture support
- system-audio capture support

as separate capabilities in the product.

## Product implications

These constraints affect both UX and architecture.

### Good first-class capture target

The best first-class target is:

- browser meetings

especially:

- Google Meet in a browser tab
- Zoom in a browser tab

### External desktop apps are possible, but user-mediated

The product can still support desktop Zoom sessions, but only through:

- user-approved window capture
- or user-approved full-screen capture

That means the UX must clearly explain:

- what to share
- why it is needed
- what VisualSprint can and cannot see

### Agents should never own capture logic

This remains a deterministic frontend and backend concern.

The agents should only receive assembled context after capture and preprocessing.

## Recommended product plan

This is the best phased plan for VisualSprint as a web-first system.

### Phase 1. Browser-tab-first support

Status today:

- mostly built

Make the primary supported path:

- Google Meet in browser tab
- Zoom in browser tab

Product behavior:

- ask the user to share the meeting tab
- capture visual context from that tab
- capture microphone audio separately if needed
- keep the UI explicit about what is being shared

Why this first:

- lowest implementation risk
- best user clarity
- strongest browser compatibility

### Phase 2. User-approved window and full-screen support

Status today:

- partially built through the browser picker, but not polished as a dedicated desktop-app flow

Expand the capture UX so users can choose:

- meeting tab
- meeting window
- full screen

This is the phase that enables:

- Zoom desktop app support through shared window capture
- non-browser meeting views when users explicitly allow them

Important rule:

- still no hidden inspection of external apps

### Phase 3. Better desktop-app support later

Status today:

- not built

If the product later needs stronger desktop integration, consider:

- a browser extension
- an Electron shell
- a Tauri shell
- a native helper

This would only be needed if the team wants:

- stronger app-level integration
- more reliable desktop window targeting
- deeper OS-aware capture flows

That is not required for the first production story.

## What is still missing for capture

The current gaps are not the basic browser APIs. They are production hardening gaps:

- more explicit UX for tab vs window vs full-screen choices
- validation across more browser and OS combinations
- a real cloud ingest/transcription/media path behind the browser chunks
- a decision on whether a desktop helper is actually needed after browser-first validation

## UX guidance

The product should explain capture options in plain language.

Good UX guidance should say things like:

- share your meeting tab for the best experience
- share the Zoom window if Zoom is running as a desktop app
- share the full screen only if window capture is not available

The UI should also show:

- what capture target is active
- whether browser capture is supported
- whether system audio is available
- whether the user is sharing a tab, window, or screen

## Recommended architecture decision

For the current VisualSprint scope, keep this rule:

1. First-class support: browser meeting tabs
2. Secondary support: user-approved desktop app window capture
3. Later expansion: desktop helper only if truly needed

This keeps the architecture realistic while still allowing Zoom desktop scenarios when the user explicitly shares the target.

## Definition of done for capture support

We can say capture support is in a good first production state when all of this is true:

- browser tab capture works reliably for browser-based meetings
- the UI clearly tells the user what to share
- window or full-screen capture works when the user approves it
- the backend receives a stable chunk stream from the web app
- the agents continue to operate only on assembled context
- the product never depends on hidden access to external apps

Current repo assessment:

- browser-tab-first capture is already implemented
- window/full-screen support is available through browser-native sharing
- the main remaining work is production hardening, not basic feasibility

## Bottom line

A web app can support both browser meetings and external meeting apps, but the access model is different.

For browser meetings:

- tab capture is the best path

For external desktop apps:

- only user-approved window or full-screen sharing works

VisualSprint should therefore stay browser-tab-first, with explicit window or
full-screen fallback for desktop Zoom. The repo already implements that
direction, and the remaining work is to harden the pipeline behind it rather
than to redesign the capture model.
