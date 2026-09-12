from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "design-boards"
OUT.mkdir(exist_ok=True)

W, H = 2400, 1500
INK, PAPER, PAPER_2, BLACK = "#171310", "#F4E9D3", "#FFF8EC", "#0C0A0A"
OXBLOOD, BRASS, GOLD, ROSE, GREEN = "#551B26", "#C49A53", "#E2C68A", "#C9979E", "#6D9A69"
WHITE = "#FFFDF8"
SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf"
SERIF_B = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"

def font(size, bold=False, serif=False):
    path = SERIF_B if serif and bold else SERIF if serif else BOLD if bold else SANS
    return ImageFont.truetype(path, size)

def round_rect(d, box, r=20, fill=WHITE, outline=None, width=2):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def wrap(d, text, max_w, f):
    out=[]
    for paragraph in text.split("\n"):
        if not paragraph:
            out.append(""); continue
        line=""
        for word in paragraph.split():
            trial=(line+" "+word).strip()
            if d.textbbox((0,0),trial,font=f)[2] <= max_w: line=trial
            else:
                if line: out.append(line)
                line=word
        if line: out.append(line)
    return out

def text_box(d, text, box, size=20, fill=INK, bold=False, serif=False, gap=5):
    x1,y1,x2,y2=box; f=font(size,bold,serif); y=y1
    for line in wrap(d,text,x2-x1,f):
        d.text((x1,y),line,font=f,fill=fill)
        y += size+gap
        if y > y2: break
    return y

def panel(d, box, title, number, accent=BRASS, fill=PAPER_2):
    round_rect(d,box,22,fill,INK,4)
    x1,y1,x2,y2=box
    d.ellipse((x1+18,y1+18,x1+78,y1+78),fill=accent)
    d.text((x1+48,y1+48),str(number),font=font(28,True),fill=BLACK,anchor="mm")
    d.text((x1+96,y1+27),title,font=font(29,True),fill=INK)
    d.line((x1+28,y1+92,x2-28,y1+92),fill=BRASS,width=2)

def pill(d, box, text, fill=OXBLOOD, txt=WHITE, fs=18):
    round_rect(d,box,99,fill,fill,2)
    x1,y1,x2,y2=box
    d.text(((x1+x2)/2,(y1+y2)/2),text,font=font(fs,True),fill=txt,anchor="mm")

def arrow(d,x1,y,x2,color=BRASS):
    d.line((x1,y,x2-12,y),fill=color,width=5)
    d.polygon([(x2-12,y-9),(x2,y),(x2-12,y+9)],fill=color)

concept_path=OUT/"thought-or-fact-mentation-branded-concept.png"
concept=Image.open(concept_path).convert("RGB")

# Main intervention design board
bg=Image.new("RGB",(W,H),PAPER); d=ImageDraw.Draw(bg)
for y in range(0,H,8): d.line((0,y,W,y),fill="#F1E3CB",width=1)
d.text((74,38),"INTERVENTION DESIGN BOARD",font=font(72,True),fill=INK)
d.text((78,122),"THOUGHT OR FACT?  /  MIND COURT SYSTEM",font=font(25,True),fill=OXBLOOD)
d.line((78,160,W-78,160),fill=BRASS,width=4)

round_rect(d,(790,205,1535,415),105,BLACK,BRASS,4)
d.text((1162,257),"THOUGHT OR FACT?",font=font(43,True),fill=PAPER,anchor="mm")
d.text((1162,323),"Put the thought on trial—not the person.",font=font(21,False,True),fill=GOLD,anchor="mm")
pill(d,(1016,350,1308,394),"GOAL  •  CALM",OXBLOOD,WHITE,17)

panel(d,(55,205,735,650),"PURPOSE",1)
purpose=("WHAT IT IS  A 2–4 minute CBT experience that tests one emotionally charged thought through the metaphor of a fair trial.\n\n"
"WHO IT IS FOR  Rumination, worry, self-criticism and sticky conclusions at low-to-moderate distress.\n\n"
"WHY IT WORKS  It creates distance from the thought, exposes thinking errors and replaces certainty with a more accurate, useful view.\n\n"
"PSYCHOEDUCATION  Feelings are valid evidence of experience, but not automatic proof of a conclusion. Cognitive distortions are common mental shortcuts—not personal defects.")
text_box(d,purpose,(88,320,700,625),20,INK,gap=5)

