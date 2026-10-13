// The Guide's words. Each chapter is one part of Life OS; each step says what to do and names
// the picture that shows it. The pictures are taken from the running app by
// scripts/guide-shots.mjs, which has one recipe for every `image` named here.
// Plain data: the page reads it, and so does the script (to check no picture is missing).
export const CHAPTERS = [
  {
    id: 'top-bar', title: 'Finding your way', intro: 'The bar at the top is on every page. Everything in Life OS is one click from it.',
    steps: [
      { title: 'The top bar', image: 'topbar.jpg', text: 'Click “Life OS” to go to the Court. Court, Today, Calendar, Review and Ledger are the pages of Life OS itself. Study hub, Cardiff Life, Budget and JobMap are the four apps inside it. On the right: the bell (notices), Focus (the timer), Style, Light or Dark (in the Modern style), the Guide (?), and Divan (the opening page).' },
      { title: 'The strip under the bar', image: 'strip.jpg', text: 'Inside one of the four apps, a strip says what matters there today: what is due, what closes, what is next. “The whole day” on its right opens Today.' },
    ],
  },
  {
    id: 'court', title: 'The Court', intro: 'The Court is the front page. It looks ahead; the day itself is on Today.',
    steps: [
      { title: 'The whole page', image: 'court.jpg', text: 'At the top, one line to add something. Under it, “Ahead”: the next two weeks, day by day, with what is fixed on each day.' },
      { title: 'Add something in one line', image: 'court-add.jpg', text: 'Choose Plan, Note or To buy, then type. “17:30 library” becomes a plan at 17:30. “Lidl” or “dinner at 8pm” work too. “To buy” puts things on your shopping list in Budget: “eggs, rice, 2 kg onions” becomes three lines. Choose the day with “for”, how often with “repeat”, and the area it belongs to with “under”.' },
      { title: 'Ahead', image: 'court-ahead.jpg', text: 'Each day shows up to four things: tests and deadlines, jobs that close, your own dated plans. Click a day to open it in Today; click a thing to open it where it lives.' },
    ],
  },
  {
    id: 'today', title: 'Today', intro: 'Today is the working page: the day in order on the left, and Study, Jobs, Home and Notes beside it.',
    steps: [
      { title: 'The whole page', image: 'today.jpg', text: 'The buttons at the top move a day back or forward, or back to today. Every other day has the same page.' },
      { title: 'Your day, in order', image: 'today-path.jpg', text: 'Things with a time come first, in order, with a line at “now”. Then “Any time today”, then “Also today” (deadlines and all-day things). A study block shows the steps of its card: tick a step here and the Study hub has it too. On your own plans: “Done” ticks it, “Take off the day” removes it from the day.' },
      { title: 'Study', image: 'today-study.jpg', text: 'The days to the next test, how many cards are done before it, and the cards due today. A card’s title opens that card in the Study hub.' },
      { title: 'Jobs', image: 'today-jobs.jpg', text: 'The jobs to apply for now, in JobMap’s own order, with the ones that close today first. A job’s title opens it in JobMap. “I applied” marks it applied in JobMap with today’s date; the line that confirms it has Undo.' },
      { title: 'Home', image: 'today-home.jpg', text: 'Your shopping lists from Budget, with real tick boxes. Ticking needs no price. Under them: what you eat today and what is at home.' },
    ],
  },
  {
    id: 'planner', title: 'Plan the week', intro: 'Seven days side by side. Open it from Review (“Plan this week”) or at /planner.',
    steps: [
      { title: 'The week', image: 'planner.jpg', text: 'Each column is a day with its study time and job time added up at the top. Type in the box at the bottom of a day to add a plan to that day.' },
      { title: 'Move or finish a plan', image: 'planner-menu.jpg', text: 'Drag one of your own plans to another day, or open its ⋯ menu: Done, Take off, or move it to a day you choose. Study blocks are moved in the Study hub’s planner.' },
      { title: 'Repeating plans', image: 'planner-repeating.jpg', text: 'Everything that comes round is listed under the week. “Change” opens its days, clock time, first and last day. “Stop after today” ends it; days already ticked stay.' },
    ],
  },
  {
    id: 'calendar', title: 'Calendar', intro: 'Every dated thing from every part in one calendar.',
    steps: [
      { title: 'One calendar for everything', image: 'calendar.jpg', text: 'Study blocks, classes, tests, job deadlines, time set aside, your plans, Cardiff events you chose or added, and renewals from Budget. The buttons at the top change the view and which areas are shown. Click a thing to open it where it lives.' },
    ],
  },
  {
    id: 'review', title: 'Review', intro: 'One week looked back on across every part.',
    steps: [
      { title: 'The week in five tiles', image: 'review.jpg', text: 'Study cards done, time focused, applications sent, your plans done, and money. Each tile compares with the week before. “The week before” and “The week after” move between weeks.' },
      { title: 'Day by day, and what slipped', image: 'review-days.jpg', text: 'One row for each day with every measure in its own column. “What slipped” lists cards past their date, plans left unticked, and shortlisted jobs that closed without an application.' },
      { title: 'Eight weeks, and what you aim at', image: 'review-eight.jpg', text: 'Four small charts compare this week with the seven before it. “Set what you aim at” keeps a number of applications a week and hours of focus a day; the charts then show the aim as a line.' },
    ],
  },
  {
    id: 'analysis', title: 'Analysis', intro: 'On the Review page, the “Analysis” button looks at a longer stretch of days as data.',
    steps: [
      { title: 'Choose the days, read the statistics', image: 'analysis-stats.jpg', text: 'Choose 4, 8, 12 or 26 weeks, or any two dates. The table gives each measure’s total, mean a day, median, standard deviation, best day and the number of days with any.' },
      { title: 'Plan against done', image: 'analysis-burn.jpg', text: 'Study cards due (the dashed line) and done (the solid line), added up day after day. The gap between them is how far behind or ahead you are.' },
      { title: 'The shape of your week, and hours of the day', image: 'analysis-hours.jpg', text: 'The mean for each weekday, and a grid of weekday by hour. The buttons above the grid switch between study on the plan, time set aside for jobs, and time focused. Point at a square for its number; “the numbers” opens the table behind any chart.' },
      { title: 'Modules, jobs and money', image: 'analysis-jobs.jpg', text: 'Each module’s cards; the job pipeline from everything listed down to an offer, where leads come from, and closing dates ahead; spending by kind of thing and by shop.' },
      { title: 'Take the data', image: 'analysis-files.jpg', text: 'Five files: the days (one row a day), the days in tidy form, every job, every study card, and the whole page as JSON. They are made at the moment you click, from what each part holds.' },
    ],
  },
  {
    id: 'ledger', title: 'Ledger', intro: 'Everything you filed in Life OS itself: notes, plans, tasks, repeating plans, meals.',
    steps: [
      { title: 'File and find', image: 'ledger.jpg', text: 'Type in “Tell me something…” to file a note. “Kind” shows one kind of entry; “Find” looks for words in the title or text.' },
      { title: 'Change or remove an entry', image: 'ledger-change.jpg', text: '“Change” opens the entry in place: its title, text, day, clock time and state. “Remove” asks once more, then removes it for good.' },
    ],
  },
  {
    id: 'focus', title: 'Focus and notices', intro: 'A timer with sound for the whole app, and one bell for every part.',
    steps: [
      { title: 'Focus', image: 'focus.jpg', text: 'Click Focus in the top bar. Say what the time is for, choose the minutes, and start. It keeps running while you move between pages. A study card can be chosen, and the time is then added to that card. Sound: paste a link from YouTube or another site and it plays while you work.' },
      { title: 'Notices', image: 'notices.jpg', text: 'The bell lists what needs you from every part: what is on now or soon, tests coming, jobs closing, plans left over, money. The number is how many are new. In the panel you can switch on notices from the browser and choose how many minutes before.' },
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
      { title: 'It opens the running semester', image: 'study.jpg', text: 'The Study hub opens the semester that is running now. Its menu on the left has Today, the planner, cards, review, progress and analytics.' },
      { title: 'Change semester', image: 'study-semester.jpg', text: '“Change semester”, under the semester’s name at the top of the menu, goes back to the list of semesters, where you can open another one or add one.' },
      { title: 'Add classes, tests and materials yourself', image: 'study-setup.jpg', text: 'On “Semester setup” there are three lists: classes, tests and deadlines, and materials. Each has an add button at its top, and each row has “Change” and “Remove”. A find box narrows a long list.' },
    ],
  },
  {
    id: 'cardiff', title: 'Cardiff Life', intro: 'Events and communities in Cardiff: the ones your agents researched, and the ones you add.',
    steps: [
      { title: 'A week in Cardiff', image: 'cardiff.jpg', text: 'The week shows what you chose and, if you tick “Show available options”, what else is on. “Maybe” keeps an event open; “Plan to go” puts it in your plan and on the Life OS calendar.' },
      { title: 'Add my own event', image: 'cardiff-add.jpg', text: '“+ Add my own event” opens a short form. Only the name is needed; day, time, place, kind, cost, link and notes can be filled in later. It is kept in Life OS and shows on your calendar.' },
      { title: 'Change or remove it', image: 'cardiff-detail.jpg', text: 'Open an event you added to see “Change this event” and “Remove this event”. A note of your own can be kept with any event you chose.' },
    ],
  },
  {
    id: 'budget', title: 'Budget', intro: 'Money, shopping, food at home and receipts.',
    steps: [
      { title: 'The first screen', image: 'budget.jpg', text: 'Budget opens on the month: what is planned, what is spent and what is left. Its own menu leads to shopping, receipts, food and the rest.' },
      { title: 'Shopping lists', image: 'budget-shopping.jpg', text: 'Under Shopping, “My lists” holds your lists. “Arrange” shows the same things by list, by category, by shop, by day, or everything at once. Type an item and press Enter to add it; it needs no price. Tick it when you have it, or use “Record what I bought” to turn the trip into a receipt.' },
    ],
  },
  {
    id: 'jobmap', title: 'JobMap', intro: 'Every job lead, in the order to act on them.',
    steps: [
      { title: 'The list', image: 'jobmap.jpg', text: '“To apply” is every role a check has seen open, in the order to act on them. The other tabs widen or narrow it. The star puts a job on the shortlist. Search, source, your own categories and the order are above the list.' },
      { title: 'A job’s details', image: 'jobmap-details.jpg', text: 'Click a job to open it. Set its status (Applied, Interview, Rejected and the rest), your priority, the next step, a follow-up date and your notes. “My categories” takes your own words with commas between; each becomes a label on the job and a filter above the list.' },
      { title: 'Your application: files, folder and links', image: 'jobmap-application.jpg', text: 'Open “My application: files, folder and links”. Keep the CV and cover letter version, the folder with your files for this job (“Open folder” shows it on this computer), and your own links, one per line. A name before a link is optional: name, then |, then the link.' },
    ],
  },
]

export const GUIDE_IMAGES = CHAPTERS.flatMap((chapter) => chapter.steps.map((step) => step.image))
