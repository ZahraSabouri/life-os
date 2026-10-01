const APPROVED_PAGES='approved/Pages/',CUPBOARD_ART=APPROVED_PAGES+'Food & supplies/My cupboard/';
const APPROVED_TYPES={
 'type-fruit':'Fresh Food/Fruit','type-vegetables':'Fresh Food/Vegetables & Salad','type-meat':'Fresh Food/Meat','type-fish-seafood':'Fresh Food/Fish & Seafood','type-plant-proteins':'Fresh Food/Plant proteins','type-dairy-eggs':'Fresh Food/Dairy & Eggs','type-milk-alternatives':'Fresh Food/Milk alternatives','type-bread-bakery':'Fresh Food/Bread & bakery',
 'type-pasta-noodles':'Pantry & freezer/Pasta & noodles','type-ready-to-eat':'Pantry & freezer/Ready to eat','type-frozen':'Pantry & freezer/Frozen','type-tins-jars':'Pantry & freezer/Tins & jars','type-sauces-oils':'Pantry & freezer/Sauces & oils','type-breakfast-spreads':'Pantry & freezer/Breakfast & spreads',
 'type-laundry':'Household/Laundry','type-cleaning':'Household/Cleaning','type-dishwashing':'Household/Dishwashing','type-paper-bags':'Household/Paper & bags','type-hair-care':'Care & Beauty/Haircare','type-skincare':'Care & Beauty/Skincare','type-make-up-fragrance':'Care & Beauty/Makeup & fragrance','type-drinks':'Snacks & drinks/Drinks','type-snacks-sweets':'Snacks & drinks/Snacks & sweets'
};
Object.assign(ART,{fresh:CUPBOARD_ART+'Fresh food.png',pantry:CUPBOARD_ART+'Pantry & freezer.png',household:CUPBOARD_ART+'Household.png',care:CUPBOARD_ART+'Care & beauty.png',clothes:CUPBOARD_ART+'Clothes.png',bike:CUPBOARD_ART+'Transport.png',snacks:CUPBOARD_ART+'Snacks & drinks.png'});
const previousTypeArt=typeArt;
typeArt=function(s,node){
 const path=typePath(s,node?.id||'');
 if(path.some(n=>/mini.?pizza/i.test(n.name)))return 'approved/General products/Pizza/Mini Pizza.png';
 const approved=[...path].reverse().find(n=>APPROVED_TYPES[n.id]);
 if(approved)return CUPBOARD_ART+'Category/'+APPROVED_TYPES[approved.id]+'.png';
 if(node?.id==='type-clothes')return ART.clothes;
 if(node?.id==='type-sport-outdoors')return ART.bike;
 return previousTypeArt(s,node);
};
const previousAdoptArtwork=adoptNewArtwork;
adoptNewArtwork=function(files){let count=previousAdoptArtwork(files);for(const f of files.filter(f=>f.startsWith('approved/Products/'))){const name=f.split('/').at(-1).replace(/\.(png|jpe?g|webp)$/i,''),key=artSlug(name);ITEM_ART[key]=[f];count++;}return count;};
