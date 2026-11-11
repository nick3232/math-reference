"""Equation preservation and copy-control removal, including optional baseline."""
from playwright.sync_api import sync_playwright
import os, shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
baseline=os.environ.get('MATH_REFERENCE_BASELINE_URL')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);links=page.locator('.card').evaluate_all('(els)=>els.map(el=>el.getAttribute("href"))');assert len(links)==20
 equations={}
 for link in links:
  page.goto(base+link)
  assert page.locator('.equation-row button, #copy, #copy-derivative, #copy-status, textarea').count()==0
  assert page.get_by_role('button',name='Copy',exact=False).count()==0
  assert page.locator('a[href*="desmos" i], .other-nav').count()==0
  expressions=page.locator('.equation').all_text_contents();assert expressions
  equations[link]=expressions
  assert not any('·' in expression for expression in expressions)
 if baseline:
  for link,expressions in equations.items():
   page.goto(baseline+link);assert page.locator('.equation').all_text_contents()==expressions,link
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme)
   for link in links:
    page.goto(base+link)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(link,width,theme)
    assert page.locator('.equation-row').evaluate('el=>el.scrollWidth<=el.clientWidth')
 assert not errors,errors
 print('PASS: all 20 pages retain equations without copy controls, bottom directory, or external calculators; responsive in both themes'+('; expressions exactly match baseline' if baseline else ''))
 browser.close()
