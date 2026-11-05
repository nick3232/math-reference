from playwright.sync_api import sync_playwright, expect
import json, os, shutil
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},permissions=['clipboard-read','clipboard-write'])
 page=context.new_page(); errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 base=os.environ.get('MATH_REFERENCE_URL', 'http://localhost:8000/')
 page.goto(base); assert page.locator('.card').count()==3
 page.locator('#search').fill('normal');assert page.locator('.card').count()==1
 page.get_by_role('button',name='Functions',exact=True).click();assert page.locator('.card').count()==0
 page.locator('#search').fill('');assert page.locator('.card').count()==1
 page.goto(base+'concept.html?concept=sigmoid')
 for name,value in [('steepness','-2'),('midpoint','3')]:
  before=page.locator('.curve').get_attribute('d');page.locator('#'+name).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',value);assert before!=page.locator('.curve').get_attribute('d')
 assert not page.locator('details').evaluate('(el)=>el.open')
 page.get_by_role('button',name='Copy equation').click();expect(page.locator('#copy-status')).to_have_text('Copied to clipboard')
 assert '-2' in page.evaluate('navigator.clipboard.readText()')
 page.screenshot(path='/tmp/math-sigmoid-mobile.png',full_page=True)
 page.evaluate("Object.defineProperty(navigator, 'clipboard', {value: {writeText: async () => {throw new Error('denied')}}})")
 page.get_by_role('button',name='Copy equation').click();expect(page.locator('.actions textarea')).to_be_visible();assert '-2' in page.locator('.actions textarea').input_value()
 page.goto(base+'concept.html?concept=normal')
 for name,value in [('mean','4'),('deviation','.3')]:
  before=page.locator('.curve').get_attribute('d');page.locator('#'+name).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input"))}',value);assert before!=page.locator('.curve').get_attribute('d')
 assert page.locator('.area').count()==1;assert '68.27%' in page.locator('#stat').inner_text()
 page.get_by_role('button',name='Copy equation').click();expect(page.locator('#copy-status')).to_have_text('Copied to clipboard');assert '0.3' in page.evaluate('navigator.clipboard.readText()')
 page.goto(base+'concept.html?concept=graph')
 assert page.locator('.vertex').count()==6
 page.get_by_role('button',name='Add vertex',exact=True).click();assert page.locator('.vertex').count()==7
 page.locator('#source').select_option('1');page.locator('#target').select_option('7');page.get_by_role('button',name='Add edge',exact=True).click();assert page.locator('[data-edge="1-7"]').count()==1
 page.get_by_role('button',name='Add edge',exact=True).click();assert 'already exists' in page.locator('#network-status').inner_text()
 page.locator('#target').select_option('1');page.get_by_role('button',name='Add edge',exact=True).click();assert 'different' in page.locator('#network-status').inner_text()
 node=page.locator('[data-id="7"]');before=node.get_attribute('transform');box=node.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(180,300);page.mouse.up();assert before!=page.locator('[data-id="7"]').get_attribute('transform')
 page.get_by_role('button',name='Copy graph data').click();expect(page.locator('#copy-status')).to_have_text('Copied to clipboard');data=json.loads(page.evaluate('navigator.clipboard.readText()'));assert len(data['vertices'])==7
 page.get_by_role('button',name='Remove selected').click();assert page.locator('.vertex').count()==6;assert page.locator('[data-edge="1-7"]').count()==0
 # Keyboard editing and explicit edge removal.
 node=page.locator('[data-id="1"]');node.focus();before=node.get_attribute('transform');page.keyboard.press('ArrowLeft');assert before!=page.locator('[data-id="1"]').get_attribute('transform')
 page.locator('#source').select_option('1');page.locator('#target').select_option('2');page.get_by_role('button',name='Add edge',exact=True).click()
 page.locator('[data-edge="1-2"]').focus();page.keyboard.press('Enter');page.get_by_role('button',name='Remove selected').click();assert page.locator('[data-edge="1-2"]').count()==0
 page.get_by_role('button',name='Randomize network').click();assert page.locator('.vertex').count()==6
 page.set_viewport_size({'width':320,'height':740})
 for scheme in ['light','dark']:
  page.emulate_media(color_scheme=scheme)
  for route in ['', 'concept.html?concept=sigmoid','concept.html?concept=normal','concept.html?concept=graph']:
   page.goto(base+route);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),route
 page.screenshot(path='/tmp/math-graph-mobile-dark.png',full_page=True)
 page.set_viewport_size({'width':1280,'height':900});page.goto(base);page.screenshot(path='/tmp/math-home-desktop.png',full_page=True)
 assert not errors, errors
 print('PASS: search, filters, curves, shading, clipboard, graph edits/drag/keyboard/export, mobile light/dark overflow, no JavaScript errors')
 browser.close()
