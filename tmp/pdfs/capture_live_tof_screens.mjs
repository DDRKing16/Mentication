import fs from 'node:fs/promises';

const out = '/Users/dylandesai-rogers/Documents/Mentication App Build (Code)/output/live-thought-or-fact-screens';
await fs.mkdir(out, { recursive: true });
const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const page = targets.find((target) => target.type === 'page' && target.url.includes('127.0.0.1:5175'));
if (!page) throw new Error('No running app page available for capture.');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  ws.send(JSON.stringify({ id: requestId, method, params }));
  const listener = (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== requestId) return;
    ws.removeEventListener('message', listener);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  };
  ws.addEventListener('message', listener);
});
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pageHas = async (text) => {
  const result = await call('Runtime.evaluate', {
    expression: `document.body.innerText.includes(${JSON.stringify(text)})`,
    returnByValue: true,
  });
  return result.result?.value === true;
};
const waitFor = async (text) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await pageHas(text)) return;
    await pause(120);
  }
  throw new Error(`Timed out waiting for: ${text}`);
};
const shot = async (name) => {
  await call('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await pause(160);
  const result = await call('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(`${out}/${name}.png`, Buffer.from(result.data, 'base64'));
};
const click = async (label) => {
  const expression = `(() => {
    const controls = [...document.querySelectorAll('button,a')];
    const item = controls.find((element) => element.innerText.trim() === ${JSON.stringify(label)})
      || controls.find((element) => element.innerText.includes(${JSON.stringify(label)}));
    if (!item) return false;
    item.click();
    return true;
  })()`;
  const result = await call('Runtime.evaluate', { expression, returnByValue: true });
  if (result.result?.value !== true) throw new Error(`Missing control: ${label}`);
  await pause(650);
};
await call('Page.navigate', { url: 'http://127.0.0.1:5175/' });
await pause(650);
await call('Runtime.evaluate', { expression: 'localStorage.clear(); location.reload()' });
await pause(700);
await shot('01-home');
await click('Library');
await waitFor('Thought or Fact?');
await click('Thought or Fact?');
await waitFor('A QUIET EXAMINATION');
await shot('02-readiness');
await click('Begin');
await waitFor('What thought are you putting on trial?');
await shot('03-thought-capture');
await call('Runtime.evaluate', { expression: 'document.querySelector("textarea").focus()' });
await call('Input.insertText', { text: 'Nobody likes me. Everyone thinks I am a failure.' });
await pause(180);
await click('Open case');
await waitFor('Put the exact claim on record.');
await shot('04-claim-confirmation');
await click('Use this claim');
await waitFor('Which shortcuts might be shaping the claim?');
await shot('05-thinking-patterns');
await click('Confirm charge');
await waitFor('See what this thought is made of');
await shot('06-statement-category');
await click('Interpretation');
await waitFor('What makes this thought seem true?');
await shot('07-evidence-for');
await click('Next');
await waitFor('What evidence points another way?');
await shot('08-evidence-against');
await click('Next');
await waitFor('What else could this mean?');
await shot('09-other-explanations');
await click('Next');
await waitFor('What can you not know yet?');
await shot('10-what-remains-open');
await click('Review the evidence');
await waitFor('A truer thought, in your own words.');
await shot('11-balanced-thought');
await click('Continue');
await waitFor('Choose what helps now');
await shot('12-next-step');
ws.close();
console.log(out);
