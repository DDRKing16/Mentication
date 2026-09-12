from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image as RLImage, Table, TableStyle, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.enums import TA_CENTER

ROOT = Path('/Users/dylandesai-rogers/Documents/Mentication App Build (Code)')
OUT = ROOT / 'output'
PDF_OUT = OUT / 'pdf' / 'mentation-thought-or-fact-complete-handoff.pdf'
ATLAS_OUT = OUT / 'live-thought-or-fact-screen-atlas.png'
OUT.mkdir(exist_ok=True); PDF_OUT.parent.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Cover', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=30, leading=36, textColor=colors.HexColor('#071B1A'), spaceAfter=12))
styles.add(ParagraphStyle(name='Sub', parent=styles['Normal'], fontName='Helvetica', fontSize=12, leading=18, textColor=colors.HexColor('#4B5B59'), spaceAfter=12))
styles.add(ParagraphStyle(name='H1x', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=20, leading=25, textColor=colors.HexColor('#071B1A'), spaceBefore=10, spaceAfter=10))
styles.add(ParagraphStyle(name='H2x', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=17, textColor=colors.HexColor('#0D4B43'), spaceBefore=10, spaceAfter=5))
styles.add(ParagraphStyle(name='Bodyx', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.4, leading=14, textColor=colors.HexColor('#263735'), spaceAfter=7))
styles.add(ParagraphStyle(name='Smallx', parent=styles['BodyText'], fontName='Helvetica', fontSize=7.6, leading=10, textColor=colors.HexColor('#42504D'), spaceAfter=4))
styles.add(ParagraphStyle(name='Caption', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor('#0D4B43'), alignment=TA_CENTER, spaceAfter=9))

def p(text, style='Bodyx'): return Paragraph(text, styles[style])
def heading(text, level='H1x'): return Paragraph(text, styles[level])
def img(path, width):
    im = Image.open(path)
    return RLImage(str(path), width=width, height=width * im.height / im.width)

