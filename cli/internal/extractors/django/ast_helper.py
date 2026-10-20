import ast,json,os,sys,re
METHODS={'GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'}
def dotted(n):
 if isinstance(n,ast.Name):return n.id
 if isinstance(n,ast.Attribute):
  p=dotted(n.value);return (p+'.' if p else '')+n.attr
def sval(n,c,seen=None):
 seen=set() if seen is None else seen
 if isinstance(n,ast.Constant) and isinstance(n.value,str):return n.value
 if isinstance(n,ast.Name) and n.id not in seen and n.id in c:return sval(c[n.id],c,seen|{n.id})
 if isinstance(n,ast.BinOp) and isinstance(n.op,ast.Add):
  a,b=sval(n.left,c,seen),sval(n.right,c,seen)
  if a is not None and b is not None:return a+b
def join(*xs):
 ys=[x for x in xs if x not in (None,'')];return '/'+'/'.join(x.strip('/') for x in ys if x.strip('/')) if ys else '/'
def repath(value):
 value=value.strip()
 if value.startswith('^'):value=value[1:]
 if value.endswith('$'):value=value[:-1]
 value=re.sub(r'\(\?P<([A-Za-z_][A-Za-z0-9_]*)>[^)]*\)',r'{\1}',value)
 if any(x in value for x in ('(',')','[',']','|','*','+','?','\\')):return None
 return value
def argstr(n,c):return sval(n,c)
def methods(n,c):
 if isinstance(n,ast.Constant) and isinstance(n.value,str):return [n.value.upper()] if n.value.upper() in METHODS else []
 if isinstance(n,(ast.List,ast.Tuple,ast.Set)):return [sval(x,c).upper() for x in n.elts if sval(x,c) and sval(x,c).upper() in METHODS]
 return []
