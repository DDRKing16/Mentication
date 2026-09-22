import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        
        # Background Gradient
        self.setFillColor(colors.HexColor("#1A1135")) # Deep Indigo/Navy
        self.rect(0, 0, 612, 792, fill=True, stroke=False)
        
        # Ambient blur circles (approximated)
        self.setFillColor(colors.HexColor("#3C256E"))
        self.circle(550, 700, 150, fill=True, stroke=False)
        self.circle(60, 100, 120, fill=True, stroke=False)
        
        # Translucent overlay
        self.setFillColor(colors.HexColor("#1D1333"), alpha=0.85)
        self.rect(0, 0, 612, 792, fill=True, stroke=False)
        
        # Header / Footer lines
        self.setStrokeColor(colors.HexColor("#3E2A6E"))
        self.setLineWidth(1)
        self.line(36, 730, 576, 730)
        self.line(36, 60, 576, 60)
        
        # Header text
        self.setFillColor(colors.HexColor("#E9D5FF"))
        self.setFont("Helvetica-Bold", 10)
        self.drawString(36, 742, "THE HAPPY BUMP")
        
        self.setFillColor(colors.HexColor("#A78BFA"))
        self.setFont("Helvetica", 9)
        self.drawRightString(576, 742, "Interactive Screenflow Design & Spec")
        
        # Footer text
        self.setFillColor(colors.HexColor("#8E7EBE"))
        self.setFont("Helvetica", 8)
        self.drawString(36, 42, "Mentication \u2014 Guided Wellbeing Resets")
        self.drawRightString(576, 42, f"Page {self._pageNumber} of {total_pages}")
        
        self.restoreState()

