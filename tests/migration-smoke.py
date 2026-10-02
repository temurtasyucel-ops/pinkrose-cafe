"""Local HTTP smoke check against an isolated fake Supabase service; no real data."""
import subprocess, os, time, json, threading, urllib.request, urllib.error, uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
records, orders = {}, {}
class Mock(BaseHTTPRequestHandler):
 def log_message(self, *args): pass
 def out(self, data, status=200):
  self.send_response(status); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps(data).encode())
 def do_POST(self):
  data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  if self.path.startswith('/rest/v1/rpc/consume_rate_limit'): return self.out(True)
  if self.path.startswith('/rest/v1/records'):
   for row in data if isinstance(data, list) else [data]: records.setdefault(row['id'], row)
   return self.out(None, 201)
  if self.path.startswith('/rest/v1/orders'):
   orders.setdefault(data['request_key'], data); return self.out(None, 201)
  self.out({'error': 'unexpected'}, 500)
 def do_GET(self):
  if self.path.startswith('/rest/v1/records'): return self.out(list(records.values()))
  if self.path.startswith('/rest/v1/orders'):
   key=parse_qs(urlparse(self.path).query).get('request_key', [''])[0].removeprefix('eq.')
   return self.out([orders[key]] if key in orders else [])
  self.out({'error': 'unexpected'}, 500)
mock=HTTPServer(('127.0.0.1',3102),Mock); threading.Thread(target=mock.serve_forever,daemon=True).start()
env={**os.environ,'NEXT_PUBLIC_SUPABASE_URL':'http://127.0.0.1:3102','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'test-key','SUPABASE_SECRET_KEY':'test-secret','HTTP_PROXY':'','HTTPS_PROXY':'','http_proxy':'','https_proxy':''}
log=open('/tmp/pinkrose-migration-test.log','w')
p=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],env=env,stdout=log,stderr=log)
base='http://127.0.0.1:3101'
def call(path,data=None,origin=base):
 req=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers={'Content-Type':'application/json','Origin':origin})
 try: r=urllib.request.urlopen(req,timeout=15)
 except urllib.error.HTTPError as e: r=e
 body=r.read(); return r.status,json.loads(body) if r.headers.get('Content-Type','').startswith('application/json') else body
try:
 for _ in range(50):
  try:
   if call('/')[0]==200: break
  except Exception: time.sleep(.1)
 assert '2–3 gün'.encode() in call('/')[1]
 assert call('/panel/login')[0]==200
 assert b'noindex' in call('/panel/login')[1]
 assert b'https://www.pinkrosecafe.com.tr' in call('/sitemap.xml')[1]
 assert b'Disallow: /panel' in call('/robots.txt')[1]
 assert call('/missing-page')[0]==404
 assert call('/api/admin')[0]==401
 assert call('/api/upload',{})[0]==401
 status,c=call('/api/catalog'); assert status==200 and len(c['products'])==7,(status,c)
 assert '2–3 gün' in c['settings']['preparationText']
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
 status,nine=call('/api/orders',seasonal_body);assert status==200 and nine['total']==126000,(status,nine)
 records['packages']['data']['tastingIds']=['cookie-1','cookie-2',pumpkin,'cookie-4','cookie-5','cookie-6','cookie-7']
 records['cookie-3']['data']['active']=False
 seasonal_body['items']=[{'id':id,'qty':1} for id in records['packages']['data']['tastingIds']]
 seasonal_body['key']=str(uuid.uuid4())
 status,seasonal=call('/api/orders',seasonal_body);assert status==200 and seasonal['total']==100000,(status,seasonal)
 records[pumpkin]['data']['boxEligible']=False
 seasonal_body['key']=str(uuid.uuid4());seasonal_body['items']=[{'id':pumpkin,'qty':8}]
 status,excluded=call('/api/orders',seasonal_body);assert status==200 and excluded['total']==128000,(status,excluded)
 records['cookie-1']['data']['active']=False
 assert call('/api/orders',{**body,'key':str(uuid.uuid4())})[0]==400
 print('PASS: paused live/demo requests, no insert while paused, previous retry, reopening, live/demo mode, retry after mode switch, inactive product rejection, catalog, server pricing, idempotency, delivery quotes, city validation, CSRF, anonymous admin/upload rejection.')
finally:
 p.terminate(); p.wait(timeout=10); mock.shutdown(); log.close()
