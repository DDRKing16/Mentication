import InterventionNav from "@/components/brand/InterventionNav";
import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronLeft, 
  Pause, 
  Play,
  Sparkles,
  Briefcase,
  BookOpen,
  Mail,
  Palette,
  Utensils,
  Activity,
  Package,
  Clock,
  X,
  Home
} from "lucide-react";
import { consumeNextStepHandoff } from "@/lib/tomorrowParking/storage";

// Category to Lucide icon mapping for Image 1 premium grid
const CATEGORY_ICONS = {
  cleaning: Sparkles,
  work: Briefcase,
  study: BookOpen,
  email: Mail,
  creative: Palette,
  cooking: Utensils,
  exercise: Activity,
  errands: Package
};

// Official locked color theme tokens for inline styles
const PRIMARY_LIGHT = "#E1E8C1"; // Sunlit Yellow-Green Success fill / text on burgundy
const ACCENT_CORAL = "#E75A6D"; // Underlines, sparkles, vertical fill base


const CATEGORY_THEMES = {
  cleaning: {
    name: "Cleaning",
    icon: "🧹",
    subcategories: [
      {
        id: "quick-wins",
        name: "Quick Wins",
        icon: "⚡",
        tasks: [
          { id: "tidy-desk", name: "Tidy my desk", duration: "5 min" },
          { id: "dishes", name: "Do dishes", duration: "10 min" },
          { id: "laundry", name: "Laundry", duration: "8 min" },
          { id: "wipe-counters", name: "Wipe kitchen counters", duration: "4 min" },
          { id: "take-out-trash", name: "Take out trash", duration: "3 min" },
          { id: "make-bed", name: "Make my bed", duration: "2 min" },
          { id: "clean-mirror", name: "Clean bathroom mirror", duration: "3 min" },
          { id: "sweep-floor", name: "Sweep bedroom floor", duration: "7 min" },
        ]
      },
      {
        id: "kitchen-duty",
        name: "Kitchen Duty",
        icon: "🍳",
        tasks: [
          { id: "empty-dishwasher", name: "Empty dishwasher", duration: "6 min" },
          { id: "dust-bookshelf", name: "Dust one bookshelf", duration: "5 min" },
          { id: "fold-clothing", name: "Fold 5 clothes", duration: "5 min" },
          { id: "clean-peripherals", name: "Clean keyboard & mouse", duration: "3 min" },
          { id: "wipe-fridge", name: "Wipe fridge door", duration: "4 min" },
          { id: "organize-drawer", name: "Organize one drawer", duration: "10 min" },
          { id: "vacuum-carpet", name: "Vacuum carpet", duration: "8 min" },
        ]
      },
      {
        id: "living-space",
        name: "Living Space",
        icon: "🏠",
        tasks: [
          { id: "wipe-dining-table", name: "Wipe dining table", duration: "3 min" },
          { id: "sort-mail", name: "Sort paper mail", duration: "10 min" },
          { id: "put-away-shoes", name: "Put away stray shoes", duration: "3 min" },
          { id: "water-plants", name: "Water indoor plants", duration: "4 min" },
          { id: "scrub-sink", name: "Scrub kitchen sink", duration: "6 min" },
          { id: "wash-mugs", name: "Wash coffee mugs", duration: "5 min" },
          { id: "wipe-window-sill", name: "Wipe window sill", duration: "3 min" },
          { id: "reset-bedside", name: "Reset bedside table", duration: "5 min" },
        ]
      },
      {
        id: "deep-reset",
        name: "Deep Reset",
        icon: "🧹",
        tasks: [
          { id: "clear-car-trash", name: "Clear trash from car", duration: "8 min" },
          { id: "shake-mat", name: "Shake out door mat", duration: "2 min" },
          { id: "spray-air", name: "Spray air & ventilate", duration: "3 min" },
          { id: "tidy-bathroom-counter", name: "Tidy bathroom counter", duration: "6 min" },
          { id: "wipe-remotes", name: "Wipe down remotes", duration: "3 min" },
          { id: "sort-laundry", name: "Sort light clothes", duration: "6 min" },
          { id: "clean-window", name: "Clean window pane", duration: "5 min" },
        ]
      },
    ]
  },
  work: {
    name: "Work",
    icon: "💼",
    subcategories: [
      {
        id: "focus-work",
        name: "Focus Work",
        icon: "🧠",
        tasks: [
          { id: "write-report", name: "Write report", duration: "12 min" },
          { id: "emails", name: "Reply to emails", duration: "6 min" },
          { id: "presentation", name: "Prep presentation", duration: "15 min" },
          { id: "update-board", name: "Update project board", duration: "8 min" },
          { id: "to-do-list", name: "Create to-do list", duration: "5 min" },
          { id: "meeting-minutes", name: "Review meeting minutes", duration: "7 min" },
          { id: "refactor-function", name: "Refactor one function", duration: "15 min" },
          { id: "project-milestones", name: "Outline project milestones", duration: "10 min" },
        ]
      },
      {
        id: "quick-admin",
        name: "Quick Admin",
        icon: "📝",
        tasks: [
          { id: "clean-desktop", name: "Clean desktop files", duration: "6 min" },
          { id: "brainstorm-ideas", name: "Brainstorm 3 ideas", duration: "5 min" },
          { id: "send-progress-update", name: "Send progress update", duration: "4 min" },
          { id: "organize-invites", name: "Organize calendar invites", duration: "5 min" },
          { id: "draft-email", name: "Write draft email", duration: "6 min" },
          { id: "review-pr", name: "Review pull request", duration: "12 min" },
          { id: "check-metrics", name: "Check performance metrics", duration: "8 min" },
        ]
      },
      {
        id: "planning",
        name: "Planning",
        icon: "📅",
        tasks: [
          { id: "document-api", name: "Document API endpoint", duration: "10 min" },
          { id: "schedule-sync", name: "Schedule weekly sync", duration: "5 min" },
          { id: "backup-files", name: "Back up work files", duration: "4 min" },
          { id: "slack-status", name: "Set Slack & clear pings", duration: "3 min" },
          { id: "sketch-wireframe", name: "Sketch UI wireframe", duration: "12 min" },
          { id: "research-competitor", name: "Research competitor site", duration: "15 min" },
          { id: "format-spreadsheet", name: "Format spreadsheet columns", duration: "8 min" },
          { id: "answer-dm", name: "Answer pending DM", duration: "4 min" },
        ]
      },
      {
        id: "digital-clean",
        name: "Digital Clean",
        icon: "💻",
        tasks: [
          { id: "clear-tabs", name: "Clear browser tabs", duration: "5 min" },
          { id: "update-readme", name: "Update repository readme", duration: "10 min" },
          { id: "timesheet", name: "Log daily time sheet", duration: "3 min" },
          { id: "prep-agenda", name: "Prep meeting agenda", duration: "6 min" },
          { id: "review-okrs", name: "Review OKRs & targets", duration: "10 min" },
          { id: "setup-workspace-env", name: "Set up dev environment", duration: "5 min" },
          { id: "archive-files", name: "Archive old files", duration: "8 min" },
        ]
      },
    ]
  },
  study: {
    name: "Study",
    icon: "📚",
    subcategories: [
      {
        id: "deep-read",
        name: "Deep Read",
        icon: "📖",
        tasks: [
          { id: "read-chapter", name: "Read chapter", duration: "10 min" },
          { id: "essay", name: "Write essay", duration: "15 min" },
          { id: "notes", name: "Revise notes", duration: "7 min" },
          { id: "flashcards", name: "Flashcard review", duration: "5 min" },
          { id: "lecture-clip", name: "Watch lecture clip", duration: "12 min" },
          { id: "math-problem", name: "Solve practice problem", duration: "8 min" },
          { id: "highlight-passages", name: "Highlight key passages", duration: "6 min" },
          { id: "essay-thesis", name: "Outline essay thesis", duration: "10 min" },
        ]
      },
      {
        id: "review-revise",
        name: "Review & Revise",
        icon: "📝",
        tasks: [
          { id: "study-sources", name: "Research study sources", duration: "15 min" },
          { id: "drive-folders", name: "Organize study folders", duration: "5 min" },
          { id: "summarize-notes", name: "Summarize lecture notes", duration: "10 min" },
          { id: "active-recall", name: "Practice active recall", duration: "8 min" },
          { id: "study-timer", name: "Set up study timer", duration: "2 min" },
          { id: "study-schedule", name: "Draft study schedule", duration: "7 min" },
          { id: "study-podcast", name: "Listen to edu podcast", duration: "12 min" },
        ]
      },
      {
        id: "active-practice",
        name: "Active Practice",
        icon: "🧠",
        tasks: [
          { id: "formula-sheet", name: "Write down formula sheet", duration: "10 min" },
          { id: "explain-concept", name: "Explain concept aloud", duration: "6 min" },
          { id: "citations", name: "Complete bibliography", duration: "10 min" },
          { id: "definitions", name: "Highlight definitions", duration: "5 min" },
          { id: "quiz-questions", name: "Solve 3 quiz questions", duration: "8 min" },
          { id: "crash-course", name: "Watch crash course video", duration: "12 min" },
          { id: "organize-notebooks", name: "Organize notebooks", duration: "6 min" },
          { id: "read-abstract", name: "Read academic abstract", duration: "5 min" },
        ]
      },
      {
        id: "study-setup",
        name: "Study Setup",
        icon: "🎒",
        tasks: [
          { id: "mind-map", name: "Draw topic mind map", duration: "15 min" },
          { id: "exam-feedback", name: "Review exam feedback", duration: "8 min" },
          { id: "desk-lamp", name: "Set up study space", duration: "3 min" },
          { id: "essay-arguments", name: "Brainstorm arguments", duration: "10 min" },
          { id: "teacher-questions", name: "Write questions for teacher", duration: "5 min" },
          { id: "syllabus-pdf", name: "Download syllabus PDF", duration: "3 min" },
          { id: "binaural-beats", name: "Listen to binaural beats", duration: "15 min" },
        ]
      },
    ]
  },
  email: {
    name: "Email & Admin",
    icon: "✉️",
    subcategories: [
      {
        id: "inbox-tasks",
        name: "Inbox Tasks",
        icon: "📥",
        tasks: [
          { id: "inbox-zero", name: "Inbox zero", duration: "10 min" },
          { id: "reply-boss", name: "Reply to boss", duration: "5 min" },
          { id: "bills", name: "Pay bills", duration: "8 min" },
          { id: "unsubscribe", name: "Unsubscribe list", duration: "5 min" },
          { id: "spam-folder", name: "Check spam folder", duration: "3 min" },
          { id: "file-receipts", name: "File digital receipts", duration: "6 min" },
          { id: "subscription-details", name: "Update subscriptions", duration: "7 min" },
          { id: "bank-balance", name: "Check bank balance", duration: "4 min" },
        ]
      },
      {
        id: "finance-bills",
        name: "Finance & Bills",
        icon: "💰",
        tasks: [
          { id: "formal-inquiry", name: "Draft formal inquiry", duration: "10 min" },
          { id: "downloads-folder", name: "Clear downloads folder", duration: "5 min" },
          { id: "label-folders", name: "Organize email labels", duration: "8 min" },
          { id: "monthly-budget", name: "Review monthly budget", duration: "15 min" },
          { id: "emergency-contacts", name: "Update emergency contacts", duration: "4 min" },
          { id: "dentist-appointment", name: "Schedule dentist visit", duration: "5 min" },
          { id: "gym-membership", name: "Renew gym membership", duration: "6 min" },
        ]
      },
      {
        id: "admin-scheduling",
        name: "Admin & Scheduling",
        icon: "📅",
        tasks: [
          { id: "scan-document", name: "Scan physical document", duration: "4 min" },
          { id: "reply-invite", name: "Reply to pending invite", duration: "3 min" },
          { id: "linkedin-bio", name: "Update LinkedIn bio", duration: "8 min" },
          { id: "cloud-storage", name: "Clean up cloud storage", duration: "10 min" },
          { id: "physical-mailbox", name: "Check physical mailbox", duration: "3 min" },
          { id: "insurance-claim", name: "Submit insurance claim", duration: "12 min" },
          { id: "track-package", name: "Track pending package", duration: "4 min" },
          { id: "password-manager", name: "Update passwords", duration: "10 min" },
        ]
      },
      {
        id: "digital-housekeeping",
        name: "Digital Housekeeping",
        icon: "🧹",
        tasks: [
          { id: "auto-reply", name: "Set up auto-reply", duration: "5 min" },
          { id: "archive-chats", name: "Archive old chats", duration: "6 min" },
          { id: "card-statement", name: "Review card statement", duration: "8 min" },
          { id: "desktop-shortcuts", name: "Organize desktop icons", duration: "4 min" },
          { id: "print-label", name: "Print shipping label", duration: "5 min" },
          { id: "loyalty-points", name: "Check loyalty points", duration: "5 min" },
          { id: "vacation-request", name: "Draft vacation request", duration: "6 min" },
        ]
      },
    ]
  },
  creative: {
    name: "Creative",
    icon: "🎨",
    subcategories: [
      {
        id: "making-playing",
        name: "Making & Playing",
        icon: "🎨",
        tasks: [
          { id: "sketch", name: "Start sketch", duration: "10 min" },
          { id: "video", name: "Edit video", duration: "12 min" },
          { id: "song", name: "Write song", duration: "20 min" },
          { id: "doodle", name: "Doodle on napkin", duration: "5 min" },
          { id: "creative-prompt", name: "Brainstorm prompt", duration: "6 min" },
          { id: "color-palette", name: "Arrange color palette", duration: "4 min" },
          { id: "edit-photo", name: "Edit single photo", duration: "8 min" },
          { id: "journal-paragraph", name: "Write journal paragraph", duration: "10 min" },
        ]
      },
      {
        id: "quick-doodles",
        name: "Quick Doodles",
        icon: "✏️",
        tasks: [
          { id: "guitar-chords", name: "Practice guitar chords", duration: "12 min" },
          { id: "piano-scales", name: "Play piano scales", duration: "10 min" },
          { id: "voice-memo", name: "Record voice memo idea", duration: "3 min" },
          { id: "art-supplies", name: "Organize art supplies", duration: "8 min" },
          { id: "character-sketch", name: "Sketch character silhouette", duration: "8 min" },
          { id: "poetic-couplet", name: "Write poetic couplet", duration: "5 min" },
          { id: "creative-inspiration", name: "Read inspiration feed", duration: "10 min" },
        ]
      },
      {
        id: "workspace-prep",
        name: "Workspace & Prep",
        icon: "🧰",
        tasks: [
          { id: "origami", name: "Fold origami swan", duration: "6 min" },
          { id: "sound-effect", name: "Experiment with sound effect", duration: "8 min" },
          { id: "choose-fonts", name: "Choose font combinations", duration: "5 min" },
          { id: "digital-brushes", name: "Organize brush sets", duration: "6 min" },
          { id: "clay-colors", name: "Mix clay colors", duration: "5 min" },
          { id: "macro-photos", name: "Shoot 3 macro photos", duration: "7 min" },
          { id: "story-plot", name: "Outline story plot points", duration: "15 min" },
          { id: "pinterest-board", name: "Curate Pinterest board", duration: "10 min" },
        ]
      },
      {
        id: "inspiration-outline",
        name: "Inspiration & Outline",
        icon: "✨",
        tasks: [
          { id: "calligraphy", name: "Practice calligraphy", duration: "8 min" },
          { id: "photo-lighting", name: "Adjust photo lighting", duration: "5 min" },
          { id: "clean-brushes", name: "Clean paint brushes", duration: "6 min" },
          { id: "free-write", name: "Free-write thoughts", duration: "10 min" },
          { id: "knit-rows", name: "Knit or crochet 2 rows", duration: "12 min" },
          { id: "tune-instrument", name: "Tune instrument", duration: "4 min" },
          { id: "portfolio-review", name: "Review art portfolio", duration: "15 min" },
        ]
      },
    ]
  },
  cooking: {
    name: "Cooking",
    icon: "🍳",
    subcategories: [
      {
        id: "meal-prep-cook",
        name: "Meal Prep & Cook",
        icon: "🍳",
        tasks: [
          { id: "dinner", name: "Make dinner", duration: "15 min" },
          { id: "lunch", name: "Prep lunch", duration: "8 min" },
          { id: "groceries", name: "Grocery shop", duration: "12 min" },
          { id: "slice-apples", name: "Slice apples & peanut butter", duration: "3 min" },
          { id: "boil-water", name: "Boil water for pasta", duration: "5 min" },
          { id: "set-table", name: "Set dining table", duration: "3 min" },
          { id: "clean-blender", name: "Clean the blender", duration: "5 min" },
          { id: "make-matcha", name: "Make hot tea or matcha", duration: "4 min" },
        ]
      },
      {
        id: "quick-snacks",
        name: "Quick Snacks & Drinks",
        icon: "🍎",
        tasks: [
          { id: "chop-veggies", name: "Chop onion & garlic", duration: "4 min" },
          { id: "wash-veg", name: "Wash fresh vegetables", duration: "5 min" },
          { id: "coffee-grounds", name: "Empty coffee grounds", duration: "2 min" },
          { id: "roast-nuts", name: "Roast mixed nuts", duration: "6 min" },
          { id: "inventory-pantry", name: "Inventory the pantry", duration: "10 min" },
          { id: "grocery-list", name: "Make a grocery list", duration: "5 min" },
          { id: "wipe-stove", name: "Wipe stovetop burners", duration: "5 min" },
        ]
      },
      {
        id: "pantry-lists",
        name: "Pantry & Lists",
        icon: "📝",
        tasks: [
          { id: "clean-microwave", name: "Clean microwave interior", duration: "6 min" },
          { id: "spice-rack", name: "Organize the spice rack", duration: "8 min" },
          { id: "lemon-water", name: "Pour glass of lemon water", duration: "2 min" },
          { id: "bake-cookies", name: "Bake cookies", duration: "15 min" },
          { id: "blend-smoothie", name: "Blend fruit smoothie", duration: "5 min" },
          { id: "put-leftovers", name: "Put away leftovers", duration: "4 min" },
          { id: "scrape-grill", name: "Scrape grill grates", duration: "6 min" },
          { id: "sharpen-knife", name: "Sharpen chef knife", duration: "5 min" },
        ]
      },
      {
        id: "kitchen-cleanup",
        name: "Kitchen Cleanup",
        icon: "🧼",
        tasks: [
          { id: "clear-fridge", name: "Clear expired fridge items", duration: "8 min" },
          { id: "slice-sourdough", name: "Slice loaf of sourdough", duration: "3 min" },
          { id: "season-cast-iron", name: "Season cast iron skillet", duration: "10 min" },
          { id: "ice-trays", name: "Fill ice cube trays", duration: "3 min" },
          { id: "wash-board", name: "Wash chopping board", duration: "4 min" },
          { id: "pantry-groceries", name: "Put groceries in pantry", duration: "6 min" },
          { id: "overnight-oats", name: "Prep overnight oatmeal", duration: "7 min" },
        ]
      },
    ]
  },
  exercise: {
    name: "Exercise",
    icon: "🏃",
    subcategories: [
      {
        id: "active-workouts",
        name: "Active Workouts",
        icon: "💪",
        tasks: [
          { id: "run", name: "Go for run", duration: "15 min" },
          { id: "stretch", name: "Stretch 10min", duration: "5 min" },
          { id: "gym", name: "Gym session", duration: "20 min" },
          { id: "squats", name: "Do 10 bodyweight squats", duration: "2 min" },
          { id: "shoulder-roll", name: "Roll shoulders & neck", duration: "2 min" },
          { id: "walk-block", name: "Walk around the block", duration: "10 min" },
          { id: "plank", name: "1-minute plank challenge", duration: "2 min" },
          { id: "pushups", name: "Do 5 slow pushups", duration: "2 min" },
        ]
      },
      {
        id: "stretch-mobility",
        name: "Stretch & Mobility",
        icon: "🧘",
        tasks: [
          { id: "calf-stretch", name: "Stretch calves & hamstrings", duration: "5 min" },
          { id: "shake-out", name: "Shake out limbs & bounce", duration: "3 min" },
          { id: "yoga-mat", name: "Rest on yoga mat", duration: "5 min" },
          { id: "stairs", name: "Walk up and down stairs", duration: "6 min" },
          { id: "jump-rope", name: "Jump rope 50 times", duration: "3 min" },
          { id: "foam-roll", name: "Foam roll upper back", duration: "6 min" },
          { id: "balance-leg", name: "Practice balance on leg", duration: "3 min" },
        ]
      },
      {
        id: "outdoor-movement",
        name: "Outdoor & Movement",
        icon: "🚶",
        tasks: [
          { id: "sun-salutation", name: "Yoga sun salutations", duration: "8 min" },
          { id: "jumping-jacks", name: "Do 20 jumping jacks", duration: "2 min" },
          { id: "wall-sit", name: "Wall sit for 45 seconds", duration: "2 min" },
          { id: "dance", name: "Dance to one energetic track", duration: "4 min" },
          { id: "water-bottle", name: "Fill workout bottle", duration: "2 min" },
          { id: "workout-attire", name: "Lay out workout gear", duration: "3 min" },
          { id: "chest-opener", name: "Deep breathing chest opener", duration: "4 min" },
          { id: "tennis-ball", name: "Roll arches on tennis ball", duration: "5 min" },
        ]
      },
      {
        id: "workout-prep",
        name: "Workout Preparation",
        icon: "🎒",
        tasks: [
          { id: "high-knees", name: "High-knees in place", duration: "2 min" },
          { id: "joint-rotations", name: "Wrist & ankle rotations", duration: "3 min" },
          { id: "hip-stretch", name: "Dynamic hip stretch", duration: "5 min" },
          { id: "shadow-boxing", name: "Light shadow boxing", duration: "5 min" },
          { id: "lunges", name: "Do 10 lunges", duration: "3 min" },
          { id: "posture", name: "Practice posture at wall", duration: "3 min" },
          { id: "meditation", name: "Cool down meditation", duration: "10 min" },
        ]
      },
    ]
  },
  errands: {
    name: "Errands",
    icon: "📦",
    subcategories: [
      {
        id: "outdoor-errands",
        name: "Outdoor Errands",
        icon: "🚗",
        tasks: [
          { id: "post-office", name: "Post office", duration: "8 min" },
          { id: "pharmacy", name: "Pharmacy", duration: "6 min" },
          { id: "gifts", name: "Buy gifts", duration: "10 min" },
          { id: "refuel", name: "Refuel the car", duration: "7 min" },
          { id: "dry-cleaning", name: "Collect dry cleaning", duration: "10 min" },
          { id: "donations", name: "Drop off donation box", duration: "12 min" },
          { id: "library-books", name: "Return library books", duration: "8 min" },
          { id: "parcels", name: "Pick up parcel", duration: "5 min" },
        ]
      },
      {
        id: "home-garden",
        name: "Home & Garden",
        icon: "🏡",
        tasks: [
          { id: "flowers", name: "Buy fresh flowers", duration: "6 min" },
          { id: "clean-wallet", name: "Clean wallet receipts", duration: "5 min" },
          { id: "recycling", name: "Take recycling to bin", duration: "4 min" },
          { id: "cut-key", name: "Get spare key cut", duration: "10 min" },
          { id: "empty-bottles", name: "Drop off empty bottles", duration: "8 min" },
          { id: "stamps", name: "Purchase postage stamps", duration: "4 min" },
          { id: "pet-supplies", name: "Pick up pet supplies", duration: "8 min" },
        ]
      },
      {
        id: "small-admin",
        name: "Small Admin Tasks",
        icon: "📝",
        tasks: [
          { id: "lightbulbs", name: "Buy home lightbulbs", duration: "6 min" },
          { id: "vacuum-car", name: "Vacuum car floor", duration: "15 min" },
          { id: "water-garden", name: "Water garden beds", duration: "10 min" },
          { id: "dashboard", name: "Wipe down dashboard", duration: "5 min" },
          { id: "house-entry", name: "Clean entry pathway", duration: "8 min" },
          { id: "letterbox", name: "Put mail in letterbox", duration: "3 min" },
          { id: "soap-supplies", name: "Buy paper towels & soap", duration: "6 min" },
          { id: "clean-glasses", name: "Clean glasses lenses", duration: "2 min" },
        ]
      },
      {
        id: "quick-fixes",
        name: "Quick Fixes & Fills",
        icon: "🔧",
        tasks: [
          { id: "bags-car", name: "Put bags in car trunk", duration: "3 min" },
          { id: "tire-pressure", name: "Check tire air pressure", duration: "8 min" },
          { id: "refill-soap", name: "Refill soap dispensers", duration: "4 min" },
          { id: "water-filter", name: "Replace water filter", duration: "5 min" },
          { id: "shoe-repair", name: "Take shoes to repair", duration: "12 min" },
          { id: "batteries", name: "Buy batteries", duration: "6 min" },
          { id: "compost", name: "Drop off compost scraps", duration: "5 min" },
        ]
      },
    ]
  },
};

