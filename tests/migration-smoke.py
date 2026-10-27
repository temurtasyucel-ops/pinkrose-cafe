"""Local HTTP smoke check against an isolated fake Supabase service; no real data."""
import subprocess, os, time, json, threading, urllib.request, urllib.error, uuid, base64, datetime
from concurrent.futures import ThreadPoolExecutor
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
records, orders = {}, {}
faults={'order_save':False}
class Mock(BaseHTTPRequestHandler):
 def do_PATCH(self):
  print('MOCK PATCH',self.path,flush=True)
  data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  query=parse_qs(urlparse(self.path).query); key=query['id'][0].removeprefix('eq.')
  target=records if self.path.startswith('/rest/v1/records') else {row['id']:row for row in orders.values()}
  row=target.get(key); updated=[]
  if row and ('data' not in query or row['data']==json.loads(query['data'][0].removeprefix('eq.'))):
   row.update(data); updated=[row]
  self.out(updated[0] if len(updated)==1 and 'vnd.pgrst.object' in self.headers.get('Accept','') else updated)
 def log_message(self, *args): pass
 def out(self, data, status=200):
  self.send_response(status); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps(data).encode())
 def do_POST(self):
  print('MOCK POST',self.path,'PREFER',self.headers.get('Prefer'),flush=True)
  if self.path.startswith('/storage/v1/object/'):
   self.rfile.read(int(self.headers.get('Content-Length','0')))
   return self.out({'statusCode':'500','error':'StorageError','message':'PRIVATE-STORAGE-BACKEND-DETAIL'},500)
  data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  if self.path.startswith('/rest/v1/rpc/consume_rate_limit'): return self.out(True)
  if self.path.startswith('/rest/v1/records'):
   for row in data if isinstance(data, list) else [data]:
    if row['id'] in records:
     if 'resolution=ignore-duplicates' in self.headers.get('Prefer',''): continue
     if 'on_conflict' not in self.path:return self.out({'code':'23505','message':'duplicate'},409)
    records[row['id']]=row
   return self.out(None, 201)
  if self.path.startswith('/rest/v1/orders'):
   if faults['order_save']:return self.out({'code':'23503','message':'PRIVATE-DIAGNOSTIC-CUSTOMER-TOKEN'},500)
   orders.setdefault(data['request_key'], data); return self.out(None, 201)
  self.out({'error': 'unexpected'}, 500)
 def do_GET(self):
  print('MOCK GET',self.path,flush=True)
  if self.path.startswith('/auth/v1/user'):return self.out({'id':'11111111-1111-4111-8111-111111111111','aud':'authenticated','role':'authenticated','email':'test@example.invalid','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'})
  if self.path.startswith('/rest/v1/admin_users'):return self.out([{'user_id':'11111111-1111-4111-8111-111111111111'}])
  if self.path.startswith('/rest/v1/records'):
   q=parse_qs(urlparse(self.path).query); rows=list(records.values())
   for key in ['id','kind']:
    for rule in q.get(key,[]):
     if rule.startswith('eq.'): rows=[r for r in rows if r[key]==rule[3:]]
     elif rule.startswith('in.('): rows=[r for r in rows if r[key] in rule[4:-1].split(',')]
   if q.get('data->>published')==['eq.true']: rows=[r for r in rows if r['data'].get('published') is True]
   return self.out(rows)
  if self.path.startswith('/rest/v1/orders'):
   q=parse_qs(urlparse(self.path).query); rows=list(orders.values())
   for key in ['id','request_key']:
    if key in q:rows=[r for r in rows if r[key]==q[key][0].removeprefix('eq.')]
   if 'data->>trackingToken' in q:rows=[r for r in rows if r['data'].get('trackingToken')==q['data->>trackingToken'][0].removeprefix('eq.')]
   offset=int(q.get('offset',['0'])[0]); limit=int(q.get('limit',['1000'])[0]); return self.out(rows[offset:offset+limit])
  self.out({'error': 'unexpected'}, 500)
