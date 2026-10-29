# Native candidate and real-device validation

Every item below is **NOT RUN in this audit**. Environment startup failed; no Mac or physical device is attached. Do not convert this checklist into passing evidence without execution.

## Prepare the existing Mac, without changing identity or audience

In an isolated checkout/worktree of the final integrated candidate (not the owner's dirty working folder):

```sh
git rev-parse HEAD
node --version
npm --version
xcodebuild -version
xcodebuild -showsdks
npm ci
npm test -- --run
npm run typecheck
npm run lint
npm run build
node scripts/verify-v3-algorithm.mjs
npm run ios:sync
git diff -- ios
xcodebuild -list -project ios/App/App.xcodeproj
```

Read checkout AGENTS.md and relevant .agents/skills first. Record command exit codes and logs; do not print secrets or dump environment values. Resolve generated native changes against the package lock and final audio integration. Use the scheme actually listed by Xcode; do not assume Capacitor's config string proves a shared archive scheme exists.

Inspect candidate build configuration for development relay/preview values. Confirm no server.url/live-reload destination, arbitrary navigation allowance or private API key is bundled. Confirm the packaged web assets match the candidate build. Use existing signing identity/registered bundle ID. Version 1.0/build 1 in source is not proof that build 1 is unused.

In Xcode, resolve packages, build on a simulator, then use the existing signing team to install on devices. Generate an archive only after integration checks pass. Save archive validation and aggregated privacy-report output. Do not upload, accept agreements or release without the required specific approval.

## Native packaging inventory to verify

- Info.plist and app manifest parse; app manifest appears in the actual .app bundle.
- Every included SDK's privacy manifest/resource is present as required; inspect required-reason API coverage and signatures from the archive.
- 1024px app icon has correct dimensions, no transparency and approved artwork; launch images/storyboards load on small/large screens without clipping.
- Bundle ID/version/build/signing match existing App Store record.
- iOS 15 deployment and iPhone/iPad family in source match the intended supported matrix.
- Permission prompts occur only after relevant choices. No unexplained camera, microphone, contacts, location or tracking prompt.
- Background-audio declarations, audio session, interruption handling and lock-screen controls are tested together after the audio owner's integration. Local notifications do not require adding remote-push/background entitlements just to deliver on-device alerts.
- Airplane-mode cold launch opens bundled UI/media and saved data. External choices fail clearly without corrupting local progress.
- No development purchase simulation or founder-preview badge appears in the App Store candidate.

## Evidence matrix

Record for each case: candidate SHA, archive/build number, device/model/OS, tester/date, expected versus actual result, screenshot/video/log path, and PASS/FAIL/BLOCKED. Use synthetic data; redact notification identifiers and tokens.

| Case | Procedure / required evidence | Status |
|---|---|---|
| Clean install | Onboarding, Library, privacy and urgent support reachable; no unsolicited permissions | NOT RUN |
| Upgrade | Install over prior test build with synthetic notes/history; retain valid saved data | NOT RUN |
| Small/large iPhone | Safe areas, keyboard, rotation as supported, tap targets, long content and Back | NOT RUN |
| iPad | Current supported orientations/layout; no clipped controls or unusable native sheet | NOT RUN |
| VoiceOver | Labels, reading/focus order, grouped content, sliders, quiz feedback and stop/support controls | NOT RUN |
| Larger Text / zoom | Largest supported text settings, no hidden primary actions or overlapping text | NOT RUN |
| Reduced motion / contrast | OS settings respected; essential meaning does not depend on motion/color alone | NOT RUN |
| Audio timing | Tapping rhythm/visual alignment, revised urge narration, Night Channel content against approved scripts | NOT RUN — audio owner integration |
| Interruptions | Call/Siri/alarm/other audio, headphone unplug/Bluetooth change, silent switch; no surprise restart or overlap | NOT RUN |
| Lock/background | Lock and background each audio flow; expected pause/continue behavior, timed stop, return state and controls | NOT RUN |
| Saved progress | Background, force-close, relaunch, system reclaim; Back/retry/repeated taps do not create completion | NOT RUN — preserve accepted PR32 semantics |
| Native notification grant | Explicit opt-in; actual queue, lock-screen delivery, tap cold/warm opens correct active plan | NOT RUN |
| Deny/revoke | Deny then continue in-app; revoke in Settings then resume; no false scheduled/delivered status | NOT RUN |
| Stop/reschedule/delete | Cancel pending/delivered notifications, stale taps safe, no old-plan delivery after replacement | NOT RUN |
| Web push integration | Separate PWA test with push owner: install, opt-in, offline cancel/retry, expiry and provider delivery | NOT RUN; not evidence for native build |
| Privacy/network | Fresh and resumed native candidate with network capture; no unapproved authored-text/analytics requests | NOT RUN |
| Backup export/restore | Export excludes notification ownership; restore cannot overwrite active cancellation token; private JSON disclosure clear | NOT RUN — source fix pending |
| Delete data | Local history/drafts clear, notification cancellation behavior truthful; exported copies handled separately | NOT RUN |
| Rating integration | Correct construct-specific wording/anchors and retained answers after return | NOT RUN — rating owner integration |
| Existing subscription | Restore/manage works as appropriate; journeys remain free and unavailable StoreKit does not block them | NOT RUN |
| Archive review | Validate archive, aggregated SDK privacy report, icon, symbols and export answers | NOT RUN |
| Store metadata | Approved privacy/support URLs load publicly; current screenshots and age/accessibility declarations match candidate | NOT RUN |

The smallest real-device unblock is the existing Mac with supported Xcode/signing plus a connected iPhone. Simulators and browser viewport captures cannot establish phone-lock delivery, audio interruptions or native accessibility correctness. iPad validation remains required while the current device family is retained.
