import json, os, time
from ultralytics import YOLO
SP=os.path.dirname(os.path.abspath(__file__))
VIDEO='/Users/kivals/code/SOKOL/app/public/videos/camera-main.mp4'
FPS=24000/1001
STRIDE=8
model=YOLO('yolo11x.pt')
res=model.track(source=VIDEO, classes=[0], conf=0.3, iou=0.5, imgsz=1280,
                device='mps', stream=True, vid_stride=STRIDE,
                tracker='bytetrack.yaml', persist=True, verbose=False)
frames=[]; t0=time.time()
for i, r in enumerate(res):
    t=round(i*STRIDE/FPS, 2)
    boxes=[]
    b=r.boxes
    if b is not None and len(b)>0:
        xyxyn=b.xyxyn.cpu().numpy(); conf=b.conf.cpu().numpy()
        ids=b.id.cpu().numpy().astype(int) if b.id is not None else [-1]*len(conf)
        for (x1,y1,x2,y2), c, tid in zip(xyxyn, conf, ids):
            boxes.append([round(float(x1),3),round(float(y1),3),
                          round(float(x2-x1),3),round(float(y2-y1),3),
                          round(float(c),2),int(tid)])
    frames.append({'t':t,'boxes':boxes})
    if i%100==0: print('...frame',i,'t=%.1f'%t,'elapsed=%.0fs'%(time.time()-t0), flush=True)
out=SP+'/detections.json'
json.dump({'fps':round(FPS,3),'stride':STRIDE,'frames':frames}, open(out,'w'))
tot=sum(len(f['boxes']) for f in frames)
print('DONE frames=%d total_boxes=%d size=%dKB elapsed=%.0fs'%(len(frames),tot,os.path.getsize(out)//1024,time.time()-t0))
