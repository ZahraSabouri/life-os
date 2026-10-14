// The Guide's words, written for the person using Life OS. Each chapter is one part of Life OS,
// shown on a page of its own; each step says what to do and shows it:
// with a picture taken from the running app (`image`), or with a diagram drawn by the page
// (`figure`). `marks` name the numbered circles drawn on a picture, in order.
// The pictures are taken by scripts/guide-shots.mjs, which has one recipe for every `image`
// named here. Plain data: the page reads it, and so does the script.
export const CHAPTERS = [
  {
    id: 'big-picture', title: 'The big picture', intro: 'Life OS is one place over four apps. Each app keeps its own records; Life OS gathers them into one day, one calendar and one review.',
    steps: [
      { title: 'How the parts fit together', figure: 'map', text: 'The four apps on the left keep what belongs to them. What matters today flows into the pages of Life OS on the right. You can add and change things on either side.' },
      { title: 'A day with Life OS', figure: 'day', text: 'A way to use it from morning to night. None of it is required; each step is one click from the top bar.' },
      { title: 'Where to add what', figure: 'where', text: 'Everything in Life OS can be added by hand. This is where each kind of thing is added, and where it shows afterwards.' },
    ],
  },
  {
    id: 'top-bar', title: 'Finding your way', intro: 'The bar at the top is on every page. Everything in Life OS is one click from it.',
    steps: [
      { title: 'The top bar', image: 'topbar.jpg', marks: ['“Life OS” goes to the Court from anywhere', 'The pages of Life OS itself: Court, Today, Calendar, Review, Journal, People', 'The four apps inside', 'The bell: notices from every part', 'Focus: the timer', 'This Guide', 'Style, and Light or Dark', 'Divan: the opening page'], text: 'On a narrower window the date steps aside and Style and Light/Dark show only their marks, so the bar stays on one line.' },
      { title: 'The strip under the bar', image: 'strip.jpg', text: 'Inside one of the four apps, a strip says what matters there today: what is due, what closes, what is next. Its first line is a link to the thing it names. “The whole day” on its right opens Today.' },
    ],
  },
  {
    id: 'court', title: 'The Court', intro: 'The Court is the front page. It looks ahead; the day itself is on Today.',
    steps: [
      { title: 'The whole page', image: 'court.jpg', marks: ['One line to add a plan, a note or something to buy', '“Ahead”: the next two weeks, day by day'], text: 'Open it by clicking “Life OS” or “Court” in the top bar.' },
      { title: 'Add something in one line', image: 'court-add.jpg', marks: ['Plan, Note or To buy', 'Type it: “17:30 library”, “Lidl”, “dinner at 8pm”', 'The day, how often, and the area it belongs to', 'What will be saved, said back to you before you press Add'], text: '“To buy” puts things on your shopping list in Budget: “eggs, rice, 2 kg onions” becomes three lines.' },
      { title: 'A plan that repeats', image: 'court-repeat.jpg', text: 'Under “repeat” choose every day, weekdays, one weekday, or “the days you choose” and tick them. “until” is the last day; leave it empty for no end. Each day of it can still be ticked or taken off by itself.' },
      { title: 'Ahead', image: 'court-ahead.jpg', text: 'Each day shows up to four things: tests and deadlines, jobs that close, your own dated plans. Click a day to open it in Today; click a thing to open it where it lives.' },
    ],
  },
  {
    id: 'today', title: 'Today', intro: 'Today is the working page: the day in order on the left, and Study, Jobs, Home and Notes beside it.',
    steps: [
      { title: 'The whole page', image: 'today.jpg', marks: ['A day back, today, a day forward, or any date', 'The add line, for this day', 'Your day in order', 'Study', 'Jobs'], text: 'Every other day has the same page: the buttons at the top move between days. Home and Notes are further down.' },
      { title: 'Your day, in order', image: 'today-path.jpg', marks: ['When it starts and ends', 'The steps of the study card: tick one here and the Study hub has it too', '“Card done” finishes the whole card'], text: 'Things with a time come first, with a line at “now”. Then “Any time today”, then “Also today” (deadlines and all-day things).' },
      { title: 'Change one of your own plans', image: 'today-change.jpg', text: 'Under a plan of yours: “Done” ticks it, “Change” opens its title, day, clock time, state and area right there, “Take off the day” removes it from the day. One day of a repeating plan opens the repeating plan and says so.' },
      { title: 'Study', image: 'today-study.jpg', text: 'The days to the next test, how many cards are done before it, and the cards due today. A card’s title opens that card in the Study hub.' },
      { title: 'Jobs', image: 'today-jobs.jpg', marks: ['How many jobs to apply for now', 'A job’s title opens it in JobMap', '“I applied” marks it applied in JobMap with today’s date. The line that confirms it has Undo'], text: 'The jobs are in JobMap’s own order, with the ones that close today first.' },
      { title: 'Home', image: 'today-home.jpg', text: 'Your shopping lists from Budget, with real tick boxes. Ticking needs no price. Under them: what you eat today and what is at home.' },
    ],
  },
  {
    id: 'planner', title: 'Plan the week', intro: 'Seven days side by side. Open it from Review (“Plan this week”) or from Today.',
    steps: [
      { title: 'The week', image: 'planner.jpg', marks: ['Today’s column, with its study time and job time added up', 'Type here to add a plan to that day', '⋯ on a plan of yours opens its menu'], text: 'Drag one of your own plans to another day to move it. Study blocks are moved in the Study hub’s planner. Repeating plans are listed under the week.' },
      { title: 'A plan’s menu', image: 'planner-menu.jpg', text: 'Done, Change, Take off, or move it to a day you choose.' },
      { title: 'Repeating plans', image: 'planner-repeating.jpg', text: 'Everything that comes round is listed under the week. “Change” opens its days, clock time, first and last day. “Stop after today” ends it; days already ticked stay.' },
    ],
  },
  {
    id: 'calendar', title: 'Calendar', intro: 'Every dated thing from every part in one calendar.',
    steps: [
      { title: 'One calendar for everything', image: 'calendar.jpg', marks: ['Month, a list (“Agenda”), or the week', 'What each kind of mark means'], text: 'Study blocks, classes, tests, job deadlines, time set aside, your plans, Cardiff events you chose or added, and renewals from Budget. Click a thing to open it where it lives.' },
      { title: 'Add an event to the calendar', image: 'calendar-add.jpg', text: 'On the Calendar page, “Add a Life OS event” takes a title and a day: a trip, a seminar, an appointment, a date to remember. A plan with a time added anywhere else (“dinner at 8pm”) is on the calendar too, and so is every birthday from People.' },
      { title: 'An area’s own page', image: 'room.jpg', text: 'Every area (Relationships, Travel, Home, Life admin and the rest) has a page: what is coming up, what has no day yet, what is done. A plan filed “under” an area shows here.' },
    ],
  },
  {
    id: 'journal', title: 'Journal', intro: 'A page for a day, in your own words, with a mood and pictures if you like.',
    steps: [
      { title: 'Write a page', image: 'journal.jpg', marks: ['The day the page is for (today, or an earlier day)', 'How it felt, in a word (optional)', 'The page itself', 'Add pictures from your computer or phone', 'Save the page'], text: 'Open Journal in the top bar. A page needs words or a picture, nothing more.' },
      { title: 'Read back, change, add pictures', image: 'journal-pages.jpg', text: 'Pages are listed by month, newest first. Under each page: “Change” (its words, mood and day), “Add pictures”, and “Remove”. Click a picture to see it large; “Remove this picture” is under the large picture. “Find” looks for words in any page.' },
      { title: 'All your pictures', image: 'journal-pictures.jpg', text: '“Pictures” shows every picture from every page, newest first, each with its day.' },
    ],
  },
  {
    id: 'people', title: 'People', intro: 'The people in your life, and what you want to remember about them.',
    steps: [
      { title: 'Add a person', image: 'people.jpg', marks: ['Only a name is needed', 'A birthday goes on your calendar every year', 'How you know them, and how to reach them', 'Notes: gift ideas, what they like'], text: 'Open People in the top bar.' },
      { title: 'Birthdays coming up, and everyone', image: 'people-list.jpg', text: '“Birthdays in the next two months” lists who is next and how old they turn. Under it is everyone, with “Change” and “Remove”. A birthday also shows on the Calendar, on Today, and in the bell on the day and the day before.' },
    ],
  },
  {
    id: 'review', title: 'Review', intro: 'One week looked back on across every part.',
    steps: [
      { title: 'The week in five tiles', image: 'review.jpg', marks: ['“The week” or “Analysis”', 'Move between weeks', 'Five figures, each compared with the week before'], text: 'Study cards done, time focused, applications sent, your plans done, and money.' },
      { title: 'Day by day, and what slipped', image: 'review-days.jpg', text: 'One row for each day with every measure in its own column. “What slipped” lists cards past their date, plans left unticked, and shortlisted jobs that closed without an application.' },
      { title: 'Eight weeks, and what you aim at', image: 'review-eight.jpg', text: 'Four small charts compare this week with the seven before it. “Set what you aim at” keeps a number of applications a week and hours of focus a day; the charts then show the aim as a line.' },
    ],
  },
  {
    id: 'analysis', title: 'Analysis', intro: 'On the Review page, the “Analysis” button looks at a longer stretch of days as data.',
    steps: [
      { title: 'Choose the days, read the statistics', image: 'analysis-stats.jpg', marks: ['4, 8, 12 or 26 weeks, or any two dates', 'Each measure: total, mean a day, median, standard deviation, best day, days with any'], text: 'Days still to come are left out of the statistics.' },
      { title: 'Plan against done', image: 'analysis-burn.jpg', text: 'Study cards due (the dashed line) and done (the solid line), added up day after day. The gap between them is how far behind or ahead you are. “The numbers” under any chart opens its table.' },
      { title: 'The shape of your week, and hours of the day', image: 'analysis-hours.jpg', text: 'The mean for each weekday, and a grid of weekday by hour. The buttons above the grid switch between study on the plan, time set aside for jobs, and time focused. Point at a square for its number.' },
      { title: 'Modules, jobs and money', image: 'analysis-jobs.jpg', text: 'Each module’s cards; the job pipeline from everything listed down to an offer, where leads come from, and closing dates ahead; spending by kind of thing and by shop.' },
      { title: 'Take the data', image: 'analysis-files.jpg', text: 'Five files: the days (one row a day), the days in tidy form, every job, every study card, and the whole page as JSON. They are made at the moment you click, from what each part holds.' },
    ],
  },
  {
    id: 'ledger', title: 'Ledger', intro: 'Everything you filed in Life OS itself: notes, plans, tasks, repeating plans, journal pages, meals. Open it from the Journal page.',
    steps: [
      { title: 'File and find', image: 'ledger.jpg', marks: ['Type here to file a note', 'Show one kind of entry, or find words', '“Change” and “Remove” on every entry'], text: 'The Ledger lists every entry, newest first, sixty at a time.' },
      { title: 'Change or remove an entry', image: 'ledger-change.jpg', text: '“Change” opens the entry in place: its title, text, day, clock time and state. “Remove” asks once more, then removes it for good.' },
    ],
  },
  {
    id: 'focus', title: 'Focus and notices', intro: 'A timer with sound for the whole app, and one bell for every part.',
    steps: [
      { title: 'Focus', image: 'focus.jpg', text: 'Click Focus in the top bar. Say what the time is for, choose the minutes, and start. It keeps running while you move between pages and apps. A study card can be chosen, and the time is then added to that card. Sound: paste a link from YouTube or another site and it plays while you work.' },
      { title: 'The bell', image: 'notices.jpg', text: 'The bell lists what needs you from every part: what is on now or soon, tests coming, cards due tomorrow, cards that have waited too long, jobs closing, plans left over, money. The number on the bell is how many are new.' },
      { title: 'Notices when Life OS is not open', figure: 'notices', text: 'When Life OS is not open in your browser, Windows shows a small box in the corner of your screen. Clicking it opens Life OS. Life OS starts by itself when you sign in to Windows, so the notices come even after a restart. The switch for them is at the bottom of the bell’s panel.' },
    ],
  },
  {
    id: 'styles', title: 'Styles', intro: 'A style is a whole design, not only colours. The four apps inside follow the style you choose.',
    steps: [
      { title: 'Choose a style', image: 'styles.jpg', text: 'Click “Style” in the top bar and choose Madder, Indigo, Paper or Modern. Modern also has Light and Dark.' },
      { title: 'Madder', image: 'style-madder.jpg', text: 'Deep red ground, gold marks, a serif face.' },
      { title: 'Indigo', image: 'style-indigo.jpg', text: 'Night blue ground, with what is ahead in a rail at the side.' },
      { title: 'Paper', image: 'style-paper.jpg', text: 'A light page set like print.' },
      { title: 'Modern, dark', image: 'style-dark.jpg', text: 'The Modern style with the lights off.' },
    ],
  },
  {
    id: 'study', title: 'Study hub', intro: 'Your semester: modules, cards, timetable, tests, materials and the focus room.',
    steps: [
      { title: 'How study moves through Life OS', figure: 'study', text: 'A card is the unit of study. It gets time on the plan, its steps are ticked on Today or in the hub, and what happened shows in Review and Analysis.' },
      { title: 'It opens the running semester', image: 'study.jpg', marks: ['“Change semester” goes back to the list of semesters', 'The hub’s own menu', 'Add a card', 'The hub’s timer, sound and reminders'], text: 'The Study hub opens the semester that is running now.' },
      { title: 'Add a card', image: 'study-addcard.jpg', text: '“Add card” opens the form for a new study card: its title, module, dates, hours, steps and what “done” means.' },
      { title: 'A module’s own page', image: 'study-module.jpg', text: 'Each module in the menu has a page: its cards in order, its materials, its tests and what is next. Press a card to open it.' },
      { title: 'Columns: the cards as a board', image: 'study-board.jpg', text: 'Under “Board” in the hub’s menu, “Columns” shows every card in a column for what it is waiting on: to do, under way, waiting and done. Drag a card to another column to move it on. “Table” and “Week” show the same cards as a list and as a week.' },
      { title: 'Schedule', image: 'study-schedule.jpg', text: 'The day hour by hour: classes and study blocks. Click a block to open its card.' },
      { title: 'Planner', image: 'study-planner.jpg', text: 'The week’s study blocks. Move a study block here; Life OS’s own week planner shows them but does not move them.' },
      { title: 'Review', image: 'study-review.jpg', text: 'A day looked back on: what was planned, what was done, what slipped. Write what you learned before you close the day.' },
      { title: 'Progress', image: 'study-progress.jpg', text: 'How far each module is: cards done against cards planned, and the time spent.' },
      { title: 'Analytics', image: 'study-analytics.jpg', text: 'Study in numbers: time by module and by day, cards finished week by week, and where time went against the plan.' },
      { title: 'Rescue Lane: catching up', image: 'study-rescue.jpg', text: 'The cards that fell behind, in the order to catch up, oldest first in each module. Finish the top one, then the next.' },
      { title: 'Notes', image: 'study-notes.jpg', text: 'Your own notes for the semester, kept beside the cards and found by words.' },
      { title: 'Add classes, tests and materials yourself', image: 'study-setup.jpg', text: 'On “Semester setup” there are three lists: classes, tests and deadlines, and materials. Each has an add button at its top, and each row has “Change” and “Remove”. A find box narrows a long list.' },
    ],
  },
  {
    id: 'cardiff', title: 'Cardiff Life', intro: 'Events and communities in Cardiff: a researched list to choose from, and the events you add yourself.',
    steps: [
      { title: 'A week in Cardiff', image: 'cardiff.jpg', marks: ['The pages of Cardiff Life', 'Move between weeks', 'Add an event of your own', 'Show or hide what else is on'], text: '“Maybe” keeps an event open; “Plan to go” puts it in your plan and on the Life OS calendar.' },
      { title: 'Add my own event', image: 'cardiff-add.jpg', text: 'Only the name is needed; day, time, place, kind, cost, link and notes can be filled in later. It is kept in Life OS and shows on your calendar.' },
      { title: 'Change or remove it', image: 'cardiff-detail.jpg', text: 'Open an event you added to see “Change this event” and “Remove this event”. A note of your own can be kept with any event you chose.' },
      { title: 'All choices', image: 'cardiff-choices.jpg', text: 'Every event on the list, with filters by kind, date, source and price, and a search. “Saved” shows only what you chose.' },
      { title: 'Communities', image: 'cardiff-communities.jpg', text: 'Clubs, societies and groups worth knowing, each with a link.' },
    ],
  },
  {
    id: 'budget', title: 'Budget', intro: 'Money, shopping, food at home and receipts. Its own name is “Everyday”.',
    steps: [
      { title: 'My everyday', image: 'budget.jpg', marks: ['Budget’s own menu', 'The month being shown', 'Record a payment'], text: 'The first screen: what today and this week ask for.' },
      { title: 'Shopping lists', image: 'budget-shopping.jpg', marks: ['My lists, the catalogue, shops and receipts', 'Arrange the same things by list, category, shop, day, or all together', 'Type an item and press Enter. It needs no price', 'Turn a shopping trip into a receipt'], text: 'Tick a line when you have it.' },
      { title: 'By category', image: 'budget-category.jpg', text: 'The same shopping, grouped by kind of thing. “By shop” and “By day” work the same way.' },
      { title: 'The catalogue', image: 'budget-catalogue.jpg', text: 'Everything you have ever bought, with its category, usual shop and usual price. Choosing from it is quicker than typing a line again.' },
      { title: 'Shops', image: 'budget-shops.jpg', text: 'The shops you use. A line or a receipt can name its shop, and “By shop” then groups the list by where you will buy it.' },
      { title: 'Receipts', image: 'budget-receipts.jpg', text: 'Every receipt you recorded, with its shop, date and total. A receipt’s lines feed the food at home and the month’s spending.' },
      { title: 'Food & supplies', image: 'budget-food.jpg', text: 'What is at home, by place and by kind. “Add stock” records something you already have.' },
      { title: 'Meals & recipes', image: 'budget-meals.jpg', text: 'The meal plan and your recipes. “Add a meal” puts one on a day; what you eat today shows on Life OS’s Today.' },
      { title: 'Weekly history', image: 'budget-history.jpg', text: 'Each week looked back on: what you bought, what you ate, what you spent. Find a food, a meal or a supply by name.' },
      { title: 'Money & saving', image: 'budget-money.jpg', text: 'Payments to check, the month’s allowance, and what is set aside.' },
      { title: 'Settings & backups', image: 'budget-settings.jpg', text: 'Categories, shops, and “Export everything”, which saves a copy of all of Budget’s records.' },
    ],
  },
  {
    id: 'jobmap', title: 'JobMap', intro: 'Every job lead, in the order to act on them.',
    steps: [
      { title: 'A job from lead to answer', figure: 'job', text: 'Every job has one status. You set it in JobMap’s details, or with “I applied” and “Rejected” on Today.' },
      { title: 'The list', image: 'jobmap.jpg', marks: ['All jobs, your shortlist, applications, follow-ups, archive', 'Search roles, companies, skills and your notes', 'Filter by source, and by your own categories once you use them', 'The order of the list', '“To apply”: every role seen open. The other tabs widen or narrow it', 'The star puts a job on the shortlist'], text: 'Click a job to open its details on the right.' },
      { title: 'A job’s details', image: 'jobmap-details.jpg', text: 'Status (Applied, Interview, Rejected and the rest), your priority, the next step, a follow-up date and your notes. “My categories” takes your own words with commas between; each becomes a label on the job and a filter above the list.' },
      { title: 'Your application: files, folder and links', image: 'jobmap-application.jpg', text: '“Add files” keeps a copy of a file with the job: the CV you sent, the cover letter, the advert as a PDF. Under it: the folder with your files for this job (“Open folder” shows it on this computer) and your own links, one per line.' },
      { title: 'My documents: your CVs and earlier applications', image: 'jobmap-documents.jpg', marks: ['The folder where your CVs and applications are kept', 'Your main CV', 'What is in the folder: open folders, choose the main CV', 'Every job you applied for, or kept a CV, a file or a folder with'], text: 'Open “My documents” in JobMap’s menu. Connect the folder once; JobMap only reads it. On any job, “Keep a copy of my main CV with this job” then does it in one press.' },
      { title: 'Add a job yourself', image: 'jobmap-add.jpg', text: '“Add job” takes a role, a company and a link; the rest can be filled in later. It goes straight onto your shortlist.' },
      { title: 'Shortlist, Applications, Follow-ups', image: 'jobmap-shortlist.jpg', text: 'Shortlist: the jobs you starred. Applications: the ones you are preparing or have applied for. Follow-ups: the ones with a follow-up date, soonest first.' },
      { title: 'Archive', image: 'jobmap-archive.jpg', text: 'Jobs you set aside or were rejected from. They are kept, out of the way of the lists you work from; a job can be brought back by changing its status.' },
      { title: 'Preferences', image: 'jobmap-preferences.jpg', text: 'Your skills, what you lean towards (software or data) and the hours a week you want. JobMap’s “match” labels come from these.' },
    ],
  },
]

