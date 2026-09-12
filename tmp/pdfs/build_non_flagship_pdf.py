from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import Paragraph
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from pathlib import Path
import textwrap


OUT = Path("output/pdf/mentation_non_flagship_interventions.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = landscape(A4)

NAVY = HexColor("#071A2F")
INK = HexColor("#16372C")
GREEN = HexColor("#0D5D46")
MINT = HexColor("#A6F0C1")
CREAM = HexColor("#FFF3C9")
LILAC = HexColor("#D8C4E4")
LIME = HexColor("#C8F20E")
PEACH = HexColor("#F4C6A5")
SKY = HexColor("#B9D7EE")
SOFT = HexColor("#F7F8F4")
MID = HexColor("#5E6F68")
LINE = HexColor("#D7DED9")
WHITE = white


DATA = [
    {
        "name": "Cyclic Sighing & Extended Exhale",
        "goal": "CALM", "duration": "2 min", "role": "Opener / rescue", "grade": "A",
        "system": "Rhythmic Pacing",
        "why": "Use this when anxiety is showing up physically and the person needs a fast, body-first entry point. Two gentle inhales followed by an easy, longer exhale creates a simple rhythm that asks for almost no reflection. It earns a place because it can reduce activation before the user is ready for a cognitive exercise.",
        "science": "A randomized trial found daily five-minute cyclic sighing improved mood and reduced respiratory rate. That supports exhale-focused breathwork generally, not a guarantee of immediate relief for every user.",
        "source": "Balban et al., 2023 - randomized trial", "url": "https://pubmed.ncbi.nlm.nih.gov/36630953/",
        "flow": ["Let breath feel comfortable", "Two inhales, one easy exhale", "Continue gently", "Notice the shift"],
        "concept": "A living breath ribbon expands twice, then travels further across the screen on the exhale. The motion does the teaching, so the user can follow without reading timing instructions.",
        "interaction": "Offer 3, 5 or 8 comfortable cycles; let the user slow the pace; use optional soft haptics at each turning point. Never reward breath-holding or force depth.",
        "audio": "Warm, sparse narration. A soft two-note rise for the double inhale and one long falling tone for the exhale; no busy background track.",
        "standout": "The extended exhale visibly carries a cloud of tension out of the frame, making the physiological idea instantly understandable and memorable."
    },
    {
        "name": "Solvable or Hypothetical Worry?",
        "goal": "CALM / FOCUS", "duration": "3 min", "role": "Core", "grade": "B+",
        "system": "Cognitive Sorting + Offloading",
        "why": "Use this when worry is looping because the person has not separated a real problem from a future 'what if'. The intervention directs actionable worries toward one practical step and contains hypothetical worries instead of feeding them. It earns a place because the two kinds of worry require different responses.",
        "science": "This distinction follows CBT worry-management practice: problem-solve current concerns and postpone or redirect attention from hypothetical worry. Evidence is stronger for full CBT and problem-solving therapy than for this micro-tool alone.",
        "source": "CCI - Problem-Solving for Worry", "url": "https://www.cci.health.wa.gov.au/-/media/CCI/Consumer-Modules/What-Me-Worry/What-Me-Worry---07---Problem-Solving.pdf",
        "flow": ["Name the worry", "Is it a current problem?", "Choose one solvable action", "Or label and postpone the hypothetical worry"],
        "concept": "The worry arrives as one card and the user slides it onto one of two clearly different paths: ACT ON IT or NOT FOR NOW. Each path changes the next screen rather than delivering generic advice.",
        "interaction": "If solvable, build one verb-led next step and choose when to do it. If hypothetical, place it in a sealed parking slot with an optional review time.",
        "audio": "Calm, matter-of-fact voice; small paper-slide sounds; silence after the choice so the person can think without being rushed.",
        "standout": "The sorting decision immediately transforms into the correct tool: a next-action card or a contained worry card."
    },
    {
        "name": "Energy Ladder",
        "goal": "LIFT", "duration": "3 min", "role": "Opener", "grade": "B+",
        "system": "Personalised Choice Pathway + Action Initiation",
        "why": "Use this when low energy makes normal tasks feel too large. The person starts from their actual capacity, chooses a low, medium or higher rung, and completes one realistic action now. It earns a place because it turns 'do something' into a calibrated choice and makes success possible on a difficult day.",
        "science": "Behavioral activation has evidence for reducing depressive symptoms, including in digital formats. A graded ladder lowers the threshold to action, although evidence is for the broader method rather than this exact three-minute sequence.",
        "source": "Alber et al., 2023 - digital BA meta-analysis", "url": "https://pubmed.ncbi.nlm.nih.gov/37227760/",
        "flow": ["Choose today's rung", "See low-energy options", "See medium options", "See higher options", "Do one now", "Notice any lift"],
        "concept": "A vertical ladder begins at the user's current energy, not at zero. Each rung reveals three tiny actions matched to that capacity, making the pathway feel personal rather than prescriptive.",
        "interaction": "Tap an energy level; choose or write one action; complete it in-app where possible; optionally save a favourite action for future low-energy days.",
        "audio": "Light, encouraging narration without hype. A gentle upward musical motif marks selection and completion, but no points, streak pressure or failure state.",
        "standout": "The character or light moves only one rung - visually reinforcing that progress means the next achievable movement, not reaching the top."
    },
    {
        "name": "Test the Prediction",
        "goal": "LIFT / CALM", "duration": "4 min", "role": "Core", "grade": "A-",
        "system": "Cognitive Sorting + Action Initiation",
        "why": "Use this when avoidance is being driven by a confident negative prediction. The person states what they expect, designs a fair real-world test, then compares the result with the prediction. It earns a place because insight alone often does not update a belief; direct evidence from experience can.",
        "science": "Behavioral experiments test beliefs against observable experience. Reviews suggest they can add value within CBT, but the evidence does not isolate this short app-based version.",
        "source": "McMillan & Lee, 2010 - systematic review", "url": "https://pubmed.ncbi.nlm.nih.gov/20381224/",
        "flow": ["State the prediction + confidence", "Design a fair test", "Define what you will observe", "Run it", "Compare and re-rate"],
        "concept": "A compact 'field lab' turns the prediction into a testable card. Before and after confidence dials stay visible so learning is concrete rather than buried in reflection text.",
        "interaction": "The user selects a safe test size, writes an observable outcome and can return later to record what happened. Add a safety check before tests involving people, driving, substances or physical risk.",
        "audio": "Curious, non-judgmental voice: 'We are collecting information, not proving you wrong.' Subtle click and reveal sounds only.",
        "standout": "A side-by-side PREDICTION / REALITY reveal preserves uncertainty and shows exactly what the user learned."
    },
    {
        "name": "Change the Scene",
        "goal": "LIFT", "duration": "2 min", "role": "Opener / core", "grade": "B",
        "system": "Spatial Attention Mapping + Action Initiation",
        "why": "Use this when someone feels flat or stuck and the current setting is reinforcing inertia. A small move - another chair, room, doorway or outdoor spot - changes the cues around them and creates a fresh starting point. It earns a place because it works even when the person cannot generate motivation through thought alone.",
        "science": "Changing context may interrupt environmental cues, while behavioral activation supports small outward actions. Direct clinical evidence for this exact 'scene change' mechanism is limited, so position it as a supportive reset.",
        "source": "Alber et al., 2023 - digital BA meta-analysis", "url": "https://pubmed.ncbi.nlm.nih.gov/37227760/",
        "flow": ["Move to a different place", "Settle and look around", "Notice one thing that is different", "Check for any shift"],
        "concept": "The opening screen is a visual doorway. The user picks the smallest available scene change, then the app's palette and ambient layer shift when they arrive.",
        "interaction": "Offer realistic options: turn your chair, stand at a window, move rooms, step outside. Optional motion sensing can confirm movement but must never be required.",
        "audio": "A brief transition swell followed by a new ambient soundscape; narration leaves space for looking rather than filling the two minutes.",
        "standout": "A BEFORE / AFTER split lets the person capture one word for each scene, turning a subtle environmental shift into visible evidence."
    },
    {
        "name": "Nature Reset",
        "goal": "LIFT / GROUND", "duration": "3 min", "role": "Core", "grade": "A-",
        "system": "Spatial Attention Mapping + Sequential Discovery",
        "why": "Use this for mild stress, low mood or mental fatigue when some contact with a natural element is available. The sequence guides attention toward sky, air, colour and sound rather than asking the person to 'relax'. It earns a place because it combines a real environment change with low-effort sensory engagement.",
        "science": "Reviews associate nature exposure with lower perceived and physiological stress, but findings and study quality vary. This should be framed as a brief supportive reset, not a primary treatment.",
        "source": "Shuda et al., 2020 - systematic review", "url": "https://pubmed.ncbi.nlm.nih.gov/33066853/",
        "flow": ["Find a natural place or element", "Look up", "Feel the air", "Find three colours", "Find one sound", "Stay for a moment"],
        "concept": "A 'nature radar' reveals one sensory discovery at a time. Each real-world observation adds a colour, motion or sound to a quiet digital landscape.",
        "interaction": "Let users choose outdoor, window or indoor-plant mode. They tap colours they actually see and name or record one sound; camera and microphone remain optional.",
        "audio": "Minimal guidance with generous pauses. If ambient nature audio is offered, clearly label it as optional so it does not compete with the user's real surroundings.",
        "standout": "The app builds a personal nature palette from the user's three colours, producing a unique closing scene without gamifying the exercise."
    },
    {
        "name": "One Values Step",
        "goal": "LIFT / FOCUS", "duration": "3 min", "role": "Core", "grade": "B+",
        "system": "Personalised Choice Pathway + Action Initiation",
        "why": "Use this when someone has lost direction or motivation and symptom reduction is not enough to move them. They identify what matters in this moment and take one tiny action in that direction. It earns a place because it reconnects action to meaning, which can make effort feel worthwhile even before mood improves.",
        "science": "ACT research links values and committed action with psychological flexibility and reduced distress. Evidence supports the broader therapeutic process more strongly than a single brief values prompt.",
        "source": "Macri & Rogge, 2024 - meta-analytic review", "url": "https://pubmed.ncbi.nlm.nih.gov/38615492/",
        "flow": ["Name what matters here", "Choose one tiny aligned action", "Take the step now"],
        "concept": "A quiet compass presents a small set of human directions - care, courage, learning, connection, responsibility - plus a write-your-own option. The chosen value then shapes the action prompt.",
        "interaction": "Pick a value, select or write a step that takes under five minutes, and choose NOW or SCHEDULE. Save recurring values privately if the user wants personalisation.",
        "audio": "Warm and spacious, never moralising. One soft tonal resolution as the compass settles on the chosen direction.",
        "standout": "The compass moves when direction becomes clear, not when the task is completed - reinforcing direction over performance."
    },
    {
        "name": "Orienting Scan",
        "goal": "GROUND / CALM", "duration": "2 min", "role": "Rescue / opener", "grade": "B+",
        "system": "Spatial Attention Mapping + Sequential Discovery",
        "why": "Use this when panic, threat or disorientation has narrowed attention. The person slowly locates the room's edges and three neutral or reassuring features, then names where they are now. It earns a place because it brings attention out of internal alarm and back into the current environment with very low cognitive demand.",
        "science": "Present-focused sensory orientation is used in grounding practice to reconnect people with current surroundings. Direct evidence for a standalone two-minute digital orienting scan is limited.",
        "source": "US VA - present-focus grounding resource", "url": "https://www.ptsd.va.gov/PTSD/appvid/docs/30DaysSelfCareCOVIDCoach508.pdf",
        "flow": ["Look around and find the edges", "Name three things you see", "Say: here, this room, this moment", "Notice whether you feel more located"],
        "concept": "The screen behaves like a panoramic frame. As the user turns their gaze to three points, those points illuminate and the frame becomes stable and complete.",
        "interaction": "Tap each anchor after finding it; offer seated and public-place modes; keep camera use optional. The final orientation phrase can be read, spoken or heard.",
        "audio": "Low, steady voice with longer pauses. Stereo ambience begins narrow and subtly widens as the visual frame completes.",
        "standout": "The room's edges close into a strong visual frame, giving the abstract feeling of 'being here' a concrete form."
    },
    {
        "name": "Name What You're Feeling",
        "goal": "GROUND / CALM / RESET", "duration": "2 min", "role": "Core", "grade": "A-",
        "system": "Emotional Wave Tracking + Language Transformation",
        "why": "Use this when emotion feels intense but unclear. The person chooses the closest feeling word, rates its strength and identifies a likely trigger without needing a perfect explanation. It earns a place because naming creates definition: the emotion becomes something the user can observe and respond to rather than an undifferentiated state.",
        "science": "Affect-labeling studies suggest that putting feelings into words can reduce aspects of emotional reactivity. The evidence supports the mechanism, but this brief digital sequence still needs product-level testing.",
        "source": "Lieberman et al., 2007 - affect-labeling study", "url": "https://pubmed.ncbi.nlm.nih.gov/17576282/",
        "flow": ["Choose the closest feeling word", "Rate strength from 1-10", "Name the likely trigger", "Say or read the full label"],
        "concept": "A soft, searchable emotion field starts broad and becomes more precise as the user taps. The chosen feeling becomes a bounded shape with visible space around it.",
        "interaction": "Support broad-to-specific words, mixed feelings and 'not sure'. The intensity control changes size and motion rather than using red danger colours; trigger entry is optional.",
        "audio": "Validating but restrained: 'Closest is enough.' No triumphant completion sound; use a single grounding tone after the final label.",
        "standout": "The emotional shape remains present but no longer fills the screen - a visual metaphor for naming without suppressing."
    },
    {
        "name": "Next Physical Step",
        "goal": "FOCUS", "duration": "1 min", "role": "Opener", "grade": "B+",
        "system": "Action Initiation & Timing",
        "why": "Use this when a task feels mentally large and the person cannot begin. The intervention converts an abstract project into one visible physical action such as 'open the document' or 'put the plate in the sink'. It earns a place because it removes planning load at the exact point where paralysis occurs.",
        "science": "Research on implementation intentions suggests that specific cue-linked actions can help bridge the intention-action gap. This supports concrete planning, while the one-minute micro-step itself should not be presented as a standalone treatment.",
        "source": "Toli et al., 2016 - implementation-intention meta-analysis", "url": "https://pubmed.ncbi.nlm.nih.gov/25965276/",
        "flow": ["Shrink the task", "Name one physical verb + object", "Do that step now"],
        "concept": "A foggy task cloud collapses into one crisp action tile. The app actively coaches vague language into a physical verb and object.",
        "interaction": "Type or speak the task; receive editable examples; press START to launch a brief initiation cue. A skip option prevents the timer becoming another demand.",
        "audio": "Direct, friendly and minimal. One clean start tone; silence while the user performs the action.",
        "standout": "The overwhelming project literally folds down into one tappable card that remains on screen until the first movement is made."
    },
    {
        "name": "Friction Sweep",
        "goal": "FOCUS", "duration": "2 min", "role": "Opener", "grade": "A-",
        "system": "Action Initiation & Timing",
        "why": "Use this when the person wants to begin but the environment keeps winning: an unopened file, missing material, noisy phone or unclear setup. They remove one obstacle and quiet one competing cue before starting. It earns a place because motivation is not always the problem; the path may simply contain too much friction.",
        "science": "Behaviour is sensitive to opportunity, cues and environmental friction, and restructuring settings can alter action in some health domains. Direct mental-health evidence for this two-minute sweep remains limited.",
        "source": "Wilkie et al., 2019 - environment restructuring review", "url": "https://pubmed.ncbi.nlm.nih.gov/31650034/",
        "flow": ["Spot the first friction", "Remove one obstacle", "Quiet one competing cue", "Start immediately"],
        "concept": "A simple workspace scan shows four friction types: access, clutter, distraction and uncertainty. Choosing one opens a single practical removal action.",
        "interaction": "Swipe away one barrier, launch Do Not Disturb via instructions where supported, gather one needed item, or pre-open the correct screen. Then hand off directly to the task.",
        "audio": "Crisp and purposeful; small clearing sounds with no productivity-game fanfare.",
        "standout": "A visible path clears as friction is removed, then becomes the START button - the intervention and the task are one continuous motion."
    },
    {
        "name": "WOOP",
        "goal": "FOCUS / LIFT", "duration": "4 min", "role": "Core", "grade": "A",
        "system": "Action Initiation & Timing + Personalised Choice",
        "why": "Use this when someone has a meaningful goal but optimism alone is not producing action. They identify the wish and desired outcome, face the main internal obstacle, then create an if-then response. It earns a place because it joins motivation with realistic planning rather than treating them as separate problems.",
        "science": "A meta-analysis found mental contrasting with implementation intentions produced a small-to-medium improvement in goal attainment, with some publication-bias caution. It is a brief self-regulation strategy, not a guarantee of success.",
        "source": "Wang et al., 2021 - MCII meta-analysis", "url": "https://pubmed.ncbi.nlm.nih.gov/34054628/",
        "flow": ["Wish", "Best outcome", "Main internal obstacle", "If obstacle, then response"],
        "concept": "Four connected tiles form a short narrative. The obstacle tile rotates and becomes the bridge into the plan, showing that the barrier supplies the cue for action.",
        "interaction": "One concise response per tile, voice or text. Provide editable if-then examples and let the user save, schedule or rehearse the final plan.",
        "audio": "Forward-moving but reflective. A four-note motif gains one layer per tile and resolves only when the if-then plan is usable.",
        "standout": "The user's own obstacle transforms into the trigger for the response - a memorable visual explanation of how WOOP works."
    },
    {
        "name": "Distraction Dump",
        "goal": "FOCUS / SLEEP", "duration": "4 min", "role": "Opener", "grade": "B+",
        "system": "Cognitive Offloading & Containment + Cognitive Sorting",
        "why": "Use this when reminders, ideas and unfinished tasks are competing for working attention. The person captures mental tabs quickly, identifies the true next item and parks the remainder. It earns a place because trying not to forget everything can itself consume the attention needed for work or rest.",
        "science": "Cognitive offloading uses external tools to reduce reliance on internal memory, and reminder research shows it can improve prospective-task performance. The benefit depends on having a trustworthy place to retrieve what was parked.",
        "source": "Gilbert et al., 2022 - intention-offloading review", "url": "https://pubmed.ncbi.nlm.nih.gov/35789477/",
        "flow": ["Open a capture space", "Dump every mental tab", "Mark the true next item", "Park the rest", "Return to one thing"],
        "concept": "Floating browser-like tabs drift into a calm inbox as the user captures each thought. Organisation is deliberately delayed so capture stays fast.",
        "interaction": "Rapid one-line entry by voice or text; circle one item; send the rest to a dated parking container. The saved list must be easy to find later or containment loses credibility.",
        "audio": "Soft paper and closing-lid sounds. Narration is brief and explicitly gives permission not to solve anything during capture.",
        "standout": "The container closes while the one selected focus card remains outside and centred - offloading and prioritisation shown in one image."
    },
    {
        "name": "Awake-in-Bed Reset",
        "goal": "SLEEP", "duration": "3 min", "role": "Rescue", "grade": "A",
        "system": "Action Initiation & Timing (sleep specialist)",
        "why": "Use this after prolonged wakefulness in bed, when clock-checking and effort are strengthening the association between bed and alertness. The person stops monitoring time, briefly moves to a quiet low-stimulation activity, and returns when sleepy. It earns a place because it gives a clear behavioural pathway at a moment when decision-making is poor.",
        "science": "Stimulus control is conditionally recommended as a single-component therapy for chronic insomnia in the AASM guideline. Persistent sleep problems still warrant assessment and full CBT-I may be more appropriate.",
        "source": "AASM, 2021 - insomnia treatment guideline", "url": "https://aasm.org/new-guideline-supports-behavioral-psychological-treatments-for-insomnia/",
        "flow": ["Stop checking the time", "Leave bed briefly", "Choose a quiet activity", "Return when sleepy"],
        "concept": "A very low-light pathway replaces a timer. The interface offers only the next decision, protecting the user from stimulating choices and clock arithmetic.",
        "interaction": "Choose one quiet activity from a short personalised list; tap 'sleepy now' when ready to return. No elapsed-time display, streaks, notifications or bright completion screen.",
        "audio": "Optional near-whisper guidance and dark ambient sound. Default to silence after the plan is clear.",
        "standout": "A user-controlled SLEEPINESS GATE opens the path back to bed; readiness, not a countdown, determines progression."
    },
    {
        "name": "Drop the Sleep Struggle",
        "goal": "SLEEP", "duration": "4 min", "role": "Core / closer", "grade": "A-",
        "system": "Language Transformation + Emotional Wave Tracking",
        "why": "Use this when the effort to force sleep has become the source of alertness and frustration. The intervention removes sleep as a performance task, allows wakefulness and redirects attention from measurement to rest. It earns a place because it targets the struggle around sleeplessness rather than adding another technique the user must perform correctly.",
        "science": "A systematic review found paradoxical intention improved several insomnia outcomes and reduced sleep-related performance anxiety, though stronger modern studies are still needed.",
        "source": "Jansson-Frojmark et al., 2022 - meta-analysis", "url": "https://pubmed.ncbi.nlm.nih.gov/34405469/",
        "flow": ["Release the task of sleeping", "Allow wakefulness", "Notice without measuring", "Let sleep arrive if it does"],
        "concept": "The interface progressively removes demands. 'I must sleep' softens into 'I can rest', controls fade and the screen stops asking the user to achieve anything.",
        "interaction": "No progress bar, scores or fixed finish. The user can listen, read once, dim immediately or leave the app. Keep any breathing support passive and optional.",
        "audio": "Slow, permissive narration with long silence. Avoid verbal countdowns and obvious track endings that invite monitoring.",
        "standout": "The product itself lets go: interaction decreases until only a dark resting field remains, embodying the intervention rather than merely explaining it."
    },
    {
        "name": "Warm and Heavy",
        "goal": "SLEEP / CALM", "duration": "5 min", "role": "Closer", "grade": "B+",
        "system": "Interactive Body Mapping + Language Transformation",
        "why": "Use this when physical tension or bodily alertness is interfering with settling. Repeated warmth-and-heaviness phrases guide attention through the limbs and then the whole body. It earns a place because it provides a passive, low-decision alternative for users who do not want active muscle tensing or breath control.",
        "science": "Meta-analytic evidence for autogenic training reports benefits across several conditions, including anxiety and functional sleep problems. Effects vary, and the full trained method is broader than this five-minute adaptation.",
        "source": "Stetter & Kupper, 2002 - meta-analysis", "url": "https://pubmed.ncbi.nlm.nih.gov/12001885/",
        "flow": ["Right arm: warm and heavy", "Left arm", "Both legs", "Whole body", "Rest in the sensation"],
        "concept": "A softly illustrated body map accumulates warmth and visual weight region by region. The glow does not demand accurate tapping; it simply mirrors the narrated progression.",
        "interaction": "Choose voice, pace and body-position mode. Let users skip uncomfortable regions, reduce warmth imagery or switch to neutral 'supported and still' language.",
        "audio": "Low, unhurried voice over a barely moving drone; gentle stereo placement follows each side of the body, then centres.",
        "standout": "Warmth and heaviness accumulate across the silhouette until the whole figure settles lower in the frame - an immersive bodily ending without a success score."
    },
]


def pstyle(name, size=10, leading=None, color=INK, bold=False, align=TA_LEFT):
    return ParagraphStyle(
        name=name,
        fontName="Helvetica-Bold" if bold else "Helvetica",
        fontSize=size,
        leading=leading or size * 1.28,
        textColor=color,
        alignment=align,
        spaceAfter=0,
        splitLongWords=False,
    )


BODY = pstyle("body", 9.25, 12.0)
SMALL = pstyle("small", 7.5, 9.4, MID)
LABEL = pstyle("label", 8.0, 9.5, GREEN, True)
WHITE_LABEL = pstyle("whitelabel", 7.5, 9, WHITE, True)
SCI = pstyle("science", 8.7, 11.1, NAVY)
CARD = pstyle("card", 8.25, 10.5, INK)
FLOW = pstyle("flow", 7.4, 8.8, NAVY, True, TA_CENTER)


def round_rect(c, x, y, w, h, fill, radius=12, stroke=None, width=1):
    c.setLineWidth(width)
    c.setStrokeColor(stroke or fill)
    c.setFillColor(fill)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)


