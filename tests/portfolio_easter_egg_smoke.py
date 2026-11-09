"""Accessible modal, deferred reset, and exact commemorative trigger checks."""
from playwright.sync_api import sync_playwright, expect
import os, shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
message='Made with Link - November, 8 2026'
trigger={'portfolio-start':'100000','portfolio-return':'12','portfolio-withdrawal':'0','portfolio-years':'50'}
defaults={'portfolio-start':'500000','portfolio-return':'6','portfolio-withdrawal':'3000','portfolio-years':'30'}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for mobile in [False,True]:
  context=browser.new_context(viewport={'width':390 if mobile else 1280,'height':844},has_touch=mobile,is_mobile=mobile,color_scheme='dark')
  page=context.new_page();native_dialogs=[];errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:(native_dialogs.append(d.message),d.dismiss()))
  page.goto(base+'concept.html?concept=portfolio')
  original_graph=page.locator('.plot').inner_html()
  def set_values(values):
   for id,value in values.items():page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',value)
  def check_defaults():
   for id,value in defaults.items():expect(page.locator('#'+id)).to_have_value(value)
   assert page.locator('.plot').inner_html()==original_graph
   expect(page.locator('#portfolio-reset')).to_be_focused()
  # Exercise OK by tap/mouse and keyboard, Escape, and programmatic close.
  for dismissal in ['ok','keyboard','escape','close']:
   set_values(trigger);graph=page.locator('.plot').inner_html()
   if mobile:page.locator('#portfolio-reset').tap()
   else:page.locator('#portfolio-reset').click()
   dialog=page.get_by_role('dialog',name=message,exact=True)
   expect(dialog).to_be_visible();assert dialog.evaluate('el=>el.matches(":modal")')
   assert dialog.locator('p').inner_text()==message
   assert [line for line in dialog.inner_text().splitlines() if line.strip()]==[message,'OK']
   assert dialog.locator('button').count()==1
   assert dialog.locator('h1,h2,h3,a,input').count()==0
   expect(dialog.get_by_role('button',name='OK',exact=True)).to_be_focused()
   expect(dialog).to_have_css('background-color','rgb(24, 37, 47)')
   # Values and visualization remain unchanged while the dialog is open.
   for id,value in trigger.items():expect(page.locator('#'+id)).to_have_value(value)
   assert page.locator('.plot').inner_html()==graph
   page.keyboard.press('Tab')
   assert page.evaluate('document.activeElement===document.body || !!document.activeElement.closest("dialog")')
   page.keyboard.press('Shift+Tab');expect(dialog.get_by_role('button',name='OK')).to_be_focused()
   page.screenshot(path='/tmp/portfolio-dialog-'+('mobile' if mobile else 'desktop')+'.png')
   if dismissal=='ok':
    if mobile:dialog.get_by_role('button',name='OK').tap()
    else:dialog.get_by_role('button',name='OK').click()
   elif dismissal=='keyboard':page.keyboard.press('Enter')
   elif dismissal=='escape':page.keyboard.press('Escape')
   else:dialog.evaluate('el=>el.close()')
   expect(page.locator('dialog')).to_have_count(0);check_defaults()
  # Each single near-match skips the dialog and resets immediately.
  for id,value in {'portfolio-start':'125000','portfolio-return':'11.5','portfolio-withdrawal':'250','portfolio-years':'49'}.items():
   values=dict(trigger);values[id]=value;set_values(values)
   page.locator('#portfolio-reset').click();expect(page.locator('dialog')).to_have_count(0);check_defaults()
  page.locator('#portfolio-reset').click();check_defaults()
  # Compact layout even on a narrow phone, plus theme consistency.
  page.set_viewport_size({'width':320,'height':600})
  page.emulate_media(color_scheme='light')
  page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
  original_graph=page.locator('.plot').inner_html()
  set_values(trigger);page.locator('#portfolio-reset').click()
  dialog=page.get_by_role('dialog',name=message);expect(dialog).to_be_visible()
  expect(dialog).to_have_css('background-color','rgb(255, 255, 255)')
  box=dialog.bounding_box();assert box['x']>=0 and box['x']+box['width']<=320
  dialog.get_by_role('button',name='OK').click();check_defaults()
  assert not native_dialogs,native_dialogs
  assert not errors,errors
  context.close()
 print('PASS: exact accessible HTML dialog on desktop/touch; sole OK action; values and graph retained until dismissal; OK, Enter, Escape and close reset/focus correctly; near-matches skip dialog; narrow light/dark layouts; no browser alerts')
 browser.close()
