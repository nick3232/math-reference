from playwright.sync_api import sync_playwright, expect
import os, shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(24)
 page.get_by_role('button',name='Linear Algebra',exact=True).click();expect(page.locator('.card')).to_have_count(3)
 page.locator('#search').fill('determinant');expect(page.locator('.card')).to_have_count(1)
 page.locator('.card').click();expect(page.locator('h1')).to_have_text('Determinant & Area')
 slider=page.get_by_role('slider',name='Angle Between Vectors',exact=True)
 assert page.locator('input,select').count()==1
 assert [slider.get_attribute(a) for a in ['min','max','step']]==['0','360','1']
 expect(slider).to_have_value('60');expect(page.locator('#det-result')).to_have_text('0.866');expect(page.locator('#det-area')).to_have_text('0.866')
 expect(page.locator('#det-components')).to_have_text('b = (0.500, 0.866)')
 expect(page.locator('#det-calculation')).to_have_text('(1 × 0.866) − (0 × 0.500) = 0.866')
 assert page.locator('[data-det-angle]').all_text_contents()==['0°','90°','180°','270°']
 assert page.locator('button').count()==5
 assert not page.locator('details.info').evaluate('el=>el.open')
 def overlap(a,b):return not (a['x']+a['width']<=b['x'] or b['x']+b['width']<=a['x'] or a['y']+a['height']<=b['y'] or b['y']+b['height']<=a['y'])
 def check_geometry():
  details=page.locator('.plot').evaluate('''el=>{
   const points=[...el.querySelector('polygon').points].map(p=>[p.x,p.y]);
   const signed=points.reduce((sum,p,i)=>{const q=points[(i+1)%4];return sum+p[0]*q[1]-p[1]*q[0]},0)/(-2*96*96);
   const m=el.getScreenCTM();return {points,signed,scales:[m.a,m.d]};
  }''')
  assert abs(details['scales'][0]-details['scales'][1])<1e-10
  assert abs(details['signed']-float(page.locator('#det-result').inner_text().replace('−','-')))<.00051
  for x,y in details['points']:assert 25<x<372 and 36<y<314
  a=page.locator('.dot-a-text').bounding_box();b=page.locator('.dot-b-text').bounding_box();assert not overlap(a,b)
  viewport=page.locator('.plot').bounding_box()
  for node in page.locator('.dot-vector-label,.dot-angle-label').all():
   box=node.bounding_box();assert box['x']>=viewport['x'] and box['x']+box['width']<=viewport['x']+viewport['width']
   assert box['y']>=viewport['y'] and box['y']+box['height']<=viewport['y']+viewport['height']
  return details
 for angle,result,area,component,orientation in [(0,'0.000','0.000','b = (1.000, 0.000)','Degenerate transformation'),(90,'1.000','1.000','b = (0.000, 1.000)','Orientation preserved'),(180,'0.000','0.000','b = (−1.000, 0.000)','Degenerate transformation'),(270,'−1.000','1.000','b = (0.000, −1.000)','Orientation reversed'),(360,'0.000','0.000','b = (1.000, 0.000)','Degenerate transformation')]:
  if angle==360:slider.evaluate('el=>{el.value=360;el.dispatchEvent(new Event("input"))}')
  else:page.locator('[data-det-angle="'+str(angle)+'"]').tap()
  expect(slider).to_have_value(str(angle));expect(page.locator('#det-result')).to_have_text(result);expect(page.locator('#det-area')).to_have_text(area)
  expect(page.locator('#det-components')).to_have_text(component);expect(page.locator('#det-interpretation')).to_have_text(orientation)
  assert page.locator('#det-calculation').inner_text().endswith('= '+result)
  assert page.locator('#det-area-calculation').inner_text().endswith('= '+area)
  assert page.locator('[data-det-angle][aria-pressed=true]').count()==(0 if angle==360 else 1)
  details=check_geometry()
  if angle in [0,180,360]:assert len(set(y for x,y in details['points']))==1
  if angle in [90,270]:
   assert len(set(x for x,y in details['points']))==2 and len(set(y for x,y in details['points']))==2
  assert '−0.000' not in page.locator('.workspace').inner_text()
 # Every degree: complete polygon stays within the fixed diagram and its signed
 # screen-space area (adjusting for inverted SVG y) agrees with the determinant.
 assert page.evaluate('''()=>{
  const el=document.querySelector('#det-angle');
  for(let angle=0;angle<=360;angle++){
   el.value=angle;el.dispatchEvent(new Event('input'));
   const p=[...document.querySelector('polygon').points];
   if(p.some(v=>v.x<=25||v.x>=372||v.y<=36||v.y>=314))return false;
   const signed=p.reduce((s,v,i)=>{const w=p[(i+1)%4];return s+v.x*w.y-v.y*w.x},0)/(-2*96*96);
   const det=Number(document.querySelector('#det-result').value.replace('−','-'));
   if(Math.abs(signed-det)>.00051||Number(document.querySelector('#det-area').value)<0)return false;
  }return true;
 }''')
 slider.evaluate('el=>{el.value=181;el.dispatchEvent(new Event("input"))}');expect(page.locator('#det-interpretation')).to_have_text('Orientation reversed')
 page.locator('#det-reset').tap();expect(slider).to_have_value('60');expect(page.locator('#det-result')).to_have_text('0.866')
 for concept in ['dot-product','vectors']:
  page.goto(base+'concept.html?concept='+concept);page.locator('details.info > summary').click()
  page.locator('.info-content').get_by_role('link',name='Determinant & Area',exact=True).click();expect(page.locator('h1')).to_have_text('Determinant & Area')
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme)
   for angle in [0,60,90,180,270,360]:
    page.locator('#det-angle').evaluate('(el,value)=>{el.value=value;el.dispatchEvent(new Event("input"))}',str(angle));check_geometry()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,theme,angle)
    assert page.locator('.equation-row').evaluate('el=>el.scrollWidth<=el.clientWidth')
    if width==390:page.screenshot(path='/tmp/determinant-'+theme+'-'+str(angle)+'.png',full_page=True)
 assert not errors,errors
 print('PASS: defaults, exact shortcut/endpoints, sign and area, full-rotation polygon bounds/shoelace geometry, calculations, reset, related links and readable responsive themes; no JS errors')
 browser.close()
