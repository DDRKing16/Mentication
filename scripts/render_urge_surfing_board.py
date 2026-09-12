from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"design-boards"; OUT.mkdir(exist_ok=True)
W,H=3200,2500
INK="#101820"; PAPER="#EEF1EC"; PANEL="#F8F7F1"; BLACK="#02090F"
NAVY="#061521"; TEAL="#25B7B0"; TEAL_D="#0C7779"; AMBER="#C89550"; GOLD="#E0C18A"
ROSE="#CBA6AA"; GREEN="#6FA18C"; WHITE="#FAFBF7"
SANS="/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
SERIF="/System/Library/Fonts/Supplemental/Georgia.ttf"
SERIF_B="/System/Library/Fonts/Supplemental/Georgia Bold.ttf"

def font(n,bold=False,serif=False):
    p=SERIF_B if serif and bold else SERIF if serif else BOLD if bold else SANS
    return ImageFont.truetype(p,n)
def rr(d,b,r=20,fill=WHITE,outline=None,width=2): d.rounded_rectangle(b,radius=r,fill=fill,outline=outline,width=width)
def wrapped(d,text,w,f):
    out=[]
    for p in text.split("\n"):
        if not p: out.append(""); continue
        line=""
        for word in p.split():
            t=(line+" "+word).strip()
            if d.textbbox((0,0),t,font=f)[2]<=w: line=t
            else:
                if line: out.append(line)
                line=word
        if line: out.append(line)
    return out
def textbox(d,text,b,size=20,fill=INK,bold=False,serif=False,gap=5):
    x1,y1,x2,y2=b; f=font(size,bold,serif); y=y1
    for line in wrapped(d,text,x2-x1,f):
        d.text((x1,y),line,font=f,fill=fill); y+=size+gap
        if y>y2: break
def panel(d,b,title,num,accent=AMBER):
    rr(d,b,22,PANEL,INK,4); x1,y1,x2,y2=b
    d.ellipse((x1+18,y1+18,x1+78,y1+78),fill=accent)
    d.text((x1+48,y1+48),str(num),font=font(28,True),fill=BLACK,anchor="mm")
    d.text((x1+96,y1+27),title,font=font(29,True),fill=INK)
    d.line((x1+28,y1+92,x2-28,y1+92),fill=AMBER,width=2)
def pill(d,b,text,fill=NAVY,txt=WHITE,fs=18):
    rr(d,b,99,fill,fill,2); x1,y1,x2,y2=b
    d.text(((x1+x2)/2,(y1+y2)/2),text,font=font(fs,True),fill=txt,anchor="mm")
def arrow(d,x1,y,x2):
    d.line((x1,y,x2-12,y),fill=AMBER,width=5)
    d.polygon([(x2-12,y-9),(x2,y),(x2-12,y+9)],fill=AMBER)

concept_path=OUT/"urge-surfing-mentation-branded-concept.png"
concept=Image.open(concept_path).convert("RGB")
img=Image.new("RGB",(W,H),PAPER); d=ImageDraw.Draw(img)
for y in range(0,H,8): d.line((0,y,W,y),fill="#E8ECE6",width=1)
d.text((70,32),"INTERVENTION DESIGN BOARD",font=font(76,True),fill=INK)
d.text((74,120),"URGE SURFING  /  CHOICE WINDOW ENGINE  /  GOALS: CALM + RESET",font=font(27,True),fill=TEAL_D)
d.line((74,164,W-74,164),fill=AMBER,width=4)

# Purpose
panel(d,(50,200,930,705),"PURPOSE + PSYCHOEDUCATION",1)
purpose=("WHAT  A 2–5 minute acceptance and distress-tolerance experience that helps a person feel an urge without immediately obeying it.\n\n"
"FOR  Reactive messaging, checking, compulsions, avoidance, quitting, anger, cravings and other impulsive action urges.\n\n"
"MECHANISM  Name → locate → allow → delay → observe change → choose intentionally. The goal is response flexibility, not making the sensation disappear.\n\n"
"TEACH  An urge is a powerful signal, not a command. It can rise, crest, change shape and fall—but not always quickly. Success means preserving choice, even if intensity stays high.\n\n"
"EFFORT  Voice input, taps and one-finger interaction; no journalling during the crest.")
textbox(d,purpose,(84,315,892,675),20,INK,gap=6)

