"""Portfolio model integration, shared controls, reset and responsive charts."""
from playwright.sync_api import sync_playwright, expect
import os, shutil, re, math
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(19)
 page.get_by_role('button',name='Finance',exact=True).click();expect(page.locator('.card')).to_have_count(2)
 page.locator('#search').fill('drawdown');expect(page.locator('.card')).to_have_count(1)
 page.locator('.card').click();expect(page.locator('h1')).to_have_text('Portfolio Drawdown')
 assert not page.locator('details.info').evaluate('el=>el.open')
 assert page.locator('#copy,.other-nav,a[href*="desmos"]').count()==0
 defaults={'portfolio-start':'500000','portfolio-return':'6','portfolio-withdrawal':'3000','portfolio-years':'30'}
 limits={'portfolio-start':('100000','2000000','25000'),'portfolio-return':('0','12','0.5'),'portfolio-withdrawal':('0','10000','250'),'portfolio-years':('5','50','1')}
 for id,value in defaults.items():
  expect(page.locator('#'+id)).to_have_value(value)
  assert tuple(page.locator('#'+id).get_attribute(attr) for attr in ['min','max','step'])==limits[id]
 def points(selector):return [(float(x),float(y)) for x,y in re.findall(r'[ML]([-+0-9.e]+),([-+0-9.e]+)',page.locator(selector).get_attribute('d'))]
 def set_value(id,value):page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',str(value))
 balance=points('.portfolio-balance');withdrawals=points('.portfolio-withdrawals')
 assert len(balance)==len(withdrawals)==361
 assert balance[0][0]==withdrawals[0][0]==62
 assert withdrawals[0][1]==balance[-1][1]==290
 expect(page.locator('#portfolio-ending')).to_have_text('$0')
 expect(page.locator('#portfolio-total')).to_have_text('$1,077,742')
 expect(page.locator('#portfolio-status')).to_have_text('Portfolio depleted after approximately 30.00 years.')
 # Both lines use one chart scale: the starting $500k and final withdrawn total
 # must have the same pixel-to-dollar ratio.
 ratio=(290-balance[0][1])/500000
 assert abs((290-withdrawals[-1][1])/1077742.4787737-ratio)<1e-10
 assert '$' in page.locator('.plot').text_content();assert 'Time (years)' in page.locator('.plot').text_content()
 for id,value in [('portfolio-start',750000),('portfolio-return',8),('portfolio-withdrawal',4000),('portfolio-years',40)]:
  before=page.locator('.plot').get_attribute('aria-label');set_value(id,value)
  assert page.locator('.plot').get_attribute('aria-label')!=before
 # Reset updates all controls, both paths and the summaries together.
 page.locator('#portfolio-reset').click()
 for id,value in defaults.items():expect(page.locator('#'+id)).to_have_value(value)
 assert points('.portfolio-balance')==balance;assert points('.portfolio-withdrawals')==withdrawals
 set_value('portfolio-withdrawal',0)
 expect(page.locator('#portfolio-total')).to_have_text('$0')
 expect(page.locator('#portfolio-status')).to_have_text('Portfolio lasts through the selected time horizon.')
 assert all(y==290 for x,y in points('.portfolio-withdrawals'))
 assert points('.portfolio-balance')[-1][1]<points('.portfolio-balance')[0][1]
 # Zero-return partial depletion occurs at month 34, not at an annual sample.
 for id,value in [('portfolio-start',100000),('portfolio-return',0),('portfolio-withdrawal',3000),('portfolio-years',5)]:set_value(id,value)
 expect(page.locator('#portfolio-status')).to_have_text('Portfolio depleted after approximately 2.83 years.')
 expect(page.locator('#portfolio-ending')).to_have_text('$0');expect(page.locator('#portfolio-total')).to_have_text('$100,000')
 balance=points('.portfolio-balance');withdrawals=points('.portfolio-withdrawals')
 assert balance[33][1]<290;assert all(y==290 for x,y in balance[34:])
 assert all(y==withdrawals[34][1] for x,y in withdrawals[34:])
 set_value('portfolio-withdrawal',10000)
 expect(page.locator('#portfolio-status')).to_have_text('Portfolio depleted after approximately 0.83 years.')
 page.locator('details.info > summary').click()
 for link in page.locator('.info-content a').evaluate_all('(els)=>els.map(el=>el.getAttribute("href"))'):
  page.goto(base+link);assert page.locator('h1').inner_text() in ['Compound Interest','Exponential Growth & Decay']
 page.goto(base+'concept.html?concept=portfolio');page.locator('.back').click();expect(page.locator('.card')).to_have_count(19)
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme);page.goto(base+'concept.html?concept=portfolio')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert page.locator('.equation-row').evaluate('el=>el.scrollWidth<=el.clientWidth')
   if width==390:page.screenshot(path='/tmp/portfolio-'+theme+'.png',full_page=True)
 assert not errors,errors
 print('PASS: Finance/search/navigation, monthly two-series chart and shared dollar scale, depletion/partial withdrawal, all sliders and reset, and responsive light/dark layouts; no JS errors')
 browser.close()