def main(doc):
 paths=sorted(doc['files']);root=os.path.commonpath(paths);trees={};const={};warn=[];out=[]
 for p in paths:
  try:trees[p]=ast.parse(doc['files'][p],filename=p);const[p]={}
  except SyntaxError as e:warn.append(f'django: parse {p}:{e.lineno or 1}: {e.msg}')
 def w(p,n,m):warn.append(f'django: {m} in {p}:{getattr(n,"lineno",1)}')
 # imports are intentionally resolved only to local files; dynamic imports are skipped.
 def modname(p):
  name=os.path.relpath(p,root).replace(os.sep,'.')
  if name.endswith('.__init__.py'):return name[:-len('.__init__.py')]
  return name[:-3] if name.endswith('.py') else name
 mods={modname(p):p for p in paths}
 imported={}
 for p,t in trees.items():
  for n in ast.walk(t):
   if isinstance(n,(ast.Assign,ast.AnnAssign)):
    for x in (n.targets if isinstance(n,ast.Assign) else [n.target]):
     if isinstance(x,ast.Name):const[p][x.id]=n.value
   if isinstance(n,ast.ImportFrom):
    mod=('.'*n.level)+(n.module or ''); src=mods.get(mod.lstrip('.'))
    if src:
     for i in n.names:imported[(p,i.asname or i.name)]=(src,i.name)
 # custom actions and router registrations
 actions={};routers={};router_names=set()
 for p,t in trees.items():
  for n in ast.walk(t):
   if isinstance(n,(ast.Assign,ast.AnnAssign)) and isinstance(n.value,ast.Call) and dotted(n.value.func) and dotted(n.value.func).split('.')[-1] in ('SimpleRouter','DefaultRouter'):
    for x in (n.targets if isinstance(n,ast.Assign) else [n.target]):
     if isinstance(x,ast.Name):router_names.add((p,x.id))
   if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)):
    for d in n.decorator_list:
     if isinstance(d,ast.Call) and dotted(d.func) and dotted(d.func).split('.')[-1]=='action':
      ms=[];detail=False;up=None
      for k in d.keywords:
       if k.arg=='methods':ms=methods(k.value,const[p])
       if k.arg=='detail':detail=isinstance(k.value,ast.Constant) and bool(k.value.value)
       if k.arg=='url_path':up=sval(k.value,const[p])
      if ms and up is not None:actions[n.name]=(ms,detail,up,p,d.lineno)
   if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='register' and isinstance(n.func.value,ast.Name) and (p,n.func.value.id) in router_names:
    pre=sval(n.args[0],const[p]) if n.args else None
    view=dotted(n.args[1]) if len(n.args)>1 else None
    if pre is not None and view:routers.setdefault(p,[]).append((pre,view,p,n.lineno))
 # urlpatterns recursively follows literal lists, path/re_path and include(module urlpatterns).
 include_used=set()
 def urlpatterns(p,name='urlpatterns',seen=None):
  seen=set() if seen is None else seen
  if (p,name) in seen:return []
  seen.add((p,name));t=trees.get(p);result=[]
  if not t:return result
  vals=[]
  for n in t.body:
   if isinstance(n,ast.Assign) and any(isinstance(x,ast.Name) and x.id==name for x in n.targets):vals.append(n.value)
  def visit(n,base=''):
   if isinstance(n,(ast.List,ast.Tuple)):
    for x in n.elts:visit(x,base)
   elif isinstance(n,ast.Call):
    fn=dotted(n.func);prefix=sval(n.args[0],const[p]) if n.args else None
    if fn and fn.split('.')[-1] in ('path','re_path'):
     if prefix is None:w(p,n,'dynamic URL path; route skipped');return
     view=n.args[1] if len(n.args)>1 else None
     if isinstance(view,ast.Call) and dotted(view.func) and dotted(view.func).split('.')[-1]=='include':
      target= view.args[0] if view.args else None; mod=(dotted(target) or sval(target,const[p])) if target else None
      src=mods.get(mod) if mod else None
      router_name=mod.rsplit('.',1)[0] if mod and mod.endswith('.urls') else None
      if router_name and (p,router_name) in router_names:
       for pre,view_name,file,line in routers.get(p,[]):
        if pre is not None:
         for method,path in [('GET',''),('POST',''),('GET','{pk}'),('PUT','{pk}'),('PATCH','{pk}'),('DELETE','{pk}')]:result.append({'Method':method,'Path':join(prefix,pre,path),'File':file,'Line':line})
      elif src: 
       include_used.add(src)
       for r in urlpatterns(src):r['Path']=join(prefix,r['Path']);result.append(r)
      else:w(p,n,'dynamic or unresolved include; routes skipped')
     else:
      if fn.split('.')[-1]=='re_path':
       prefix=repath(prefix)
       if prefix is None:w(p,n,'unsupported dynamic regex URL; route skipped');return
      result.append({'Method':'GET','Path':join(base,prefix),'File':p,'Line':n.lineno})
  for v in vals:visit(v)
  return result
 for p in paths:
  for n in ast.walk(trees.get(p,ast.Module(body=[],type_ignores=[]))):
   if isinstance(n,ast.Call) and dotted(n.func) and dotted(n.func).split('.')[-1]=='include' and n.args:
    mod=dotted(n.args[0]) or sval(n.args[0],const[p]); src=mods.get(mod) if mod else None
    if src: include_used.add(src)
 for p in paths:
  if p not in include_used:out+=urlpatterns(p)
  for pre,view,file,line in routers.get(p,[]):
   base=join(pre);out += [{'Method':'GET','Path':join(base),'File':file,'Line':line},{'Method':'POST','Path':join(base),'File':file,'Line':line},{'Method':'GET','Path':join(base,'{pk}'),'File':file,'Line':line},{'Method':'PUT','Path':join(base,'{pk}'),'File':file,'Line':line},{'Method':'PATCH','Path':join(base,'{pk}'),'File':file,'Line':line},{'Method':'DELETE','Path':join(base,'{pk}'),'File':file,'Line':line}]
   for name,(ms,detail,up,af,al) in actions.items():out += [{'Method':m,'Path':join(base,up,'{pk}' if detail else ''),'File':af,'Line':al} for m in ms]
 return {'routes':sorted(out,key=lambda x:(x['File'],x['Line'],x['Method'],x['Path'])),'warnings':sorted(set(warn))}
try:print(json.dumps(main(json.load(sys.stdin)),separators=(',',':')))
except Exception as e:print(json.dumps({'routes':[],'warnings':['django: AST helper error: '+str(e)]}))