const TASK_STEPS = {
  // cleaning
  "tidy-desk": [
    { title: "Assess the clutter", micro: "Gently look at your desk surface and identify the main areas of clutter.", time: "<15 sec", easier: ["Glance at desk", "Think about desk"] },
    { title: "Push your chair in", micro: "Align your chair to create a neat boundary and make space around your desk.", time: "<10 sec", easier: ["Touch chair", "Look at chair"] },
    { title: "Pick up loose paper trash", micro: "Gather any wrappers, receipts, or old envelopes that can be thrown away immediately.", time: "<20 sec", easier: ["Touch paper trash", "Point at trash"] },
    { title: "Discard the paper trash", micro: "Drop the gathered paper waste into your nearest bin.", time: "<10 sec", easier: ["Slide trash closer to bin", "Drop trash on floor near bin"] },
    { title: "Identify empty mugs/cups", micro: "Scan the desk surface for any beverage containers that need to go to the kitchen.", time: "<15 sec", easier: ["Count cups", "Glance at mugs"] },
    { title: "Move cups to the sink", micro: "Carry the empty cups, mugs, or glasses to the kitchen sink.", time: "<30 sec", easier: ["Carry one cup", "Slide cups to desk edge"] },
    { title: "Collect writing tools", micro: "Gather all loose pens, pencils, and highlighters scattered on the desk.", time: "<20 sec", easier: ["Touch one pen", "Slide pens together"] },
    { title: "Place pens in cup/drawer", micro: "Put the writing tools back into their cup, stand, or drawer.", time: "<15 sec", easier: ["Place one pen back", "Drop pens in a drawer"] },
    { title: "Stack books and notebooks", micro: "Group books and notebooks into a neat, vertical stack.", time: "<30 sec", easier: ["Stack two books", "Align notebook edges"] },
    { title: "Sort loose document sheets", micro: "Align any remaining loose paper documents into a single neat pile.", time: "<30 sec", easier: ["Touch document stack", "Slightly straighten pile"] },
    { title: "Check electronic cables", micro: "Notice any tangled charger cables or accessory cords on your desk.", time: "<15 sec", easier: ["Touch one cord", "Look at charger"] },
    { title: "Coil and organize cables", micro: "Gently wrap or clip cables to prevent them from tangling or hanging off the desk.", time: "<30 sec", easier: ["Move one cord aside", "Bundle two cables"] },
    { title: "Locate a wipe or tissue", micro: "Grab a microfiber cloth, tissue, or wet wipe from your cleaning supply.", time: "<20 sec", easier: ["Look for cloth", "Grab a paper towel"] },
    { title: "Dust off computer monitor", micro: "Gently wipe the dust off your computer screen or laptop lid.", time: "<20 sec", easier: ["Look at monitor screen", "Wipe screen corner"] },
    { title: "Wipe keyboard and mouse", micro: "Give your keyboard keys and mouse surface a swift, light wipe.", time: "<25 sec", easier: ["Wipe spacebar", "Touch keyboard corner"] },
    { title: "Wipe open desk surfaces", micro: "Wipe down the main empty surface area of your desk to remove dust.", time: "<30 sec", easier: ["Wipe one small spot", "Brush dust with hand"] },
    { title: "Arrange daily tools", micro: "Position your keyboard, mouse, and notepad exactly where you want them.", time: "<20 sec", easier: ["Nudge keyboard", "Align mouse pad"] },
    { title: "Store away miscellaneous items", micro: "Put any stray items (chapstick, coins, clips) into drawers or bins.", time: "<30 sec", easier: ["Slide chapstick away", "Throw away a clip"] },
    { title: "Step back and inspect", micro: "Take one step back and look at your beautifully organized desk space.", time: "<15 sec", easier: ["Glance at desk", "Smile at workspace"] },
    { title: "Enjoy the clean space", micro: "Sit down comfortably in your clean, welcoming workspace.", time: "<10 sec", easier: ["Sit in chair", "Take a deep breath"] }
  ],
  "dishes": [
    { title: "Approach the kitchen sink", micro: "Walk over to the sink area and take a breath.", time: "<15 sec", easier: ["Walk to kitchen", "Look at sink"] },
    { title: "Assess the dish pile", micro: "Look at the dishes calmly. No need to scrub yet.", time: "<10 sec", easier: ["Glance at dishes", "Observe sink"] },
    { title: "Separate cups and glasses", micro: "Move cups and glasses to one side of the sink to organize.", time: "<20 sec", easier: ["Touch one glass", "Move a cup"] },
    { title: "Group plates and bowls", micro: "Stack plates and bowls by size to clear space in the basin.", time: "<30 sec", easier: ["Move one plate", "Align two bowls"] },
    { title: "Set aside pots and pans", micro: "Move large cookware to the counter to keep the sink clear.", time: "<25 sec", easier: ["Touch a pot handle", "Nudge pan aside"] },
    { title: "Move silverware to one side", micro: "Gather forks, knives, and spoons in a pile to wash together later.", time: "<20 sec", easier: ["Touch a fork", "Group two spoons"] },
    { title: "Clear the drying rack", micro: "Ensure there is open space on the drying rack for clean dishes.", time: "<20 sec", easier: ["Move one dry dish", "Look at rack"] },
    { title: "Pick up sponge and soap", micro: "Grab your dish sponge and the bottle of dish soap.", time: "<15 sec", easier: ["Touch sponge", "Look at soap bottle"] },
    { title: "Apply soap to sponge", micro: "Squeeze a fresh drop of dish soap onto the wet sponge.", time: "<10 sec", easier: ["Uncap soap bottle", "Squeeze sponge once"] },
    { title: "Turn on warm water faucet", micro: "Adjust the water until it's running warm and comfortable.", time: "<15 sec", easier: ["Touch tap handle", "Look at tap water"] },
    { title: "Wash the first glass", micro: "Gently scrub and rinse the inside and outside of one glass.", time: "<30 sec", easier: ["Rinse one glass", "Wet sponge again"] },
    { title: "Set clean glass on rack", micro: "Set the clean glass upside down on the drying rack.", time: "<10 sec", easier: ["Hold glass", "Position glass on rack"] },
    { title: "Scrub the rest of the cups", micro: "Wash and rinse any remaining cups or mugs.", time: "<45 sec", easier: ["Scrub one cup", "Rinse one mug"] },
    { title: "Wash the silverware", micro: "Scrub and rinse the forks, spoons, and knives safely.", time: "<40 sec", easier: ["Wash one fork", "Rinse one spoon"] },
    { title: "Scrub smaller plates", micro: "Gently scrub and rinse your small plates or dessert bowls.", time: "<30 sec", easier: ["Scrub a small plate", "Rinse plate edge"] },
    { title: "Wash larger plates", micro: "Clean the main dinner plates with firm, circular sponge strokes.", time: "<40 sec", easier: ["Scrub one plate", "Hold plate under water"] },
    { title: "Soak the heavy pots", micro: "Add a splash of soap and warm water to any greasy pots or pans.", time: "<30 sec", easier: ["Pour water in pot", "Squeeze soap into pan"] },
    { title: "Scrub the pots and pans", micro: "Clean the cookware thoroughly and rinse away all suds.", time: "<60 sec", easier: ["Scrub one pot corner", "Rinse pan base"] },
    { title: "Rinse and wipe the sink", micro: "Wash down any leftover food bits and suds from the sink basin.", time: "<20 sec", easier: ["Splash water in sink", "Wipe faucet tap"] },
    { title: "Dry your hands", micro: "Turn off the water and dry your hands with a clean kitchen towel.", time: "<15 sec", easier: ["Wipe hands on apron", "Grab dish towel"] }
  ],
  "laundry": [
    { title: "Locate the laundry hamper", micro: "Walk over to where your dirty clothes are collected.", time: "<15 sec", easier: ["Walk to bedroom", "Look at hamper"] },
    { title: "Open the washing machine", micro: "Open the lid or door of your washing machine.", time: "<15 sec", easier: ["Touch machine door", "Look at washer"] },
    { title: "Sort light clothes", micro: "Separate whites and light colors from the pile.", time: "<30 sec", easier: ["Pick up white shirt", "Look at lights"] },
    { title: "Sort dark clothes", micro: "Separate dark clothes and jeans into a distinct pile.", time: "<30 sec", easier: ["Pick up dark pants", "Look at darks"] },
    { title: "Check garment pockets", micro: "Quickly check pockets of a few items for keys, receipts, or tissues.", time: "<40 sec", easier: ["Feel one pocket", "Pat pants pocket"] },
    { title: "Load lights or darks", micro: "Place your selected pile of clothes into the drum of the washer.", time: "<30 sec", easier: ["Drop one shirt in", "Slide clothes closer"] },
    { title: "Close washing machine door", micro: "Shut the door or lid of the machine firmly until it clicks.", time: "<10 sec", easier: ["Push door slightly", "Touch machine lid"] },
    { title: "Grab laundry detergent", micro: "Locate and pick up your detergent bottle or pod container.", time: "<15 sec", easier: ["Look at cupboard", "Reach for detergent"] },
    { title: "Measure detergent", micro: "Pour detergent into the cup or retrieve a single laundry pod.", time: "<20 sec", easier: ["Open detergent cap", "Pick up one pod"] },
    { title: "Add detergent to washer", micro: "Pour detergent into the drawer or toss the pod directly into the drum.", time: "<15 sec", easier: ["Slide drawer open", "Drop pod in machine"] },
    { title: "Select wash cycle settings", micro: "Set the temperature and speed (e.g., Cold, Normal, or Gentle).", time: "<20 sec", easier: ["Turn dial once", "Look at settings screen"] },
    { title: "Start the washing machine", micro: "Press the start button and listen to the water begin to fill.", time: "<10 sec", easier: ["Press power button", "Touch start button"] },
    { title: "Set a timer on your phone", micro: "Set a phone alarm for the duration of the cycle to keep track.", time: "<20 sec", easier: ["Open clock app", "Think about cycle time"] },
    { title: "Retrieve washed clothes", micro: "Once done, open the door and transfer the damp load into a basket.", time: "<45 sec", easier: ["Open washer door", "Pull out one shirt"] },
    { title: "Load clothes into dryer", micro: "Place dryer-safe items into the dryer drum.", time: "<30 sec", easier: ["Toss one shirt in dryer", "Open dryer door"] },
    { title: "Hang delicate items", micro: "Hang up delicates or shirts on hangers or a drying rack.", time: "<60 sec", easier: ["Drape one shirt on rack", "Grab a hanger"] },
    { title: "Start the dryer", micro: "Add dryer sheet if needed, close the door, and start the dryer.", time: "<20 sec", easier: ["Shut dryer door", "Press start"] },
    { title: "Collect dry clothes", micro: "Gather dry items from the dryer or rack and place them on a clean surface.", time: "<45 sec", easier: ["Pull out dry shirts", "Touch dry fabric"] },
    { title: "Fold large garments", micro: "Fold trousers, jeans, and sweaters neatly.", time: "<90 sec", easier: ["Fold one pair of pants", "Align sleeves on sweater"] },
    { title: "Put away clothes in closet", micro: "Place the folded garments and hung shirts back into drawers and hangers.", time: "<90 sec", easier: ["Place one shirt in drawer", "Hang one coat"] }
  ],

  // work
  "write-report": [
    { title: "Power on computer", micro: "Turn on your screen or open your laptop lid.", time: "<15 sec", easier: ["Press power button", "Look at screen"] },
    { title: "Open document app", micro: "Launch Word, Google Docs, Notion, or your preferred writer.", time: "<20 sec", easier: ["Click document icon", "Look at taskbar"] },
    { title: "Create new blank document", micro: "Open a fresh, empty page. Embrace the clean slate.", time: "<15 sec", easier: ["Press Cmd+N", "Click 'New'"] },
    { title: "Save file with title", micro: "Save the document with a clear, placeholder title.", time: "<20 sec", easier: ["Type one word", "Press Cmd+S"] },
    { title: "Type the document header", micro: "Type the report title at the very top of your document.", time: "<15 sec", easier: ["Type report name", "Copy a draft title"] },
    { title: "Add report metadata", micro: "Type your name and today's date underneath the title.", time: "<15 sec", easier: ["Type your initials", "Type current month"] },
    { title: "Create an outline header", micro: "Type 'Introduction' and hit enter twice.", time: "<15 sec", easier: ["Type 'Intro'", "Format line"] },
    { title: "Add section for findings", micro: "Type 'Key Findings' as your second main heading.", time: "<15 sec", easier: ["Type 'Findings'", "Press Enter"] },
    { title: "Add section for conclusion", micro: "Type 'Conclusion & Next Steps' as your final heading.", time: "<15 sec", easier: ["Type 'Conclusion'", "Scroll down"] },
    { title: "Focus on introduction section", micro: "Click your cursor directly underneath the 'Introduction' heading.", time: "<10 sec", easier: ["Look at blinking cursor", "Scroll up to Intro"] },
    { title: "Draft introductory sentence", micro: "Write one simple sentence stating the purpose of the report.", time: "<45 sec", easier: ["Type 'This report is about...'", "Type first letter"] },
    { title: "Add a supporting sentence", micro: "Explain who this report is for or why it is important.", time: "<45 sec", easier: ["Type one explanation", "Jot down a quick thought"] },
    { title: "Add bullet points to findings", micro: "Under 'Key Findings', add three empty bullet points.", time: "<20 sec", easier: ["Type a dash", "Click list icon"] },
    { title: "Draft finding number one", micro: "Fill in the first bullet point with a single factual observation.", time: "<60 sec", easier: ["Type one key number", "Write simple note"] },
    { title: "Draft finding number two", micro: "Write down the second major finding or data point.", time: "<60 sec", easier: ["Type second key point", "Think about finding"] },
    { title: "Draft finding number three", micro: "Draft the final core finding in your list.", time: "<60 sec", easier: ["Type third key point", "Straighten line"] },
    { title: "Draft one conclusion sentence", micro: "Under 'Conclusion', write one sentence summarizing the overall takeaway.", time: "<60 sec", easier: ["Type 'In summary...'", "Type one final word"] },
    { title: "Add a recommended action", micro: "List one logical next step based on the findings.", time: "<45 sec", easier: ["Type a quick action", "Write bullet point"] },
    { title: "Run a quick spellcheck", micro: "Click the spelling and grammar check button to polish the draft.", time: "<30 sec", easier: ["Scan for red underlines", "Press F7"] },
    { title: "Save and close document", micro: "Save your progress and close the editor. You did amazing!", time: "<15 sec", easier: ["Press Cmd+S", "Minimize window"] }
  ],
  "emails": [
    { title: "Open email client", micro: "Launch your email application or load the inbox in your browser.", time: "<20 sec", easier: ["Click email app", "Look at bookmark bar"] },
    { title: "Observe inbox calmly", micro: "Look at the list of subject lines. Let the numbers fade into the background.", time: "<15 sec", easier: ["Breathe in", "Look at screen center"] },
    { title: "Sort by sender or date", micro: "Group or filter messages to bring order to your view.", time: "<20 sec", easier: ["Click filter dropdown", "Glance at inbox filter"] },
    { title: "Choose one urgent message", micro: "Identify a single email that requires a response today.", time: "<20 sec", easier: ["Point to one email", "Hover mouse over inbox"] },
    { title: "Double-click to open", micro: "Open that selected email and read the subject line.", time: "<15 sec", easier: ["Click email once", "Look at sender name"] },
    { title: "Read first paragraph", micro: "Skim the first few sentences to grasp the sender's main request.", time: "<30 sec", easier: ["Read greeting", "Scan sender's first line"] },
    { title: "Read core question", micro: "Locate the main question or action item inside the message.", time: "<30 sec", easier: ["Highlight query", "Find question mark"] },
    { title: "Click Reply button", micro: "Tap 'Reply' or 'Reply All' to open the composition window.", time: "<10 sec", easier: ["Touch reply icon", "Press 'R'"] },
    { title: "Type polite greeting", micro: "Draft a warm opening, like 'Hi [Name], hope your week is going well.'", time: "<20 sec", easier: ["Type 'Hi [Name],'", "Type 'Hello,'"] },
    { title: "Formulate single-sentence answer", micro: "Type a direct, clear answer to the sender's primary question.", time: "<45 sec", easier: ["Type first word", "Type simple 'Yes' or 'No'"] },
    { title: "Provide necessary context", micro: "Add one sentence of brief context or reasoning to support your answer.", time: "<45 sec", easier: ["Type supportive detail", "Write quick sentence"] },
    { title: "Specify next action step", micro: "State what happens next or what you need from them.", time: "<30 sec", easier: ["Type 'Let me know...'", "Type 'Thanks,'"] },
    { title: "Type friendly sign-off", micro: "Add a closing like 'Best regards,' followed by your name.", time: "<15 sec", easier: ["Type 'Best,'", "Type your name"] },
    { title: "Proofread reply draft", micro: "Scan the text quickly for any typos or unclear phrasing.", time: "<20 sec", easier: ["Read text once", "Glance at spelling"] },
    { title: "Check attachment if needed", micro: "Ensure any files mentioned in your reply are attached.", time: "<15 sec", easier: ["Check attachments paperclip", "Look at footer"] },
    { title: "Press Send button", micro: "Click 'Send' and hear the satisfying swoosh of the email flying off.", time: "<10 sec", easier: ["Click Send", "Hover over Send"] },
    { title: "Archive original email", micro: "Move the replied email out of your inbox and into archives.", time: "<15 sec", easier: ["Click Archive button", "Press 'E' key"] },
    { title: "Choose second quick email", micro: "Identify another easy email that can be answered in under a minute.", time: "<20 sec", easier: ["Glance at inbox again", "Scroll down"] },
    { title: "Quick-reply to second email", micro: "Open, reply with a short 'Thanks, sounds good!', and send.", time: "<45 sec", easier: ["Type 'Thanks!'", "Click reply"] },
    { title: "Close email client", micro: "Close the app window and take a deep breath. Inbox progress made!", time: "<15 sec", easier: ["Click X button", "Close laptop screen"] }
  ],
  "presentation": [
    { title: "Open presentation software", micro: "Launch PowerPoint, Google Slides, Keynote, or Canva.", time: "<20 sec", easier: ["Click Slides icon", "Find app in dock"] },
    { title: "Choose new or existing template", micro: "Select a clean, blank layout or load your current deck.", time: "<25 sec", easier: ["Click blank template", "Select recent file"] },
    { title: "Create title slide", micro: "Navigate to slide one and focus on the title placeholder.", time: "<15 sec", easier: ["Look at slide list", "Select slide one"] },
    { title: "Type main title", micro: "Type the primary title or topic of your presentation.", time: "<20 sec", easier: ["Type first word", "Copy title text"] },
    { title: "Type subtitle/credits", micro: "Add your name, team, or target date underneath the title.", time: "<15 sec", easier: ["Type your name", "Press Enter"] },
    { title: "Add new slide", micro: "Insert slide number two for the outline or introduction.", time: "<15 sec", easier: ["Press Cmd+M", "Click '+' icon"] },
    { title: "Write outline heading", micro: "Type 'Agenda' or 'Presentation Outline' at the top of slide two.", time: "<20 sec", easier: ["Type 'Agenda'", "Format title text"] },
    { title: "List three outline points", micro: "Create three simple bullet points describing the talk's structure.", time: "<45 sec", easier: ["Type numbers 1, 2, 3", "Draft first point"] },
    { title: "Insert slide three", micro: "Add another blank slide to begin the core content.", time: "<15 sec", easier: ["Click new slide button", "Press Cmd+M"] },
    { title: "Type slide three heading", micro: "Give slide three a clear topic header (e.g., 'The Challenge').", time: "<20 sec", easier: ["Type 'The Challenge'", "Think of heading"] },
    { title: "Add brief descriptive text", micro: "Draft a two-sentence explanation of the slide's core problem.", time: "<45 sec", easier: ["Type first sentence", "Jot down bullet point"] },
    { title: "Insert placeholder image", micro: "Search for a relevant icon, stock photo, or chart diagram.", time: "<45 sec", easier: ["Click insert image", "Search library"] },
    { title: "Resize and position image", micro: "Place the graphic on the slide so it balances the text.", time: "<30 sec", easier: ["Drag image border", "Nudge image slightly"] },
    { title: "Add slide four for 'Solution'", micro: "Insert slide four to explain the proposed approach.", time: "<15 sec", easier: ["Press Cmd+M", "Look at slide preview"] },
    { title: "Draft solution bullets", micro: "Write down two or three brief bullet points on slide four.", time: "<45 sec", easier: ["Type first solution point", "Write note"] },
    { title: "Add slide five for conclusion", micro: "Create a final slide to wrap up key points.", time: "<15 sec", easier: ["Press Cmd+M", "Select layout"] },
    { title: "Type 'Thank You' text", micro: "Add a closing slide with your email or 'Questions?' text.", time: "<20 sec", easier: ["Type 'Questions?'", "Type 'The End'"] },
    { title: "Review slide thumbnail list", micro: "Scroll through the sidebar to verify the overall layout flow.", time: "<20 sec", easier: ["Scroll to top slide", "Scan thumbnails"] },
    { title: "Run spelling check", micro: "Let the editor review your slide text for typos.", time: "<25 sec", easier: ["Look at slide headings", "Press Spellcheck"] },
    { title: "Save file and celebrate", micro: "Press save and close. Your presentation skeleton is complete!", time: "<15 sec", easier: ["Press Cmd+S", "Close app"] }
  ],

  // study
  "read-chapter": [
    { title: "Locate your textbook", micro: "Find the physical book, e-reader, or PDF file for your reading.", time: "<15 sec", easier: ["Look at desk", "Locate book shelf"] },
    { title: "Pick up book or open file", micro: "Hold the book or click open the PDF on your screen.", time: "<15 sec", easier: ["Touch book cover", "Double-click PDF"] },
    { title: "Find the assigned chapter", micro: "Navigate to the designated chapter page or start page.", time: "<20 sec", easier: ["Open Table of Contents", "Scroll to page"] },
    { title: "Observe the chapter title", micro: "Read the chapter title and look at the introductory page design.", time: "<15 sec", easier: ["Read title out loud", "Scan page illustration"] },
    { title: "Scan chapter outline/goals", micro: "Read the brief chapter summary or learning objectives.", time: "<30 sec", easier: ["Read first goal", "Skim intro list"] },
    { title: "Locate high-quality highlighter", micro: "Grab a highlighter, pen, or select the digital markup tool.", time: "<15 sec", easier: ["Grab pencil", "Locate highlighter"] },
    { title: "Read the first heading", micro: "Find and read the first section header in the chapter.", time: "<20 sec", easier: ["Read heading word", "Point at heading"] },
    { title: "Skim the first paragraph", micro: "Let your eyes run over the introductory paragraph of section one.", time: "<45 sec", easier: ["Read first sentence", "Scan first few words"] },
    { title: "Identify one key term", micro: "Locate a bolded vocabulary word or central concept.", time: "<30 sec", easier: ["Find a bold word", "Look at italicized text"] },
    { title: "Highlight that key term", micro: "Highlight the word or underline its core definition.", time: "<15 sec", easier: ["Mark the definition", "Draw line under term"] },
    { title: "Read paragraph two", micro: "Carefully read the second paragraph to build detail.", time: "<45 sec", easier: ["Read first line of paragraph", "Scan middle words"] },
    { title: "Observe a diagram or chart", micro: "Look at any figures, graphs, or sidebars on the current page.", time: "<30 sec", easier: ["Look at image caption", "Glance at chart"] },
    { title: "Turn to page two", micro: "Gently turn the page or scroll down to the next section.", time: "<15 sec", easier: ["Flip book page", "Swipe screen down"] },
    { title: "Read second heading", micro: "Find the next bold heading on the new page and read it.", time: "<20 sec", easier: ["Scan heading", "Read section label"] },
    { title: "Skim paragraph under heading", micro: "Quickly scan the text below the second heading.", time: "<45 sec", easier: ["Read first sentence", "Hover cursor over text"] },
    { title: "Find another key definition", micro: "Identify the primary theme or vocabulary in this section.", time: "<30 sec", easier: ["Spot italicized phrase", "Look at summary box"] },
    { title: "Underline key sentence", micro: "Mark the most informative sentence in the section.", time: "<20 sec", easier: ["Draw margin line", "Highlight digital text"] },
    { title: "Read chapter recap points", micro: "Skip forward to the 'Summary' or 'Recap' section at the end of the chapter.", time: "<60 sec", easier: ["Find recap heading", "Read first recap bullet"] },
    { title: "Close the textbook", micro: "Gently close the physical book or minimize your reader screen.", time: "<15 sec", easier: ["Shut book cover", "Minimize PDF reader"] },
    { title: "Celebrate completing session", micro: "Take a deep breath. Your reading session is complete. Brilliant!", time: "<10 sec", easier: ["Stretch arms", "Smile"] }
  ],
  "essay": [
    { title: "Review writing prompt", micro: "Read the essay question or assignment guidelines carefully.", time: "<25 sec", easier: ["Read essay prompt", "Scan guidelines"] },
    { title: "Open writing application", micro: "Launch Google Docs, Word, or Scrivener.", time: "<20 sec", easier: ["Click writer icon", "Look at dock"] },
    { title: "Create document and save", micro: "Open a new blank document and save it as 'Essay Draft'.", time: "<15 sec", easier: ["Press Cmd+N", "Click Save"] },
    { title: "Format page headers", micro: "Set margins, insert page numbers, and add your student heading.", time: "<30 sec", easier: ["Type name at top", "Double click header"] },
    { title: "Draft temporary essay title", micro: "Type a placeholder title that captures your main topic.", time: "<20 sec", easier: ["Type draft title", "Type word 'Essay'"] },
    { title: "Write thesis statement draft", micro: "Draft a single, direct sentence answering the prompt.", time: "<60 sec", easier: ["Type core argument", "Write simple thesis thought"] },
    { title: "Outline essay paragraphs", micro: "Type headers for: Intro, Body 1, Body 2, Body 3, Conclusion.", time: "<45 sec", easier: ["Type 'Intro'", "Press Enter"] },
    { title: "Map body paragraph one", micro: "Write a single keyword or bullet point for your first argument.", time: "<30 sec", easier: ["Type topic keyword", "Think about point one"] },
    { title: "Map body paragraph two", micro: "Add a bullet point representing your second supportive argument.", time: "<30 sec", easier: ["Type point two topic", "Think about point two"] },
    { title: "Map body paragraph three", micro: "Add a bullet point representing your third supportive argument.", time: "<30 sec", easier: ["Type point three topic", "Think about point three"] },
    { title: "Position thesis statement", micro: "Paste your thesis statement right under the 'Intro' heading.", time: "<15 sec", easier: ["Copy thesis draft", "Move thesis up"] },
    { title: "Draft essay opening hook", micro: "Write a broad opening sentence to introduce the topic.", time: "<60 sec", easier: ["Type first hook word", "Write general statement"] },
    { title: "Link opening hook to thesis", micro: "Write a transitional sentence connecting hook and thesis.", time: "<60 sec", easier: ["Type connecting phrase", "Type transition"] },
    { title: "Draft body 1 topic sentence", micro: "Write a clear opening sentence for your first body paragraph.", time: "<60 sec", easier: ["Type topic sentence", "Type first word"] },
    { title: "Insert supportive quote", micro: "Paste in a relevant quote or piece of evidence from your sources.", time: "<45 sec", easier: ["Copy quote text", "Open source notes"] },
    { title: "Cite the quote source", micro: "Add the in-text citation (e.g., Author, Year) after the quote.", time: "<30 sec", easier: ["Type parentheses", "Type page number"] },
    { title: "Draft analysis sentence", micro: "Write one sentence explaining how the quote supports your point.", time: "<60 sec", easier: ["Type 'This shows that...'", "Type analysis sentence"] },
    { title: "Draft conclusion sentence", micro: "Write a concluding thought summarizing the essay's core lesson.", time: "<60 sec", easier: ["Type 'Ultimately...'", "Type final takeaway"] },
    { title: "Run final proofread check", micro: "Read through your introductory paragraph once to ensure flow.", time: "<30 sec", easier: ["Read intro paragraph", "Check for typos"] },
    { title: "Save file and celebrate", micro: "Save progress and close your editor. Incredible progress made!", time: "<15 sec", easier: ["Press Cmd+S", "Close app"] }
  ],
  "notes": [
    { title: "Gather study notes", micro: "Retrieve your notebook, lecture folders, or digital note pages.", time: "<15 sec", easier: ["Look for notes", "Open digital notes folder"] },
    { title: "Grab writing instruments", micro: "Select a few colored highlighters, pens, or digital markers.", time: "<15 sec", easier: ["Grab red pen", "Open highlight panel"] },
    { title: "Open notes folder", micro: "Load the note document or flip open your notebook page.", time: "<15 sec", easier: ["Click file to open", "Open notebook cover"] },
    { title: "Scan note headings", micro: "Quickly read the main titles and dates on your notes page.", time: "<20 sec", easier: ["Scan title heading", "Look at date tag"] },
    { title: "Identify central concept", micro: "Find the primary topic of the lecture or revision block.", time: "<20 sec", easier: ["Locate main keyword", "Highlight central word"] },
    { title: "Highlight key term in red", micro: "Use a red or warm color to highlight the most crucial definition.", time: "<20 sec", easier: ["Color first key term", "Underline crucial word"] },
    { title: "Read paragraph one recap", micro: "Read the first section of your notes thoroughly.", time: "<45 sec", easier: ["Read first sentence", "Scan first notes list"] },
    { title: "Summarize paragraph one", micro: "Write a single-sentence summary of paragraph one in the margin.", time: "<60 sec", easier: ["Type brief summary", "Draft short phrase"] },
    { title: "Highlight second key concept", micro: "Locate and highlight another important term in yellow or green.", time: "<20 sec", easier: ["Mark second term", "Underline secondary term"] },
    { title: "Draw connection arrow", micro: "Draw a line or arrow connecting the first and second concepts.", time: "<25 sec", easier: ["Link words with line", "Think about connections"] },
    { title: "Draft a flashcard question", micro: "On a card or in an app, write a question about the key concept.", time: "<40 sec", easier: ["Type question word", "Write concept on card"] },
    { title: "Write flashcard answer", micro: "Flip the card or document over and draft the brief answer.", time: "<45 sec", easier: ["Type card definition", "Write brief answer"] },
    { title: "Sketch a mental map", micro: "Draw a simple circle around the main topic on a scratchpad.", time: "<45 sec", easier: ["Draw circle", "Write main topic name"] },
    { title: "Add branch to mental map", micro: "Draw a line radiating from the circle to your first key term.", time: "<30 sec", easier: ["Draw branch line", "Write branch label"] },
    { title: "Add second branch to map", micro: "Draw another line radiating from the circle to your second key term.", time: "<30 sec", easier: ["Draw second line", "Add secondary label"] },
    { title: "Read summary out loud", micro: "Read your margin summaries out loud to reinforce retention.", time: "<45 sec", easier: ["Whisper summary line", "Read notes quietly"] },
    { title: "Test flashcard memory", micro: "Hide the answer and see if you can answer the question from memory.", time: "<30 sec", easier: ["Look at question", "Recall first word"] },
    { title: "Mark master checklist", micro: "Check off this revision topic on your study tracker.", time: "<20 sec", easier: ["Check off box", "Draw smile emoji"] },
    { title: "Tidy note materials", micro: "Put pens, markers, and notebooks back into storage neatly.", time: "<25 sec", easier: ["Cap highlighter", "Close notebook"] },
    { title: "Take a centering breath", micro: "Inhale deeply and stretch. You've completed your notes revision!", time: "<10 sec", easier: ["Breathe in", "Relax shoulders"] }
  ],

  // email
  "inbox-zero": [
    { title: "Open mail interface", micro: "Load your business or personal email inbox in your browser or app.", time: "<20 sec", easier: ["Launch mail app", "Click inbox icon"] },
    { title: "Look at inbox size", micro: "Observe the number of unread emails. Let go of any guilt.", time: "<15 sec", easier: ["Scan unread count", "Take a slow breath"] },
    { title: "Identify obvious spam", micro: "Scan the first ten emails for advertisements or promotions.", time: "<25 sec", easier: ["Glance at sender names", "Find marketing mail"] },
    { title: "Delete spam emails", micro: "Check the boxes for obvious spam and click the trash can icon.", time: "<25 sec", easier: ["Select one spam mail", "Click Delete"] },
    { title: "Empty the trash bin", micro: "Navigate to trash and empty it. Hear the electronic discard.", time: "<20 sec", easier: ["Click Trash folder", "Click empty trash"] },
    { title: "Locate newsletters", micro: "Find any weekly updates or newsletter subscriptions you don't read.", time: "<30 sec", easier: ["Search 'unsubscribe'", "Spot mailing list"] },
    { title: "Archive unread newsletters", micro: "Select and archive those newsletters. Clear the clutter.", time: "<30 sec", easier: ["Select newsletters", "Click Archive"] },
    { title: "Create 'Action' folder", micro: "Create a new folder or label named 'To Action'.", time: "<30 sec", easier: ["Click 'New Label'", "Type 'Action'"] },
    { title: "Identify important request", micro: "Scan inbox for an email requiring deep thought or work.", time: "<25 sec", easier: ["Spot important email", "Look at sender"] },
    { title: "Move to 'Action' folder", micro: "Drag that email into your newly created 'To Action' folder.", time: "<20 sec", easier: ["Click and hold email", "Select label 'Action'"] },
    { title: "Open the oldest email", micro: "Scroll to the bottom of the unread list and open the oldest message.", time: "<20 sec", easier: ["Scroll to bottom", "Click oldest mail"] },
    { title: "Quick-reply or archive", micro: "If it needs a 1-sentence reply, do it now; otherwise archive it.", time: "<60 sec", easier: ["Click reply", "Click Archive"] },
    { title: "Locate transaction receipts", micro: "Find utility receipts, purchase logs, or booking confirmations.", time: "<30 sec", easier: ["Search 'receipt'", "Look at invoice emails"] },
    { title: "Create 'Receipts' folder", micro: "Create a label or folder named 'Receipts & Finances'.", time: "<30 sec", easier: ["Click 'New Label'", "Type 'Finances'"] },
    { title: "Move receipts to folder", micro: "Archive all transaction emails by grouping them under your Finance label.", time: "<45 sec", easier: ["Select receipts", "Click Archive to label"] },
    { title: "Review inbox remaining", micro: "Look at the remaining count of emails. Notice how it has shrunk.", time: "<15 sec", easier: ["Count remaining emails", "Smile"] },
    { title: "Select remaining group", micro: "Select the next batch of 5 minor notification emails.", time: "<25 sec", easier: ["Click five boxes", "Mark emails"] },
    { title: "Archive selected batch", micro: "Batch-archive them in one click to sweep the screen clear.", time: "<15 sec", easier: ["Click Archive button", "Hover over Archive"] },
    { title: "Double-check spam folder", micro: "Do a 5-second check of your Spam folder for any false positives.", time: "<20 sec", easier: ["Click Spam folder", "Look at folder"] },
    { title: "Close email browser", micro: "Close the tab. Bask in your organized, clean, refreshed email dashboard.", time: "<15 sec", easier: ["Close email tab", "Close browser"] }
  ],
  "reply-boss": [
    { title: "Locate boss's message", micro: "Open your mail app or messaging tool (Slack, Teams, or Inbox).", time: "<20 sec", easier: ["Open Teams", "Search boss's name"] },
    { title: "Open the chat or email", micro: "Click on the thread from your boss or manager.", time: "<15 sec", easier: ["Click boss's message", "Hover over message"] },
    { title: "Read boss's request", micro: "Read the message carefully. Identify the core question or goal.", time: "<30 sec", easier: ["Read first line", "Scan message text"] },
    { title: "Isolate main question", micro: "Pinpoint the exact question your boss is asking you to answer.", time: "<20 sec", easier: ["Highlight query", "Focus on question mark"] },
    { title: "Open note draft tool", micro: "Open Notepad, TextEdit, or a draft window to type without pressure.", time: "<20 sec", easier: ["Open scratchpad", "Click New Draft"] },
    { title: "Type polite greeting", micro: "Type greeting: 'Hi [Name], hope you're having a good day.'", time: "<20 sec", easier: ["Type 'Hi [Name],'", "Type 'Hello,'"] },
    { title: "Acknowledge the message", micro: "Write a short acknowledgment: 'Thanks for reaching out about this.'", time: "<25 sec", easier: ["Type 'Thanks for...'", "Type acknowledgement"] },
    { title: "Draft answer to point A", micro: "Type a clear, professional answer to the primary question.", time: "<45 sec", easier: ["Type first word", "Type brief draft"] },
    { title: "Draft answer to point B", micro: "Address any secondary question or detail they requested.", time: "<45 sec", easier: ["Type next detail", "Think about answer"] },
    { title: "Add status update if needed", micro: "Briefly mention that you are currently working on it or have completed it.", time: "<30 sec", easier: ["Type 'I've finalized...'", "Type progress status"] },
    { title: "State next action step", micro: "Let them know when you will follow up or what you need from them.", time: "<30 sec", easier: ["Type 'I'll send...'", "Type next action"] },
    { title: "Draft professional closing", micro: "Type friendly closing: 'Best regards,' followed by your name.", time: "<15 sec", easier: ["Type 'Best,'", "Type your name"] },
    { title: "Review tone of draft", micro: "Read the draft. Ensure it sounds polite, confident, and professional.", time: "<25 sec", easier: ["Read draft quietly", "Scan tone"] },
    { title: "Check spelling and grammar", micro: "Verify names, dates, and spelling are entirely correct.", time: "<20 sec", easier: ["Scan for red lines", "Double check boss's name"] },
    { title: "Copy draft text", micro: "Highlight your completed draft on the notepad and copy it.", time: "<15 sec", easier: ["Press Cmd+A", "Right click copy"] },
    { title: "Return to official message", micro: "Navigate back to the email reply box or chat window.", time: "<15 sec", easier: ["Switch to email window", "Click reply container"] },
    { title: "Paste draft into reply box", micro: "Paste the copied text into the official reply text box.", time: "<10 sec", easier: ["Press Cmd+V", "Right click paste"] },
    { title: "Verify recipient list", micro: "Make sure your boss (and anyone else carbon-copied) is correctly listed.", time: "<15 sec", easier: ["Check 'To' line", "Verify email address"] },
    { title: "Click Send button", micro: "Press 'Send'. Let the email soar out of your active responsibility.", time: "<10 sec", easier: ["Click Send", "Hover on Send"] },
    { title: "Take relief breath", micro: "Exhale fully. You successfully navigated a key communication win!", time: "<10 sec", easier: ["Breathe out", "Smile"] }
  ],
  "bills": [
    { title: "Locate the bill invoice", micro: "Open your digital statement, email receipt, or physical paper bill.", time: "<20 sec", easier: ["Locate invoice mail", "Pick up paper bill"] },
    { title: "Identify bill due date", micro: "Read the due date on the statement to assess urgency.", time: "<15 sec", easier: ["Look for bold dates", "Scan invoice top"] },
    { title: "Identify total payment amount", micro: "Find the total outstanding balance or amount due.", time: "<15 sec", easier: ["Spot dollar sign", "Look at bottom total"] },
    { title: "Open banking application", micro: "Launch your online banking app or navigate to the bank's website.", time: "<25 sec", easier: ["Open banking app", "Click bank bookmark"] },
    { title: "Log into banking account", micro: "Use face ID, password, or security key to log in securely.", time: "<30 sec", easier: ["Scan Face ID", "Click password box"] },
    { title: "Navigate to payment portal", micro: "Tap 'Transfer', 'Pay Bills', or 'BPAY' menu option.", time: "<20 sec", easier: ["Click 'Pay'", "Look at menu bar"] },
    { title: "Select funding account", micro: "Choose the checking or savings account you want to pay from.", time: "<15 sec", easier: ["Click account bar", "Check balance"] },
    { title: "Add new payee or select existing", micro: "Click 'Add Payee' or search for the existing company name.", time: "<25 sec", easier: ["Click payee search", "Click existing payee"] },
    { title: "Locate billing account number", micro: "Find your unique billing account number on the invoice statement.", time: "<30 sec", easier: ["Highlight account digits", "Scan invoice middle"] },
    { title: "Type payee account digits", micro: "Enter the billing account number into your banking app.", time: "<30 sec", easier: ["Type first three digits", "Double check numbers"] },
    { title: "Type pay bill routing/ref", micro: "Enter reference code or bank code (like BPAY biller code).", time: "<30 sec", easier: ["Type biller code", "Copy reference number"] },
    { title: "Double check pay digits", micro: "Read the entered account numbers side-by-side with invoice.", time: "<20 sec", easier: ["Scan digit by digit", "Confirm digits match"] },
    { title: "Input payment amount", micro: "Type the exact dollar and cent amount from the bill statement.", time: "<20 sec", easier: ["Type dollar amount", "Type cent numbers"] },
    { title: "Select payment date", micro: "Choose 'Pay Now' or schedule it for a comfortable date.", time: "<15 sec", easier: ["Select today's date", "Verify scheduled date"] },
    { title: "Click 'Review' or 'Confirm'", micro: "Tap the review button to inspect the final transaction summary.", time: "<15 sec", easier: ["Click review", "Look at summary details"] },
    { title: "Submit the payment", micro: "Tap 'Confirm Payment' or 'Submit' to authorize the transfer.", time: "<15 sec", easier: ["Click pay button", "Hover over Submit"] },
    { title: "Receive transaction receipt", micro: "Wait for the green checkmark or confirmation transaction number.", time: "<20 sec", easier: ["Look at success tick", "Wait for load"] },
    { title: "Take screenshot of receipt", micro: "Capture a screenshot or click 'Download Receipt' for your records.", time: "<15 sec", easier: ["Press power+volume buttons", "Click print to PDF"] },
    { title: "Mark invoice as Paid", micro: "Archive the email as 'Paid' or write 'Paid' on the physical bill.", time: "<20 sec", easier: ["Archive bill email", "Grab pen to write"] },
    { title: "Log out of bank app", micro: "Safely log out of your banking app and close the tab. Paid!", time: "<10 sec", easier: ["Click log out", "Close app window"] }
  ],

  // creative
  "sketch": [
    { title: "Clear drawing desk", micro: "Move glasses, keys, or papers aside to create a roomy workspace.", time: "<20 sec", easier: ["Clear center desk", "Slide cup aside"] },
    { title: "Position drawing tablet/pad", micro: "Place your sketchbook, paper, or digital drawing pad right in front of you.", time: "<15 sec", easier: ["Grab drawing pad", "Position tablet screen"] },
    { title: "Retrieve stylus or pencil", micro: "Pick up your favorite drawing pencil, charcoal, or digital stylus.", time: "<15 sec", easier: ["Touch stylus", "Pick up pencil"] },
    { title: "Prepare sharpening tools", micro: "Ensure your pencil is sharp, or turn on your tablet screen.", time: "<20 sec", easier: ["Open pencil sharpener", "Press tablet power button"] },
    { title: "Open new canvas or page", micro: "Flip to a fresh page in your book or launch a new design file.", time: "<20 sec", easier: ["Turn book cover", "Click 'New Canvas'"] },
    { title: "Select workspace brushes", micro: "Select a soft graphite pencil tool or a clean digital basic brush.", time: "<15 sec", easier: ["Choose HB pencil", "Select outline brush"] },
    { title: "Set brush stroke size", micro: "Adjust the stroke weight to a light, faint setting for sketching.", time: "<15 sec", easier: ["Set size to 5px", "Check brush thickness"] },
    { title: "Position drawing hand", micro: "Rest your palm comfortably on the paper or tablet surface.", time: "<15 sec", easier: ["Relax hand", "Place palm on screen"] },
    { title: "Take a centering breath", micro: "Breathe in, relax your shoulders, and let go of perfection.", time: "<15 sec", easier: ["Breathe out", "Drop shoulders"] },
    { title: "Draw a loose horizon line", micro: "Draw one single, sweeping horizontal line across the center of your page.", time: "<20 sec", easier: ["Make one faint swipe", "Think about line location"] },
    { title: "Sketch a basic circle", micro: "Draw a loose, light geometric circle in the upper third of the canvas.", time: "<30 sec", easier: ["Make round motion", "Scribble a circle shape"] },
    { title: "Add supportive square shapes", micro: "Add a faint box or rectangle shape next to the circle to balance layout.", time: "<30 sec", easier: ["Draw box", "Scribble light square"] },
    { title: "Outline the rough shape", micro: "Connect the geometric shapes with loose, flowing outlines.", time: "<45 sec", easier: ["Connect two lines", "Trace shape edge"] },
    { title: "Erase overlapping lines", micro: "Wipe away unnecessary internal lines using your eraser tool.", time: "<30 sec", easier: ["Erase one segment", "Click eraser tool"] },
    { title: "Add a focal point detail", micro: "Draw a more defined line on the central subject of your sketch.", time: "<40 sec", easier: ["Draw central stroke", "Trace center outline"] },
    { title: "Select darker sketching tool", micro: "Switch to a 2B graphite pencil or a slightly darker brush.", time: "<20 sec", easier: ["Select dark pencil", "Increase opacity digital brush"] },
    { title: "Darken outer outline", micro: "Trace over the main contours with a firmer, more confident hand.", time: "<60 sec", easier: ["Trace one edge", "Firm up bottom line"] },
    { title: "Add first shading strokes", micro: "Apply a light cross-hatch or soft shading to the shadowed side.", time: "<60 sec", easier: ["Scribble soft shade", "Blend with finger digital"] },
    { title: "Step back and evaluate", micro: "Hold the page back or zoom out to look at the composition from a distance.", time: "<20 sec", easier: ["Tilt head back", "Zoom canvas out"] },
    { title: "Save file or close sketch", micro: "Save progress or rest your pencil. Your creative sketch is successfully started!", time: "<15 sec", easier: ["Press Cmd+S", "Set pencil down"] }
  ],
  "video": [
    { title: "Launch video editor", micro: "Open your editing software (Premiere, Final Cut, DaVinci, or CapCut).", time: "<25 sec", easier: ["Click editor icon", "Search app in dock"] },
    { title: "Create new video project", micro: "Click 'New Project' and name it with today's topic.", time: "<20 sec", easier: ["Click New Project", "Type project name"] },
    { title: "Open project media pool", micro: "Navigate to the asset import area of the software.", time: "<15 sec", easier: ["Click Media tab", "Look at empty pool"] },
    { title: "Import primary video footage", micro: "Import the raw, uncut video files from your computer storage.", time: "<35 sec", easier: ["Press Cmd+I", "Drag file from desktop"] },
    { title: "Drag main clip to timeline", micro: "Drop the main clip onto Track V1 of your editing timeline.", time: "<25 sec", easier: ["Click and hold file", "Drag down to timeline"] },
    { title: "Zoom in on timeline", micro: "Expand the timeline view so you can see individual frame borders.", time: "<15 sec", easier: ["Press '+' key", "Drag timeline zoom bar"] },
    { title: "Listen to start audio", micro: "Press spacebar to play the first 3 seconds of the clip.", time: "<20 sec", easier: ["Press spacebar", "Look at playhead"] },
    { title: "Locate starting mistake", micro: "Find the gap or silence before you start speaking.", time: "<25 sec", easier: ["Scan audio waveform", "Listen for silence"] },
    { title: "Select razor/cut tool", micro: "Switch to the cut tool or press the blade shortcut.", time: "<15 sec", easier: ["Click razor icon", "Press 'C' key"] },
    { title: "Slice starting silence", micro: "Click the blade on the timeline exactly where the action begins.", time: "<20 sec", easier: ["Cut timeline clip", "Position playhead"] },
    { title: "Select deleted gap", micro: "Switch back to the pointer tool and click the silent clip segment.", time: "<15 sec", easier: ["Press 'V' key", "Click cut clip"] },
    { title: "Ripple delete starting gap", micro: "Press 'Option+Delete' to remove the gap and slide footage to the start.", time: "<15 sec", easier: ["Press delete key", "Drag clip manually to 0:00"] },
    { title: "Scan for middle error", micro: "Play forward to locate a pause, stumble, or filler word.", time: "<45 sec", easier: ["Listen to middle track", "Look at timeline cursor"] },
    { title: "Cut middle mistake", micro: "Make a cut before and after the mistake segment.", time: "<30 sec", easier: ["Slice mistake start", "Slice mistake end"] },
    { title: "Delete middle segment", micro: "Delete the sliced mistake segment to close the gap.", time: "<15 sec", easier: ["Press Delete", "Select center piece"] },
    { title: "Add cross-fade transition", micro: "Drag a simple transition between the two remaining clips.", time: "<30 sec", easier: ["Search 'Dissolve' in effects", "Apply crossfade"] },
    { title: "Adjust master audio level", micro: "Ensure the audio waveform peak is comfortable (-6db to -12db).", time: "<25 sec", easier: ["Glance at volume slider", "Adjust DB gain"] },
    { title: "Add simple title text", micro: "Overlay a neat, basic title text card on slide one.", time: "<40 sec", easier: ["Click Text icon", "Type one title word"] },
    { title: "Watch the draft cut", micro: "Play the sequence from the beginning to check overall flow.", time: "<60 sec", easier: ["Play sequence", "Sit back and watch"] },
    { title: "Save timeline progress", micro: "Save your project file. You have cracked the hardest editing barrier!", time: "<15 sec", easier: ["Press Cmd+S", "Close editor"] }
  ],
  "song": [
    { title: "Prepare music workstation", micro: "Clear your desk or open your DAW (Ableton, Logic, or GarageBand).", time: "<25 sec", easier: ["Turn on computer", "Launch DAW app"] },
    { title: "Tune your instrument", micro: "Tune your physical guitar, keyboard, or select a digital synthesizer.", time: "<30 sec", easier: ["Open tuner app", "Strum first chord"] },
    { title: "Open blank DAW track", micro: "Create a new project named 'Song Idea Draft'.", time: "<20 sec", easier: ["Click New Project", "Select instrument track"] },
    { title: "Choose comfortable tempo", micro: "Set the project metronome bpm (e.g., 90bpm or 120bpm).", time: "<15 sec", easier: ["Set tempo dial", "Double-click bpm bar"] },
    { title: "Play basic C major chord", micro: "Strum or play a simple C major chord to hear the tone.", time: "<15 sec", easier: ["Touch first key", "Press C note"] },
    { title: "Play supporting chord progression", micro: "Play a classic 4-chord circle (e.g., C - G - Am - F).", time: "<45 sec", easier: ["Play G chord", "Hum a note"] },
    { title: "Record chord progression", micro: "Arm your audio track and record 4 bars of the chords.", time: "<60 sec", easier: ["Click red Record button", "Get ready to play"] },
    { title: "Loop the recorded chords", micro: "Duplicate the 4 bars on your timeline to create an endless loop.", time: "<20 sec", easier: ["Press Cmd+D", "Select looping handle"] },
    { title: "Sit back and listen", micro: "Play back the loop. Close your eyes and absorb the rhythm.", time: "<30 sec", easier: ["Press spacebar", "Close eyes"] },
    { title: "Hum a loose melody", micro: "Gently hum random vocal pitches over your chord loop.", time: "<45 sec", easier: ["Hum a single tone", "Vocalize a simple sound"] },
    { title: "Isolate a catchy melody phrase", micro: "Repeat the most pleasing note pattern you hummed.", time: "<45 sec", easier: ["Hum it twice", "Sing one note"] },
    { title: "Record vocal humming idea", micro: "Use your phone voice recorder or record directly into the DAW.", time: "<45 sec", easier: ["Open voice memo app", "Press record"] },
    { title: "Write down lyric word one", micro: "Open a notes document or grab a pad. Write down one word.", time: "<20 sec", easier: ["Type one word", "Pick up notepad pen"] },
    { title: "Draft the first lyric line", micro: "Write one phrase that describes your current mood or setting.", time: "<45 sec", easier: ["Type 'The morning rain...'", "Write simple lyric"] },
    { title: "Draft a rhyming second line", micro: "Create a second line matching the meter and rhyme of the first.", time: "<45 sec", easier: ["Type 'washing down...'", "Think of rhyming word"] },
    { title: "Sing lyrics over chords", micro: "Combine your recorded chords, melody, and draft lyrics.", time: "<60 sec", easier: ["Sing line one out loud", "Hum over chorus loop"] },
    { title: "Write down a chorus title", micro: "Identify the central word or phrase that represents the song.", time: "<30 sec", easier: ["Type chorus title", "Think of main word"] },
    { title: "Formulate chorus lyric", micro: "Write a bold, repetitive, catchy lyric line for the chorus.", time: "<45 sec", easier: ["Type chorus line", "Repeat main phrase"] },
    { title: "Record a full draft take", micro: "Record a single rough performance of your verse and chorus.", time: "<90 sec", easier: ["Press record", "Sing draft line"] },
    { title: "Save and exit file", micro: "Save your session and export your voice memo. You've officially written a song idea!", time: "<20 sec", easier: ["Press Cmd+S", "Close project window"] }
  ],

  // cooking
  "dinner": [
    { title: "Wash your hands", micro: "Wash your hands with warm water and soap. Clean hands build kitchen focus.", time: "<20 sec", easier: ["Turn on tap", "Rub hands with soap"] },
    { title: "Clear the kitchen counter", micro: "Wipe off crumbs or move keys aside to create a roomy prep zone.", time: "<35 sec", easier: ["Move one item off counter", "Wipe a small spot"] },
    { title: "Retrieve recipe card", micro: "Open your recipe app, look at a website, or grab your cookbook.", time: "<20 sec", easier: ["Open recipe link", "Look at cookbook cover"] },
    { title: "Locate frying pan or pot", micro: "Open your kitchen cabinet and pull out your primary pan or pot.", time: "<20 sec", easier: ["Touch pan handle", "Look inside cabinet"] },
    { title: "Place pan on stove burner", micro: "Position the cookware securely on the stove top.", time: "<10 sec", easier: ["Set pan down", "Look at stove burner"] },
    { title: "Open refrigerator", micro: "Stand before the fridge and open the door.", time: "<15 sec", easier: ["Touch fridge handle", "Look at door seals"] },
    { title: "Retrieve vegetables", micro: "Gather onions, garlic, carrots, or peppers for chopping.", time: "<25 sec", easier: ["Grab one onion", "Look in veggie bin"] },
    { title: "Retrieve proteins/sides", micro: "Retrieve chicken, tofu, beef, or beans from the fridge.", time: "<20 sec", easier: ["Grab protein tray", "Locate beans in pantry"] },
    { title: "Set out cutting board", micro: "Place a clean wooden or plastic cutting board on your counter.", time: "<15 sec", easier: ["Retrieve board", "Nudge board to center"] },
    { title: "Retrieve chef's knife", micro: "Grab your sharp kitchen knife safely from the knife block or drawer.", time: "<15 sec", easier: ["Touch knife handle", "Open knife drawer"] },
    { title: "Peel onion skin", micro: "Gently peel away the outer paper skin of the onion.", time: "<30 sec", easier: ["Slice off onion top", "Peel first paper skin layer"] },
    { title: "Chop the first vegetable", micro: "Slice the onion or garlic slowly into uniform pieces.", time: "<45 sec", easier: ["Make one slice", "Hold onion safely"] },
    { title: "Preheat your stove burner", micro: "Turn the burner dial to medium heat. Feel the warm air rise.", time: "<15 sec", easier: ["Turn dial to Medium", "Look at igniter glow"] },
    { title: "Add cooking oil to pan", micro: "Drizzle a tablespoon of olive oil or butter onto the heated pan.", time: "<20 sec", easier: ["Grab oil bottle", "Pour tiny drop of oil"] },
    { title: "Add chopped vegetables", micro: "Toss the chopped onions or garlic into the sizzling pan.", time: "<20 sec", easier: ["Slide onions off board", "Hear the sizzle"] },
    { title: "Stir the sizzling vegetables", micro: "Use a wooden spoon to stir ingredients gently. Smells like success.", time: "<40 sec", easier: ["Touch wooden spoon", "Stir pan ingredients once"] },
    { title: "Chop remaining vegetables", micro: "Slice up your carrots, peppers, or greens while stove sizzles.", time: "<60 sec", easier: ["Chop carrot piece", "Align board"] },
    { title: "Add proteins and stir", micro: "Toss in your protein or beans and combine everything in the pan.", time: "<60 sec", easier: ["Drop tofu in", "Stir main pot"] },
    { title: "Season with salt and spices", micro: "Add a pinch of salt, pepper, or herbs to the dish.", time: "<25 sec", easier: ["Grab salt shaker", "Pinch dried oregano"] },
    { title: "Plate up your dinner", micro: "Turn off the burner. Spoon your warm meal onto a clean dinner plate. Enjoy!", time: "<40 sec", easier: ["Turn off stove burner", "Transfer food to bowl"] }
  ],
  "lunch": [
    { title: "Clear kitchen counter", micro: "Wipe a clean space on your counter or table for prep work.", time: "<20 sec", easier: ["Move cup aside", "Wipe small counter spot"] },
    { title: "Retrieve lunch container", micro: "Grab a clean Tupperware box, lunchbox, or plate.", time: "<15 sec", easier: ["Open container drawer", "Pick up lunchbox"] },
    { title: "Open pantry cabinet", micro: "Look in your cupboard or pantry for sandwich bread or wraps.", time: "<15 sec", easier: ["Touch pantry handle", "Open cupboard door"] },
    { title: "Retrieve bread or wraps", micro: "Place two slices of bread or a tortilla wrap on your prep board.", time: "<15 sec", easier: ["Grab bread bag", "Place bread down"] },
    { title: "Open refrigerator door", micro: "Stand before the fridge and open it to gather ingredients.", time: "<15 sec", easier: ["Touch fridge door", "Look inside fridge"] },
    { title: "Retrieve sandwich fillings", micro: "Pick up sliced cheese, turkey, tomato, or hummus.", time: "<25 sec", easier: ["Grab cheese packet", "Get tomato"] },
    { title: "Retrieve spreads bottle", micro: "Locate the mayonnaise, mustard, pesto, or butter jar.", time: "<20 sec", easier: ["Grab mustard jar", "Spot butter tube"] },
    { title: "Position spreads on counter", micro: "Place all ingredients neatly in a line next to your bread.", time: "<15 sec", easier: ["Set down cheese", "Align spreads"] },
    { title: "Grab butter knife", micro: "Pick up a clean butter knife from your silverware drawer.", time: "<15 sec", easier: ["Open silverware drawer", "Touch knife handle"] },
    { title: "Apply spread to bread", micro: "Spread a thin, even layer of pesto or butter on your first slice.", time: "<30 sec", easier: ["Dip knife in jar", "Spread small corner"] },
    { title: "Add cheese layer", micro: "Layer one slice of cheese comfortably on top of the spread.", time: "<15 sec", easier: ["Open cheese pack", "Place cheese sheet"] },
    { title: "Add primary protein/filling", micro: "Add your sliced turkey, tofu, or hummus onto the sandwich.", time: "<25 sec", easier: ["Lay down one slice", "Spoon hummus"] },
    { title: "Slice tomato or greens", micro: "Slices a thin piece of tomato or rinse a leaf of crisp lettuce.", time: "<30 sec", easier: ["Wash lettuce leaf", "Cut tomato slice"] },
    { title: "Add fresh vegetables", micro: "Lay the tomato and lettuce inside the sandwich frame.", time: "<15 sec", easier: ["Lay tomato on cheese", "Toss lettuce in sandwich"] },
    { title: "Close sandwich with second slice", micro: "Place the top slice of bread over the fillings. Press down lightly.", time: "<10 sec", easier: ["Align second slice", "Tap sandwich top"] },
    { title: "Slice sandwich diagonally", micro: "Use your knife to make a clean, diagonal cut across the center.", time: "<20 sec", easier: ["Place knife on bread", "Make simple cut"] },
    { title: "Wrap sandwich in wrap", micro: "Wrap the sandwich neatly in foil, parchment paper, or place in a lid box.", time: "<25 sec", easier: ["Tear foil strip", "Place sandwich in container"] },
    { title: "Add a fresh fruit", micro: "Grab an apple, banana, or orange from your fruit bowl.", time: "<15 sec", easier: ["Look at fruit bowl", "Pick up apple"] },
    { title: "Pack lunchbox bag", micro: "Place sandwich container and fruit safely inside your lunch bag.", time: "<20 sec", easier: ["Zip lunch box", "Drop container in bag"] },
    { title: "Store in refrigerator", micro: "Place the packed lunch in the fridge so it stays cool and fresh for later.", time: "<15 sec", easier: ["Open fridge", "Set lunch on shelf"] }
  ],
  "groceries": [
    { title: "Open pantry cabinet", micro: "Look in your pantry to see what daily staples are missing.", time: "<20 sec", easier: ["Open pantry door", "Look at shelves"] },
    { title: "Check refrigerator inventory", micro: "Open the fridge and check your milk, eggs, or fresh produce levels.", time: "<20 sec", easier: ["Open fridge", "Scan milk carton"] },
    { title: "Open phone notepad app", micro: "Launch a notes app or grab a physical pen and notepad.", time: "<15 sec", easier: ["Click notes app", "Pick up notepad"] },
    { title: "Draft 'Groceries' heading", micro: "Create a fresh note titled 'Grocery Checklist' with a list icon.", time: "<15 sec", easier: ["Type heading 'Groceries'", "Press list format"] },
    { title: "Write down prime missing staple", micro: "Add the most essential item you need (e.g., 'Coffee' or 'Milk').", time: "<20 sec", easier: ["Type 'Milk'", "Write first letter"] },
    { title: "Add secondary fresh staples", micro: "Add fruits, vegetables, or breads you need for the week.", time: "<30 sec", easier: ["Type 'Apples'", "Write 'Bread'"] },
    { title: "Add dinner meal ingredients", micro: "Write down 2 key ingredients for your planned dinners.", time: "<30 sec", easier: ["Type ingredient A", "Think of dinner"] },
    { title: "Review grocery checklist", micro: "Ensure your list is complete and organized by store section.", time: "<20 sec", easier: ["Read through checklist", "Check spellings"] },
    { title: "Grab reusable shopping bags", micro: "Collect two or three sturdy canvas bags near your entry door.", time: "<20 sec", easier: ["Look under kitchen sink", "Grab one bag"] },
    { title: "Put on walking shoes", micro: "Slip on your outdoor walking shoes and tie the laces.", time: "<30 sec", easier: ["Slip left shoe on", "Tie right shoe lace"] },
    { title: "Secure wallet and keys", micro: "Ensure your wallet, cash card, and house keys are in your pocket.", time: "<20 sec", easier: ["Tap right pocket", "Locate purse"] },
    { title: "Lock front entry door", micro: "Walk out your door and secure the lock with your key.", time: "<15 sec", easier: ["Shut front door", "Turn key in lock"] },
    { title: "Walk to local grocery store", micro: "Walk or drive to your neighborhood market. Enjoy the fresh air.", time: "<10 min", easier: ["Take first outdoor step", "Look down driveway"] },
    { title: "Enter market and grab cart", micro: "Approach the market entrance and retrieve a basket or shopping cart.", time: "<30 sec", easier: ["Enter through sliders", "Pull out one basket"] },
    { title: "Scan fresh produce aisle", micro: "Walk to the fresh fruits section and grab your apples or greens.", time: "<60 sec", easier: ["Look at fresh apples", "Pick up lettuce head"] },
    { title: "Navigate to pantry dry aisle", micro: "Collect your bread, pasta, or coffee beans from the inner shelves.", time: "<60 sec", easier: ["Walk down dry aisle", "Spot coffee bag"] },
    { title: "Collect refrigerated items", micro: "Pick up milk, cheese, or frozen goods. Feel the cool air.", time: "<60 sec", easier: ["Open fridge cabinet", "Grab milk jug"] },
    { title: "Approach checkout register", micro: "Walk to the registers and choose an open lane or self-scan kiosk.", time: "<30 sec", easier: ["Walk to lanes", "Find empty register"] },
    { title: "Pay and pack bags", micro: "Scan items, swipe your bank card, and pack groceries neatly into bags.", time: "<90 sec", easier: ["Swipe credit card", "Pack one bag"] },
    { title: "Arrive home and unpack", micro: "Walk home, lock door, and place groceries in pantry and fridge. Victory!", time: "<10 min", easier: ["Place bags on counter", "Put milk in fridge"] }
  ],

  // exercise
  "run": [
    { title: "Locate running clothes", micro: "Find your active shorts, t-shirt, or athletic leggings.", time: "<20 sec", easier: ["Look in dresser drawer", "Retrieve socks"] },
    { title: "Put on running socks", micro: "Slip on a comfortable, breathable pair of sport socks.", time: "<20 sec", easier: ["Slip left sock on", "Hold right sock"] },
    { title: "Change into running clothes", micro: "Change out of daily wear and into your active running gear.", time: "<40 sec", easier: ["Put on sports shirt", "Step into running pants"] },
    { title: "Locate running sneakers", micro: "Grab your running shoes from the entry table or rack.", time: "<15 sec", easier: ["Look under bench", "Touch sneaker heel"] },
    { title: "Put on running sneakers", micro: "Slip your feet into your running shoes. Push your heels in firmly.", time: "<25 sec", easier: ["Slide left shoe on", "Nudge right foot"] },
    { title: "Tie sneaker shoe laces", micro: "Tie a secure double-knot on both shoe laces. Keep them snug.", time: "<30 sec", easier: ["Tie left lace", "Loop right lace"] },
    { title: "Secure phone and keys", micro: "Place keys in a zip pocket and secure your phone in an armband or belt.", time: "<20 sec", easier: ["Touch key ring", "Slide phone in case"] },
    { title: "Check outdoor weather", micro: "Glance out the window or step outside to gauge temperature.", time: "<15 sec", easier: ["Look out window", "Touch glass pane"] },
    { title: "Grab headphones", micro: "Grab your wireless earbuds or wired headphones from the charger.", time: "<20 sec", easier: ["Open earbud case", "Touch headphone band"] },
    { title: "Select running music playlist", micro: "Open your music player app and select a high-energy running track.", time: "<25 sec", easier: ["Click playlist icon", "Hover on song track"] },
    { title: "Step outside front door", micro: "Walk out your front door and lock it behind you securely.", time: "<20 sec", easier: ["Take step outside", "Turn door lock"] },
    { title: "Start exercise phone app", micro: "Open your running tracker (e.g., Strava or Apple Fitness) and tap Start.", time: "<20 sec", easier: ["Click tracker app", "Swipe to run screen"] },
    { title: "Do dynamic shoulder rolls", micro: "Roll your shoulders backward and forward five times slowly.", time: "<15 sec", easier: ["Roll left shoulder", "Relax neck"] },
    { title: "Stretch your calves", micro: "Place your hands on a wall or tree and push your back heel down to stretch.", time: "<30 sec", easier: ["Stretch left calf", "Face tree post"] },
    { title: "Stretch your quadriceps", micro: "Bend your knee, hold your ankle behind you, and stand tall to stretch thighs.", time: "<30 sec", easier: ["Hold left ankle", "Lean against wall"] },
    { title: "Begin a brisk walk", micro: "Walk forward at a firm, brisk pace for exactly one minute.", time: "<60 sec", easier: ["Take 10 walking steps", "Look down path"] },
    { title: "Breathe deeply in rhythm", micro: "Inhale for two steps, exhale for two steps. Align heart and breath.", time: "<20 sec", easier: ["Take deep inhale", "Focus on walking rhythm"] },
    { title: "Transition to light jog", micro: "Gently pick up your pace from a walk to a very slow, relaxed jog.", time: "<60 sec", easier: ["Move feet slightly faster", "Lean body forward"] },
    { title: "Run your planned loop", micro: "Maintain a steady, comfortable pace where you can easily talk.", time: "<15 min", easier: ["Jog for another block", "Breathe steadily"] },
    { title: "Return home and cool down", micro: "Walk back to your doorstep, drink water, and celebrate. You did it!", time: "<3 min", easier: ["Take off sneakers", "Drink water bottle"] }
  ],
  "stretch": [
    { title: "Find empty floor space", micro: "Locate a clear 6x6 feet area on your floor with no obstructions.", time: "<20 sec", easier: ["Look at bedroom floor", "Move slippers aside"] },
    { title: "Roll out exercise mat", micro: "Lay down a yoga mat, comfortable rug, or folded blanket.", time: "<20 sec", easier: ["Grab yoga mat", "Spread mat flat"] },
    { title: "Sit with crossed legs", micro: "Sit comfortably in the center of your mat. Feel your sit-bones grounded.", time: "<15 sec", easier: ["Sit down gently", "Cross ankles"] },
    { title: "Rest hands on knees", micro: "Place your palms on your knees. Let your hands feel heavy and relaxed.", time: "<10 sec", easier: ["Rest left hand", "Relax fingers"] },
    { title: "Slowly roll your neck", micro: "Tilt your head to the left, then gently roll it back and right in circles.", time: "<30 sec", easier: ["Tilt head left", "Drop neck down"] },
    { title: "Roll your shoulders", micro: "Lift your shoulders toward your ears, then slide them backward and down.", time: "<20 sec", easier: ["Shrug shoulders once", "Drop chest weight"] },
    { title: "Inhale arms up high", micro: "Inhale deeply as you sweep your arms overhead toward the ceiling.", time: "<15 sec", easier: ["Raise hands slightly", "Focus on breath"] },
    { title: "Stretch your left side", micro: "Place your right hand on the floor and reach your left arm up and over to the right.", time: "<30 sec", easier: ["Reach left arm up", "Slide right hand out"] },
    { title: "Stretch your right side", micro: "Place your left hand on the floor and reach your right arm up and over to the left.", time: "<30 sec", easier: ["Reach right arm up", "Slide left hand out"] },
    { title: "Perform gentle torso twist left", micro: "Place your right hand on your left knee and look back over your left shoulder.", time: "<30 sec", easier: ["Turn shoulders left", "Hold left thigh"] },
    { title: "Perform gentle torso twist right", micro: "Place your left hand on your right knee and look back over your right shoulder.", time: "<30 sec", easier: ["Turn shoulders right", "Hold right thigh"] },
    { title: "Transition to tabletop pose", micro: "Bring your hands and knees to the mat. Keep wrists under shoulders.", time: "<20 sec", easier: ["Move to knees", "Place palms flat"] },
    { title: "Do Cow stretch (Inhale)", micro: "Drop your belly toward the mat and lift your chin and gaze upward.", time: "<20 sec", easier: ["Arch back downward", "Look ahead"] },
    { title: "Do Cat stretch (Exhale)", micro: "Round your spine toward the ceiling and tuck your chin toward your chest.", time: "<20 sec", easier: ["Arch spine upward", "Tuck head in"] },
    { title: "Transition to Child's Pose", micro: "Press your hips back onto your heels and reach your arms forward on floor.", time: "<45 sec", easier: ["Drop hips to heels", "Rest forehead down"] },
    { title: "Stretch in Child's Pose", micro: "Breathe slowly into your lower back. Let your upper body melt down.", time: "<60 sec", easier: ["Take deep breath", "Extend fingers forward"] },
    { title: "Sit back up on heels", micro: "Gently walk your hands back toward your body to lift your head.", time: "<20 sec", easier: ["Roll spine up", "Sit tall"] },
    { title: "Stretch arms behind back", micro: "Interlace your fingers behind your back and pull your shoulders open.", time: "<30 sec", easier: ["Clasp fingers", "Roll chest open"] },
    { title: "Roll wrists in circles", micro: "Rotate your wrists slowly five times to release typing tension.", time: "<15 sec", easier: ["Wiggle fingers", "Clench and release fists"] },
    { title: "Take final centering breath", micro: "Bring hands to your chest, close your eyes, and exhale. Feel the peace!", time: "<15 sec", easier: ["Breathe in deep", "Smile"] }
  ],
  "gym": [
    { title: "Grab gym water bottle", micro: "Fill your reusable athletic bottle with cold, refreshing water.", time: "<20 sec", easier: ["Turn on kitchen tap", "Grab bottle from rack"] },
    { title: "Pack active gym bag", micro: "Place towel, lock, headphones, and membership pass into your bag.", time: "<30 sec", easier: ["Zip gym bag", "Drop towel inside"] },
    { title: "Change into gym wear", micro: "Change into athletic shirt, shorts, and supportive training sneakers.", time: "<40 sec", easier: ["Step into shorts", "Tie running shoes"] },
    { title: "Verify gym hours online", micro: "Do a quick 5-second check of your gym's current opening hours.", time: "<15 sec", easier: ["Open gym bookmark", "Confirm schedules"] },
    { title: "Grab your car keys", micro: "Grab keys, wallet, and lock the front entrance door securely.", time: "<20 sec", easier: ["Pick up key fob", "Lock front gate"] },
    { title: "Walk or drive to gym", micro: "Commute to your fitness facility. Prepare your mind for movement.", time: "<10 min", easier: ["Step in car", "Look down driveway"] },
    { title: "Enter gym entrance", micro: "Walk through gym glass doors and scan your membership barcode.", time: "<30 sec", easier: ["Locate barcode card", "Walk past scanner gate"] },
    { title: "Locate locker room", micro: "Walk to the locker bay to store your heavy bags or jackets.", time: "<45 sec", easier: ["Find empty locker", "Place bag inside"] },
    { title: "Secure your locker", micro: "Spin and lock your padlock to secure your belongings safely.", time: "<20 sec", easier: ["Close locker door", "Turn lock dials"] },
    { title: "Approach cardio deck", micro: "Walk to the treadmill, elliptical, or stationary bike row.", time: "<30 sec", easier: ["Spot open treadmill", "Walk past weights"] },
    { title: "Step on stationary bike", micro: "Step onto a bike or treadmill. Position feet on the pedals.", time: "<15 sec", easier: ["Sit on seat", "Look at bike screen"] },
    { title: "Start slow warm-up", micro: "Turn on machine and pedal or walk at a gentle pace for 2 minutes.", time: "<2 min", easier: ["Press Quick Start", "Pedal slowly once"] },
    { title: "Adjust machine speed", micro: "Increase speed or resistance slightly to elevate heart rate.", time: "<15 sec", easier: ["Press Speed Up arrow", "Pedal faster"] },
    { title: "Navigate to strength zone", micro: "Walk over to the barbell rack, cable towers, or free weights.", time: "<30 sec", easier: ["Walk to weight floor", "Locate dumbbell shelf"] },
    { title: "Grab light dumbbells", micro: "Pick up a pair of light, comfortable weights for warming up.", time: "<20 sec", easier: ["Touch a dumbbell handle", "Look at weight plates"] },
    { title: "Do a light set of squats", micro: "Perform 10 gentle bodyweight or light squats to wake up joints.", time: "<40 sec", easier: ["Bend knees slightly", "Do one squat rep"] },
    { title: "Log exercise in notebook", micro: "Scribble down your weights and reps in your workout log app.", time: "<20 sec", easier: ["Open gym log note", "Type 'Squat - 10 reps'"] },
    { title: "Wipe down weight bench", micro: "Use sanitizing spray and paper towels to clean the equipment bench.", time: "<25 sec", easier: ["Spray blue bottle", "Wipe bench leather"] },
    { title: "Stretch shoulders and arms", micro: "Perform a quick 1-minute upper-body cool-down stretch.", time: "<45 sec", easier: ["Stretch left arm across chest", "Relax shoulders"] },
    { title: "Collect gear and exit", micro: "Unsecure your locker, grab your bag, and walk out. Great gym session done!", time: "<3 min", easier: ["Unlock padlock", "Walk out entry doors"] }
  ],

  // errands
  "post-office": [
    { title: "Gather item to return", micro: "Locate the package, shirt, or item you want to post or mail.", time: "<15 sec", easier: ["Pick up shirt", "Look on counter"] },
    { title: "Locate packing box", micro: "Find an empty cardboard box or shipping envelope that fits the item.", time: "<20 sec", easier: ["Look in closet", "Find bubble mailer"] },
    { title: "Place item in box", micro: "Insert your return item safely inside the box or envelope container.", time: "<15 sec", easier: ["Tuck item inside", "Fold packing paper"] },
    { title: "Locate heavy packing tape", micro: "Grab your heavy-duty packaging tape roll from drawers.", time: "<15 sec", easier: ["Touch tape dispenser", "Search desk drawers"] },
    { title: "Tape up box seams", micro: "Run tape over the top lid and bottom flaps to secure the package.", time: "<30 sec", easier: ["Pull a tape strip", "Seal center seam"] },
    { title: "Locate address pen", micro: "Grab a permanent black marker or ballpoint pen to write details.", time: "<15 sec", easier: ["Grab black Sharpie", "Touch pen"] },
    { title: "Write recipient address", micro: "Carefully write the destination name and address on the center of the box.", time: "<45 sec", easier: ["Type address note", "Write first letter of street"] },
    { title: "Write return sender address", micro: "Write your name and return address in the top-left corner of the box.", time: "<30 sec", easier: ["Write your ZIP code", "Write return initials"] },
    { title: "Double-check postal addresses", micro: "Verify zip codes and street spellings are correct and readable.", time: "<20 sec", easier: ["Scan street name", "Read postcode again"] },
    { title: "Secure shipping label if digital", micro: "If you have a printed QR code or label, tape it to the box lid.", time: "<30 sec", easier: ["Locate printout", "Align barcode label"] },
    { title: "Grab keys and wallet", micro: "Ensure keys, transit cards, and wallet are secure in your pockets.", time: "<20 sec", easier: ["Feel pocket key ring", "Grab card wallet"] },
    { title: "Lock front house door", micro: "Step out and twist the key in the deadbolt lock securely.", time: "<15 sec", easier: ["Shut front gate", "Turn key cylinder"] },
    { title: "Walk to nearest post branch", micro: "Walk or drive to your local USPS or Post Office branch.", time: "<10 min", easier: ["Take first walking step", "Look down street"] },
    { title: "Enter post office branch", micro: "Walk through entry doors. Notice the packages on the shelves.", time: "<30 sec", easier: ["Enter lobby doors", "Look at service desk"] },
    { title: "Take queue number ticket", micro: "If busy, press the kiosk button to pull your service number ticket.", time: "<20 sec", easier: ["Touch ticket button", "Grab paper number"] },
    { title: "Wait in waiting lobby", micro: "Sit or stand calmly in the lobby line. Read your phone note.", time: "<2 min", easier: ["Look at line queue screen", "Breathe slowly"] },
    { title: "Approach counter window", micro: "When your ticket is called, walk up to the designated window counter.", time: "<30 sec", easier: ["Walk to desk number 3", "Nudge parcel closer"] },
    { title: "Hand package to postal clerk", micro: "Place your package on the counter scale for weighing.", time: "<20 sec", easier: ["Set box on scale", "Greet postal clerk"] },
    { title: "Pay for postage stamp", micro: "Select standard or express delivery shipping speed and tap bank card.", time: "<45 sec", easier: ["Insert card in terminal", "Select email receipt"] },
    { title: "Store shipping receipt", micro: "Grab your paper receipt, thank clerk, and walk out. Package posted!", time: "<20 sec", easier: ["Zip receipt in pocket", "Say thank you"] }
  ],
  "pharmacy": [
    { title: "Locate medical script card", micro: "Find your paper doctor's prescription or digital insurance card.", time: "<15 sec", easier: ["Search wallet slot", "Locate prescription paper"] },
    { title: "Check pharmacy hours online", micro: "Confirm online that your local pharmacy is open right now.", time: "<15 sec", easier: ["Open map bookmark", "Confirm open status"] },
    { title: "Draft a question note", micro: "If you need to ask the druggist something, jot down a quick word.", time: "<20 sec", easier: ["Type question word", "Think about script details"] },
    { title: "Grab transit keys", micro: "Collect your car keys, wallet, or transit pass from the entry table.", time: "<15 sec", easier: ["Pick up key ring", "Touch wallet"] },
    { title: "Step outside front door", micro: "Walk out your doorway and lock up safely.", time: "<20 sec", easier: ["Shut front gate", "Turn lock latch"] },
    { title: "Walk to local chemist", micro: "Commute or walk to your neighborhood chemist or pharmacy store.", time: "<10 min", easier: ["Take first step down block", "Walk to corner"] },
    { title: "Enter chemist doors", micro: "Slide through automatic entrance doors. Smell the clean air.", time: "<30 sec", easier: ["Enter slider door", "Look for pharmacy desk"] },
    { title: "Follow signs to back desk", micro: "Navigate toward the rear counter marked 'Prescriptions & Pickup'.", time: "<30 sec", easier: ["Walk down aisle 4", "Look for prescription sign"] },
    { title: "Approach service line", micro: "Join the pickup queue line. Keep a comfortable, calm posture.", time: "<60 sec", easier: ["Step behind queue pillar", "Relax arms"] },
    { title: "Approach pharmacist counter", micro: "Walk up when called and greet the chemist counter staff.", time: "<20 sec", easier: ["Step up to counter", "Say good morning"] },
    { title: "Hand over medical script card", micro: "Present your script paper or tap your insurance barcode on the glass.", time: "<20 sec", easier: ["Slide paper across desk", "Show digital script"] },
    { title: "State full name", micro: "Say your first and last name clearly for their medical databases.", time: "<15 sec", easier: ["Spell first initials", "State last name"] },
    { title: "Verify date of birth", micro: "State your day, month, and year of birth to authorize medicine release.", time: "<15 sec", easier: ["State birth month", "State birth day"] },
    { title: "Wait for pharmacy assembly", micro: "Wait patiently as the chemist retrieves and labels your container.", time: "<2 min", easier: ["Look at health racks", "Inhale slowly once"] },
    { title: "Listen to pharmacy advice", micro: "Listen to brief instructions on dosage, times, and side effects.", time: "<45 sec", easier: ["Nod head yes", "Ask one question about food"] },
    { title: "Confirm medical price", micro: "Inspect the price screen or co-pay amount on the credit terminal.", time: "<15 sec", easier: ["Glance at total sum", "Nod to pharmacist"] },
    { title: "Swipe bank card to pay", micro: "Insert your visa or cash card into the terminal to complete payment.", time: "<30 sec", easier: ["Tap credit card", "Enter card PIN"] },
    { title: "Collect signed bag", micro: "Take the medicine bag securely and verify your name on the label.", time: "<15 sec", easier: ["Grab medical bag", "Read bottle label name"] },
    { title: "Exit pharmacy lobby", micro: "Walk down store aisles and slide back out the automatic front doors.", time: "<45 sec", easier: ["Walk past aisles", "Step outdoors"] },
    { title: "Arrive home and store", micro: "Walk back home, store medicine in cabinet, and take a relief breath. Errand done!", time: "<10 min", easier: ["Unpack bag on table", "Put bottle in drawer"] }
  ],
  "gifts": [
    { title: "Identify recipient person", micro: "Think about the friend or family member who will receive the gift.", time: "<15 sec", easier: ["Recall friend's name", "Imagine their face"] },
    { title: "List two favorite hobbies", micro: "Think of two activities they love (e.g., 'Reading', 'Gardening', or 'Cooking').", time: "<30 sec", easier: ["Write word 'books'", "Think of their hobbies"] },
    { title: "Set maximum budget range", micro: "Decide a comfortable maximum price limit (e.g., $30 or $50).", time: "<15 sec", easier: ["Write '$30'", "Decide price range"] },
    { title: "Open shopping browser", micro: "Launch Safari, Chrome, or your favorite online retailer app.", time: "<20 sec", easier: ["Click browser icon", "Type shopping URL"] },
    { title: "Search hobby keywords", micro: "Type '[Hobby] high quality gifts' in search bar (e.g., 'cooking spice set').", time: "<30 sec", easier: ["Type search letters", "Press enter on search"] },
    { title: "Browse top three results", micro: "Skim the images and descriptions of the first three search listings.", time: "<45 sec", easier: ["Scroll down first page", "Click first item image"] },
    { title: "Select the ideal gift", micro: "Click on the most logical, interesting, and budget-friendly item.", time: "<30 sec", easier: ["Click product card", "Look at listing stars"] },
    { title: "Read user reviews", micro: "Scan the first three reviews to confirm quality and real-life appearance.", time: "<45 sec", easier: ["Read 5-star review", "Read 4-star review"] },
    { title: "Click 'Add to Cart'", micro: "Tap the yellow or black checkout basket button.", time: "<15 sec", easier: ["Click Add to Cart", "Hover mouse over cart"] },
    { title: "Navigate to checkout cart", micro: "Click the cart trolley icon in the upper-right corner of the screen.", time: "<15 sec", easier: ["Click shopping bag", "Check card totals"] },
    { title: "Select gift option wrap", micro: "Check the box marked 'This item is a gift' to hide invoice prices.", time: "<20 sec", easier: ["Check gift box", "Click gift option"] },
    { title: "Draft custom message card", micro: "Type a polite message like: 'Happy Birthday! Hope you love this. Best, [Name]'", time: "<45 sec", easier: ["Type 'Happy Birthday!'", "Type your name"] },
    { title: "Proceed to shipping details", micro: "Click the 'Proceed to Checkout' button to load the delivery forms.", time: "<20 sec", easier: ["Click Checkout button", "Wait for form load"] },
    { title: "Type recipient's delivery address", micro: "Fill in recipient's name, street address, and postal code.", time: "<45 sec", easier: ["Type recipient name", "Copy address street"] },
    { title: "Input your sender email", micro: "Enter your own contact email to receive tracking notifications.", time: "<20 sec", easier: ["Type your email", "Double check characters"] },
    { title: "Select standard shipping speed", micro: "Choose a delivery date that arrives comfortably before the deadline.", time: "<20 sec", easier: ["Select free shipping", "Check calendar dates"] },
    { title: "Select payment system", micro: "Choose Credit Card, Apple Pay, or PayPal options.", time: "<15 sec", easier: ["Click Apple Pay", "Click PayPal"] },
    { title: "Input payment visa details", micro: "Enter card numbers, expiration month, and CVV code securely.", time: "<45 sec", easier: ["Type credit card digits", "Check card back CVV"] },
    { title: "Click 'Place Order'", micro: "Click 'Place Order' or double-click to authorize card transfer.", time: "<15 sec", easier: ["Click Buy button", "Confirm purchase"] },
    { title: "Receive order confirmation email", micro: "Verify the success screen displays. You've officially secured the perfect gift!", time: "<20 sec", easier: ["Check for tick mark", "Wait for order email"] }
  ]
};

