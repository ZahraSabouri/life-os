// A general exercise illustration library, not a user's routine or prescription.
const nhs = 'https://www.nhs.uk/live-well/exercise/strength-exercises/'
const db = 'https://github.com/yuhonas/free-exercise-db'
const original = (src, alt, reference) => ({frames:[{src,alt}],credit:'Life OS movement diagram',reference})
const photo = (frames, note='') => ({frames,credit:'Free Exercise DB · public domain',reference:db,note})
const frame = (src, alt) => ({src,alt})
export const pictureLibrary = [
  {key:'chair-squat',match:/\bchair squat\b|\bsit.to.stand\b/i,...original(new URL('../assets/exercises/chair-squat.svg',import.meta.url).href,'Two drawings: leaning forward from a stable chair, then standing with feet flat.',nhs)},
  {key:'floor-press',match:/\bdumbbell floor (?:chest )?press\b/i,...photo([
    frame(new URL('../assets/exercises/Dumbbell_Floor_Press-1.jpg',import.meta.url).href,'Set up: lying on the floor, knees bent, elbows gently resting on the floor and dumbbells above the elbows.'),
    frame(new URL('../assets/exercises/Dumbbell_Floor_Press-0.jpg',import.meta.url).href,'Press: dumbbells raised over the chest with head resting on the floor.')
  ])},
  {key:'supported-row',match:/\b(?:one.arm dumbbell|supported.*) row\b/i,...photo([
    frame(new URL('../assets/exercises/One-Arm_Dumbbell_Row-0.jpg',import.meta.url).href,'Set up: one hand and knee supported on a bench, other arm hanging below the shoulder.'),
    frame(new URL('../assets/exercises/One-Arm_Dumbbell_Row-1.jpg',import.meta.url).href,'Row: elbow drawn back, torso stays still and neck follows the back.')
  ],'The photos show the bench-supported option. Use the secure support described in your instructions.')},
  {key:'glute-bridge',match:/\bglute bridge\b|\bbutt lift\b/i,...photo([
    frame(new URL('../assets/exercises/Butt_Lift_Bridge-0.jpg',import.meta.url).href,'Set up: lying on the back with knees bent and feet flat.'),
    frame(new URL('../assets/exercises/Butt_Lift_Bridge-1.jpg',import.meta.url).href,'Bridge: hips lifted with shoulders remaining on the floor.')
  ])},
  {key:'dead-bug',match:/\bdead\s?bug\b/i,...original(new URL('../assets/exercises/dead-bug.svg',import.meta.url).href,'Two drawings: arms up and knees bent, then opposite arm and leg reaching while the back stays still.','https://oxfordhealth.nhs.uk/wp-content/uploads/sites/22/2023/10/Core-Strength.pdf'),alternative:frame(new URL('../assets/exercises/heel-tap.svg',import.meta.url).href,'Easier heel tap: arms stay up, one bent leg lowers until the heel lightly touches the floor.')},
  {key:'heel-tap',match:/\bheel taps?\b/i,...original(new URL('../assets/exercises/heel-tap.svg',import.meta.url).href,'Two drawings: knees bent above hips, then one heel lowered with the arms still.','https://oxfordhealth.nhs.uk/wp-content/uploads/sites/22/2023/10/Core-Strength.pdf')},
  {key:'band-pull-apart',match:/\bband pull.apart\b/i,...photo([
    frame(new URL('../assets/exercises/Band_Pull_Apart-0.jpg',import.meta.url).href,'Set up: band held in front at chest height with relaxed shoulders.'),
    frame(new URL('../assets/exercises/Band_Pull_Apart-1.jpg',import.meta.url).href,'Pull apart: hands move apart with the band across the chest.')
  ])},
  {key:'calf-raise',match:/\b(?:supported )?calf raise\b/i,...original(new URL('../assets/exercises/calf-raise.svg',import.meta.url).href,'Two side views: holding support with feet flat, then heels raised onto the balls of the feet.',nhs)},
  {key:'hip-hinge',match:/\bhip hinge\b|\b(?:dumbbell )?rdl\b|\bromanian deadlift\b/i,...original(new URL('../assets/exercises/hip-hinge.svg',import.meta.url).href,'Two side views: standing with soft knees, then hips pushed backwards with a long back. Bodyweight version.','https://www.nhsfife.org/services/all-services/patient-advice/achilles-tendinopathy/')},
  {key:'wall-push-up',match:/\bwall.*push.up\b|\bwall press.up\b/i,...original(new URL('../assets/exercises/wall-push-up.svg',import.meta.url).href,'Two side views: arms long with hands on the wall, then elbows bending as the chest moves towards the wall.',nhs)},
  {key:'step-up',match:/\b(?:supported )?step.up\b/i,...original(new URL('../assets/exercises/step-up.svg',import.meta.url).href,'Two side views: whole leading foot on a low step with hand support, then stepping up.','https://www.cuh.nhs.uk/patient-information/home-exercise-programme/')},
  {key:'clamshell',match:/\bclamshell\b|\bclam\b/i,...original(new URL('../assets/exercises/clamshell.svg',import.meta.url).href,'Two side views: lying with bent knees and a supported head, then opening the top knee while feet stay together.','https://www.southtees.nhs.uk/resources/the-clam/')},
  {key:'bird-dog',match:/\bbird dog\b/i,...original(new URL('../assets/exercises/bird-dog.svg',import.meta.url).href,'Two side views: on hands and knees, then reaching an opposite arm and leg while hips stay level.','https://oxfordhealth.nhs.uk/wp-content/uploads/sites/22/2023/10/Core-Strength.pdf')},
  {key:'knee-side-plank',match:/\b(?:modified|knee.supported|kneeling) side plank\b/i,...original(new URL('../assets/exercises/knee-side-plank.svg',import.meta.url).href,'Two drawings: supported on forearm with knees bent, then hips lifted on the forearm and lower knee.','https://doi.org/10.3390/ijerph16193509')},
  {key:'biceps-curl',match:/\bbiceps? curl\b/i,...photo([
    frame(new URL('../assets/exercises/Dumbbell_Bicep_Curl-0.jpg',import.meta.url).href,'Set up: standing, arms at sides and dumbbells beside the thighs.'),
    frame(new URL('../assets/exercises/Dumbbell_Bicep_Curl-1.jpg',import.meta.url).href,'Curl: elbows bent while upper arms stay beside the torso.')
  ])},
  {key:'chin-tuck',match:/\bchin tuck\b/i,...original(new URL('../assets/exercises/chin-tuck.svg',import.meta.url).href,'Two side views: head facing level, then gliding backwards while eyes stay level.','https://myhealth.alberta.ca/Health/aftercareinformation/pages/conditions.aspx?hwid=ad1500')},
  {key:'wall-slide',match:/\bwall slide\b/i,...original(new URL('../assets/exercises/wall-slide.svg',import.meta.url).href,'Two side views: forearms on the wall, then sliding upwards with a relaxed neck.','https://www.nhs.uk/live-well/exercise/')},
  {key:'doorway-stretch',match:/\bdoorway.*(?:chest )?stretch\b/i,...original(new URL('../assets/exercises/doorway-stretch.svg',import.meta.url).href,'Two side views: one forearm on a doorframe, then a gentle forward step to stretch the chest.','https://yourhealth.leicestershospitals.nhs.uk/library/csi/therapies/physiotherapy/4419-exercises-to-help-manage-your-thoracic-outlet-syndrome-tos/file')}
]
export const exercisePictures = name => typeof name==='string'?pictureLibrary.find(p=>p.match.test(name)):undefined