def generate_pdf():
    pdf_dir = "/Users/dylandesai-rogers/Documents/GitHub/Mentication/output/pdf"
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = os.path.join(pdf_dir, "happy-bump-screens-specification.pdf")
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=80,
        bottomMargin=80
    )
    
    styles = getSampleStyleSheet()
    
    # Custom premium styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor('#F3EFFF'),
        alignment=1, # Center
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#DDD6FE'),
        alignment=1,
        spaceAfter=30
    )
    
    screen_title_style = ParagraphStyle(
        'ScreenTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#F3EFFF'),
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'ScreenBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#D8CCFF'),
        spaceAfter=12
    )
    
    metadata_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#A78BFA'),
    )
    
    metadata_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#DDD6FE'),
    )
    
    step_badge_style = ParagraphStyle(
        'StepBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#2A1C4E'),
    )

    story = []
    
    # --- Title Page ---
    story.append(Spacer(1, 100))
    story.append(Paragraph("THE HAPPY BUMP", title_style))
    story.append(Paragraph("A 11-step, high-fidelity stacked behavioral activation journey", subtitle_style))
    story.append(Spacer(1, 20))
    
    intro_p = ParagraphStyle(
        'IntroP',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#D8CCFF'),
        alignment=1
    )
    story.append(Paragraph("This document specifies the exact flow, copy, triggers, and responsive layout specifications for all screens within <b>The Happy Bump</b> flagship experience in Mentication.", intro_p))
    story.append(Spacer(1, 30))
    
    # Overview Box Table
    summary_data = [
        [Paragraph("Clinical Mechanism", metadata_label_style), Paragraph("Stacked Behavioural Activation", metadata_value_style)],
        [Paragraph("Target State", metadata_label_style), Paragraph("Apathy, flat mood, bedtime inertia, or physical fatigue", metadata_value_style)],
        [Paragraph("Steps / Scenes", metadata_label_style), Paragraph("11 sequential progressive milestones", metadata_value_style)],
        [Paragraph("Interactive Features", metadata_label_style), Paragraph("Hydration, Environment Interruption, Connected Walk, Bounded Micro-wins, Gratitude, Action Planning, Rerating", metadata_value_style)],
    ]
    summary_table = Table(summary_data, colWidths=[140, 360])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#2F2354')),
        ('PADDING', (0,0), (-1,-1), 12),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#4B3D7A')),
    ]))
    
    # Wrap in container table to center it
    outer_table = Table([[summary_table]], colWidths=[500])
    outer_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(outer_table)
    story.append(PageBreak())
    
    # --- Screen Specifications ---
    screens = [
        {
            "num": "Arrival",
            "title": "Welcome Screen",
            "body": "Shift your state. Eleven short steps, about 10\u201315 minutes. No motivation required.",
            "interactive": "Offers user option to 'Run my saved bump' if a combination is locally stored, or tap a large primary 'Start' button.",
            "narration": "Preloads and plays custom audio track encouraging a soft, low-friction beginning.",
            "design": "Ambient blurred radial orbs breathing from 0.96 to 1.06 scale. Grain overlay mix."
        },
        {
            "num": "Step 1",
            "title": "Energy Baseline Calibration",
            "body": "Where are you at right now?",
            "interactive": "Horizontal slider (0-10) scaled from 'Flat' to 'More alive'.",
            "narration": "Prompts an honest, low-pressure rating.",
            "design": "Interactive curve line peaks or flattens dynamically with the slider position."
        },
        {
            "num": "Step 2",
            "title": "Micro Hydration",
            "body": "Drink a glass of water. Take a moment and finish what feels comfortable.",
            "interactive": "Large interactive 'Droplets' icon. Main CTA is 'I've had some water'.",
            "narration": "Supports the somatic grounding of drinking.",
            "design": "Clean, large, glowing glass / droplets visual with subtle floating transitions."
        },
        {
            "num": "Step 3",
            "title": "Fresh Air & Light Interruption",
            "body": "Open a window or step into some light. Thirty seconds. Feel the air, notice the light, take a slow breath.",
            "interactive": "Main CTA 'I did that'. Large glowing Sun icon.",
            "narration": "Saves space for sensory awareness.",
            "design": "Solar flare / soft gold ambient glow breathing animation."
        },
        {
            "num": "Step 4A",
            "title": "Choosing Walk Route",
            "body": "Okay, we're going for a walk. You've done two small things already. Step outside for a couple of minutes.",
            "interactive": "Route selection buttons: 'Walk to the door and back', 'Walk around the block'. Optional bypass text link: 'I'll walk inside instead'.",
            "narration": "Builds incremental buy-in.",
            "design": "2-column button grid matching the worries-stored pill styles."
        },
        {
            "num": "Step 4B",
            "title": "Walk Progress Tracker",
            "body": "Take a short walk. You can connect with someone while you walk.",
            "interactive": "Shows countdown timer 'MM:SS of 5:00'. Button to progress: 'Connect while I walk'.",
            "narration": "Runs continuous encouraging wind-down playback.",
            "design": "Vibrant circular ring indicator displaying actual walk duration."
        },
        {
            "num": "Step 5",
            "title": "Social Connection Re-entry",
            "body": "Reach out to someone. One genuine signal is enough.",
            "interactive": "Interactive options: 'Text message', 'Facebook Messenger' (opens deep-linked app), 'Voice note', 'Phone call', 'Skip connecting'.",
            "narration": "Validates low-pressure connection.",
            "design": "2-column option grid with rounded shapes, and prominent mic/phone helper icons."
        },
        {
            "num": "Step 6A",
            "title": "Micro-Win Selection",
            "body": "One small win. Pick something small enough to finish now.",
            "interactive": "Curated selection: 'Put one thing away', 'Reply to one message', 'Open the curtains', 'Clear one small surface'. Text field for custom 'tiny finish' input.",
            "narration": "Focuses mind on a single startable unit.",
            "design": "Compact cards with custom input field."
        },
        {
            "num": "Step 6B",
            "title": "The Mission Focus",
            "body": "[Selected Task Title] \u2014 Nothing else belongs in this moment.",
            "interactive": "A single focus bubble. Main button: 'Done'. Link: 'I made an honest start'.",
            "narration": "Silence or focused audio.",
            "design": "Orbiting 'NOW' sphere holding focus around the active task."
        },
        {
            "num": "Step 7",
            "title": "Triple Refection Loop",
            "body": "Proud loop: 'What are you proud of?'\nGrateful loop: 'What are you grateful for?'\nAnticipate loop: 'What are you looking forward to?'",
            "interactive": "Voice dictation support (holding mic icon to dictate) or quick selected suggestion tags. Link 'Continue' to advance.",
            "narration": "Voice prompts with responsive input pauses.",
            "design": "Dictation animation pulsing gold and mint around the microphone input."
        },
        {
            "num": "Step 8A",
            "title": "Selecting Wellbeing Area",
            "body": "What deserves a little attention next? Six parts of wellbeing.",
            "interactive": "6 options: Relationships, Physical health, Purpose & work, Learning & growth, Financial wellbeing, Community. Shortcut: 'Low-effort path'.",
            "narration": "Relaxes planning pressure.",
            "design": "3x2 high-contrast grid with custom icons."
        },
        {
            "num": "Step 8B",
            "title": "Micro-Action Planning",
            "body": "Pick one low-effort step. Tap one that feels realistic, not impressive.",
            "interactive": "List of 3 pre-written micro-actions per area, plus custom text input.",
            "narration": "Helps users select easy actions over hard ones.",
            "design": "Clean suggested action cards."
        },
        {
            "num": "Step 9A",
            "title": "Next Mode Choice",
            "body": "What would serve you now? Choose one more thing to carry this momentum into.",
            "interactive": "Modes: Productive (Make effort easier), Enjoyable (Choose a little pleasure), Relaxing (Settle into comfort).",
            "narration": "Eases transitional pressure.",
            "design": "Grid cards featuring clear detail hints."
        },
        {
            "num": "Step 9B",
            "title": "Action Execution Script",
            "body": "Make effort easier to enter / Make the experience easy to feel.",
            "interactive": "Productive: Activity, Pairing item, Reward plan. Relaxing/Enjoyable: Activity, Senses comfort checklist (Sight, Sound, Touch, Smell, Taste).",
            "narration": "Validates realistic planning.",
            "design": "Saves and renders a beautiful dynamic preview script: 'I'll [Activity] while I [Pairing], then I'll [Reward].'"
        },
        {
            "num": "Step 10A",
            "title": "Energy Rerating Calibration",
            "body": "Where are you now? No result is the right result. Take an honest read.",
            "interactive": "Slider to rate ending energy (0-10). Shows comparison overlay of 'Then' vs 'Now'.",
            "narration": "Frames assessment as completely neutral.",
            "design": "Double-indicator horizontal rail."
        },
        {
            "num": "Step 10B",
            "title": "Energy Shift Reveal",
            "body": "[Result Statement, e.g. 'A 3-step bump', 'The line held' or 'You still moved']",
            "interactive": "Primary CTA 'See what you built'. Displays comparative bar.",
            "narration": "Celebrates effort, regardless of the numerical shift.",
            "design": "Fills horizontal bar based on energy change."
        },
        {
            "num": "Step 11",
            "title": "The Completed Bump Resume",
            "body": "Small inputs. Real movement. A direction to keep.",
            "interactive": "Displays dynamic resume of all micro-milestones completed during the session, showing a streak, and offering a 'Save my bump' combination toggle.",
            "narration": "Plays clean, premium 'complete' chime.",
            "design": "Elegant visual summary card including completed action icons and supportive quotes."
        }
    ]
    
    for screen in screens:
        # Title & Badge Row Table
        badge_cell = Paragraph(f"<b>{screen['num'].upper()}</b>", step_badge_style)
        title_cell = Paragraph(screen['title'], screen_title_style)
        
        row_table = Table([[badge_cell, title_cell]], colWidths=[65, 435])
        row_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), colors.HexColor('#A78BFA')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (0,0), 6),
            ('RIGHTPADDING', (0,0), (0,0), 6),
        ]))
        
        story.append(row_table)
        story.append(Spacer(1, 10))
        
        # Details inside box
        spec_data = [
            [Paragraph("Instructional Copy", metadata_label_style), Paragraph(screen['body'].replace('\n', '<br/>'), metadata_value_style)],
            [Paragraph("Interaction Model", metadata_label_style), Paragraph(screen['interactive'], metadata_value_style)],
            [Paragraph("Psychoacoustic Narration", metadata_label_style), Paragraph(screen['narration'], metadata_value_style)],
            [Paragraph("Visual System", metadata_label_style), Paragraph(screen['design'], metadata_value_style)],
        ]
        
        spec_table = Table(spec_data, colWidths=[130, 350])
        spec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#241947')),
            ('PADDING', (0,0), (-1,-1), 10),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#3E2A6E')),
        ]))
        
        outer_container = Table([[spec_table]], colWidths=[480])
        outer_container.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('PADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 25),
        ]))
        
        story.append(outer_container)
        
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == '__main__':
    generate_pdf()