// Where "Open …" on a part's page leads: a page of the app, or one of the two panels of the top bar.
export const PART_OPENS = {
  'top-bar': ['/court', 'Open the Court'], court: ['/court', 'Open the Court'], today: ['/today', 'Open Today'], planner: ['/planner', 'Open Plan the week'],
  calendar: ['/calendar', 'Open the Calendar'], journal: ['/journal', 'Open the Journal'], people: ['/people', 'Open People'], review: ['/review', 'Open Review'],
  analysis: ['/review?view=analysis', 'Open Analysis'], ledger: ['/ledger', 'Open the Ledger'], focus: ['panel:focus', 'Open the timer'],
  study: ['/study', 'Open the Study hub'], cardiff: ['/cardiff-life', 'Open Cardiff Life'], budget: ['/budget', 'Open Budget'], jobmap: ['/jobmap', 'Open JobMap'],
}
// A step that has a place of its own, by its picture.
export const STEP_OPENS = {
  'notices.jpg': ['panel:notices', 'Open the bell'], 'focus.jpg': ['panel:focus', 'Open the timer'], 'room.jpg': ['/room/home', 'Open the Home area'],
  'study-schedule.jpg': ['/study#/schedule', 'Open the schedule'], 'study-planner.jpg': ['/study#/planner', 'Open the hub’s planner'], 'study-progress.jpg': ['/study#/progress', 'Open Progress'], 'study-setup.jpg': ['/study#/setup', 'Open Semester setup'],
  'review-eight.jpg': ['/review', 'Open Review'], 'analysis-files.jpg': ['/review?view=analysis', 'Open Analysis'], 'planner-repeating.jpg': ['/planner', 'Open Plan the week'],
}

