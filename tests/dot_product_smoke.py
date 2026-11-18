"""Dot product diagrams, shortcut angles, live calculations and responsive geometry."""
from playwright.sync_api import sync_playwright, expect
import os, shutil, math, re
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(22)
 page.get_by_role('button',name='Linear Algebra',exact=True).click();expect(page.locator('.card')).to_have_count(3)
 page.locator('#search').fill('dot product');expect(page.locator('.card')).to_have_count(1)
 page.locator('.card').click();expect(page.locator('h1')).to_have_text('Dot Product')
 slider=page.get_by_role('slider',name='Angle Between Vectors',exact=True)
 assert page.locator('input[type=range]').count()==1
 assert page.locator('input,select').count()==1
 assert [slider.get_attribute(a) for a in ['min','max','step']]==['0','180','1']
 expect(slider).to_have_value('60');expect(page.locator('#dot-result')).to_have_text('0.500')
 expect(page.locator('#dot-components')).to_have_text('b = (0.500, 0.866)')
 expect(page.locator('#dot-component-calculation')).to_have_text('(1 × 0.500) + (0 × 0.866) = 0.500')
 expect(page.locator('#dot-geometric-calculation')).to_have_text('1 × 1 × cos(60°) = 0.500')
 assert page.locator('[data-dot-angle]').count()==3
 assert page.locator('[data-dot-angle][aria-pressed=true]').count()==0
 assert page.locator('button').count()==4
 assert not page.locator('details.info').evaluate('el=>el.open')
 def no_overlap(a,b):return a['x']+a['width']<=b['x'] or b['x']+b['width']<=a['x'] or a['y']+a['height']<=b['y'] or b['y']+b['height']<=a['y']
 def check_geometry(angle):
  endpoint=[]
  for selector in ['.dot-vector-a','.dot-vector-b']:
   numbers=[float(v) for v in re.findall(r'[-+0-9.e]+',page.locator(selector).get_attribute('d'))]
   x0,y0,x1,y1=numbers;assert (x0,y0)==(200,220)
   assert abs(math.hypot(x1-x0,y1-y0)-118)<1e-9
   endpoint.append((x1,y1))
  assert endpoint[0]==(318,220)
  assert abs(endpoint[1][0]-(200+118*math.cos(math.radians(angle))))<1e-9
  assert abs(endpoint[1][1]-(220-118*math.sin(math.radians(angle))))<1e-9
  matrix=page.locator('.plot').evaluate('el=>{const m=el.getScreenCTM();return [m.a,m.d]}');assert abs(matrix[0]-matrix[1])<1e-10
  for selector in ['.dot-vector-label','.dot-angle-label']:
   viewport=page.locator('.plot').bounding_box()
   for node in page.locator(selector).all():
    box=node.bounding_box();assert box['x']>=viewport['x'] and box['x']+box['width']<=viewport['x']+viewport['width']
    assert box['y']>=viewport['y'] and box['y']+box['height']<=viewport['y']+viewport['height']
  assert no_overlap(page.locator('.dot-a-text').bounding_box(),page.locator('.dot-b-text').bounding_box())
 for angle,result,components,interpretation in [(0,'1.000','b = (1.000, 0.000)','Positive alignment'),(90,'0.000','b = (0.000, 1.000)','Perpendicular'),(180,'−1.000','b = (−1.000, 0.000)','Opposing directions')]:
  page.locator('[data-dot-angle="'+str(angle)+'"]').tap()
  expect(slider).to_have_value(str(angle));expect(page.locator('#dot-result')).to_have_text(result)
  expect(page.locator('#dot-components')).to_have_text(components);expect(page.locator('#dot-interpretation')).to_have_text(interpretation)
  expect(page.locator('[data-dot-angle="'+str(angle)+'"]')).to_have_attribute('aria-pressed','true')
  assert page.locator('[data-dot-angle][aria-pressed=true]').count()==1
  assert page.locator('#dot-component-calculation').inner_text().endswith('= '+result)
  assert page.locator('#dot-geometric-calculation').inner_text().endswith('= '+result)
  check_geometry(angle)
  assert '−0.000' not in page.locator('.workspace').inner_text()
  assert '-0.000' not in page.locator('.workspace').inner_text()
 for angle in [1,45,60,89,91,120,179]:
  before=page.locator('.dot-vector-b').get_attribute('d')
  slider.evaluate('(el,value)=>{el.value=value;el.dispatchEvent(new Event("input"))}',str(angle))
  assert before!=page.locator('.dot-vector-b').get_attribute('d')
  result=page.locator('#dot-result').inner_text()
  assert result==f'{math.cos(math.radians(angle)):.3f}'.replace('-','−')
  assert page.locator('#dot-component-calculation').inner_text().endswith('= '+result)
  assert page.locator('#dot-geometric-calculation').inner_text().endswith('= '+result)
  assert page.locator('[data-dot-angle][aria-pressed=true]').count()==0
  check_geometry(angle)
 page.locator('#dot-reset').tap();expect(slider).to_have_value('60');expect(page.locator('#dot-result')).to_have_text('0.500')
 assert page.locator('#copy,.other-nav,a[href*="desmos"]').count()==0
 # The Vector Addition related link reaches this concept.
 page.goto(base+'concept.html?concept=vectors');page.locator('details.info > summary').click()
 page.locator('.info-content').get_by_role('link',name='Dot Product',exact=True).click()
 expect(page.locator('h1')).to_have_text('Dot Product')
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme)
   for angle in [0,60,90,180]:
    slider=page.locator('#dot-angle');slider.evaluate('(el,value)=>{el.value=value;el.dispatchEvent(new Event("input"))}',str(angle))
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,theme,angle)
    assert page.locator('.equation-row').evaluate('el=>el.scrollWidth<=el.clientWidth')
    check_geometry(angle)
    if width==390:page.screenshot(path='/tmp/dot-product-'+theme+'-'+str(angle)+'.png',full_page=True)
 assert not errors,errors
 print('PASS: one slider, three shortcuts, reset, exact key-angle values, live formula agreement, unit/equal-scale geometry and readable labels at 0/90/180°, related navigation, and four widths in both themes')
 browser.close()