// Locked luxury styles and soft pastel borders/backgrounds for each category
const CATEGORY_STYLES = {
  cleaning: { border: "#FCA5A5", bg: "#FFF1F2", text: "#9F1239", iconBg: "rgba(252, 165, 165, 0.25)" },
  work: { border: "#5FA195", bg: "#F0FDF4", text: "#115E59", iconBg: "rgba(28, 94, 82, 0.15)" },
  study: { border: "#C084FC", bg: "#FAF5FF", text: "#6B21A8", iconBg: "rgba(192, 132, 252, 0.2)" },
  email: { border: "#93C5FD", bg: "#EFF6FF", text: "#1E40AF", iconBg: "rgba(147, 197, 253, 0.2)" },
  creative: { border: "#FDBA74", bg: "#FFF7ED", text: "#9A3412", iconBg: "rgba(253, 186, 116, 0.2)" },
  cooking: { border: "#FCD34D", bg: "#FEFBF0", text: "#92400E", iconBg: "rgba(252, 211, 77, 0.2)" },
  exercise: { border: "#86EFAC", bg: "#F0FDF4", text: "#166534", iconBg: "rgba(134, 239, 172, 0.2)" },
  errands: { border: "#C7D2FE", bg: "#EEF2FF", text: "#3730A3", iconBg: "rgba(199, 210, 254, 0.2)" }
};