mock=HTTPServer(('127.0.0.1',3102),Mock); threading.Thread(target=mock.serve_forever,daemon=True).start()
env={**os.environ,'NEXT_PUBLIC_SUPABASE_URL':'http://127.0.0.1:3102','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'test-key','SUPABASE_SECRET_KEY':'test-secret','HTTP_PROXY':'','HTTPS_PROXY':'','http_proxy':'','https_proxy':''}
log=open('/tmp/pinkrose-migration-test.log','w')
p=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],env=env,stdout=log,stderr=log)
base='http://127.0.0.1:3101'
def encoded(v):return base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
token=encoded({'alg':'HS256','typ':'JWT'})+'.'+encoded({'sub':'11111111-1111-4111-8111-111111111111','aud':'authenticated','role':'authenticated','exp':int(time.time())+3600,'iat':int(time.time()),'iss':'http://127.0.0.1:3102/auth/v1'})+'.c2lnbmF0dXJl'
cookie='sb-127-auth-token=base64-'+encoded({'access_token':token,'refresh_token':'test-only','expires_at':int(time.time())+3600,'token_type':'bearer','user':{'id':'11111111-1111-4111-8111-111111111111'}})
def call(path,data=None,origin=base,admin=False):
 req=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers={'Content-Type':'application/json','Origin':origin,**({'Cookie':cookie} if admin else {})})
 try: r=urllib.request.urlopen(req,timeout=15)
 except urllib.error.HTTPError as e: r=e
 body=r.read(); return r.status,json.loads(body) if r.headers.get('Content-Type','').startswith('application/json') else body