// "How do I…?": the things people come to do, each answered in a few steps, with the picture that
// shows it and a button that goes to the place. `part` is the chapter that says more.
export const TASKS = [
  { id: 'add-plan', q: 'Add a plan for today or another day', part: 'court', open: ['/today', 'Do it on Today'], images: ['court-add.jpg'], steps: ['On the Court or Today, find the line at the top and keep “Plan” chosen.', 'Type it the way you would say it: “17:30 library”, “dinner at 8pm”, “Lidl”.', 'Under “for”, choose the day. Under “under”, choose the area it belongs to, if you like.', 'Press Add. It is on that day and on the calendar.'] },
  { id: 'repeat-plan', q: 'Make a plan that repeats every week', part: 'court', open: ['/today', 'Do it on Today'], images: ['court-repeat.jpg', 'planner-repeating.jpg'], steps: ['Type the plan in the add line, with its time: “18:00 gym”.', 'Under “repeat”, choose every day, weekdays, one weekday, or “choose days” and press the days.', '“until” is the last day; leave it empty for no end.', 'To change or stop it later: Plan the week → Repeating plans → Change, or Stop after today.'] },
  { id: 'to-buy', q: 'Put something on my shopping list', part: 'court', open: ['/today', 'Do it on Today'], images: ['court-add.jpg', 'today-home.jpg'], steps: ['In the add line, choose “To buy”.', 'Type the things with commas between: “eggs, rice, 2 kg onions”.', 'Press Add. Each becomes a line on your shopping list in Budget.', 'Tick it off on Today (the Home panel) or in Budget when you have it. No price is needed.'] },
  { id: 'journal-page', q: 'Write in my journal, with a picture', part: 'journal', open: ['/journal', 'Open the Journal'], images: ['journal.jpg', 'journal-pages.jpg'], steps: ['Open Journal in the top bar.', 'Write in the large box. “How it felt” takes one word, if you like.', 'Press “Add pictures” and choose one or more from your computer or phone.', 'Press “Save the page”. It appears under the box, with its pictures.'] },
  { id: 'add-person', q: 'Add a person and their birthday', part: 'people', open: ['/people', 'Open People'], images: ['people.jpg', 'people-list.jpg'], steps: ['Open People in the top bar.', 'Type the name. Add the birthday if you know it.', 'Press Add.', 'The birthday is now on your calendar every year, and the bell tells you the day before and on the day.'] },
  { id: 'add-event', q: 'Add an event or a date to the calendar', part: 'calendar', open: ['/calendar', 'Open the Calendar'], images: ['calendar-add.jpg'], steps: ['Open Calendar in the top bar.', 'In “Add a Life OS event”, type the title and choose the day.', 'Press the button beside it. The event is on that day.', 'For something with a clock time, the add line on Today is quicker: “dentist 14:30”, with the day under “for”.'] },
  { id: 'move-plan', q: 'Move a plan to another day, or change it', part: 'planner', open: ['/planner', 'Open Plan the week'], images: ['planner-menu.jpg', 'today-change.jpg'], steps: ['Open Plan the week (from Review or Today).', 'Drag the plan to another day, or press its ⋯ and choose the day under “Move to”.', 'To change its words or time, press “Change” in the same menu, or under the plan on Today.'] },
  { id: 'tick-study', q: 'Tick a study step, or finish a card', part: 'today', open: ['/today', 'Open Today'], images: ['today-path.jpg'], steps: ['On Today, find the study block in “Your day”.', 'Tick each step as you finish it.', 'Press “Card done” when the whole card is finished.', 'The Study hub shows the same ticks; nothing has to be entered twice.'] },
  { id: 'study-focus', q: 'Study one card with a timer', part: 'focus', open: ['panel:focus', 'Open the timer'], images: ['focus.jpg'], steps: ['Press Focus in the top bar, on any page.', 'Under “What is it for”, choose the study card.', 'Choose the minutes and start. The time is added to the card when it ends.'] },
  { id: 'catch-up', q: 'Catch up on study that fell behind', part: 'study', open: ['/study', 'Open the Study hub'], images: ['study-rescue.jpg'], steps: ['In the Study hub, open “Rescue Lane” in the menu.', 'Start with the top card: it is the oldest that slipped in its module.', 'Tick its steps, or press “Card done”, and the next one comes up.'] },
  { id: 'add-study', q: 'Add a study card, a class or a test', part: 'study', open: ['/study#/setup', 'Open Semester setup'], images: ['study-addcard.jpg', 'study-setup.jpg'], steps: ['Open the Study hub.', 'For a card: press “Add card” at the top and fill in its title, module and dates.', 'For a class, a test or a deadline: open “Semester setup” in the hub’s menu and press the add button of that list.', 'Classes and tests then show on the Calendar and on Today.'] },
  { id: 'job-applied', q: 'Mark a job as applied, or rejected', part: 'jobmap', open: ['/today', 'Do it on Today'], images: ['today-jobs.jpg', 'jobmap-details.jpg'], steps: ['On Today, find the job in the Jobs panel and press “I applied”.', 'The line that confirms it has “Undo”.', 'For any other status (Interview, Offer, Rejected): open the job in JobMap and choose it under “Status”.'] },
  { id: 'job-files', q: 'Keep my CV and other files with a job', part: 'jobmap', open: ['/jobmap', 'Open JobMap'], images: ['jobmap-application.jpg'], steps: ['Open the job in JobMap.', 'Open “My application: files, folder and links”.', 'Press “Add files” and choose the CV you sent, the cover letter, the advert.', 'They stay with the job. Click one to open it; “Remove” takes it off.'] },
  { id: 'main-cv', q: 'Use my main CV for an application', part: 'jobmap', open: ['/jobmap', 'Open JobMap'], images: ['jobmap-documents.jpg', 'jobmap-application.jpg'], steps: ['In JobMap, open “My documents” in the menu.', 'Connect the folder where your CVs are kept, if it is not connected yet.', 'Find your CV and press “Make this my main CV”.', 'Open the job you are applying for → “My application” → “Keep a copy of my main CV with this job”. It is kept with the job, and “CV version used” is filled in.'] },
  { id: 'previous-applications', q: 'See every job I have applied for', part: 'jobmap', open: ['/jobmap', 'Open JobMap'], images: ['jobmap-documents.jpg', 'jobmap-shortlist.jpg'], steps: ['In JobMap, open “My documents”.', '“Previous applications” lists every job you applied for or kept a CV, a file or a folder with, newest first.', 'Press one to open it.', '“Applications” in the menu shows the ones still in progress.'] },
  { id: 'job-categories', q: 'Sort jobs with my own categories', part: 'jobmap', open: ['/jobmap', 'Open JobMap'], images: ['jobmap-details.jpg', 'jobmap.jpg'], steps: ['Open a job in JobMap.', 'In “My categories”, type your own words with commas between: “NHS, remote”.', 'Each becomes a label on the job.', 'Above the list, a filter with your categories appears; choose one to see only those jobs.'] },
  { id: 'cardiff-event', q: 'Add an event of my own in Cardiff Life', part: 'cardiff', open: ['/cardiff-life', 'Open Cardiff Life'], images: ['cardiff-add.jpg', 'cardiff-detail.jpg'], steps: ['Open Cardiff Life and press “+ Add my own event”.', 'Type its name. Day, time, place and the rest can wait.', 'Press “Add it to my plan”.', 'It is in your week there and on the Life OS calendar. Open it again to change or remove it.'] },
  { id: 'bought', q: 'Record what I bought', part: 'budget', open: ['/budget', 'Open Budget'], images: ['budget-shopping.jpg', 'budget-receipts.jpg'], steps: ['Open Budget → Shopping.', 'Tick the lines you have. For the prices, press “Record what I bought”.', 'The receipt is under Shopping → Receipts, and the month’s spending follows it.'] },
  { id: 'focus-timer', q: 'Start a focus timer, with sound', part: 'focus', open: ['panel:focus', 'Open the timer'], images: ['focus.jpg'], steps: ['Press Focus in the top bar.', 'Say what the time is for, or choose a study card.', 'Choose the minutes and start. It keeps counting on every page.', 'For sound, paste a link under Sound and press play.'] },
  { id: 'what-now', q: 'See what needs me right now', part: 'focus', open: ['panel:notices', 'Open the bell'], images: ['notices.jpg'], steps: ['Press the bell in the top bar.', 'The list is in order: on now, soon, asked of today, slipped, close ahead.', 'Click a line to go to the thing itself.'] },
  { id: 'look-back', q: 'Look back on my week', part: 'review', open: ['/review', 'Open Review'], images: ['review.jpg', 'review-days.jpg'], steps: ['Open Review in the top bar.', 'The five tiles compare this week with the week before.', '“Day by day” has every measure for each day; “What slipped” lists what was left.', '“The week before” moves back a week.'] },
  { id: 'my-data', q: 'Take my data as a file', part: 'analysis', open: ['/review?view=analysis', 'Open Analysis'], images: ['analysis-files.jpg'], steps: ['Open Review, then “Analysis”.', 'Choose the stretch of days at the top.', 'At the bottom, under “Take the data”, press the file you want.'] },
  { id: 'change-filed', q: 'Change or remove something I filed', part: 'ledger', open: ['/ledger', 'Open the Ledger'], images: ['ledger.jpg', 'ledger-change.jpg'], steps: ['Open Journal, then “the Ledger”.', 'Find it with “Kind” or “Find”.', 'Press “Change” to edit it in place, or “Remove”, which asks once more.'] },
  { id: 'look', q: 'Change how Life OS looks', part: 'styles', open: null, images: ['styles.jpg'], steps: ['Press “Style” in the top bar.', 'Choose Madder, Indigo, Paper or Modern.', 'In Modern, the button beside it switches between Light and Dark.'] },
]

export const GUIDE_IMAGES = CHAPTERS.flatMap((chapter) => chapter.steps.filter((step) => step.image).map((step) => step.image))
// The parts in the groups the Guide's first page shows them in.
export const GROUPS = [['Start here', ['big-picture', 'top-bar']], ['Your days', ['court', 'today', 'planner', 'calendar']], ['Your life', ['journal', 'people', 'ledger']], ['Looking back', ['review', 'analysis']], ['Everywhere', ['focus', 'styles']], ['The apps inside', ['study', 'cardiff', 'budget', 'jobmap']]]