panel(d,(1590,205,2345,650),"VIDEO + AUDIO DIRECTION",4)
direction=("VISUAL ARC  Enter a dim, refined psychological courtroom. The user’s thought becomes an embossed case file. Evidence is placed on tactile brass scales. The room subtly warms and opens as the thought becomes more flexible.\n\n"
"SOUND ARC  Distant room tone + soft page turn → low felted piano pulse → restrained seal impact at distortion reveal → spatial paper slides and scale ticks → near-silence for cross-examination → warm harmonic resolution at the ruling.\n\n"
"ACCESS  Optional narration, captions, reduced motion, sound-off and discreet mode. Haptics only at meaningful moments.")
text_box(d,direction,(1624,320,2310,620),20,INK,gap=5)

panel(d,(55,700,1535,1435),"USER FLOW",2,ROSE)
d.text((155,804),"A clear trial with two adaptive branches—not a worksheet and not forced positive thinking.",font=font(21,True),fill=OXBLOOD)
steps=[("ENTER","Type or speak\none exact thought"),("BELIEF","How convinced are\nthe 10 jurors?"),("CHARGE","AI suggests 1–3\nthinking patterns"),("CONFIRM","User accepts, rejects\nor changes labels"),("EVIDENCE","Sort facts, feelings,\ninterpretations + predictions"),("QUESTION","Answer one tailored\ncross-examination"),("RULING","Choose or write a\nfairer thought"),("VERDICT","Re-rate jurors + choose\none next action")]
sx,sy,bw,bh,gx,gy=103,875,310,115,38,200
for i,(head,body) in enumerate(steps):
    r,c=divmod(i,4); x=sx+c*(bw+gx); y=sy+r*gy
    fill=["#F7E6C7","#E8CEC8","#D9C194","#C7D4B5"][c]
    round_rect(d,(x,y,x+bw,y+bh),20,fill,INK,3)
    d.text((x+18,y+16),head,font=font(19,True),fill=OXBLOOD)
    d.multiline_text((x+18,y+49),body,font=font(17),fill=INK,spacing=4)
    if c<3: arrow(d,x+bw+4,y+bh/2,x+bw+gx-5)
    elif r==0:
        d.line((x+bw/2,y+bh,x+bw/2,y+bh+42),fill=BRASS,width=5)
        d.line((x+bw/2,y+bh+42,sx+bw/2,y+bh+42),fill=BRASS,width=5)
        d.polygon([(sx+bw/2-9,y+bh+32),(sx+bw/2,y+bh+44),(sx+bw/2+9,y+bh+32)],fill=BRASS)
round_rect(d,(103,1283,748,1388),18,"#1B1716",BRASS,2)
d.text((126,1300),"IF THE THOUGHT MAY BE TRUE",font=font(18,True),fill=GOLD)
text_box(d,"Shift from disputing it to problem-solving, boundaries, support or safety.",(126,1334,725,1374),16,PAPER)
round_rect(d,(777,1283,1433,1388),18,"#1B1716",BRASS,2)
d.text((800,1300),"IF DISTRESS IS TOO HIGH",font=font(18,True),fill=GOLD)
text_box(d,"Pause the trial and route to grounding first; return only when thinking feels possible.",(800,1334,1410,1374),16,PAPER)

panel(d,(1590,700,2345,1435),"MENTICATION UPGRADE",3,GREEN)
upgrade=("AI AS COURT CLERK—NOT JUDGE\n"
"• Converts open-ended speech into a precise, editable claim.\n"
"• Detects possible distortions from the user’s exact wording: mind reading, catastrophising, all-or-nothing thinking, emotional reasoning, fortune telling, overgeneralising, filtering, ‘shoulds’, labelling and personalisation.\n"
"• Quotes the phrase that triggered each suggestion and lets the user reject it.\n"
"• Builds both sides of the evidence docket while keeping fact, feeling, interpretation and prediction distinct.\n"
"• Asks one distortion-specific question—never a generic checklist.\n"
"• Generates three fairer rulings: compassionate, direct and action-oriented. The user chooses or writes their own.\n\n"
"CASE LAW THAT LEARNS\n"
"With explicit permission, save recurring thinking patterns, triggers, rulings that actually helped, belief shift and actions taken. When a familiar thought returns, surface the user’s own previous evidence—not generic advice. If belief does not move, change strategy instead of declaring success.")
text_box(d,upgrade,(1624,815,2310,1395),19,INK,gap=5)

board=OUT/"thought-or-fact-intervention-design-board.png"; bg.save(board,quality=95)

