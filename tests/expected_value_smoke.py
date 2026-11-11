from playwright.sync_api import sync_playwright, expect
import os, shutil, re
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(18)
 page.locator('#search').fill('expected');expect(page.locator('.card')).to_have_count(1)
 page.locator('.card').click();expect(page.locator('h1')).to_have_text('Expected Value')
 def configure(pairs):
  page.locator('#ev-reset').click()
  while page.locator('.ev-outcome').count()<len(pairs):page.locator('#ev-add').click()
  while page.locator('.ev-outcome').count()>len(pairs):page.locator('[data-remove]').last.click()
  for i,(value,weight) in enumerate(pairs):
   page.locator('#ev-value-'+str(i)).fill(str(value))
   page.locator('#ev-weight-'+str(i)).fill(str(weight))
 def assert_defaults():
  assert page.locator('.ev-outcome').count()==3
  for i,(value,weight) in enumerate([(-10,25),(0,35),(20,40)]):
   expect(page.locator('#ev-value-'+str(i))).to_have_value(str(value))
   expect(page.locator('#ev-weight-'+str(i))).to_have_value(str(weight))
  expect(page.locator('#ev-result')).to_have_text('5.50')
 assert_defaults()
 assert page.locator('select,#ev-example').count()==0
 assert not page.locator('details.info').evaluate('el=>el.open')
 page.locator('details.info > summary').click()
 info=page.locator('details.info .info-content')
 expect(info.get_by_text('Coin Toss — Outcomes Can Cancel',exact=True)).to_be_visible()
 expect(info.get_by_text('Six-Sided Die — Expected Value May Not Be a Possible Outcome',exact=True)).to_be_visible()
 assert 'neither outcome is zero' in info.inner_text()
 assert '3.5 is not a possible individual outcome' in info.inner_text()
 assert 'Coin Toss — Outcomes Can Cancel' not in page.locator('.workspace').inner_text()
 page.locator('details.info > summary').click()
 assert not page.locator('.ev-breakdown').evaluate('el=>el.open')
 assert page.locator('#copy,.other-nav,a[href*="desmos"]').count()==0
 assert [page.locator('#ev-prob-'+str(i)).inner_text() for i in range(3)]==['25%','35%','40%']
 page.locator('.ev-breakdown summary').click()
 assert page.locator('#ev-calculation p').all_text_contents()==['-10.00 × 25% = -2.50','0.00 × 35% = 0.00','20.00 × 40% = 8.00','Expected Value = 5.50']
 # The marker's position is measured in the same coordinate system as outcomes.
 marker=page.locator('.ev-mean').get_attribute('d')
 def mean_x():return float(re.match(r'M([^ ]+) ',page.locator('.ev-mean').get_attribute('d')).group(1))
 positions=[float(re.match(r'M([^ ]+) ',el.get_attribute('d')).group(1)) for el in page.locator('.ev-stem').all()]
 assert abs(mean_x()-(positions[0]+(5.5+10)/30*(positions[2]-positions[0])))<1e-7
 page.locator('#ev-weight-0').fill('50')
 assert [page.locator('#ev-prob-'+str(i)).inner_text() for i in range(3)]==['40%','28%','32%']
 assert marker!=page.locator('.ev-mean').get_attribute('d')
 for i in range(3):page.locator('#ev-weight-'+str(i)).fill('0')
 expect(page.locator('#ev-result')).to_have_text('Undefined')
 expect(page.locator('#ev-status')).to_have_text('At least one positive weight is required.')
 assert page.locator('.ev-mean').count()==0
 configure([(i,1) for i in range(1,7)]);expect(page.locator('#ev-result')).to_have_text('3.50')
 assert page.locator('.ev-marker').count()==6;expect(page.locator('#ev-add')).to_be_disabled()
 configure([(-1,1),(1,1)]);expect(page.locator('#ev-result')).to_have_text('0.00')
 assert page.locator('[data-remove]:disabled').count()==2
 page.locator('#ev-add').click()
 expect(page.locator('#ev-value-2')).to_have_value('0');expect(page.locator('#ev-weight-2')).to_have_value('1')
 page.locator('#ev-value-0').fill('0');page.locator('#ev-value-1').fill('0')
 assert page.locator('.ev-marker').count()==1
 expect(page.locator('#ev-result')).to_have_text('0.00')
 page.locator('#ev-value-0').fill('-2.5');page.locator('#ev-weight-0').fill('0.5')
 page.locator('#ev-value-1').fill('1.25');page.locator('#ev-weight-1').fill('1.5')
 expect(page.locator('#ev-result')).to_have_text('0.21')
 page.locator('#ev-value-0').fill('');expect(page.locator('#ev-result')).to_have_text('Undefined')
 expect(page.locator('#ev-value-0')).to_have_attribute('aria-invalid','true')
 page.locator('#ev-value-0').fill('2');page.locator('#ev-weight-0').fill('-5')
 expect(page.locator('#ev-weight-0')).to_have_value('0')
 page.locator('#ev-value-0').fill('1e309');expect(page.locator('#ev-result')).to_have_text('Undefined')
 page.locator('#ev-reset').click();assert_defaults()
 for _ in range(3):page.locator('#ev-add').click()
 assert page.locator('.ev-outcome').count()==6;expect(page.locator('#ev-add')).to_be_disabled()
 for _ in range(4):page.locator('[data-remove]').last.click()
 assert page.locator('.ev-outcome').count()==2;assert page.locator('[data-remove]:disabled').count()==2
 page.locator('#ev-reset').click()
 # Very large finite values and weights keep both calculations and SVG finite.
 for i in range(3):
  page.locator('#ev-value-'+str(i)).fill(str((-1 if i==0 else 1)*1e308))
  page.locator('#ev-weight-'+str(i)).fill('1e308')
 assert 'Infinity' not in page.locator('.plot').inner_html()
 assert 'NaN' not in page.locator('.plot').inner_html()
 assert page.locator('#ev-result').inner_text()!='Undefined'
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme);page.locator('#ev-reset').click()
   for pairs in [[(-10,25),(0,35),(20,40)],[(i,1) for i in range(1,7)],[(-1,1),(1,1)]]:
    configure(pairs)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,theme,pairs)
    assert page.locator('.equation-row').evaluate('el=>el.scrollWidth<=el.clientWidth')
   page.locator('#ev-reset').click()
   if width==390:page.screenshot(path='/tmp/expected-value-'+theme+'.png',full_page=True)
 assert not errors,errors
 print('PASS: Expected Value defaults/reset, manual configurations, educational examples, weight normalization, marker geometry, duplicate values, decimals, invalid/empty/zero states, outcome limits, reset, and responsive light/dark layouts')
 browser.close()
