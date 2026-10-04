// Task archetype library.
//
// Each archetype expands into many concrete tasks (objects × optional topics)
// and every task gets its own steps from task-specific templates — no generic
// filler like "acknowledge the intention". Templates use "{o}" for the task's
// object, "{O}" for its capitalized form and "{t}" for its topic.
//
// Step entry shape: [title, micro, time, [easier1, easier2]].

const A = [];

// ---------------------------------------------------------------- cleaning
A.push({
  category: "cleaning",
  pattern: (o) => `Clean the ${o}`,
  objects: [
    "oven", "oven racks", "stove top", "range hood", "microwave", "fridge interior", "fridge shelves",
    "freezer", "dishwasher filter", "kettle", "toaster", "coffee machine", "espresso machine", "air fryer",
    "barbecue grill", "kitchen sink", "bathroom sink", "shower screen", "shower head", "bathtub",
    "toilet", "bathroom grout", "bathroom mirror", "bathroom fan", "bathroom counter", "taps and faucets",
    "washing machine drum", "clothes dryer lint trap", "iron", "ironing board", "vacuum filter",
    "blinds", "curtains", "window panes", "window sills", "mirrors", "glass coffee table",
    "couch cushions", "dining chairs", "mattress", "pillowcases", "duvet cover", "skirting boards",
    "ceiling fan", "light switches", "door handles", "doormat", "computer keyboard", "mouse",
    "phone screen", "monitor", "laptop", "earbuds", "headphones", "remote controls", "glasses",
    "makeup brushes", "hairbrush", "jewellery", "sneakers", "running shoes", "wellington boots",
    "pet food bowls", "litter box", "fish tank", "bird cage", "bicycle", "pram", "garden furniture",
  ],
  steps: [
    ["Get your cleaner and a cloth for the {o}", "Grab the right cleaner and one microfibre cloth before you start.", "<20 sec", ["Just use a damp cloth", "Use dish soap instead"]],
    ["Clear the surface of the {o}", "Move anything sitting on or around the {o} out of the way.", "<30 sec", ["Shift only the biggest item", "Clear just one corner"]],
    ["Remove loose crumbs and dust from the {o}", "Dry-wipe or brush the {o} before any liquid goes on it.", "<30 sec", ["Brush with your hand", "Use an old dry cloth"]],
    ["Apply cleaner to the {o}", "Spray or dab cleaner onto the {o} and let it sit for a moment.", "<20 sec", ["Spray one patch only", "Dab with a sponge"]],
    ["Scrub the worst patch of the {o}", "Start where the grime is thickest and work outwards from there.", "<60 sec", ["Scrub for 20 seconds", "Soften it with hot water first"]],
    ["Wipe the {o} edge to edge", "Work in overlapping strokes so no streaks are left behind.", "<45 sec", ["Wipe in one direction", "Wipe the top half only"]],
    ["Hit the spots you missed on the {o}", "Do a quick second pass over the corners and edges.", "<30 sec", ["Check just the corners", "Do one edge only"]],
    ["Rinse or re-wipe the {o}", "Go over the {o} with a clean damp cloth to lift the cleaner off.", "<30 sec", ["Use water only", "Wipe a small patch"]],
    ["Dry the {o}", "Buff the {o} with a dry cloth so it shines and won't streak.", "<30 sec", ["Air-dry it instead", "Dry one section"]],
    ["Clean the tool you used on the {o}", "Rinse the cloth or sponge and hang it to dry.", "<20 sec", ["Just squeeze it out", "Leave it in the sink"]],
    ["Put the cleaner back for the {o}", "Return the cleaner and cloths to their spot so it's done.", "<15 sec", ["Drop it on the shelf", "Deal with it later"]],
    ["Step back and check the {o}", "Look at the {o} from arm's length — notice the visible improvement.", "<15 sec", ["Take a photo to compare", "Just glance at it"]],
  ],
});

A.push({
  category: "cleaning",
  pattern: (o) => `Organize the ${o}`,
  objects: [
    "wardrobe", "clothes drawer", "linen closet", "hallway closet", "pantry", "spice rack",
    "fridge shelves", "bathroom cabinet", "medicine cabinet", "under the sink", "kitchen cabinets",
    "junk drawer", "desk drawers", "bookshelf", "toy box", "garage shelf", "toolbox",
    "entryway", "shoe rack", "coat rack", "hallway table", "bedside table", "office desk",
    "cable drawer", "charger box", "stationery pile", "receipts pile", "paperwork tray",
    "downloads folder", "desktop files", "email folders", "browser bookmarks", "photo library",
    "laundry basket", "suitcase storage", "sports gear bag", "craft supplies", "wrapping paper",
  ],
  steps: [
    ["Empty the {o} completely", "Take everything out so you can see exactly what lives in the {o}.", "<60 sec", ["Empty one shelf only", "Pull out just half"]],
    ["Sort the {o} into three piles", "Split it into keep, toss and belongs-elsewhere piles on the floor.", "<60 sec", ["Just two piles", "Sort one category first"]],
    ["Toss the obvious rubbish from the {o}", "Straight into the bin or recycling — no second-guessing.", "<30 sec", ["Fill one hand", "Toss only broken things"]],
    ["Group similar items in the {o}", "Put all the same-type items together so everything has a home.", "<45 sec", ["Group just the small items", "Start with the biggest group"]],
    ["Set a donate bag for the {o}", "Anything unused in months goes in the bag, not back in.", "<45 sec", ["Pick one item only", "Choose the duplicates"]],
    ["Wipe the empty {o}", "Quick wipe of the shelves now that they're empty and reachable.", "<30 sec", ["Wipe one shelf", "Skip the corners"]],
    ["Put the keepers back in the {o}", "Return items grouped, heaviest at the bottom, favourites in front.", "<60 sec", ["Do one group at a time", "Start with what you use daily"]],
    ["Relocate the belongs-elsewhere items", "Walk each stray item to its real home right now.", "<45 sec", ["Move one item", "Park them in one basket"]],
    ["Label or zone the {o}", "Give each group a zone so the {o} stays tidy by itself.", "<30 sec", ["Rearrange instead of labelling", "Label one zone"]],
    ["Take the donate bag out of sight", "Put the bag by the door or in the car so it actually leaves.", "<20 sec", ["Just park it by the door", "Set a reminder instead"]],
    ["Close up and admire the {o}", "Look at the finished {o} and enjoy the order you made.", "<15 sec", ["Take a photo", "Show someone"]],
    ["Note what to organize next", "You now know the system — jot the next {o} candidate.", "<15 sec", ["Just remember it", "Do it another day"]],
  ],
});

A.push({
  category: "cleaning",
  pattern: (o) => `Declutter the ${o}`,
  objects: [
    "kitchen bench", "hallway", "coffee table", "bedroom floor", "under the bed", "wardrobe floor",
    "desk surface", "kitchen cupboards", "bathroom shelf", "car interior", "glovebox", "backpack",
    "handbag", "wallet", "phone apps", "phone photos", "text message threads", "email inbox",
    "notification settings", "social media accounts", "subscription list", "bookmarks bar", "notes app",
    "garden path", "garage floor", "laundry pile", "dining table", "kids' toys", "craft corner",
  ],
  steps: [
    ["Pick the first thing to remove from the {o}", "Grab the most obvious item that doesn't belong and move it now.", "<20 sec", ["Take one item", "Take the biggest item"]],
    ["Set a one-minute timer for the {o}", "Short burst, no decisions allowed to stall you.", "<15 sec", ["Just start without a timer", "Do 30 seconds"]],
    ["Clear the flat surfaces of the {o}", "Anything resting on top gets sorted: bin, relocate or keep.", "<60 sec", ["Clear half the surface", "Handle the papers only"]],
    ["Bin the true rubbish in the {o}", "Empty wrappers, junk mail and dead items straight into the bin.", "<30 sec", ["Fill your hand once", "Grab the obvious ones"]],
    ["Collect the relocate items from the {o}", "Pile up everything that belongs somewhere else and walk it over.", "<45 sec", ["Move one item per trip", "Use a laundry basket"]],
    ["Decide on the stragglers in the {o}", "For each leftover, keep it only if you used it this month.", "<45 sec", ["Decide on three items", "Keep them all for now"]],
    ["Wipe where the clutter was in the {o}", "Quick damp cloth over the newly cleared spot.", "<30 sec", ["Dry dust only", "One swipe"]],
    ["Put the keepers back neatly in the {o}", "Return only what stays, stacked or filed so it looks calm.", "<45 sec", ["Stack, don't arrange", "Handle five items"]],
    ["Bin bag straight out of the {o}", "Take the rubbish bag to the bin before it re-homes itself.", "<30 sec", ["Tie the bag only", "Drop it at the door"]],
    ["Snapshot the cleared {o}", "A quick photo proves the reset and motivates the next one.", "<15 sec", ["Skip the photo", "Save it for later"]],
  ],
});