# Immersive production system
CW,CH=2400,1500
sheet=Image.new("RGB",(CW,CH),BLACK); sd=ImageDraw.Draw(sheet)
sd.text((76,50),"THOUGHT OR FACT?",font=font(62,True),fill=PAPER)
sd.text((80,126),"THE MIND COURT EXPERIENCE  •  FIVE MOMENTS  •  ONE FAIRER RULING",font=font(21,True),fill=GOLD)
sd.line((80,170,CW-80,170),fill=BRASS,width=3)
target=(80,210,2320,1040); crop=concept.copy(); crop.thumbnail((2240,830),Image.Resampling.LANCZOS)
cx=target[0]+(2240-crop.width)//2; cy=target[1]+(830-crop.height)//2
sheet.paste(crop,(cx,cy)); sd.rounded_rectangle(target,radius=28,outline=BRASS,width=4)
notes=[
("THE ROOM RESPONDS","The environment mirrors cognitive flexibility: tight spotlight and low tension at entry; richer depth during evidence; warmer, wider space after the ruling."),
("DISTORTION REVEAL","A refined seal lands with a restrained low-frequency impact. Labels are hypotheses: “Is your mind using this shortcut?”"),
("EVIDENCE HAS WEIGHT","Cards slide onto a physical brass balance with spatial audio. Feelings stay valid, while the app clarifies what they can and cannot prove."),
("THE PAYOFF","Jurors visibly reconsider, the belief score changes, the case is reframed, and the user leaves with one right-sized action—not merely a prettier thought.")]
nx,nw,gap=80,535,35
for i,(head,body) in enumerate(notes):
    x=nx+i*(nw+gap)
    round_rect(sd,(x,1090,x+nw,1430),24,"#171313",BRASS,2)
    sd.text((x+28,1122),head,font=font(21,True),fill=GOLD)
    text_box(sd,body,(x+28,1170,x+nw-28,1395),19,PAPER,gap=6)
journey=OUT/"thought-or-fact-immersive-production-system.png"; sheet.save(journey,quality=95)

# One-board master: every decision and the production visuals together
MW,MH=3200,2500
master=Image.new("RGB",(MW,MH),PAPER); md=ImageDraw.Draw(master)
for y in range(0,MH,8): md.line((0,y,MW,y),fill="#F1E3CB",width=1)
md.text((70,32),"INTERVENTION DESIGN BOARD",font=font(76,True),fill=INK)
md.text((74,120),"THOUGHT OR FACT?  /  MIND COURT ENGINE  /  GOAL: CALM",font=font(27,True),fill=OXBLOOD)
md.line((74,164,MW-74,164),fill=BRASS,width=4)

# top row
panel(md,(50,200,930,705),"PURPOSE + PSYCHOEDUCATION",1)
master_purpose=("WHAT  A 2–4 minute CBT experience that puts one emotionally charged thought on trial.\n\n"
"FOR  Rumination, worry, self-criticism and sticky conclusions at low-to-moderate distress.\n\n"
"MECHANISM  Cognitive distancing + distortion recognition + evidence appraisal + belief re-rating + one useful action.\n\n"
"TEACH  Feelings are valid evidence of experience, but not automatic proof of a conclusion. Cognitive distortions are normal mental shortcuts—not personal defects. The aim is a fairer thought, not forced positivity.\n\n"
"ROLE  The user is judge and jury. AI prepares the case but never decides what is true.")
text_box(md,master_purpose,(84,315,892,675),21,INK,gap=6)