const generateLadder = (category, taskKey, brainState, pathLength = "regular") => {
  let baseSteps = [];
  const capitalizedTaskName = taskKey.replace(/-/g, " ").replace(/\\b\\w/g, c => c.toUpperCase());
  
  // Custom or pre-defined task check
  if (category === "custom" || !TASK_STEPS[taskKey]) {
    // Generate custom/generic steps seamlessly using capitalizedTaskName
    baseSteps = [
      { title: `Acknowledge the intention for ${capitalizedTaskName}`, micro: "Take a deep breath and accept the space you are in.", time: "<15 sec", easier: ["Close your eyes and breathe", "Just sit comfortably"] },
      { title: `Prepare your immediate space for ${capitalizedTaskName}`, micro: "Clear any visual distraction within your arm's reach.", time: "<20 sec", easier: ["Move one small item", "Straighten chair"] },
      { title: `Locate your primary tool for ${capitalizedTaskName}`, micro: "Find the first device, tool, notebook, or item you will need.", time: "<15 sec", easier: ["Glance around for tool", "Think of main item"] },
      { title: `Position your primary tool for ${capitalizedTaskName}`, micro: "Place it comfortably right in front of you.", time: "<15 sec", easier: ["Set down main tool", "Look at tool placement"] },
      { title: `Eliminate digital noise for ${capitalizedTaskName}`, micro: "Minimize unrelated tabs or silence your phone notifications.", time: "<20 sec", easier: ["Mute phone sound", "Minimize one tab"] },
      { title: `Open the workspace or app for ${capitalizedTaskName}`, micro: "Launch the software, document, or walk to the physical location.", time: "<20 sec", easier: ["Click app to open", "Look toward work area"] },
      { title: `Set up a clean slate for ${capitalizedTaskName}`, micro: "Open a blank document, clean surface, or fresh area.", time: "<15 sec", easier: ["Press Cmd+N", "Look at clean space"] },
      { title: `Create a simple title or label for ${capitalizedTaskName}`, micro: "Write down the name of what you are doing to ground yourself.", time: "<15 sec", easier: ["Type first draft letter", "Scribble down one keyword"] },
      { title: `Draft your checklist for ${capitalizedTaskName}`, micro: "Write down just 1 or 2 small actions you want to do.", time: "<25 sec", easier: ["Write bullet point", "Think of first subtask"] },
      { title: `Review the first small checkpoint of ${capitalizedTaskName}`, micro: "Look at the very first action without doing it yet.", time: "<15 sec", easier: ["Glance at checklist", "Breathe out gently"] },
      { title: `Perform the first 1-minute action for ${capitalizedTaskName}`, micro: "Spend just 60 seconds on the easiest part.", time: "<60 sec", easier: ["Do first easiest movement", "Focus for 15 seconds"] },
      { title: `Acknowledge your progress on ${capitalizedTaskName}`, micro: "Take a brief pause and feel good about starting.", time: "<15 sec", easier: ["Smile once", "Take deep breath"] },
      { title: `Focus on the second micro-step of ${capitalizedTaskName}`, micro: "Execute the next small movement or detail.", time: "<30 sec", easier: ["Do next simple step", "Think of next action"] },
      { title: `Check your alignment on ${capitalizedTaskName}`, micro: "Ensure you are staying with the micro-task, keeping it simple.", time: "<20 sec", easier: ["Adjust sitting posture", "Verify current focus"] },
      { title: `Spend another 2 minutes on ${capitalizedTaskName}`, micro: "Keep a steady, relaxed pace. Do not rush.", time: "<120 sec", easier: ["Do 30 seconds of work", "Keep hands relaxed"] },
      { title: `Observe how the momentum is building for ${capitalizedTaskName}`, micro: "Notice that starting was the hardest part.", time: "<20 sec", easier: ["Breathe in deep", "Look at completed part"] },
      { title: `Perform one more quiet step for ${capitalizedTaskName}`, micro: "Add another tiny piece to your work.", time: "<45 sec", easier: ["Add small detail", "Write next line"] },
      { title: `Draft or outline the next phase for ${capitalizedTaskName}`, micro: "Scribble down your next thoughts or directions.", time: "<30 sec", easier: ["Jot down outline notes", "Think of future steps"] },
      { title: `Begin transitioning out of the start phase of ${capitalizedTaskName}`, micro: "Complete your current micro-action smoothly.", time: "<30 sec", easier: ["Finishing current stroke", "Rest your hands"] },
      { title: `Celebrate taking action on ${capitalizedTaskName}`, micro: "You have successfully broken the ice and built momentum!", time: "<15 sec", easier: ["Smile at progress", "Release tension"] }
    ];
  } else {
    // Retrieve the 20 pre-defined hand-crafted steps
    baseSteps = TASK_STEPS[taskKey];
  }

  // Calculate target total step count based on pathLength
  const totalTargetCount = pathLength === "speedy" ? 5 : pathLength === "regular" ? 10 : 20;

  let finalSteps = [];

  if (totalTargetCount === 20) {
    // If minimax (20 steps), use baseSteps directly!
    finalSteps = [...baseSteps];
  } else {
    // Otherwise, chunk and merge them dynamically so they are beautifully condensed
    const chunkSize = baseSteps.length / totalTargetCount; // 20 / 5 = 4, or 20 / 10 = 2
    for (let i = 0; i < totalTargetCount; i++) {
      const start = Math.floor(i * chunkSize);
      const end = Math.floor((i + 1) * chunkSize);
      const chunk = baseSteps.slice(start, end);
      
      if (chunk.length > 0) {
        if (chunk.length === 1) {
          finalSteps.push(chunk[0]);
        } else {
          // Merge chunk
          const firstStep = chunk[0];
          const lastStep = chunk[chunk.length - 1];
          
          // Encompassing title
          let title = firstStep.title;
          const lowerLast = lastStep.title.charAt(0).toLowerCase() + lastStep.title.slice(1);
          title = `${title} and ${lowerLast}`;
          
          // Build comprehensive micro text that lists all intermediate sub-steps
          const micro = chunk.map((step, idx) => `${idx + 1}. ${step.title}: ${step.micro}`).join("\n");
          
          // Sum up the time
          let totalSec = 0;
          chunk.forEach(step => {
            const match = step.time.match(/<(\d+)\s*sec/);
            if (match) {
              totalSec += parseInt(match[1], 10);
            } else {
              totalSec += 30;
            }
          });
          const time = totalSec < 60 ? `<${totalSec} sec` : `<${Math.ceil(totalSec / 60)} min`;
          
          // Take the easiest option of the first sub-step as the ice-breaker!
          const easier = firstStep.easier;
          
          finalSteps.push({ title, micro, time, easier });
        }
      }
    }
  }

  // Map step IDs dynamically
  return finalSteps.map((step, idx) => ({
    ...step,
    id: String(idx + 1).padStart(3, "0")
  }));
};

