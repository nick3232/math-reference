"""Equation grouping, clipboard payloads, and mobile wrapping checks."""
from playwright.sync_api import sync_playwright, expect
import os, shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
baseline=os.environ.get('MATH_REFERENCE_BASELINE_URL')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},permissions=['clipboard-read','clipboard-write'])
 context.add_init_script('Math.random = () => 0.25') # Reproduce graph exports across versions.
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);links=page.locator('.card').evaluate_all('(els)=>els.map(el=>el.getAttribute("href"))');assert len(links)==16
 payloads={}
 for link in links:
  page.goto(base+link)
  assert page.locator('a[href*="desmos" i]').count()==0
  assert 'Desmos' not in page.locator('body').inner_text()
  assert page.locator('.other-nav').count()==0
  assert '·' not in ' '.join(page.locator('.equations').all_text_contents())
  ids=page.locator('.equation-block button').evaluate_all('(els)=>els.map(el=>el.id)')
  assert len(ids)==(2 if 'derivatives' in link else 1)
  for id in ids:
   button=page.locator('#'+id)
   assert button.evaluate('el=>!!el.closest(".equation-block").querySelector(".equation")')
   assert button.bounding_box()['height']>=44
   button.click();expect(page.locator('#copy-status')).to_have_text('Copied to clipboard')
   payloads[(link,id)]=page.evaluate('navigator.clipboard.readText()');assert payloads[(link,id)]
  if 'derivatives' in link:
   expect(page.locator('#copy').locator('..').locator('.equation')).to_have_text('f(x) = x²')
   expect(page.locator('#copy-derivative').locator('..').locator('.equation')).to_have_text('f′(x) = 2x')
   assert payloads[(link,'copy')]=='f(x) = x^2'
   assert payloads[(link,'copy-derivative')]=="f'(x) = 2x"
 # Optional exact comparison with an unmodified checkout served separately.
 if baseline:
  for (link,id),text in payloads.items():
   page.goto(baseline+link);page.locator('#'+id).click()
   expect(page.locator('#copy-status')).to_have_text('Copied to clipboard')
   assert page.evaluate('navigator.clipboard.readText()')==text,(link,id)
 # Clipboard denial retains selectable text and status in the equation section.
 page.goto(base+'concept.html?concept=sigmoid')
 page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied')}}})")
 page.locator('#copy').click();expect(page.locator('.equation-row textarea')).to_be_visible()
 assert 'exp' in page.locator('.equation-row textarea').input_value()
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for scheme in ['light','dark']:
   page.emulate_media(color_scheme=scheme)
   for link in links:
    page.goto(base+link)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(link,width,scheme)
    assert page.locator('.equation-row').evaluate('el=>el.scrollWidth<=el.clientWidth'),(link,width,scheme)
    if width==390 and any(key in link for key in ['derivatives','unit-circle','sigmoid']):
     page.screenshot(path='/tmp/equations-'+link.split('=')[-1]+'-'+scheme+'.png',full_page=True)
 assert not errors,errors
 print(f'PASS: all 16 equation sections, {len(payloads)} copy/export actions, separate derivative actions, clipboard fallback, no decorative dots or external calculators, and responsive layouts in both themes'+('; clipboard payloads exactly match baseline' if baseline else ''))
 browser.close()
