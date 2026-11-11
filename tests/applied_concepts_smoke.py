"""Batch 4 browser checks, using the same optional Playwright tooling."""
from playwright.sync_api import sync_playwright, expect
import json, math, os, shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
NEW={'integration':'Integration & Riemann Sums','vectors':'Vector Addition','regression':'Linear Regression','bayes':"Bayes' Theorem",'logistic':'Logistic Growth'}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def visit(id):page.goto(base+'concept.html?concept='+id)
 def slider(id,value):page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',str(value))
 def snapshot():
  return page.evaluate("""()=>({points:[...document.querySelectorAll('.regression-point .selected-point')].map(el=>[el.getAttribute('cx'),el.getAttribute('cy')]),slope:document.querySelector('#regression-slope').textContent,equation:document.querySelector('#regression-slope').textContent==='Undefined'?null:'fit'})""")
 def numeric(id):return float(page.locator('#'+id).inner_text().replace(',',''))
 page.goto(base);assert page.locator('.card').count()==19
 for id,title in NEW.items():
  page.goto(base);page.locator('#search').fill(title);expect(page.locator('.card')).to_have_count(1)
  page.locator('.card').click();expect(page.locator('h1')).to_have_text(title)
  assert page.locator('.other-nav').count()==0
  assert not page.locator('details.info').evaluate('(el)=>el.open')
 visit('integration')
 assert abs(numeric('integral-exact')-9)<1e-8
 for method,expected in [('left',0),('right',27),('midpoint',6.75)]:
  slider('rectangles',1);page.locator('#method').select_option(method)
  assert abs(numeric('integral-approx')-expected)<1e-7
  slider('rectangles',100);assert page.locator('.riemann-rectangle').count()==100
  assert abs(numeric('integral-error'))<.14
 slider('lower',4);assert float(page.locator('#upper').input_value())>4
 slider('upper',-4);assert float(page.locator('#lower').input_value()) < -4
 assert all(v not in page.locator('.plot').inner_html() for v in ['NaN','Infinity'])
 visit('vectors')
 for key,value in [('a-mag',3),('a-dir',0),('b-mag',4),('b-dir',90)]:slider(key,value)
 expect(page.locator('#vector-r')).to_have_text('(3, 4)');assert numeric('vector-magnitude')==5
 assert abs(float(page.locator('#vector-direction').inner_text().strip('°'))-53.1301)<.0001
 for key,value in [('a-mag',10),('b-mag',10),('b-dir',180)]:slider(key,value)
 expect(page.locator('#vector-direction')).to_have_text('Undefined (zero vector)')
 for key in ['a-mag','b-mag']:slider(key,0)
 assert numeric('vector-magnitude')==0
 # Equal scaling of the SVG coordinate system preserves directions.
 matrix=page.locator('.plot').evaluate('el=>{const m=el.getScreenCTM();return [m.a,m.d]}');assert abs(matrix[0]-matrix[1])<1e-8
 visit('regression')
 original=snapshot();assert len(original['points'])==10
 page.locator('#residuals').check();assert page.locator('.residual').count()==10
 page.locator('.plot').scroll_into_view_if_needed()
 node=page.locator('[data-point="0"] .selected-point');box=node.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(box['x']+35,box['y']-20,steps=5);page.mouse.up()
 moved=snapshot();assert moved['points']!=original['points'];assert moved['slope']!=original['slope']
 page.locator('.plot').scroll_into_view_if_needed()
 # Touch drag on another point while the regression line updates.
 box=page.locator('[data-point="9"] .selected-point').bounding_box()
 client=context.new_cdp_session(page)
 start={'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}
 client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[start]})
 client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':start['x']-35,'y':start['y']+35}]})
 client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 touched=snapshot();assert touched['points']!=moved['points']
 page.locator('#reset-data').click();assert snapshot()['points']==original['points']
 page.locator('#new-sample').click();assert snapshot()['points']!=original['points']
 page.locator('#reset-data').click()
 # Keyboard editing creates constant-y and then zero-x-variance datasets.
 for i in range(10):
  page.evaluate('i=>{for(let n=0;n<100;n++)document.querySelector(`[data-point="${i}"]`).dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true}));}',i)
 expect(page.locator('#regression-r')).to_have_text('Undefined');expect(page.locator('#regression-r2')).to_have_text('Undefined')
 assert numeric('regression-slope')==0
 for i in range(10):
  page.evaluate('i=>{for(let n=0;n<100;n++)document.querySelector(`[data-point="${i}"]`).dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));}',i)
 expect(page.locator('#regression-slope')).to_have_text('Undefined');assert page.locator('.regression-line').count()==0
 assert snapshot()['equation'] is None
 page.locator('#reset-data').click();page.locator('[data-point="0"]').focus();page.keyboard.press('ArrowRight')
 assert snapshot()['points'][0][0]!=original['points'][0][0]
 visit('bayes')
 expect(page.locator('#bayes-posterior')).to_have_text('16.67%')
 slider('prior',50);assert float(page.locator('#bayes-posterior').inner_text().strip('%'))>90
 slider('prior',0);slider('specificity',100)
 expect(page.locator('#bayes-posterior')).to_have_text('Undefined');expect(page.locator('#stat')).to_have_text('Positive result impossible')
 slider('prior',100);slider('sensitivity',0);expect(page.locator('#bayes-posterior')).to_have_text('Undefined')
 slider('sensitivity',100);expect(page.locator('#bayes-posterior')).to_have_text('100.00%')
 visit('logistic')
 assert 990<numeric('population-final')<1000
 slider('logistic-rate',0);expect(page.locator('#population-final')).to_have_text('50')
 slider('population',1000);slider('capacity',100);slider('logistic-rate',.2)
 expect(page.locator('#stat')).to_have_text('Declining toward K');assert 100<numeric('population-final')<101
 slider('capacity',1000);expect(page.locator('#population-final')).to_have_text('1,000')
 for name,value in [('population',1),('capacity',10000),('logistic-rate',1),('logistic-time',100)]:slider(name,value)
 expect(page.locator('#population-final')).to_have_text('10,000')
 # Actual native touch controls on every new slider-based page.
 for id,names in [('integration',['rectangles','lower','upper']),('vectors',['a-mag','a-dir','b-mag','b-dir']),('bayes',['prior','sensitivity','specificity']),('logistic',['population','logistic-rate','capacity','logistic-time'])]:
  visit(id)
  for name in names:
   control=page.locator('#'+name);control.scroll_into_view_if_needed();before=control.input_value();box=control.bounding_box()
   control.locator('..').locator('.range-gesture').tap(position={'x':box['width']*.3,'y':box['height']/2});assert control.input_value()!=before
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for scheme in ['light','dark']:
   page.emulate_media(color_scheme=scheme)
   for id in NEW:
    visit(id);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(id,width,scheme)
    assert 'NaN' not in page.locator('.plot').inner_html()
    if width==390:page.screenshot(path='/tmp/math-'+id+'-'+scheme+'.png',full_page=True)
 assert not errors,errors
 print('PASS: Batch 4 calculations and edge states in browser, mouse/touch regression drag, keyboard editing, residuals and reset, touch sliders,  and four responsive widths in both themes; no JS errors')
 browser.close()