# Centre system
rr(d,(970,200,2220,705),34,BLACK,AMBER,4)
d.text((1595,240),"URGE SURFING",font=font(50,True),fill=PAPER,anchor="mm")
d.text((1595,302),"Feel the wave. Keep the choice.",font=font(23,False,True),fill=GOLD,anchor="mm")
pill(d,(1390,338,1800,386),"FLAGSHIP  •  CALM + RESET",TEAL_D,WHITE,18)
principles=[("ENGINE","CHOICE WINDOW"),("LIVE OBJECT","RESPONSIVE CREST"),("PERSONAL MEMORY","TIDE MAP"),("PAYOFF","SPACE + NEXT MOVE")]
for i,(small,big) in enumerate(principles):
    x=1010+(i%2)*590; y=430+(i//2)*118
    rr(d,(x,y,x+550,y+88),18,"#07131C",AMBER,2)
    d.text((x+22,y+16),small,font=font(14,True),fill=TEAL)
    d.text((x+22,y+42),big,font=font(22,True),fill=PAPER)

# AV
panel(d,(2260,200,3150,705),"VISUAL + SOUND ARC",4)
arc=("VISUAL  Not a peaceful beach. A formidable midnight ocean becomes a responsive instrument. Mineral-teal currents track the user’s finger; the horizon and wave geometry reflect intensity without becoming threatening.\n\n"
"SOUND  Low oceanic room tone → granular swell mapped to intensity → muted crest impact → receding foam → warm, grounded bass chord when the Choice Window completes. Sparse optional guide voice; never constant narration.\n\n"
"HAPTICS  Uneven rising pulses before the crest, one firm peak, then widening intervals. All audio, haptics and motion can be reduced or disabled. No promise that the wave must fall.")
textbox(d,arc,(2295,315,3112,675),20,INK,gap=6)

# Flow
panel(d,(50,745,2200,1355),"COMPLETE USER FLOW",2,ROSE)
d.text((150,850),"HOME → CALM OR RESET → URGE SURFING",font=font(21,True),fill=TEAL_D)
steps=[("1  NAME","Exact urge + intensity"),("2  LOCATE","Where and how it pulls"),("3  ANCHOR","What waiting protects"),("4  WINDOW","Choose 60 sec–5 min"),("5  RIDE","Trace the live current"),("6  CHECK","Mark intensity shifts"),("7  CHOOSE","Select next best move"),("8  CLOSE","Re-rate + save pattern")]
sx,sy,bw,bh,gx,gy=100,905,470,112,48,190
for i,(head,body) in enumerate(steps):
    r,c=divmod(i,4); x=sx+c*(bw+gx); y=sy+r*gy
    fill=["#D9EFE8","#C8E1E3","#B9D2D8","#DCD0B8"][c]
    rr(d,(x,y,x+bw,y+bh),18,fill,INK,3)
    d.text((x+20,y+17),head,font=font(18,True),fill=TEAL_D)
    d.text((x+20,y+59),body,font=font(18),fill=INK)
    if c<3: arrow(d,x+bw+4,y+bh/2,x+bw+gx-5)
    elif r==0:
        d.line((x+bw/2,y+bh,x+bw/2,y+bh+34),fill=AMBER,width=5)
        d.line((x+bw/2,y+bh+34,sx+bw/2,y+bh+34),fill=AMBER,width=5)
        d.polygon([(sx+bw/2-9,y+bh+25),(sx+bw/2,y+bh+37),(sx+bw/2+9,y+bh+25)],fill=AMBER)
rr(d,(100,1251,1068,1325),16,"#07131C",AMBER,2)
d.text((124,1267),"URGE STAYS HIGH → extend, add distance, substitute or contact support",font=font(17,True),fill=GOLD)
rr(d,(1092,1251,2058,1325),16,"#07131C",AMBER,2)
d.text((1116,1267),"DANGER / SELF-HARM / OVERDOSE → leave solo flow and open safety support",font=font(17,True),fill=GOLD)

# AI
panel(d,(2240,745,3150,1355),"MENTICATION INTELLIGENCE",3,GREEN)
intel=("LIVE SURF COACH\n"
"• Converts voice into a precise urge without moralising it.\n"
"• Suggests a right-sized Choice Window based on intensity and prior experience; the user can change it.\n"
"• Uses the urge type to offer relevant exits: create distance, add friction, delay, substitute, regulate or contact someone.\n"
"• Adapts sound, wave motion and prompts to live intensity check-ins—without pretending to measure the body.\n"
"• If the urge remains high, it changes strategy instead of treating that as failure.\n\n"
"TIDE MAP THAT LEARNS\n"
"With explicit permission, remembers triggers, body signatures, typical duration, anchors that mattered and strategies that preserved choice. It can later say: ‘This feels like the same wave you rode on Sunday—leaving the room helped.’ Track time not acted on and choices made, not streaks or moralised success."
)
textbox(d,intel,(2275,855,3112,1325),19,INK,gap=5)

# Production visuals
rr(d,(50,1395,3150,2450),28,BLACK,AMBER,4)
d.text((88,1425),"PRODUCTION EXPERIENCE  •  THE WAVE IS A RESPONSIVE INSTRUMENT",font=font(28,True),fill=GOLD)
d.text((88,1470),"Low anticipatory effort: speak, tap, touch and ride. The strongest visual moment is reserved for the actual crest.",font=font(19),fill=PAPER)
screen_crops=[(5,140,350,920),(345,140,688,920),(680,140,1030,920),(1018,140,1370,920),(1350,140,1725,920)]
names=["1  NAME THE WAVE","2  FIND THE PULL","3  SET YOUR ANCHOR","4  RIDE THE CREST","5  YOU KEPT THE CHOICE"]
slot_w=590
for i,(crop_box,name) in enumerate(zip(screen_crops,names)):
    x=105+i*610
    d.text((x+slot_w/2,1530),name,font=font(17,True),fill=GOLD,anchor="mm")
    phone=concept.crop(crop_box); phone.thumbnail((slot_w-30,820),Image.Resampling.LANCZOS)
    px=x+(slot_w-phone.width)//2; py=1570+(820-phone.height)//2
    img.paste(phone,(px,py))

out=OUT/"urge-surfing-complete-intervention-design-board.png"
img.save(out,quality=95)
print(out); print(concept_path)
