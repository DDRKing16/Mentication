import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('routes the Home support action to the registered support page', () => {
  const home = readFileSync('src/pages/Home.jsx', 'utf8');
  const app = readFileSync('src/App.jsx', 'utf8');
  expect(home).toContain('if (route === "support") { navigate("/support"); return; }');
  expect(app).toContain('<Route path="/support" element={<Crisis />}');
  expect(readFileSync('src/components/home/HomeFrame.jsx', 'utf8')).toContain("openFallback('support')");
});