export default function NextEasiestStepExperience({ onComplete, onExit }) {
  // 3. Persistent state initialization from localStorage using 'mentication_nes_v2_app_state'
  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem("mentication_nes_v2_app_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) return { pathLength: "regular", ...parsed };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      screen: "landing",
      brainState: null,
      category: null,
      task: null,
      currentStepIndex: 0,
      dopamineLevel: 0,
      brainWarmingStage: 1,
      ladder: [],
      winsToday: 0,
      pathLength: "regular"
    };
  });

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [customTaskInput, setCustomTaskInput] = useState(() => consumeNextStepHandoff() ?? "");
  const [showPause, setShowPause] = useState(false);
  const [easierOptionsVisible, setEasierOptionsVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Synchronize state with localStorage
  useEffect(() => {
    localStorage.setItem("mentication_nes_v2_app_state", JSON.stringify(gameState));
  }, [gameState]);

  // Auto-unlock audio context on first click/touchstart to guarantee sound is ready
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Audio Context lazy-loader helper
  const getAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch (e) {
      console.warn("Error getting AudioContext:", e);
      return null;
    }
  };

  // Synthesized sound on Done tap (Beautiful Major Arpeggio chime with increased volume)
  const playSuccessChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      // Force resume just in case
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      
      const now = ctx.currentTime;
      const notes = [659.25, 783.99, 1046.50, 1318.51]; // E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq - 10, time + 0.6);
        gain.gain.setValueAtTime(0.18, time); // Increased volume from 0.035
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
        osc.start(time);
        osc.stop(time + 0.7);
      });
    } catch (e) {
      console.warn("Synthesized audio chime failed to play", e);
    }
  };

  // Louder, premium click sound
  const playClick = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Force resume just in case
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime); // Increased volume from 0.02
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch { /* audio unsupported */ }
  };

  // Haptic Vibration helper
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch (e) {
        console.warn("Haptics vibrate failed", e);
      }
    }
  };

  // Canvas confetti particle burst logic
  const triggerConfetti = () => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const colors = ["#E75A6D", "#D6DFAB", "#1C5E52"]; // coral, light sage, teal
    const particles = [];
    const particleCount = 80;

    canvasEl.width = canvasEl.offsetWidth;
    canvasEl.height = canvasEl.offsetHeight;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvasEl.width / 2 + (Math.random() - 0.5) * 40,
        y: canvasEl.height * 0.8,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 12 - 8,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        gravity: 0.3,
        resistance: 0.98
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      let active = false;

      particles.forEach((p) => {
        if (p.opacity <= 0) return;
        p.vx *= p.resistance;
        p.vy *= p.resistance;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012; // slow fadeout

        if (p.opacity > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          
          if (p.size % 2 === 0) {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (active) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      }
    };

    render();
  };

  // Navigations and flows
  const navigateTo = (screenName) => {
    playClick();
    setGameState(prev => ({ ...prev, screen: screenName }));
  };

  const handleSelectCategoryTask = (catKey, taskObj) => {
    playClick();
    const ladderSteps = generateLadder(catKey, taskObj.id, gameState.brainState, gameState.pathLength);
    setGameState(prev => ({
      ...prev,
      category: catKey,
      task: taskObj.name,
      currentStepIndex: 0,
      dopamineLevel: 0,
      brainWarmingStage: 1,
      ladder: ladderSteps,
      screen: "focus"
    }));
    setExpandedCategory(null);
    setSelectedSubcategory(null);
  };

  const handleCustomTaskGo = () => {
    if (!customTaskInput.trim()) return;
    playClick();
    const cleanInput = customTaskInput.trim();
    const taskSlug = cleanInput.toLowerCase().replace(/\s+/g, "-");
    const ladderSteps = generateLadder("work", taskSlug, gameState.brainState, gameState.pathLength);
    setGameState(prev => ({
      ...prev,
      category: "custom",
      task: cleanInput,
      currentStepIndex: 0,
      dopamineLevel: 0,
      brainWarmingStage: 1,
      ladder: ladderSteps,
      screen: "focus"
    }));
    setCustomTaskInput("");
  };

  const handleSurpriseMe = () => {
    playClick();
    const keys = Object.keys(CATEGORY_THEMES);
    const randCatKey = keys[Math.floor(Math.random() * keys.length)];
    const cat = CATEGORY_THEMES[randCatKey];
    const allTasks = cat.subcategories.flatMap(sub => sub.tasks);
    const randTask = allTasks[Math.floor(Math.random() * allTasks.length)];
    const ladderSteps = generateLadder(randCatKey, randTask.id, gameState.brainState, gameState.pathLength);
    
    setGameState(prev => ({
      ...prev,
      category: randCatKey,
      task: randTask.name,
      currentStepIndex: 0,
      dopamineLevel: 0,
      brainWarmingStage: 1,
      ladder: ladderSteps,
      screen: "focus"
    }));
  };

  // Mark step complete (dopamine burst + sounds + confetti + haptics)
  const handleCompleteStep = () => {
    playSuccessChime();
    triggerHaptic();
    triggerConfetti();

    setGameState(prev => {
      const nextIndex = prev.currentStepIndex + 1;
      const nextDopamine = Math.min(100, prev.dopamineLevel + 2);
      const nextWins = prev.winsToday + 1;
      
      // Brain warming stages: Stage 1 for 0-7, Stage 2 for 8-20, Stage 3 for 21+ completed steps
      let nextStage = 1;
      if (nextIndex >= 8 && nextIndex <= 20) {
        nextStage = 2;
      } else if (nextIndex > 20) {
        nextStage = 3;
      }

      const isCompleted = nextIndex >= prev.ladder.length;

      return {
        ...prev,
        currentStepIndex: isCompleted ? prev.currentStepIndex : nextIndex,
        dopamineLevel: nextDopamine,
        winsToday: nextWins,
        brainWarmingStage: nextStage,
        screen: isCompleted ? "dashboard" : "focus"
      };
    });

    setEasierOptionsVisible(false);
  };

  const handleResetDay = () => {
    playClick();
    setGameState({
      screen: "landing",
      brainState: null,
      category: null,
      task: null,
      currentStepIndex: 0,
      dopamineLevel: 0,
      brainWarmingStage: 1,
      ladder: [],
      winsToday: 0,
      pathLength: "regular"
    });
    setExpandedCategory(null);
    setCustomTaskInput("");
    setEasierOptionsVisible(false);
    setShowPause(false);
  };

  const currentStep = gameState.ladder[gameState.currentStepIndex];

  // Dynamically calculate brain warming progress
  let warmingProgressPct = 0;
  if (gameState.currentStepIndex < 8) {
    warmingProgressPct = (gameState.currentStepIndex / 7) * 100;
  } else if (gameState.currentStepIndex <= 20) {
    warmingProgressPct = ((gameState.currentStepIndex - 8) / 12) * 100;
  } else {
    warmingProgressPct = Math.min(100, ((gameState.currentStepIndex - 21) / 20) * 100);
  }

  return (
    <div 
      className="nes-v2-wrap"
      style={{
        background: gameState.screen === "focus" ? "var(--alternate-base)" : "var(--primary-base)",
        transition: "background 300ms cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {/* Shared Home button on every screen, and Back on the opening screen (inner screens keep their own step-back arrows). */}
      <InterventionNav back={gameState.screen === "landing"} home tone="dark" />
      {/* Scope-contained inject tokens and components styling for precision rendering */}
      <style dangerouslySetInnerHTML={{ __html: `
        .nes-v2-wrap {
          --primary-base: #E1E8C1;
          --primary-light: #E1E8C1;
          --primary-paper: #F7F2D8;
          --alternate-base: #5A2430;
          --alternate-dark: #4A1E28;
          --alternate-surface: #3D1E28;
          --text-burgundy: #5A2430;
          --text-light-sage: #D6DFAB;
          --text-muted: #8A5A66;
          --text-body: #3D2A2E;
          --accent-coral: #E75A6D;
          --accent-coral-light: #F28B98;
          --accent-teal: #1C5E52;
          --accent-teal-light: #6BB0A3;
          --card-white: #FFFFFF;
          --border-light: #E9DCC0;

          --radius-card: 24px;
          --radius-card-lg: 32px;
          --radius-pill: 44px;
          --shadow-card: 0 12px 24px rgba(90, 36, 48, 0.08);
          --shadow-card-hover: 0 18px 36px rgba(90, 36, 48, 0.12);
          --shadow-focus: 0 24px 48px rgba(0,0,0,0.20);
          --font-headline: 'Fraunces', 'Recoleta', Georgia, serif;
          --font-body: 'Inter', -apple-system, sans-serif;
          
          font-family: var(--font-body);
          color: var(--text-burgundy);
          min-height: 100vh;
          width: 100%;
          max-width: 390px;
          margin: 0 auto;
          position: relative;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        /* Authentic Organic Grain Overlay globally applied across all screens */
        .nes-v2-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          pointer-events: none;
          mix-blend-mode: multiply;
          opacity: 0.04;
          z-index: 10;
        }

        /* Premium Glossy Glass Reflection Overlay across the entire screen */
        .nes-v2-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            /* Subtle diagonal reflection light beam */
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.11) 0%, 
              rgba(255, 255, 255, 0.04) 22%, 
              rgba(255, 255, 255, 0) 40%, 
              rgba(255, 255, 255, 0) 65%, 
              rgba(255, 255, 255, 0.02) 80%, 
              rgba(255, 255, 255, 0.06) 100%
            ),
            /* Soft ambient glow from the top-left */
            radial-gradient(circle at 12% 10%, 
              rgba(255, 255, 255, 0.07) 0%, 
              rgba(255, 255, 255, 0) 55%
            ),
            /* Fine elegant inner bevel shadow representing glass edge refraction */
            inset 0 0 0 1.5px rgba(255, 255, 255, 0.15),
            inset 0 2px 4px rgba(255, 255, 255, 0.25),
            inset 0 -1.5px 3px rgba(0, 0, 0, 0.04);
          pointer-events: none;
          z-index: 11;
        }

        .nes-v2-wrap * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          position: relative;
          z-index: 2;
        }

        /* Spring Selected State Transitions on Cards */
        .nes-v2-wrap .card {
          background: var(--card-white);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 20px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(90,36,48,0.04);
        }

        .nes-v2-wrap .card:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-card-hover);
        }

        .nes-v2-wrap .card:active {
          transform: scale(0.99);
        }

        .nes-v2-wrap .card-success {
          background: var(--primary-light);
          border: 1px solid rgba(28,94,82,0.12);
        }

        .nes-v2-wrap .card-lg {
          border-radius: var(--radius-card-lg);
          box-shadow: var(--shadow-focus);
        }

        .nes-v2-wrap .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 56px;
          border-radius: var(--radius-pill);
          background: var(--alternate-base);
          color: var(--text-light-sage);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          width: 100%;
          letter-spacing: -0.01em;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nes-v2-wrap .btn-primary:active {
          transform: scale(0.96);
        }

        /* Premium CTA Button Animation (Fully rounded pill, matches PDF) */
        .nes-v2-wrap .btn-premium-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60px;
          background: var(--alternate-base);
          color: #FFFFFF;
          border-radius: 30px;
          width: 100%;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(90, 36, 48, 0.18);
          font-size: 17px;
          font-weight: 700;
          font-family: var(--font-body);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }

        .nes-v2-wrap .btn-premium-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(90, 36, 48, 0.24);
        }

        .nes-v2-wrap .btn-premium-cta:active {
          transform: scale(0.97);
          box-shadow: 0 6px 14px rgba(90, 36, 48, 0.15);
        }

        .nes-v2-wrap .btn-premium-cta .arrow {
          display: inline-block;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          margin-left: 8px;
          font-weight: bold;
        }

        .nes-v2-wrap .btn-premium-cta:hover .arrow {
          transform: translateX(4px);
        }

        .nes-v2-wrap .btn-shiny {
          position: relative;
          overflow: hidden !important;
          background: radial-gradient(circle at 35% 20%, #6E2634 0%, #3C1A23 55%, #220B11 100%) !important;
          box-shadow: 0 8px 24px rgba(60, 26, 35, 0.15), 
                      0 0 16px rgba(231, 90, 109, 0.35), 
                      inset 0 1.5px 0.5px rgba(255, 255, 255, 0.22), 
                      inset 0 -1.5px 1.5px rgba(0, 0, 0, 0.35) !important;
        }

        .nes-v2-wrap .btn-shiny::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 46%;
          background: linear-gradient(to bottom, 
            rgba(255, 255, 255, 0.08) 0%, 
            rgba(255, 255, 255, 0.03) 70%, 
            rgba(255, 255, 255, 0) 100%
          );
          pointer-events: none;
          z-index: 1;
          border-radius: 30px 30px 0 0;
        }

        .nes-v2-wrap .btn-primary-inverse {
          background: #D6DFAB !important;
          color: #5A2430 !important;
          height: 64px !important;
          border-radius: var(--radius-pill);
          font-weight: 800;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .nes-v2-wrap .btn-primary-inverse:active {
          transform: scale(0.97) !important;
        }

        .nes-v2-wrap .btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          border-radius: var(--radius-pill);
          background: transparent;
          border: 1.5px solid var(--text-burgundy);
          color: var(--text-burgundy);
          font-weight: 600;
          font-size: 15px;
          width: 100%;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nes-v2-wrap .btn-secondary:active {
          transform: scale(0.96);
        }

        .nes-v2-wrap .btn-secondary-ghost-light {
          border-color: rgba(214, 223, 171, 0.35);
          color: rgba(214, 223, 171, 0.7);
          background: rgba(255, 255, 255, 0.03);
        }
        
        .nes-v2-wrap .btn-secondary-ghost-light:hover {
          border-color: rgba(214, 223, 171, 0.6);
          color: rgba(214, 223, 171, 0.95);
        }

        .nes-v2-wrap .progress-track {
          height: 4px;
          background: var(--border-light);
          border-radius: 4px;
          overflow: hidden;
        }

        .nes-v2-wrap .progress-fill {
          height: 100%;
          background: var(--alternate-base);
          transition: width 0.4s ease;
        }

        .nes-v2-wrap .progress-track-light {
          background: rgba(214,223,171,0.15);
        }

        .nes-v2-wrap .progress-track-light .progress-fill {
          background: var(--primary-light);
        }

        .nes-v2-wrap .screen {
          width: 100%;
          min-height: 100vh;
          padding: 24px;
          display: flex;
          flex-direction: column;
          position: relative;
          background: transparent; /* Allows container-level background transitions */
        }

        /* Typography & Kerning Overhaul */
        .nes-v2-wrap .h1 {
          font-family: var(--font-headline);
          font-size: 32px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--text-burgundy);
        }

        .nes-v2-wrap .h2 {
          font-family: var(--font-headline);
          font-size: 28px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .nes-v2-wrap .subtitle {
          letter-spacing: -0.01em;
          line-height: 1.5;
        }

        .nes-v2-wrap .micro {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          color: var(--text-muted);
        }

        .nes-v2-wrap .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .nes-v2-wrap .list-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Progression Fade Gradient Mask */
        .nes-v2-wrap .ladder-container {
          position: relative;
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.4) 100%);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.4) 100%);
        }

        /* Perfect Viewport Vertical Centering Card Bezel & Scrollbar Styling */
        .nes-v2-wrap .focus-hardware-card {
          border: 1px solid rgba(90, 36, 48, 0.08) !important;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255,255,255,0.8), 0 0 0 1px rgba(90,36,48,0.04) !important;
        }
        
        .nes-v2-wrap .focus-hardware-card::-webkit-scrollbar {
          width: 4px;
        }
        
        .nes-v2-wrap .focus-hardware-card::-webkit-scrollbar-thumb {
          background: rgba(90, 36, 48, 0.15);
          border-radius: 4px;
        }

        /* Custom scrollbar for the new immersive subtasks modal list */
        .nes-v2-wrap .subtasks-scroll-container::-webkit-scrollbar {
          width: 5px;
        }
        
        .nes-v2-wrap .subtasks-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(228, 201, 115, 0.35);
          border-radius: 4px;
        }

        /* Organic Staggered Category Pill scale effect */
        .nes-v2-wrap .category-pill:hover {
          transform: scale(1.03) translateY(-1px);
          box-shadow: 0 6px 14px rgba(90, 36, 48, 0.08);
        }
        
        .nes-v2-wrap .category-pill:active {
          transform: scale(0.98);
        }

        /* Subtask button premium layout styling */
        .nes-v2-wrap .subtask-button:hover {
          transform: translateY(-2px) scale(1.01);
          background: #FFFFFF !important;
          box-shadow: 0 8px 20px rgba(90, 36, 48, 0.08) !important;
        }
        
        .nes-v2-wrap .subtask-button:active {
          transform: scale(0.98) !important;
        }

        /* Premium Emojis inside Custom Circular Badges */
        .nes-v2-wrap .emoji-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          font-size: 28px;
          line-height: 1;
          flex-shrink: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nes-v2-wrap .pause-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(90,36,48,0.32);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .nes-v2-wrap .pause-card {
          background: var(--card-white);
          border-radius: var(--radius-card-lg);
          padding: 32px 24px;
          max-width: 340px;
          width: 100%;
          box-shadow: var(--shadow-focus);
          text-align: center;
        }

        .nes-v2-wrap .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          pointer-events: none;
          mix-blend-mode: multiply;
          opacity: 0.04;
          z-index: 1;
        }

        .nes-v2-wrap .grain * {
          position: relative;
          z-index: 2;
        }

        /* Float upward sparkle elements for Dopamine tank */
        @keyframes floatUpSparkle {
          0% {
            transform: translateY(0) scale(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-15px) scale(1) rotate(45deg);
          }
          85% {
            opacity: 1;
            transform: translateY(-90px) scale(1) rotate(135deg);
          }
          100% {
            transform: translateY(-110px) translateX(var(--drift-x, 10px)) scale(0) rotate(180deg);
            opacity: 0;
          }
        }
        .nes-v2-wrap .sparkle-particle {
          position: absolute;
          bottom: 12px;
          pointer-events: none;
          animation-name: floatUpSparkle;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          z-index: 3;
        }

        /* Pulsing active badge ring on ladder screen cards */
        @keyframes ringPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(231, 90, 109, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(231, 90, 109, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(231, 90, 109, 0);
          }
        }
        .nes-v2-wrap .active-ring-pulse {
          animation: ringPulse 2s infinite;
        }

        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideUpFade {
          0% {
            opacity: 0;
            transform: translateY(15px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes playPulseGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(165, 243, 252, 0.4), inset 0 1px 1px rgba(255,255,255,0.25);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 22px rgba(165, 243, 252, 0.85), inset 0 1px 1px rgba(255,255,255,0.4);
            transform: scale(1.04);
          }
        }
        .nes-v2-wrap .play-pulse-glow {
          animation: playPulseGlow 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes torchSweep {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      ` }} />

      {/* ==================== 1. LANDING SCREEN ==================== */}
      {gameState.screen === "landing" && (
        <div className="screen grain" style={{ 
          display: "flex", 
          flexDirection: "column", 
          height: "100vh", 
          padding: "20px 20px 48px 20px", 
          position: "relative", 
          justifyContent: "space-between",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          
          {/* Beautiful Arched Curve Background */}
          <div style={{ position: "absolute", top: "40px", left: 0, right: 0, height: "260px", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 390 260" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M -10,240 C 60,110 330,110 400,240" stroke="#1C5E52" strokeWidth="1.5" strokeOpacity="0.14" fill="none" />
            </svg>
          </div>

          {/* Top Section Group to Stack Elements Correctly */}
          <div style={{ width: "100%", zIndex: 5, display: "flex", flexDirection: "column" }}>
            
            {/* Horizontal progress bar at the very top */}
            <div style={{ width: "100%", height: "5px", backgroundColor: "rgba(28, 94, 82, 0.12)", borderRadius: "3px", overflow: "hidden", position: "relative", marginBottom: "16px" }}>
              <div style={{ width: "35%", height: "100%", backgroundColor: "#1C5E52", borderRadius: "3px" }} />
            </div>

            {/* Centered ADHD Focus • Calm Badge */}
            <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "20px" }}>
              <div className="micro" style={{ 
                border: "1.5px solid #E4C973", 
                background: "radial-gradient(circle, #246351 0%, #163E32 100%)",
                display: "inline-block", 
                padding: "6px 14px", 
                borderRadius: "20px", 
                color: "#F7F2D8", 
                fontWeight: "800", 
                fontSize: "10.5px", 
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}>
                ADHD Focus • Calm
              </div>
            </div>

            {/* Hero Title Section */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "16px", marginBottom: "16px" }}>
              <h1 className="h1" style={{ fontSize: "40px", margin: "0", lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "800", fontFamily: "var(--font-headline)", color: "var(--text-burgundy)", textShadow: "0 1px 0px rgba(255, 255, 255, 0.45), 0 2px 10px rgba(90, 36, 48, 0.08)" }}>
                Next Easiest Step
              </h1>
              <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#1C5E52", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "8px", fontFamily: "var(--font-body)" }}>
                Mentication · Focus
              </span>
              
              {/* Elegant centered short Coral line bar */}
              <div style={{ width: "36px", height: "4px", backgroundColor: "var(--accent-coral)", borderRadius: "2px", margin: "14px auto 12px" }} />
              
              <p className="subtitle" style={{ color: "var(--text-burgundy)", opacity: 0.95, fontSize: "16.5px", fontWeight: "400", fontStyle: "italic", letterSpacing: "-0.01em", lineHeight: "1.4", padding: "0 4px", textAlign: "left", width: "100%", margin: "18px 0 4px" }}>
                When you can't start, <span style={{ fontWeight: "700" }}>start smaller.</span>
              </p>
            </div>

            {/* Premium Side-by-Side Maroon Squares */}
            <div style={{ display: "flex", flexDirection: "row", gap: "12px", width: "100%", marginBottom: "14px" }}>
              
              {/* Card 1: Start in 60 seconds */}
              <div 
                style={{
                  flex: 1,
                  height: "76px",
                  background: "#502F37",
                  borderRadius: "16px",
                  padding: "8px 6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  boxShadow: "0 6px 18px rgba(60, 26, 35, 0.08)",
                  border: "1.5px solid rgba(228, 201, 115, 0.65)"
                }}
              >
                {/* Outline Circle with Clock Icon */}
                <div style={{
                  width: "27px",
                  height: "27px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(247, 242, 216, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Clock size={12} color="#F7F2D8" strokeWidth={1.5} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "1px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#F7F2D8", letterSpacing: "-0.01em", lineHeight: "1.2" }}>Start in</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#F7F2D8", letterSpacing: "-0.01em", lineHeight: "1.2" }}>60 Seconds</span>
                </div>
              </div>

              {/* Card 2: Reduce Overwhelm */}
              <div 
                style={{
                  flex: 1,
                  height: "76px",
                  background: "#502F37",
                  borderRadius: "16px",
                  padding: "8px 6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  boxShadow: "0 6px 18px rgba(60, 26, 35, 0.08)",
                  border: "1.5px solid rgba(228, 201, 115, 0.65)"
                }}
              >
                {/* Outline Circle with Leaf Icon */}
                <div style={{
                  width: "27px",
                  height: "27px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(247, 242, 216, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F7F2D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 0 8.5C17 15 15 18 11 20z" />
                    <path d="M19 2c-2.26 4.33-5.27 7.14-8 11" />
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column", textAlign: "center", gap: "1px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#F7F2D8", letterSpacing: "-0.01em", lineHeight: "1.2" }}>Reduce</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#F7F2D8", letterSpacing: "-0.01em", lineHeight: "1.2" }}>Overwhelm</span>
                </div>
              </div>

            </div>

            {/* Primary Action Button ("I can't focus →") */}
            <div style={{ width: "100%", margin: "0 0 18px" }}>
              <button 
                className="btn-premium-cta btn-shiny" 
                onClick={() => {
                  playClick();
                  setGameState(prev => ({ ...prev, brainState: "frozen" }));
                  navigateTo("intent");
                }} 
                style={{
                  color: "#F7F2D8",
                  fontSize: "17.5px",
                  fontWeight: "700",
                  width: "100%",
                  height: "60px",
                  borderRadius: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  border: "2px solid #E4C973",
                  cursor: "pointer",
                  transition: "transform 0.15s, opacity 0.15s"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                I can't focus 
                <span className="arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#DBE4AF" stroke="#DBE4AF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "-2px", filter: "drop-shadow(0 0 2px rgba(219, 228, 175, 0.95)) drop-shadow(0 0 6px rgba(219, 228, 175, 0.55))" }}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Footer & Ladder Card Section (Matching Mockup Exactly) */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", zIndex: 5 }}>
            {/* Elegant Footer Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%", padding: "0 4px", marginBottom: "12px" }}>
              <div style={{ fontSize: "30px", fontWeight: "700", fontFamily: "var(--font-headline)", color: "#1E4D41", letterSpacing: "-0.03em", lineHeight: "1" }}>
                Ladder
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
                <span style={{ fontSize: "9px", fontWeight: "800", color: "#1E4D41", opacity: 0.7, letterSpacing: "0.06em", lineHeight: "1.2" }}>3 STEPS TO THE SUMMIT</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#1E4D41", opacity: 0.9, marginTop: "2px", lineHeight: "1.2" }}>1 of 3 completed</span>
              </div>
            </div>

            {/* Premium Completed Green Step Card with entire Ladder flow inside */}
            <div 
              style={{
                background: "radial-gradient(circle at 35% 20%, #2E7562 0%, #1E4D41 55%, #102F26 100%)",
                borderRadius: "24px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 10px 30px rgba(15, 45, 37, 0.25), inset 0 2px 6px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(255,255,255,0.06)",
                border: "2px solid #E4C973",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {/* STEP 1: Foundation Completed */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%" }}>
                {/* Outer Golden/Cream Circle with checkmark */}
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1.5px solid #F7F2D8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F7F2D8",
                  backgroundColor: "rgba(247, 242, 216, 0.06)",
                  boxShadow: "0 0 10px rgba(247, 242, 216, 0.2)",
                  flexShrink: 0
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                {/* Content text side */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1 }}>
                  <div style={{
                    border: "1px solid rgba(247, 242, 216, 0.25)",
                    background: "rgba(247, 242, 216, 0.08)",
                    borderRadius: "8px",
                    padding: "1px 5px",
                    fontSize: "8px",
                    fontWeight: "700",
                    color: "#F7F2D8",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase"
                  }}>
                    Completed
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: "700", fontFamily: "var(--font-headline)", color: "#F7F2D8", letterSpacing: "-0.01em", marginTop: "2px" }}>
                    Foundation Completed
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: "400", color: "rgba(247, 242, 216, 0.72)", letterSpacing: "-0.01em" }}>
                    You started. That counts.
                  </span>
                </div>
              </div>

              {/* Connecting Line 1 */}
              <div style={{ display: "flex", alignItems: "center", height: "12px", paddingLeft: "17px" }}>
                <div style={{ width: "2px", height: "100%", backgroundColor: "rgba(247, 242, 216, 0.35)" }} />
              </div>

              {/* STEP 2: Active Step */}
              <div 
                onClick={() => navigateTo("brain-check")}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "14px", 
                  width: "100%",
                  cursor: "pointer"
                }}
              >
                {/* Active pulse outer circle */}
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1.5px solid var(--accent-coral)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(235, 140, 114, 0.08)",
                  boxShadow: "0 0 12px rgba(235, 140, 114, 0.3)",
                  flexShrink: 0
                }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--accent-coral)" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1 }}>
                  <div style={{
                    border: "1px solid var(--accent-coral)",
                    background: "rgba(235, 140, 114, 0.15)",
                    borderRadius: "8px",
                    padding: "1px 5px",
                    fontSize: "8px",
                    fontWeight: "800",
                    color: "var(--accent-coral)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase"
                  }}>
                    Active Step
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: "700", fontFamily: "var(--font-headline)", color: "#F7F2D8", letterSpacing: "-0.01em", marginTop: "2px" }}>
                    Tidy Your Workspace
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: "400", color: "rgba(247, 242, 216, 0.72)", letterSpacing: "-0.01em" }}>
                    Gently arrange items on your desk.
                  </span>
                </div>
                
                <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--accent-coral)", opacity: 0.9 }}>
                  2 min
                </span>
              </div>

              {/* Connecting Line 2 */}
              <div style={{ display: "flex", alignItems: "center", height: "12px", paddingLeft: "17px" }}>
                <div style={{ width: "2px", height: "100%", backgroundColor: "rgba(247, 242, 216, 0.15)" }} />
              </div>

              {/* STEP 3: Pending Step */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%" }}>
                {/* Hollow pending circle */}
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(247, 242, 216, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }} />

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1 }}>
                  <span style={{ fontSize: "15px", fontWeight: "600", color: "rgba(247, 242, 216, 0.55)", letterSpacing: "-0.01em" }}>
                    Open First Task File
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: "400", color: "rgba(247, 242, 216, 0.4)", letterSpacing: "-0.01em" }}>
                    Locate the file and click open.
                  </span>
                </div>

                <span style={{ fontSize: "11.5px", fontWeight: "500", color: "rgba(247, 242, 216, 0.4)" }}>
                  1 min
                </span>
              </div>

            </div>

            {/* Subtle suggestive bottom bar */}
            <div style={{
              width: "100%",
              height: "6px",
              background: "#3C1A23",
              borderRadius: "6px 6px 0 0",
              opacity: 0.1,
              marginTop: "12px"
            }} />
          </div>

        </div>
      )}

      {/* ==================== 3. INTENT SCREEN ==================== */}
      {gameState.screen === "intent" && (
        <div className="screen grain" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative", padding: "14px 16px" }}>
          
          {/* Beautiful Curved Framing Arch */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "260px", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 390 260" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M -10,240 C 60,110 330,110 400,240" stroke="#1C5E52" strokeWidth="1.5" strokeOpacity="0.22" fill="none" />
            </svg>
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", width: "100%", zIndex: 5 }}>
            <button 
              onClick={() => navigateTo("landing")} 
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-burgundy)", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
            >
              <ChevronLeft size={24} />
            </button>
            <p className="micro" style={{ margin: 0, fontWeight: "700" }}>STEP 1 OF 2</p>
            <div style={{ width: "24px" }} />
          </div>

          {/* Title & Underline */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", marginTop: "12px", width: "100%", paddingLeft: "4px", zIndex: 5 }}>
            <h1 className="h1" style={{ fontSize: "22px", margin: "0", lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "800" }}>
              What are you trying to do?
            </h1>
            
            <div style={{ width: "40px", height: "3.5px", backgroundColor: "var(--accent-coral)", borderRadius: "2px", margin: "8px 0 12px" }} />
          </div>

          {/* Premium iOS-style Segmented control for Path Length */}
          <div style={{ 
            marginTop: "8px", 
            background: "rgba(90, 36, 48, 0.05)", 
            padding: "4px", 
            borderRadius: "16px", 
            display: "flex", 
            alignItems: "center",
            border: "1px solid rgba(90, 36, 48, 0.04)",
            zIndex: 5
          }}>
            <button
              onClick={() => {
                playClick();
                setGameState(prev => ({ ...prev, pathLength: "speedy" }));
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "12px",
                border: "none",
                background: gameState.pathLength === "speedy" ? "#F3DFE2" : "transparent",
                color: "var(--text-burgundy)",
                fontSize: "12.5px",
                fontWeight: gameState.pathLength === "speedy" ? "800" : "600",
                cursor: "pointer",
                boxShadow: gameState.pathLength === "speedy" ? "0 4px 10px rgba(90,36,48,0.12), inset 0 1px 1px rgba(255,255,255,0.9)" : "none",
                transition: "all 0.2s"
              }}
            >
              ⚡ Speedy (5)
            </button>
            <button
              onClick={() => {
                playClick();
                setGameState(prev => ({ ...prev, pathLength: "regular" }));
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "12px",
                border: "none",
                background: gameState.pathLength === "regular" ? "#F3DFE2" : "transparent",
                color: "var(--text-burgundy)",
                fontSize: "12.5px",
                fontWeight: gameState.pathLength === "regular" ? "800" : "600",
                cursor: "pointer",
                boxShadow: gameState.pathLength === "regular" ? "0 4px 10px rgba(90,36,48,0.12), inset 0 1px 1px rgba(255,255,255,0.9)" : "none",
                transition: "all 0.2s"
              }}
            >
              ✨ Regular (10)
            </button>
            <button
              onClick={() => {
                playClick();
                setGameState(prev => ({ ...prev, pathLength: "mini" }));
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "12px",
                border: "none",
                background: gameState.pathLength === "mini" ? "#F3DFE2" : "transparent",
                color: "var(--text-burgundy)",
                fontSize: "12.5px",
                fontWeight: gameState.pathLength === "mini" ? "800" : "600",
                cursor: "pointer",
                boxShadow: gameState.pathLength === "mini" ? "0 4px 10px rgba(90,36,48,0.12), inset 0 1px 1px rgba(255,255,255,0.9)" : "none",
                transition: "all 0.2s"
              }}
            >
              🎯 Mini (20 max)
            </button>
          </div>

          {/* Image 1 Premium Grid Style */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginTop: "12px",
            width: "100%",
            padding: "0 2px",
            zIndex: 5
          }}>
            {Object.entries(CATEGORY_THEMES).map(([catKey, cat]) => {
              const isExpanded = expandedCategory === catKey;
              const IconComponent = CATEGORY_ICONS[catKey] || Sparkles;
              
              const catSubtitles = {
                cleaning: "Tidy & reset space",
                work: "Focus & produce",
                study: "Learn & remember",
                email: "Inbox & tasks",
                creative: "Draft & create",
                cooking: "Prep food & snacks",
                exercise: "Stretch & move",
                errands: "Outdoor & quick tasks"
              };
              const subtitle = catSubtitles[catKey] || "Quick micro-tasks";

              return (
                <button
                  key={catKey}
                  onClick={() => {
                    playClick();
                    if (isExpanded) {
                      setExpandedCategory(null);
                      setSelectedSubcategory(null);
                    } else {
                      setExpandedCategory(catKey);
                      setSelectedSubcategory(null);
                    }
                  }}
                  style={{
                    background: "var(--alternate-base)", // Deep Burgundy matching Image 2
                    borderRadius: "16px",
                    padding: "10px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    cursor: "pointer",
                    border: isExpanded ? "2px solid #E4C973" : "1px solid rgba(228, 201, 115, 0.08)",
                    outline: "none",
                    boxShadow: isExpanded
                      ? "0 8px 24px rgba(228, 201, 115, 0.25), 0 0 12px rgba(228, 201, 115, 0.15)"
                      : "0 6px 16px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.06)",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    width: "100%",
                    minHeight: "92px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.borderColor = "rgba(228, 201, 115, 0.4)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.18), 0 0 8px rgba(228, 201, 115, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.borderColor = isExpanded ? "#E4C973" : "rgba(228, 201, 115, 0.08)";
                    e.currentTarget.style.boxShadow = isExpanded
                      ? "0 8px 24px rgba(228, 201, 115, 0.25), 0 0 12px rgba(228, 201, 115, 0.15)"
                      : "0 6px 16px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.06)";
                  }}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "4px",
                    color: "#E4C973", // Glowing Satin Gold icon
                    filter: "drop-shadow(0 0 4px rgba(228, 201, 115, 0.4))"
                  }}>
                    <IconComponent size={24} strokeWidth={1.5} />
                  </div>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: "800",
                    color: "#FAF6E3", // Ivory-Gold title
                    fontFamily: "var(--font-headline)",
                    letterSpacing: "-0.01em",
                    marginBottom: "2px"
                  }}>
                    {cat.name}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "500",
                    color: "rgba(214, 223, 171, 0.7)", // Muted light-sage-cream description
                    lineHeight: "1.25"
                  }}>
                    {subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Immersive 3D Modal Pop-up in the Foreground */}
          {expandedCategory && (
            <div 
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                background: "rgba(45, 18, 24, 0.45)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px"
              }}
              onClick={() => { setExpandedCategory(null); setSelectedSubcategory(null); }} // Dismiss when tapping backdrop
            >
              <div 
                className="card"
                style={{
                  background: "#502F37",
                  borderRadius: "32px",
                  border: "2px solid #E4C973",
                  boxShadow: "0 24px 64px rgba(0, 0, 0, 0.45)",
                  padding: "24px 20px",
                  width: "100%",
                  maxWidth: "350px",
                  maxHeight: "85vh",
                  display: "flex",
                  flexDirection: "column",
                  animation: "popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                  zIndex: 101
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                {/* Header Row with Close Button */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className="micro" style={{ color: "#E4C973", fontWeight: "800", fontSize: "11px", letterSpacing: "0.08em" }}>
                      ⚡ CHOOSE YOUR TINY START
                    </span>
                    <span style={{ fontSize: "18px", fontWeight: "800", color: "#F7F2D8", display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                      <span>{CATEGORY_THEMES[expandedCategory].icon}</span>
                      <span>{CATEGORY_THEMES[expandedCategory].name}</span>
                    </span>
                  </div>
                  
                  {/* Close 'X' Button */}
                  <button 
                    onClick={() => { setExpandedCategory(null); setSelectedSubcategory(null); }}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(247, 242, 216, 0.15)",
                      borderRadius: "50%",
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#F7F2D8",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
                
                {selectedSubcategory === null ? (
                  /* 4 Subcategories 2x2 Grid */
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                    width: "100%",
                  }}>
                    {CATEGORY_THEMES[expandedCategory].subcategories.map((sub, idx) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          playClick();
                          setSelectedSubcategory(sub.id);
                        }}
                        style={{
                          height: "94px",
                          borderRadius: "20px",
                          background: idx % 2 === 0
                            ? "linear-gradient(to bottom, #fcf1f2 0%, #fae6e8 100%)" // Light Burgundy
                            : "linear-gradient(to bottom, #fdfbe8 0%, #faf5ce 100%)", // Light Yellow
                          border: "1px solid rgba(90, 36, 48, 0.06)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: "0 4px 12px rgba(90, 36, 48, 0.04)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                          e.currentTarget.style.boxShadow = "0 8px 18px rgba(90, 36, 48, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(90, 36, 48, 0.04)";
                        }}
                      >
                        <span style={{ fontSize: "26px", lineHeight: "1" }}>{sub.icon}</span>
                        <span style={{ fontSize: "12.5px", fontWeight: "800", color: "var(--text-burgundy)", textAlign: "center", padding: "0 4px", lineHeight: "1.2" }}>
                          {sub.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* List of Sub-tasks in selected Subcategory */
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", flex: 1, minHeight: 0 }}>
                    {/* Back header button */}
                    <button
                      onClick={() => {
                        playClick();
                        setSelectedSubcategory(null);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#E4C973",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "0 0 8px 0",
                        fontSize: "13px",
                        fontWeight: "700",
                        alignSelf: "flex-start",
                        width: "100%"
                      }}
                    >
                      <ChevronLeft size={16} strokeWidth={2.5} />
                      <span>Back to subcategories</span>
                    </button>

                    <div 
                      className="subtasks-scroll-container"
                      style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "10px", 
                        overflowY: "auto",
                        paddingRight: "4px",
                        flex: 1
                      }}
                    >
                      {CATEGORY_THEMES[expandedCategory].subcategories
                        .find(s => s.id === selectedSubcategory)
                        ?.tasks.map((taskObj, idx) => {
                          const catStyle = CATEGORY_STYLES[expandedCategory] || { border: "var(--accent-coral)" };
                          const isEven = idx % 2 === 0;
                          return (
                            <button
                              key={taskObj.id}
                              onClick={() => handleSelectCategoryTask(expandedCategory, taskObj)}
                              className="subtask-button"
                              style={{ 
                                borderRadius: "16px",
                                background: isEven ? "#fcf1f2" : "#fdfbe8", // alternating burgundy/yellow shading
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "space-between",
                                width: "100%", 
                                padding: "14px 18px", 
                                cursor: "pointer", 
                                border: "1px solid rgba(90,36,48,0.06)",
                                borderLeft: `5px solid ${catStyle.border}`,
                                boxShadow: "0 4px 12px rgba(90, 36, 48, 0.04)",
                                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                flexShrink: 0
                              }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "800", color: "var(--text-burgundy)", fontSize: "14px", textAlign: "left" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: catStyle.border, flexShrink: 0 }} />
                                <span>{taskObj.name}</span>
                              </span>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-teal)", background: "#FFFFFF", padding: "4px 8px", borderRadius: "12px", border: "1.5px solid var(--accent-teal)", flexShrink: 0 }}>
                                {taskObj.duration}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom controls */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px", width: "100%", zIndex: 5, paddingTop: "24px" }}>
            
            {/* Free-type input box */}
            <div 
              className="card" 
              style={{ 
                display: "flex", 
                gap: "12px", 
                alignItems: "center", 
                padding: "0 16px",
                height: "52px",
                borderRadius: "26px",
                background: "#FFFFFF",
                border: inputFocused ? `2px solid var(--accent-teal)` : "1.5px solid rgba(90, 36, 48, 0.08)",
                boxShadow: "0 8px 20px rgba(90, 36, 48, 0.03)",
                transition: "all 0.2s"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <input 
                placeholder="Or just type what you are stuck on..." 
                value={customTaskInput}
                onChange={(e) => setCustomTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomTaskGo()}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                style={{ border: "none", width: "100%", fontSize: "14px", outline: "none", background: "transparent", color: "var(--text-burgundy)", fontWeight: "600" }}
              />
              {customTaskInput.trim() && (
                <button 
                  onClick={handleCustomTaskGo}
                  style={{ background: "none", border: "none", color: "var(--accent-teal)", fontWeight: "800", cursor: "pointer", fontSize: "14px" }}
                >
                  Go
                </button>
              )}
            </div>

            {/* Surprise Me CTA Card */}
            <button 
              onClick={handleSurpriseMe}
              className="btn-secondary" 
              style={{ 
                height: "50px", 
                borderRadius: "25px",
                border: "1.5px solid var(--text-burgundy)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                cursor: "pointer",
                gap: "10px",
                fontWeight: "700"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-coral)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 3v1M12 20v1M20 12h1M4 12H3m14.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707" />
              </svg>
              <span>Surprise me — Pick for me</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== 4. FOCUS SCREEN (Refined spacing, centering, and sizing) ==================== */}
      {gameState.screen === "focus" && (
        <div className="screen" style={{ background: "transparent", color: PRIMARY_LIGHT, display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative", padding: "24px 20px" }}>
          
          {/* Confetti canvas overlay container */}
          <canvas 
            ref={canvasRef} 
            style={{ 
              position: "absolute", 
              inset: 0, 
              width: "100%", 
              height: "100%", 
              pointerEvents: "none", 
              zIndex: 30 
            }} 
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", position: "relative", zIndex: 5 }}>
            {/* Left Back Arrow - Goes back to Intent */}
            <button 
              onClick={() => navigateTo("intent")} 
              style={{ background: "none", border: "none", color: "#D6DFAB", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center", minHeight: "48px" }}
            >
              <ChevronLeft size={24} />
            </button>
            
            {/* Center Alternate Logo (Authentic Green Coaster Logo) */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                backgroundColor: "#D5E0A3",
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: "3px",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)"
              }}>
                <img 
                  src="/media/brand/mentation-green-pink-transparent.png" 
                  alt="Mentication Logo" 
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                />
              </div>
              <span style={{ fontFamily: "var(--font-headline)", fontSize: "18px", fontWeight: "700", color: "#D6DFAB", letterSpacing: "-0.01em" }}>MentiCation</span>
            </div>
            
            {/* Right Pause Button */}
            <button 
              onClick={() => setShowPause(true)}
              style={{ 
                background: "rgba(214,223,171,0.2)", 
                border: "none", 
                width: "36px", 
                height: "36px", 
                borderRadius: "50%", 
                color: "#D6DFAB", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                transition: "background 0.2s",
                minHeight: "36px"
              }}
            >
              <Pause size={16} fill="#D6DFAB" stroke="#D6DFAB" />
            </button>
          </div>

          {/* Schematic Horizontal Ladder Progress Bar */}
          <div style={{
            position: "relative",
            width: "100%",
            margin: "56px 0 24px", // Moved down to balance screen layout perfectly below header
            padding: "0 8px",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "24px" // Fixed height for perfect vertical centering
          }}>
            {/* The bold, thicker horizontal line */}
            <div style={{
              position: "absolute",
              top: "calc(50% - 2px)", // mathematically centered
              left: "14px",
              right: "14px",
              height: "4px", // bold & thicker
              background: "rgba(214, 223, 171, 0.35)", // slightly more visible
              borderRadius: "2px",
              zIndex: 1
            }} />
            
            {/* The steps circles */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center", // Align centers of circles exactly on the line
              width: "100%",
              position: "relative",
              zIndex: 2
            }}>
              {gameState.ladder.map((step, idx) => {
                const isCompleted = idx < gameState.currentStepIndex;
                const isCurrent = idx === gameState.currentStepIndex;
                const size = isCurrent ? 18 : 14; // bigger circles
                return (
                  <div
                    key={step.id || idx}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      borderRadius: "50%",
                      border: `2px solid ${isCurrent ? "var(--accent-coral)" : "#D6DFAB"}`, // beautiful outlines
                      background: isCompleted ? "#D6DFAB" : "var(--alternate-base)", // filled vs hollow
                      boxShadow: isCurrent ? "0 0 8px var(--accent-coral)" : "none",
                      transition: "all 0.3s ease",
                      transform: isCurrent ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Central Focus Card (Upgraded to match Image 2's Premium Light Sage Bezel - Locked at 350px tall to prevent overlap and fit text) */}
          <div className="card focus-hardware-card" style={{ 
            margin: "12px 0 16px", 
            background: "#D6DFAB", // Gorgeous Light Sage Bezel exactly matching Image 2
            borderRadius: "24px", 
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255,255,255,0.4)", 
            padding: "24px 20px", 
            textAlign: "left", // Left aligned exactly matching Image 2
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "flex-start",
            gap: "12px",
            border: "none",
            width: "100%",
            height: "350px", // Good amount taller as requested
            minHeight: "350px",
            maxHeight: "350px",
            flexShrink: 0, // Prevent squash/overlap on smaller screens
            overflowY: "auto",
            position: "relative",
            zIndex: 5,
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            {/* Row 1: Green checkmark badge + "Current Step" heading */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "#1C5E52", // Dark green circular badge matching Image 2
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                flexShrink: 0
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span style={{ color: "var(--text-burgundy)", fontWeight: "800", letterSpacing: "0.08em", fontSize: "13.5px" }}>
                Current Step
              </span>
            </div>
            
            {/* Row 2: Serif font (Georgia / Fraunces) description */}
            <h2 style={{ 
              fontFamily: "var(--font-headline)", 
              fontSize: "24px", // Big and gorgeous
              fontWeight: "700", 
              color: "var(--text-burgundy)", 
              margin: 0,
              lineHeight: "1.2",
              letterSpacing: "-0.02em"
            }}>
              {currentStep ? currentStep.title : "Ready to focus"}
            </h2>
            
            {/* Row 3: Sub-heading / step counts */}
            <p className="subtitle" style={{ 
              color: "var(--text-burgundy)", 
              fontSize: "13.5px", 
              margin: 0, 
              lineHeight: "1.4",
              letterSpacing: "-0.01em",
              opacity: 0.85,
              fontWeight: "600",
              whiteSpace: "pre-line"
            }}>
              Step {gameState.currentStepIndex + 1} of {gameState.ladder.length} • {currentStep ? currentStep.micro : "No pressure. Take a breath."}
            </p>
          </div>

          {/* Statistics row with enhanced size & prominence (Perfect Visual Balance) */}
          <div style={{ display: "flex", gap: "28px", marginBottom: "28px", marginTop: "28px", alignItems: "center", padding: "0 10px", zIndex: 5, flexShrink: 0 }}>
            {/* Dopamine Tank (Skeuomorphic gold-liquid capsule matching Image 1) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              <span style={{ 
                color: "#FAF6E3", 
                fontSize: "13px", 
                fontWeight: "700", 
                letterSpacing: "-0.01em",
                marginBottom: "12px",
                fontFamily: "var(--font-body)",
                textTransform: "capitalize"
              }}>
                Dopamine Tank — {gameState.dopamineLevel}%
              </span>
              
              <div style={{ 
                width: "56px", // Perfect proportion of capsule
                height: "150px", 
                borderRadius: "28px", 
                background: "#183220", // Deep dark green translucent background
                position: "relative", 
                overflow: "visible",
                border: "4.5px solid #3E6E45", // Solid forest green outline from Image 1
                boxShadow: "0 0 20px rgba(255, 215, 0, 0.4), 0 10px 28px rgba(0, 0, 0, 0.3)",
                transition: "all 0.3s ease"
              }}>
                {/* Vertical capsule liquid fill */}
                <div style={{ 
                  position: "absolute", 
                  bottom: "3px", 
                  left: "3px", 
                  right: "3px", 
                  height: `calc(${gameState.dopamineLevel}% - 6px)`, 
                  background: "linear-gradient(to top, #DE9E36 0%, #F3D277 60%, #FFEFA6 100%)", // Rich gold gradient from Image 1
                  borderRadius: "24px",
                  transition: "height 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  overflow: "hidden"
                }}>
                  {/* Subtle glossy reflection overlay inside the liquid fill */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "100%",
                    background: "linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%)",
                    pointerEvents: "none"
                  }} />
                </div>

                {/* Floating gold sparkle particles drifting from the top of the fill */}
                {[...Array(8)].map((_, i) => {
                  const delay = i * 0.35;
                  const leftOffset = 6 + (i * 6) % 36;
                  const size = 3 + (i % 3) * 2;
                  const driftX = (i % 2 === 0 ? 10 : -10) + (i % 3) * 3;
                  return (
                    <div
                      key={i}
                      className="sparkle-particle"
                      style={{
                        left: `${leftOffset}px`,
                        width: `${size + 8}px`,
                        height: `${size + 8}px`,
                        background: "transparent",
                        boxShadow: "none",
                        color: "#FFEFA6",
                        fontSize: `${size + 6}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animationDelay: `${delay}s`,
                        animationDuration: `${1.8 + (i % 2) * 0.4}s`,
                        "--drift-x": `${driftX}px`,
                        textShadow: "0 0 4px #F3D277, 0 0 8px #FFEFA6",
                        zIndex: 3
                      }}
                    >
                      ✦
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Brain Warming Stage */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <p className="micro" style={{ margin: 0, color: "#D6DFAB", fontSize: "10px", fontWeight: "800", letterSpacing: "0.1em" }}>BRAIN WARMING STATUS</p>
              <p style={{ fontSize: "22px", fontWeight: "900", margin: 0, color: "#D6DFAB", fontFamily: "var(--font-headline)" }}>
                Stage {gameState.brainWarmingStage} of 3
              </p>
              <div className="progress-track progress-track-light" style={{ width: "100%", height: "10px", borderRadius: "5px" }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${warmingProgressPct}%`,
                    background: "var(--primary-light)",
                    borderRadius: "5px"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons with correct heights (Upgraded to Image 2 side-by-side pills) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", zIndex: 5, paddingBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "12px", width: "100%" }}>
              <button 
                className="btn-primary btn-primary-inverse"
                style={{ 
                  height: "56px", 
                  fontSize: "16px", 
                  fontWeight: "700", 
                  borderRadius: "28px", 
                  border: "none", 
                  background: "#D6DFAB", 
                  color: "var(--text-burgundy)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
                  cursor: "pointer"
                }}
                onClick={() => setShowPause(true)}
              >
                Pause
              </button>
              
              <button 
                className="btn-primary btn-primary-inverse"
                style={{ 
                  height: "56px", 
                  fontSize: "16px", 
                  fontWeight: "800", 
                  borderRadius: "28px", 
                  border: "none", 
                  background: "#D6DFAB", 
                  color: "var(--text-burgundy)",
                  boxShadow: "0 10px 24px rgba(214, 223, 171, 0.25)",
                  cursor: "pointer"
                }}
                onClick={handleCompleteStep}
              >
                Done ✓
              </button>
            </div>
            
            <button 
              className="btn-secondary btn-secondary-ghost-light"
              style={{ minHeight: "48px", borderRadius: "24px", border: "1.5px solid rgba(214,223,171,0.3)", color: "#D6DFAB" }}
              onClick={() => {
                playClick();
                setEasierOptionsVisible(!easierOptionsVisible);
              }}
            >
              Too hard? Make it easier
            </button>

            {easierOptionsVisible && currentStep && currentStep.easier && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                {currentStep.easier.map((easyTitle, idx) => (
                  <button
                    key={idx}
                    onClick={handleCompleteStep}
                    className="card"
                    style={{ 
                      textAlign: "left", 
                      width: "100%", 
                      padding: "14px 18px", 
                      cursor: "pointer",
                      background: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1.5px solid rgba(90, 36, 48, 0.08)",
                      boxShadow: "0 4px 12px rgba(90, 36, 48, 0.03)"
                    }}
                  >
                    <span className="micro" style={{ color: ACCENT_CORAL, fontSize: "9px", fontWeight: "800" }}>EASIER MICRO-OPTION</span>
                    <div style={{ fontWeight: "800", fontSize: "14px", color: "var(--text-burgundy)", marginTop: "4px" }}>
                      {easyTitle} • <span style={{ opacity: 0.6, fontWeight: "normal" }}>&lt;15 sec</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 6. MOMENTUM DASHBOARD ==================== */}
      {gameState.screen === "dashboard" && (
        <div className="screen grain" style={{ 
          display: "flex", 
          flexDirection: "column", 
          minHeight: "100vh", 
          position: "relative", 
          padding: "16px 20px 24px 20px",
          background: "#123563" // Deep blue that is slightly dark but nowhere near as dark as before
        }}>
          
          {/* Beautiful Curved Framing Arch in Light Blue */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "260px", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 390 260" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M -10,240 C 60,110 330,110 400,240" stroke="#a5f3fc" strokeWidth="1.5" strokeOpacity="0.25" fill="none" />
            </svg>
          </div>

          {/* Random Gold Confetti Spray across open spaces of the screen */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, overflow: "hidden" }}>
            <span style={{ position: "absolute", top: "12%", left: "15%", color: "#FFD700", opacity: 0.35, fontSize: "14px", textShadow: "0 0 5px #FFD700" }}>✦</span>
            <span style={{ position: "absolute", top: "8%", right: "12%", color: "#FFD700", opacity: 0.3, fontSize: "12px", textShadow: "0 0 4px #FFD700" }}>✧</span>
            <span style={{ position: "absolute", top: "32%", left: "8%", color: "#FFD700", opacity: 0.25, fontSize: "10px" }}>✦</span>
            <span style={{ position: "absolute", top: "28%", right: "22%", color: "#FFD700", opacity: 0.3, fontSize: "16px", textShadow: "0 0 6px #FFD700" }}>✧</span>
            <span style={{ position: "absolute", top: "55%", left: "12%", color: "#FFD700", opacity: 0.2, fontSize: "13px" }}>✦</span>
            <span style={{ position: "absolute", top: "48%", right: "6%", color: "#FFD700", opacity: 0.25, fontSize: "11px", textShadow: "0 0 4px #FFD700" }}>✧</span>
            <span style={{ position: "absolute", bottom: "35%", left: "22%", color: "#FFD700", opacity: 0.3, fontSize: "15px", textShadow: "0 0 5px #FFD700" }}>✦</span>
            <span style={{ position: "absolute", bottom: "40%", right: "18%", color: "#FFD700", opacity: 0.2, fontSize: "9px" }}>✧</span>
            <span style={{ position: "absolute", bottom: "18%", left: "10%", color: "#FFD700", opacity: 0.25, fontSize: "12px" }}>✦</span>
            <span style={{ position: "absolute", bottom: "12%", right: "15%", color: "#FFD700", opacity: 0.3, fontSize: "14px", textShadow: "0 0 5px #FFD700" }}>✧</span>
          </div>

          <p className="micro" style={{ zIndex: 5, color: "#ffffff", opacity: 0.85, fontWeight: "700" }}>YOUR PROGRESS • TODAY</p>
          
          <h1 className="h1" style={{ fontSize: "32px", marginTop: "8px", lineHeight: "1.15", zIndex: 5, color: "#FFD700", textShadow: "0 0 10px rgba(255, 215, 0, 0.25)" }}>
            You did<br />{gameState.winsToday} easy wins.
          </h1>
          
          <p className="subtitle" style={{ color: "#a5f3fc", marginTop: "6px", fontSize: "14px", fontWeight: "600", letterSpacing: "-0.01em", lineHeight: "1.35", zIndex: 5, opacity: 0.95 }}>
            That is {gameState.winsToday} more than frozen. Dopamine Tank is {gameState.dopamineLevel}% full — your brain is warming up.
          </p>

          <div className="grid-2" style={{ marginTop: "16px", zIndex: 5, gap: "12px" }}>
            {/* Steps done card (Dark Red and Light Blue writing, 20% size reduction, gold outline) */}
            <div className="card" style={{ 
              background: "linear-gradient(135deg, rgba(128, 12, 20, 0.95) 0%, rgba(95, 8, 14, 0.85) 100%)", 
              color: "#a5f3fc", 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "space-between", 
              minHeight: "92px", 
              borderRadius: "18px",
              border: "1.5px solid #FFD700", // Luxurious Gold Outline
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35), 0 0 10px rgba(255, 215, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
              padding: "12px 16px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: "32px", fontWeight: "900", fontFamily: "var(--font-headline)", lineHeight: "1", color: "#a5f3fc" }}>
                  {gameState.winsToday}
                </div>
                {/* Light blue check circle */}
                <div style={{ 
                  width: "20px", 
                  height: "20px", 
                  borderRadius: "50%", 
                  border: "1.5px solid #a5f3fc", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  background: "#a5f3fc",
                  color: "#800c14",
                  fontSize: "12px",
                  fontWeight: "900"
                }}>
                  ✓
                </div>
              </div>
              <div style={{ marginTop: "8px" }}>
                <div className="micro" style={{ color: "#a5f3fc", fontSize: "9px", fontWeight: "800", opacity: 0.9, letterSpacing: "0.05em" }}>Steps done</div>
                {gameState.task && (
                  <div style={{ marginTop: "2px", fontSize: "11px", color: "#a5f3fc", fontWeight: "700", opacity: 0.95, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {gameState.task}
                  </div>
                )}
              </div>
            </div>

            {/* Dopamine card (Dark Red and Light Blue writing, 20% size reduction, gold outline, glowing percent) */}
            <div className="card" style={{ 
              background: "linear-gradient(135deg, rgba(128, 12, 20, 0.95) 0%, rgba(95, 8, 14, 0.85) 100%)", 
              color: "#a5f3fc", 
              display: "flex", 
              gap: "12px", 
              alignItems: "center", 
              minHeight: "92px", 
              borderRadius: "18px",
              border: "1.5px solid #FFD700", // Luxurious Gold Outline
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35), 0 0 10px rgba(255, 215, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
              padding: "12px 14px",
              position: "relative"
            }}>
              {/* Mini visual Dopamine Level indicator inside card (20% reduced height, slight gold glow) */}
              <div style={{ 
                position: "absolute", 
                right: "14px", 
                top: "14px", 
                width: "24px", 
                height: "60px", 
                background: "rgba(165, 243, 252, 0.08)", 
                borderRadius: "12px", 
                border: "1.5px solid rgba(165, 243, 252, 0.3)",
                overflow: "hidden",
                boxShadow: "0 0 10px rgba(255, 215, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.2)"
              }}>
                <div style={{ 
                  position: "absolute", 
                  bottom: "2px", 
                  left: "2px", 
                  right: "2px", 
                  height: `calc(${gameState.dopamineLevel}% - 4px)`, 
                  background: "linear-gradient(to top, #DE9E36 0%, #F3D277 60%, #FFEFA6 100%)", 
                  borderRadius: "8px",
                  transition: "height 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  overflow: "hidden"
                }}>
                  {/* Subtle glossy reflection overlay */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "100%",
                    background: "linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%)",
                    pointerEvents: "none"
                  }} />
                </div>

                {/* Floating gold sparkles */}
                {[...Array(4)].map((_, i) => {
                  const delay = i * 0.4;
                  const leftOffset = 4 + (i * 6) % 16;
                  const size = 2 + (i % 2);
                  const driftX = (i % 2 === 0 ? 4 : -4) + (i % 3);
                  return (
                    <div
                      key={i}
                      className="sparkle-particle"
                      style={{
                        left: `${leftOffset}px`,
                        width: `${size + 4}px`,
                        height: `${size + 4}px`,
                        background: "transparent",
                        boxShadow: "none",
                        color: "#FFEFA6",
                        fontSize: `${size + 3}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animationDelay: `${delay}s`,
                        animationDuration: `${1.5 + (i % 2) * 0.5}s`,
                        "--drift-x": `${driftX}px`,
                        textShadow: "0 0 3px #F3D277, 0 0 6px #FFEFA6",
                        zIndex: 3
                      }}
                    >
                      ✦
                    </div>
                  );
                })}
              </div>
              
              <div>
                <div style={{ 
                  fontWeight: "900", 
                  fontSize: "20px", 
                  color: "#a5f3fc", 
                  fontFamily: "var(--font-headline)",
                  textShadow: "0 0 10px rgba(165, 243, 252, 0.8), 0 0 20px rgba(165, 243, 252, 0.4)" // Text glow
                }}>
                  {gameState.dopamineLevel}%
                </div>
                <div className="micro" style={{ 
                  color: "#a5f3fc", 
                  fontSize: "9px", 
                  fontWeight: "800", 
                  opacity: 0.9,
                  textShadow: "0 0 8px rgba(165, 243, 252, 0.5)" // Sub-text glow
                }}>Dopamine</div>
              </div>
            </div>
          </div>

          {/* Current Ladder Status card (Dark Red and Light Blue writing, glassmorphic look, 30% size reduction total, gold outline) */}
          {gameState.task && (
            <div className="card" style={{ 
              marginTop: "10px", 
              zIndex: 5, 
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(128, 12, 20, 0.95) 0%, rgba(95, 8, 14, 0.85) 100%)",
              color: "#a5f3fc",
              border: "1.5px solid #FFD700", // Luxurious Gold Outline
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35), 0 0 10px rgba(255, 215, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
              padding: "12px 14px"
            }}>
              <div className="micro" style={{ color: "#a5f3fc", fontWeight: "800", opacity: 0.9 }}>CURRENT LADDER STATUS</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", alignItems: "center" }}>
                <span style={{ fontWeight: "800", fontSize: "13px" }}>{gameState.task}</span>
                <span className="micro" style={{ fontSize: "9px", fontWeight: "800", color: "#a5f3fc" }}>{gameState.currentStepIndex + 1} / {gameState.ladder.length || 10}</span>
              </div>
              <div style={{ height: "3px", background: "rgba(165, 243, 252, 0.15)", borderRadius: "1.5px", overflow: "hidden", width: "100%", marginTop: "8px" }}>
                <div 
                  style={{ 
                    height: "100%", 
                    width: `${((gameState.currentStepIndex) / (gameState.ladder.length || 10)) * 100}%`, 
                    background: "#a5f3fc",
                    boxShadow: "0 0 6px #a5f3fc",
                    borderRadius: "1.5px"
                  }}
                />
              </div>
            </div>
          )}

          {/* Premium Psychology Quote Card - feels extremely luxurious and editorial */}
          <div className="card" style={{ 
            marginTop: "12px", 
            zIndex: 5, 
            borderRadius: "18px",
            background: "linear-gradient(135deg, rgba(128, 12, 20, 0.95) 0%, rgba(95, 8, 14, 0.85) 100%)",
            border: "1.5px solid #FFD700", // Luxurious Gold Outline
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 0 12px rgba(255, 215, 0, 0.1)",
            padding: "16px 20px",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Gorgeous diagonal corner ribbon tag at top-left corner */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              background: "linear-gradient(135deg, #FFD700 0%, #B8860B 100%)",
              color: "#061220",
              fontSize: "8px",
              fontWeight: "900",
              padding: "3px 8px",
              borderBottomRightRadius: "8px",
              boxShadow: "1px 1px 4px rgba(0,0,0,0.15)",
              zIndex: 10,
              letterSpacing: "0.08em"
            }}>
              ✦ GOLDEN TRUTH
            </div>

            {/* Elegant Confetti Splash Background (Faded low-opacity behind the text) */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.08, zIndex: 1, display: "flex", flexWrap: "wrap", justifyContent: "space-around" }}>
              <span style={{ fontSize: "11px", transform: "rotate(15deg)", position: "absolute", top: "8%", left: "8%" }}>🎉</span>
              <span style={{ fontSize: "12px", transform: "rotate(-25deg)", position: "absolute", top: "15%", right: "12%" }}>✦</span>
              <span style={{ fontSize: "10px", transform: "rotate(45deg)", position: "absolute", bottom: "12%", left: "15%" }}>✧</span>
              <span style={{ fontSize: "13px", transform: "rotate(-10deg)", position: "absolute", bottom: "8%", right: "20%" }}>✨</span>
            </div>

            {/* Premium editorial magazine quote text with sliding torch sweep metallic highlight */}
            <div style={{ position: "relative", zIndex: 5, textAlign: "center" }}>
              <div className="micro" style={{ color: "#a5f3fc", fontWeight: "800", opacity: 0.9, marginBottom: "8px", fontSize: "10px", letterSpacing: "0.1em", paddingLeft: "40px" /* offset for ribbon */ }}>DAILY CONTEMPLATION</div>
              <p style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "15.5px",
                lineHeight: "1.5",
                fontWeight: "bold",
                margin: 0,
                padding: 0,
                color: "#FFD700",
                textShadow: "0 0 8px rgba(255, 215, 0, 0.3)",
                backgroundImage: "linear-gradient(110deg, #FFD700 25%, #FFEFA6 45%, #FFF59D 55%, #FFD700 75%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "torchSweep 4s linear infinite"
              }}>
                "We often anticipate tasks to be harder than they actually are. If we break them down into small steps, they feel a lot easier to action. Any task, even those that seem beyond our means, become as simple as the ones you just did. You'll be surprised at how far we can travel once we get going."
              </p>
            </div>
          </div>

          {/* Action buttons with neon play pulse & glowing card-button (20% reduced size, pushed up) */}
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 5 }}>
            {gameState.ladder && gameState.ladder.length > 0 ? (
              <div 
                className="card play-pulse-glow" 
                onClick={() => navigateTo("focus")} 
                style={{ 
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, rgba(128, 12, 20, 0.95) 0%, rgba(95, 8, 14, 0.85) 100%)",
                  border: "2px solid rgba(165, 243, 252, 0.4)",
                  cursor: "pointer",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  transition: "all 0.3s ease",
                }}
              >
                <div>
                  <div style={{ color: "#a5f3fc", fontWeight: "900", fontSize: "13px", letterSpacing: "0.06em" }}>CONTINUE LADDER</div>
                  <div style={{ color: "#a5f3fc", opacity: 0.8, fontSize: "11px", marginTop: "1px" }}>Resume your task momentum</div>
                </div>
                <div style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(165, 243, 252, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1.5px solid #a5f3fc",
                  boxShadow: "0 0 10px rgba(165, 243, 252, 0.5)"
                }}>
                  <Play size={18} fill="#a5f3fc" color="#a5f3fc" style={{ marginLeft: "2px" }} />
                </div>
              </div>
            ) : (
              <div 
                className="card play-pulse-glow" 
                onClick={() => navigateTo("brain-check")} 
                style={{ 
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, rgba(128, 12, 20, 0.95) 0%, rgba(95, 8, 14, 0.85) 100%)",
                  border: "2px solid rgba(165, 243, 252, 0.4)",
                  cursor: "pointer",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  transition: "all 0.3s ease"
                }}
              >
                <div>
                  <div style={{ color: "#a5f3fc", fontWeight: "900", fontSize: "13px", letterSpacing: "0.06em" }}>START NEW TASK</div>
                  <div style={{ color: "#a5f3fc", opacity: 0.8, fontSize: "11px", marginTop: "1px" }}>Begin your next easy win</div>
                </div>
                <div style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(165, 243, 252, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1.5px solid #a5f3fc",
                  boxShadow: "0 0 10px rgba(165, 243, 252, 0.5)"
                }}>
                  <Play size={18} fill="#a5f3fc" color="#a5f3fc" style={{ marginLeft: "2px" }} />
                </div>
              </div>
            )}
            
            {/* Split Option: Reset Day on left (40% width) and Return Home on right (60% width) with light blue fill, dark blue text */}
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button 
                className="btn-secondary" 
                onClick={handleResetDay} 
                style={{ 
                  flex: "0 0 40%",
                  minHeight: "40px", 
                  borderRadius: "20px",
                  background: "transparent",
                  color: "#a5f3fc",
                  border: "1.5px solid rgba(165, 243, 252, 0.4)",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                Reset Day
              </button>

              <button 
                className="btn-primary" 
                onClick={() => navigateTo("landing")} 
                style={{ 
                  flex: "1",
                  minHeight: "40px", 
                  borderRadius: "20px",
                  background: "#a5f3fc",
                  color: "#061220",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(165, 243, 252, 0.2)"
                }}
              >
                <Home size={14} />
                Return Home
              </button>
            </div>
          </div>
          
          <p className="micro" style={{ textAlign: "center", marginTop: "12px", opacity: 0.8, zIndex: 5, color: "#a5f3fc" }}>
            No streaks. No shame. Just next easiest step.
          </p>
        </div>
      )}

      {/* ==================== 7. PAUSE OVERLAY ==================== */}
      {showPause && (
        <div className="pause-overlay" onClick={() => setShowPause(false)}>
          <div className="pause-card" onClick={(e) => e.stopPropagation()} style={{ borderRadius: "32px" }}>
            <div className="emoji-badge" style={{
              background: "rgba(214, 223, 171, 0.5)",
              border: "1.5px solid rgba(214, 223, 171, 0.8)",
              boxShadow: "0 4px 12px rgba(90, 36, 48, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.6)",
              margin: "0 auto",
              width: "56px",
              height: "56px",
              fontSize: "28px"
            }}>
              🌿
            </div>
            
            <p className="micro" style={{ marginTop: "16px", fontWeight: "700" }}>
              PAUSED • SAFE PLACE
            </p>
            
            <h2 className="h2" style={{ marginTop: "8px", color: "var(--text-burgundy)", fontSize: "24px", lineHeight: "1.1", letterSpacing: "-0.03em" }}>
              It's okay to pause.<br />Progress is saved.
            </h2>
            
            <p className="subtitle" style={{ color: "var(--text-muted)", fontSize: "13.5px", marginTop: "12px", letterSpacing: "-0.01em", lineHeight: "1.5" }}>
              Your Dopamine Tank stays filled.<br />Your Ladder stays exactly where it is.<br />No timer, no guilt.
            </p>

            {/* Stats row inside card */}
            <div style={{ display: "flex", gap: "8px", marginTop: "24px", borderTop: "1.5px solid var(--border-light)", borderBottom: "1.5px solid var(--border-light)", padding: "12px 0" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontWeight: "800", fontSize: "18px", color: "var(--text-burgundy)" }}>{gameState.winsToday}</div>
                <div className="micro" style={{ fontSize: "9px" }}>Done</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontWeight: "800", fontSize: "18px", color: "var(--text-burgundy)" }}>{gameState.dopamineLevel}%</div>
                <div className="micro" style={{ fontSize: "9px" }}>Dopamine</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontWeight: "800", fontSize: "18px", color: "var(--text-burgundy)" }}>Stage {gameState.brainWarmingStage}</div>
                <div className="micro" style={{ fontSize: "9px" }}>Warming</div>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ marginTop: "24px", minHeight: "56px" }}
              onClick={() => {
                playClick();
                setShowPause(false);
              }}
            >
              Resume Focus
            </button>
            
            <button 
              className="btn-secondary" 
              style={{ marginTop: "8px", minHeight: "48px" }}
              onClick={() => {
                playClick();
                setShowPause(false);
                navigateTo("ladder");
              }}
            >
              Back to Ladder
            </button>

            <button 
              onClick={handleResetDay}
              style={{ background: "none", border: "none", marginTop: "16px", color: "var(--text-muted)", fontSize: "13px", textDecoration: "underline", cursor: "pointer", minHeight: "48px" }}
            >
              Reset Day
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
