from playwright.sync_api import sync_playwright, expect
import os,shutil
base=os.environ.get('MATH_REFERENCE_URL','http://localhost:8000/')
edges=['AB','AC','BC','BD','BE','CD','CE','DE','DF','EF']
weights=[[4,2,1,5,8,9,7,2,6,3],[2,8,7,2,9,4,2,8,2,7],[2,2,5,3,3,8,3,5,3,3]]
def oracle(config,destination):
 candidates=[]
 def visit(route,cost):
  if route[-1]==destination:candidates.append((cost,route));return
  for edge,weight in zip(edges,weights[config]):
   if route[-1] in edge:
    node=edge.replace(route[-1],'')
    if node not in route:visit(route+node,cost+weight)
 visit('A',0);cost=min(c[0] for c in candidates)
 return cost,sorted(route for c,route in candidates if c==cost)
def route_edges(route):return {''.join(sorted(pair)) for pair in zip(route,route[1:])}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('.card')).to_have_count(25)
 page.get_by_role('button',name='Graph Theory',exact=True).click();expect(page.locator('.card')).to_have_count(2)
 page.locator('#search').fill('Shortest Path');page.locator('.card').click();expect(page.locator('h1')).to_have_text('Shortest Path')
 assert page.locator('input,select').count()==0 and page.locator('button').count()==7
 assert page.locator('[data-sp-node]').count()==6 and page.locator('[data-sp-edge]').count()==10
 assert page.locator('[data-sp-node] text').all_text_contents()==list('ABCDEF')
 layout=page.locator('[data-sp-node]').evaluate_all('(els)=>els.map(el=>el.getAttribute("transform"))')
 lines=page.locator('[data-sp-edge]').evaluate_all('(els)=>els.map(el=>["x1","y1","x2","y2"].map(a=>el.getAttribute(a)))')
 assert not page.locator('details.info').evaluate('el=>el.open')
 def check(config,destination):
  cost,routes=oracle(config,destination);primary=route_edges(routes[0]);alternative=route_edges(routes[1]) if len(routes)>1 else set()
  expect(page.locator('#sp-config-label')).to_have_text(f'Weight Configuration {config+1} of 3')
  expect(page.locator('#sp-cost')).to_have_text(str(cost));expect(page.locator('#sp-connections')).to_have_text(str(len(routes[0])-1))
  expect(page.locator('#sp-route')).to_have_text(' → '.join(routes[0]))
  expect(page.locator(f'[data-sp-destination="{destination}"]')).to_have_attribute('aria-pressed','true')
  assert page.locator('[data-sp-destination][aria-pressed=true]').count()==1
  assert page.locator('[data-sp-weight]').all_text_contents()==[str(w) for w in weights[config]]
  assert page.locator('[data-sp-node]').evaluate_all('(els)=>els.map(el=>el.getAttribute("transform"))')==layout
  assert page.locator('[data-sp-edge]').evaluate_all('(els)=>els.map(el=>["x1","y1","x2","y2"].map(a=>el.getAttribute(a)))')==lines
  highlighted=set(page.locator('.sp-edge.sp-primary').evaluate_all('(els)=>els.map(el=>el.dataset.spEdge)'));assert highlighted==primary
  dashed=set(page.locator('.sp-edge.sp-alternative').evaluate_all('(els)=>els.map(el=>el.dataset.spEdge)'));assert dashed==alternative-primary
  assert page.locator('.sp-primary.sp-alternative').count()==0
  w=dict(zip(edges,weights[config]));summation=lambda route:' + '.join(str(w[''.join(sorted(pair))]) for pair in zip(route,route[1:]))+f' = {cost}'
  expect(page.locator('#sp-sum')).to_have_text(summation(routes[0]))
  assert page.locator('#sp-alternative-section').is_visible()==(len(routes)>1)
  assert page.locator('#sp-legend').is_visible()==(len(routes)>1)
  if len(routes)>1:
   expect(page.locator('#sp-count')).to_have_text(f'{len(routes)} equally optimal routes');expect(page.locator('#sp-alternative')).to_have_text('Alternative: '+' → '.join(routes[1]));expect(page.locator('#sp-alternative-sum')).to_have_text(summation(routes[1]))
   for edge in dashed:assert page.locator('[data-sp-edge="'+edge+'"]').evaluate('el=>getComputedStyle(el).strokeDasharray')!='none'
 check(0,'F')
 for config in range(3):
  for destination in 'BCDEF':
   page.locator(f'[data-sp-destination="{destination}"]').tap();check(config,destination)
  page.locator('#sp-shuffle').tap();check((config+1)%3,'F')
 page.locator('#sp-shuffle').tap();check(1,'F')
 page.locator('[data-sp-destination="C"]').tap();page.locator('#sp-shuffle').tap();check(2,'C')
 page.locator('#sp-reset').tap();check(0,'F')
 for theme in ['light','dark']:
  page.emulate_media(color_scheme=theme)
  for width in [320,390,768,1280]:
   page.set_viewport_size({'width':width,'height':844})
   for config in range(3):
    check(config,'F');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    bounds=page.locator('.plot').bounding_box()
    for label in page.locator('.sp-node text,.sp-weight text').all():
     box=label.bounding_box();assert bounds['x']<=box['x'] and box['x']+box['width']<=bounds['x']+bounds['width'];assert bounds['y']<=box['y'] and box['y']+box['height']<=bounds['y']+bounds['height']
    if width==390:page.screenshot(path=f'/tmp/shortest-path-{theme}-{config}.png',full_page=True)
    page.locator('#sp-shuffle').click()
 page.goto(base+'concept.html?concept=graph');page.locator('details.info summary').click();page.get_by_role('link',name='Shortest Path',exact=True).click();expect(page.locator('h1')).to_have_text('Shortest Path')
 # Native buttons retain keyboard activation.
 page.locator('[data-sp-destination="B"]').focus();page.keyboard.press('Enter');check(0,'B')
 page.locator('#sp-shuffle').focus();page.keyboard.press('Space');check(1,'B')
 assert not errors,errors
 browser.close()
 print('PASS: all weights/destinations verified against exhaustive search; fixed layout, route sums, primary/alternative edges, shared-edge treatment, cycle/preserved destination/reset, keyboard/touch buttons, search/related links, responsive themes; no JS errors')
