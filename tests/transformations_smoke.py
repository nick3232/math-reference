from playwright.sync_api import sync_playwright, expect
import os, shutil, re
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(20)
 page.get_by_role('button',name='Functions',exact=True).click()
 page.locator('#search').fill('transformations');expect(page.locator('.card')).to_have_count(1)
 page.locator('.card').click();expect(page.locator('h1')).to_have_text('Function Transformations')
 def set_value(key,value):page.locator('#transform-'+key).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',str(value))
 def paths():return [page.locator(cls).get_attribute('d') for cls in ['.transformation-original','.transformation-result']]
 def equation():return page.locator('.equations .equation').nth(1).inner_text()
 def plotted_y(x):
  pairs=[(float(a),float(b)) for a,b in re.findall(r'[ML]([-+0-9.e]+),([-+0-9.e]+)',paths()[1])]
  # Every allowed h and each test x are on the 0.02 sample grid.
  return (290-pairs[round((x+8)*50)][1])/266*20-10
 expect(page.locator('#transform-base')).to_have_value('quadratic')
 assert page.locator('.equations .equation').all_text_contents()==['f(x) = x²','g(x) = x²']
 assert paths()[0]==paths()[1]
 grid=page.locator('.plot > .gridline').evaluate_all('(els)=>els.map(el=>el.getAttribute("d"))')
 for key,minimum,maximum,step,value in [('h','-5','5','0.5','0'),('k','-5','5','0.5','0'),('a','-3','3','0.25','1'),('b','-3','3','0.25','1')]:
  el=page.locator('#transform-'+key);assert [el.get_attribute(a) for a in ['min','max','step']]==[minimum,maximum,step];expect(el).to_have_value(value)
 for key,value,x,expected,expression in [
  ('h',2,2,0,'g(x) = (x − 2)²'),('k',-3,0,-3,'g(x) = x² − 3'),
  ('a',2,2,8,'g(x) = 2x²'),('a',-1,2,-4,'g(x) = −x²'),
  ('b',2,1,4,'g(x) = (2x)²'),('b',.5,2,1,'g(x) = (0.5x)²'),
  ('b',-1,2,4,'g(x) = (−x)²')]:
  page.locator('#transform-reset').click();set_value(key,value)
  assert abs(plotted_y(x)-expected)<1e-8;assert equation()==expression
  assert page.locator('.plot > .gridline').evaluate_all('(els)=>els.map(el=>el.getAttribute("d"))')==grid
 # Non-default parameters are retained by all selectors, including negative shifts/scales.
 for key,value in [('h',-2),('k',1),('a',-.25),('b',-.5)]:set_value(key,value)
 for kind in ['quadratic','cubic','absolute']:
  page.locator('#transform-base').select_option(kind)
  for key,value in [('h','-2'),('k','1'),('a','-0.25'),('b','-0.5')]:expect(page.locator('#transform-'+key)).to_have_value(value)
  x=0;inside=-.5*(x+2)
  expected=-.25*({'quadratic':inside**2,'cubic':inside**3,'absolute':abs(inside)}[kind])+1
  assert abs(plotted_y(x)-expected)<1e-8
  page.locator('#transform-reset').click()
  expect(page.locator('#transform-base')).to_have_value(kind)
  assert paths()[0]==paths()[1]
  for key,value in [('h',-2),('k',1),('a',-.25),('b',-.5)]:set_value(key,value)
 page.locator('#transform-base').select_option('cubic');page.locator('#transform-reset').click()
 set_value('b',-1);assert abs(plotted_y(2)+8)<1e-8
 for kind in ['quadratic','absolute']:
  page.locator('#transform-base').select_option(kind);set_value('b',1);positive=paths()[1];set_value('b',-1)
  assert paths()[1]==positive
 for kind in ['quadratic','cubic','absolute']:
  page.locator('#transform-base').select_option(kind)
  for zero in ['a','b']:
   page.locator('#transform-reset').click();set_value('k',-3);set_value(zero,0)
   assert equation()=='g(x) = −3';assert abs(plotted_y(2)+3)<1e-8
   assert not re.search('NaN|Infinity',paths()[1])
 assert page.locator('.chart-data').get_attribute('clip-path')=='url(#chart-clip)'
 assert 'y' in page.locator('.plot').text_content()
 assert not page.locator('details.info').evaluate('el=>el.open')
 page.locator('details.info > summary').click();assert 'inverse' in page.locator('.info-content').inner_text();assert 'even' in page.locator('.info-content').inner_text()
 assert page.locator('#copy,.other-nav,a[href*="desmos"]').count()==0
 # Selector and equations precede the graph, with sliders after it.
 assert page.locator('.workspace').evaluate('el=>{const s=el.querySelector(".transform-selector"),e=el.querySelector(".equation-row"),g=el.querySelector(".plot"),c=el.querySelector("#controls");return !!(s.compareDocumentPosition(e)&4)&&!!(e.compareDocumentPosition(g)&4)&&!!(g.compareDocumentPosition(c)&4)}')
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme);page.locator('#transform-reset').click()
   for kind in ['quadratic','cubic','absolute']:
    page.locator('#transform-base').select_option(kind)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,theme,kind)
    assert page.locator('.equation-row').evaluate('el=>el.scrollWidth<=el.clientWidth')
   if width==390:page.screenshot(path='/tmp/transformations-'+theme+'.png',full_page=True)
 assert not errors,errors
 print('PASS: transformation math plotted at correct coordinates, readable dynamic equations, preserved parameters, reset, even/odd reflections, zero scales, stable grid/clipping and mobile/desktop themes')
 browser.close()
