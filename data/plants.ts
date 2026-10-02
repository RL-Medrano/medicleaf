import { cloudinaryUrl } from "@/utils/cloudinary";

export type PlantTag =
  | "Cough"
  | "Fever"
  | "Indigestion"
  | "Wound"
  | "Diabetes"
  | "Skin Care"
  | "Kidney & Urinary"
  | "Joint & Pain Relief"
  | "Nutrition & Immunity"
  | "Digestive Health";

export type PreparationMethod = {
  title: string;
  instructions: string;
};

export type Plant = {
  id: string;
  name: string;
  scientific_name: string;
  family: string;
  imageUrl: string; // primary photo — used in list/thumbnail views
  images: string[]; // up to 3 photos for the detail screen gallery
  tags: PlantTag[];
  about: string;
  benefits: string[];
  preparations: PreparationMethod[];
  precautions: string;
  funFact: string;
  alternatives: string[];
};

export const PLANTS: Plant[] = [
  {
    id: "akapulko",
    name: "Akapulko",
    scientific_name: "Senna alata",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/akapulko.jpg"),
    images: [cloudinaryUrl("plants/akapulko.jpg"), cloudinaryUrl("plants/akapulko-2.jpg"), cloudinaryUrl("plants/akapulko-3.jpg"), cloudinaryUrl("plants/akapulko-4.jpg"), cloudinaryUrl("plants/akapulko-5.jpg")],
    tags: ["Skin Care", "Wound"],
    about:
      "Akapulko, often nicknamed the \"ringworm bush,\" is a tall shrub that is easy to spot because of its bright yellow flower spikes that stand upright like candles, and its long leaves made of many pairs of rounded leaflets. It grows freely along roadsides, empty lots, and backyards all over the Philippines, and does well in both full sun and partial shade. For generations, Filipino families have picked its fresh leaves as the first thing to try for itchy, fungus-type skin problems such as ringworm, athlete's foot, and skin patches that keep coming back. It is one of the ten herbal plants endorsed by the Philippine Department of Health, and it is usually applied on the skin rather than taken by mouth. Many households prepare it as a simple rub or wash and keep a plant nearby so fresh leaves are always within reach.",
    benefits: [
      "Commonly used to help manage ringworm, athlete's foot, and similar fungus-type skin problems",
      "Helps ease the itching and irritation that come with skin infections",
      "Can help skin look clearer and healthier when used steadily for one to two weeks",
      "Used as a natural wash to keep small affected skin areas clean",
      "Traditionally used to soothe insect bites and mild skin rashes",
      "Easy to find and free to grow, making it a convenient first-step home remedy",
    ],
    preparations: [
      {
        title: "Fresh-leaf rub",
        instructions:
          "Pick a handful of fresh, healthy leaves and wash them well. Crush or rub them between your palms until the juice comes out. Clean the affected area with mild soap and water, pat it dry, then rub the crushed leaves directly onto the skin. Do this 2–3 times a day for 1–2 weeks, or until the skin clears. Use freshly crushed leaves each time.",
      },
      {
        title: "Leaf decoction wash",
        instructions:
          "Boil a cup of chopped leaves in 2 cups of water for 10–15 minutes. Let it cool completely, then strain. Use the liquid to wash the affected area morning and night, patting the skin dry afterward. Keep any leftover liquid in a clean, covered container in the refrigerator and use it within 2 days.",
      },
      {
        title: "Leaf paste",
        instructions:
          "Grind a few washed leaves with a tiny bit of water into a thick paste. Spread a thin layer over the affected patch and leave it on for about 15–20 minutes before rinsing gently with clean water.",
      },
    ],
    precautions:
      "For external use only — never swallow it. Stop using it right away if the skin becomes redder, starts to burn, or gets more irritated. Do not apply to open wounds, cracked or bleeding skin, or near the eyes. Not recommended for infants unless a doctor says it is okay. If the skin problem is spreading, painful, oozing, or has not improved after 2 weeks, see a doctor or health worker.",
    funFact:
      "Akapulko belongs to a group of plants that are known in other countries as laxative herbs, but in Philippine tradition this particular plant is almost always used on the skin, not taken by mouth.",
    alternatives: ["Madre de Cacao", "Guava"],
  },
  {
    id: "alagao",
    name: "Alagao",
    scientific_name: "Premna odorata",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/alagao.jpg"),
    images: [cloudinaryUrl("plants/alagao.jpg"), cloudinaryUrl("plants/alagao-2.jpg"), cloudinaryUrl("plants/alagao-3.jpg"), cloudinaryUrl("plants/alagao-4.jpg"), cloudinaryUrl("plants/alagao-5.jpg")],
    tags: ["Cough", "Fever"],
    about:
      "Alagao is a small tree or large shrub that grows in lowland areas and thickets throughout the Philippines. Its leaves give off a distinct, slightly sharp smell when crushed, which many people recognize right away. It is closely related to Lagundi and is used in very similar ways, especially for cough, colds, and mild fever. In provinces where Lagundi is harder to find, Alagao is often the go-to household remedy. Families usually boil the leaves into a warm drink, sometimes with a slice of ginger added for extra warmth and comfort, and the same liquid can be used to gargle when the throat feels scratchy or sore.",
    benefits: [
      "Helps relieve persistent cough and a heavy, congested chest",
      "Eases the general discomfort that comes with colds",
      "Helps bring down mild fever",
      "Soothes a sore or scratchy throat when used as a gargle",
      "Can help loosen phlegm so coughs feel less dry and tiring",
      "Warm drink is comforting and helps you rest when feeling under the weather",
    ],
    preparations: [
      {
        title: "Leaf decoction (drink)",
        instructions:
          "Wash a handful of fresh leaves and boil them in 2 cups of water for 10–15 minutes, until the liquid reduces slightly. Strain, then let it cool to a warm (not hot) temperature. Drink 1/2 cup up to 3 times a day for up to a week. For extra comfort, add a few slices of ginger while boiling and a little honey after straining (not for babies under 1 year old).",
      },
      {
        title: "Throat gargle",
        instructions:
          "Use the same leaf decoction, fully cooled to a comfortable warmth. Gargle for about 30 seconds, 2–3 times a day, and spit it out afterward instead of swallowing.",
      },
      {
        title: "Steam inhalation",
        instructions:
          "Put a handful of crushed leaves in a bowl of hot water, lean over it with a towel draped over your head, and breathe in the steam gently for 5 minutes to help ease a stuffy nose. Keep your face at a comfortable distance to avoid steam burns.",
      },
    ],
    precautions:
      "See a doctor if the fever lasts more than 3 days or gets worse, or if the cough goes on for more than a week. Difficulty breathing, chest pain, or coughing up blood needs medical attention right away. Its safety during pregnancy has not been well established, so pregnant or breastfeeding women should check with a doctor first.",
    funFact:
      "Alagao and Lagundi come from the same wider plant group and were once even placed in the same plant family, which is why traditional healers often use the two almost interchangeably.",
    alternatives: ["Lagundi", "Oregano"],
  },
  {
    id: "aloe-vera",
    name: "Aloe Vera",
    scientific_name: "Aloe vera",
    family: "Asphodelaceae (Aloe family)",
    imageUrl: cloudinaryUrl("plants/aloe-vera.jpg"),
    images: [cloudinaryUrl("plants/aloe-vera.jpg"), cloudinaryUrl("plants/aloe-vera-2.jpg"), cloudinaryUrl("plants/aloe-vera-3.jpg"), cloudinaryUrl("plants/aloe-vera-4.jpg"), cloudinaryUrl("plants/aloe-vera-5.jpg")],
    tags: ["Skin Care", "Wound"],
    about:
      "Aloe vera is a thick, fleshy plant with long, pointed leaves that store water inside. When you cut a leaf open, you find a clear, slippery, cooling gel that people have used for skin care for thousands of years. It is a common potted plant in Filipino homes, often kept near the door or window so it can be reached quickly when someone gets a sunburn, a small burn from the stove, or dry, itchy skin. The gel feels cool and soothing right away, keeps the skin moist, and is also popular as a natural conditioner for hair and scalp. Many store-bought lotions and gels use aloe, but fresh gel straight from the leaf is simple and inexpensive to use at home.",
    benefits: [
      "Cools and soothes sunburn and other minor skin irritation",
      "Moisturizes dry, flaky, or tight-feeling skin without feeling heavy",
      "Helps minor wounds and superficial burns heal more comfortably",
      "Helps calm redness and the hot, stinging feeling after too much sun",
      "Can be used as a light natural conditioner for hair and scalp",
      "Soothing after shaving or after mild skin irritation from weather",
    ],
    preparations: [
      {
        title: "Fresh gel application",
        instructions:
          "Choose a mature, thick leaf from the outer part of the plant. Wash it, cut it near the base, and let the yellow liquid drain out for a few minutes. Slice the leaf open lengthwise and scoop the clear gel with a clean spoon. Apply a thin layer to clean skin, leave it on for 15–20 minutes, then rinse or let it absorb. Fresh gel is best used within a few hours.",
      },
      {
        title: "Minor burn first aid",
        instructions:
          "For a small, mild burn, first cool it under clean running water for several minutes. Once the heat is gone, apply a thin layer of fresh gel and reapply every 3–4 hours. Store any extra gel in a sealed container in the refrigerator for up to 2–3 days.",
      },
      {
        title: "Hair and scalp treatment",
        instructions:
          "Massage a few spoonfuls of fresh gel into damp hair and scalp, leave it on for 20–30 minutes, and rinse well with lukewarm water. Use once a week for softer, more manageable hair.",
      },
    ],
    precautions:
      "Do not use the bitter yellow liquid just under the leaf skin — it can irritate the skin and upset the stomach. Always test a small patch on your inner arm first and wait several hours, as some people are sensitive to aloe. Do not put it on deep, dirty, or infected wounds, and see a doctor for large or blistering burns.",
    funFact:
      "Aloe vera can go for weeks without water because its leaves store their own supply inside — the same gel that helps your skin is what keeps the plant alive during dry spells.",
    alternatives: ["Akapulko", "Takip-Kohol"],
  },
  {
    id: "ampalaya",
    name: "Ampalaya",
    scientific_name: "Momordica charantia",
    family: "Cucurbitaceae (Gourd family)",
    imageUrl: cloudinaryUrl("plants/ampalaya.jpg"),
    images: [cloudinaryUrl("plants/ampalaya.jpg"), cloudinaryUrl("plants/ampalaya-2.jpg"), cloudinaryUrl("plants/ampalaya-3.jpg"), cloudinaryUrl("plants/ampalaya-4.jpg"), cloudinaryUrl("plants/ampalaya-5.jpg")],
    tags: ["Diabetes", "Digestive Health"],
    about:
      "Ampalaya, also called bitter melon or bitter gourd, is a climbing vine that grows the bumpy, green, very bitter fruit found in favorite dishes like pinakbet and ginisang ampalaya. It is one of the best-known medicinal plants in the Philippines and is recognized by the Department of Health for traditional support in managing blood sugar. Both the fruit and the leaves are used: the fruit is cooked as a vegetable, and the leaves are boiled into a tea. Many Filipino families with a member who watches their sugar intake include ampalaya in regular meals. Its bitterness is part of its character — the more bitter the fruit, the more people associate it with its traditional benefits.",
    benefits: [
      "Traditionally used to help keep blood sugar levels in a healthy range",
      "Supports healthy digestion when eaten regularly as a vegetable",
      "A good source of vitamin C and other nutrients that help the body stay strong",
      "Helps you feel full because of its fiber, which can help with weight management",
      "Traditionally used to ease mild inflammation and body heat",
      "The leaves can be made into a tea, giving another way to enjoy the plant",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Wash a handful of fresh leaves, chop them, and boil in 2 cups of water for 15 minutes. Strain and drink about 1/3 cup up to 3 times a day, ideally before meals. The taste is bitter, so you can add a small slice of ginger, but avoid adding sugar.",
      },
      {
        title: "Sautéed fruit dish",
        instructions:
          "Slice the fruit lengthwise and scrape out the seeds and white inner part to reduce bitterness. Slice thinly, sprinkle with salt, and let it sit for 10 minutes, then squeeze out the liquid. Sauté with garlic, onion, and tomato, and add beaten egg near the end for a classic ginisang ampalaya.",
      },
      {
        title: "Simple boiled ampalaya",
        instructions:
          "Boil sliced fruit briefly in water for 3–5 minutes until just tender, then drain. Eat as a side dish with a little vinegar or calamansi for a lighter, less oily option.",
      },
    ],
    precautions:
      "People taking insulin or diabetes medicine should be careful, because ampalaya can make blood sugar drop lower than expected — monitor closely and talk to a doctor before using it regularly. It should not replace prescribed medicine. Pregnant women should avoid large amounts because it has traditionally been linked to uterine contractions. Eating a lot on an empty stomach may cause stomach upset for some people.",
    funFact:
      "Ampalaya grown in full sun tends to taste more bitter, so some home gardeners deliberately give the vine a little shade if they prefer a milder fruit for cooking.",
    alternatives: ["Banaba", "Tsaang Gubat"],
  },
  {
    id: "Aratiles",
    name: "Aratiles",
    scientific_name: "Muntingia calabura",
    family: "Muntingiaceae",
    imageUrl: cloudinaryUrl("plants/aratiles.jpg"),
    images: [cloudinaryUrl("plants/aratiles.jpg"), cloudinaryUrl("plants/aratiles-2.jpg"), cloudinaryUrl("plants/aratiles-3.jpg"), cloudinaryUrl("plants/aratiles-4.jpg"), cloudinaryUrl("plants/aratiles-5.jpg")],
    tags: ["Fever", "Cough", "Joint & Pain Relief"],
    about:
      "Aratiles, also known as Jamaican cherry or Panama berry, is a fast-growing tree that provides good shade and is common in vacant lots, schoolyards, and roadsides. It is easy to recognize by its tiny, sweet, red berries that ripen almost all year round and by its small white flowers. For many Filipino kids, climbing an aratiles tree to snack on its fruit is a childhood memory. Beyond being a treat, its leaves and flowers are used in home remedies for headaches, body pains, colds, and mild swelling. The tea made from them is mild and gently sweet, making it a comfortable remedy for the whole family.",
    benefits: [
      "Helps relieve headaches and general body aches",
      "Supports relief from colds, cough, and stuffy nose",
      "Helps ease mild swelling and body pain",
      "The ripe fruit is a sweet source of vitamin C and minerals like calcium and iron",
      "Traditionally used to calm mild stomach upset",
      "Its tea has a mild, pleasant taste that is easy to drink",
    ],
    preparations: [
      {
        title: "Leaf & flower tea",
        instructions:
          "Wash a handful of leaves and flowers and boil them in 2 cups of water for 10–15 minutes. Strain and drink warm, 1 cup up to twice a day, for 2–3 days as needed for colds or headache relief.",
      },
      {
        title: "Fresh fruit",
        instructions:
          "Pick fully ripe fruit that is deep red and slightly soft — this is when it is sweetest and easiest to digest. Wash and eat fresh as a snack. It can also be blended into a simple cold drink.",
      },
      {
        title: "Fruit jam",
        instructions:
          "Simmer ripe fruit with a little sugar and a squeeze of calamansi until thick. Cool and store in a clean jar in the refrigerator for up to a week.",
      },
    ],
    precautions:
      "Generally well tolerated as a food and mild tea, but it should not replace medical care for severe or lasting headaches or fevers. See a doctor if a fever lasts more than 3 days. If you are pregnant, or taking regular medicine, check with a doctor before drinking the tea daily.",
    funFact:
      "Aratiles trees can fruit almost nonstop through the year, which is why the tiny red berries are such a familiar, always-available snack for kids climbing trees after school.",
    alternatives: ["Yerba Buena", "Lagundi"],
  },
  {
    id: "atis",
    name: "Atis",
    scientific_name: "Annona squamosa",
    family: "Annonaceae (Custard-apple family)",
    imageUrl: cloudinaryUrl("plants/atis.jpg"),
    images: [cloudinaryUrl("plants/atis.jpg"), cloudinaryUrl("plants/atis-2.jpg"), cloudinaryUrl("plants/atis-3.jpg"), cloudinaryUrl("plants/atis-4.jpg"), cloudinaryUrl("plants/atis-5.jpg")],
    tags: ["Digestive Health", "Skin Care"],
    about:
      "Atis, also called sugar apple, is a small tree grown across the Philippines for its sweet, creamy fruit that has a bumpy, green skin and black seeds inside. When ripe, the fruit is soft and easily pulled apart, and the sweet white flesh is a treat in the hot season. Besides the fruit, the leaves have a place in home remedies for upset stomach and minor skin problems. They are usually boiled into a tea or crushed into a paste. The seeds, however, are not for eating and are never used as medicine — in the past they were crushed and used as a natural pest killer, which shows why they should be kept away from the mouth and eyes.",
    benefits: [
      "Helps relieve digestive discomfort and mild stomach upset",
      "Traditionally applied to minor skin irritations and insect bites",
      "Supports regular digestion, especially when the ripe fruit is eaten",
      "The ripe fruit is a good source of vitamin C, fiber, and potassium",
      "Provides natural sweetness and energy without needing added sugar",
      "Leaves are sometimes used externally in folk remedies for head lice",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Wash 4–5 fresh leaves and boil them in 2 cups of water for 10 minutes. Strain and drink 1/2 cup after meals for digestive discomfort, for up to 3 days.",
      },
      {
        title: "Leaf poultice",
        instructions:
          "Crush a few clean leaves into a paste and apply to the affected skin area for 15–20 minutes before rinsing off. Do not use on broken skin or open wounds.",
      },
      {
        title: "Ripe fruit",
        instructions:
          "Wait until the fruit is soft to the touch and the skin has started to separate between the segments. Scoop out the flesh with a spoon and spit out the seeds — never chew or swallow them.",
      },
    ],
    precautions:
      "The seeds and unripe fruit are harmful and must never be eaten. Keep the crushed seeds and juice away from the eyes, as they can cause strong irritation. Use leaf preparations in moderation and stop if any stomach discomfort develops. Keep young children away from the seeds.",
    funFact:
      "Each bumpy segment on the outside of an atis fruit is actually one small section of the fruit, so the whole fruit is really a cluster of many small fruits joined together.",
    alternatives: ["Tsaang Gubat", "Akapulko"],
  },
  {
    id: "banaba",
    name: "Banaba",
    scientific_name: "Lagerstroemia speciosa",
    family: "Lythraceae (Loosestrife family)",
    imageUrl: cloudinaryUrl("plants/banaba.jpg"),
    images: [cloudinaryUrl("plants/banaba.jpg"), cloudinaryUrl("plants/banaba-2.jpg"), cloudinaryUrl("plants/banaba-3.jpg"), cloudinaryUrl("plants/banaba-4.jpg"), cloudinaryUrl("plants/banaba-5.jpg")],
    tags: ["Diabetes", "Kidney & Urinary"],
    about:
      "Banaba is a medium-sized tree known for its beautiful purple-pink flowers, and it is often planted along streets and in parks for its shade and color. It is recognized by the Department of Health for traditional support in keeping blood sugar in a healthy range, and its leaves are the part used. Banaba is also valued for supporting the kidneys and the urinary system. Unlike remedies taken only when someone is sick, banaba tea is usually taken as a daily wellness drink, a bit like regular tea, and many families in the provinces keep dried leaves in the kitchen for this purpose.",
    benefits: [
      "Traditionally used to help keep blood sugar levels in a healthy range",
      "Supports a healthy urinary system",
      "May help ease mild water retention and swelling",
      "A mild-tasting tea that is easy to drink daily",
      "Often used as a long-term wellness drink rather than a one-time remedy",
      "Leaves are easy to dry and store for year-round use",
    ],
    preparations: [
      {
        title: "Dried leaf tea",
        instructions:
          "Steep 1 tablespoon of dried banaba leaves in 1 cup of hot water for 10 minutes. Strain and drink once or twice daily, preferably about 30 minutes before meals.",
      },
      {
        title: "Fresh leaf decoction",
        instructions:
          "Wash and chop 4–5 fresh leaves, then simmer in 1 cup of water for 10 minutes. Strain and drink the same way as the dried version. Fresh leaves give a milder taste.",
      },
      {
        title: "Drying leaves at home",
        instructions:
          "Choose mature, healthy leaves, wash, and pat dry. Spread them out in a shaded, airy place for several days until crisp. Store in a clean, dry, covered jar away from sunlight.",
      },
    ],
    precautions:
      "It can lower blood sugar, so people taking diabetes medicine should monitor their levels closely and consult a doctor before regular use. It should never replace prescribed treatment. People with kidney disease should ask a doctor before drinking it daily. Pregnant and breastfeeding women should check with a doctor first.",
    funFact:
      "Banaba trees put on a spectacular show in the dry season, when they are covered with big purple flowers, usually around April to June, which many provinces treat as a seasonal marker.",
    alternatives: ["Ampalaya", "Sambong"],
  },
  {
    id: "basil",
    name: "Basil",
    scientific_name: "Ocimum basilicum",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/basil.jpg"),
    images: [cloudinaryUrl("plants/basil.jpg"), cloudinaryUrl("plants/basil-2.jpg"), cloudinaryUrl("plants/basil-3.jpg"), cloudinaryUrl("plants/basil-4.jpg"), cloudinaryUrl("plants/basil-5.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    about:
      "Basil is a fragrant, easy-to-grow herb often found in home gardens and pots. Its soft green leaves have a sweet, slightly peppery smell and are used in cooking as well as in gentle home remedies. A cup of basil tea after a big meal is a familiar way to ease a bloated or gassy stomach, and its aroma alone has a calming effect for many people. It grows quickly, and regularly picking the leaves actually makes the plant grow bushier, so a single pot can supply a household for months.",
    benefits: [
      "Supports healthy digestion and helps ease bloating and gas",
      "Promotes general well-being when used regularly in moderate amounts",
      "Its aroma is calming and helps ease mild stress",
      "Adds fresh flavor to food without extra salt or sugar",
      "Chewing a fresh leaf helps freshen breath",
      "Easy to grow indoors or outdoors, so it is always at hand",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Steep a small handful of fresh basil leaves in 1 cup of hot water for 5–7 minutes. Cover the cup while steeping to keep the aroma in. Drink after meals to help with digestion.",
      },
      {
        title: "Fresh in food",
        instructions:
          "Tear fresh leaves into salads or add whole leaves to soups, pasta, or egg dishes near the end of cooking, so the flavor stays bright and the aroma is not lost.",
      },
      {
        title: "Fresh leaf chew",
        instructions:
          "Wash a leaf or two and chew slowly after eating for fresher breath and a settled stomach.",
      },
    ],
    precautions:
      "Safe as a kitchen herb and as a mild tea in normal amounts. Strong basil extracts and oils are not the same as the fresh leaf tea and should be avoided in large amounts during pregnancy. If you take blood thinning medicine, check with a doctor before using basil in large amounts regularly.",
    funFact:
      "Basil's scent is very similar to the smell of cloves, which is why the two sometimes appear together in home remedy blends.",
    alternatives: ["Yerba Buena", "Pandan"],
  },
  {
    id: "bayabas",
    name: "Bayabas (Guava)",
    scientific_name: "Psidium guajava",
    family: "Myrtaceae (Myrtle family)",
    imageUrl: cloudinaryUrl("plants/bayabas.jpg"),
    images: [cloudinaryUrl("plants/bayabas.jpg"), cloudinaryUrl("plants/bayabas-2.jpg"), cloudinaryUrl("plants/bayabas-3.jpg"), cloudinaryUrl("plants/bayabas-4.jpg"), cloudinaryUrl("plants/bayabas-5.jpg")],
    tags: ["Wound", "Digestive Health"],
    about:
      "Bayabas, or guava, is a small tree found in almost every Philippine backyard. Most people know it for its sweet-sour fruit, but the leaves are just as valued at home. Boiled guava leaf water is the classic Filipino way to clean small wounds and cuts, and it is also used as a mouth rinse for sore gums and bad breath. A warm cup of the same leaf tea has long been used to settle an upset stomach and loose bowel movement. In many rural homes, guava leaves are treated as an important part of the first-aid kit.",
    benefits: [
      "Helps clean and disinfect minor wounds and cuts",
      "Helps skin recover from small scrapes and cuts",
      "Traditionally used to help with loose bowel movements and stomach upset",
      "Used as a gentle mouth and gum rinse for freshness",
      "The ripe fruit is rich in vitamin C and fiber",
      "Free, easy to find, and simple to prepare",
    ],
    preparations: [
      {
        title: "Wound wash",
        instructions:
          "Wash a handful of fresh leaves and boil in 2 cups of water for 10–15 minutes. Let it cool fully, strain, and use the liquid to rinse the wound 2–3 times a day. Make a fresh batch daily.",
      },
      {
        title: "Digestive decoction",
        instructions:
          "Drink 1/2 cup of the same cooled decoction for stomach upset, up to 3 times a day for no more than 2 days. Drink plenty of clean water and oral rehydration fluids along with it.",
      },
      {
        title: "Mouth rinse",
        instructions:
          "Use the cooled decoction to gargle or rinse the mouth for 30 seconds, 2–3 times daily, to freshen breath and soothe sore gums. Spit it out afterward.",
      },
    ],
    precautions:
      "For deep, dirty, or badly bleeding wounds, see a doctor rather than relying on a home wash. If diarrhea goes beyond 2 days, or comes with fever, blood, or signs of dehydration (very dry mouth, little urine, dizziness), seek medical help — this is especially important for children and older adults.",
    funFact:
      "Guava fruit can have several times more vitamin C than an orange, so the fruit itself is a quiet powerhouse for staying healthy.",
    alternatives: ["Akapulko", "Tsaang Gubat"],
  },
  {
    id: "bignay",
    name: "Bignay",
    scientific_name: "Antidesma bunius",
    family: "Phyllanthaceae",
    imageUrl: cloudinaryUrl("plants/bignay.jpg"),
    images: [cloudinaryUrl("plants/bignay.jpg"), cloudinaryUrl("plants/bignay-2.jpg"), cloudinaryUrl("plants/bignay-3.jpg"), cloudinaryUrl("plants/bignay-4.jpg"), cloudinaryUrl("plants/bignay-5.jpg")],
    tags: ["Digestive Health", "Kidney & Urinary", "Nutrition & Immunity"],
    about:
      "Bignay is a tree native to the Philippines, known for its long, hanging bunches of small berries that change from green to red to dark purple-black as they ripen. The ripe fruits are tart with a touch of sweetness, and are often made into wine, jam, juice, or vinegar. The deep color of the fruit is a sign of its rich nutrition. The leaves are also boiled into a tea in traditional remedies for digestive and urinary comfort. A bignay tree loaded with berries is a beautiful sight and a favorite among families who make homemade preserves.",
    benefits: [
      "Supports healthy digestion",
      "Promotes urinary comfort and wellness",
      "The dark ripe fruit is packed with natural goodness that helps keep the body strong",
      "May help support the body's defenses against common illnesses",
      "A traditional source of vitamin C",
      "Versatile in the kitchen for juice, jam, wine, and vinegar",
    ],
    preparations: [
      {
        title: "Fresh fruit / simple preparations",
        instructions:
          "Choose fruits that are fully dark purple-black and slightly soft. Wash and eat fresh, or simmer with a little sugar and a splash of water until thick to make a simple jam or syrup. Store in a clean, covered jar in the refrigerator.",
      },
      {
        title: "Leaf decoction",
        instructions:
          "Wash a handful of leaves and boil in 2 cups of water for 10–15 minutes. Strain and drink 1/2 cup once or twice daily.",
      },
      {
        title: "Bignay juice",
        instructions:
          "Crush ripe berries in a bowl, add water, strain, and sweeten lightly. Serve chilled and drink the same day for best flavor.",
      },
    ],
    precautions:
      "Do not eat unripe fruit (green to red), as it is very sour and rough and can upset the stomach. Wait until the fruit is fully dark and soft. The dark juice stains clothes and fingers, so handle with care. People with kidney disease should ask a doctor before drinking the leaf tea regularly.",
    funFact:
      "Bignay wine is a genuine specialty in parts of the Philippines, especially in Ilocos, where the deep-colored berries are fermented much like grapes.",
    alternatives: ["Sampaloc", "Pomelo"],
  },
  {
    id: "calamansi",
    name: "Calamansi",
    scientific_name: "Citrus microcarpa",
    family: "Rutaceae (Citrus family)",
    imageUrl: cloudinaryUrl("plants/calamansi.jpg"),
    images: [cloudinaryUrl("plants/calamansi.jpg"), cloudinaryUrl("plants/calamansi-2.jpg"), cloudinaryUrl("plants/calamansi-3.jpg"), cloudinaryUrl("plants/calamansi-4.jpg"), cloudinaryUrl("plants/calamansi-5.jpg")],
    tags: ["Cough", "Nutrition & Immunity"],
    about:
      "Calamansi is a small, round, sour citrus fruit, sometimes called the Philippine lime, that is found in almost every Filipino kitchen. It is squeezed over pancit, grilled fish, and sawsawan, and it is also one of the most common things people reach for at the first sign of a cough or cold. A warm drink of calamansi juice with honey is a classic home remedy passed down through families. The fruit is high in vitamin C, and both the juice and the peel have uses at home, from drinks to cleaning to freshening hair and skin.",
    benefits: [
      "A great source of vitamin C that helps the body fight off common colds",
      "Helps relieve cough and cold symptoms",
      "Helps soothe a mild sore throat",
      "Supports overall immune health when taken regularly in food and drinks",
      "Refreshing, hydrating drink that is easy to make",
      "When diluted, traditionally used to lighten dark elbows and minor skin blemishes",
    ],
    preparations: [
      {
        title: "Warm honey-calamansi drink",
        instructions:
          "Squeeze the juice of 3–4 calamansi into a glass of warm water, remove the seeds, and add a teaspoon of honey if desired. Drink 2–3 times a day at the first sign of a cold, continuing for 3–5 days. Do not give honey to babies under 1 year old.",
      },
      {
        title: "Salt-water gargle",
        instructions:
          "Mix the juice of 2 calamansi with a pinch of salt in a glass of warm water. Gargle for 30 seconds, 2–3 times a day for a sore throat, and spit it out afterward.",
      },
      {
        title: "Cold calamansi juice",
        instructions:
          "Mix the juice of 5–6 fruits with a glass of cold water and a little honey or sugar to taste. Serve over ice for a refreshing drink.",
      },
    ],
    precautions:
      "Calamansi is acidic and can irritate a sensitive stomach, especially on an empty stomach, and it can wear down tooth enamel if used often. Rinse your mouth with plain water after drinking it. People with acid reflux or ulcers should use it in small amounts. If a cough lasts more than a week, see a doctor.",
    funFact:
      "Calamansi is believed to be a natural cross between a mandarin orange and a kumquat, which explains its small size and thin, edible skin.",
    alternatives: ["Dayap", "Pomelo"],
  },
  {
    id: "cassava",
    name: "Cassava",
    scientific_name: "Manihot esculenta",
    family: "Euphorbiaceae (Spurge family)",
    imageUrl: cloudinaryUrl("plants/cassava.jpg"),
    images: [cloudinaryUrl("plants/cassava.jpg"), cloudinaryUrl("plants/cassava-2.jpg"), cloudinaryUrl("plants/cassava-3.jpg"), cloudinaryUrl("plants/cassava-4.jpg"), cloudinaryUrl("plants/cassava-5.jpg")],
    tags: ["Nutrition & Immunity"],
    about:
      "Cassava is a hardy root crop grown all over the Philippines, and it grows well even in poor soil where other crops struggle. The long brown roots are starchy and filling, making cassava an affordable source of energy for many families, especially in places where rice is expensive or hard to find. It is boiled, steamed, fried, or turned into favorite treats like kakanin, cassava cake, and suman. Because it is filling and easy to digest when cooked properly, it is also a common food during recovery from illness. It must always be cooked well, because raw or undercooked cassava can be harmful.",
    benefits: [
      "A filling, energy-rich food that helps keep you going through the day",
      "Traditionally used to support nutrition during recovery from illness",
      "Naturally free of gluten, which makes it a good staple for people who avoid wheat",
      "Young leaves, when properly cooked, add extra vitamins and protein",
      "Affordable and widely available across the Philippines",
      "Very versatile — can be boiled, steamed, grated, baked, or fried",
    ],
    preparations: [
      {
        title: "Boiled root",
        instructions:
          "Peel the root, remove the woody center core, and cut into chunks. Boil in plenty of water for at least 20–30 minutes until completely tender. Drain and discard the cooking water. Serve warm with a little sugar, grated coconut, or as a side to fish and vegetables.",
      },
      {
        title: "Prepared leaves",
        instructions:
          "Only use young, tender leaves. Boil thoroughly, changing the water once partway through, then drain well before sautéing with garlic and onion or adding to coconut-milk dishes.",
      },
      {
        title: "Cassava cake",
        instructions:
          "Grate peeled cassava and mix with coconut milk, sugar, and eggs. Bake until golden and firm. This is a classic Filipino dessert and a good way to enjoy the root.",
      },
    ],
    precautions:
      "Never eat cassava raw or undercooked, as it can cause serious poisoning. Always peel it, cook it thoroughly, and throw away the cooking water. Bitter varieties need extra care in preparation. Seek medical help right away if someone develops dizziness, vomiting, or stomach pain after eating cassava.",
    funFact:
      "Cassava is one of the toughest food crops in the world and can survive dry spells and poor soil, which is why it is a valuable backup food in areas hit by typhoons or drought.",
    alternatives: ["Sweet Potato", "Saluyot"],
  },
  {
    id: "dayap",
    name: "Dayap",
    scientific_name: "Citrus aurantiifolia",
    family: "Rutaceae (Citrus family)",
    imageUrl: cloudinaryUrl("plants/dayap.jpg"),
    images: [cloudinaryUrl("plants/dayap.jpg"), cloudinaryUrl("plants/dayap-2.jpg"), cloudinaryUrl("plants/dayap-3.jpg"), cloudinaryUrl("plants/dayap-4.jpg"), cloudinaryUrl("plants/dayap-5.jpg")],
    tags: ["Cough", "Digestive Health", "Nutrition & Immunity"],
    about:
      "Dayap, the Philippine lime, is a small, very sour citrus fruit that looks like calamansi but is a little larger and rounder, with a strong lime scent. It is used in much the same way as calamansi — squeezed into drinks, sauces, and soups, and used as a vitamin C boost for colds and coughs. Many people also use its juice for an upset stomach or after a heavy, oily meal, since its sharp sourness cuts through richness. The green fruit is very juicy when ripe and gives off a lovely fragrance when the skin is scratched.",
    benefits: [
      "Helps ease cough and cold discomfort",
      "Supports digestion, especially after heavy or oily meals",
      "A good source of vitamin C",
      "Helps freshen breath and soothe mild throat irritation",
      "Adds strong flavor to food so less salt is needed",
      "Traditionally used in hair rinses to keep the scalp feeling fresh",
    ],
    preparations: [
      {
        title: "Honey-lime drink",
        instructions:
          "Squeeze 2–3 dayap fruits into a glass of warm water and add a teaspoon of honey if you like. Drink up to twice a day for cough or cold relief for a few days. Do not give honey to babies under 1 year old.",
      },
      {
        title: "Digestive rinse",
        instructions:
          "Dilute a tablespoon of juice in a full glass of water and sip slowly after meals for an upset stomach.",
      },
      {
        title: "Fresh lime water",
        instructions:
          "Add the juice of one dayap to a big jug of cold water with a little honey for a light, refreshing drink through the day.",
      },
    ],
    precautions:
      "Very acidic — can bother people with acid reflux, ulcers, or sensitive teeth, especially if used undiluted or in large amounts. Rinse your mouth with plain water after drinking. The juice on skin, followed by strong sunlight, can sometimes cause irritation or dark marks, so wash your hands and skin after handling in the sun.",
    funFact:
      "Dayap is closely related to the key lime, and Filipino cooks often swap it for calamansi in dipping sauces — though because it is more sour, recipes usually need less of it.",
    alternatives: ["Calamansi", "Pomelo"],
  },
  {
    id: "gumamela",
    name: "Gumamela",
    scientific_name: "Hibiscus rosa-sinensis",
    family: "Malvaceae (Mallow family)",
    imageUrl: cloudinaryUrl("plants/gumamela.jpg"),
    images: [cloudinaryUrl("plants/gumamela.jpg"), cloudinaryUrl("plants/gumamela-2.jpg"), cloudinaryUrl("plants/gumamela-3.jpg"), cloudinaryUrl("plants/gumamela-4.jpg"), cloudinaryUrl("plants/gumamela-5.jpg")],
    tags: ["Fever", "Cough", "Joint & Pain Relief"],
    about:
      "Gumamela, or the hibiscus flower, is a familiar sight in Philippine yards and fences, with big, colorful blooms in red, pink, yellow, and white. It is grown as much for decoration as for home use. The flowers and leaves are used in remedies for fever and cough, and the crushed leaves are sometimes placed on swollen spots. The flower tea has a mild, slightly tart flavor and a pretty color. In many homes, gumamela flowers are also used for hair care, with crushed petals rubbed into the scalp to keep it healthy-looking.",
    benefits: [
      "Helps reduce fever",
      "Relieves cough and mild throat irritation",
      "Helps ease mild swelling and localized body pain",
      "The flower tea is refreshing and slightly tart, like commercial hibiscus tea",
      "Traditionally used in hair care to support a healthy scalp",
      "Easy to find in almost any Filipino neighborhood",
    ],
    preparations: [
      {
        title: "Flower & leaf tea",
        instructions:
          "Wash a handful of fresh flowers and leaves and boil in 2 cups of water for 10 minutes. Strain and drink warm, 1/2 cup up to 3 times a day, for 1–2 days to help bring down fever.",
      },
      {
        title: "Leaf poultice for swelling",
        instructions:
          "Crush fresh, washed leaves into a paste and apply to the swollen area for 20 minutes before rinsing off. Repeat up to twice a day.",
      },
      {
        title: "Hair rinse",
        instructions:
          "Soak a handful of petals in warm water for 15 minutes, mash, and use the liquid to massage the scalp. Rinse well with clean water after 15–20 minutes.",
      },
    ],
    precautions:
      "Pregnant women should avoid taking medicinal amounts, as hibiscus has traditionally been linked to effects on the womb; occasional tea as a drink is usually considered lower risk, but check with a doctor if pregnant or trying to conceive. If a fever lasts beyond 2–3 days, see a doctor. Stop use if any skin irritation appears.",
    funFact:
      "Gumamela is known as the \"shoe flower\" in some countries because its petals were used to polish shoes.",
    alternatives: ["Lagundi", "Turmeric"],
  },
  {
    id: "ipil-ipil",
    name: "Ipil-Ipil",
    scientific_name: "Leucaena leucocephala",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/ipil-ipil.jpg"),
    images: [cloudinaryUrl("plants/ipil-ipil.jpg"), cloudinaryUrl("plants/ipil-ipil-2.jpg"), cloudinaryUrl("plants/ipil-ipil-3.jpg"), cloudinaryUrl("plants/ipil-ipil-4.jpg"), cloudinaryUrl("plants/ipil-ipil-5.jpg")],
    tags: ["Wound", "Digestive Health"],
    about:
      "Ipil-ipil is a fast-growing tree with fine, feathery leaves and small white flower balls, found all over the Philippine countryside. It is often planted as a natural fence or to protect soil and bring back the health of tired land. Its leaves have a long history in home remedies for cleaning wounds, and in some places the young leaves are also cooked as food in small amounts. Its seeds have been used in folk medicine, but they need great caution and are best left alone. Ipil-ipil is also valued by farmers as animal feed and firewood.",
    benefits: [
      "Supports wound cleaning and healing when used externally as a leaf wash or poultice",
      "Traditionally used to help with digestive discomfort",
      "Young leaves are sometimes cooked and eaten in small amounts as a vegetable",
      "Historically used in folk practice for stomach worms",
      "Improves the soil where it grows, helping nearby crops",
      "Provides shade, fence posts, firewood, and animal feed for farming families",
    ],
    preparations: [
      {
        title: "Wound wash",
        instructions:
          "Wash a handful of leaves and boil in 2 cups of water for 10–15 minutes. Strain and let it cool completely. Use the liquid to rinse minor wounds twice a day, making a fresh batch each day.",
      },
      {
        title: "Leaf poultice",
        instructions:
          "Crush clean, fresh leaves into a paste and place over a minor wound, covering with clean gauze. Change every few hours and stop if the skin looks more irritated.",
      },
    ],
    precautions:
      "Do not eat the seeds or prepare seed remedies — they can be harmful, especially with repeated use. Not for children or pregnant women. Even the leaves should only be eaten in small amounts occasionally. For deep, dirty, or infected wounds, see a doctor instead of relying on home treatment.",
    funFact:
      "Ipil-ipil enriches the soil so well that farmers often plant it between growing seasons just as a natural fertilizer.",
    alternatives: ["Bayabas", "Akapulko"],
  },
  {
    id: "kamantigi",
    name: "Kamantigi",
    scientific_name: "Impatiens balsamina",
    family: "Balsaminaceae (Touch-me-not family)",
    imageUrl: cloudinaryUrl("plants/kamantigi.jpg"),
    images: [cloudinaryUrl("plants/kamantigi.jpg"), cloudinaryUrl("plants/kamantigi-2.jpg"), cloudinaryUrl("plants/kamantigi-3.jpg"), cloudinaryUrl("plants/kamantigi-4.jpg"), cloudinaryUrl("plants/kamantigi-5.jpg")],
    tags: ["Skin Care", "Joint & Pain Relief"],
    about:
      "Kamantigi, also called garden balsam, is a colorful flowering plant that Filipinos like to grow in gardens and pots. Its blooms come in pink, red, purple, or white, and they grow along the stem among the leaves. Beyond its beauty, its fresh leaves are used in simple skin remedies: crushed and applied to soothe irritation, small skin infections, and swollen or achy spots. Many people also know the flowers for another use — crushed petals were traditionally used to give fingernails a temporary reddish color, like a natural nail polish.",
    benefits: [
      "Helps manage minor skin irritations and infections",
      "Helps reduce localized swelling and inflammation",
      "Soothes itchy or irritated skin",
      "Traditionally used to comfort insect bites",
      "Petals are used as a natural, temporary nail and skin color",
      "Easy to grow from seed, and beautiful in the garden",
    ],
    preparations: [
      {
        title: "Leaf poultice",
        instructions:
          "Wash a handful of fresh leaves and crush them into a paste. Apply directly to the affected skin area and cover lightly with clean gauze if needed. Leave on for 20–30 minutes before rinsing off, repeating up to twice a day for 3–5 days.",
      },
      {
        title: "Natural nail color",
        instructions:
          "Crush fresh petals with a little lime juice or a pinch of alum-free salt and place over the nail. Wrap with a small piece of cloth and leave for a few hours or overnight. The color fades gradually.",
      },
    ],
    precautions:
      "For external use only. Test on a small patch of skin first and stop if any redness, rash, or itchiness develops. Do not apply near the eyes or on broken skin. If a skin problem is spreading or not improving after a few days, see a doctor.",
    funFact:
      "The ripe seed pods of kamantigi pop open at the slightest touch, flinging seeds in all directions — which is why the plant is also called \"touch-me-not.\"",
    alternatives: ["Akapulko", "Madre de Cacao"],
  },
  {
    id: "kamias",
    name: "Kamias",
    scientific_name: "Averrhoa bilimbi",
    family: "Oxalidaceae (Wood-sorrel family)",
    imageUrl: cloudinaryUrl("plants/kamias.jpg"),
    images: [cloudinaryUrl("plants/kamias.jpg"), cloudinaryUrl("plants/kamias-2.jpg"), cloudinaryUrl("plants/kamias-3.jpg"), cloudinaryUrl("plants/kamias-4.jpg"), cloudinaryUrl("plants/kamias-5.jpg")],
    tags: ["Cough", "Skin Care"],
    about:
      "Kamias is a tree with small, green, cucumber-shaped fruits that grow in bunches straight out of the trunk and branches. The fruit is very sour and is a common souring ingredient in Filipino dishes such as sinigang and paksiw, and it is also made into pickles and preserves. Beyond the kitchen, it is used in home remedies for cough and for skin problems like pimples and boils, and in traditional use it is linked to supporting healthy blood pressure. Some families also use the fruit as a natural stain remover for clothes and to clean metal.",
    benefits: [
      "Helps ease cough",
      "Traditionally used to support healthy blood pressure",
      "Used for minor skin problems such as rashes, pimples, and boils",
      "Adds vitamin C and other nutrients to meals",
      "A natural souring agent that adds flavor without artificial ingredients",
      "Can be used to clean stains and tarnished metal around the house",
    ],
    preparations: [
      {
        title: "Fruit decoction",
        instructions:
          "Wash 5–6 fresh fruits and boil in 2 cups of water for 10 minutes. Strain and drink 1/2 cup for cough, up to twice a day for 2–3 days.",
      },
      {
        title: "Fruit poultice for skin",
        instructions:
          "Mash 2–3 ripe fruits into a paste and apply to the affected skin area, leaving on for 15 minutes before rinsing. Do not apply to broken skin.",
      },
      {
        title: "Cooked in sinigang",
        instructions:
          "Add whole or halved fruits to boiling soup with vegetables and meat or fish. The sour taste blends into the broth, making it a tasty way to enjoy kamias regularly.",
      },
    ],
    precautions:
      "People with a history of kidney stones or kidney disease should limit or avoid kamias and talk to a doctor first. Everyone should eat it in moderation because it is very sour and can upset the stomach. Do not use the fruit paste on sensitive or broken skin.",
    funFact:
      "Kamias fruits grow right on the trunk and older branches instead of at the tips, so from a distance the tree can look like it is decorated with small green ornaments.",
    alternatives: ["Calamansi", "Sampaloc"],
  },
  {
    id: "lagundi",
    name: "Lagundi",
    scientific_name: "Vitex negundo",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/lagundi.jpg"),
    images: [cloudinaryUrl("plants/lagundi.jpg"), cloudinaryUrl("plants/lagundi-2.jpg"), cloudinaryUrl("plants/lagundi-3.jpg"), cloudinaryUrl("plants/lagundi-4.jpg"), cloudinaryUrl("plants/lagundi-5.jpg")],
    tags: ["Cough", "Fever"],
    about:
      "Lagundi is one of the most popular and trusted medicinal plants in the Philippines. It is recognized by the Department of Health as a remedy for cough, colds, and asthma-like symptoms, and it is the main ingredient in many cough syrups and tablets sold in Philippine pharmacies. The plant has distinctive leaves that spread out like the fingers of a hand, and it is often grown as a hedge so the leaves are always ready to pick. Many families make a warm leaf drink at the first sign of a cough or cold, and it is also available in ready-made forms for people who want a convenient and consistent option.",
    benefits: [
      "Helps relieve cough and colds",
      "Soothes sore throat",
      "Helps bring down fever",
      "Recognized by the DOH for easing asthma and bronchitis symptoms",
      "Available as ready-made tablets and syrups for easy, measured dosing",
      "Can be grown at home as a hedge for a steady supply of leaves",
    ],
    preparations: [
      {
        title: "Leaf decoction",
        instructions:
          "Wash and chop about 6 tablespoons of fresh leaves and boil in 2 cups of water for 10–15 minutes, until it reduces to about 1 cup. Strain, let it cool a little, and drink 1/4 cup up to 3 times a day for up to a week. Make a fresh batch daily.",
      },
      {
        title: "Commercial preparation",
        instructions:
          "Lagundi syrup or tablets, sold at most Philippine pharmacies, can be used following the instructions on the package. These give a more consistent amount than a homemade drink and are handy when leaves are not available.",
      },
      {
        title: "Steam for stuffy nose",
        instructions:
          "Put a few crushed leaves in a bowl of hot water and breathe in the steam for about 5 minutes, keeping a comfortable distance from the water, to help ease nasal congestion.",
      },
    ],
    precautions:
      "Children, pregnant women, and breastfeeding women should use lower amounts or ask a doctor first. If fever lasts more than 3 days, cough lasts more than a week, or there is trouble breathing, chest pain, or coughing up blood, see a doctor right away. Do not replace prescribed asthma medicine with lagundi.",
    funFact:
      "Lagundi is one of the few Philippine herbal plants that has been made into an approved over-the-counter medicine, not just a folk remedy.",
    alternatives: ["Oregano", "Alagao"],
  },
  {
    id: "madre-de-cacao",
    name: "Madre de Cacao",
    scientific_name: "Gliricidia sepium",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/madre-de-cacao.jpg"),
    images: [cloudinaryUrl("plants/madre-de-cacao.jpg"), cloudinaryUrl("plants/madre-de-cacao-2.jpg"), cloudinaryUrl("plants/madre-de-cacao-3.jpg"), cloudinaryUrl("plants/madre-de-cacao-4.jpg"), cloudinaryUrl("plants/madre-de-cacao-5.jpg")],
    tags: ["Skin Care", "Wound"],
    about:
      "Madre de Cacao, known locally as \"kakawate,\" is a fast-growing tree that is often used as a living fence and as shade for cacao plants, which is how it got its Spanish name meaning \"mother of cacao.\" In spring, it is covered with pink and white flowers. Its leaves have a distinct, slightly bitter smell, and they are used in home remedies for skin problems like fungus, itchy rashes, and scabies, as well as for cleaning minor wounds. Farmers also use it in the fields to keep the soil healthy and sometimes to treat skin problems in farm animals.",
    benefits: [
      "Helps with fungus-type skin problems and itchy rashes",
      "Supports wound cleaning and healing",
      "Used as an external wash for scabies and lice",
      "Has a natural cleansing effect on the skin",
      "Sometimes used by farmers for skin problems in livestock",
      "Grows easily from cuttings, so it is simple to have around",
    ],
    preparations: [
      {
        title: "Leaf decoction wash",
        instructions:
          "Wash a handful of leaves and boil in 2 cups of water for 15 minutes. Let it cool completely, strain, and use the liquid as a wash for the skin or minor wounds twice a day for up to a week. Prepare a fresh batch daily.",
      },
      {
        title: "Leaf poultice",
        instructions:
          "Crush fresh leaves into a paste and apply directly on the affected patch. Leave on for 20–30 minutes before rinsing with clean water.",
      },
    ],
    precautions:
      "For external use only. The seeds, bark, and other parts can be harmful if swallowed, and the plant has traditionally been used to kill rats, so keep it away from children and pets. Stop use if skin becomes red or irritated. For skin problems that spread or last more than 2 weeks, see a doctor.",
    funFact:
      "Farmers often stick cut branches of kakawate straight into the ground, where they take root and grow into a living fence that repairs itself.",
    alternatives: ["Akapulko", "Bayabas"],
  },
  {
    id: "malunggay",
    name: "Malunggay",
    scientific_name: "Moringa oleifera",
    family: "Moringaceae",
    imageUrl: cloudinaryUrl("plants/malungay.jpg"),
    images: [cloudinaryUrl("plants/malungay.jpg"), cloudinaryUrl("plants/malungay-2.jpg"), cloudinaryUrl("plants/malungay-3.jpg"), cloudinaryUrl("plants/malungay-4.jpg"), cloudinaryUrl("plants/malungay-5.jpg")],
    tags: ["Nutrition & Immunity"],
    about:
      "Malunggay, also known as moringa, is often called the \"miracle tree\" because its small leaves are full of nutrition. It is a staple in Filipino soups like tinola and monggo, and health workers regularly recommend it for growing children, breastfeeding mothers, and anyone recovering from sickness or low energy. The tree grows easily in the backyard, even from a simple branch cutting, and its leaves can be picked all year. The long green pods are also cooked in soups and stews, and the leaves can be dried and ground into a powder for use in drinks and food.",
    benefits: [
      "Boosts overall nutrition and helps keep energy up",
      "A rich source of vitamins, minerals, and plant protein",
      "Supports the body's defenses through its nutrients",
      "Traditionally used to support milk supply in breastfeeding mothers",
      "Good for children and people recovering from illness",
      "Leaves can be dried into powder for long-lasting supply",
    ],
    preparations: [
      {
        title: "Added to soups",
        instructions:
          "Strip the leaves from the stems and wash well. Add a generous handful to soups, stews, or sautéed dishes during the last 2–3 minutes of cooking to keep the nutrients.",
      },
      {
        title: "Dried leaf tea",
        instructions:
          "Steep 1 tablespoon of dried leaves in a cup of hot water for 5–10 minutes and drink once daily.",
      },
      {
        title: "Malunggay in everyday meals",
        instructions:
          "Mix chopped fresh leaves into scrambled eggs, fried rice, or pancake batter to add extra nutrition to everyday food, especially for picky eaters.",
      },
    ],
    precautions:
      "The roots and root bark should not be used, as they can be harmful — only the leaves, and to some extent the pods, are used. Pregnant women should avoid large or concentrated amounts. People on regular medicine, such as for blood pressure or diabetes, should ask a doctor before taking large amounts or supplements.",
    funFact:
      "Gram for gram, malunggay leaves are often said to contain more vitamin C than an orange and more calcium than milk, which is why nutrition programs across the Philippines promote it.",
    alternatives: ["Saluyot", "Sweet Potato"],
  },
  {
    id: "manga",
    name: "Manga (Mango)",
    scientific_name: "Mangifera indica",
    family: "Anacardiaceae (Cashew family)",
    imageUrl: cloudinaryUrl("plants/manga.jpg"),
    images: [cloudinaryUrl("plants/manga.jpg"), cloudinaryUrl("plants/manga-2.jpg"), cloudinaryUrl("plants/manga-3.jpg"), cloudinaryUrl("plants/manga-4.jpg"), cloudinaryUrl("plants/manga-5.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    about:
      "Manga, or mango, is the national fruit of the Philippines and is loved for its sweet, juicy golden flesh. Besides being a favorite fruit, it has a role in home remedies. The young leaves are boiled into a tea for digestive comfort, and the ripe fruit is full of vitamins that help the body stay healthy, especially in the hot months. Green mango is enjoyed as a sour snack with salt or bagoong, while ripe mango is eaten fresh, in shakes, dried, or in desserts like mango float.",
    benefits: [
      "Supports healthy digestion",
      "The ripe fruit is rich in vitamin A and C, which help the eyes, skin, and immune system",
      "Provides natural energy, fiber, and potassium",
      "Young leaf tea is a traditional home remedy for minor stomach complaints",
      "A refreshing, hydrating fruit for hot weather",
      "Young leaves are also used in folk remedies for mild respiratory discomfort",
    ],
    preparations: [
      {
        title: "Young leaf decoction",
        instructions:
          "Wash a handful of tender young leaves and boil in 2 cups of water for 10–15 minutes. Strain and drink 1/2 cup after meals for digestive support, for a few days as needed.",
      },
      {
        title: "Fresh fruit",
        instructions:
          "Choose ripe mangoes that give slightly when pressed and smell sweet near the stem. Peel and eat fresh, or blend into a simple juice or shake without added sugar.",
      },
      {
        title: "Green mango snack",
        instructions:
          "Peel green mango, slice, and enjoy with a pinch of salt or a little bagoong. Eat in moderation to avoid an upset stomach.",
      },
    ],
    precautions:
      "The sap from the stem and the skin of unripe fruit can irritate the skin in sensitive people, similar to cashew, so handle unripe fruit and stems with care. People with diabetes should watch their portions of ripe mango because of its natural sugar. Too much green mango may upset the stomach.",
    funFact:
      "The Philippine Carabao mango is famous worldwide for its sweetness and has often been called one of the sweetest mangoes in the world.",
    alternatives: ["Bignay", "Atis"],
  },
  {
    id: "Mangosteen",
    name: "Mangosteen",
    scientific_name: "Garcinia mangostana",
    family: "Clusiaceae (Mangosteen family)",
    imageUrl: cloudinaryUrl("plants/mangosteen.jpg"),
    images: [cloudinaryUrl("plants/mangosteen.jpg"), cloudinaryUrl("plants/mangosteen-2.jpg"), cloudinaryUrl("plants/mangosteen-3.jpg"), cloudinaryUrl("plants/mangosteen-4.jpg"), cloudinaryUrl("plants/mangosteen-5.jpg")],
    tags: ["Digestive Health", "Joint & Pain Relief", "Nutrition & Immunity"],
    about:
      "Mangosteen is a slow-growing tropical tree, and its fruit is often called the \"queen of fruits.\" Inside the thick, deep-purple rind is sweet-sour, juicy white flesh that is divided into soft segments. While people mostly enjoy the flesh, the rind is what is traditionally used for home remedies — it is dried and boiled into a deep red tea for upset stomach and loose bowel movement, and it is also used in some traditional skin care. It is a treat for the season and a favorite in southern Philippines, where the trees grow best.",
    benefits: [
      "Supports digestive health and helps with mild diarrhea",
      "The rind is traditionally valued for its strong natural goodness",
      "Helps ease mild body inflammation",
      "The fresh fruit is refreshing, hydrating, and supports general nutrition",
      "Rind is used in some traditional skin-care preparations",
      "A delicious seasonal fruit that is easy to enjoy",
    ],
    preparations: [
      {
        title: "Rind decoction",
        instructions:
          "Wash and dry the rinds of 2–3 fruits. Boil in 2 cups of water for 15–20 minutes until the liquid turns deep red-purple. Strain and drink 1/2 cup once or twice a day for up to 2 days if experiencing mild diarrhea.",
      },
      {
        title: "Fresh fruit",
        instructions:
          "Press the middle of the fruit until the rind cracks, open it, and take out the white segments. Eat fresh, avoiding the bitter purple juice from the rind if it touches the flesh.",
      },
    ],
    precautions:
      "The rind decoction is very astringent and should be used in moderation. If diarrhea lasts more than 2 days, or comes with fever, blood, or signs of dehydration, seek medical help — especially for children. Pregnant women and those on blood thinners should ask a doctor before using the rind. The purple juice from the rind stains clothes and hands.",
    funFact:
      "Mangosteen trees can take 7–10 years before they bear their first fruit, one of the longest waits of any common tropical fruit tree, which is part of why the fruit is considered special.",
    alternatives: ["Tsaang Gubat", "Turmeric"],
  },
  {
    id: "oregano",
    name: "Oregano",
    scientific_name: "Plectranthus amboinicus",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/oregano.jpg"),
    images: [cloudinaryUrl("plants/oregano.jpg"), cloudinaryUrl("plants/oregano-2.jpg"), cloudinaryUrl("plants/oregano-3.jpg"), cloudinaryUrl("plants/oregano-4.jpg"), cloudinaryUrl("plants/oregano-5.jpg")],
    tags: ["Cough"],
    about:
      "The oregano used in Philippine home remedies, also known as \"suganda,\" is a thick, fuzzy-leafed plant with a strong, sharp, slightly minty smell when crushed. It is different from the oregano used on pizza, even though they share a name. It is one of the most trusted household remedies for cough and sore throat, and many families grow it in a small pot near the kitchen so a fresh leaf is always at hand. The leaves are often boiled into a warm tea, sometimes with honey, or their juice is squeezed out and taken by the spoonful for a cough.",
    benefits: [
      "Helps relieve cough",
      "Soothes sore throat",
      "Supports overall breathing comfort during colds",
      "Provides a strong, fresh aroma that helps clear a stuffy nose",
      "Fresh leaves can be chewed for quick, on-the-spot relief",
      "Easy to grow in a small pot, even in small spaces",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Wash 5–6 fresh leaves and boil in 1 cup of water for 5–10 minutes. Strain, add honey if desired, and drink warm up to 3 times a day for 2–3 days.",
      },
      {
        title: "Fresh leaf juice",
        instructions:
          "Wash a few leaves, crush them well, and squeeze the juice through a clean cloth. Mix a teaspoon of the juice with a teaspoon of honey and take it for cough, up to 3 times a day. Adults only, unless a doctor advises otherwise.",
      },
      {
        title: "Fresh chew",
        instructions:
          "Chew a single fresh leaf for quick, mild relief. The taste is strong and slightly bitter, so start with a small piece if you are new to it.",
      },
    ],
    precautions:
      "The leaf preparations are strong, so avoid giving large amounts to very young children and use mild teas for them instead, after checking with a doctor. Do not give honey to babies under 1 year old. If a cough lasts more than a week or comes with fever or trouble breathing, see a doctor.",
    funFact:
      "Despite its name, this Filipino oregano is a different plant from the Mediterranean oregano — it is actually more closely related to mint, which explains its cooling aroma.",
    alternatives: ["Lagundi", "Alagao"],
  },
  {
    id: "pandan",
    name: "Pandan",
    scientific_name: "Pandanus amaryllifolius",
    family: "Pandanaceae (Screwpine family)",
    imageUrl: cloudinaryUrl("plants/pandan.jpg"),
    images: [cloudinaryUrl("plants/pandan.jpg"), cloudinaryUrl("plants/pandan-2.jpg"), cloudinaryUrl("plants/pandan-3.jpg"), cloudinaryUrl("plants/pandan-4.jpg"), cloudinaryUrl("plants/pandan-5.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    about:
      "Pandan is a fragrant plant with long, green, blade-like leaves, loved across the Philippines and Southeast Asia for its sweet, grassy, almost vanilla-like smell. It is used to flavor rice, sweet treats like buko pandan, and cool drinks. Pandan tea is also a comforting home drink for relaxing and easing mild stomach discomfort after meals. Some families place fresh leaves in the kitchen, refrigerator, or car simply to enjoy the pleasant scent. It grows in clumps in the garden and is easy to keep going year-round.",
    benefits: [
      "Promotes relaxation and helps ease mild stress",
      "Supports comfortable digestion after meals",
      "Adds natural aroma and flavor to food and drink without added sugar",
      "Traditionally used as a mild diuretic",
      "Leaves can be used in a foot soak to refresh tired feet",
      "Keeps rice, drinks, and desserts fragrant and delicious",
    ],
    preparations: [
      {
        title: "Knotted leaf tea",
        instructions:
          "Wash 2–3 fresh pandan leaves, tie them in a knot, and boil in 2 cups of water for 10 minutes. Strain and drink warm as a calming tea after meals.",
      },
      {
        title: "Chilled infused drink",
        instructions:
          "Let the tea cool and refrigerate in a clean container for up to 2 days. Serve over ice, with a little honey if desired.",
      },
      {
        title: "Cooking with pandan",
        instructions:
          "Add a tied pandan leaf to rice while it cooks for a lovely fragrance, or simmer it in coconut milk-based desserts for a natural flavor.",
      },
    ],
    precautions:
      "Very safe as a food and drink flavoring in normal amounts. Wash fresh leaves well before use. If you are pregnant, taking regular medicine, or have a health condition, ask a doctor before drinking pandan tea daily in large amounts.",
    funFact:
      "The aroma of pandan is very similar to the smell of freshly cooked jasmine rice, which is why the combination smells so appealing.",
    alternatives: ["Basil", "Yerba Buena"],
  },
  {
    id: "pansit-pansitan",
    name: "Pansit-Pansitan",
    scientific_name: "Peperomia pellucida",
    family: "Piperaceae (Pepper family)",
    imageUrl: cloudinaryUrl("plants/pansit-pansitan.jpg"),
    images: [cloudinaryUrl("plants/pansit-pansitan.jpg"), cloudinaryUrl("plants/pansit-pansitan-2.jpg"), cloudinaryUrl("plants/pansit-pansitan-3.jpg"), cloudinaryUrl("plants/pansit-pansitan-4.jpg"), cloudinaryUrl("plants/pansit-pansitan-5.jpg")],
    tags: ["Joint & Pain Relief"],
    about:
      "Pansit-pansitan is a small, soft-stemmed herb with heart-shaped, shiny leaves that grows in damp, shaded places around houses, gardens, and cracks in walls. Many people treat it as a weed, but it is well known in the Philippines as a home remedy for gout and joint pain, and it is one of the herbal plants recognized for this use by the Department of Health. It is also eaten as a fresh, slightly peppery, crunchy salad green. A regular cup of pansit-pansitan tea is popular among people who suffer from joint pain and stiffness.",
    benefits: [
      "Traditionally used to help lower high uric acid in the body",
      "Supports joint comfort and easier movement",
      "Helps ease gout and arthritis-related pain",
      "Can be eaten as a crisp, mildly peppery salad green",
      "Traditionally used as a poultice on insect stings",
      "Grows easily in shaded spots, needing almost no care",
    ],
    preparations: [
      {
        title: "Whole-plant decoction",
        instructions:
          "Wash a handful of the whole plant (leaves and stems) very well, since it grows close to the ground. Boil in 2 cups of water for 15 minutes. Strain and drink 1/2 cup twice a day for joint support, continuing for several weeks for long-term use.",
      },
      {
        title: "Fresh salad green",
        instructions:
          "Wash fresh leaves and tender stems thoroughly and eat raw in a salad with tomatoes, onions, and a light dressing, or add to soups near the end of cooking.",
      },
      {
        title: "Leaf poultice",
        instructions:
          "Crush fresh leaves and place on an insect sting or a sore spot for 15–20 minutes to soothe discomfort.",
      },
    ],
    precautions:
      "It is not a replacement for prescribed medicine for gout or arthritis, especially during a severe flare. See a doctor for sudden, intense joint pain, swelling, redness, or fever. Wash plants gathered outdoors very well and avoid plants from roadsides or areas that may be sprayed with chemicals. Ask a doctor first if you have kidney problems.",
    funFact:
      "Pansit-pansitan gets its name from the way it looks like noodles when dried, and it is a close relative of black pepper.",
    alternatives: ["Turmeric", "Takip-Kohol"],
  },
  {
    id: "peanut",
    name: "Peanut",
    scientific_name: "Arachis hypogaea",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/peanut.jpg"),
    images: [cloudinaryUrl("plants/peanut.jpg"), cloudinaryUrl("plants/peanut-2.jpg"), cloudinaryUrl("plants/peanut-3.jpg"), cloudinaryUrl("plants/peanut-4.jpg"), cloudinaryUrl("plants/peanut-5.jpg")],
    tags: ["Nutrition & Immunity"],
    about:
      "Peanut is a popular crop that grows its pods underground, and is valued in the Philippines as an affordable, filling source of protein and healthy fats. It is not made into medicine like a leaf tea, but it is an important food for keeping strong and energetic, especially during recovery from illness. Filipinos enjoy peanuts boiled, roasted, fried with garlic, or turned into peanut butter, kare-kare sauce, and brittle. A small handful makes a satisfying snack that keeps hunger away for hours.",
    benefits: [
      "Provides plant protein and healthy fats that keep you full longer",
      "Supports steady, long-lasting energy",
      "Good source of fiber, magnesium, and B vitamins",
      "Helps build strength when part of a balanced diet",
      "An affordable and widely available protein source",
      "Easy to enjoy in many forms, from snacks to sauces",
    ],
    preparations: [
      {
        title: "Boiled peanuts",
        instructions:
          "Wash unshelled peanuts and boil in salted water for 30–45 minutes until tender. Drain and eat warm as a traditional snack.",
      },
      {
        title: "Dry-roasted peanuts",
        instructions:
          "Dry-roast shelled peanuts in a pan over medium heat, stirring often, until golden and fragrant. Let them cool before eating or grinding into peanut sauce or butter.",
      },
      {
        title: "Homemade peanut butter",
        instructions:
          "Grind roasted, cooled peanuts in a blender or food processor until smooth, adding a pinch of salt and a teaspoon of oil if needed. Store in a clean jar in the refrigerator.",
      },
    ],
    precautions:
      "Peanuts are one of the most common causes of serious food allergy. Avoid completely if you or anyone in your household has a peanut allergy, and seek emergency help if swelling, trouble breathing, or hives appear after eating. Keep whole peanuts away from very young children because of the choking risk. Store peanuts in a dry place, as moldy peanuts can be harmful.",
    funFact:
      "Peanut flowers bloom above ground, but afterward the plant pushes its young pods into the soil, where they grow and ripen underground.",
    alternatives: ["Malunggay", "Sweet Potato"],
  },
  {
    id: "pomelo",
    name: "Pomelo",
    scientific_name: "Citrus maxima",
    family: "Rutaceae (Citrus family)",
    imageUrl: cloudinaryUrl("plants/pomelo.jpg"),
    images: [cloudinaryUrl("plants/pomelo.jpg"), cloudinaryUrl("plants/pomelo-2.jpg"), cloudinaryUrl("plants/pomelo-3.jpg"), cloudinaryUrl("plants/pomelo-4.jpg"), cloudinaryUrl("plants/pomelo-5.jpg")],
    tags: ["Nutrition & Immunity", "Digestive Health"],
    about:
      "Pomelo, locally called suha, is the largest citrus fruit in the world. It has a very thick rind, a thick white layer under the skin, and large, juicy segments with a mild, sweet-sour taste. It is a favorite fruit in the Philippines, especially in provinces known for their sweet varieties, and it is often shared at family gatherings, during holidays, and as a fresh dessert after a heavy meal. It is a good source of vitamin C and is popularly eaten during cold and flu season to keep the body strong.",
    benefits: [
      "Boosts vitamin C intake",
      "Helps support the body's defenses against colds",
      "Helps digestion, especially after rich or fatty meals",
      "Low in calories but filling because of its water and fiber",
      "Refreshing, hydrating fruit for hot days",
      "The thick rind is sometimes candied and used in folk remedies for cough",
    ],
    preparations: [
      {
        title: "Fresh segments",
        instructions:
          "Cut through the thick rind, peel it off, and separate the segments. Remove the thin bitter skin around each segment if you prefer a sweeter taste, and eat fresh as a snack or dessert.",
      },
      {
        title: "Diluted juice",
        instructions:
          "Squeeze the segments to extract the juice and dilute slightly with water for a refreshing vitamin C drink. Drink the same day it is prepared.",
      },
      {
        title: "Candied rind",
        instructions:
          "Slice the rind into strips, boil several times to remove bitterness, then simmer with sugar until translucent. Dry and store in a clean jar as a sweet treat.",
      },
    ],
    precautions:
      "Like grapefruit, pomelo can affect how certain medicines work, including some medicines for cholesterol and blood pressure. If you take medicine regularly, check with a doctor or pharmacist before eating pomelo often. People with acid reflux may find it bothersome in large amounts.",
    funFact:
      "Pomelo is one of the original citrus fruits, and modern grapefruit came from a cross between pomelo and orange, making pomelo the older parent of the two.",
    alternatives: ["Calamansi", "Dayap"],
  },
  {
    id: "saluyot",
    name: "Saluyot",
    scientific_name: "Corchorus olitorius",
    family: "Malvaceae (Mallow family)",
    imageUrl: cloudinaryUrl("plants/saluyot.jpg"),
    images: [cloudinaryUrl("plants/saluyot.jpg"), cloudinaryUrl("plants/saluyot-2.jpg"), cloudinaryUrl("plants/saluyot-3.jpg"), cloudinaryUrl("plants/saluyot-4.jpg"), cloudinaryUrl("plants/saluyot-5.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    about:
      "Saluyot is a leafy green vegetable that is especially popular in Ilocano cooking. When cooked, it becomes slightly slippery and sticky, like okra, which many people love in soups and stews. It is full of vitamins, minerals, and fiber, and is a gentle food remedy for constipation. It is often cooked simply with garlic, onion, and a bit of dried fish or bagoong, and served with rice. Many families grow it at home because it sprouts quickly and gives a steady supply of fresh greens at little cost.",
    benefits: [
      "Supports digestion and regular bowel movement",
      "Rich in vitamins A and C, calcium, iron, and fiber",
      "Helps relieve mild constipation",
      "Adds a lot of nutrition to daily meals for very little cost",
      "Low in calories, making it a healthy vegetable choice",
      "Its slippery texture makes soups thick and hearty",
    ],
    preparations: [
      {
        title: "Sautéed or soup addition",
        instructions:
          "Wash fresh leaves thoroughly and remove tough stems. Add to soups or sautéed dishes in the last few minutes of cooking, since simmering too long makes it very slimy. Combine with garlic, onion, tomato, and a little dried fish or shrimp for a classic simple dish.",
      },
      {
        title: "Saluyot soup (utan)",
        instructions:
          "Boil water with ginger, onion, and a piece of fish or dried fish. Add saluyot leaves near the end and simmer for 3–5 minutes. Serve hot with rice.",
      },
    ],
    precautions:
      "Very safe as a common vegetable. Wash leaves well before cooking. People who dislike or are sensitive to slippery textures may prefer to cook it briefly. If you take blood thinners or have kidney stones, eat it in moderate amounts and ask a doctor if unsure.",
    funFact:
      "Saluyot belongs to the same plant family as the plant used to make jute rope and sacks, though the type eaten as a vegetable is grown for its tender leaves.",
    alternatives: ["Malunggay", "Sweet Potato"],
  },
  {
    id: "sambong",
    name: "Sambong",
    scientific_name: "Blumea balsamifera",
    family: "Asteraceae (Daisy family)",
    imageUrl: cloudinaryUrl("plants/sambong.jpg"),
    images: [cloudinaryUrl("plants/sambong.jpg"), cloudinaryUrl("plants/sambong-2.jpg"), cloudinaryUrl("plants/sambong-3.jpg"), cloudinaryUrl("plants/sambong-4.jpg"), cloudinaryUrl("plants/sambong-5.jpg")],
    tags: ["Kidney & Urinary"],
    about:
      "Sambong is a leafy shrub with large, soft, fuzzy leaves that give off a strong, refreshing smell when crushed, similar to camphor. It is one of the herbal plants recommended by the Department of Health and is sold in pharmacies as tablets and capsules. It is well known for helping the body pass water more easily and is traditionally used for kidney and urinary comfort, including small kidney stones and swelling from water retention. It is usually taken along with plenty of water to help the body flush out the urinary system.",
    benefits: [
      "Supports kidney health",
      "Promotes urinary comfort and wellness",
      "Helps the body pass more urine, flushing the urinary system",
      "Traditionally used to help ease mild swelling caused by water retention",
      "Available as ready-made capsules for measured dosing",
      "Its strong scent also makes crushed leaves a simple natural insect repellent",
    ],
    preparations: [
      {
        title: "Leaf decoction",
        instructions:
          "Wash a handful of fresh leaves and boil in 2 cups of water for 15 minutes. Strain and drink 1/2 cup 3 times a day for up to a week, together with at least 8 glasses of plain water daily.",
      },
      {
        title: "Commercial capsules",
        instructions:
          "Sambong capsules, sold at most Philippine pharmacies, can be taken following the instructions on the package. This is a convenient option when fresh leaves are not available.",
      },
      {
        title: "Leaf steam bath",
        instructions:
          "Boil a large handful of leaves in a pot of water and breathe in the steam, or add the cooled liquid to bath water, to enjoy the refreshing scent and ease a stuffy nose.",
      },
    ],
    precautions:
      "See a doctor for severe kidney or urinary symptoms such as strong pain, blood in the urine, fever, or difficulty passing urine, instead of relying on home remedies. People with existing kidney disease, heart problems, or those on water pills should ask a doctor before using it regularly. Pregnant women should check with a doctor first.",
    funFact:
      "The strong camphor-like scent of sambong is so noticeable that farmers and families have long used crushed leaves to keep insects away.",
    alternatives: ["Banaba", "Sampasampalukan"],
  },
  {
    id: "sampaloc",
    name: "Sampaloc",
    scientific_name: "Tamarindus indica",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/sampaloc.jpg"),
    images: [cloudinaryUrl("plants/sampaloc.jpg"), cloudinaryUrl("plants/sampaloc-2.jpg"), cloudinaryUrl("plants/sampaloc-3.jpg"), cloudinaryUrl("plants/sampaloc-4.jpg"), cloudinaryUrl("plants/sampaloc-5.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    about:
      "Sampaloc, or tamarind, is a large, shady tree that lives for a very long time. Its brown pods hold sticky, tangy pulp that is the star of sinigang, the favorite Filipino sour soup. The pulp is also made into candies, jams, and drinks, and is used at home to gently support digestion and relieve constipation. The young leaves and flowers are also cooked into dishes, and the leaves are used in some home remedies for mild fever. Old sampaloc trees are often treated as landmarks in towns and villages.",
    benefits: [
      "Supports healthy digestion",
      "Helps relieve mild constipation",
      "A natural tangy source of vitamin C and potassium",
      "Adds natural sourness to meals in place of artificial flavorings",
      "Young leaves are traditionally used in folk remedies for mild fever",
      "Versatile in the kitchen for soups, drinks, sweets, and sauces",
    ],
    preparations: [
      {
        title: "Soaked pulp drink",
        instructions:
          "Soak a small handful of ripe tamarind pulp in a cup of warm water for 10 minutes, mash well, and strain out the seeds and fibers. Drink the liquid, sweetened with a little honey or sugar if you like, once daily to support digestion.",
      },
      {
        title: "Fresh pulp / cooking",
        instructions:
          "Eat ripe pulp as a sweet-sour snack, or boil unripe pods or young leaves in soups such as sinigang to add flavor and its traditional digestive benefit.",
      },
      {
        title: "Young leaf tea",
        instructions:
          "Boil a handful of young leaves in 2 cups of water for 10 minutes, strain, and drink 1/2 cup up to twice a day for 1–2 days for mild fever.",
      },
    ],
    precautions:
      "Too much sampaloc can cause loose stools, so start with small amounts, especially for children. It is acidic and can bother people with acid reflux or sensitive teeth. Seek medical help if a fever lasts more than 2–3 days. People taking regular medicine should ask a doctor before using large amounts.",
    funFact:
      "Tamarind trees can live for well over a hundred years and keep bearing fruit for most of that time, which is why many old trees in the provinces are treated as local landmarks.",
    alternatives: ["Bignay", "Mangosteen"],
  },
  {
    id: "sampasampalukan",
    name: "Sampasampalukan",
    scientific_name: "Phyllanthus niruri",
    family: "Phyllanthaceae",
    imageUrl: cloudinaryUrl("plants/sampasampalukan.jpg"),
    images: [cloudinaryUrl("plants/sampasampalukan.jpg"), cloudinaryUrl("plants/sampasampalukan-2.jpg"), cloudinaryUrl("plants/sampasampalukan-3.jpg"), cloudinaryUrl("plants/sampasampalukan-4.jpg"), cloudinaryUrl("plants/sampasampalukan-5.jpg")],
    tags: ["Kidney & Urinary"],
    about:
      "Sampasampalukan is a small, weedy plant with thin stems and tiny, paired leaves that look like miniature tamarind leaves, which is where its name comes from. It is found growing in gardens, sidewalks, and open fields. It is internationally known as \"stonebreaker\" because of its long-standing use to support the kidneys and urinary system, especially for people concerned about small kidney stones. It is usually prepared as a whole-plant tea and taken along with plenty of water. It is also used in folk practice to support the liver.",
    benefits: [
      "Supports the urinary system",
      "Traditionally used to help with kidney stone discomfort",
      "Helps the body pass more urine",
      "Used in folk practice to support the liver",
      "Traditionally used for mild urinary irritation",
      "Easy to find and quick to prepare as a whole-plant tea",
    ],
    preparations: [
      {
        title: "Whole-plant decoction",
        instructions:
          "Wash a handful of the entire fresh plant thoroughly, since it grows close to the ground. Boil in 3 cups of water for 15–20 minutes. Strain and drink 1 cup, 2–3 times a day for up to a week, together with lots of plain water.",
      },
      {
        title: "Dried plant tea",
        instructions:
          "Dry the whole plant in a shaded, airy place until crisp. Steep 1 tablespoon in a cup of hot water for 10 minutes, strain, and drink once or twice a day.",
      },
    ],
    precautions:
      "People with kidney disease, and pregnant or breastfeeding women, should ask a doctor before using it, since its effect on urine flow may not suit everyone. Anyone with severe pain in the side or back, blood in urine, fever, or difficulty passing urine needs medical care right away. Do not use it for more than a week without a doctor's advice.",
    funFact:
      "Its English nickname \"stonebreaker\" and its Spanish name \"chanca piedra\" both come from an old belief in many countries, not just the Philippines, that the plant helps break down small kidney stones.",
    alternatives: ["Sambong", "Banaba"],
  },
  {
    id: "siling-labuyo",
    name: "Siling Labuyo",
    scientific_name: "Capsicum frutescens",
    family: "Solanaceae (Nightshade family)",
    imageUrl: cloudinaryUrl("plants/siling-labuyo.jpg"),
    images: [cloudinaryUrl("plants/siling-labuyo.jpg"), cloudinaryUrl("plants/siling-labuyo-2.jpg"), cloudinaryUrl("plants/siling-labuyo-3.jpg"), cloudinaryUrl("plants/siling-labuyo-4.jpg"), cloudinaryUrl("plants/siling-labuyo-5.jpg")],
    tags: ["Joint & Pain Relief", "Nutrition & Immunity"],
    about:
      "Siling labuyo is a small but very hot chili native to the Philippines, and a key ingredient in dishes like bicol express and dipping sauces. The small, pointy fruits turn from green to bright red as they ripen. Its heat is what gives it a warming effect, and it is also why people use it, carefully diluted in oil, as a rub for sore muscles and joints. In the kitchen, a little goes a long way, adding flavor and a healthy kick to meals. It is easy to grow in a pot at home and produces fruit for a long time.",
    benefits: [
      "Adds vitamin C and other nutrients to meals",
      "Traditionally used in oil rubs for muscle and joint aches",
      "Its heat creates a warming feeling that can help clear a stuffy nose",
      "May help you feel warm and lively, and some people find it supports appetite",
      "A small amount in meals adds big flavor without extra salt",
      "Easy to grow at home in a pot or garden",
    ],
    preparations: [
      {
        title: "Culinary use",
        instructions:
          "Add fresh or dried chilies sparingly to dishes to taste, whether whole, sliced, or in a vinegar-based dipping sauce. Start small and add more slowly.",
      },
      {
        title: "Traditional oil rub",
        instructions:
          "Put a small handful of chopped chilies in warm coconut oil, seal in a jar, and let it sit for several days. Strain well. Apply a very small amount to sore muscles with gentle massage, and wash your hands well right away with soap.",
      },
      {
        title: "Spiced vinegar",
        instructions:
          "Place a few whole chilies in a clean bottle of vinegar and let it sit for a week. Use a few drops in soups, noodles, and dipping sauces.",
      },
    ],
    precautions:
      "Never touch your eyes, nose, mouth, or private areas after handling chili. Do not apply concentrated preparations to broken skin or sensitive areas. Stop topical use if it causes strong burning. Those with stomach ulcers, acid reflux, or hemorrhoids may find it uncomfortable. Keep away from children and pets, who may touch their faces after handling.",
    funFact:
      "Siling labuyo is much hotter than a jalapeño even though it is so small, which is why a single piece can spice up a whole pot.",
    alternatives: ["Turmeric", "Yerba Buena"],
  },
  {
    id: "sweet-potato",
    name: "Sweet Potato",
    scientific_name: "Ipomoea batatas",
    family: "Convolvulaceae (Morning glory family)",
    imageUrl: cloudinaryUrl("plants/sweet-potato.jpg"),
    images: [cloudinaryUrl("plants/sweet-potato.jpg"), cloudinaryUrl("plants/sweet-potato-2.jpg"), cloudinaryUrl("plants/sweet-potato-3.jpg"), cloudinaryUrl("plants/sweet-potato-4.jpg"), cloudinaryUrl("plants/sweet-potato-5.jpg")],
    tags: ["Nutrition & Immunity", "Digestive Health"],
    about:
      "Sweet potato, known as kamote, is a nutritious root crop grown all over the Philippines. The roots may be orange, yellow, white, or purple, and are naturally sweet. The young leaves, called talbos ng kamote, are also eaten as a tender green vegetable. Kamote is filling and gentle on the stomach, making it a common food for growing kids and for people needing steady energy, and it is often a lifesaver during lean seasons. It is enjoyed boiled, steamed, roasted, fried as camote-cue, or baked into sweet treats.",
    benefits: [
      "Rich in vitamins, especially vitamin A, and dietary fiber",
      "Supports healthy digestion and regular bowel movement",
      "A filling and naturally sweet source of steady energy",
      "Good for growing children and active people",
      "The young leaves add extra iron and other nutrients to meals",
      "Affordable and easy to grow at home",
    ],
    preparations: [
      {
        title: "Boiled or steamed root",
        instructions:
          "Wash whole, unpeeled roots and boil or steam for 20–25 minutes until fork-tender. Peel and eat warm, or roast in the oven or over coals for a sweeter, caramelized taste.",
      },
      {
        title: "Sautéed leaves",
        instructions:
          "Wash young leaves and tender stems and sauté with garlic and onion, or add to soups like tinola, as you would with saluyot or malunggay.",
      },
      {
        title: "Camote snack",
        instructions:
          "Slice into strips or wedges and bake or air-fry with a light brushing of oil for a healthier alternative to chips.",
      },
    ],
    precautions:
      "Very safe as a staple food. People taking blood thinners should keep their intake of the leaves steady rather than suddenly eating large amounts. People with diabetes should watch portions of the root. Eat in moderation, as too much may cause gas or a bloated stomach.",
    funFact:
      "Despite the name, sweet potato is not related to regular potato — it belongs to the morning glory family, while the regular potato is related to tomatoes and eggplant.",
    alternatives: ["Malunggay", "Saluyot"],
  },
  {
    id: "takip-kohol",
    name: "Takip-Kohol",
    scientific_name: "Centella asiatica",
    family: "Apiaceae (Carrot family)",
    imageUrl: cloudinaryUrl("plants/takip-kohol.jpg"),
    images: [cloudinaryUrl("plants/takip-kohol.jpg"), cloudinaryUrl("plants/takip-kohol-2.jpg"), cloudinaryUrl("plants/takip-kohol-3.jpg"), cloudinaryUrl("plants/takip-kohol-4.jpg"), cloudinaryUrl("plants/takip-kohol-5.jpg")],
    tags: ["Wound", "Joint & Pain Relief"],
    about:
      "Takip-kohol, also called gotu kola, is a low, creeping herb with small, round, coin-shaped leaves that grows in wet, shady places like rice paddy edges and garden corners. It is well known in traditional medicine across Asia for helping the skin heal and for supporting the mind and circulation. In many communities, the leaves are eaten as a fresh salad green or made into tea, and crushed leaves are placed on small wounds. It is also becoming popular in skin care products, so fresh leaves are a natural, homegrown version of a well-loved ingredient.",
    benefits: [
      "Helps small wounds and skin heal",
      "Traditionally associated with better memory and focus",
      "Supports healthy blood circulation",
      "Helps skin look healthier and more resilient",
      "May help ease aches in joints and muscles when used regularly",
      "Can be eaten as a fresh, mild-tasting green",
    ],
    preparations: [
      {
        title: "Fresh salad or tea",
        instructions:
          "Wash a small handful of fresh leaves very well and eat raw as part of a salad, or steep a handful in a cup of hot water for 10 minutes to make a tea. Drink once daily.",
      },
      {
        title: "Wound poultice",
        instructions:
          "Wash the leaves and crush them into a paste. Apply to a clean, minor wound or scrape and cover lightly with gauze. Change once or twice a day.",
      },
      {
        title: "Fresh leaf juice",
        instructions:
          "Blend a handful of clean leaves with a little water and strain. Drink a small glass, mixed with a bit of honey to improve the taste.",
      },
    ],
    precautions:
      "Do not use on deep, dirty, or infected wounds without a doctor's evaluation. People with liver problems should ask a doctor before using it internally, since very high amounts over a long time have been linked to liver strain. Avoid during pregnancy and breastfeeding unless a doctor approves. Wash leaves very well, as it grows in wet places.",
    funFact:
      "Gotu kola is nicknamed the \"herb of longevity\" in several Asian traditions because of old stories that people who ate it regularly lived long, active lives.",
    alternatives: ["Aloe Vera", "Bayabas"],
  },
  {
    id: "tawa-tawa",
    name: "Tawa-Tawa",
    scientific_name: "Euphorbia hirta",
    family: "Euphorbiaceae (Spurge family)",
    imageUrl: cloudinaryUrl("plants/tawa-tawa.jpg"),
    images: [cloudinaryUrl("plants/tawa-tawa.jpg"), cloudinaryUrl("plants/tawa-tawa-2.jpg"), cloudinaryUrl("plants/tawa-tawa-3.jpg"), cloudinaryUrl("plants/tawa-tawa-4.jpg"), cloudinaryUrl("plants/tawa-tawa-5.jpg")],
    tags: ["Fever", "Cough"],
    about:
      "Tawa-tawa is a small, hairy plant that grows low to the ground in vacant lots, sidewalk cracks, and open fields all over the Philippines. It became widely talked about as a home remedy during dengue outbreaks, when many families boiled it into a tea as a first response. It is important to understand that this is only a supportive folk practice and never a replacement for proper medical care. Anyone with a high or lasting fever, or any signs of dengue, should see a doctor immediately. Tawa-tawa is also used at home for mild fevers and cough.",
    benefits: [
      "Helps bring down mild fever",
      "Supports breathing comfort during colds",
      "Traditionally used as supportive care alongside medical treatment during dengue illness",
      "A widely known household first-response herbal remedy for mild fevers",
      "The whole plant is used fresh, so it is quick to prepare",
      "Easy to find, since it grows nearly everywhere",
    ],
    preparations: [
      {
        title: "Whole-plant decoction",
        instructions:
          "Wash a handful of the whole fresh plant thoroughly, including the roots, and boil in 2 cups of water for 10–15 minutes. Strain and let it cool before drinking 1/2 cup up to 3 times a day for 2–3 days, watching symptoms closely. Drink plenty of clean water along with it.",
      },
    ],
    precautions:
      "This is a supportive home remedy only and is not a proven treatment or cure for dengue. Anyone with a high or lasting fever, especially with warning signs like severe belly pain, bleeding gums or nose, black stools, persistent vomiting, or extreme weakness, should go to a hospital immediately. Do not delay seeing a doctor to try a herbal tea. The plant's milky sap can irritate skin and eyes, so wash your hands after handling. Pregnant women and young children should not use it without a doctor's advice.",
    funFact:
      "Tawa-tawa becomes so popular during rainy-season outbreaks that it is sometimes reported to run out at herbal markets.",
    alternatives: ["Lagundi", "Gumamela"],
  },
  {
    id: "tsaang-gubat",
    name: "Tsaang Gubat",
    scientific_name: "Ehretia microphylla",
    family: "Boraginaceae (Borage family)",
    imageUrl: cloudinaryUrl("plants/tsaang-gubat.jpg"),
    images: [cloudinaryUrl("plants/tsaang-gubat.jpg"), cloudinaryUrl("plants/tsaang-gubat-2.jpg"), cloudinaryUrl("plants/tsaang-gubat-3.jpg"), cloudinaryUrl("plants/tsaang-gubat-4.jpg"), cloudinaryUrl("plants/tsaang-gubat-5.jpg")],
    tags: ["Indigestion", "Digestive Health"],
    about:
      "Tsaang gubat, which means \"forest tea,\" is a small shrub with tiny, shiny, dark green leaves and small white flowers. It is one of the herbal plants recommended by the Department of Health, and has been brewed as a household tea for generations for stomach complaints. It is a go-to for stomach ache, indigestion, and loose bowel movement. It is also sold as a ready-to-use herbal tea bag in Philippine drugstores and supermarkets, so it is easy to enjoy even without a plant at home. The tea has a mild and pleasant taste.",
    benefits: [
      "Helps relieve stomach ache and cramps",
      "Supports overall digestive health",
      "Traditionally used to help manage loose bowel movement",
      "Mild, pleasant flavor that is easy to drink regularly",
      "Available as ready-made tea bags for convenience",
      "Can also be grown as a small hedge or potted plant",
    ],
    preparations: [
      {
        title: "Fresh or dried leaf decoction",
        instructions:
          "Wash a handful of fresh or dried leaves and boil in 2 cups of water for 10–15 minutes. Strain and drink warm, 1/2 cup after meals or as needed for stomach discomfort, up to 3 times a day for a few days.",
      },
      {
        title: "Commercial tea bags",
        instructions:
          "Steep one tea bag in a cup of hot water following the package instructions. This is a convenient, pre-measured option when you do not have fresh leaves.",
      },
      {
        title: "Drying the leaves",
        instructions:
          "Pick healthy leaves, wash, and spread them in a shaded, airy place for several days until crisp. Store in a clean, dry, covered jar for use later.",
      },
    ],
    precautions:
      "If diarrhea or stomach pain lasts more than 2 days, gets worse, or comes with fever, blood in the stool, or signs of dehydration, see a doctor instead of continuing home treatment. This is especially important for children, older adults, and pregnant women.",
    funFact:
      "Tsaang gubat is one of the few Philippine herbal plants sold as a packaged tea on grocery shelves right next to regular teas.",
    alternatives: ["Bayabas", "Ampalaya"],
  },
  {
    id: "tuba",
    name: "Tuba",
    scientific_name: "Jatropha curcas",
    family: "Euphorbiaceae (Spurge family)",
    imageUrl: cloudinaryUrl("plants/tuba.jpg"),
    images: [cloudinaryUrl("plants/tuba.jpg"), cloudinaryUrl("plants/tuba-2.jpg"), cloudinaryUrl("plants/tuba-3.jpg"), cloudinaryUrl("plants/tuba-4.jpg"), cloudinaryUrl("plants/tuba-5.jpg")],
    tags: ["Wound", "Skin Care"],
    about:
      "Tuba, also called physic nut, is a tough shrub that is often planted as a living fence because it grows with almost no care. Many parts of the plant are harmful if swallowed, especially the seeds, and it must always be handled with care. In traditional practice, the milky sap from a fresh stem has been used on the skin in a brief, careful way for small cuts. The plant's seeds have also been studied in other countries as a possible source of biofuel, though this has nothing to do with its home use. Because of its risks, tuba is one of the plants in this guide that should be used with the most caution.",
    benefits: [
      "Traditionally applied on the skin for small cuts to help stop light bleeding",
      "Used in some folk preparations for certain skin conditions",
      "Sap is sometimes used briefly to help close small cuts",
      "Grows easily as a natural fence around gardens and farms",
    ],
    preparations: [
      {
        title: "Sap first-aid (brief, external only)",
        instructions:
          "Break a fresh stem or leaf and let a small drop of the milky sap fall on a minor cut. Leave it briefly, then wash it off with clean water. Treat this as a one-time, first-aid-style step, not a regular skin care habit. Wash your hands right after.",
      },
    ],
    precautions:
      "The seeds, sap, and other parts are harmful and must never be swallowed by anyone. Seeds look like nuts and children may mistake them for food, so keep them far out of reach. Do not put it on deep, dirty, or infected wounds. The sap can irritate skin and eyes, so use gloves if you can, and wash your hands well after touching it. If someone swallows any part of the plant, seek medical help immediately.",
    funFact:
      "Tuba's seeds became famous around the world in the 2000s as a possible crop for making fuel, since the plant grows in poor land where food crops cannot.",
    alternatives: ["Madre de Cacao", "Akapulko"],
  },
  {
    id: "turmeric",
    name: "Turmeric",
    scientific_name: "Curcuma longa",
    family: "Zingiberaceae (Ginger family)",
    imageUrl: cloudinaryUrl("plants/turmeric.jpg"),
    images: [cloudinaryUrl("plants/turmeric.jpg"), cloudinaryUrl("plants/turmeric-2.jpg"), cloudinaryUrl("plants/turmeric-3.jpg"), cloudinaryUrl("plants/turmeric-4.jpg"), cloudinaryUrl("plants/turmeric-5.jpg")],
    tags: ["Joint & Pain Relief", "Nutrition & Immunity"],
    about:
      "Turmeric, known locally as luyang dilaw, is a golden-yellow root related to ginger. It is used in Philippine cooking to color and flavor rice, curries, and stews, and it is one of the best-known natural remedies for aches and swelling. Fresh turmeric has a warm, earthy, slightly bitter taste, and it stains anything it touches bright yellow. A warm cup of turmeric tea is a popular home drink for stiff joints and general comfort. It is easy to grow at home by planting a piece of fresh root in soil.",
    benefits: [
      "Helps ease mild swelling and body inflammation",
      "A good natural addition to daily meals for overall health",
      "Supports joint comfort and easier movement",
      "May help support the body's general defenses",
      "Warm turmeric tea is comforting for sore muscles and stiff joints",
      "Adds color and flavor to food without artificial coloring",
    ],
    preparations: [
      {
        title: "Golden turmeric tea",
        instructions:
          "Simmer 1 teaspoon of grated fresh turmeric (or 1/2 teaspoon dried powder) in 1 cup of water for 10 minutes. Strain, add a pinch of black pepper and honey to taste, and drink once daily. The pepper helps your body make better use of the turmeric.",
      },
      {
        title: "Culinary use",
        instructions:
          "Add fresh or dried turmeric to rice, curries, soups, or stews for a small, food-based amount alongside meals. It pairs well with garlic, ginger, and coconut milk.",
      },
      {
        title: "Turmeric paste",
        instructions:
          "Mix a little turmeric powder with water or coconut oil into a thick paste, and apply to a sore area for 15–20 minutes before rinsing. Test on a small area first, as it may stain skin yellow for a while.",
      },
    ],
    precautions:
      "Large amounts may make bleeding more likely — people taking blood thinners, or who have an upcoming surgery, should talk to a doctor before using concentrated turmeric regularly. People with gallbladder or gallstone problems should also check with a doctor. Turmeric stains hands, clothes, and countertops, so handle with care. Pregnant women should stick to normal food amounts.",
    funFact:
      "Turmeric is usually paired with black pepper in traditional and modern recipes because pepper helps the body take in more of turmeric's goodness.",
    alternatives: ["Pansit-Pansitan", "Siling Labuyo"],
  },
  {
    id: "Uray",
    name: "Uray",
    scientific_name: "Amaranthus spinosus",
    family: "Amaranthaceae (Amaranth family)",
    imageUrl: cloudinaryUrl("plants/uray.jpg"),
    images: [cloudinaryUrl("plants/uray.jpg"), cloudinaryUrl("plants/uray-2.jpg"), cloudinaryUrl("plants/uray-3.jpg"), cloudinaryUrl("plants/uray-4.jpg"), cloudinaryUrl("plants/uray-5.jpg")],
    tags: ["Fever", "Digestive Health", "Kidney & Urinary"],
    about:
      "Uray, also known as spiny amaranth, is a leafy plant that grows wild across the Philippines and is easy to recognize by the small, sharp spines at the base of its leaves. Many families gather it as a free vegetable, cooking the tender young leaves like spinach. It is also boiled into tea for its mild ability to help the body pass water and to bring down fever, making it a useful two-in-one plant in rural homes. It grows quickly in the rainy season and is often found along paths and in gardens.",
    benefits: [
      "Helps the body pass more urine, supporting urinary comfort",
      "Helps bring down mild fever",
      "Supports healthy digestion",
      "The cooked leaves are a good source of vitamins A and C, iron, and calcium",
      "A free, nutritious vegetable for many families",
      "Young leaves are tender and quick to cook",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Wash a handful of young leaves and boil in 2 cups of water for 10 minutes. Strain and drink 1/2 cup up to twice a day for fever, for 1–2 days.",
      },
      {
        title: "Sautéed leaves",
        instructions:
          "Choose tender young leaves and wash thoroughly, removing any spines. Sauté with garlic and onion like spinach, or add to soups near the end of cooking.",
      },
      {
        title: "Uray soup",
        instructions:
          "Boil ginger, onion, and fish or chicken in water, then add uray leaves and simmer for 3–5 minutes. Serve hot for a light and nourishing meal.",
      },
    ],
    precautions:
      "Pick only young, tender leaves and remove the spines, as older leaves and stems get tougher and sharper. Wash very well before cooking to remove soil. Avoid plants from roadsides or sprayed areas. People with kidney stones or kidney disease should ask a doctor before eating it often. See a doctor if fever lasts more than 2–3 days.",
    funFact:
      "Amaranth was an important grain crop of the ancient Aztecs, and the uray eaten in the Philippines is a distant cousin of the amaranth grain sold today as a health food.",
    alternatives: ["Sambong", "Saluyot"],
  },
  {
    id: "yerba-buena",
    name: "Yerba Buena",
    scientific_name: "Mentha cordifolia",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/yerba-buena.jpg"),
    images: [cloudinaryUrl("plants/yerba-buena.jpg"), cloudinaryUrl("plants/yerba-buena-2.jpg"), cloudinaryUrl("plants/yerba-buena-3.jpg"), cloudinaryUrl("plants/yerba-buena-4.jpg"), cloudinaryUrl("plants/yerba-buena-5.jpg")],
    tags: ["Joint & Pain Relief", "Digestive Health"],
    about:
      "Yerba buena is a Philippine mint that spreads easily in gardens and pots, and is known for its fresh, cooling smell. Its name is Spanish for \"good herb,\" and it lives up to that name in Filipino homes as a go-to remedy for headaches, stomach aches, and minor muscle pain. It can be drunk as a warm tea or crushed and rubbed on the skin. Chewing a leaf on a bumpy bus ride is a common trick to ease queasiness. Its cool, fresh scent also makes it a pleasant plant to have near the kitchen window.",
    benefits: [
      "Helps relieve headaches",
      "Soothes stomach aches and mild digestive discomfort",
      "Helps ease minor muscle and joint pain",
      "Gives a cooling, refreshing feeling when rubbed on skin",
      "Chewing a leaf helps ease mild nausea and freshens breath",
      "Grows easily and spreads quickly, so there is always a supply",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Wash a handful of fresh leaves and boil in 2 cups of water for 5–10 minutes. Strain and drink warm for headache or stomach ache relief, up to twice a day.",
      },
      {
        title: "Topical rub",
        instructions:
          "Crush fresh leaves and rub gently over a sore muscle, or hold a crushed leaf against the temples for a cooling feeling. Rinse if the skin feels irritated.",
      },
      {
        title: "Fresh leaf chew",
        instructions:
          "Chew a clean leaf for quick relief from mild nausea while traveling, or to freshen breath after a meal.",
      },
    ],
    precautions:
      "Very safe as a tea and rub in normal amounts. Strong mint oils are not the same as the fresh leaf and should be used with caution around babies and young children. People with severe acid reflux may find mint makes symptoms worse. If headaches or stomach pain are severe or lasting, see a doctor.",
    funFact:
      "The cooling feeling of yerba buena comes from the same kind of ingredient found in many store-bought muscle rubs, which is why crushed leaves have long been a free homegrown alternative.",
    alternatives: ["Basil", "Pandan"],
  },
];

export function getRandomPlants(count: number, excludeIds: string[] = []): Plant[] {
  const pool = PLANTS.filter((plant) => !excludeIds.includes(plant.id));
  // If excluding too many would leave fewer than `count` left to pick from,
  // fall back to the full list rather than returning a short result.
  const source = pool.length >= count ? pool : PLANTS;

  const shuffled = [...source];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function getPlantById(id: string) {
  return PLANTS.find((p) => p.id === id);
}

/**
 * NOTE ON IMAGES
 * ---------------
 * Images are no longer bundled into the app — each plant's `imageUrl`/`images`
 * point to Cloudinary instead, keeping them out of the APK/AAB entirely.
 *
 * The actual cloud name is read from EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME in
 * .env.local via the cloudinaryUrl() helper (utils/cloudinary.ts) — nothing
 * account-specific is hardcoded in this file.
 *
 * Upload each plant's photo(s) under a `plants/` folder in Cloudinary using
 * the plant's `id` as the filename — e.g. plants/akapulko.jpg for the
 * thumbnail, plus plants/akapulko-2.jpg and plants/akapulko-3.jpg if you
 * want more than one photo in that plant's detail-screen gallery.
 *
 * Don't render `imageUrl`/`images` directly with <Image source={{ uri: ... }} />
 * if you want offline support — use <CachedPlantImage> (single photo) or
 * <CachedPlantImageGallery> (multi-photo) from components/CachedPlantImage.tsx
 * instead, which cache each image to local storage on first load so the
 * library keeps working without a connection.
 */