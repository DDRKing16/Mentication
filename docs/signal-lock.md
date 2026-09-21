# Signal Lock integration

Signal Lock is mounted at the protected `/signal-lock` route and is discoverable
from the Intervention Library's **Focus session** section.

The supplied application is a compiled, standalone React build with tightly
coupled scenes, motion, procedural Web Audio, focus task data, reward content,
and timer behavior. To preserve its visual and behavioral parity, Mentication
ships that source artifact unchanged in `public/signal-lock/index.html`, along
with every supplied scene asset in `public/signal-lock/assets/images/`. The
route embeds the local artifact in a full-screen iframe; it makes no network
requests and has no hosted backend or analytics dependency.

Vite copies these public assets to `dist/signal-lock/`, and `npm run ios:sync`
copies the resulting web build into the maintained Capacitor iOS project.