// ---------------------------------------------------------------- cooking
A.push({
  category: "cooking",
  pattern: (o) => `Make ${o}`,
  objects: [
    "spaghetti bolognese", "fried rice", "mac and cheese", "pasta carbonara", "chicken stir fry",
    "beef tacos", "butter chicken", "pad thai", "ramen", "lasagna", "vegetable curry", "roast chicken",
    "homemade pizza", "pancakes", "an omelette", "scrambled eggs on toast", "bacon and eggs",
    "porridge", "a smoothie", "a sandwich", "pumpkin soup", "chicken noodle soup", "garden salad",
    "rice paper rolls", "sushi", "dumplings", "noodle soup", "risotto", "gnocchi", "shepherd's pie",
    "mashed potato", "roast vegetables", "quiche", "pasta bake", "burritos", "quesadilla", "hummus",
    "guacamole", "chili con carne", "kung pao chicken", "sweet and sour pork", "teriyaki salmon",
    "fish and chips", "steak and chips", "pork chops", "lamb roast", "meatballs", "moussaka",
    "paella", "bibimbap", "kimchi fried rice", "japchae", "pancakes with berries", "banana smoothie",
  ],
  steps: [
    ["Choose the recipe for {o}", "Open the recipe for {o} once and keep it visible the whole time.", "<30 sec", ["Cook from memory", "Pick the simplest version"]],
    ["Check you have the ingredients for {o}", "Scan the ingredient list against your fridge and pantry.", "<45 sec", ["Check the main 3 only", "Substitute what's missing"]],
    ["Get out every ingredient for {o}", "Lay them on the bench so nothing is hunted mid-cooking.", "<60 sec", ["Get the cold items first", "Grab as you go"]],
    ["Get out the pans and tools for {o}", "Choose the pot, pan, knife and board the recipe actually needs.", "<30 sec", ["One pan only", "Skip the extras"]],
    ["Prep the vegetables for {o}", "Wash, peel and chop the veg before anything touches heat.", "<120 sec", ["Rough chop is fine", "Prep just the first vegetable"]],
    ["Measure the dry ingredients for {o}", "Rice, pasta, spices — portion them now to keep cooking calm.", "<30 sec", ["Eyeball the amounts", "Measure the main one"]],
    ["Start the base for {o}", "Heat the pan, add oil, and get the onion or garlic sizzling.", "<60 sec", ["Medium heat is fine", "Skip the onion"]],
    ["Cook the protein for {o}", "Brown or add the meat, tofu or legumes and stir as it cooks.", "<120 sec", ["Smaller pieces cook faster", "Use pre-cooked protein"]],
    ["Add the sauce and seasoning for {o}", "Pour in the sauce or spices and taste as it bubbles.", "<45 sec", ["Start with half the sauce", "Salt after tasting"]],
    ["Simmer or finish the {o}", "Let it come together, lid on or stirring, until it looks right.", "<120 sec", ["Check every 30 seconds", "Lower the heat"]],
    ["Taste and adjust the {o}", "One spoonful: more salt, acid or sweetness if it needs it.", "<30 sec", ["Add one pinch", "Serve as is"]],
    ["Plate up the {o}", "Serve it while it's hot — bowls or plates ready before you start.", "<45 sec", ["Family-style in the pot", "One plate is enough"]],
    ["Wash the cooking pan for {o}", "Soak or wash the main pan straight away while it's easy.", "<60 sec", ["Fill it with hot water", "Just rinse it"]],
    ["Store the leftovers of the {o}", "Cool, container and fridge the extra portions for tomorrow.", "<60 sec", ["One container is fine", "Leave to cool first"]],
  ],
});

A.push({
  category: "cooking",
  pattern: (o) => `Bake ${o}`,
  objects: [
    "banana bread", "chocolate chip cookies", "a vanilla cake", "brownies", "muffins", "scones",
    "a lemon tart", "an apple pie", "hot cross buns", "a sourdough loaf", "bread rolls", "focaccia",
    "a carrot cake", "cupcakes", "a cheesecake", "blondies", "oat cookies", "a sponge cake",
    "pikelets", "a peach cobbler", "cinnamon rolls", "a mud cake", "ANZAC biscuits", "a fruit loaf",
  ],
  steps: [
    ["Preheat the oven for the {o}", "Set the oven now so it's at temperature when the batter is ready.", "<20 sec", ["Skip preheating for now", "Preheat ten degrees lower"]],
    ["Read the recipe for the {o} once", "Skim the method start to finish so no step surprises you.", "<45 sec", ["Read just the ingredients", "Ask someone to summarise"]],
    ["Line the tin for the {o}", "Baking paper or greased tin, ready before the mixing starts.", "<45 sec", ["Use cooking spray", "Use the tray bare"]],
    ["Weigh the dry ingredients for the {o}", "Flour, sugar, raising agents — on the scales, not guessed.", "<60 sec", ["Use cup measures", "Weigh the flour only"]],
    ["Mix the wet ingredients for the {o}", "Eggs, butter, milk or oil beaten together until smooth.", "<60 sec", ["Melt the butter first", "One bowl, one spoon"]],
    ["Combine into the {o} batter", "Fold dry into wet until just combined — don't overmix.", "<60 sec", ["Stir 20 strokes only", "Use a spatula"]],
    ["Add the flavour extras to the {o}", "Choc chips, fruit or spice folded through evenly.", "<30 sec", ["Add to half the batch", "Skip the extras"]],
    ["Fill the tin and smooth the {o}", "Scoop the batter level so it bakes evenly.", "<30 sec", ["Fill the centre only", "Tap the tin to settle"]],
    ["Set the timer and bake the {o}", "Into the oven, timer on the recipe time — then hands off.", "<30 sec", ["Set a phone timer", "Check early"]],
    ["Do the skewer test on the {o}", "A skewer in the middle comes out clean when it's done.", "<20 sec", ["Press the top gently", "Trust the timer"]],
    ["Cool the {o} on a rack", "Ten minutes in the tin, then onto a rack to finish cooling.", "<60 sec", ["Leave in the tin", "Slice while warm"]],
    ["Dust or ice the {o}", "Icing sugar, glaze or frosting once it's fully cool.", "<45 sec", ["Serve it plain", "Ice half"]],
    ["Store the rest of the {o}", "Airtight container or wrapped for the freezer.", "<30 sec", ["Cover the tin", "Freeze half"]],
  ],
});

