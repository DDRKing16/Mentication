from pathlib import Path
from PIL import Image, ImageDraw
import shutil

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/"Visual Assets_MentiCation"
DESIGN=ROOT/"design-boards"
GEN=Path("/Users/dylandesai-rogers/.codex/generated_images/01a06452-5ddd-7242-a5ea-2412a9d1f6b1")

def ensure(*parts):
    p=ASSETS.joinpath(*parts); p.mkdir(parents=True,exist_ok=True); return p
def copy(src,dst):
    src=Path(src); dst=Path(dst); dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)
def crop_grid(src,out_dir,boxes,names):
    im=Image.open(src).convert("RGB")
    for box,name in zip(boxes,names):
        im.crop(box).save(out_dir/name,quality=95)

# Temporary PMR reference sheet for a single high-fidelity typography edit.
pmr_files=[
    "01-settle-into-support.png","02-hands-and-forearms-tense.png","03-hands-release.png",
    "02-shoulders-tense.png","03-jaw-release.png","04-whole-body-soften.png"
]
pmr_imgs=[Image.open(ROOT/"assets/pmr-app-screenshots"/n).convert("RGB") for n in pmr_files]
thumbs=[]
for im in pmr_imgs:
    c=im.copy(); c.thumbnail((480,820),Image.Resampling.LANCZOS); thumbs.append(c)
sheet=Image.new("RGB",(1536,1720),(16,8,18));
for i,im in enumerate(thumbs):
    x=24+(i%3)*504+(480-im.width)//2; y=24+(i//3)*840+(820-im.height)//2
    sheet.paste(im,(x,y))
sheet.save(DESIGN/"pmr-six-screen-reference-sheet.png",quality=95)

# Master library structure. Originals remain in place; this is a curated copy.
interventions={
    "Ignition Point": {
        "boards": [
            (GEN/"exec-ec423d48-cfab-46d3-bbc5-ec9545413aff.png","intervention-design-board.png"),
            (GEN/"exec-3e1346d1-a16d-4461-adcb-d9e1315da6c7.png","intervention-design-board-alternate.png"),
            (GEN/"exec-6362485f-40c1-4066-a685-c4a9d859d8dd.png","end-to-end-user-flow.png"),
            (GEN/"exec-8dbff10f-af4f-48ce-902c-caaf9e512a32.png","complete-user-flow.png"),
            (GEN/"exec-2a4b7e1b-300e-4c09-9dad-4aabc3dc1703.png","pathway-flow-detail.png"),
            (GEN/"exec-fc0a95c9-2e58-4440-a2f2-c09dff009e6d.png","pathway-flow-summary.png"),
        ],
        "concept": DESIGN/"ignition-point-mentation-branded-concept.png",
        "earlier": [
            (GEN/"exec-75e11d6d-ca0a-4812-9c18-0e737e2ebef1.png","earlier-five-screen-concept.png"),
            (GEN/"exec-ea706445-5979-4f52-aece-9409a38ec2fd.png","earlier-dream-path-concept.png"),
        ],
    },
    "Box Breathing": {
        "boards": [
            (DESIGN/"box-breathing-intervention-design-board-corrected.png","intervention-design-board.png"),
            (DESIGN/"box-breathing-actual-production-visual-sheet.png","production-visual-explainer.png"),
            (GEN/"exec-30780d7c-9006-4561-9fbe-136bc1ec1bd5.png","earlier-detailed-design-board.png"),
        ],
        "concept": DESIGN/"box-breathing-mentation-branded-concept.png",
        "earlier": [(GEN/"exec-97b4fb9d-62d9-4f9e-ad56-1a063d58e04b.png","pre-brand-six-screen-concept.png")],
    },
    "5-4-3-2-1 Grounding": {
        "boards": [
            (DESIGN/"grounding-54321-intervention-design-board.png","intervention-design-board.png"),
        ],
        "concept": DESIGN/"grounding-54321-mentation-branded-visual-system.png",
        "earlier": [(DESIGN/"grounding-54321-production-visual-system.png","pre-brand-production-system.png")],
    },
    "Thought or Fact": {
        "boards": [
            (DESIGN/"thought-or-fact-complete-intervention-design-board.png","complete-intervention-design-board.png"),
            (DESIGN/"thought-or-fact-intervention-design-board.png","intervention-design-board.png"),
            (DESIGN/"thought-or-fact-immersive-production-system.png","immersive-production-system.png"),
        ],
        "concept": DESIGN/"thought-or-fact-mentation-branded-concept.png",
        "earlier": [
            (DESIGN/"thought-or-fact-mind-court-production-concept.png","pre-brand-production-concept.png"),
            (DESIGN/"thought-or-fact-production-experience-system.png","earlier-production-experience-system.png"),
        ],
    },
    "Urge Surfing": {
        "boards": [(DESIGN/"urge-surfing-complete-intervention-design-board.png","complete-intervention-design-board.png")],
        "concept": DESIGN/"urge-surfing-mentation-branded-concept.png",
        "earlier": [(DESIGN/"urge-surfing-choice-window-production-concept.png","pre-brand-production-concept.png")],
    },
    "Progressive Muscle Relaxation": {
        "boards": [],
        "concept": DESIGN/"pmr-mentation-branded-concept.png",
        "earlier": [(DESIGN/"pmr-six-screen-reference-sheet.png","pre-brand-six-screen-reference.png")],
    },
}