round_rect(md,(970,200,2220,705),34,BLACK,BRASS,4)
md.text((1595,240),"THOUGHT OR FACT?",font=font(48,True),fill=PAPER,anchor="mm")
md.text((1595,302),"Put the thought on trial—not the person.",font=font(22,False,True),fill=GOLD,anchor="mm")
pill(md,(1410,338,1780,386),"FLAGSHIP  •  CALM",OXBLOOD,WHITE,18)
principles=[("AI ROLE","COURT CLERK"),("USER ROLE","JUDGE + JURY"),("OUTPUT","FAIRER RULING"),("PAYOFF","BELIEF SHIFT + ACTION")]
for i,(small,big) in enumerate(principles):
    x=1010+(i%2)*590; y=430+(i//2)*118
    round_rect(md,(x,y,x+550,y+88),18,"#171313",BRASS,2)
    md.text((x+22,y+16),small,font=font(14,True),fill=ROSE)
    md.text((x+22,y+42),big,font=font(22,True),fill=PAPER)

panel(md,(2260,200,3150,705),"VISUAL + SOUND ARC",4)
arc=("VISUAL  A refined psychological courtroom: oxblood, near-black walnut, warm parchment and antique brass. The thought becomes an embossed case file; evidence has physical weight on brass scales. The space gradually warms and opens as certainty softens.\n\n"
"SOUND  Distant room tone + page turn → felted piano pulse → restrained seal impact → spatial evidence slides and scale ticks → near-silence during cross-examination → warm harmonic resolution at the ruling.\n\n"
"HAPTICS  Case opens, distortion seal lands, evidence is placed, jurors move and verdict settles. Optional narration, captions, reduced motion, sound-off and discreet mode.")
text_box(md,arc,(2295,315,3112,675),20,INK,gap=6)

# middle row: full flow and intelligence
panel(md,(50,745,2200,1355),"COMPLETE USER FLOW",2,ROSE)
md.text((150,850),"HOME → CALM → THOUGHT OR FACT?",font=font(21,True),fill=OXBLOOD)
flow_steps=[("1  ENTER","Speak/type exact thought"),("2  BELIEF","Set 0–10 jurors"),("3  CHARGE","AI suggests distortions"),("4  CONFIRM","User edits the charge"),("5  EVIDENCE","Sort both sides"),("6  QUESTION","Tailored cross-exam"),("7  RULING","Choose/write fairer view"),("8  VERDICT","Re-rate + next action")]
fsx,fsy,fbw,fbh,fgx,fgy=100,905,470,112,48,190
for i,(head,body) in enumerate(flow_steps):
    r,c=divmod(i,4); x=fsx+c*(fbw+fgx); y=fsy+r*fgy
    fill=["#F7E6C7","#E8CEC8","#D9C194","#C7D4B5"][c]
    round_rect(md,(x,y,x+fbw,y+fbh),18,fill,INK,3)
    md.text((x+20,y+17),head,font=font(18,True),fill=OXBLOOD)
    md.text((x+20,y+59),body,font=font(18),fill=INK)
    if c<3: arrow(md,x+fbw+4,y+fbh/2,x+fbw+fgx-5)
    elif r==0:
        md.line((x+fbw/2,y+fbh,x+fbw/2,y+fbh+34),fill=BRASS,width=5)
        md.line((x+fbw/2,y+fbh+34,fsx+fbw/2,y+fbh+34),fill=BRASS,width=5)
        md.polygon([(fsx+fbw/2-9,y+fbh+25),(fsx+fbw/2,y+fbh+37),(fsx+fbw/2+9,y+fbh+25)],fill=BRASS)
round_rect(md,(100,1251,1068,1325),16,"#1B1716",BRASS,2)
md.text((124,1267),"THOUGHT MAY BE TRUE → problem-solving, boundaries, support or safety",font=font(17,True),fill=GOLD)
round_rect(md,(1092,1251,2058,1325),16,"#1B1716",BRASS,2)
md.text((1116,1267),"DISTRESS TOO HIGH → ground first, then return when thinking is possible",font=font(17,True),fill=GOLD)

panel(md,(2240,745,3150,1355),"MENTICATION INTELLIGENCE",3,GREEN)
intel=("LIVE CASE PREPARATION\n"
"• Turns open-ended language into a precise, editable claim.\n"
"• Suggests 1–3 possible distortions and quotes the wording that triggered each one.\n"
"• Keeps facts, feelings, interpretations and predictions distinct without invalidating emotion.\n"
"• Generates one distortion-specific cross-examination question.\n"
"• Offers compassionate, direct and action-oriented rulings; the user chooses or writes their own.\n\n"
"CASE LAW THAT LEARNS\n"
"With explicit permission, remembers recurring patterns, triggers, rulings that helped, belief change and actions completed. On repeat thoughts, it resurfaces the user’s own successful evidence. If the belief does not shift, it changes strategy instead of pretending the intervention worked.")
text_box(md,intel,(2275,855,3112,1325),19,INK,gap=5)

# bottom: actual production-ready visual experience
round_rect(md,(50,1395,3150,2450),28,BLACK,BRASS,4)
md.text((88,1425),"PRODUCTION EXPERIENCE  •  THE COURTROOM IS THE INTERFACE",font=font(28,True),fill=GOLD)
md.text((88,1470),"One decision per screen. The atmosphere, materials, sound and haptics carry the emotional progression.",font=font(19),fill=PAPER)
screen_crops=[
    (5,140,350,920),
    (345,140,688,920),
    (680,140,1030,920),
    (1018,140,1370,920),
    (1350,140,1725,920),
]
screen_names=["1  PUT A THOUGHT ON TRIAL","2  DISTORTION CHARGE SHEET","3  WEIGH THE EVIDENCE","4  CROSS-EXAMINATION","5  CASE REFRAMED"]
slot_w=590
for i,(crop_box,name) in enumerate(zip(screen_crops,screen_names)):
    x=105+i*610
    md.text((x+slot_w/2,1530),name,font=font(17,True),fill=GOLD,anchor="mm")
    phone=concept.crop(crop_box)
    phone.thumbnail((slot_w-30,820),Image.Resampling.LANCZOS)
    px=x+(slot_w-phone.width)//2
    py=1570+(820-phone.height)//2
    master.paste(phone,(px,py))

master_path=OUT/"thought-or-fact-complete-intervention-design-board.png"
master.save(master_path,quality=95)

print(board); print(journey); print(concept_path); print(master_path)