A.push({
  category: "cooking",
  pattern: (o, t) => `Prep ${o} for ${t}`,
  objects: ["lunches", "dinners", "breakfasts", "snacks"],
  topics: ["the week ahead", "the next three days", "tomorrow's lunches", "the freezer", "the week's dinners", "school lunches", "work lunches", "a family gathering", "the weekend", "a picnic"],
  steps: [
    ["Pick the meals for {o}", "Choose two or three meals you'll actually eat, nothing fancy.", "<60 sec", ["Repeat one meal", "Choose from favourites"]],
    ["Write the shopping list for {o}", "One list, grouped by aisle, from the chosen meals.", "<60 sec", ["List the proteins only", "Use last week's list"]],
    ["Check the pantry for {o}", "Tick off what you already have before shopping.", "<30 sec", ["Check the main items", "Skip the spices"]],
    ["Clear a prep space for {o}", "One clean bench zone big enough for chopping and containers.", "<45 sec", ["Use the table", "Clear half the bench"]],
    ["Gather the containers for {o}", "Every box, lid and label out before any cooking starts.", "<45 sec", ["Grab four containers", "Use bags instead"]],
    ["Cook the grain base for {o}", "Rice, pasta or quinoa in one pot while you prep the rest.", "<60 sec", ["One pot only", "Use a rice cooker"]],
    ["Roast or cook the proteins for {o}", "One tray of protein in the oven while veg is chopped.", "<120 sec", ["One protein only", "Use pre-cooked"]],
    ["Chop the vegetables for {o}", "All the veg at once — rough and even is fine.", "<120 sec", ["Chop the soft veg only", "Buy pre-cut next time"]],
    ["Portion the meals for {o}", "Fill the containers meal by meal while everything's hot.", "<60 sec", ["Portion two meals", "Skip the labels"]],
    ["Label and stack the {o} containers", "Day labels on the lids, stacked where you'll grab them.", "<45 sec", ["Label the top one", "Remember without labels"]],
    ["Clean the {o} prep mess", "Load the dishwasher or wash the boards while it's fresh.", "<60 sec", ["Soak the pans only", "Wipe the bench first"]],
    ["Park one meal for tomorrow", "Front-load tomorrow's grab-and-go so future-you is set.", "<20 sec", ["Put it at eye level", "Write a note"]],
  ],
});

// ---------------------------------------------------------------- email
A.push({
  category: "email",
  pattern: (o, t) => `Email ${o} about ${t}`,
  objects: [
    "your boss", "your manager", "a client", "the client's team", "a supplier", "the landlord",
    "the real estate agent", "the school teacher", "the principal", "your doctor's office",
    "the bank", "the insurance company", "HR", "the IT help desk", "a colleague", "the whole team",
    "your accountant", "the council", "the airline", "the hotel",
  ],
  topics: [
    "a meeting time", "a project update", "an overdue invoice", "a quote request", "a refund request",
    "a complaint", "a schedule change", "annual leave", "a sick day", "a budget question",
    "the contract renewal", "missing documents", "next week's deadline", "an introduction request",
    "a warranty claim", "a rent repair", "an enrolment question", "feedback on a draft",
    "a delivery problem", "the final sign-off",
  ],
  steps: [
    ["Decide the one outcome of the email", "Write one sentence to yourself: what should {o} do after reading?", "<30 sec", ["Bullet it in the draft", "Say it out loud first"]],
    ["Write the subject line first", 'Something specific like "{t} — quick decision needed".', "<30 sec", ["Reuse a past subject", "Draft it last"]],
    ["Open a blank email to {o}", "New message, address filled in — no draft folder limbo.", "<20 sec", ["Reply to the last thread", "Use a template"]],
    ["Write the one-line ask up top", "First sentence states the request, not the background.", "<30 sec", ["Start with 'Quick one:'", "Paste your outcome line"]],
    ["Add two to three sentences of context", "Only what {o} needs to act — no essay.", "<60 sec", ["One sentence only", "Link a doc instead"]],
    ["Include the attachments or links", "Attach the file or paste the link before you forget.", "<30 sec", ["Skip attachments", "Screenshot instead"]],
    ["State the deadline or date clearly", "A concrete date beats 'as soon as possible'.", "<20 sec", ["Say 'this week'", "Let them propose"]],
    ["Re-read the email once", "Check names, dates and tone — delete anything defensive.", "<30 sec", ["Read the first line only", "Skim it"]],
    ["Send the email", "Hit send now — perfect is the enemy of done.", "<10 sec", ["Schedule for morning", "Save draft and walk"]],
    ["Note any follow-up needed", "If no reply by the date, diary a nudge to yourself.", "<20 sec", ["Set a reminder", "Trust the deadline"]],
  ],
});

A.push({
  category: "email",
  pattern: (o) => `Clear ${o}`,
  objects: ["your email inbox", "your unread emails", "your spam folder", "your drafts", "your sent folder", "the team inbox", "your work inbox", "your personal inbox", "your notification shade", "your message requests", "your voicemails", "your WhatsApp chats", "your SMS messages", "your LinkedIn messages", "your support tickets"],
  steps: [
    ["Sort the inbox by unread first", "Oldest or newest unread on top — pick one order and stick to it.", "<20 sec", ["Sort by sender", "Start from today"]],
    ["Delete the obvious junk in the {o}", "Newsletters and notifications get archived or unsubscribed instantly.", "<45 sec", ["Archive in bulk", "Unsubscribe from three"]],
    ["Handle every two-minute email now", "Any reply that takes under two minutes gets sent on the spot.", "<120 sec", ["Do three quick replies", "Star them for later"]],
    ["Flag the emails needing real work", "Mark or move anything requiring thought into a to-do pile.", "<45 sec", ["Star five emails", "Use one folder"]],
    ["Reply to the most important flagged email", "Open the one that matters most and write the reply.", "<120 sec", ["Write two lines", "Reply with a call offer"]],
    ["Forward what belongs to someone else", "Delegate the emails that aren't yours with one line of context.", "<60 sec", ["Forward two", "CC the owner"]],
    ["Archive everything you've touched", "Clean slate: anything dealt with leaves the inbox immediately.", "<30 sec", ["Archive ten at once", "Select-all and archive"]],
    ["Unsubscribe from three lists", "Cut three recurring emails at the source so they never return.", "<45 sec", ["Just delete them", "Set a rule instead"]],
    ["Count what's left in the {o}", "The remaining number is your real workload — look at it plainly.", "<15 sec", ["Screenshot it", "Note it down"]],
    ["Close the {o} with a clean state", "Zero or a short intentional list — not an ignored pile.", "<15 sec", ["Just close the tab", "Set a check time"]],
  ],
});

// ---------------------------------------------------------------- work
A.push({
  category: "work",
  pattern: (o) => `Write ${o}`,
  objects: [
    "a project status update", "a meeting agenda", "meeting notes", "a weekly report", "a monthly report",
    "a job application cover letter", "your CV update", "a LinkedIn post", "a proposal outline",
    "a project brief", "a client summary", "a performance review draft", "feedback for a colleague",
    "a resignation letter", "a thank-you note", "a complaint letter", "an apology email draft",
    "a newsletter draft", "a blog post outline", "an FAQ page", "a job description", "an offer summary",
    "a case study", "an announcement memo", "a handover document", "a how-to guide", "a policy draft",
  ],
  steps: [
    ["State the reader and purpose of {o}", "One line: who reads {o} and what they should do after.", "<30 sec", ["Name the reader only", "Write it as a question"]],
    ["List three points for {o}", "Bullets only — the three things that must come across.", "<60 sec", ["List two points", "Mind-dump ten and cut"]],
    ["Gather the facts for {o}", "Numbers, dates and names in one place before writing sentences.", "<60 sec", ["Use last version's numbers", "Add a placeholder"]],
    ["Open the document for {o}", "New blank doc with a working title — nothing more.", "<20 sec", ["Reuse the old template", "Copy last month's"]],
    ["Write a rough first paragraph", "Bad on purpose — it just breaks the blank page.", "<60 sec", ["Write two sentences", "Start with the ending"]],
    ["Flesh out each bullet of {o}", "Turn each of the three points into a short paragraph.", "<180 sec", ["Do one bullet only", "Keep sentences short"]],
    ["Write the opening line of {o}", "Now that the body exists, the intro is easy.", "<45 sec", ["Start with the ask", "Use the title as intro"]],
    ["Cut {o} by a third", "Delete anything the reader doesn't need — ruthless pass.", "<60 sec", ["Cut one paragraph", "Trim the longest sentence"]],
    ["Read {o} aloud once", "Your ear catches what your eye forgives.", "<60 sec", ["Read the first paragraph", "Use text-to-speech"]],
    ["Format and title {o}", "Headings, bold key numbers, clean spacing.", "<45 sec", ["Bold one line", "Skip formatting"]],
    ["Send or save {o}", "Deliver it to its reader or file it where it belongs.", "<20 sec", ["Save and share link", "Email it to yourself"]],
    ["Note the follow-up from {o}", "Whatever it now asks of others or you, into your task list.", "<30 sec", ["One reminder only", "Deal with it tomorrow"]],
  ],
});

