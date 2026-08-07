import os, glob
paths = glob.glob(r'c:\MetroMind\frontend\src\pages\admin\*.jsx')
for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("color: '#f1f5f9'", "color: 'var(--adm-text)'")
    content = content.replace("color:'#f1f5f9'", "color:'var(--adm-text)'")
    
    # We shouldn't break tooltips which are dark mode backgrounds
    # Let's revert the tooltip lines just in case
    content = content.replace("labelStyle={{ fontWeight: 700, color: 'var(--adm-text)' }}", "labelStyle={{ fontWeight: 700, color: '#f1f5f9' }}")
    content = content.replace("labelStyle: { fontWeight: 700, color: 'var(--adm-text)' }", "labelStyle: { fontWeight: 700, color: '#f1f5f9' }")
    content = content.replace("labelStyle: { fontWeight:700, color:'var(--adm-text)' }", "labelStyle: { fontWeight:700, color:'#f1f5f9' }")
    content = content.replace("border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, color: 'var(--adm-text)'", "border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, color: '#f1f5f9'")
    content = content.replace("border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, fontSize:12, color:'var(--adm-text)'", "border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, fontSize:12, color:'#f1f5f9'")
    content = content.replace("border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, fontSize: 12, color: 'var(--adm-text)'", "border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, fontSize: 12, color: '#f1f5f9'")

    # Fix other bad light-on-light colors
    content = content.replace("color: '#94a3b8'", "color: 'var(--adm-text-3)'")
    content = content.replace("color:'#94a3b8'", "color:'var(--adm-text-3)'")
    
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
