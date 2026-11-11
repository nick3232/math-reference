from playwright.sync_api import sync_playwright, expect
import os, shutil, re
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(20)
 page.get_by_role('button',name='Finance',exact=True).click();expect(page.locator('.card')).to_have_count(3)
 page.locator('#search').fill('amortization');expect(page.locator('.card')).to_have_count(1)
 page.locator('.card').click();expect(page.locator('h1')).to_have_text('Loan Amortization')
 expect(page.locator('#loan-payment')).to_have_text('$1,498.88')
 expect(page.locator('#loan-total-interest')).to_have_text('$289,595.47')
 expect(page.locator('#loan-total-repaid')).to_have_text('$539,595.47')
 def set_value(id,value):page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',str(value))
 def points(cls):return [(float(x),float(y)) for x,y in re.findall(r'[ML]([-+0-9.e]+),([-+0-9.e]+)',page.locator(cls).get_attribute('d'))]
 def money(id):return float(page.locator('#'+id).inner_text().replace('$','').replace(',',''))
 def check_year(year):
  expected=page.evaluate('async y=>{const {amortizeLoan}=await import("./assets/amortization-model.js");return amortizeLoan(+document.querySelector("#loan-amount").value,+document.querySelector("#loan-rate").value,+document.querySelector("#loan-term").value).annual[y]}',year)
  assert abs(money('loan-year-principal')-expected['principal'])<.006
  assert abs(money('loan-year-interest')-expected['interest'])<.006
  assert abs(money('loan-year-balance')-expected['balance'])<.006
  assert abs(money('loan-year-principal')+money('loan-year-interest')-12*money('loan-payment'))<.07
  expect(page.locator('#loan-balance-label')).to_have_text('Remaining Balance at End of Year '+str(year))
  principal_width=page.locator('.loan-bar .loan-principal').evaluate('el=>parseFloat(el.style.width)')
  assert abs(principal_width-100*expected['principal']/expected['payments'])<.0001
  # Annual balance on the graph must agree with the selected year's schedule.
  plotted=points('.loan-balance')[year][1]
  axis_max=float(page.locator('#loan-amount').input_value())*1.12
  assert abs((290-plotted)/266*axis_max-expected['balance'])<1e-6
 for id,minimum,maximum,step,value in [('loan-amount','10000','1000000','10000','250000'),('loan-rate','0','15','0.25','6'),('loan-term','1','40','1','30'),('loan-year','1','30','1','1')]:
  el=page.locator('#'+id);assert [el.get_attribute(a) for a in ['min','max','step']]==[minimum,maximum,step];expect(el).to_have_value(value)
 balance=points('.loan-balance');repaid=points('.loan-repaid')
 assert len(balance)==len(repaid)==31
 assert balance[0][0]==repaid[0][0]==62
 assert balance[-1][1]==repaid[0][1]==290
 assert abs(balance[0][1]-repaid[-1][1])<1e-10
 assert all(a[1]<=b[1] for a,b in zip(balance,balance[1:]))
 assert all(a[1]>=b[1] for a,b in zip(repaid,repaid[1:]))
 check_year(1);first_interest=money('loan-year-interest')
 graph=page.locator('.plot').inner_html();payment=page.locator('#loan-payment').inner_text()
 set_value('loan-year',30);check_year(30)
 assert money('loan-year-interest')<first_interest
 assert page.locator('.plot').inner_html()==graph
 assert page.locator('#loan-payment').inner_text()==payment
 set_value('loan-term',10);expect(page.locator('#loan-year')).to_have_value('10');check_year(10)
 expect(page.locator('#loan-year')).to_have_attribute('max','10')
 set_value('loan-term',40);expect(page.locator('#loan-year')).to_have_value('10')
 set_value('loan-rate',0);expect(page.locator('#loan-total-interest')).to_have_text('$0.00')
 assert money('loan-payment')==round(250000/480,2)
 expect(page.locator('.loan-bar .loan-principal')).to_have_attribute('style','width: 100%;')
 expect(page.locator('.loan-bar .loan-interest')).to_have_attribute('style','width: 0%;')
 check_year(10)
 for id,value in [('loan-amount',1000000),('loan-rate',15),('loan-term',1)]:set_value(id,value)
 expect(page.locator('#loan-year')).to_have_value('1');check_year(1)
 assert points('.loan-balance')[-1][1]==290
 page.locator('#loan-reset').click()
 for id,value in [('loan-amount','250000'),('loan-rate','6'),('loan-term','30'),('loan-year','1')]:expect(page.locator('#'+id)).to_have_value(value)
 expect(page.locator('#loan-payment')).to_have_text('$1,498.88');check_year(1)
 assert points('.loan-balance')==balance;assert points('.loan-repaid')==repaid
 assert not page.locator('details.info').evaluate('el=>el.open')
 page.locator('details.info > summary').click()
 assert 'P/n' in page.locator('.info-content').inner_text()
 assert page.locator('#copy,.other-nav,a[href*="desmos"]').count()==0
 # Summary, main controls, graph and breakdown follow the requested order.
 assert page.locator('.workspace').evaluate('el=>{const s=el.querySelector(".loan-summary"),c=el.querySelector("#controls > .controls"),g=el.querySelector(".plot"),b=el.querySelector(".loan-breakdown");return !!(s.compareDocumentPosition(c)&4)&&!!(c.compareDocumentPosition(g)&4)&&!!(g.compareDocumentPosition(b)&4)}')
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   page.emulate_media(color_scheme=theme);page.locator('#loan-reset').click()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,theme)
   assert page.locator('.equation-row').evaluate('el=>el.scrollWidth<=el.clientWidth')
   if width==390:page.screenshot(path='/tmp/amortization-'+theme+'.png',full_page=True)
 assert not errors,errors
 print('PASS: Finance/search, default summaries, year-zero chart endpoints and monotonic curves, annual breakdown/stacked bar, term clamping, zero interest, extremes, reset and responsive themes')
 browser.close()