A.push({
  category: "work",
  pattern: (o) => `Prepare a presentation about ${o}`,
  objects: ["your team's quarter", "the new product", "the project retrospective", "the annual budget", "the client's results", "your research findings", "the marketing plan", "the launch timeline", "team onboarding", "the competitor landscape", "the customer survey", "the technical architecture", "the hiring plan", "a school assembly topic", "the safety update"],
  steps: [
    ["Write the single message of the {o} presentation", "If the audience remembers one sentence, what is it? Write it down.", "<45 sec", ["Write it as a tweet", "Say it out loud"]],
    ["List the three supporting points", "Three slides' worth of proof for that one message.", "<60 sec", ["Two points only", "Brain-dump and cut"]],
    ["Sketch the slide flow on paper", "Ten boxes on paper before touching the software.", "<60 sec", ["Five boxes", "List on one line"]],
    ["Open the deck template", "Blank deck with house style, slides matching your paper sketch.", "<30 sec", ["Use one plain theme", "Reuse last deck"]],
    ["Build the title and message slide", "Slide one states the single message plainly.", "<30 sec", ["Just a working title", "Skip to content"]],
    ["Add the story slides", "One idea per slide, headline says the point, not the topic.", "<180 sec", ["Two slides only", "Bullets not prose"]],
    ["Drop in the data slide", "One chart that proves the message, nothing decorative.", "<60 sec", ["Screenshot the chart", "Use a table"]],
    ["Write the closing ask", "Final slide: what you want the audience to do next.", "<30 sec", ["'Questions?' works", "Reuse the message slide"]],
    ["Cut every slide without a job", "If a slide proves nothing, delete it.", "<45 sec", ["Cut one slide", "Move it to appendix"]],
    ["Rehearse the opening 30 seconds", "Say the first two slides out loud twice.", "<60 sec", ["Read the titles aloud", "Practise in your head"]],
    ["Check the deck on the actual screen", "Fonts, contrast and clicker behaviour on the real setup.", "<60 sec", ["Preview mode only", "Ask a colleague to check"]],
  ],
});

A.push({
  category: "work",
  pattern: (o) => `Prepare for the ${o}`,
  objects: ["team meeting", "client call", "performance review", "job interview", "one-on-one", "board meeting", "project kickoff", "sales pitch", "parent-teacher interview", "doctor's appointment", "rental inspection", "salary negotiation", "networking event", "stand-up meeting"],
  steps: [
    ["Write the one goal for the {o}", "What must be true when it ends? One sentence.", "<30 sec", ["Name a feeling instead", "Pick from the invite"]],
    ["List your three talking points", "The points you must raise, in priority order.", "<60 sec", ["Two points", "Bullet keywords only"]],
    ["Collect the numbers and facts", "The figures and dates you may be asked about, in one note.", "<60 sec", ["Top three numbers", "Screenshot the dashboard"]],
    ["Prepare your opening line", "The first sentence you'll say, word for word.", "<30 sec", ["Just greet first", "Use their name first"]],
    ["Anticipate the hard question", "What's the question you dread? Draft a calm answer.", "<60 sec", ["List two questions", "Ask a colleague"]],
    ["Set up the room or link for the {o}", "Test the link, camera, or find the meeting room now.", "<30 sec", ["Restart the router early", "Join two minutes late"]],
    ["Lay out your notes for the {o}", "One page, big writing, in front of you.", "<20 sec", ["One card only", "Digital notes fine"]],
    ["Do a two-minute rehearsal", "Say your opening and first point out loud once.", "<120 sec", ["Rehearse in your head", "Record on your phone"]],
    ["Set a five-minute buffer before the {o}", "Empty calendar, water, deep breath — arrive calm.", "<20 sec", ["Walk around the block", "Silence notifications"]],
  ],
});

// ---------------------------------------------------------------- study
A.push({
  category: "study",
  pattern: (o) => `Study ${o}`,
  objects: ["chapter five", "the nervous system", "algebra basics", "trigonometry", "the French vocabulary list", "Spanish verbs", "Japanese hiragana", "Korean phrases", "the world war two timeline", "cell biology", "organic chemistry reactions", "the supply and demand model", "statistics basics", "the water cycle", "plate tectonics", "the periodic table", "essay structure", "citation formats", "SQL joins", "Python loops", "the marketing funnel", "the Krebs cycle", "photosynthesis", "the Australian legal system", "microeconomics formulas"],
  steps: [
    ["Set the goal for studying {o}", "Write what you'll be able to do after this session — one line.", "<30 sec", ["Pick one exercise", "Choose a page range"]],
    ["Get the materials for {o}", "Textbook, notes and slides open to the right page before starting.", "<45 sec", ["Digital only", "Print the summary"]],
    ["Do a two-minute recall warm-up", "From memory, jot everything you already know about {o}.", "<120 sec", ["List three facts", "Draw one diagram"]],
    ["Read the summary first, not the chapter", "Headings and chapter summary give the map before the detail.", "<120 sec", ["Read the intro only", "Skim the pictures"]],
    ["Study one section of {o} closely", "Read it fully, pen in hand, marking what confuses you.", "<180 sec", ["Read half a section", "Highlight three lines"]],
    ["Close the book and self-test on {o}", "Write or say what the section said without looking.", "<120 sec", ["One question only", "Explain it to a wall"]],
    ["Check your answers against {o}", "Reopen and mark your recall — gaps are gold.", "<60 sec", ["Check one answer", "Note the big gap"]],
    ["Make two flashcards from {o}", "Only the things you got wrong become cards.", "<60 sec", ["One card", "Screenshot instead"]],
    ["Do three practice questions on {o}", "Apply it — questions beat re-reading every time.", "<180 sec", ["One question", "Multiple choice first"]],
    ["Write the one-sentence summary of {o}", "If you can't say it in a sentence, revisit it tomorrow.", "<45 sec", ["Say it out loud", "Draw it instead"]],
    ["Plan the next {o} session", "Note where to resume so starting is zero-effort later.", "<20 sec", ["Bookmark the page", "Set a reminder"]],
  ],
});

A.push({
  category: "study",
  pattern: (o, t) => `Make ${o} for ${t}`,
  objects: ["summary notes", "flashcards", "a mind map", "a one-page cheat sheet", "practice questions", "a study plan", "an annotated bibliography", "diagram cards"],
  topics: ["your hardest subject", "the exam next week", "the lecture you missed", "the reading list", "chapter five", "the group project", "the assignment draft", "the topic you keep avoiding", "the lab experiment", "the history unit", "the chemistry unit", "the legal case list"],
  steps: [
    ["Gather the source material for the {o}", "Open the textbook, slides or lecture notes you'll be condensing.", "<45 sec", ["Use slides only", "Ask a classmate for theirs"]],
    ["Pick the examinable core for the {o}", "Highlight the 20% that matters — definitions, formulas, dates.", "<60 sec", ["Five headings only", "Use the study guide"]],
    ["Choose your format for the {o}", "Table, cards or mind map — pick one and commit.", "<30 sec", ["Plain list", "Copy a friend's format"]],
    ["Set up the page for the {o}", "Blank document or cards with title and sections ready.", "<30 sec", ["Handwrite instead", "Use a template"]],
    ["Write the first five entries of the {o}", "Start with the definitions — short, in your own words.", "<120 sec", ["Three entries", "Bullet fragments only"]],
    ["Add the hard bits to the {o}", "The parts you always forget get their own section.", "<120 sec", ["One hard bit", "Flag with stars"]],
    ["Include an example in the {o}", "One worked example or sample sentence per key idea.", "<90 sec", ["Screenshot the example", "Paste from notes"]],
    ["Read the {o} back aloud", "Speaking it shows which lines are still vague.", "<60 sec", ["Read one section", "Skim silently"]],
    ["Test yourself from the {o}", "Cover it, recall, uncover — twice through the weakest parts.", "<120 sec", ["Test three items", "Test one item"]],
    ["Save the {o} where you'll find it", "Cloud folder or pinned note, named with the subject and date.", "<20 sec", ["Rename the file", "Email it to yourself"]],
  ],
});

