from playwright.sync_api import sync_playwright, expect
import os, shutil, math
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(23)
 page.get_by_role('button',name='Functions',exact=True).click();page.locator('#search').fill('Polar Coordinates');expect(page.locator('.card')).to_have_count(1);page.locator('.card').click()
 expect(page.locator('h1')).to_have_text('Polar Coordinates')
 assert page.locator('input,select').count()==2
 for id,attributes in [('polar-radius',['0','5','0.1','3']),('polar-angle',['0','360','1','45'])]:
  el=page.locator('#'+id);assert [el.get_attribute(a) for a in ['min','max','step']]+[el.input_value()]==attributes
 expect(page.locator('#polar-result')).to_have_text('(3.0, 45°)');expect(page.locator('#polar-cartesian')).to_have_text('(2.12, 2.12)')
 expect(page.locator('#polar-x')).to_have_text('x = 3.0 cos(45°) = 2.12')
 expect(page.locator('#polar-y')).to_have_text('y = 3.0 sin(45°) = 2.12')
 assert not page.locator('details.info').evaluate('el=>el.open')
 assert page.locator('[data-polar-angle]').all_text_contents()==['0°','90°','180°','270°']
 assert page.locator('button').count()==5
 def set_value(id,value):page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}))}',str(value))
 def geometry(r,angle):
  t=math.radians(angle);x=r*math.cos(t);y=r*math.sin(t);point=page.locator('#polar-point')
  assert abs(float(point.get_attribute('cx'))-200-30*x)<1e-9
  assert abs(float(point.get_attribute('cy'))-200+30*y)<1e-9
  assert '−0.00' not in page.locator('.workspace').inner_text()
  assert page.locator('#polar-radius-line').get_attribute('d')==f'M200 200L{point.get_attribute("cx")} {point.get_attribute("cy")}'
  assert page.locator('#polar-projections').get_attribute('d')==f'M{point.get_attribute("cx")} 200V{point.get_attribute("cy")}H200'
  m=page.locator('.plot').evaluate('el=>{const m=el.getScreenCTM();return [m.a,m.d]}');assert abs(m[0]-m[1])<1e-12
 for angle,coords in [(0,'(3.00, 0.00)'),(90,'(0.00, 3.00)'),(180,'(−3.00, 0.00)'),(270,'(0.00, −3.00)'),(360,'(3.00, 0.00)')]:
  if angle<360:
   page.locator(f'[data-polar-angle="{angle}"]').tap();expect(page.locator(f'[data-polar-angle="{angle}"]')).to_have_attribute('aria-pressed','true')
  else:set_value('polar-angle',angle)
  expect(page.locator('#polar-angle')).to_have_value(str(angle));expect(page.locator('#polar-cartesian')).to_have_text(coords);geometry(3,angle)
 set_value('polar-radius',0)
 for angle in [0,45,90,180,270,360]:
  set_value('polar-angle',angle);expect(page.locator('#polar-cartesian')).to_have_text('(0.00, 0.00)');geometry(0,angle)
 set_value('polar-radius',4.7);expect(page.locator('#polar-angle')).to_have_value('360');geometry(4.7,360)
 set_value('polar-angle',225);expect(page.locator('#polar-radius')).to_have_value('4.7');geometry(4.7,225)
 # Sweep the whole rotation, checking circular bounds and SVG arc direction/large-arc flags.
 for angle in range(361):
  set_value('polar-angle',angle);geometry(4.7,angle)
  arc=page.locator('#polar-arc').get_attribute('d')
  if 0<angle<360:assert f'A23 23 0 {1 if angle>180 else 0} 0 ' in arc
  else:assert arc==''
  assert page.locator('#polar-full-angle').is_visible()==(angle==360)
 page.get_by_role('button',name='Reset',exact=True).tap();expect(page.locator('#polar-radius')).to_have_value('3');expect(page.locator('#polar-angle')).to_have_value('45')
 for theme in ['light','dark']:
  page.emulate_media(color_scheme=theme)
  for width in [320,390,768,1280]:
   page.set_viewport_size({'width':width,'height':844})
   for angle in [0,45,90,180,270,360]:
    set_value('polar-radius',5);set_value('polar-angle',angle);geometry(5,angle)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    bounds=page.locator('.plot').bounding_box();assert abs(bounds['width']-bounds['height'])<1
    for label in page.locator('.polar-label').all():
     if not label.is_visible():continue
     box=label.bounding_box();assert bounds['x']<=box['x'] and box['x']+box['width']<=bounds['x']+bounds['width']
     assert bounds['y']<=box['y'] and box['y']+box['height']<=bounds['y']+bounds['height']
   if width==390:
    page.get_by_role('button',name='Reset',exact=True).click();page.screenshot(path=f'/tmp/polar-{theme}.png',full_page=True)
 for concept in ['unit-circle','trigonometric']:
  page.goto(base+'concept.html?concept='+concept);page.locator('details.info summary').click();page.get_by_role('link',name='Polar Coordinates',exact=True).click();expect(page.locator('h1')).to_have_text('Polar Coordinates')
 assert not errors,errors
 browser.close()
 print('PASS: polar defaults, shortcuts, full-rotation conversion/geometry, zero radius, fixed equal-scale grid, radius/projection lines, arcs, reset, search/related links, responsive light/dark layouts; no JS errors')
