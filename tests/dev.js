// The hidden developer menu.
module.exports = async function devTests({ ok, boot, btn, click, sleep }) {
  console.log('Developer menu');
  const setVal = async (p, el, v) => { const proto = Object.getOwnPropertyDescriptor(p.w.HTMLInputElement.prototype, 'value'); proto.set.call(el, v); el.dispatchEvent(new p.w.Event('input', { bubbles: true })); await sleep(20); };
  const submit = async (p) => { const f = p.d.querySelector('form'); f.dispatchEvent(new p.w.Event('submit', { bubbles: true, cancelable: true })); await sleep(60); };
  const P = await boot({ idb: false });
  const tag = [...P.d.querySelectorAll('.hero .tag')][0];
  const pwBox = () => P.d.querySelector('input[aria-label="Password"]');
  for (let i = 0; i < 3; i++) await click(P.w, tag);
  ok(!pwBox() && !/Developer/.test(P.d.body.textContent), 'the menu stays hidden after a few taps');
  for (let i = 0; i < 4; i++) await click(P.w, tag);
  ok(!!pwBox(), 'tapping the "$20 AUCTION" tag 7 times asks for the developer password');
  await setVal(P, pwBox(), 'wrong'); await submit(P);
  ok(/Wrong password/.test(P.d.body.textContent) && !P.d.querySelector('.devscreen'), 'a wrong password is refused');
  await setVal(P, pwBox(), 'draftdev'); await submit(P);
  ok(!!P.d.querySelector('.devscreen'), 'the right password opens the developer menu');
  // Simulation lab.
  const sel = P.d.querySelector('#dev-topic');
  const opts = [...sel.options].map((o) => o.textContent);
  ok(opts.length >= 20 && opts.some((o) => /Basketball/.test(o)) && opts.some((o) => /Royal Rumble/.test(o)) && opts.some((o) => /football/.test(o)), 'the simulation lab lists every topic with a simulation (' + opts.length + ')');
  let allOK = true; const failed = [];
  for (const o of [...sel.options]) {
    sel.value = o.value; sel.dispatchEvent(new P.w.Event('change', { bubbles: true })); await sleep(20);
    await click(P.w, btn(P.d, 'New random game')); await sleep(60);
    if (!P.d.querySelector('.devscreen .matchview') || /crashed/.test(P.d.body.textContent)) { allOK = false; failed.push(o.textContent); }
  }
  ok(allOK, 'every simulation plays straight away from the lab with random teams' + (failed.length ? ' (failed: ' + failed.join(', ') + ')' : ''));
  await click(P.w, btn(P.d, 'Stars v stars')); await click(P.w, btn(P.d, '▶ Watch'));
  ok(!!P.d.querySelector('.devscreen .matchview') && /Stars/.test(P.d.body.textContent), 'star teams can be watched too');
  // Speed dial.
  await click(P.w, btn(P.d, '4×'));
  ok(P.w.localStorage.getItem('dn_dev_speed') === '4', 'the speed dial is saved on this device');
  await click(P.w, [...P.d.querySelectorAll('.devscreen button')].find((b) => b.textContent.trim() === '1×'));
  ok(P.w.localStorage.getItem('dn_dev_speed') == null, 'back to normal speed clears it');
  P.w.close();
  // Skip the auction for a draft in progress.
  const DN = P.DN; const t = DN.starterTopics().find((x) => x.id === 't-nba');
  const ms = [0, 1, 2].map((i) => ({ id: 'm' + i, name: ['Lions', 'Sharks', 'Owls'][i], color: DN.COLORS[i], emoji: 'x', human: true }));
  const dd = DN.createDraft(t, ms, { ...DN.DEFAULT_RULES, slots: t.slots, finale: { mode: 'sim', speed: 'normal' } }, { seed: 'devfill' });
  const X = await boot({ idb: false, storage: { dn_current_v1: JSON.stringify({ ...dd, mode: 'local' }) } });
  X.w.sessionStorage.setItem('dn_dev_on', '1');
  const tag2 = X.d.querySelector('.hero .tag'); for (let i = 0; i < 7; i++) await click(X.w, tag2);
  ok(!!X.d.querySelector('.devscreen'), 'once unlocked, the menu opens without asking again (until locked)');
  await click(X.w, btn(X.d, 'Auto-fill teams')); await click(X.w, btn(X.d, 'Fill and finish')); await sleep(120);
  await sleep(700); const cur = JSON.parse(X.w.localStorage.getItem('dn_current_v1') || 'null');
  ok(cur && cur.phase === 'done' && cur.managers.every((m) => m.team.every(Boolean) && m.budget >= 0) && /Start the finale/.test(X.d.body.textContent), 'skip the auction fills every team within budget and jumps to the results');
  await click(X.w, btn(X.d, 'Start the finale')); await sleep(80);
  ok(!!btn(X.d, 'Tip off') || /simulation/i.test(X.d.body.textContent), 'and the finale is ready to watch');
  X.w.close();
};
