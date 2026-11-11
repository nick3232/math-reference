"""Native-page scrolling versus deliberate range gestures (Chromium emulation)."""
from playwright.sync_api import sync_playwright
import os, shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
baseline=os.environ.get('MATH_REFERENCE_BASELINE_URL')
CASES=[('interest','principal'),('interest','rate'),('derivatives','point'),('trigonometric','amplitude'),('trigonometric','frequency'),('trigonometric','phase'),('unit-circle','angle'),('portfolio','portfolio-start'),('portfolio','portfolio-return'),('portfolio','portfolio-withdrawal'),('portfolio','portfolio-years'),('transformations','transform-h'),('transformations','transform-k'),('transformations','transform-a'),('transformations','transform-b')]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':650},has_touch=True,is_mobile=True)
 context.add_init_script('Math.random=()=>.25')
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 client=context.new_cdp_session(page)
 def start(point):client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[point]})
 def move(point):client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[point]})
 def end():client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 def position(control,fraction):
  return control.evaluate('(el,f)=>{const r=el.getBoundingClientRect();return {x:r.left+r.width*f,y:r.top+r.height/2}}',fraction)
 def prepare(concept,name):
  page.goto(base+'concept.html?concept='+concept)
  control=page.locator('#'+name)
  control.evaluate('el=>window.scrollTo(0,scrollY+el.getBoundingClientRect().top-230)')
  return control
 for concept,name in CASES:
  control=prepare(concept,name);value=control.input_value();before_scroll=page.evaluate('scrollY')
  assert before_scroll>50
  page.evaluate("window.changes=[];document.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',()=>changes.push(el.value)))")
  point=position(control,.25);start(point);assert control.input_value()==value
  for i in range(1,13):
   move({'x':point['x']+i*.15,'y':point['y']+i*8});page.wait_for_timeout(16)
  end();page.wait_for_function('(before)=>scrollY<before-25',arg=before_scroll)
  assert control.input_value()==value,(concept,name,'vertical swipe changed value')
  assert page.evaluate('changes')==[],(concept,name,'transient changes during vertical gesture')
  # Horizontal movement commits after the threshold and emits continuous updates.
  control=prepare(concept,name);point=position(control,.2);before_scroll=page.evaluate('scrollY');value=control.input_value()
  page.evaluate("window.changes=[];document.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',()=>changes.push(el.value)))")
  graph_before=page.locator('.plot').get_attribute('aria-label')
  start(point);assert control.input_value()==value
  move({'x':point['x']+2,'y':point['y']+1});assert control.input_value()==value
  target=position(control,.8)
  for i in range(1,13):
   move({'x':point['x']+(target['x']-point['x'])*i/12,'y':point['y']});page.wait_for_timeout(16)
  end()
  assert control.input_value()!=value
  assert page.locator('.plot').get_attribute('aria-label')!=graph_before
  assert len(page.evaluate('changes'))>=5,(concept,name,'not continuously updating')
  assert page.evaluate('scrollY')==before_scroll
  attrs=control.evaluate('el=>({value:+el.value,min:+el.min,max:+el.max,step:+el.step})')
  assert attrs['min']<=attrs['value']<=attrs['max']
  assert abs((attrs['value']-attrs['min'])/attrs['step']-round((attrs['value']-attrs['min'])/attrs['step']))<1e-7
  # Taps deliberately change the value, and keyboard input still reaches the native range.
  point=position(control,.35);value=control.input_value();start(point);assert control.input_value()==value;end();assert control.input_value()!=value
  control.focus();value=control.input_value();page.keyboard.press('ArrowRight');assert control.input_value()!=value
  assert control.get_attribute('type')=='range'
  assert page.locator('label[for="'+name+'"]').count()==1
 # Native fine-pointer desktop interaction is untouched.
 desktop=browser.new_context(viewport={'width':1280,'height':900});desk=desktop.new_page()
 for concept,name in CASES:
  desk.goto(base+'concept.html?concept='+concept);control=desk.locator('#'+name);control.scroll_into_view_if_needed()
  assert control.locator('..').locator('.range-gesture').evaluate('el=>getComputedStyle(el).display')=='none'
  value=control.input_value();control.click(position={'x':control.bounding_box()['width']*.85,'y':20});assert control.input_value()!=value
  control.focus();value=control.input_value();desk.keyboard.press('ArrowLeft');assert control.input_value()!=value
 # A mouse on a touch-capable device can also use the shared hit layer.
 hybrid=browser.new_context(viewport={'width':1280,'height':900},has_touch=True)
 hybrid_page=hybrid.new_page();hybrid_page.goto(base+'concept.html?concept=derivatives')
 hybrid_control=hybrid_page.locator('#point');value=hybrid_control.input_value()
 hybrid_control.locator('..').locator('.range-gesture').click(position={'x':hybrid_control.bounding_box()['width']*.85,'y':20})
 assert hybrid_control.input_value()!=value
 # Compare every range's constraints and default visualization with the previous version.
 if baseline:
  page.goto(base);links=page.locator('.card').evaluate_all('(els)=>els.map(el=>el.getAttribute("href"))')
  for link in links:
   page.goto(base+link);current=page.locator('input[type=range]').evaluate_all('(els)=>els.map(el=>[el.id,el.min,el.max,el.step,el.value])');svg=page.locator('.plot').inner_html()
   page.goto(baseline+link);assert current==page.locator('input[type=range]').evaluate_all('(els)=>els.map(el=>[el.id,el.min,el.max,el.step,el.value])'),link
   assert svg==page.locator('.plot').inner_html(),(link,'visualization changed')
 assert not errors,errors
 print('PASS: vertical swipes scroll with no transient value changes; horizontal drags update continuously; taps, step/bounds, native keyboard and desktop mouse work'+('; all 16 default graphs and range constraints exactly match baseline' if baseline else '')+'. Chromium emulation, not physical-device testing.')
 browser.close()