def paragraph(c, html, x, top, width, style, max_height=1000):
    p = Paragraph(html, style)
    _, h = p.wrap(width, max_height)
    p.drawOn(c, x, top - h)
    return h


def fit_title(c, text, x, y, max_width, base=24):
    size = base
    while size > 16 and stringWidth(text, "Helvetica-Bold", size) > max_width:
        size -= 0.5
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(INK)
    c.drawString(x, y, text)


def draw_pill(c, x, y, text, fill, color=NAVY):
    size = 7.5
    pad = 8
    w = stringWidth(text, "Helvetica-Bold", size) + pad * 2
    round_rect(c, x, y, w, 19, fill, radius=9.5)
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    c.drawCentredString(x + w / 2, y + 6.2, text)
    return w


def draw_flow(c, steps, x, y, w, h):
    n = len(steps)
    gap = 12
    box_w = (w - gap * (n - 1)) / n
    for i, step in enumerate(steps):
        bx = x + i * (box_w + gap)
        fill = [SKY, LILAC, MINT, CREAM, PEACH, LIME][i % 6]
        round_rect(c, bx, y, box_w, h, fill, radius=10)
        p = Paragraph(step, FLOW)
        _, ph = p.wrap(box_w - 10, h - 8)
        p.drawOn(c, bx + 5, y + (h - ph) / 2)
        if i < n - 1:
            ax = bx + box_w + 2
            ay = y + h / 2
            c.setStrokeColor(GREEN)
            c.setFillColor(GREEN)
            c.setLineWidth(1.7)
            c.line(ax, ay, ax + 7, ay)
            c.line(ax + 7, ay, ax + 4, ay + 3)
            c.line(ax + 7, ay, ax + 4, ay - 3)