for name,data in interventions.items():
    boards=ensure(name,"Boards")
    concepts=ensure(name,"Screen Concepts")
    individuals=ensure(name,"Individual Screens")
    earlier=ensure(name,"Earlier Iterations")
    for src,filename in data["boards"]:
        if Path(src).exists(): copy(src,boards/filename)
    copy(data["concept"],concepts/f"{name.lower().replace(' ','-')}-mentation-branded-concept.png")
    for src,filename in data["earlier"]:
        if Path(src).exists(): copy(src,earlier/filename)

# Branded wordmark references.
brand=ensure("00 Brand Reference")
copy(ROOT/"public/media/brand/mentation-primary.png",brand/"mentation-primary.png")
copy("/Users/dylandesai-rogers/Documents/Mentication/MCN V1 Branding Kit/Cream backdrop with Emerald Green & Brown.png",brand/"mentation-wordmark-style-reference.png")
if (ROOT/"assets/extracted-white-logo.png").exists(): copy(ROOT/"assets/extracted-white-logo.png",brand/"mentation-white-logo.png")

# Individual screens from each approved branded concept.
crop_grid(DESIGN/"ignition-point-mentation-branded-concept.png",ensure("Ignition Point","Individual Screens"),
    [(120,25,455,515),(505,25,840,515),(895,25,1230,515),(120,510,455,1020),(505,510,840,1020),(895,510,1230,1020)],
    ["01-path-choice.png","02-personalised-offers.png","03-five-thing-mastery.png","04-connection-move.png","05-dream-move.png","06-who-im-becoming.png"])
crop_grid(DESIGN/"box-breathing-mentation-branded-concept.png",ensure("Box Breathing","Individual Screens"),
    [(180,0,500,510),(600,0,930,510),(1030,0,1360,510),(180,510,500,1024),(600,510,930,1024),(1030,510,1360,1024)],
    ["01-introduction.png","02-find-your-seat.png","03-breathe-in.png","04-hold.png","05-breathe-out.png","06-rest.png"])
crop_grid(DESIGN/"grounding-54321-mentation-branded-visual-system.png",ensure("5-4-3-2-1 Grounding","Individual Screens"),
    [(55,145,585,940)], ["01-see-five.png"])
five_boxes=[(15,165,340,910),(350,165,675,910),(685,165,1010,910),(1015,165,1345,910),(1350,165,1680,910)]
crop_grid(DESIGN/"thought-or-fact-mentation-branded-concept.png",ensure("Thought or Fact","Individual Screens"),five_boxes,
    ["01-put-thought-on-trial.png","02-charge-sheet.png","03-weigh-evidence.png","04-cross-examination.png","05-case-reframed.png"])
crop_grid(DESIGN/"urge-surfing-mentation-branded-concept.png",ensure("Urge Surfing","Individual Screens"),five_boxes,
    ["01-name-the-wave.png","02-find-the-pull.png","03-set-your-anchor.png","04-ride-the-crest.png","05-you-kept-the-choice.png"])
crop_grid(DESIGN/"pmr-mentation-branded-concept.png",ensure("Progressive Muscle Relaxation","Individual Screens"),
    [(35,0,370,655),(425,0,760,655),(815,0,1150,655),(35,655,370,1320),(425,655,760,1320),(815,655,1150,1320)],
    ["01-settle-into-support.png","02-hands-and-forearms-tense.png","03-shoulders-tense.png","04-jaw-tense.png","05-jaw-release.png","06-whole-body-soften.png"])

print(ASSETS)