// ---------------------------------------------------------------- exercise
A.push({
  category: "exercise",
  pattern: (o, t) => `Do a ${o} ${t} workout`,
  objects: ["10-minute", "15-minute", "20-minute", "30-minute", "45-minute"],
  topics: ["bodyweight", "stretching", "core", "leg", "arm", "cardio", "yoga", "Pilates", "HIIT", "mobility"],
  steps: [
    ["Change into your workout gear", "Shoes and clothes on — the decision point that matters most.", "<60 sec", ["Just the shoes", "Comfortable clothes"]],
    ["Clear a workout space", "Two square metres of floor and nothing to trip on.", "<30 sec", ["Move one chair", "Use the hallway"]],
    ["Put on your workout playlist", "One press — the first move happens when the beat drops.", "<20 sec", ["Podcast instead", "Silence is fine"]],
    ["Warm up for one minute", "Arm circles, hip circles, ten squats — get the blood moving.", "<60 sec", ["March on the spot", "Shoulder rolls only"]],
    ["Do the first exercise of the {o} {t} workout", "Start with the easiest move and let momentum build.", "<60 sec", ["Half the reps", "Slower pace"]],
    ["Follow the routine for the {o} {t} workout", "Work through the planned moves, resting as little as needed.", "<300 sec", ["Pause when needed", "Cut the last round"]],
    ["Push through the final minute", "The last effort is where the workout is won.", "<60 sec", ["Do 30 seconds", "Low impact version"]],
    ["Cool down and stretch", "Two minutes of easy stretching for the muscles you used.", "<120 sec", ["Three stretches", "Breathe deeply"]],
    ["Drink water and note the workout", "Hydrate and tick it off — it counts whether it felt big or not.", "<30 sec", ["Log in the app", "Tell someone"]],
  ],
});

A.push({
  category: "exercise",
  pattern: (o) => `Go for ${o}`,
  objects: ["a walk around the block", "a walk to the shops", "a 20-minute walk", "a morning walk", "an evening walk", "a lunchtime walk", "a beach walk", "a park walk", "a light jog", "a 20-minute jog", "a run around the oval", "a bike ride", "a dog walk", "a walk with a podcast"],
  steps: [
    ["Get your shoes on for {o}", "Shoes on is 80% of the decision made.", "<60 sec", ["Slides are fine", "Just stand outside first"]],
    ["Fill your water bottle", "Small bottle, in hand — no coming back mid-walk.", "<30 sec", ["Skip the bottle", "Sip from the tap first"]],
    ["Set your route for {o}", "Decide the loop or destination so there's no negotiating later.", "<20 sec", ["Just go left", "Follow the footpath"]],
    ["Step outside and start {o}", "Door shut behind you — now you're already doing it.", "<20 sec", ["To the letterbox first", "One street only"]],
    ["Find your rhythm in {o}", "Settle into an easy pace; the first five minutes feel worst.", "<120 sec", ["Slow right down", "Count your steps"]],
    ["Pass the halfway point of {o}", "At halfway you're officially on the return leg.", "<60 sec", ["Shorten the loop", "Turn at any corner"]],
    ["Finish {o} and stretch", "Last few minutes easy, then a calf and hamstring stretch.", "<60 sec", ["Skip the stretch", "Two stretches only"]],
    ["Log or note {o}", "A tick in the app or calendar — proof it happened.", "<20 sec", ["Screenshot the route", "Tell someone"]],
  ],
});

// ---------------------------------------------------------------- errands
A.push({
  category: "errands",
  pattern: (o, t) => `Go to ${o} to get ${t}`,
  objects: ["the supermarket", "the chemist", "the post office", "the hardware store", "the bakery", "the bottle shop", "the library", "the newsagent", "the pet store", "the nursery", "the op shop", "the mall", "the bank branch", "the tyre shop"],
  topics: ["milk and bread", "a birthday card", "a house key cut", "medicine", "painkillers", "light bulbs", "screws and wall plugs", "a parcel posted", "a book reserved", "dog food", "potting mix", "a gift", "cash", "printing done", "a passport photo"],
  steps: [
    ["Check the opening hours for {o}", "Two minutes online saves a wasted trip.", "<30 sec", ["Call them", "Just go and see"]],
    ["Write your exact list for {o}", "One line per item — this prevents the second trip.", "<30 sec", ["Three items max", "Photo of the list"]],
    ["Grab your wallet, bag and keys", "Phone, payment, and a bag for carrying it all back.", "<30 sec", ["Card only", "Pocket check"]],
    ["Leave for {o} now", "Out the door before anything else grabs your attention.", "<20 sec", ["Set a leaving alarm", "Walk instead of drive"]],
    ["Head to the items at the back of {o}", "Back aisles first, grab as you pass — no aisle wandering.", "<120 sec", ["Ask a staff member", "Two items only"]],
    ["Check the list in {o}", "Tick each item off before checkout, not after.", "<30 sec", ["Photo the trolley", "Recite from memory"]],
    ["Pay and pack at {o}", "Checkout, straight into the bag, receipt glanced.", "<60 sec", ["Self-serve", "No receipt"]],
    ["Head straight home from {o}", "No detours — the errand ends when the stuff is put away.", "<30 sec", ["One bonus stop", "Walk the long way"]],
    ["Put the purchases away", "Everything to its place now, not on the bench.", "<60 sec", ["Kitchen items only", "Leave on the counter"]],
  ],
});

A.push({
  category: "errands",
  pattern: (o) => `Do the ${o}`,
  objects: ["weekly grocery shop", "big grocery shop", "online grocery order", "op shop donation drop-off", "laundry", "bed linen wash", "ironing basket", "dishwasher run", "car wash", "pet grooming", "lawn mowing", "letterbox check", "parcel collection", "store return", "prescription pickup", "water refill", "fuel top-up", "toll account top-up"],
  steps: [
    ["Set up everything for the {o}", "List, bags, money or machine loaded — ready before you begin.", "<60 sec", ["Gather two things", "Do a mini version"]],
    ["Start the {o} without delay", "Begin the moment you're set up — no last scroll.", "<30 sec", ["Timer on", "Just start badly"]],
    ["Work through the {o} in one pass", "Aisle by aisle or piece by piece — don't backtrack.", "<300 sec", ["Half now, half later", "Skip the extras"]],
    ["Handle the tricky item in the {o}", "The one you've been avoiding — do it while you're in motion.", "<120 sec", ["Do a simpler version", "Ask for help"]],
    ["Check off the list for the {o}", "Quick scan: anything forgotten or missing?", "<30 sec", ["Check three items", "Skip the check"]],
    ["Finish and pay or pack the {o}", "Complete the transaction or load the machine.", "<60 sec", ["Contactless payment", "Quick cycle"]],
    ["Put everything from the {o} away", "Home for everything within ten minutes of arriving.", "<120 sec", ["Fridge items first", "Half now"]],
    ["Note what to restock from the {o}", "Jot anything you ran out of so next time is easy.", "<30 sec", ["One item", "Voice note"]],
  ],
});

