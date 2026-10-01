// What things are: a small tree of product types, separate from the money categories.
// Family ("Pizza") -> type ("Mini pizza") -> your products ("Morrisons mini pizza", "Lidl mini pizza").
// A product may sit at any level, and every level is optional: a one-off from a market stall can sit alone.
const SEED_TYPES=[
 ['Fruit','fruit-vegetables',[
  ['Apples',['apple']],['Bananas',['banana']],['Berries',['berry','berries','strawberry','blueberry','raspberry','blackberry']],
  ['Nectarines & peaches',['nectarine','peach']],['Citrus',['lemon','lime','orange','grapefruit','clementine','satsuma','mandarin']],
  ['Grapes',['grape']],['Melon',['melon','watermelon']],['Avocado',['avocado']],['Mango',['mango']],['Pineapple',['pineapple']],
  ['Pears',['pear']],['Kiwi',['kiwi']],['Plums',['plum']],['Cherries',['cherry']],['Pomegranate',['pomegranate']],
  ['Dates & dried fruit',['date','raisin','sultana','apricot','fig','prune','dried fruit']],['Fruit pots & salad',['fruit pot','fruit salad']]]],
 ['Vegetables','fruit-vegetables',[
  ['Salad & leaves',['salad','lettuce','iceberg','rocket','leaves','coleslaw','watercress']],['Tomatoes',['tomato']],['Cucumber',['cucumber']],
  ['Onions & garlic',['onion','garlic','shallot','leek','spring onion']],['Peppers & chillies',['pepper','chilli','chili','jalapeno']],
  ['Mushrooms',['mushroom']],['Potatoes',['potato','new potato','baby potato']],['Sweet potato',['sweet potato']],
  ['Corn',['corn','sweetcorn','cobette']],['Carrots',['carrot']],['Courgette & aubergine',['courgette','aubergine','zucchini']],
  ['Spinach & greens',['spinach','kale','cabbage','pak choi','chard']],['Broccoli & cauliflower',['broccoli','cauliflower']],
  ['Green beans & peas',['green bean','mangetout','sugar snap','garden pea']],['Beetroot & root veg',['beetroot','parsnip','turnip','swede','celeriac']],
  ['Celery',['celery']],['Ginger & fresh spice',['ginger','turmeric root','lemongrass']],
  ['Stir-fry & prepared veg',['stir fry','stir-fry','prepared veg','veg mix','veg pack']],
  ['Herbs',['basil','thyme','coriander','parsley','mint','rosemary','dill','sage','herb']]]],
 ['Meat','meat-fish-plant-proteins',[
  ['Chicken',['chicken','poultry']],['Turkey',['turkey']],['Beef & mince',['beef','mince','steak','burger']],['Pork',['pork','gammon','pork chop']],
  ['Bacon',['bacon']],['Lamb',['lamb']],['Ham & cold meats',['ham','pastrami','turkey slice','cold meat','deli meat']],
  ['Sausages',['sausage','kabanossi','frankfurter','hot dog']],['Chorizo & salami',['chorizo','salami','pepperoni slice','prosciutto','parma']],
  ['Skewers & kebabs',['skewer','kebab']],['Meat pies & pastry',['pork pie','sausage roll','meat pie']]]],
 ['Fish & seafood','meat-fish-plant-proteins',[
  ['Salmon',['salmon']],['Tuna',['tuna']],['White fish',['cod','haddock','pollock','white fish','sea bass','tilapia','basa']],
  ['Prawns',['prawn','shrimp']],['Squid & mixed seafood',['squid','calamari','seafood','mussel','octopus','crab']],
  ['Smoked fish',['smoked salmon','smoked mackerel','kipper']],
  ['Breaded & battered fish',['fish finger','battered','tempura','breaded fish','scampi','fishcake']]]],
 ['Plant proteins','meat-fish-plant-proteins',[
  ['Tofu',['tofu']],['Beans & pulses',['lentil','chickpea','kidney bean','black bean','pulse','butter bean']],
  ['Falafel & veggie',['falafel','quorn','veggie burger','plant based','vegan sausage','meat free']],['Nuts & nut protein',['nut protein','protein bar']]]],
 ['Dairy & eggs','eggs-dairy',[
  ['Milk',['milk','semi skimmed','whole milk','skimmed']],['Cheese',['cheese','cheddar','mozzarella','parmesan','feta','brie','gouda','edam']],
  ['Halloumi',['halloumi']],['Cream cheese',['cream cheese','philadelphia','soft cheese']],['Butter & spreads',['butter','margarine','spreadable']],
  ['Yoghurt',['yoghurt','yogurt','fage','skyr','greek yoghurt','yoghurt drink','yogurt drink','actimel','yakult','kefir']],['Eggs',['egg']],
  ['Cream',['double cream','single cream','soured cream','creme fraiche','whipping cream']],['Custard & desserts',['custard','trifle','mousse','rice pudding']]]],
 ['Milk alternatives','milk-alternatives',[
  ['Oat drink',['oat drink','oat milk']],['Almond drink',['almond milk','almond drink']],['Soya drink',['soy milk','soya','soya drink']],
  ['Coconut drink',['coconut milk drink','coconut drink']]]],
 ['Bread & bakery','bread-bakery',[
  ['Loaf',['loaf','sliced bread','wholemeal','sourdough','white bread','brown bread']],['Rolls',['roll','bap','bun','baguette']],
  ['Wraps & tortillas',['wrap','tortilla','pitta','flatbread']],['Bagels',['bagel']],['Naan',['naan','chapati','roti']],
  ['Crumpets & muffins',['crumpet','english muffin','pancake','waffle bakery']],
  ['Croissants & pastries',['croissant','pastry','danish','yum yum','twist','pain au chocolat']],
  ['Cakes & tarts',['cake','tart','doughnut','donut','swiss roll']],['Breadcrumbs & croutons',['breadcrumb','crouton','panko']]]],
 ['Pizza','frozen-food',[
  ['Mini pizza',['mini pizza','pizzette','pizza snack']],
  ['Frozen pizza',['frozen pizza','pizza margherita','pepperoni pizza','cheese & tomato pizza','stonebaked']],
  ['Fresh pizza',['fresh pizza','pizza dough','pizza base']],['Pizza slice',['pizza slice']],['Garlic bread',['garlic bread','doughball']]]],
 ['Pasta & noodles','rice-pasta-wrappers',[
  ['Penne',['penne','rigate']],['Fusilli',['fusilli']],['Spaghetti & linguine',['spaghetti','linguine','tagliatelle']],
  ['Macaroni',['macaroni']],['Lasagne',['lasagne','lasagna']],['Fresh pasta',['fresh pasta','tortellini','ravioli','gnocchi']],
  ['Instant noodles',['instant noodle','pot noodle','cup noodle','noodle pot','cup ramen','soba wok','ramen']],['Noodles',['noodle','udon','rice noodle','egg noodle']],
  ['Topokki & rice cakes',['topokki','tteokbokki','rice cake']],['Couscous',['couscous']]]],
 ['Rice & grains','rice-pasta-wrappers',[
  ['Rice',['rice','basmati','jasmine rice','long grain','arborio']],['Microwave rice',['microwave rice','rice pouch','ready rice']],
  ['Bulgur & quinoa',['bulgur','quinoa','freekeh']],['Oats',['oats','porridge','oatmeal']],['Flour tortilla wrappers',['wonton','spring roll wrapper','filo']]]],
 ['Ready to eat','fresh-convenience-food',[
  ['Sandwiches',['sandwich']],['Filled wraps & rolls',['chicken wrap','bacon wrap','filled roll','curry roll','salmon roll','sub']],
  ['Sushi & poke',['sushi','poke','maki','nigiri']],['Salad pots',['salad pot','pasta salad','tuna salad','couscous salad']],
  ['Ready meals',['ready meal','microwave meal','curry meal','lasagne ready']],['Soup pots',['fresh soup','soup pot']],
  ['Dips & snack packs',['dipper','dippers','snack pack','houmous','hummus','tzatziki','guacamole','salsa dip']],
  ['Quiche & savoury pastry',['quiche','savoury tart']]]],
 ['Frozen','frozen-food',[
  ['Frozen vegetables',['frozen veg','peas','frozen mix','frozen spinach']],['Frozen fruit',['frozen fruit','frozen berries']],
  ['Chips & waffles',['chips','waffle','fries','hash brown','wedges']],['Ice cream & lollies',['ice cream','lolly','lollies','gelato','sorbet']],
  ['Frozen snacks',['spring roll','onion ring','nugget','frozen samosa','breaded mushroom']],['Frozen ready meals',['frozen meal','frozen curry','frozen lasagne']],
  ['Ice',['ice cube','bag of ice']]]],
 ['Tins & jars','tins-jars-pulses',[
  ['Tinned fruit',['tin','tinned fruit','peach tin','pear tin','mango tin','pineapple tin','apple tin','fruit cocktail','peach slice','pear half','pear halves','apple slice','pineapple slice','mango slice','slices in juice','in light syrup']],
  ['Tinned fish',['tinned tuna','tuna chunk','tuna steak','tuna in spring water','tuna in sunflower oil','sardine','mackerel tin','anchovy']],['Tinned tomatoes',['tinned tomato','chopped tomato','passata']],
  ['Tinned vegetables',['baked bean','tinned corn','tinned pea','mushy pea','tinned carrot']],
  ['Tinned pulses',['tinned chickpea','tinned lentil','tinned bean','kidney bean tin']],
  ['Olives & antipasti',['olive','antipasti','sun dried','artichoke','vine leaves','aubergine in','gherkin','pickle']],
  ['Soup',['soup']],['Coconut milk',['coconut milk','coconut cream']],['Tinned meat',['spam','corned beef','tinned chicken']]]],
 ['Sauces & oils','sauces-condiments',[
  ['Cooking oil',['sunflower oil','olive oil','vegetable oil','cooking oil','rapeseed oil'],'cooking-oils-fats'],
  ['Oil spray',['frylight','oil spray','spray oil','one cal'],'cooking-oils-fats'],
  ['Pasta sauce',['carbonara','tomato sauce','pasta sauce','arrabbiata','bolognese sauce','ragu']],['Pesto',['pesto']],
  ['Curry & cooking sauce',['curry sauce','cook in sauce','korma','tikka sauce','stir fry sauce']],
  ['Ketchup & mayo',['ketchup','mayo','mayonnaise','burger sauce','garlic sauce','dip sauce','dipsauce','salad cream']],
  ['Mustard',['mustard']],['Soy & Asian sauces',['soy sauce','teriyaki','sriracha','hoisin','fish sauce','sweet chilli sauce','oyster sauce']],
  ['Hot sauce',['hot sauce','tabasco','peri peri']],['Vinegar',['vinegar','balsamic']],['Salad dressing',['dressing','caesar dressing','vinaigrette']],
  ['Chutney & relish',['chutney','relish','cranberry sauce']],['Marinade & paste',['marinade','curry paste','harissa','tomato puree']]]],
 ['Spices & baking','spices-baking',[
  ['Seasoning & spices',['seasoning','spice','paprika','cumin','turmeric','cinnamon','oregano','italian herb','all purpose','allpurpose','curry powder','chilli flake']],
  ['Salt & pepper',['salt','black pepper','peppercorn']],['Sugar',['sugar','caster','icing sugar','brown sugar']],
  ['Flour',['flour','self raising','plain flour']],['Stock & gravy',['stock cube','bouillon','gravy','stock pot']],
  ['Baking basics',['baking powder','bicarbonate','yeast','vanilla','cocoa','baking soda']],['Baking mixes & decorations',['cake mix','sprinkles','icing','fondant']],
  ['Dried fruit & nuts for baking',['mixed peel','glace cherry','ground almond']]]],
 ['Breakfast & spreads','breakfast-spreads',[
  ['Cereal',['cereal','cornflake','fruit & fibre','kellogg','weetabix','shreddies','shredded wheat','bitesize','bran flake','rice krispie']],
  ['Muesli & granola',['muesli','granola','alpen']],['Porridge pots',['porridge pot','oat so simple']],
  ['Jam & marmalade',['jam','marmalade','conserve']],['Honey',['honey']],['Nut butter',['peanut butter','hazelnut butter','almond butter','nut butter']],
  ['Chocolate spread',['nutella','chocolate spread']],['Syrup',['golden syrup','maple syrup','agave']],['Cereal bars',['cereal bar','breakfast bar','granola bar']]]],
 ['Snacks & sweets','snacks-treats',[
  ['Chocolate bar',['chocolate bar','dark chocolate','milk chocolate','chocolate 70','caramel bar','chocolate twist','way to go','galaxy','dairy milk','kitkat','snickers','bounty']],
  ['Chocolate box & pouches',['chocolate box','pouch','truffle','praline','caramel suisse','belgian chocolate','celebrations','quality street']],
  ['Biscuits & cookies',['biscuit','cookie','shortbread','flapjack','digestive','hobnob']],
  ['Crisps',['crisp','tortilla chip','pretzel','pringles','doritos','popcorn crisp']],['Popcorn',['popcorn']],
  ['Crackers & rice snacks',['cracker','rice snack','rice cracker','oatcake','breadstick']],
  ['Sweets',['sweet','haribo','gummy','jelly','candy','toffee','fudge','mint']],
  ['Nuts & seeds',['nuts','cashew','almond','pistachio','seed mix','peanut','walnut']],
  ['Brownies & cakes',['brownie','cake bar','muffin','mini roll','flapjack bar']],['Crisps multipack',['multipack']]]],
 ['Drinks','tea-coffee-soft-drinks',[
  ['Tea',['tea','brew','chai','green tea']],['Fruit & herbal tea',['fruit tea','herbal tea','hibiscus','rooibos','camomile','chamomile','peppermint tea','berry tea','infusion']],['Coffee',['coffee','espresso','latte','starbucks','instant coffee','coffee bean','coffee pod']],
  ['Hot chocolate',['hot chocolate','cocoa drink','horlicks','ovaltine']],['Juice',['juice','smoothie']],
  ['Soft drinks',['cola','lemonade','fizzy','soft drink','tonic','ginger beer','pepsi','fanta','sprite']],
  ['Water',['water','sparkling water','mineral water']],['Squash & cordial',['squash','cordial','robinsons','dilute']],
  ['Energy & sports drinks',['energy drink','red bull','monster','lucozade','sports drink','electrolyte']],
  ['Shots & wellness drinks',['shot','ginger shot','wellness drink','kombucha','collagen drink']],['Milkshake',['milkshake','yazoo','protein shake']]]],
 ['Alcohol','drinks-parties-entertainment',[
  ['Beer & cider',['beer','cider','lager','ale','stout']],['Wine',['wine','prosecco','champagne','rose wine']],
  ['Spirits',['gin','vodka','rum','whisky','tequila','liqueur','brandy']],['Ready to drink',['pre mixed','hard seltzer','alcopop']],
  ['Low & no alcohol',['alcohol free','0%','non alcoholic']]]],
 ['Laundry','laundry',[
  ['Laundry capsules',['laundry capsule','washing capsule','pod','detergent capsule','liquitab','bold capsule','ariel pod']],
  ['Washing powder',['washing powder','laundry powder']],['Washing liquid',['laundry liquid','washing liquid','detergent liquid','non bio','bio liquid']],
  ['Fabric softener',['softener','lenor','comfort']],['Stain remover',['stain remover','vanish','oxi']],
  ['Scent booster',['scent booster','unstoppables','in wash freshener']],['Washing machine cleaner',['machine cleaner','descaler washing']],
  ['Drying & ironing',['dryer sheet','tumble dryer sheet','ironing spray','starch','peg','airer']],
  ['Hand wash detergent',['hand wash detergent','delicate wash','wool wash']]]],
 ['Cleaning','cleaning-products',[
  ['All-purpose cleaner',['multi purpose cleaner','all purpose cleaner','flash','cif','surface cleaner','antibacterial spray','dettol spray']],
  ['Kitchen cleaner',['kitchen cleaner','degreaser','hob cleaner']],['Bathroom cleaner',['bathroom cleaner','shower spray','limescale','descaler','mould remover']],
  ['Toilet cleaner',['toilet cleaner','toilet duck','rim block','toilet gel']],['Bleach',['bleach','thick bleach']],
  ['Glass & window cleaner',['glass cleaner','window cleaner','windolene']],['Floor cleaner',['floor cleaner','zoflora','disinfectant floor']],
  ['Oven cleaner',['oven cleaner']],['Drain unblocker',['drain unblocker','plughole','mr muscle drain']],
  ['Disinfectant wipes',['disinfectant wipe','antibacterial wipe','cleaning wipe','surface wipe']],
  ['Polish & specialist',['furniture polish','wood polish','stainless steel cleaner','leather cleaner']],
  ['Scourers & sponges',['scourer','sponge','scrub','brillo','steel wool']],
  ['Cloths & dusters',['cloth','duster','microfibre','j cloth','chamois']],
  ['Brushes, mops & buckets',['mop','broom','dustpan','bucket','toilet brush','scrubbing brush']],
  ['Gloves',['rubber glove','cleaning glove','marigold']],['Pest control',['fly spray','ant powder','mouse trap','insect killer']]]],
 ['Dishwashing','dishwashing',[
  ['Dishwasher tablets',['dishwasher tablet','dishwasher capsule','all in one tablet','finish tablet']],
  ['Washing-up liquid',['washing up','fairy liquid','dish soap','washing up liquid']],
  ['Rinse aid & salt',['rinse aid','dishwasher salt','dishwasher cleaner']]]],
 ['Paper & bags','paper-toilet-rolls',[
  ['Toilet roll',['toilet paper','toilet roll','toilet tissue','loo roll','andrex','cushelle']],['Kitchen roll',['kitchen roll','paper towel','kitchen towel','jumbo kitchen']],
  ['Tissues',['tissue','hanky','kleenex','pocket tissue','facial tissue']],['Wet wipes',['wet wipe','antibacterial hand wipe','surface wipe pack']],
  ['Napkins & party paper',['napkin','serviette','paper plate','paper cup']],
  ['Bin bags',['bin bag','refuse sack','heavy duty bag','bin liner','swing bin'],'household-consumables'],
  ['Food & freezer bags',['freezer bag','zip bag','sandwich bag','food bag','vacuum bag'],'household-consumables'],
  ['Cling film & foil',['foil','cling film','baking paper','greaseproof','parchment'],'household-consumables'],
  ['Carrier bags',['carrier bag','bag for life','shopping bag'],'household-consumables']]],
 ['Home fragrance','household-consumables',[
  ['Air freshener',['air freshener','airwick','febreze','plug in','room spray']],['Candles',['candle','tealight','scented candle']],
  ['Reed diffuser',['diffuser','reed diffuser']],['Incense',['incense','joss stick']]]],
 ['Hair care','hair-care',[
  ['Shampoo',['shampoo']],['Dry shampoo',['dry shampoo']],['Conditioner',['conditioner']],
  ['Hair mask & treatment',['hair mask','hair oil','hair treatment','leave in','serum hair']],
  ['Styling',['hair gel','hairspray','mousse','wax hair','heat protection','curl cream']],
  ['Hair colour',['hair dye','hair colour','bleach hair','toner hair']],
  ['Brushes & accessories',['hair brush','comb','hair tie','scrunchie','clip hair','hair band']],
  ['Hair removal',['epilator','wax strip','hair removal cream','veet']]]],
 ['Body & oral care','hand-body-oral-care',[
  ['Shower gel',['shower gel','body wash','shower cream']],['Soap',['soap','bar soap','hand soap','hand wash']],
  ['Bath products',['bubble bath','bath salt','bath bomb','bath oil']],
  ['Deodorant',['deodorant','antiperspirant','roll on','body spray']],
  ['Toothpaste',['toothpaste']],['Toothbrush',['toothbrush','electric brush head']],['Mouthwash & floss',['mouthwash','floss','interdental','listerine']],
  ['Razors & shaving',['razor','shaving foam','shaving gel','blade','aftershave balm']],
  ['Hand cream',['hand cream']],['Body lotion',['body lotion','body butter','body oil','moisturiser body']],
  ['Foot care',['foot cream','foot file','verruca','athlete foot']],['Hand sanitiser',['hand sanitiser','hand gel']]]],
 ['Skincare','skincare-creams',[
  ['Face wash & cleanser',['face wash','cleanser','micellar','cleansing gel','cleansing balm']],
  ['Moisturiser',['moisturiser','face cream','day cream','night cream','hydrating cream']],
  ['Serum',['serum','hyaluronic','vitamin c serum','niacinamide']],['Face mask',['face mask','sheet mask','clay mask']],
  ['Toner',['toner','facial toner','rose water']],['Eye cream',['eye cream','eye serum','eye patch']],
  ['Sun care',['sun cream','spf','sunscreen','after sun']],['Lip balm',['lip balm','lip butter','vaseline lip']],
  ['Acne & blemish',['acne','blemish','spot treatment','salicylic']],['Exfoliator & scrub',['exfoliator','scrub','peel']]]],
 ['Make-up & fragrance','makeup-fragrance',[
  ['Foundation & concealer',['foundation','concealer','bb cream','cc cream']],['Powder & blusher',['powder','blusher','bronzer','highlighter']],
  ['Mascara & eyes',['mascara','eyeliner','eyeshadow','brow pencil','eyebrow gel']],['Lipstick & gloss',['lipstick','lip gloss','lip liner','lip tint']],
  ['Nail care',['nail polish','nail file','nail varnish','remover nail','manicure']],
  ['Make-up removal',['make up wipe','makeup wipe','cleansing wipe','make up remover','cotton pad','cotton wool']],
  ['Perfume',['perfume','fragrance','eau de','aftershave','cologne']],['Make-up tools',['brush set','beauty blender','sponge make up','tweezer']]]],
 ['Personal hygiene','personal-hygiene',[
  ['Period products',['tampon','sanitary pad','panty liner','menstrual cup','period pant']],
  ['Intimate care',['intimate wash','feminine wash']],['Condoms & sexual health',['condom','lubricant']],
  ['Cotton buds & pads',['cotton bud','cotton pad','cotton wool ball']],['Incontinence',['incontinence','tena']]]],
 ['Health & medicine','medicines-first-aid',[
  ['Vitamins & supplements',['vitamin','supplement','effervescent','magnesium','omega','multivitamin','collagen','probiotic']],
  ['Painkillers',['paracetamol','ibuprofen','painkiller','aspirin','nurofen','anadin']],
  ['Cold & flu',['cold and flu','throat','decongestant','lozenge','vicks','cough']],
  ['Allergy',['antihistamine','hay fever','allergy','piriton','cetirizine']],
  ['Digestive',['indigestion','heartburn','gaviscon','laxative','rehydration','imodium']],
  ['First aid',['plaster','bandage','antiseptic','savlon','germolene','thermometer']],
  ['Eye & ear care',['eye drop','ear drop','contact lens solution']],['Skin treatments',['antifungal','hydrocortisone','cold sore','insect bite']]]],
 ['Kitchen & home','kitchen-equipment',[
  ['Pans & cookware',['pan','wok','pot','casserole','baking tray','skillet','saucepan','frying pan']],
  ['Storage boxes',['storage box','food storage','tupperware','container set','lunch box']],
  ['Cutlery & utensils',['cutlery','knife','spatula','spoon set','chopping board','peeler','whisk','tongs','grater','can opener']],
  ['Mugs & glassware',['mug','glass','cup','tumbler','bottle flask','water bottle']],
  ['Plates & bowls',['plate','bowl','dinner set','crockery']],
  ['Kitchen textiles',['tea towel','oven glove','apron']],
  ['Bedding & towels',['bedding','duvet','pillow','towel','sheet set','mattress protector'],'home-furnishings'],
  ['Home decor',['frame','vase','cushion','decor','mirror','rug'],'home-furnishings'],
  ['Tools & DIY',['screwdriver','hammer','tape measure','glue','sandpaper','drill'],'repairs-maintenance']]],
 ['Tech & electrical','electronics-accessories',[
  ['Power bank',['power bank','powerbank']],['Chargers & cables',['charger','cable','adapter','usb','plug adapter']],
  ['Headphones & speakers',['headphone','earbud','speaker','airpod']],['Light bulbs',['light bulb','led lamp','led bulb','led gls','led','bulb','lamp']],
  ['Batteries',['battery','batteries','duracell']],['Phone accessories',['phone case','screen protector','phone holder','pop socket']],
  ['Memory & storage',['usb stick','memory card','sd card','hard drive']]]],
 ['Clothes','clothing',[
  ['Tops & t-shirts',['t shirt','tshirt','top','jumper','hoodie','shirt','sweatshirt']],
  ['Dressing gown & nightwear',['dressing gown','pyjama','nightwear','robe']],
  ['Underwear & socks',['underwear','socks','bra','briefs','boxer','tights']],
  ['Trousers & jeans',['trouser','jeans','leggings','shorts','joggers']],
  ['Coats & jackets',['coat','jacket','raincoat','gilet']],
  ['Shoes',['shoe','trainer','boot','sandal','slipper'],'footwear-accessories'],
  ['Bags & accessories',['backpack','handbag','belt','scarf','hat','glove','umbrella'],'footwear-accessories']]],
 ['Baby & child','household-consumables',[
  ['Nappies',['nappy','nappies','pull up']],['Baby wipes',['baby wipe']],['Baby food',['baby food','baby pouch','formula','baby milk']],
  ['Baby toiletries',['baby lotion','baby shampoo','nappy cream','baby powder']],['Toys & games',['toy','puzzle','board game','lego']]]],
 ['Pets','household-consumables',[
  ['Dog food',['dog food','dog treat','dog chew']],['Cat food',['cat food','cat treat']],
  ['Litter & hygiene',['cat litter','puppy pad','poo bag']],['Pet accessories',['pet toy','lead','collar','pet bowl']]]],
 ['Sport & outdoors','bike-cycling-equipment',[
  ['Gym & fitness',['skipping rope','dumbbell','yoga mat','resistance band','foam roller']],
  ['Bike parts',['bike','helmet','inner tube','bike light','bike lock','puncture']],
  ['Outdoor & camping',['tent','sleeping bag','camping','torch','picnic']]]],
 ['Study & stationery','study-stationery',[
  ['Notebooks & paper',['notebook','notepad','paper pack','printer paper','refill pad']],
  ['Pens & pencils',['pen','pencil','highlighter','marker','biro']],
  ['Office supplies',['stapler','folder','envelope','tape','post it','scissors','binder']],
  ['Cards & wrapping',['greeting card','wrapping paper','gift bag','ribbon'],'gifts-giving']]],
 ['Eating out','restaurant-meals',[
  ['Restaurant meal',['restaurant','dish','meal out','dinner out']],
  ['Takeaway',['takeaway','delivery meal','deliveroo','just eat','uber eats'],'takeaway-delivery'],
  ['Coffee & snack out',['coffee out','cafe','latte out','costa','starbucks drink'],'coffee-snacks-out']]],
 ['Surprise bags','too-good-to-go-bags',[
  ['Too Good To Go bag',['too good to go','surprise bag','magic bag']]]]
];
function typeSlug(name,taken){
 const base='type-'+String(name||'').toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'type';
 if(!taken||!taken.has(base))return base;let n=2;while(taken.has(base+'-'+n))n++;return base+'-'+n;
}
function seedProductTypes(){
 const out=[],taken=new Set();
 for(const [family,categoryId,kids] of SEED_TYPES){
  const fid=typeSlug(family,taken);taken.add(fid);
  out.push({id:fid,name:family,parentId:'',categoryId,match:[],seeded:true});
  for(const [name,match,cat] of kids){const id=typeSlug(name,taken);taken.add(id);out.push({id,name,parentId:fid,categoryId:cat||categoryId,match,seeded:true});}
 }
 return out;
}
// ---- Reading the tree ---------------------------------------------------------------------
function typeList(s){return s.productTypes||[];}
function typeNode(s,id){return id?typeList(s).find(x=>x.id===id)||null:null;}
function typeChildren(s,id){return typeList(s).filter(x=>(x.parentId||'')===(id||'')&&!x.archived).sort((a,b)=>a.name.localeCompare(b.name));}
function typePath(s,id){const out=[];let n=typeNode(s,id),guard=0;while(n&&guard++<20){out.unshift(n);n=n.parentId?typeNode(s,n.parentId):null;}return out;}
function typeLabel(s,id,sep=' · '){return typePath(s,id).map(x=>x.name).join(sep);}
function typeDescendants(s,id){
 const out=new Set(id?[id]:[]),list=typeList(s);let added=true,guard=0;
 while(added&&guard++<20){added=false;for(const x of list)if(x.parentId&&out.has(x.parentId)&&!out.has(x.id)){out.add(x.id);added=true;}}
 return out;
}
function typeDepth(s,id){return typePath(s,id).length;}
// Every product filed under a type (and, unless shallow, under anything inside it).
function itemsInType(s,id,{deep=true}={}){const ids=deep?typeDescendants(s,id):new Set([id]);return s.items.filter(i=>i.typeId&&ids.has(i.typeId)&&!i.archived);}
// ---- Filing things ------------------------------------------------------------------------
const TYPE_STOP=/\b(and|the|with|for|pack|packs|x|g|kg|ml|l|cl|litre|litres|large|small|medium|mini|fresh|frozen|organic|value|basics|finest|taste|difference|essential|essentials)\b/g;
function typeText(name){return ' '+String(name||'').toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()+' ';}
function typeMatches(text,word){
 const w=String(word||'').toLocaleLowerCase('en-GB').trim();if(w.length<3)return 0;
 const forms=[w,w+'s',w+'es',w.replace(/y$/,'ies')];
 for(const f of forms)if(text.includes(' '+f+' '))return w.length;
 return 0;
}
// The best type for a name: its own words first, then the words of each seeded type.
function classifyTypeId(s,name,categoryId){
 const text=typeText(name);if(text.trim().length<2)return '';
 let best=null;
 for(const node of typeList(s)){
  if(node.archived)continue;
  const words=[node.name,...(node.aliases||[]),...(node.match||[])];
  let score=0;for(const w of words)score=Math.max(score,typeMatches(text,w));
  if(!score)continue;
  const depth=node.parentId?2:1,fit=score+depth*4+(categoryId&&node.categoryId===categoryId?3:0);
  if(!best||fit>best.fit)best={id:node.id,fit};
 }
 return best?best.id:'';
}
// Find or make a type by path, e.g. ['Pizza','Mini pizza'].
function ensureTypePath(s,names,categoryId){
 let state=s,parent='';
 for(const raw of names){
  const name=String(raw||'').trim();if(!name)continue;
  const found=typeChildren(state,parent).find(x=>x.name.toLocaleLowerCase('en-GB')===name.toLocaleLowerCase('en-GB'));
  if(found){parent=found.id;continue;}
  const taken=new Set(typeList(state).map(x=>x.id)),node={id:typeSlug(name,taken),name,parentId:parent,categoryId:categoryId||typeNode(state,parent)?.categoryId||'uncategorised',match:[]};
  state={...state,productTypes:[...typeList(state),node]};parent=node.id;
 }
 return {state,id:parent};
}
function saveType(s,form){
 const name=String(form.name||'').trim();need(name,'Give it a name.');need(name.length<=60,'Use a shorter name.');
 const parentId=form.parentId||'';need(!parentId||typeNode(s,parentId),'Choose where it belongs.');
 need(!form.id||!typeDescendants(s,form.id).has(parentId),'A type cannot sit inside itself.');
 const clash=typeChildren(s,parentId).find(x=>x.id!==form.id&&x.name.toLocaleLowerCase('en-GB')===name.toLocaleLowerCase('en-GB'));
 need(!clash,'There is already a “'+name+'” here.');
 const old=typeNode(s,form.id);
 const clean={name,parentId,categoryId:form.categoryId||old?.categoryId||typeNode(s,parentId)?.categoryId||'uncategorised',image:form.image||'',
  aliases:(form.aliases||[]).map(x=>String(x).trim()).filter(Boolean),notes:String(form.notes||'').trim()};
 if(!old){const taken=new Set(typeList(s).map(x=>x.id));return {...s,productTypes:[...typeList(s),{id:typeSlug(name,taken),match:[],...clean}]};}
 return {...s,productTypes:typeList(s).map(x=>x.id===old.id?{...x,...clean}:x)};
}
// Removing a type keeps everything inside it: children and products move up one level.
function removeType(s,id){
 const node=typeNode(s,id);need(node,'Type not found.');
 const up=node.parentId||'';
 return {...s,productTypes:typeList(s).filter(x=>x.id!==id).map(x=>x.parentId===id?{...x,parentId:up}:x),
  items:s.items.map(i=>i.typeId===id?{...i,typeId:up||undefined}:i)};
}
// ---- What a type holds --------------------------------------------------------------------
function typeSummary(s,id){
 const items=itemsInType(s,id),ids=new Set(items.map(i=>i.id));
 const rows=stockRows(s).filter(r=>r.remaining>0&&(r.itemId&&ids.has(r.itemId)||!r.itemId&&items.some(i=>itemKey(i.name)===itemKey(r.name))));
 const prices=items.flatMap(i=>(i.observations||[]).map(o=>({...o,item:i,unitPence:unitPrice(o),shop:shopName(s,o)||'Shop not recorded'})));
 const sorted=[...prices].sort((a,b)=>a.date.localeCompare(b.date));
 const cheapest=prices.length?prices.reduce((a,b)=>b.unitPence<a.unitPence?b:a):null;
 // Only add amounts up when they are in the same unit: 400 g of grated cheese and 8 triangles do not make 408 of anything.
 const units=[...new Set(rows.map(r=>unitKey(r.unit)))];
 const mixed=units.length>1,unit=rows[0]?.unit||items[0]?.unit||'';
 return {items,rows,mixed,products:new Set(rows.map(r=>r.itemId||itemKey(r.name))).size,
  atHome:mixed?null:rows.reduce((n,r)=>n+r.remaining,0),unit:mixed?'':unit,
  prices,latest:sorted.at(-1)||null,cheapest,shops:[...new Set(prices.map(p=>p.shop))],
  children:typeChildren(s,id)};
}
// Products and types that match what someone typed, for pickers.
function typeSearch(s,query,limit=8){
 const q=String(query||'').trim().toLocaleLowerCase('en-GB');if(!q)return [];
 return typeList(s).filter(x=>!x.archived&&[x.name,...(x.aliases||[])].join(' ').toLocaleLowerCase('en-GB').includes(q))
  .map(x=>({node:x,count:itemsInType(s,x.id).length}))
  .sort((a,b)=>(a.node.name.toLocaleLowerCase('en-GB').startsWith(q)?-1:0)-(b.node.name.toLocaleLowerCase('en-GB').startsWith(q)?-1:0)||b.count-a.count||a.node.name.localeCompare(b.node.name))
  .slice(0,limit);
}
// The type behind a cupboard entry, whether or not it has a catalogue product yet.
function entryTypeId(s,g){
 if(g.item?.typeId)return g.item.typeId;
 const cat=g.item?.categoryId||g.rows?.[0]?.categoryId;
 return classifyTypeId(s,g.name||g.item?.name||'',cat);
}
// First load after this update: build the tree and file every product in it.
function seedTypesInto(s){
 if(Array.isArray(s.productTypes))return s;
 let state={...s,productTypes:seedProductTypes()};
 const items=state.items.map(i=>{
  if(i.typeId)return i;
  if(i.type){const r=ensureTypePath(state,[String(i.type)],i.categoryId);state=r.state;return {...i,typeId:r.id};}
  const id=classifyTypeId(state,i.name,i.categoryId);return id?{...i,typeId:id}:i;
 });
 return {...state,items};
}