def draw_page(c, item, index, total):
    c.setFillColor(SOFT)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # top colour bars and identity
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 13, PAGE_W, 13, fill=1, stroke=0)
    c.setFillColor(LIME)
    c.rect(0, PAGE_H - 17, PAGE_W * (index / total), 4, fill=1, stroke=0)

    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(38, PAGE_H - 39, f"MENTICATION  /  NON-FLAGSHIP LIBRARY  /  {index:02d}")
    fit_title(c, item["name"], 38, PAGE_H - 73, 535)

    x = 38
    py = PAGE_H - 110
    for text, fill in [
        (item["goal"], LIME), (item["duration"], SKY), (item["role"], LILAC),
        (f"Evidence {item['grade']}", CREAM), (item["system"], MINT)
    ]:
        pw = draw_pill(c, x, py, text, fill)
        x += pw + 7

    # WHY panel
    left_x, left_w = 38, 355
    round_rect(c, left_x, 298, left_w, 180, WHITE, radius=14, stroke=LINE)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(left_x + 16, 454, "WHY THIS EARNS A PLACE")
    paragraph(c, item["why"], left_x + 16, 437, left_w - 32, BODY, 120)

    # science inset
    round_rect(c, left_x, 185, left_w, 98, CREAM, radius=14)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(left_x + 16, 260, "SCIENCE, KEPT HONEST")
    paragraph(c, item["science"], left_x + 16, 245, left_w - 32, SCI, 55)
    src = f'<link href="{item["url"]}" color="#0D5D46"><u>{item["source"]}</u></link>'
    paragraph(c, src, left_x + 16, 201, left_w - 32, SMALL, 18)

    # Engagement panel
    right_x, right_w = 410, PAGE_W - 448
    round_rect(c, right_x, 185, right_w, 293, NAVY, radius=14)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(right_x + 16, 454, "HOW WE MAKE IT ENGAGING")

    sections = [
        ("CORE EXPERIENCE", item["concept"], MINT),
        ("INTERACTION + PERSONALISATION", item["interaction"], SKY),
        ("VISUAL + AUDIO DIRECTION", item["audio"], LILAC),
    ]
    top = 436
    for label, text, accent in sections:
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(right_x + 16, top, label)
        top -= 7
        h = paragraph(c, text, right_x + 16, top, right_w - 32, pstyle("tmp", 8.4, 10.6, WHITE), 70)
        top -= h + 13

    # Standout feature inside engagement panel
    round_rect(c, right_x + 12, 200, right_w - 24, 65, GREEN, radius=10)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(right_x + 26, 246, "STANDOUT FEATURE")
    paragraph(c, item["standout"], right_x + 26, 235, right_w - 52, pstyle("standout", 8.3, 10.4, WHITE), 40)

    # Coded pathway band
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(38, 159, "CURRENT CODED PATHWAY")
    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    c.drawRightString(PAGE_W - 38, 159, "Names and order preserved from the active 25-intervention catalogue")
    draw_flow(c, item["flow"], 38, 92, PAGE_W - 76, 52)

    # footer
    c.setStrokeColor(LINE)
    c.line(38, 67, PAGE_W - 38, 67)
    c.setFillColor(MID)
    c.setFont("Helvetica", 6.7)
    c.drawString(38, 48, "PRODUCT PLANNING NOTE  |  Brief self-guided support, not diagnosis or a replacement for professional care. Safety and accessibility review required before release.")
    c.drawRightString(PAGE_W - 38, 48, f"{index} / {total}")
    c.showPage()


def build():
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4), pageCompression=1)
    c.setTitle("Mentication - Non-Flagship Intervention Library")
    c.setAuthor("Mentication planning document")
    c.setSubject("Purpose, evidence and engagement direction for 16 active non-flagship interventions")
    for idx, item in enumerate(DATA, start=1):
        draw_page(c, item, idx, len(DATA))
    c.save()
    print(OUT.resolve())


if __name__ == "__main__":
    build()
