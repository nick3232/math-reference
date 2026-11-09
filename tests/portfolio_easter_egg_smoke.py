"""Native alert, pre-reset state preservation, and exact trigger checks."""
from playwright.sync_api import sync_playwright, expect
import os, shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
trigger={'portfolio-start':'100000','portfolio-return':'12','portfolio-withdrawal':'0','portfolio-years':'50'}
defaults={'portfolio-start':'500000','portfolio-return':'6','portfolio-withdrawal':'3000','portfolio-years':'30'}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for mobile in [False,True]:
  context=browser.new_context(viewport={'width':390 if mobile else 1280,'height':844},has_touch=mobile,is_mobile=mobile)
  page=context.new_page();page.goto(base+'concept.html?concept=portfolio');dialogs=[]
  # Record DOM state immediately before calling the real native alert. The
  # native alert blocks page JavaScript until OK; DOM evaluation while it is
  # open would itself block, so report the state through the console first.
  import json
  states=[]
  page.on('console',lambda message:states.append(json.loads(message.text[12:])) if message.text.startswith('ALERT_STATE:') else None)
  page.evaluate("""() => {
    const nativeAlert=window.alert;
    window.alert=message=>{
      console.debug('ALERT_STATE:'+JSON.stringify(Object.fromEntries([...document.querySelectorAll('input[type=range]')].map(el=>[el.id,el.value]))));
      nativeAlert(message);
    };
  }""")
  original_graph=page.locator('.plot').inner_html()
  def set_values(values):
   for id,value in values.items():page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',value)
  def accept(dialog):
   assert dialog.type=='alert';assert dialog.message=='Made with Link - November, 8 2026'
   assert states[-1]==trigger,states
   dialogs.append(dialog.message);dialog.accept()
  page.on('dialog',accept)
  set_values(trigger)
  if mobile:page.locator('#portfolio-reset').tap()
  else:page.locator('#portfolio-reset').click()
  assert len(dialogs)==1
  for id,value in defaults.items():expect(page.locator('#'+id)).to_have_value(value)
  assert page.locator('.plot').inner_html()==original_graph
  # Each individual mismatch must prevent the alert and still perform a reset.
  for id,value in {'portfolio-start':'125000','portfolio-return':'11.5','portfolio-withdrawal':'250','portfolio-years':'49'}.items():
   values=dict(trigger);values[id]=value;set_values(values)
   page.locator('#portfolio-reset').click();assert len(dialogs)==1
   for key,default in defaults.items():expect(page.locator('#'+key)).to_have_value(default)
  page.locator('#portfolio-reset').click();assert len(dialogs)==1
  context.close()
 print('PASS: exact native alert on mouse/touch reset, triggering values retained while alert is open, OK restores defaults and graph, each near-match and ordinary reset show no dialog')
 browser.close()
