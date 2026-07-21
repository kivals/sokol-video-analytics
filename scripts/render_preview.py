import json, subprocess, os
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
SP=os.path.dirname(os.path.abspath(__file__))
VIDEO='/Users/kivals/code/SOKOL/app/public/videos/camera-main.mp4'
OUT=SP+'/camera-1-detected-preview.mp4'
track=json.load(open('/Users/kivals/code/SOKOL/app/public/detections/camera-1.json'))
frames=track['frames']; STRIDE=track['stride']; VIO=track.get('violators',{})
VLAB={'no_helmet':'Без каски','no_vest':'Без жилета','no_mask':'Без маски'}
cap=cv2.VideoCapture(VIDEO)
W=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
FPS=cap.get(cv2.CAP_PROP_FPS); N=int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
CYAN=(0,229,255); RED=(239,68,68); DARK=(11,15,20); WHITE=(255,255,255)
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 26)
bfont=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 40)
ff=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}',
  '-r',f'{FPS}','-i','-','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','23',
  '-preset','veryfast',OUT], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
def chip(dr,x,y,txt,bg,fg,fnt):
    tb=dr.textbbox((0,0),txt,font=fnt); tw,th=tb[2]-tb[0],tb[3]-tb[1]
    dr.rectangle([x,y,x+tw+10,y+th+8],fill=bg); dr.text((x+5,y+2),txt,fill=fg,font=fnt)
    return th+8
i=0
while True:
    ok,frame=cap.read()
    if not ok: break
    idx=min(len(frames)-1, round(i/STRIDE))
    fb=frames[idx]['boxes']
    img=Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)); dr=ImageDraw.Draw(img)
    any_vio=False
    for b in fb:
        x,y,w,h,c,tid=b
        breaches=VIO.get(str(tid))
        x0,y0,x1,y1=x*W,y*H,(x+w)*W,(y+h)*H
        if breaches:
            any_vio=True
            dr.rectangle([x0,y0,x1,y1],outline=RED,width=4)
            tb=dr.textbbox((0,0),'Ag',font=font); lh=(tb[3]-tb[1])+8
            ly=y0-2
            for code in reversed(breaches):     # stack labels upward, breaches[0] on top
                ly-=lh+2
                chip(dr,x0,max(0,ly),VLAB.get(code,'Нарушение ТБ'),RED,WHITE,font)
        else:
            dr.rectangle([x0,y0,x1,y1],outline=CYAN,width=3)
            chip(dr,x0,max(0,y0-32),f'Рабочий {int(c*100)}%',CYAN,DARK,font)
    if any_vio:                                 # interface-style alert banner
        txt='  ЗАФИКСИРОВАНО НАРУШЕНИЕ ТБ  '
        tb=dr.textbbox((0,0),txt,font=bfont); tw=tb[2]-tb[0]
        bx=(W-tw)//2
        dr.rectangle([bx,20,bx+tw,74],fill=RED); dr.text((bx,24),txt,fill=WHITE,font=bfont)
    ff.stdin.write(np.asarray(img).astype('uint8').tobytes())
    i+=1
    if i%1500==0: print('...',i,'/',N,flush=True)
ff.stdin.close(); ff.wait(); cap.release()
print('DONE', os.path.getsize(OUT)//1024//1024,'MB, frames',i)