// Everything you might type when looking for something: its own words, and the words of the tree
// and category it sits in, so "pizza", "loo roll" or "household" all find the right things.
function typeWords(s,id){return typePath(s,id).flatMap(n=>[n.name,...(n.aliases||[]),...(n.match||[])]);}
function categoryWords(s,id){const c=id?category(s,id):null;return c?[c.name,c.group]:[];}
function itemHaystack(s,i){
 return [i.name,i.brand,...(i.aliases||[]),...typeWords(s,i.typeId),...categoryWords(s,i.categoryId),i.shopId?findShop(s,i.shopId)?.name:''].filter(Boolean).join(' ').toLocaleLowerCase('en-GB');
}
function entryHaystack(s,g){
 const item=g.item,cat=g.item?.categoryId||g.rows?.[0]?.categoryId;
 return [g.name,item?.brand,...(item?.aliases||[]),...(g.rows||[]).map(r=>r.name),...(g.rows||[]).map(r=>r.location),...typeWords(s,entryTypeId(s,g)),...categoryWords(s,cat)].filter(Boolean).join(' ').toLocaleLowerCase('en-GB');
}
function matchesWords(hay,q){const words=String(q||'').toLocaleLowerCase('en-GB').split(/\s+/).filter(Boolean);return words.every(w=>hay.includes(w));}