A.push({
  category: "errands",
  pattern: (o) => `Pay the ${o}`,
  objects: ["electricity bill", "gas bill", "water bill", "internet bill", "phone bill", "credit card statement", "rent payment", "council rates", "car registration", "insurance premium", "health insurance", "school fees", "strata levy", "vet invoice", "medical bill", "parking fine", "toll invoice", "subscription renewal", "gym membership", "trade invoice"],
  steps: [
    ["Find the {o} notice or invoice", "Locate the bill — paper or email — and open it.", "<60 sec", ["Search your email", "Check the app"]],
    ["Check the amount and due date", "Confirm what's owed and when, out loud.", "<30 sec", ["Glance at the total", "Note the date only"]],
    ["Open your banking app", "Log in and get to the pay screen.", "<45 sec", ["Use stored card", "Use BPAY reference"]],
    ["Enter the payment details for the {o}", "BPAY or account details exactly as printed.", "<60 sec", ["Copy from the bill", "Scan the barcode"]],
    ["Double-check the reference number", "Wrong references send money nowhere — one re-read.", "<20 sec", ["Screenshot before paying", "Ask someone to check"]],
    ["Pay the {o}", "Confirm and send it.", "<30 sec", ["Schedule for due date", "Pay half now"]],
    ["Save the receipt for the {o}", "Screenshot or file the confirmation where you keep bills.", "<20 sec", ["Screenshot only", "Skip it"]],
    ["Note the {o} is paid", "Tick it off any bill list so it doesn't nag you.", "<15 sec", ["Delete the reminder", "Tell the household"]],
  ],
});

A.push({
  category: "errands",
  pattern: (o) => `Book the ${o}`,
  objects: ["doctor's appointment", "dentist check-up", "haircut", "car service", "eye test", "physio session", "massage", "flights", "hotel room", "restaurant table", "vaccination", "counselling session", "vet visit", "driving lesson", "podiatry appointment", "skin check"],
  steps: [
    ["Pick two possible times for the {o}", "Check your calendar and hold two windows that work.", "<60 sec", ["One time only", "Anytime this week"]],
    ["Find the booking channel for the {o}", "Online portal, app or phone number — pick the fastest.", "<30 sec", ["Google it", "Text them"]],
    ["Start the booking for the {o}", "Open the page or dial the number — no more research.", "<30 sec", ["Bookmark for later", "Ask someone to book"]],
    ["Take the earlier slot for the {o}", "The sooner the better; later slots never survive.", "<30 sec", ["Ask for cancellations", "Take any slot"]],
    ["Confirm the details of the {o}", "Date, time, address, cost — read them back once.", "<30 sec", ["Screenshot the confirmation", "Add a note"]],
    ["Put the {o} in your calendar", "With travel time and a reminder the day before.", "<45 sec", ["Default reminder only", "Ask the app to remind"]],
    ["Set the prep reminder for the {o}", "Anything to bring or do beforehand — one reminder covers it.", "<30 sec", ["Skip if nothing to bring", "Note it in the calendar entry"]],
  ],
});

A.push({
  category: "errands",
  pattern: (o) => `Fill in the ${o}`,
  objects: ["tax return", "medicare claim", "insurance claim form", "rental application", "job application form", "passport renewal form", "licence renewal", "school enrolment form", "patient intake form", "lease renewal", "change-of-address form", "government form", "rebate application", "expense claim", "leave application", "council permit form"],
  steps: [
    ["Find the {o}", "Get the actual form or website open in front of you.", "<45 sec", ["Search your email", "Bookmark it"]],
    ["List what the {o} needs from you", "Scan for IDs, reference numbers, documents required.", "<60 sec", ["Note the top three", "Start anyway"]],
    ["Gather the documents for the {o}", "ID, payslips, statements — whatever it listed, in one pile.", "<120 sec", ["One document at a time", "Use photos of documents"]],
    ["Fill the easy fields of the {o}", "Name, address, contacts — the reflex answers first.", "<60 sec", ["Type fast, fix later", "Autofill first"]],
    ["Work through the hard section of the {o}", "The numbers and declarations — take them one at a time.", "<180 sec", ["Skip and return", "Ask in their live chat"]],
    ["Attach or upload documents to the {o}", "Scan or photograph, correct format, right section.", "<60 sec", ["PDF photos", "Skip optional uploads"]],
    ["Re-read the {o} before submitting", "One pass checking names, dates and totals.", "<60 sec", ["Check page one only", "Read aloud"]],
    ["Submit the {o}", "Send it — and screenshot the confirmation page.", "<30 sec", ["Save draft first", "Email it instead"]],
    ["File the {o} confirmation", "Reference number saved where you'll find it in three months.", "<30 sec", ["Screenshot to photos", "Write it on paper"]],
  ],
});

A.push({
  category: "errands",
  pattern: (o) => `Cancel ${o}`,
  objects: ["a streaming subscription", "the gym membership", "a software subscription", "the newspaper delivery", "a meal kit delivery", "an app store subscription", "the storage unit", "an unused domain", "a magazine subscription", "a premium membership", "duplicate insurance", "an old credit card", "the landline", "a free trial before it charges"],
  steps: [
    ["Find the account page for {o}", "Log in and locate subscription or billing settings.", "<60 sec", ["Search help pages", "Use the app"]],
    ["Locate the cancel option for {o}", "It's usually buried — billing, plan, then cancel.", "<60 sec", ["Search 'cancel'", "Use their chat bot"]],
    ["Choose the cancel reason honestly", "Pick any reason and continue; it's a survey, not a negotiation.", "<30 sec", ["Skip the survey", "Choose 'too expensive'"]],
    ["Confirm the {o} cancellation", "Click the final confirm and read the end date.", "<30 sec", ["Screenshot the page", "Note the date"]],
    ["Check for a confirmation email for {o}", "Verify it actually cancelled — don't trust the screen alone.", "<30 sec", ["Search your inbox", "Set a check reminder"]],
    ["Diary the end date of {o}", "Note when the final charge stops so nothing surprises you.", "<20 sec", ["Set a reminder", "Trust the email"]],
  ],
});

// ---------------------------------------------------------------- creative
A.push({
  category: "creative",
  pattern: (o) => `Make a ${o} card`,
  objects: ["birthday", "greeting", "Korean New Year", "thank you", "get well", "congratulations", "new baby", "wedding", "farewell", "anniversary", "Christmas", "mother's day", "father's day", "graduation", "housewarming"],
  steps: [
    ["Choose the message for the {o} card", "One heartfelt line — write it before any decorating.", "<45 sec", ["Copy a famous quote", "Say it out loud first"]],
    ["Gather card materials", "Card stock, scissors, glue and pens on one cleared table.", "<60 sec", ["Paper only", "Digital card instead"]],
    ["Fold and cut the {o} card base", "One clean fold; trim the edges straight.", "<60 sec", ["Use a pre-folded card", "A5 size"]],
    ["Practise the front title", "Sketch the front lettering on scrap paper once.", "<45 sec", ["Pencil it directly", "Use stamps or stickers"]],
    ["Design the front of the {o} card", "Title plus one motif — keep the front bold and simple.", "<180 sec", ["Two colours only", "One shape only"]],
    ["Write the inside message of the {o} card", "Your chosen line, written slowly and warmly.", "<90 sec", ["Pencil guide lines first", "Keep it to one line"]],
    ["Add one personal touch to the {o} card", "An inside joke, a photo corner or a pressed detail.", "<60 sec", ["A small doodle", "Skip this step"]],
    ["Check the {o} card for smudges", "Hold it at arm's length; fix any wobbles now.", "<30 sec", ["Fix one spot", "Leave the charm"]],
    ["Sign and date the {o} card", "Your name and today's date small in a corner.", "<20 sec", ["Initials only", "Skip the date"]],
    ["Envelope and address the {o} card", "Into an envelope, addressed, ready to send or give.", "<45 sec", ["Hand it as is", "Sticker the envelope"]],
  ],
});

