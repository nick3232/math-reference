"""Batch 3 browser checks; run against the local static server."""
from playwright.sync_api import sync_playwright, expect
import math, os, shutil, re

CONCEPTS = {
 'trigonometric':'Trigonometric Functions', 'exponential':'Exponential Growth & Decay',
 'logarithmic':'Logarithmic Functions', 'binomial':'Binomial Distribution', 'unit-circle':'Unit Circle'
}
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def visit(concept):page.goto(base+'concept.html?concept='+concept)
 def set_slider(name,value):page.locator('#'+name).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',str(value))
 page.goto(base)
 titles=page.locator('.card h3').all_text_contents();assert len(titles)==16
 # Search and real navigation for all eleven, plus working related links.
 for title in titles:
  page.goto(base);page.locator('#search').fill(title);expect(page.locator('.card')).to_have_count(1)
  page.locator('.card').click();expect(page.locator('h1')).to_have_text(title)
  assert page.locator('.other-nav').count()==0
  assert not page.locator('details').evaluate('(el)=>el.open')
  page.locator('summary').click()
  links=[el.get_attribute('href') for el in page.locator('.info-content a').all()]
  for link in links:
   page.goto(base+link);assert page.locator('h1').inner_text() in titles
 visit('trigonometric')
 for name,value in [('amplitude',3),('frequency',2),('phase',.5)]:
  before=page.locator('.sine-curve').get_attribute('d');set_slider(name,value)
  assert before!=page.locator('.sine-curve').get_attribute('d')
 points=re.findall(r'[ML]([-+0-9.e]+),([-+0-9.e]+)',page.locator('.sine-curve').get_attribute('d'))
 assert abs(float(points[320][1])-(290+24)/2+3/7.2*266)<1e-7
 assert 'π' in page.locator('.plot').text_content()
 for checkbox,curve in [('show-sine','sine-curve'),('show-cosine','cosine-curve')]:
  page.locator('#'+checkbox).uncheck();assert page.locator('.'+curve).count()==0
  page.locator('#'+checkbox).check();assert page.locator('.'+curve).count()==1
 visit('exponential')
 for k,expected,mode in [(0,'10','Constant'),(-1,'0.0005','Decay'),(1,'220,264.6579','Growth')]:
  set_slider('growth',k)
  expect(page.locator('#stat')).to_have_text(mode)
  if k==0:expect(page.locator('#growth-final')).to_have_text(expected)
  if k<0:assert 'half-life' in page.locator('#growth-time').inner_text()
  if k>0:assert 'doubling' in page.locator('#growth-time').inner_text()
 set_slider('initial',100);set_slider('horizon',20)
 expect(page.locator('#growth-final')).to_have_text('4.85e+10')
 visit('logarithmic')
 assert page.locator('#base option').count()==3
 for value in ['2','e','10']:
  page.locator('#base').select_option(value)
  assert 'x > 0' in page.locator('#stat').inner_text()
  assert '(1, 0)' in page.locator('.plot').text_content()
  assert not re.search('NaN|Infinity',page.locator('.curve').get_attribute('d'))
  points=re.findall(r'[ML]([-+0-9.e]+),([-+0-9.e]+)',page.locator('.curve').get_attribute('d'))
  assert all(float(x)>62 for x,y in points)
 set_slider('domain',20)
 visit('binomial')
 expect(page.locator('#outcome-probability')).to_have_text('24.6094%')
 expect(page.locator('#expected-value')).to_have_text('5')
 set_slider('trials',50);set_slider('outcome',50)
 assert page.locator('.probability-bar').count()==51
 for probability,k,expected in [(0,0,'100.0000%'),(0,50,'0.0000%'),(1,50,'100.0000%'),(1,0,'0.0000%')]:
  set_slider('success',probability);set_slider('outcome',k)
  expect(page.locator('#outcome-probability')).to_have_text(expected)
  expect(page.locator('#binomial-sd')).to_have_text('0')
 set_slider('outcome',50);set_slider('trials',1)
 assert page.locator('#outcome').get_attribute('max')=='1';assert page.locator('#outcome').input_value()=='1'
 assert page.locator('.probability-bar.chosen').count()==1
 visit('unit-circle')
 for a,x,y in [(0,'1','0'),(90,'0','1'),(180,'-1','0'),(270,'0','-1'),(360,'1','0')]:
  set_slider('angle',a);expect(page.locator('#circle-cos')).to_have_text(x);expect(page.locator('#circle-sin')).to_have_text(y)
 # Native pointer dragging uses the same coordinate conversion on desktop and touch.
 set_slider('angle',0)
 page.locator('.plot').scroll_into_view_if_needed()
 coords=page.locator('.plot').evaluate('el=>{const m=el.getScreenCTM();return [[322,170],[200,48]].map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(m);return {x:p.x,y:p.y}})}')
 page.mouse.move(**coords[0]);page.mouse.down();page.mouse.move(**coords[1],steps=5);page.mouse.up()
 expect(page.locator('#angle')).to_have_value('90')
 # Real touch drag, retaining pointer capture while SVG children update.
 page.locator('.plot').scroll_into_view_if_needed()
 coords=page.locator('.plot').evaluate('el=>{const m=el.getScreenCTM();return [[200,48],[78,170]].map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(m);return {x:p.x,y:p.y}})}')
 client=context.new_cdp_session(page)
 client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[coords[0]]})
 client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[coords[1]]})
 client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 expect(page.locator('#angle')).to_have_value('180')
 # Touch-native sliders and base selection on all five pages.
 for concept,ids in [('trigonometric',['amplitude','frequency','phase']),('exponential',['initial','growth','horizon']),('logarithmic',['domain']),('binomial',['trials','success','outcome']),('unit-circle',['angle'])]:
  visit(concept)
  for name in ids:
   control=page.locator('#'+name);control.scroll_into_view_if_needed();before=control.input_value();box=control.bounding_box()
   control.locator('..').locator('.range-gesture').tap(position={'x':box['width']*.8,'y':box['height']/2});assert before!=control.input_value()
 # Layout and actual circle aspect ratio at phone, tablet, and desktop sizes.
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for scheme in ['light','dark']:
   page.emulate_media(color_scheme=scheme)
   for concept in CONCEPTS:
    visit(concept)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(concept,width,scheme)
    if concept=='unit-circle':
     box=page.locator('.unit-outline').bounding_box();assert abs(box['width']-box['height'])<.01
    if width==390:page.screenshot(path='/tmp/math-'+concept+'-'+scheme+'.png',full_page=True)
 assert not errors,errors
 print('PASS: sixteen-concept search/navigation; all five new interactions and  mathematical boundaries; touch sliders and circle drag; circle aspect ratio and light/dark layouts at 320/390/768/1280px; no JS errors')
 browser.close()