def table(rows, widths):
    t = Table([[p(cell, 'Smallx') for cell in row] for row in rows], colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0D4B43')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), .35, colors.HexColor('#D9D9D9')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F7F4EE')),
        ('LEFTPADDING', (0,0), (-1,-1), 7), ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

story = []
story += [Spacer(1, 2.2*inch), p('MENTICATION', 'Caption'), p('Thought or Fact', 'Cover'), p('Complete product, visual, clinical and engineering handoff', 'Sub'), Spacer(1, .25*inch), p('Purpose: enable a new product, design or engineering team to understand, rebuild and safely extend the intervention without needing prior project context.', 'Bodyx'), PageBreak()]

story += [heading('What this intervention is'), p('Thought or Fact is a guided cognitive appraisal intervention for an everyday upsetting thought. It separates an observation from interpretations, feelings and predictions; surfaces possible thinking shortcuts without diagnosing the person; gathers evidence for and against; and helps the person leave with a more balanced, editable perspective.'), heading('Current production flow', 'H2x'), p('Readiness - Thought capture - Precise claim - Thinking-pattern suggestions - Statement type - Evidence for - Evidence against - Other explanations - What remains open - Balanced perspective plus final rating - Next step or handoff.'), heading('Core experience rules', 'H2x'), table([['Rule','Implementation meaning'], ['User authorship','The original thought remains visible and the balanced thought is editable. No forced positive reframing.'], ['Uncertainty','Patterns are suggestions, not verdicts. The app never labels a concern false.'], ['One decision at a time','Each screen has one primary decision. Avoid duplicate ratings and redundant evidence overview screens.'], ['Safety','Grounding and Test the Prediction routes remain available; testing requires an explicit safety confirmation.'], ['Privacy','The working experience is local-first. Do not add claims about AI processing, storage or deletion without the corresponding release infrastructure.']], [1.45*inch, 5.05*inch]), PageBreak()]

story += [heading('Live screen catalogue'), p('The following atlas is captured directly from the running production app at the 390 x 844 mobile viewport. It documents the 12 key live states in the streamlined experience: the redundant evidence overview is removed, statement sorting is one tap, and the final rating is integrated into the balanced-thought screen.'), img(ATLAS_OUT, 2.8*inch), PageBreak()]

screen_purposes = [
('01 Thought capture','Capture the thought in the person\'s own language. Case-file textarea, voice trigger, privacy label, Open case and Ground first.'),
('02 Voice capture','Permission-aware voice capture. Recording, elapsed time, cancellation and no retained-audio claim only when true.'),
('03 Claim confirmation','Keep original words alongside an editable claim. Continue with either version.'),
('04 Baseline rating','Original board baseline rating. In the current streamlined build, use the Reset start rating rather than duplicating this screen.'),
('05 Charge sheet','Zero-to-many thinking patterns. Suggested cards must point to exact language and remain optional.'),
('06-11 Evidence work','Production uses four concise sequential surfaces: evidence for, evidence against, other explanations and what remains open.'),
('12-13 Questioning','Original configurable cross-examination design. Preserve only if a validated question bank is supplied.'),
('14-16 Balanced perspective','Production uses one editable balanced-thought screen with the final rating integrated below it.'),
('17-22 Exit and handoffs','Leave here, grounding, practical action and Test the Prediction. Handoffs must preserve the user\'s context without forcing a verdict.'),
]
story += [heading('Screen-by-screen implementation notes')]
for name, desc in screen_purposes:
    story += [heading(name, 'H2x'), p(desc)]
story += [PageBreak()]

story += [heading('Visual design system'), table([['Token','Specification'], ['Canvas','390 px flagship mobile viewport; responsive 320-430 px; safe-area aware.'], ['Palette','Deep teal #071B1A, elevated teal #0D302C, emerald #0D4B43, cream #F3E8D2, antique gold #B99350, oxblood #58212B.'], ['Typography','Fraunces/Georgia editorial serif for display headings and thought content; Hanken Grotesk or sans for labels and controls. Body at least 16 px in app.'], ['Spacing','24 px page margins, 8 px spacing base, 16-24 px component padding, 16 px minimum between unrelated controls.'], ['Controls','Primary 56 px targets; all controls at least 44 px; visible focus; selected state must not rely only on colour.'], ['Material language','Cream is reserved for authored content and foreground paper; brass borders are fine and restrained; avoid generic rounded-card stacks.'], ['Motion','180-260 ms standard; only opacity/transform; reduced-motion falls back to crossfade.']], [1.45*inch, 5.05*inch]), heading('Visual assets', 'H2x'), p('Supplied artwork: asset-01-case-file.png, asset-02-evidence-scale.png and asset-03-completion-seal.png. UI icons are code-native Lucide vectors: back, close, microphone, lock, evidence categories, editing, plus/minus and handoff symbols. Do not substitute emojis or custom CSS illustrations.'), PageBreak()]

story += [heading('Guided thinking-pattern suggestions'), p('The release experience is designed for AI-assisted analysis. The UI never needs to announce whether analysis is AI or local; it should simply explain why a pattern is suggested and let the person decide. Every suggested pattern must expose the exact triggering language in the claim.'), table([['Pattern','Typical language signal','Balanced response direction'], ['Mind reading','they think, everyone thinks, nobody likes me','Name uncertainty about other minds and ask what can actually be known.'], ['Jumping to conclusions','they will, must mean, definitely','Turn a conclusion back into a possibility.'], ['Overgeneralising','all people, everyone, nobody, always, never','Move from an absolute group conclusion to specific people or moments.'], ['Emotional reasoning','I feel, I hate, I am anxious','Validate the feeling without using it as proof.'], ['Discounting positives','does not count, does not matter','Keep exceptions and disconfirming evidence in the picture.'], ['Personalising','my fault, because of me','Make room for multiple causes.']], [1.45*inch, 2.05*inch, 3*inch]), p('Current code provides transparent local phrase matching as a fallback. A release AI service should return the same shape: pattern ID, exact source spans, short reason, confidence, and a safe fallback when no pattern is appropriate.'), PageBreak()]

story += [heading('Personalised balanced thought'), p('The conclusion must be short, specific and credible. It should not concatenate generic CBT statements. The output should use: the original claim, selected patterns, evidence against, alternative explanations and open questions. It must be editable.'), table([['Input','Example'], ['Original thought','I hate all people in Melbourne because I just feel like everyone is cooked.'], ['Patterns selected','Overgeneralising; emotional reasoning.'], ['Evidence against','My sister and two friends have treated me well.'], ['Balanced thought','I am feeling fed up with people in Melbourne right now. That feeling is real, but it does not prove every person is the same. My sister and two friends have treated me well is an exception worth holding alongside it.']], [1.45*inch, 5.05*inch]), heading('AI integration contract', 'H2x'), p('Input to the AI service should be an ephemeral case object with raw thought, active claim, selected patterns, evidence entries and user-editable final thought. Output should include only allowed pattern IDs, exact quotation spans, a brief rationale and a maximum three-sentence balanced thought. Validate output against the approved taxonomy, preserve uncertainty, block diagnoses and crisis advice, and always permit manual editing or skipping.'), PageBreak()]

story += [heading('Engineering map'), table([['File','Responsibility'], ['src/pages/ResetFlow.jsx','Entry readiness, Thought capture folder, voice permission state, initial Reset rating handoff and intervention routing.'], ['src/components/ThoughtOrFactExperience.jsx','The staged intervention: claim confirmation, patterns, statement type, evidence lanes, balanced thought, final rating and handoffs.'], ['src/lib/thoughtOrFactState.js','Draft normalisation, non-identifying learning record, language signal matching and balanced-thought builder.'], ['src/styles/thought-or-fact.css','Dedicated visual system, safe areas, responsive layout, reduced motion and high-contrast states.'], ['src/lib/eliteInterventionSystem.test.js','Focused regression suite for routing, safety, privacy language, state normalisation and cognitive pattern behaviour.']], [1.8*inch, 4.7*inch]), heading('State and persistence', 'H2x'), p('Keep raw thought, refined claim, thinking patterns, statement classification, evidence arrays, balanced thought, rating and selected handoff separate. Normalise drafts before local persistence. Recommendation learning records must retain only aggregate metadata such as classification and rating shift - not the person\'s raw words or evidence.'), heading('Accessibility and device behaviour', 'H2x'), p('Use semantic buttons, labels, details/summary disclosures and range inputs. Maintain 16 px minimum editable input text to prevent iOS zoom. Support keyboard focus, screen-reader announcements, safe-area insets, reduced motion, high contrast and large text. A small mobile screen must not require scrolling merely to reveal a required choice.'), PageBreak()]

story += [heading('Release acceptance checklist'), table([['Area','Must pass before release'], ['Visual QA','Inspect each state at 390x844 plus 320, 375, 430, tablet and desktop. Check contrast, alignment, touch targets and no horizontal overflow.'], ['Flow QA','One start rating and one end rating only. One-tap statement categorisation. No redundant evidence overview. All handoffs preserve state.'], ['AI QA','Every suggestion includes exact source spans; output stays tentative, editable and situation-specific; no diagnosis or invented facts.'], ['Privacy QA','Claims about deletion, AI processing, retention or storage must match the shipped architecture and policy.'], ['Safety QA','Grounding, leave and Test the Prediction boundaries work; unsafe test scenarios never receive an experiment prompt.'], ['Engineering QA','Run focused tests, lint, production build and native sync when preparing Capacitor builds.']], [1.35*inch, 5.15*inch]), heading('How to rebuild from this handoff', 'H2x'), p('Start with the visual system and the first mobile screen. Implement one stage at a time, write a focused behaviour test first, inspect the rendered screen at the target viewport, then proceed. Keep the component and CSS scoped to Thought or Fact. Integrate the AI service behind the documented data contract only after retention, safety and policy decisions are final.'), Spacer(1,.35*inch), p('Source material: Mentication Thought or Fact build specification and supplied screen mock-ups. This document records the currently implemented streamlined production flow where it intentionally differs from the original 22-screen board.', 'Smallx')]

def footer(canvas, doc):
    canvas.saveState(); canvas.setStrokeColor(colors.HexColor('#B99350')); canvas.line(36, 28, A4[0]-36, 28)
    canvas.setFont('Helvetica', 8); canvas.setFillColor(colors.HexColor('#42504D'))
    canvas.drawString(36, 16, 'Mentication - Thought or Fact complete handoff')
    canvas.drawRightString(A4[0]-36, 16, f'Page {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate(str(PDF_OUT), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=38, bottomMargin=42)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(PDF_OUT)
print(ATLAS_OUT)