A.push({
  category: "creative",
  pattern: (o) => `Work on your ${o}`,
  objects: ["sketch", "painting", "song demo", "short story", "poem", "podcast episode", "video edit", "photo shoot plan", "novel chapter", "comic page", "logo design", "app wireframe", "knitting project", "ceramics piece", "screenplay scene"],
  steps: [
    ["Set up your space for the {o}", "Tools out, references visible, phone face-down.", "<45 sec", ["Two tools only", "Work standing"]],
    ["Review where the {o} left off", "Look at the last version for one minute — no judging.", "<60 sec", ["Screenshot it", "Read your last note"]],
    ["Set one micro-goal for the {o}", "One improvement this session: a line, a colour, a cut.", "<30 sec", ["Pick the easiest fix", "Set a 15-minute box"]],
    ["Start with the easiest fix in the {o}", "The smallest visible improvement first — build motion.", "<120 sec", ["Do it badly first", "Trace or rough it"]],
    ["Do a focused work burst on the {o}", "One timer, one task, nothing else open.", "<600 sec", ["Five minutes", "Two short bursts"]],
    ["Step back and look at the {o}", "Three paces back or zoom out — see it whole.", "<30 sec", ["Squint at it", "Flip it horizontally"]],
    ["Make one bold change to the {o}", "The change you keep avoiding — try it, it's reversible.", "<120 sec", ["Duplicate layer first", "Try for 60 seconds"]],
    ["Save and version the {o}", "Save a copy with today's date before finishing.", "<20 sec", ["Auto-save check", "Export a JPEG too"]],
    ["Note the next step for the {o}", "Write tomorrow's first move so re-entry is instant.", "<30 sec", ["Voice note", "One keyword"]],
  ],
});

// ---------------------------------------------------------------- garden, car, pets, tech
A.push({
  category: "cleaning",
  pattern: (o) => `Tend the ${o}`,
  extraTokens: ["water", "watering", "feed", "fertilise", "prune"],
  objects: ["garden bed", "tomato plants", "herb pots", "rose bushes", "fruit trees", "vegetable patch", "balcony plants", "hedge", "lawn edges", "strawberry patch", "succulents", "indoor monstera", "orchids", "fern shelf", "citrus tree", "compost bin", "worm farm", "raised planter"],
  steps: [
    ["Assess the {o} for a minute", "Walk up, look closely — dry soil, yellow leaves, weeds?", "<60 sec", ["Just look at the leaves", "Touch the soil"]],
    ["Water the {o} properly", "Deep, slow water at the base — not a sprinkle.", "<120 sec", ["Water the driest spot", "Use the watering can"]],
    ["Pull the weeds around the {o}", "Ten biggest weeds, roots and all.", "<120 sec", ["Five weeds", "One patch"]],
    ["Trim the dead growth on the {o}", "Snip anything brown or broken — sharp clean cuts.", "<120 sec", ["Three snips", "Pinch with fingers"]],
    ["Feed the {o}", "A handful of compost or a measured scoop of fertiliser.", "<60 sec", ["Half dose", "Compost only"]],
    ["Top up the mulch on the {o}", "A layer around the base keeps moisture in.", "<120 sec", ["One bucket of mulch", "Skip if recently mulched"]],
    ["Check for pests on the {o}", "Under a few leaves — squish or spray what you find.", "<60 sec", ["Check one plant", "Spray water only"]],
    ["Clean and store the {o} tools", "Rinse secateurs and gloves, back on the hook.", "<60 sec", ["Rinse the secateurs", "Leave them to dry"]],
    ["Wash your hands and note the {o}", "Done for now — note what it needs next time.", "<30 sec", ["Voice note", "Remember it"]],
  ],
});

A.push({
  category: "cleaning",
  pattern: (o) => `Do the ${o} check`,
  objects: ["car tyre pressure", "car oil level", "car coolant", "car windscreen washer", "car lights", "wiper blades", "car battery terminals", "smoke alarm", "first aid kit", "fire extinguisher", "power board safety", "tap washers", "hot water system", "pool chlorine", "bike brakes", "bike tyre pressure"],
  steps: [
    ["Get the tools for the {o} check", "Gauge, torch or manual — whatever the check needs.", "<60 sec", ["Phone torch", "Search the how-to first"]],
    ["Set up safely for the {o} check", "Flat ground, engine off, or ladder steady — safety first.", "<60 sec", ["Two minutes extra", "Get someone to help"]],
    ["Run the {o} check", "Follow the simple check exactly — read, measure, look.", "<120 sec", ["Check the front only", "Watch a 1-minute video"]],
    ["Note the {o} result", "Whatever the reading, write it down before moving on.", "<30 sec", ["Photo the gauge", "Tell someone"]],
    ["Fix the small thing the {o} found", "Top up, tighten or replace if it's a five-minute fix.", "<120 sec", ["Schedule instead", "Buy the part first"]],
    ["Book follow-up for the {o} if needed", "If it needs a professional, book it now while it's fresh.", "<60 sec", ["Search a number", "Set a reminder"]],
    ["Put the tools away from the {o}", "Everything back in its drawer or kit.", "<30 sec", ["Bin the rags", "Leave the torch out"]],
  ],
});

A.push({
  category: "cleaning",
  pattern: (o) => `Care for the ${o}`,
  objects: ["dog", "cat", "puppy", "kitten", "rabbit", "guinea pig", "bird", "chickens", "fish tank", "dog's coat", "dog's teeth", "cat's litter routine", "dog's paws", "pet's medication", "new pet arrival"],
  steps: [
    ["Check the {o} is calm and safe", "A quick look — fed, watered, comfortable?", "<30 sec", ["One glance", "Pick them up"]],
    ["Refresh the {o}'s water", "Empty, rinse, refill — clean water right now.", "<45 sec", ["Top up only", "Move the bowl"]],
    ["Feed the {o} the right amount", "Measure the serving; no extra treats mid-task.", "<45 sec", ["Half portion if unsure", "Follow the pack guide"]],
    ["Give the {o} a quick health check", "Eyes, ears, coat, paws — thirty gentle seconds.", "<60 sec", ["Check the eyes only", "Stroke while checking"]],
    ["Do one grooming task for the {o}", "Brush, wipe paws or trim — the one most needed.", "<120 sec", ["One minute of brushing", "Just the knots"]],
    ["Give the {o} attention or play", "Five minutes of play or a walk — connection matters.", "<300 sec", ["Two minutes of play", "Sit together"]],
    ["Tidy the {o}'s space", "Bed, blanket or area straightened and fur-free.", "<60 sec", ["Shake the bed out", "One corner"]],
    ["Note anything odd about the {o}", "Limp, sneeze or appetite change — jot it for the vet.", "<30 sec", ["One keyword note", "Skip if all normal"]],
  ],
});

A.push({
  category: "work",
  pattern: (o) => `Fix the ${o}`,
  objects: ["wifi dropouts", "slow laptop", "full phone storage", "phone battery drain", "printer jam", "bluetooth headphones pairing", "email sync problem", "app crash loop", "slow home internet", "smart tv connection", "door squeak", "leaking tap", "running toilet", "stuck window", "wobbly chair", "flat bike tyre", "broken zipper", "patchy lawn", "dripping shower head", "remote control issue"],
  steps: [
    ["Describe the {o} in one sentence", "When it happens, what changes — write it as one clear line.", "<30 sec", ["Say it out loud", "Voice memo"]],
    ["Search the {o} for the known fix", "One search: the symptom plus 'fix' — read the top result.", "<120 sec", ["Watch one video", "Ask a friend first"]],
    ["Try the simplest fix for the {o}", "Restart, reboot, replug — the classic for a reason.", "<60 sec", ["Turn it off and on", "Check the cables"]],
    ["Work the first real step for the {o}", "Follow the guide's step one exactly — no skipping.", "<120 sec", ["Do it slowly", "Screenshot each step"]],
    ["Test whether the {o} improved", "Try it the way it normally fails.", "<60 sec", ["Wait and watch", "Ask someone to test"]],
    ["Take the next step for the {o}", "Step two from the guide — stop if it worsens.", "<120 sec", ["Do half the step", "Undo if unsure"]],
    ["Decide: done, later or pro for the {o}", "If two steps didn't fix it, schedule a professional — that's a decision, not a defeat.", "<30 sec", ["Set a reminder to retry", "Ask on a forum"]],
    ["Clean up after the {o}", "Tools away, mess gone, cables tidied.", "<60 sec", ["Bin the packaging", "Tidy tomorrow"]],
  ],
});

