import sys,re,zipfile
z=zipfile.ZipFile(sys.argv[1]); x=z.read('word/document.xml').decode('utf8')
out=[]
for p in re.findall(r'<w:p[ >].*?</w:p>',x,flags=re.S):
    st=re.search(r'<w:pStyle w:val="([^"]+)"',p); num='•' if '<w:numPr>' in p else ''
    t=''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>',p))
    if '<w:tab/>' in p and not t: continue
    if t.strip(): out.append(f"{'['+st.group(1)+'] ' if st else ''}{num}{t}")
print('\n'.join(out))
