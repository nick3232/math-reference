from playwright.sync_api import sync_playwright, expect
import os, shutil, re, math
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(25)
 page.get_by_role('button',name='Finance',exact=True).click();expect(page.locator('.card')).to_have_count(4)
 page.locator('#search').fill('inflation');expect(page.locator('.card')).to_have_count(1);page.locator('.card').click()
 expect(page.locator('h1')).to_have_text('Inflation & Purchasing Power')
 assert page.locator('input,select').count()==2
 for id,attributes in [('inflation-rate',['0','10','0.5','3']),('inflation-year',['0','30','1','15'])]:
  el=page.locator('#'+id);assert [el.get_attribute(a) for a in ['min','max','step']]+[el.input_value()]==attributes
 expect(page.locator('#inflation-power')).to_have_text('$64.19');expect(page.locator('#inflation-cost')).to_have_text('$155.80');expect(page.locator('#inflation-lost')).to_have_text('35.8%')
 expect(page.locator('#inflation-rate-value')).to_have_text('3.0%');expect(page.locator('#inflation-year-value')).to_have_text('Year 15')
 expect(page.locator('#inflation-substitution')).to_have_text('P = 100 / (1 + 0.03)15 = $64.19')
 assert not page.locator('details.info').evaluate('el=>el.open')
 assert page.locator('button').all_text_contents()==['Reset']
 def set_value(id,value):page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}))}',str(value))
 def curve_points():return [(float(x),float(y)) for x,y in re.findall(r'[ML]([-+0-9.e]+),([-+0-9.e]+)',page.locator('.inflation-curve').get_attribute('d'))]
 def geometry(rate,year):
  svg=page.locator('.plot');width=float(svg.get_attribute('viewBox').split()[2]);left,right,top,bottom=62,width-24,24,290
  power=100/(1+rate/100)**year
  point=page.locator('#inflation-point');assert abs(float(point.get_attribute('cx'))-(left+year/30*(right-left)))<1e-8
  assert abs(float(point.get_attribute('cy'))-(bottom-power/100*(bottom-top)))<1e-8
  assert page.locator('#inflation-guide').get_attribute('d')==f'M{point.get_attribute("cx")} 290V{point.get_attribute("cy")}'
  points=curve_points();assert len(points)==301 and points[0]==(62,24)
  for j,(x,y) in enumerate(points):
   assert abs(x-(left+j/300*(right-left)))<1e-8
   assert abs(y-(bottom-(1+rate/100)**(-j/10)*(bottom-top)))<1e-8
   assert 24-1e-8<=y<=290
  if rate==0:assert all(y==24 for x,y in points)
  else:assert all(a[1]<b[1] for a,b in zip(points,points[1:]))
  bounds=svg.bounding_box();marker=point.bounding_box()
  assert bounds['x']<marker['x'] and marker['x']+marker['width']<bounds['x']+bounds['width']
  assert bounds['y']<marker['y'] and marker['y']+marker['height']<bounds['y']+bounds['height']
  for label in svg.locator('text').all():
   box=label.bounding_box();assert bounds['x']<=box['x'] and box['x']+box['width']<=bounds['x']+bounds['width']+1
   assert bounds['y']<=box['y'] and box['y']+box['height']<=bounds['y']+bounds['height']+1
 geometry(3,15)
 page.locator('.inflation-curve').evaluate('el=>window.savedCurve=el')
 before=page.locator('.inflation-curve').get_attribute('d');set_value('inflation-year',30)
 assert before==page.locator('.inflation-curve').get_attribute('d')
 assert page.locator('.inflation-curve').evaluate('el=>el===window.savedCurve')
 for rate,year,power,cost in [(0,30,'$100.00','$100.00'),(3,0,'$100.00','$100.00'),(3,15,'$64.19','$155.80'),(3,30,'$41.20','$242.73'),(10,10,'$38.55','$259.37'),(10,30,'$5.73','$1,744.94')]:
  set_value('inflation-rate',rate);set_value('inflation-year',year);geometry(rate,year)
  expect(page.locator('#inflation-power')).to_have_text(power);expect(page.locator('#inflation-cost')).to_have_text(cost);expect(page.locator('#inflation-remaining')).to_have_text(power)
  loss=100*(1-(1+rate/100)**(-year));expect(page.locator('#inflation-lost')).to_have_text(f'{loss:.1f}%')
  assert page.locator('.curve').count()==1
 page.get_by_role('button',name='Reset',exact=True).tap();expect(page.locator('#inflation-rate')).to_have_value('3');expect(page.locator('#inflation-year')).to_have_value('15');geometry(3,15)
 for theme in ['light','dark']:
  page.emulate_media(color_scheme=theme)
  for width in [320,390,768,1280]:
   page.set_viewport_size({'width':width,'height':844});page.wait_for_timeout(100)
   for rate in [0,3,10]:
    for year in [0,15,30]:
     set_value('inflation-rate',rate);set_value('inflation-year',year);geometry(rate,year)
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if width==390:
    page.get_by_role('button',name='Reset',exact=True).click();page.screenshot(path=f'/tmp/inflation-{theme}.png',full_page=True)
 for concept in ['interest','exponential']:
  page.goto(base+'concept.html?concept='+concept);page.locator('details.info summary').click();page.get_by_role('link',name='Inflation & Purchasing Power',exact=True).click();expect(page.locator('h1')).to_have_text('Inflation & Purchasing Power')
 assert not errors,errors
 browser.close()
 print('PASS: inflation defaults/reference cases, single fixed-scale curve, selected-year marker without curve changes, zero inflation/year, live calculation, reset, search/links, responsive themes and unclipped endpoint markers/axis labels; no JS errors')
