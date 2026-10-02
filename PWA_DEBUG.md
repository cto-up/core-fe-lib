# PWA install diagnostics (`?pwadebug`)

Add `?pwadebug` to any URL of a consumer app (e.g. `https://<tenant>.<domain>/?pwadebug`)
to pin a one-line status bar at the top of the screen, refreshed every 1.5 s. It
shows why the browser is or isn't offering "Install app", directly on the phone —
no remote devtools needed. Without the parameter nothing renders and nothing polls.

Component: `lib/components-shadcn/shell/PwaDebugBar.vue`, mounted once in each
app's `App.vue` with the install state from that app's `boot/pwa.ts`:

```vue
<PwaDebugBar
  :can-install="canInstall"
  :not-installed="notInstalled"
  :ios-hint="iosInstallHint"
/>
```

| Field          | Meaning                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `bip`          | `CAPTURED` when `beforeinstallprompt` fired and was stashed on `window.__bipEvent` (app `index.html`), else `null` |
| `canInstall`   | the native install prompt is available                                                                         |
| `notInstalled` | the app is not installed on this device — drives the persistent "Install app" menu entry                       |
| `iosHint`      | iOS Safari: no native prompt, the "Share → Add to Home Screen" hint is shown instead                           |
| `standalone`   | running as the installed app (`display-mode: standalone`)                                                      |
| `SW`           | service-worker registration: `active`, `waiting`, `installing`, `reg`, `NONE` or `err`                         |
| `ctrl`         | a service worker controls this page (`false` on the very first load, before a reload)                          |

Reading it: `SW:NONE` means the worker never registered, so the browser will never
offer install. `bip:null` with `SW:active` usually means Chrome's engagement
heuristic is not met yet, or the prompt was dismissed recently (~90-day cooldown) —
the "Install app" menu entry still works through `notInstalled`.
