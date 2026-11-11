from playwright.sync_api import sync_playwright, expect
import json, os, shutil
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844})
 page=context.new_page(); errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 base=os.environ.get('MATH_REFERENCE_URL', 'http://localhost:8000/')
 page.goto(base); assert page.locator('.card').count()==19
 page.locator('#search').fill('normal');assert page.locator('.card').count()==1
 page.get_by_role('button',name='Functions',exact=True).click();assert page.locator('.card').count()==0
 page.locator('#search').fill('');assert page.locator('.card').count()==9
 page.goto(base+'concept.html?concept=sigmoid')
 for name,value in [('steepness','-2'),('midpoint','3')]:
  before=page.locator('.curve').get_attribute('d');page.locator('#'+name).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',value);assert before!=page.locator('.curve').get_attribute('d')
 assert not page.locator('details.info').evaluate('(el)=>el.open')
 page.screenshot(path='/tmp/math-sigmoid-mobile.png',full_page=True)
 page.goto(base+'concept.html?concept=normal')
 for name,value in [('mean','4'),('deviation','.3')]:
  before=page.locator('.curve').get_attribute('d');page.locator('#'+name).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',value);assert before!=page.locator('.curve').get_attribute('d')
 assert page.locator('.area').count()==1;assert '68.27%' in page.locator('#stat').inner_text()
 page.goto(base+'concept.html?concept=graph')
 assert page.locator('.vertex').count()==6
 page.get_by_role('button',name='Add vertex',exact=True).click();assert page.locator('.vertex').count()==7
 page.locator('#source').select_option('1');page.locator('#target').select_option('7');page.get_by_role('button',name='Add edge',exact=True).click();assert page.locator('[data-edge="1-7"]').count()==1
 page.get_by_role('button',name='Add edge',exact=True).click();assert 'already exists' in page.locator('#network-status').inner_text()
 page.locator('#target').select_option('1');page.get_by_role('button',name='Add edge',exact=True).click();assert 'different' in page.locator('#network-status').inner_text()
 node=page.locator('[data-id="7"]');before=node.get_attribute('transform');box=node.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(180,300);page.mouse.up();assert before!=page.locator('[data-id="7"]').get_attribute('transform')
 page.get_by_role('button',name='Remove selected').click();assert page.locator('.vertex').count()==6;assert page.locator('[data-edge="1-7"]').count()==0
 # Keyboard editing and explicit edge removal.
 node=page.locator('[data-id="1"]');node.focus();before=node.get_attribute('transform');page.keyboard.press('ArrowLeft');assert before!=page.locator('[data-id="1"]').get_attribute('transform')
 page.locator('#source').select_option('1');page.locator('#target').select_option('2');page.get_by_role('button',name='Add edge',exact=True).click()
 page.locator('[data-edge="1-2"]').focus();page.keyboard.press('Enter');page.get_by_role('button',name='Remove selected').click();assert page.locator('[data-edge="1-2"]').count()==0
 page.get_by_role('button',name='Randomize network').click();assert page.locator('.vertex').count()==6
 # All new concepts are searchable, reachable, and omit the removed bottom directory.
 for title, concept in [('Compound Interest','interest'),('Derivatives','derivatives'),('Probability & Coin Flips','coins')]:
  page.goto(base);page.locator('#search').fill(title);assert page.locator('.card').count()==1
  page.locator('.card').click();assert page.url.endswith('concept='+concept)
  assert page.locator('.other-nav').count()==0
  expect(page.locator('.plot > .axis')).to_have_css('fill','none')
  assert not page.locator('details.info').evaluate('(el)=>el.open')
  page.locator('details.info > summary').click()
  for link in page.locator('.info-content a').all():
   assert page.request.get(base+link.get_attribute('href')).ok
 def set_slider(name,value):
  page.locator('#'+name).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',str(value))
 page.goto(base+'concept.html?concept=interest')
 expect(page.locator('#final-value')).to_have_text('$2,653.30')
 before=page.locator('.curve').get_attribute('d');set_slider('rate',0)
 assert before!=page.locator('.curve').get_attribute('d')
 expect(page.locator('#interest-earned')).to_have_text('$0.00')
 expect(page.locator('#final-value')).to_have_text('$1,000.00')
 for name,value in [('principal',100000),('rate',15),('years',50)]:set_slider(name,value)
 expect(page.locator('#final-value')).to_have_text('$108,365,744.16')
 assert page.locator('.principal-area').count()==1
 for name,value in [('principal',100),('rate',0),('years',1)]:set_slider(name,value)
 expect(page.locator('#final-value')).to_have_text('$100.00')
 page.goto(base+'concept.html?concept=derivatives')
 for value in [-5,0,5]:
  set_slider('point',value)
  expect(page.locator('#point-y')).to_have_text(str(value*value))
  expect(page.locator('#point-slope')).to_have_text(str(2*value))
  assert page.locator('.tangent-line').count()==1;assert page.locator('.selected-point').count()==1
 # Deterministic RNG in the browser verifies exact experimental percentages and history.
 page.goto(base+'concept.html?concept=coins')
 expect(page.locator('#heads-percent')).to_have_text('—')
 assert page.locator('.curve').count()==0;assert page.locator('.reference-line').count()==1
 page.evaluate('Math.random = () => 0.25')
 page.get_by_role('button',name='Flip once',exact=True).click()
 expect(page.locator('#heads-percent')).to_have_text('100.00%')
 page.evaluate('Math.random = () => 0.75')
 page.get_by_role('button',name='Flip 10 times',exact=True).click()
 expect(page.locator('#heads-percent')).to_have_text('9.09%')
 page.evaluate('Math.random = () => 0.25')
 page.get_by_role('button',name='Flip 100 times',exact=True).click()
 expect(page.locator('#total-flips')).to_have_text('111')
 expect(page.locator('#heads')).to_have_text('101');expect(page.locator('#tails')).to_have_text('10')
 expect(page.locator('#heads-percent')).to_have_text('90.99%')
 assert page.locator('.curve').get_attribute('d').count('L')==110
 page.get_by_role('button',name='Reset simulation').click()
 for key in ['total-flips','heads','tails']:expect(page.locator('#'+key)).to_have_text('0')
 expect(page.locator('#heads-percent')).to_have_text('—')
 # Real randomized batches keep exact accounting and valid probabilities.
 page.reload()
 for _ in range(10):page.get_by_role('button',name='Flip 100 times',exact=True).click()
 heads=int(page.locator('#heads').inner_text().replace(',',''));tails=int(page.locator('#tails').inner_text().replace(',',''))
 assert heads+tails==1000
 assert abs(float(page.locator('#heads-percent').inner_text().strip('%'))-heads/10)<.011
 # Touch-enabled native sliders on both new slider pages.
 touch=context.browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 touch_page=touch.new_page()
 for concept,names in [('interest',['principal','rate','years']),('derivatives',['point'])]:
  touch_page.goto(base+'concept.html?concept='+concept)
  for name in names:
   slider=touch_page.locator('#'+name);before=slider.input_value();box=slider.bounding_box()
   slider.locator('..').locator('.range-gesture').tap(position={'x':box['width']*.8,'y':box['height']/2})
   assert slider.input_value()!=before
 touch.close()
 page.set_viewport_size({'width':320,'height':740})
 for scheme in ['light','dark']:
  page.emulate_media(color_scheme=scheme)
  for route in ['', 'concept.html?concept=sigmoid','concept.html?concept=normal','concept.html?concept=graph','concept.html?concept=interest','concept.html?concept=derivatives','concept.html?concept=coins','concept.html?concept=trigonometric','concept.html?concept=exponential','concept.html?concept=logarithmic','concept.html?concept=binomial','concept.html?concept=unit-circle','concept.html?concept=integration','concept.html?concept=vectors','concept.html?concept=regression','concept.html?concept=bayes','concept.html?concept=logistic']:
   page.goto(base+route);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),route
 page.screenshot(path='/tmp/math-graph-mobile-dark.png',full_page=True)
 page.set_viewport_size({'width':1280,'height':900});page.goto(base);page.screenshot(path='/tmp/math-home-desktop.png',full_page=True)
 assert not errors, errors
 print('PASS: original concepts, numerical controls, graph editing, search, touch taps, and mobile themes')
 browser.close()
