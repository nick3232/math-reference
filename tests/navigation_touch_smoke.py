"""Navigation and native touch-scroll regression checks (Chromium emulation)."""
from playwright.sync_api import sync_playwright, expect
import os, shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':700},has_touch=True,is_mobile=True)
 page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(base);links=page.locator('.card').evaluate_all('(els)=>els.map(el=>el.getAttribute("href"))');assert len(links)==20
 for link in links:
  page.goto(base+link)
  assert page.locator('.other-nav').count()==0
  assert 'Keep exploring' not in page.locator('main').inner_text()
  assert not page.locator('details.info').evaluate('(el)=>el.open')
  page.locator('details.info > summary').click();expect(page.locator('.info-content')).to_be_visible()
  related=page.locator('.info-content a').evaluate_all('(els)=>els.map(el=>el.getAttribute("href"))')
  for href in related:
   page.goto(base+href);assert page.locator('h1').inner_text()!='Concept not found'
  page.locator('.back').click();expect(page.locator('.card')).to_have_count(20)
 client=context.new_cdp_session(page)
 def swipe(start,end):
  client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[start]})
  for i in range(1,13):
   point={key:start[key]+(end[key]-start[key])*i/12 for key in ['x','y']}
   client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[point]})
   page.wait_for_timeout(16) # Pace a real browser gesture, rather than teleporting the pointer.
  client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 def coords(x,y):
  return page.locator('.plot').evaluate('(el,p)=>{const q=new DOMPoint(p[0],p[1]).matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y}}',[x,y])
 for concept in ['unit-circle','graph','regression']:
  # Start gestures in an empty interior region and both side margins.
  for side in ['interior','left','right']:
   page.goto(base+'concept.html?concept='+concept)
   box=page.locator('.plot').bounding_box()
   x=box['x']+(box['width']*.18 if side=='interior' else 5 if side=='left' else box['width']-5)
   y=box['y']+box['height']*.8
   start={'x':x,'y':y};swipe(start,{'x':x,'y':y-110})
   page.wait_for_function('scrollY>30')
   assert page.evaluate('scrollY')>30,(concept,side)
 page.goto(base+'concept.html?concept=unit-circle')
 expect(page.locator('#angle')).to_have_value('45')
 # Touch-drag the handle from 45° to 90°; it must not scroll the document.
 from math import sqrt
 start=coords(200+122/sqrt(2),170-122/sqrt(2));end=coords(200,48)
 before=page.evaluate('scrollY');swipe(start,end)
 expect(page.locator('#angle')).to_have_value('90');assert page.evaluate('scrollY')==before
 # Mouse dragging and the native angle slider still work.
 start=coords(200,48);end=coords(78,170)
 page.mouse.move(**start);page.mouse.down();page.mouse.move(**end,steps=6);page.mouse.up()
 expect(page.locator('#angle')).to_have_value('180')
 control=page.locator('#angle');control.scroll_into_view_if_needed();box=control.bounding_box();control.locator('..').locator('.range-gesture').tap(position={'x':box['width']*.75,'y':20});assert control.input_value()!='180'
 # Other draggable plots keep their touch interactions.
 for concept,selector,attribute in [('graph','[data-id="1"]','transform'),('regression','[data-point="0"] .selected-point','cx')]:
  page.goto(base+'concept.html?concept='+concept)
  node=page.locator(selector);before=node.get_attribute(attribute);box=node.bounding_box()
  start={'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}
  end={'x':start['x']-25 if concept=='graph' else start['x']+25,'y':start['y']-20}
  swipe(start,end)
  final=page.locator(selector).bounding_box()
  assert abs(final['x']+final['width']/2-end['x'])<2
  assert abs(final['y']+final['height']/2-end['y'])<2
  assert page.locator(selector).get_attribute(attribute)!=before
 assert not errors,errors
 print('PASS: all 20 pages omit bottom directory; All concepts and related links work; native touch scrolling from empty plot interiors/margins; unit-circle mouse/touch drag and slider; network/regression touch drag. Chromium emulation, not physical-device testing.')
 browser.close()