try:
 for _ in range(50):
  try:
   if call('/')[0]==200: break
  except Exception: time.sleep(.1)
 status,home_page=call('/'); assert status==200 and b'Pink Rose Cafe' in home_page
 response=urllib.request.urlopen(base+'/',timeout=15)
 assert response.headers.get('X-Content-Type-Options')=='nosniff'
 assert response.headers.get('X-Frame-Options')=='DENY'
 assert response.headers.get('Strict-Transport-Security')=='max-age=63072000'
 assert response.headers.get('Permissions-Policy')=='camera=(), microphone=(), geolocation=()'
 assert call('/panel/login')[0]==200
 assert b'noindex' in call('/panel/login')[1]
 assert b'https://www.pinkrosecafe.com.tr' in call('/sitemap.xml')[1]
 assert b'Disallow: /panel' in call('/robots.txt')[1]
 assert call('/missing-page')[0]==404
 assert call('/api/admin')[0]==401
 assert call('/api/upload',{})[0]==401
 status,c=call('/api/catalog'); assert status==200 and len(c['products'])==9,(status,c)
 now=datetime.datetime.now(datetime.timezone.utc)
 future=(now+datetime.timedelta(days=1)).isoformat()
 past=(now-datetime.timedelta(days=1)).isoformat()
 campaign_rows=[
  ('campaign-inactive',{'id':'campaign-inactive','title':'Hidden inactive','text':'test','discount':50,'start':'','end':'','active':False}),
  ('campaign-future',{'id':'campaign-future','title':'Hidden future','text':'test','discount':50,'start':future,'end':'','active':True}),
  ('campaign-expired',{'id':'campaign-expired','title':'Hidden expired','text':'test','discount':50,'start':'','end':past,'active':True}),
  ('campaign-live',{'id':'campaign-live','title':'Visible live','text':'test','discount':10,'start':past,'end':future,'active':True}),
 ]
 for campaign_id,campaign in campaign_rows: records[campaign_id]={'id':campaign_id,'kind':'campaign','data':campaign}
 status,public_catalog=call('/api/catalog')
 assert status==200 and [x['title'] for x in public_catalog['campaigns']]==['Visible live'],public_catalog['campaigns']
 status,admin_catalog=call('/api/admin',admin=True)
 assert status==200 and {x['title'] for x in admin_catalog['campaigns']}=={'Hidden inactive','Hidden future','Hidden expired','Visible live'},admin_catalog.get('campaigns')
 c=public_catalog
 status,health=call('/api/health'); assert status==200 and health=={'status':'ok'},(status,health)

 # Dedicated routes use the same live catalog and expose their own canonical metadata.
 for route in ['/kurabiyeler','/kutunu-olustur','/kutlama-etkinlik','/hikayemiz']:
  status,page=call(route); assert status==200,(route,status)
  assert ('https://www.pinkrosecafe.com.tr'+route).encode() in page
 home=call('/')[1]; assert home.count(b'<article class="product"')==3
 menu=call('/kurabiyeler')[1]; assert menu.count(b'<article class="product"')==9
 status,detail=call('/kurabiyeler/kara-sevda'); assert status==200
 assert b'kara-sevda-dis.webp' in detail and b'kara-sevda-ic.webp' in detail and b'170' in detail
 assert call('/kurabiyeler/olmayan-urun')[0]==404
 assert call('/kurabiyeler/pamuk-prenses')[0]==200 # follows canonical redirect
 records['cookie-3']['data']['active']=False
 assert call('/kurabiyeler/kara-sevda')[0]==404
 assert b'/kurabiyeler/kara-sevda' not in call('/sitemap.xml')[1]
 records['cookie-3']['data']['active']=True
 assert b'/kurabiyeler/kara-sevda' in call('/sitemap.xml')[1]
 print('PASS: dedicated routes and canonical metadata, three home previews, full menu, product photos, aliases, 404 and inactive-product sitemap exclusion.')

 # Both new flavours are orderable without photos and share the editable discount.
 by_id={product['id']:product for product in c['products']}
 for id,name in [('cookie-8','Şirine'),('cookie-9','Gönülçelen')]:
  product=by_id[id]
  assert product['name']==name and product['active'] and product['stock']
  assert product['boxEligible'] and product['seasonal'] is False
  assert product['price']==by_id['cookie-1']['price'] and product['weight']==by_id['cookie-1']['weight']
  assert product['image']=='' and product['insideImage']=='' and product['calories'] is None
 assert 'Limonlu dolgu' in by_id['cookie-8']['ingredients'] and 'Nutella' not in by_id['cookie-8']['ingredients']
 assert 'ceviz' in by_id['cookie-9']['ingredients'] and 'Elmalı tarçınlı dolgu' in by_id['cookie-9']['ingredients']
 new_order={'key':str(uuid.uuid4()),'customer':'New Flavour Test','phone':'05060584705','type':'Gel-al','items':[{'id':'cookie-8','qty':1},{'id':'cookie-9','qty':1}]}
 status,new=call('/api/orders',new_order); assert status==200 and new['total']==30000,(status,new)
 # Current clients reject stale reviewed prices; existing request keys still return their saved result.
 before_quote=len(orders)
 status,stale=call('/api/orders',{**new_order,'key':str(uuid.uuid4()),'quote':'stale-pricing'})
 assert status==409 and len(orders)==before_quote and stale['reference'].startswith('PRERR-'),(status,stale)
 assert call('/api/orders',{**new_order,'quote':'stale-pricing'})[1]==new
 live_catalog=call('/api/catalog')[1]
 quote_items=[[i['id'],i['qty'],next(p['price'] for p in live_catalog['products'] if p['id']==i['id']),True] for i in sorted(new_order['items'],key=lambda i:i['id'])]
 quote=json.dumps({'items':quote_items,'bulk':live_catalog['bulkPricing'],'campaign':0,'delivery':[False,0],'demo':live_catalog['settings']['demo']},ensure_ascii=False,separators=(',',':'))
 retry_key=str(uuid.uuid4()); retry_order={**new_order,'key':retry_key,'quote':quote}
 faults['order_save']=True
 status,failed=call('/api/orders',retry_order)
 assert status==503 and retry_key not in orders and failed['reference'].startswith('PRERR-'),(status,failed)
 assert 'PRIVATE-DIAGNOSTIC' not in json.dumps(failed)
 faults['order_save']=False
 status,retried=call('/api/orders',retry_order); assert status==200,(status,retried)
 assert call('/api/orders',{**retry_order,'quote':'changed-after-save'})[1]==retried
 print('PASS: stale quote blocks inserts, diagnostic reference hides database details, and retries preserve the saved order.')
 assert all(name in new['whatsappMessage'] for name in ['Şirine','Gönülçelen'])
 mixed_order={**new_order,'key':str(uuid.uuid4()),'items':[{'id':'cookie-1','qty':1},{'id':'cookie-8','qty':1}]}
 assert call('/api/orders',mixed_order)[1]['total']==30000
 records['cookie-8']['data']['price']=18000
 assert next(p for p in call('/api/catalog')[1]['products'] if p['id']=='cookie-8')['price']==18000
 records['cookie-8']['data']['price']=17000
 assert len([r for r in records.values() if r['kind']=='product'])==9
 # Updated panel name must already be in server HTML, before client hydration.
 records['cookie-9']['data']['name']='Gönülçelen Özel'
 assert 'Gönülçelen Özel'.encode() in call('/')[1]
 records['cookie-9']['data']['name']='Gönülçelen'
 # Gift fields survive persistence, WhatsApp and retry; malformed gifts do not insert.
 gift_key=str(uuid.uuid4())
 gift={'recipient':'Alıcı Test','phone':'05060584705','message':'İyi ki doğdun!'}
 status,gifted=call('/api/orders',{**new_order,'key':gift_key,'gift':gift})
 assert status==200 and orders[gift_key]['data']['gift']==gift,(status,gifted)
 assert all(x in gifted['whatsappMessage'] for x in ['Alıcı Test','İyi ki doğdun!','Hediye siparişi'])
 assert call('/api/orders',{**new_order,'key':gift_key,'gift':{'recipient':'Değişen'}})[1]==gifted
 before_gift=len(orders)
 assert call('/api/orders',{**new_order,'key':str(uuid.uuid4()),'gift':{'recipient':'A'}})[0]==400
 assert len(orders)==before_gift
 # End date is enforced server-side, including on mixed orders.
 records['cookie-8']['data']['lastOrderDate']='2020-01-01'
 assert call('/api/orders',{**new_order,'key':str(uuid.uuid4())})[0]==400
 records['cookie-8']['data'].pop('lastOrderDate')
 # Insights accept only bounded, anonymous event fields. Public catalog does not leak them.
 assert call('/api/insights',{'event':'product_view','productId':'cookie-1','quantity':1,'customer':'Must not persist'})[0]==204
 insight=next(r['data'] for r in records.values() if r['kind']=='insight')
 assert set(insight)=={'event','productId','quantity','day'}
 for event in ['checkout_start','checkout_exit']:
  assert call('/api/insights',{'event':event,'productId':'cookie-1','customer':'Must not persist','quantity':1})[0]==204
  entry=next(r['data'] for r in records.values() if r['kind']=='insight' and r['data']['event']==event)
  assert set(entry)=={'event','quantity','day'},entry
 assert call('/api/insights',{'event':'payment','quantity':1})[0]==400
 records['review-test']={'id':'review-test','kind':'review','data':{'id':'review-test','orderId':'private-id','name':'İpek Ş.','text':'Harika bir kurabiye.','rating':5,'published':True,'consent':True}}
 status,public=call('/api/catalog');assert status==200 and len(public['reviews'])==1
 assert set(public['reviews'][0])=={'id','name','text','rating'}
 records.pop('review-test')
 # No live inquiries while demo/paused; live inquiry does not create an order.
 inquiry={'customer':'Etkinlik Test','phone':'05060584705','occasion':'Doğum günü','quantity':30,'date':'','note':'Not'}
 assert call('/api/inquiries',inquiry)[0]==400
 records['settings']['data']['demo']=False
 before_inquiry=len(orders)
 assert call('/api/inquiries',inquiry)[0]==200 and len(orders)==before_inquiry
 assert any(r['kind']=='inquiry' and r['data']['quantity']==30 for r in records.values())
 records['settings']['data']['demo']=True
 assert call('/api/admin',{'kind':'review','data':{} })[0]==401
 assert call('/api/inquiries',inquiry,origin='https://other.example')[0]==400
 print('PASS: live SSR names, gift persistence/retries/validation, expired products, anonymous insights, private fields, verified review projection and separate group inquiries.')
 orders.clear()
 print('PASS: both new flavours, missing photos, mixed discounts, WhatsApp names and preserved panel edits.')
 assert '2–3 gün' in c['settings']['preparationText']
 records['packages']['data']['tastingPrice']=1
 records['packages']['data']['tastingIds']=['cookie-'+str(i) for i in range(1,8)]
 status,cleaned=call('/api/catalog')
 assert status==200 and set(records['packages']['data'])=={'packages','bulkPricing'} and 'tastingPrice' not in cleaned
 assert [p['price'] for p in cleaned['packages']]==[30000,60000,90000,120000]
 seven_body={'key':str(uuid.uuid4()),'customer':'Box Test','phone':'05060584705','type':'Gel-al','items':[{'id':'cookie-'+str(i),'qty':1} for i in range(1,8)]}
 status,seven=call('/api/orders',seven_body);assert status==200 and seven['total']==105000,(status,seven)
 records['packages']['data']['bulkPricing']={'minQty':3,'unitPrice':14000}
 assert call('/api/orders',{**seven_body,'key':str(uuid.uuid4()),'items':[{'id':'cookie-1','qty':2}]})[1]['total']==34000
 assert call('/api/orders',{**seven_body,'key':str(uuid.uuid4()),'items':[{'id':'cookie-1','qty':3}]})[1]['total']==42000
 records['packages']['data']['bulkPricing']={'minQty':2,'unitPrice':15000}
 orders.clear()
 assert '170°C' in c['settings']['heatingInfo']
 records['settings']['data']['preparationText']='Özel hazırlık süresi'
 assert call('/api/catalog')[1]['settings']['preparationText']=='Özel hazırlık süresi'
 key=str(uuid.uuid4()); body={'key':key,'customer':'Test Customer','phone':'05060584705','type':'Gel-al','date':'Pazar 15.00','note':'Hediye','items':[{'id':'cookie-1','qty':2,'price':1}]}
 status,o=call('/api/orders',body); assert status==200 and o['total']==30000 and o['demo'] is True,(status,o)
 assert all(x in o['whatsappMessage'] for x in ['2 × Gülpembe','Pazar 15.00','Hediye','Telefon:'])
 status,again=call('/api/orders',{**body,'items':[{'id':'cookie-1','qty':8}]}); assert again==o and len(orders)==1,(status,again)
 status,o=call('/api/orders',{**body,'key':str(uuid.uuid4()),'type':'Teslimat','city':'İzmir','address':'Test delivery address'}); assert status==200 and o['deliveryFeePending'] and o['total']==30000,(status,o)
 assert call('/api/orders',{**body,'key':str(uuid.uuid4()),'type':'Teslimat','city':'Ankara','address':'Test delivery address'})[0]==400
 assert call('/api/orders',body,origin='https://other.example')[0]==400
 assert call('/api/images/invalid')[0]==404
 records['settings']['data']['demo']=False
 live_key=str(uuid.uuid4())
 status,live=call('/api/orders',{**body,'key':live_key})
 assert status==200 and live['demo'] is False and orders[live_key]['data']['demo'] is False,(status,live)
 records['settings']['data']['demo']=True
 assert call('/api/orders',{**body,'key':live_key})[1]==live
 records['settings']['data']['ordersPaused']=True
 records['settings']['data']['pauseMessage']='Bugün kapasitemiz doldu.'
 before=len(orders)
 status,paused=call('/api/orders',{**body,'key':str(uuid.uuid4())})
 assert status==409 and paused['error']=='Bugün kapasitemiz doldu.' and len(orders)==before,(status,paused)
 assert call('/api/orders',{**body,'key':live_key})[1]==live
 records['settings']['data']['demo']=False
 assert call('/api/orders',{**body,'key':str(uuid.uuid4())})[0]==409
 records['settings']['data']['ordersPaused']=False
 assert call('/api/orders',{**body,'key':str(uuid.uuid4())})[0]==200
 pumpkin=str(uuid.uuid4())
 records[pumpkin]={'id':pumpkin,'kind':'product','data':{**records['cookie-3']['data'],'id':pumpkin,'name':'Bal Kabaklı','boxEligible':True}}
 seasonal_body={**body,'key':str(uuid.uuid4()),'items':[{'id':pumpkin,'qty':9}]}
 status,nine=call('/api/orders',seasonal_body);assert status==200 and nine['total']==135000,(status,nine)
 records['cookie-3']['data']['active']=False
 seasonal_body['items']=[{'id':id,'qty':1} for id in ['cookie-1','cookie-2',pumpkin,'cookie-4','cookie-5','cookie-6','cookie-7']]
 seasonal_body['key']=str(uuid.uuid4())
 status,seasonal=call('/api/orders',seasonal_body);assert status==200 and seasonal['total']==105000,(status,seasonal)
 records[pumpkin]['data']['boxEligible']=False
 seasonal_body['key']=str(uuid.uuid4());seasonal_body['items']=[{'id':pumpkin,'qty':8}]
 status,excluded=call('/api/orders',seasonal_body);assert status==200 and excluded['total']==136000,(status,excluded)
 records['cookie-1']['data']['active']=False
 assert call('/api/orders',{**body,'key':str(uuid.uuid4())})[0]==400
 english_key=str(uuid.uuid4())
 english_body={**body,'key':english_key,'language':'en','type':'Teslimat','city':'İzmir','address':'Example street 10','items':[{'id':'cookie-2','qty':2}]}
 status,en=call('/api/orders',english_body)
 assert status==200 and orders[english_key]['data']['language']=='en',(status,en)
 assert all(x in en['whatsappMessage'] for x in ['Hello Pink Rose','2 × Aşk Dediğin','Address: Example street 10','delivery excluded','bank details'])
 assert call('/api/orders',{**english_body,'language':'tr'})[1]==en
 print('PASS: English orders persist their language and full WhatsApp details; retry keeps the original order.')
 print('PASS: paused live/demo requests, no insert while paused, previous retry, reopening, live/demo mode, retry after mode switch, inactive product rejection, catalog, server pricing, idempotency, delivery quotes, city validation, CSRF, anonymous admin/upload rejection.')
 # New calendar, capacity, admin and customer tracking integration.
 records['cookie-1']['data']['active']=True
 records['settings']['data']['demo']=False
 records['settings']['data']['ordersPaused']=False
 orders.clear(); records.pop('order-calendar',None)
 status,admin_state=call('/api/admin',admin=True);assert status==200,(status,admin_state)
 today=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=3))).date()
 day=(today+datetime.timedelta(days=3)).isoformat(); next_day=(today+datetime.timedelta(days=4)).isoformat(); closed=(today+datetime.timedelta(days=5)).isoformat()
 def configure(limit,closed_days):
  revision=call('/api/catalog')[1]['calendar']['revision']
  return call('/api/admin',{'kind':'calendar','data':{'config':{'dailyLimit':limit,'closedDates':closed_days},'expected':revision}},admin=True)
 assert configure(4,[closed])[0]==200
 # No undated or closed-day bypass, including direct API requests.
 request={**body,'date':'','preferredDate':day,'preferredTime':'15:00','key':str(uuid.uuid4()),'items':[{'id':'cookie-1','qty':2}]}
 assert call('/api/orders',{**request,'preferredDate':''})[0]==400
 assert call('/api/orders',{**request,'preferredDate':closed})[0]==400
 assert call('/api/orders',{k:v for k,v in request.items() if k not in ['preferredDate','preferredTime']})[0]==400
 # Concurrent requests compete for the last places through compare-and-swap.
 requests=[{**request,'key':str(uuid.uuid4())} for _ in range(4)]
 with ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(lambda b:call('/api/orders',b),requests))
 assert sum(status==200 for status,_ in results)==2,results
 assert call('/api/catalog')[1]['calendar']['booked'][day]==4
 success=next(result for status,result in results if status==200)
 path=success['trackingPath']; tracking_token=path.split('/')[-1]
 assert len(tracking_token)==64 and call(path)[0]==200
 assert b'noindex' in call(path)[1]
 assert path.encode() not in call('/sitemap.xml')[1]
 assert call('/api/order-status',{'token':'PR-TEST'})[0]==404
 assert call('/api/order-status',{'token':'f'*64})[0]==404
 status,tracked=call('/api/order-status',{'token':tracking_token});assert status==200
 assert set(tracked)=={'number','status','confirmedAt','preferredDate','preferredTimeLabel','type','city','items','total','deliveryFeePending','demo','language'}
 assert not any(v in json.dumps(tracked) for v in ['Test Customer','05060584705','Hediye'])
 assert call('/api/order-status',{'token':tracking_token},origin='https://other.example')[0]==400
 saved=next(r['data'] for r in orders.values() if r['data']['number']==success['number'])
 saved_key=saved['id']
 assert call('/api/orders',{**request,'key':saved_key})[1]==success
 assert call('/api/catalog')[1]['calendar']['booked'][day]==4
 assert call('/api/admin',{'kind':'status','data':{'id':saved_key,'status':'İptal','expected':'Onay bekliyor'}},admin=True)[0]==200
 assert call('/api/catalog')[1]['calendar']['booked'][day]==2
 assert call('/api/order-status',{'token':tracking_token})[1]['status']=='İptal'
 # Reopening reserves capacity; moving transfers it and closed dates reject.
 assert call('/api/admin',{'kind':'status','data':{'id':saved_key,'status':'Onay bekliyor','expected':'İptal'}},admin=True)[0]==200
 assert call('/api/admin',{'kind':'schedule','data':{'id':saved_key,'value':closed+'T15:00','expected':''}},admin=True)[0]==400
 assert call('/api/admin',{'kind':'schedule','data':{'id':saved_key,'value':next_day+'T15:00','expected':''}},admin=True)[0]==200
 totals=call('/api/catalog')[1]['calendar']['booked'];assert totals[day]==2 and totals[next_day]==2,totals
 tracked=call('/api/order-status',{'token':tracking_token})[1];assert tracked['confirmedAt'].startswith(next_day)
 # Unavailable date rejection doesn't mutate order; stale revisions cannot overwrite.
 assert call('/api/admin',{'kind':'calendar','data':{'config':{'dailyLimit':1,'closedDates':[]},'expected':-1}},admin=True)[0]==400
 assert configure(1,[])[0]==200
 assert call('/api/orders',{**request,'key':str(uuid.uuid4())})[0]==400
 assert call('/api/admin',{'kind':'calendar-repair','data':{}},admin=True)[0]==200
 assert 'bookings' not in call('/api/catalog')[1]['calendar']
 print('PASS: authenticated calendar configuration; simultaneous admissions capped; closed/undated bypass blocked; retry, cancel, reopen, reschedule and stale revision checks; private tracking projection, invalid tokens, CSRF and noindex.')
 # Only the fake storage endpoint is used; no production files are created.
 boundary='pinkrose-local-test'
 image=b'\x89PNG\r\n\x1a\n'
 multipart=('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="private-name.png"\r\nContent-Type: image/png\r\n\r\n').encode()+image+('\r\n--'+boundary+'--\r\n').encode()
 req=urllib.request.Request(base+'/api/upload',data=multipart,headers={'Content-Type':'multipart/form-data; boundary='+boundary,'Origin':base,'Cookie':cookie})
 try: upload_result=urllib.request.urlopen(req,timeout=15)
 except urllib.error.HTTPError as e: upload_result=e
 upload_error=json.loads(upload_result.read())
 assert upload_result.status==503 and upload_error['reference'].startswith('PRERR-'),upload_error
 log.flush()
 with open('/tmp/pinkrose-migration-test.log') as diagnostic_log: diagnostic_text=diagnostic_log.read()
 assert 'PRIVATE-DIAGNOSTIC-CUSTOMER-TOKEN' not in diagnostic_text and 'PRIVATE-STORAGE-BACKEND-DETAIL' not in diagnostic_text and 'private-name.png' not in diagnostic_text
 assert failed['reference'] in diagnostic_text and upload_error['reference'] in diagnostic_text
 print('PASS: upload and order failures correlate with sanitized logs without private filenames or backend messages.')
except Exception:
 log.flush()
 try:
  with open('/tmp/pinkrose-migration-test.log') as diagnostic_log: print('SMOKE SERVER LOG:\\n'+diagnostic_log.read()[-12000:])
 except Exception as log_error: print('Could not read smoke log:',log_error)
 raise
finally:
 p.terminate(); p.wait(timeout=10); mock.shutdown(); log.close()