A.push({
  category: "work",
  pattern: (o) => `Back up and update the ${o}`,
  objects: ["phone", "laptop", "tablet", "desktop computer", "photo library", "important documents folder", "password manager", "router firmware", "smart watch", "external hard drive", "cloud sync", "browser", "operating system"],
  steps: [
    ["Check free space on the {o}", "Updates need room — see what's available first.", "<30 sec", ["Delete three files now", "Check later"]],
    ["Start the {o} backup", "Cloud sync or plug in the drive — begin before updating.", "<60 sec", ["Photos only", "Quick partial backup"]],
    ["Wait for the {o} backup to finish", "Stay near it; don't start anything else big.", "<120 sec", ["Do a light task", "Set a timer"]],
    ["Verify the {o} backup", "Open one backed-up file from the destination to confirm it's real.", "<30 sec", ["Check the file count", "Trust the green tick"]],
    ["Install the {o} update", "Start the update and let it run undisturbed.", "<120 sec", ["Overnight schedule", "Skip minor updates"]],
    ["Restart the {o}", "One clean restart to settle everything.", "<60 sec", ["Restart later today", "Skip restart"]],
    ["Spot-check the {o} after update", "Open your two most-used apps and confirm they work.", "<60 sec", ["One app check", "Log in once"]],
  ],
});

// ---------------------------------------------------------------- personal
A.push({
  category: "errands",
  pattern: (o) => `Pack for ${o}`,
  objects: ["the weekend away", "the beach", "the camping trip", "the business trip", "the flight tomorrow", "the gym bag", "the kids' day out", "the hike", "the snow trip", "the hospital bag", "the overnight stay", "the road trip"],
  steps: [
    ["Check the weather for {o}", "One forecast check sets the whole list.", "<30 sec", ["Pack for both", "Ask a local"]],
    ["List the activities for {o}", "What will you actually do? The list follows the plan.", "<30 sec", ["Two activities", "Last trip's list"]],
    ["Lay out the clothes for {o}", "Every outfit on the bed, including one spare.", "<60 sec", ["Half the clothes", "Roll, don't fold"]],
    ["Pack the toiletries for {o}", "Small sizes only, in one bag.", "<45 sec", ["Basics only", "Use hotel supplies"]],
    ["Pack the tech for {o}", "Chargers, power bank, adapters in one pouch.", "<45 sec", ["One charger", "Skip the power bank"]],
    ["Add the documents for {o}", "ID, tickets, booking numbers in one place.", "<30 sec", ["Screenshots", "Wallet only"]],
    ["Pack the medical kit for {o}", "Painkillers, plasters, prescriptions.", "<30 sec", ["One strip of tablets", "Skip it"]],
    ["Do the final {o} bag check", "List against bag, item by item, once.", "<45 sec", ["Phone the list", "Trust the pile"]],
  ],
});

A.push({
  category: "errands",
  pattern: (o, t) => `Choose a gift for ${o} for ${t}`,
  objects: ["your partner", "your mum", "your dad", "a close friend", "your sister", "your brother", "a work colleague", "your child's teacher", "your boss", "a neighbour", "your in-laws"],
  topics: ["their birthday", "Christmas", "a farewell", "a new baby", "an anniversary", "a thank you", "a get well", "a graduation", "a housewarming", "a new job"],
  steps: [
    ["Recall what {o} mentioned wanting", "Anything they said in passing recently — that's gold.", "<60 sec", ["Text a family member", "Check their wishlist"]],
    ["Set your budget for {o}'s gift", "A number decided now keeps browsing sane.", "<20 sec", ["Round number", "Half your first instinct"]],
    ["List three interest clues for {o}", "Hobbies, shows, foods, teams — three nouns.", "<60 sec", ["One clue", "Ask a friend"]],
    ["Search shops for {o} gift ideas", "One targeted search: clue + gift + budget.", "<120 sec", ["One marketplace only", "Ask for suggestions"]],
    ["Shortlist two options for {o}", "Two tabs, side by side, pick the warmer one.", "<60 sec", ["One option", "Ask someone to pick"]],
    ["Check delivery time for {o}'s gift", "Will it arrive in time? If not, pick the runner-up.", "<30 sec", ["Choose express", "Buy a backup card"]],
    ["Order the gift for {o}", "Buy it now — good today beats perfect next week.", "<60 sec", ["Gift card instead", "Pay and close"]],
    ["Write the card message for {o}", "One genuine line about why they matter.", "<60 sec", ["Short and warm", "Write it at handover"]],
  ],
});

A.push({
  category: "errands",
  pattern: (o, t) => `Call ${o} about ${t}`,
  objects: ["the bank", "the insurer", "the landlord", "the internet provider", "the energy company", "the council", "the doctor's office", "the school", "the mechanic", "the real estate agent", "the tax office", "the utility company"],
  topics: ["a billing error", "an appointment", "a price reduction", "a repair request", "a claim status", "a late payment", "an address change", "a plan upgrade", "a complaint", "a refund", "a booking change", "an account update"],
  steps: [
    ["Write the one outcome for the call to {o}", "What should be true after the call? One line.", "<30 sec", ["Bullet it", "Rehearse out loud"]],
    ["Gather your account details for {o}", "Account number, recent bill, dates — on the desk.", "<60 sec", ["Screenshot the bill", "Open the app"]],
    ["Draft your first sentence for {o}", "The exact opening: issue, date, what you want.", "<45 sec", ["Write two sentences", "Use their greeting first"]],
    ["List your evidence for the {o} call", "Facts, dates, amounts — numbers persuade.", "<60 sec", ["Three facts", "Skip the extras"]],
    ["Dial {o}", "Call now — before the courage evaporates.", "<30 sec", ["Request a callback", "Use online chat instead"]],
    ["State the {t} issue in one breath", "Opening line, then stop and let them respond.", "<60 sec", ["Slow down", "Ask for their name"]],
    ["Ask for the fix and a reference", "Get the outcome plus a reference number or name.", "<60 sec", ["Ask for escalation", "Request an email confirmation"]],
    ["Note the call outcome for {o}", "Time, name, reference, what happens next — written down.", "<45 sec", ["Voice memo", "Email yourself"]],
    ["Set the follow-up reminder for {t}", "If they promised action by a date, diary the check.", "<30 sec", ["One reminder", "Trust them"]],
  ],
});

A.push({
  category: "work",
  pattern: (o, t) => `Plan ${t}`,
  objects: [null],
  topics: ["a birthday party", "a dinner party", "a weekend trip", "a baby shower", "a team offsite", "a garage sale", "a family reunion", "a movie night", "a graduation celebration", "a farewell party", "a barbecue", "a picnic"],
  steps: [
    ["Pick the date for {t}", "One date, held in the calendar before anything else.", "<30 sec", ["Two options", "Poll the group"]],
    ["Set the guest list for {t}", "Names in a list — the number shapes everything else.", "<60 sec", ["Shortlist ten", "Count only"]],
    ["Set the budget for {t}", "Total number first, then split it roughly.", "<30 sec", ["Half the budget", "Per-head budget"]],
    ["Choose the venue or home for {t}", "Where it happens — book or decide today.", "<60 sec", ["Home is fine", "Shortlist two"]],
    ["Plan the food and drink for {t}", "Menu or caterer, matched to the headcount.", "<60 sec", ["One simple dish", "Everyone brings one"]],
    ["Send the invitations for {t}", "Group message or event link — today, not later.", "<60 sec", ["Message five first", "Use an event page"]],
    ["List the supplies for {t}", "Decorations, cups, ice, playlist — one shopping list.", "<45 sec", ["Ten items max", "Skip decorations"]],
    ["Set the day-before prep for {t}", "What can be done ahead? Diary those two things.", "<30 sec", ["One prep task", "Delegate one"]],
  ],
});

export const ARCHETYPES = A;

// Total concrete tasks the library expands into.
export const ARCHETYPE_TASK_COUNT = A.reduce(
  (n, arch) => n + arch.objects.length * (arch.topics?.length || 1),
  0
);
