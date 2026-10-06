# Secondary alternatives across all journeys

The practice content and its primary actions lead every journey. Another way
now follows that content as a quiet, underlined secondary control. Its tap
target remains at least 44 pixels and its focus outline remains visible.
Larger-text preferences enlarge the secondary label, alternative copy and note
fields without making the alternative a primary action.

Standalone frames (including Foundations, Signal Lock, Night Channel, The Good
Map and Dear 2100) reserve a footer below their finished native build. Vector
Shift uses the same footer position. Their previous centered strips above the
builds are removed; native controls retain their own space.

Native care, tapping, PMR, Urge Surfing, Tomorrow Parking Lot, Next Easiest Step,
Change the Scene and Thought or Fact place the alternative after their actual
stage content and main actions. Thought or Fact retains its privacy disclosure
near the beginning. Shared-shell and timed-player alternatives follow their
playback controls; Tara's existing footer remains secondary.

The alternatives, optional local notes and pause bridges are preserved. Opening
an alternative leaves the practice mounted and pauses supported players;
returning does not restart playback automatically. Closing the native modal
explicitly restores keyboard focus to the secondary control, including Escape.

`qa/alternative-hierarchy-browser.py` renders all 20 current journeys at 320 and
390 pixels. It verifies that practice content precedes the alternative, checks
its actual quiet style and tap size, opens/closes the dialog, checks contained
focus and return focus, exercises browser Back and records screenshots. The
existing deep suites cover later stages, long content, playback interruption,
refresh, local save/delete failures and return to saved work. The required
aggregate remains tests, typecheck, lint, build and V3 verification, followed by
the browser suites against the completed production build.

This correction follows the complete cumulative Dear 2100 gate, initial
hardening and ten whole-app quality passes. It does not alter reward rules,
approved artwork, question/scale semantics or the Foundations/Signal Lock
internals.
