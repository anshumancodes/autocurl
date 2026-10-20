import ast, json, os, sys
METHODS={"CONNECT","DELETE","GET","HEAD","OPTIONS","PATCH","POST","PUT","TRACE"}
def dotted(n):
    if isinstance(n,ast.Name): return n.id
    if isinstance(n,ast.Attribute):
        p=dotted(n.value); return (p+'.' if p else '')+n.attr
def sval(n, const, seen=None):
    seen=set() if seen is None else seen
    if isinstance(n,ast.Constant) and isinstance(n.value,str): return n.value
    if isinstance(n,ast.Name) and n.id not in seen and n.id in const: return sval(const[n.id],const,seen|{n.id})
    if isinstance(n,ast.BinOp) and isinstance(n.op,ast.Add):
        a,b=sval(n.left,const,seen),sval(n.right,const,seen)
        if a is not None and b is not None:return a+b
def join(*xs):
    ys=[x for x in xs if x not in (None,'')]
    return '/'+'/'.join(x.strip('/') for x in ys if x.strip('/')) if ys else '/'
class Sym:
    def __init__(self,k,p='',ok=True): self.kind=k;self.prefix=p;self.ok=ok;self.routes=[];self.children=[]
def main(doc):
    files=doc['files']; paths=sorted(files); root=os.path.commonpath(paths); trees={}; const={}; syms={}; warns=[]
    def modname(p):
        name=os.path.relpath(p,root).replace(os.sep,'.')
        if name.endswith('.__init__.py'): return name[:-len('.__init__.py')]
        return name[:-3] if name.endswith('.py') else name
    mods={modname(p):p for p in paths}
    def warn(p,n,msg):warns.append(f'flask: {msg} in {p}:{getattr(n,"lineno",1)}')
    for p in paths:
        try: trees[p]=ast.parse(files[p],filename=p);const[p]={};syms[p]={}
        except SyntaxError as e:warns.append(f'flask: parse {p}:{e.lineno or 1}: {e.msg}')
    def resolve(p,name):
        if name.startswith('.'):
            cur=next((m for m,x in mods.items() if x==p), '').split('.'); dots=len(name)-len(name.lstrip('.')); name='.'.join(cur[:-dots]+name.lstrip('.').split('.'))
        return mods.get(name)
    for p,t in trees.items():
        for n in ast.walk(t):
            if isinstance(n,(ast.Assign,ast.AnnAssign)):
                ts=n.targets if isinstance(n,ast.Assign) else [n.target]
                for x in ts:
                    if isinstance(x,ast.Name):const[p][x.id]=n.value
                if isinstance(n.value,ast.Call):
                    fn=dotted(n.value.func); kind='app' if fn and fn.split('.')[-1]=='Flask' else ('blueprint' if fn and fn.split('.')[-1]=='Blueprint' else None)
                    if kind:
                        pre=sval(next((k.value for k in n.value.keywords if k.arg in ('url_prefix','prefix')),None),const[p]) if kind=='blueprint' else ''
                        ok=pre is not None; syms[p].update({x.id:Sym(kind,pre or '',ok) for x in ts if isinstance(x,ast.Name)})
    for _ in range(len(paths)+2):
        changed=False
        for p,t in trees.items():
            for n in t.body:
                if isinstance(n,ast.ImportFrom):
                    src=resolve(p,('.'*n.level)+(n.module or '')) if n.level else resolve(p,n.module or '')
                    if src in syms:
                        for i in n.names:
                            if i.name in syms[src]:syms[p][i.asname or i.name]=syms[src][i.name];changed=True
                elif isinstance(n,ast.Assign) and isinstance(n.value,ast.Name) and n.value.id in syms[p]:
                    for x in n.targets:
                        if isinstance(x,ast.Name):syms[p][x.id]=syms[p][n.value.id];changed=True
        if not changed:break
    def sym(p,n):return syms.get(p,{}).get(n.id) if isinstance(n,ast.Name) else None
    for p,t in trees.items():
        for n in ast.walk(t):
            if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)):
                for d in n.decorator_list:
                    if not isinstance(d,ast.Call) or not isinstance(d.func,ast.Attribute):continue
                    target=sym(p,d.func.value); name=d.func.attr.upper()
                    if not target or target.kind not in ('app','blueprint') or name not in METHODS|{'ROUTE'}:continue
                    path=sval(d.args[0],const[p]) if d.args else None
                    if path is None:warn(p,d,'dynamic route path; route skipped');continue
                    ms=[]
                    if name=='ROUTE':
                        kw=next((k.value for k in d.keywords if k.arg=='methods'),None)
                        if isinstance(kw,(ast.List,ast.Tuple,ast.Set)):ms=[sval(x,const[p]).upper() for x in kw.elts if sval(x,const[p]) and sval(x,const[p]).upper() in METHODS]
                        if not ms:ms=['GET']
                    else:ms=[name]
                    target.routes += [(m,path,p,d.lineno) for m in ms]
            elif isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='register_blueprint':
                dst=sym(p,n.func.value); src=sym(p,n.args[0]) if n.args else None
                if dst and src and src.kind=='blueprint':
                    pre=sval(next((k.value for k in n.keywords if k.arg=='url_prefix'),None),const[p]) if any(k.arg=='url_prefix' for k in n.keywords) else ''
                    if pre is None:warn(p,n,'dynamic blueprint URL prefix; included routes skipped')
                    else:dst.children.append((src,pre))
    out=[]
    def walk(s,base,seen):
        if id(s) in seen or not s.ok:return
        for m,path,p,line in s.routes:out.append({'Method':m,'Path':join(base,s.prefix,path),'File':p,'Line':line})
        for x,pre in s.children:walk(x,join(base,s.prefix,pre),seen|{id(s)})
    for p in paths:
        for s in syms.get(p,{}).values():
            if s.kind=='app':walk(s,'',set())
    return {'routes':sorted(out,key=lambda x:(x['File'],x['Line'],x['Method'],x['Path'])),'warnings':sorted(set(warns))}
try: print(json.dumps(main(json.load(sys.stdin)),separators=(',',':')))
except Exception as e: print(json.dumps({'routes':[],'warnings':['flask: AST helper error: '+str(e)]}))
