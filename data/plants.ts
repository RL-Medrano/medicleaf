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
  activeCompounds: string[];
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
    images: [cloudinaryUrl("plants/akapulko.jpg"), cloudinaryUrl("plants/akapulko-2.jpg"), cloudinaryUrl("plants/akapulko-3.jpg")],
    tags: ["Skin Care", "Wound"],
    activeCompounds: ["Chrysophanic acid", "Anthraquinones", "Flavonoids"],
    about:
      "Akapulko, nicknamed the \"ringworm bush,\" is a shrub belonging to the legume family, easily identified by its tall yellow candle-like flower spikes and large paired leaflets. It grows abundantly along roadsides, vacant lots, and backyards throughout the Philippines, thriving in both sun and partial shade. Its leaves contain chrysophanic acid and other anthraquinone compounds with documented antifungal activity, which is the scientific basis for its long-standing reputation as the go-to home remedy for ringworm and similar fungal skin conditions. It's one of the ten plants formally endorsed by the Philippine Department of Health for traditional use, specifically for fungal infections of the skin.",
    benefits: [
      "Helps manage fungal skin infections such as ringworm, athlete's foot, and tinea",
      "Relieves itching and irritation caused by fungal growth on the skin",
      "Supports healthy, clear skin with consistent topical use over 1–2 weeks",
      "Acts as a natural antiseptic for minor fungal outbreaks",
      "Traditionally used to soothe insect bites and mild skin rashes",
    ],
    preparations: [
      {
        title: "Fresh-leaf rub",
        instructions:
          "Crush a handful of fresh leaves until the juice releases, then rub directly onto the clean, affected area 2–3 times a day for 1–2 weeks, or until the infection clears.",
      },
      {
        title: "Leaf decoction wash",
        instructions:
          "Boil a cup of chopped leaves in 2 cups of water for 10–15 minutes, let cool completely, and use the strained liquid as a topical wash morning and night. Refrigerate any unused portion and use within 2 days.",
      },
    ],
    precautions:
      "For external use only — never ingest. Discontinue immediately if redness, burning, or worsening irritation occurs. Avoid applying to broken skin, open wounds, or near the eyes. Not recommended for infants without a doctor's guidance.",
    funFact:
      "Akapulko's Latin name, Senna alata, is shared with a group of \"senna\" plants historically used as laxatives — but the Philippine tradition of using this particular species is almost entirely for the skin, not internally.",
    alternatives: ["Madre de Cacao", "Guava"],
  },
  {
    id: "alagao",
    name: "Alagao",
    scientific_name: "Premna odorata",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/alagao.jpg"),
    images: [cloudinaryUrl("plants/alagao.jpg"), cloudinaryUrl("plants/alagao-2.jpg"), cloudinaryUrl("plants/alagao-3.jpg")],
    tags: ["Cough", "Fever"],
    activeCompounds: ["Essential oils", "Iridoid glycosides", "Flavonoids"],
    about:
      "Alagao is a small, aromatic tree found throughout Philippine lowlands and thickets, closely related botanically to Lagundi and used in very similar ways for respiratory ailments. Its leaves release a distinct, slightly pungent aroma when crushed, a sign of the volatile oils believed to contribute to its traditional cough-relieving effects. In many provinces where Lagundi is less common, Alagao serves as the primary household remedy for cough, colds, and mild fever, often prepared alongside ginger for added warming effect.",
    benefits: [
      "Helps relieve persistent cough and chest congestion",
      "Eases general respiratory discomfort",
      "Helps bring down mild fever",
      "Traditionally used to soothe sore throat when gargled",
      "May help loosen phlegm to make coughs more productive",
    ],
    preparations: [
      {
        title: "Leaf decoction (drink)",
        instructions:
          "Boil a handful of fresh leaves in 2 cups of water for 10–15 minutes until the liquid reduces slightly. Strain, let cool to a warm (not hot) temperature, and drink 1/2 cup up to 3 times a day for up to a week.",
      },
      {
        title: "Throat gargle",
        instructions:
          "Use the same leaf decoction, fully cooled, as a gargle 2–3 times daily, spitting it out afterward rather than swallowing.",
      },
    ],
    precautions:
      "Discontinue if fever persists beyond 3 days or worsens — seek medical attention. Not well studied in pregnancy, so pregnant or breastfeeding individuals should consult a doctor first.",
    funFact:
      "Alagao and Lagundi belong to related plant lineages and were once even grouped in the same botanical family, which explains why traditional healers often use the two almost interchangeably.",
    alternatives: ["Lagundi", "Oregano"],
  },
  {
    id: "aloe-vera",
    name: "Aloe Vera",
    scientific_name: "Aloe vera",
    family: "Asphodelaceae (Aloe family)",
    imageUrl: cloudinaryUrl("plants/aloe-vera.jpg"),
    images: [cloudinaryUrl("plants/aloe-vera.jpg"), cloudinaryUrl("plants/aloe-vera-2.jpg"), cloudinaryUrl("plants/aloe-vera-3.jpg")],
    tags: ["Skin Care", "Wound"],
    activeCompounds: ["Acemannan (polysaccharide)", "Vitamins A, C & E", "Aloin (in the outer sap)"],
    about:
      "Aloe vera is a succulent plant with thick, spiky, water-storing leaves that has been used medicinally across cultures for thousands of years, from ancient Egypt to modern skincare shelves. The clear inner gel is rich in polysaccharides, vitamins, and mild antibacterial compounds that support its cooling, moisturizing, and wound-soothing reputation. It's a common potted plant in Filipino households, kept specifically within easy reach for quick first-aid use on sunburns, minor burns, and dry skin.",
    benefits: [
      "Soothes sunburn and other minor skin irritation",
      "Deeply moisturizes dry, flaky, or tight-feeling skin",
      "Supports faster healing of minor wounds and superficial burns",
      "Helps calm redness and inflammation on contact",
      "Can be used as a light, natural hair and scalp conditioner",
    ],
    preparations: [
      {
        title: "Fresh gel application",
        instructions:
          "Cut a mature, thick leaf lengthwise near the base and scoop out the clear gel with a clean spoon. Apply a thin layer directly to clean skin, leave on for 15–20 minutes, then rinse or leave to absorb fully. Fresh gel is best used within a few hours.",
      },
      {
        title: "Burn first-aid",
        instructions:
          "Cool the burn under running water first, then apply fresh gel immediately and reapply every 3–4 hours. Store any extra gel in a sealed container in the refrigerator for up to 2–3 days.",
      },
    ],
    precautions:
      "Avoid the bitter yellow sap layer just under the skin (latex), which can irritate skin and is not meant to be ingested. Always patch-test on a small area first, as a minority of people react to aloe. Do not apply to deep or infected wounds without medical guidance.",
    funFact:
      "Aloe vera plants can survive for weeks without water thanks to the same gel-filled leaves that make it useful medicinally — the plant is essentially storing its own first-aid supply.",
    alternatives: ["Akapulko", "Takip-Kohol"],
  },
  {
    id: "ampalaya",
    name: "Ampalaya",
    scientific_name: "Momordica charantia",
    family: "Cucurbitaceae (Gourd family)",
    imageUrl: cloudinaryUrl("plants/ampalaya.jpg"),
    images: [cloudinaryUrl("plants/ampalaya.jpg"), cloudinaryUrl("plants/ampalaya-2.jpg"), cloudinaryUrl("plants/ampalaya-3.jpg")],
    tags: ["Diabetes", "Digestive Health"],
    activeCompounds: ["Charantin", "Momordicin", "Polypeptide-P (plant insulin)"],
    about:
      "Ampalaya, or bitter gourd, is a climbing vine that produces the wrinkled, intensely bitter fruit familiar from dishes like pinakbet and ginisang ampalaya. It is one of the most extensively researched Philippine medicinal plants, officially recognized by the Department of Health for traditional blood sugar support. Both the fruit and the leaves are used medicinally — the fruit typically cooked as a vegetable and the leaves brewed as tea — and the plant's signature bitterness comes from compounds such as charantin and polypeptide-p, which have been studied for insulin-mimicking activity.",
    benefits: [
      "Traditionally used to help regulate blood sugar levels",
      "Supports healthy digestion when eaten as a vegetable",
      "Rich in antioxidants, vitamin C, and folate",
      "May help reduce mild inflammation",
      "Contains fiber that supports feelings of fullness",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Boil a handful of chopped fresh leaves in 2 cups of water for 15 minutes, strain, and drink 1/3 cup up to 3 times daily, ideally before meals.",
      },
      {
        title: "Sautéed fruit dish",
        instructions:
          "Slice the fruit lengthwise, scrape out the seeds and pith to reduce bitterness, soak in salted water for 10 minutes, then sauté with egg, onion, and tomato, or boil into a simple vegetable dish.",
      },
    ],
    precautions:
      "Can intensify the effect of diabetes medication — those on insulin or oral hypoglycemics should monitor blood sugar closely and consult a doctor before regular use. Avoid large amounts during pregnancy, as it has traditionally been linked to uterine contractions.",
    funFact:
      "Ampalaya gets more bitter the more sunlight it's grown in — some home gardeners deliberately partially shade the vine if they prefer a milder-tasting fruit for cooking.",
    alternatives: ["Banaba", "Tsaang Gubat"],
  },
  {
    id: "Aratiles",
    name: "Aratiles",
    scientific_name: "Muntingia calabura",
    family: "Muntingiaceae",
    imageUrl: cloudinaryUrl("plants/aratiles.jpg"),
    images: [cloudinaryUrl("plants/aratiles.jpg"), cloudinaryUrl("plants/aratiles-2.jpg"), cloudinaryUrl("plants/aratiles-3.jpg")],
    tags: ["Fever", "Cough", "Joint & Pain Relief"],
    activeCompounds: ["Flavonoids", "Tannins", "Saponins"],
    about:
      "Aratiles, known internationally as Jamaican cherry or Panama berry, is a fast-growing, shade-tolerant tree common in vacant lots, schoolyards, and roadsides, instantly recognizable by its tiny sweet red fruits that ripen year-round. Beyond being a favorite childhood snack, its leaves and flowers carry a long folk-medicine history for pain relief, colds, and mild inflammation, with modern studies exploring the plant's antioxidant flavonoid content as a possible explanation for these traditional uses.",
    benefits: [
      "Helps relieve headaches and general body aches",
      "Supports relief from colds, cough, and nasal congestion",
      "Helps ease mild inflammation and localized swelling",
      "The ripe fruit provides vitamin C, calcium, and iron",
      "Traditionally used to help calm mild stomach upset",
    ],
    preparations: [
      {
        title: "Leaf & flower tea",
        instructions:
          "Boil a handful of leaves and flowers in 2 cups of water for 10–15 minutes. Strain and drink warm, 1 cup up to twice a day, continuing for 2–3 days as needed for colds or headache relief.",
      },
      {
        title: "Fresh fruit",
        instructions:
          "Wash and eat the ripe fruit fresh as a snack, ideally when the skin has turned deep red and slightly soft — this is when it's sweetest and easiest to digest.",
      },
    ],
    precautions:
      "Generally well tolerated as a food and mild tea, but should not replace medical treatment for persistent or severe headaches or fevers.",
    funFact:
      "Aratiles trees can fruit almost continuously year-round, which is why the tiny red berries are such a familiar, always-available snack for Filipino kids climbing trees after school.",
    alternatives: ["Yerba Buena", "Lagundi"],
  },
  {
    id: "atis",
    name: "Atis",
    scientific_name: "Annona squamosa",
    family: "Annonaceae (Custard-apple family)",
    imageUrl: cloudinaryUrl("plants/atis.jpg"),
    images: [cloudinaryUrl("plants/atis.jpg"), cloudinaryUrl("plants/atis-2.jpg"), cloudinaryUrl("plants/atis-3.jpg")],
    tags: ["Digestive Health", "Skin Care"],
    activeCompounds: ["Acetogenins (mainly in seeds)", "Tannins", "Alkaloids"],
    about:
      "Atis, or sugar apple, is a small deciduous tree cultivated throughout the Philippines for its sweet, custard-textured fruit with a distinctive lumpy green skin. Outside of the kitchen, its leaves have a traditional role in remedies for digestive upset and minor skin concerns, typically prepared as a tea or crushed into a poultice, while the seeds — though never used medicinally due to their toxicity — are historically ground for use as a natural pesticide.",
    benefits: [
      "Helps relieve digestive discomfort and mild stomach upset",
      "Traditionally applied to minor skin irritations and insect bites",
      "Supports general digestive regularity",
      "The ripe fruit is a good source of vitamin C, fiber, and potassium",
      "Leaves are sometimes used in folk remedies for head lice (external only)",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Boil 4–5 fresh leaves in 2 cups of water for 10 minutes, strain, and drink 1/2 cup after meals for digestive discomfort, for up to 3 days.",
      },
      {
        title: "Leaf poultice",
        instructions:
          "Crush a few leaves into a paste and apply externally to the affected skin area for 15–20 minutes before rinsing off, avoiding broken skin or open wounds.",
      },
    ],
    precautions:
      "The seeds and unripe fruit are toxic and must never be eaten or crushed near the eyes. Use leaf preparations in moderation and discontinue if any stomach discomfort develops.",
    funFact:
      "The bumpy segments visible on the outside of an atis fruit each correspond to one individual carpel inside — botanically, it's technically a cluster of many tiny fruits fused into one.",
    alternatives: ["Tsaang Gubat", "Akapulko"],
  },
  {
    id: "banaba",
    name: "Banaba",
    scientific_name: "Lagerstroemia speciosa",
    family: "Lythraceae (Loosestrife family)",
    imageUrl: cloudinaryUrl("plants/banaba.jpg"),
    images: [cloudinaryUrl("plants/banaba.jpg"), cloudinaryUrl("plants/banaba-2.jpg"), cloudinaryUrl("plants/banaba-3.jpg")],
    tags: ["Diabetes", "Kidney & Urinary"],
    activeCompounds: ["Corosolic acid", "Ellagic acid", "Tannins"],
    about:
      "Banaba is a medium-sized flowering tree celebrated for its vivid purple-pink blossoms, often planted along streets and in parks as an ornamental as much as a medicinal resource. It holds official DOH recognition for traditional blood sugar management, largely attributed to corosolic acid in its leaves, a compound studied for insulin-like, glucose-transport-supporting effects. The plant is also traditionally valued for supporting healthy kidney and urinary function, often taken as a daily maintenance tea rather than an acute remedy.",
    benefits: [
      "Traditionally used to help manage blood sugar levels",
      "Supports healthy urinary tract function",
      "May help reduce mild fluid retention",
      "Contains ellagic acid and other antioxidant compounds",
      "Often used as a long-term daily wellness tea rather than a one-time remedy",
    ],
    preparations: [
      {
        title: "Dried leaf tea",
        instructions:
          "Steep 1 tablespoon of dried banaba leaves in 1 cup of hot water for 10 minutes. Strain and drink once or twice daily, preferably 30 minutes before meals for consistent use.",
      },
      {
        title: "Fresh leaf decoction",
        instructions:
          "If using fresh leaves, chop 4–5 leaves, simmer in 1 cup of water for 10 minutes, strain, and drink the same way — expect a milder taste than the dried version.",
      },
    ],
    precautions:
      "May lower blood sugar — those on diabetes medication should monitor levels closely and consult a doctor before starting regular use, and should not use it as a replacement for prescribed treatment.",
    funFact:
      "Banaba is the source of the Philippines' national tree candidate in some regional lists, and its brilliant purple flowering season (usually April–June) is a well-known seasonal marker in many provinces.",
    alternatives: ["Ampalaya", "Sambong"],
  },
  {
    id: "basil",
    name: "Basil",
    scientific_name: "Ocimum basilicum",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/basil.jpg"),
    images: [cloudinaryUrl("plants/basil.jpg"), cloudinaryUrl("plants/basil-2.jpg"), cloudinaryUrl("plants/basil-3.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    activeCompounds: ["Eugenol", "Linalool", "Flavonoids"],
    about:
      "Basil is a fragrant, fast-growing culinary herb, cultivated widely in home gardens for its role in cooking and as a gentle remedy for digestive complaints. Its essential oils — including eugenol and linalool — are associated with mild carminative and calming effects, which is why basil tea is a common addition to routines meant to ease bloating or settle nerves before or after meals.",
    benefits: [
      "Supports healthy digestion and helps ease bloating and gas",
      "Promotes general wellness with regular, moderate use",
      "Has a calming, mildly stress-relieving aroma",
      "Adds antioxidant compounds such as flavonoids to the diet",
      "May help freshen breath when chewed fresh",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Steep a small handful of fresh basil leaves in 1 cup of hot water for 5–7 minutes to make tea, drinking after meals to aid digestion.",
      },
      {
        title: "Fresh in food",
        instructions:
          "Tear fresh leaves into salads, or add whole to cooking toward the end of preparation to preserve the aromatic oils, which break down quickly under prolonged heat.",
      },
    ],
    precautions:
      "Generally safe as a culinary herb; concentrated basil-oil extracts (not the fresh leaf tea) are best avoided in large amounts during pregnancy.",
    funFact:
      "The eugenol that gives basil its characteristic aroma is the very same compound that gives cloves their scent, which is why the two occasionally show up together in home remedy blends.",
    alternatives: ["Yerba Buena", "Pandan"],
  },
  {
    id: "bayabas",
    name: "Bayabas (Guava)",
    scientific_name: "Psidium guajava",
    family: "Myrtaceae (Myrtle family)",
    imageUrl: cloudinaryUrl("plants/bayabas.jpg"),
    images: [cloudinaryUrl("plants/bayabas.jpg"), cloudinaryUrl("plants/bayabas-2.jpg"), cloudinaryUrl("plants/bayabas-3.jpg")],
    tags: ["Wound", "Digestive Health"],
    activeCompounds: ["Tannins", "Quercetin", "Flavonoids"],
    about:
      "Bayabas, or guava, is a small tree grown in nearly every Philippine backyard, prized for both its fruit and the medicinal reputation of its leaves. The leaves are rich in tannins and flavonoids with well-documented antibacterial and astringent properties, which is the scientific basis for the boiled leaf decoction's long-standing role as a first-aid wound wash and a household remedy for diarrhea. Many rural first-aid kits still consider guava leaves an essential item.",
    benefits: [
      "Helps disinfect and clean minor wounds and cuts",
      "Supports faster wound healing through its astringent action",
      "Traditionally used to help relieve diarrhea and stomach upset",
      "Has natural antibacterial properties studied in modern research",
      "The decoction is traditionally used as a mouth and gum rinse",
    ],
    preparations: [
      {
        title: "Wound wash",
        instructions:
          "Boil a handful of fresh leaves in 2 cups of water for 10–15 minutes. Let cool, then use the strained liquid to wash wounds 2–3 times a day.",
      },
      {
        title: "Digestive decoction",
        instructions:
          "Using the same decoction, drink 1/2 cup for stomach upset, up to 3 times daily for no more than 2 days.",
      },
    ],
    precautions:
      "Prolonged, heavy use for diarrhea beyond 2 days without improvement should prompt a doctor's visit, especially in children, to rule out dehydration or a more serious cause.",
    funFact:
      "Guava fruit can contain up to four times more vitamin C by weight than an orange, making the fruit itself — not just the leaves — a quietly powerful immune-supporting food.",
    alternatives: ["Akapulko", "Tsaang Gubat"],
  },
  {
    id: "bignay",
    name: "Bignay",
    scientific_name: "Antidesma bunius",
    family: "Phyllanthaceae",
    imageUrl: cloudinaryUrl("plants/bignay.jpg"),
    images: [cloudinaryUrl("plants/bignay.jpg"), cloudinaryUrl("plants/bignay-2.jpg"), cloudinaryUrl("plants/bignay-3.jpg")],
    tags: ["Digestive Health", "Kidney & Urinary", "Nutrition & Immunity"],
    activeCompounds: ["Anthocyanins", "Tannins", "Vitamin C"],
    about:
      "Bignay is a tree native to the Philippines, best known for its long, drooping clusters of tart red-to-black berries that darken and sweeten slightly as they ripen — often turned into wine, jam, or vinegar. The fruit is a notably rich source of antioxidants, particularly anthocyanins from its deep pigment, while the leaves carry a traditional history of use in decoctions meant to support digestive and urinary health.",
    benefits: [
      "Supports digestive health",
      "Promotes urinary tract wellness",
      "Rich in antioxidants, especially anthocyanins, from the ripe fruit",
      "May help support overall immune health",
      "Fruit is a traditional source of vitamin C",
    ],
    preparations: [
      {
        title: "Fresh fruit / simple preparations",
        instructions:
          "Eat fully ripe (dark purple-black) fruits fresh, or use them to make a simple syrup or jam by simmering with a little sugar until thickened.",
      },
      {
        title: "Leaf decoction",
        instructions:
          "Boil a handful of leaves in 2 cups of water for 10–15 minutes, strain, and drink 1/2 cup once or twice daily.",
      },
    ],
    precautions:
      "Unripe (green to red) fruit is very tart and astringent and best avoided raw, as it can cause stomach discomfort; wait until fruit is fully dark and soft before eating.",
    funFact:
      "Bignay wine is a genuine regional specialty in parts of the Philippines, particularly Ilocos, where the tart, deep-colored berries are fermented much like grapes.",
    alternatives: ["Sampaloc", "Pomelo"],
  },
  {
    id: "calamansi",
    name: "Calamansi",
    scientific_name: "Citrus microcarpa",
    family: "Rutaceae (Citrus family)",
    imageUrl: cloudinaryUrl("plants/calamansi.jpg"),
    images: [cloudinaryUrl("plants/calamansi.jpg"), cloudinaryUrl("plants/calamansi-2.jpg"), cloudinaryUrl("plants/calamansi-3.jpg")],
    tags: ["Cough", "Nutrition & Immunity"],
    activeCompounds: ["Vitamin C", "Flavonoids", "Citric acid"],
    about:
      "Calamansi is a small, tart citrus fruit — often called Philippine lime — that's a staple in both kitchens and medicine cabinets across the country. Its high vitamin C content and bright, sour juice make it one of the most reached-for home remedies at the first sign of a cough or cold, typically mixed with warm water and honey, and it's equally common as a condiment for savory dishes.",
    benefits: [
      "Boosts vitamin C intake, supporting collagen and immune function",
      "Helps relieve cough and colds",
      "Supports overall immune health",
      "Helps soothe a mild sore throat",
      "Traditionally used to help lighten dark elbows and minor skin blemishes when diluted",
    ],
    preparations: [
      {
        title: "Warm honey-calamansi drink",
        instructions:
          "Squeeze the juice of 3–4 calamansi into a glass of warm water, add a teaspoon of honey if desired, and drink 2–3 times a day at the first sign of a cold, continuing for 3–5 days.",
      },
      {
        title: "Salt-water gargle",
        instructions:
          "Mix the juice with a pinch of salt in warm water and gargle 2–3 times daily for sore throat, spitting it out afterward.",
      },
    ],
    precautions:
      "The juice is acidic and may irritate an already sensitive stomach or tooth enamel if used excessively — rinse the mouth with plain water afterward if using it frequently.",
    funFact:
      "Calamansi is actually a natural hybrid, believed to be a cross between a mandarin orange and a kumquat, which explains its unusually small size and thin, edible skin.",
    alternatives: ["Dayap", "Pomelo"],
  },
  {
    id: "cassava",
    name: "Cassava",
    scientific_name: "Manihot esculenta",
    family: "Euphorbiaceae (Spurge family)",
    imageUrl: cloudinaryUrl("plants/cassava.jpg"),
    images: [cloudinaryUrl("plants/cassava.jpg"), cloudinaryUrl("plants/cassava-2.jpg"), cloudinaryUrl("plants/cassava-3.jpg")],
    tags: ["Nutrition & Immunity"],
    activeCompounds: ["Resistant starch", "Cyanogenic glycosides (raw form only)"],
    about:
      "Cassava is a starchy root crop grown widely across the Philippines as a staple food, valued for its resilience in poor soils and its role as an affordable energy source, especially in provinces where rice can be scarce. In some traditional practices it's used to support nutrition during recovery from illness, though proper preparation is essential — raw or undercooked cassava naturally contains cyanogenic compounds that must be broken down through thorough cooking to be safe.",
    benefits: [
      "Provides a filling, energy-dense carbohydrate source",
      "Traditionally used to support nutrition during recovery from illness",
      "Naturally gluten-free source of calories",
      "Young leaves, when properly prepared, add extra vitamins and protein",
      "Widely available and inexpensive staple food across the Philippines",
    ],
    preparations: [
      {
        title: "Boiled root",
        instructions:
          "Peel and thoroughly boil the roots in water for at least 20–30 minutes until fully tender before eating — never consume raw or undercooked cassava.",
      },
      {
        title: "Prepared leaves",
        instructions:
          "If using young leaves, boil thoroughly, changing the water once partway through, before sautéing into dishes.",
      },
    ],
    precautions:
      "Improperly prepared (raw or undercooked) cassava can release cyanide-forming compounds and cause poisoning — always cook thoroughly, discard the cooking water, and never eat it raw.",
    funFact:
      "Cassava is one of the most drought-tolerant staple crops in the world, which is why it remains a critical backup food source in Philippine provinces prone to typhoon damage to rice crops.",
    alternatives: ["Sweet Potato", "Saluyot"],
  },
  {
    id: "dayap",
    name: "Dayap",
    scientific_name: "Citrus aurantiifolia",
    family: "Rutaceae (Citrus family)",
    imageUrl: cloudinaryUrl("plants/dayap.jpg"),
    images: [cloudinaryUrl("plants/dayap.jpg"), cloudinaryUrl("plants/dayap-2.jpg"), cloudinaryUrl("plants/dayap-3.jpg")],
    tags: ["Cough", "Digestive Health", "Nutrition & Immunity"],
    activeCompounds: ["Citric acid", "Vitamin C", "Flavonoids"],
    about:
      "Dayap, the Philippine lime, is a small, intensely sour citrus fruit closely related to calamansi but slightly larger and rounder. It's traditionally used in much the same way — as a vitamin C source for colds and coughs — and its juice is also a common addition to home remedies meant to settle an upset stomach or cut through greasy dishes at the table.",
    benefits: [
      "Helps relieve respiratory discomfort and cough",
      "Supports digestive health, especially after heavy meals",
      "Rich in vitamin C and citric acid",
      "Helps freshen breath and soothe minor throat irritation",
      "Traditionally used in hair rinses for scalp freshness",
    ],
    preparations: [
      {
        title: "Honey-lime drink",
        instructions:
          "Mix the juice of 2–3 dayap fruits into a glass of warm water, optionally with honey, and drink up to twice a day for cough or cold relief, continuing for a few days as needed.",
      },
      {
        title: "Digestive rinse",
        instructions:
          "Dilute a tablespoon of juice in a full glass of water and sip slowly after meals for an upset stomach.",
      },
    ],
    precautions:
      "Like other citrus, the juice is acidic and may aggravate acid reflux or sensitive teeth if used undiluted or in excess.",
    funFact:
      "Dayap is technically a key lime relative, and Filipino cooks often use it interchangeably with calamansi in sawsawan — though its stronger sourness means recipes usually call for less of it.",
    alternatives: ["Calamansi", "Pomelo"],
  },
  {
    id: "gumamela",
    name: "Gumamela",
    scientific_name: "Hibiscus rosa-sinensis",
    family: "Malvaceae (Mallow family)",
    imageUrl: cloudinaryUrl("plants/gumamela.jpg"),
    images: [cloudinaryUrl("plants/gumamela.jpg"), cloudinaryUrl("plants/gumamela-2.jpg"), cloudinaryUrl("plants/gumamela-3.jpg")],
    tags: ["Fever", "Cough", "Joint & Pain Relief"],
    activeCompounds: ["Anthocyanins", "Mucilage", "Flavonoids"],
    about:
      "Gumamela, the hibiscus flower, is one of the most familiar backyard plants in the Philippines, grown as much for its large, colorful blooms as its traditional herbal uses. Both the flowers and leaves are used in preparations meant to bring down fever and calm cough, and crushed leaves are sometimes applied externally as a folk remedy for swelling, while the flower tea itself has a mild, slightly tart flavor reminiscent of commercial hibiscus teas.",
    benefits: [
      "Helps reduce fever",
      "Relieves cough and mild throat irritation",
      "Helps ease mild inflammation and localized swelling",
      "The flower tea offers antioxidant anthocyanin compounds",
      "Traditionally used in hair-care remedies to promote scalp health",
    ],
    preparations: [
      {
        title: "Flower & leaf tea",
        instructions:
          "Boil a handful of fresh flowers and leaves in 2 cups of water for 10 minutes. Strain and drink warm, 1/2 cup up to 3 times a day, for 1–2 days to help bring down fever.",
      },
      {
        title: "Leaf poultice for swelling",
        instructions:
          "Crush fresh leaves into a paste and apply externally to the swollen area for 20 minutes before rinsing off.",
      },
    ],
    precautions:
      "Traditionally advised against in pregnancy in larger medicinal amounts, as hibiscus has historically been associated with uterine-stimulating effects; occasional tea as a beverage is generally considered lower risk, but check with a doctor if pregnant.",
    funFact:
      "Gumamela is the Philippines' unofficial \"shoe flower\" — in some countries the crushed petals are literally used to polish shoes because of their natural mucilage and pigment.",
    alternatives: ["Lagundi", "Turmeric"],
  },
  {
    id: "ipil-ipil",
    name: "Ipil-Ipil",
    scientific_name: "Leucaena leucocephala",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/ipil-ipil.jpg"),
    images: [cloudinaryUrl("plants/ipil-ipil.jpg"), cloudinaryUrl("plants/ipil-ipil-2.jpg"), cloudinaryUrl("plants/ipil-ipil-3.jpg")],
    tags: ["Wound", "Digestive Health"],
    activeCompounds: ["Mimosine (seeds)", "Tannins"],
    about:
      "Ipil-ipil is a fast-growing, nitrogen-fixing tree found throughout the Philippine countryside, often planted as a natural living fence or for reforestation because of the soil benefits its roots provide. Its leaves and seeds carry a traditional history of use for wound care and as a folk remedy against intestinal parasites, though seed-based preparations require particular caution because concentrated doses of the plant's natural compound mimosine can be toxic.",
    benefits: [
      "Supports wound healing when applied externally as a leaf poultice",
      "Traditionally used to help with digestive discomfort",
      "Historically used in folk medicine as an antiparasitic remedy",
      "Young leaves are sometimes cooked as a vegetable in small amounts",
      "Its wood and leaves support soil health, an indirect benefit to farming communities",
    ],
    preparations: [
      {
        title: "Wound wash",
        instructions:
          "Boil a handful of leaves in 2 cups of water for 10–15 minutes, strain, and use the cooled liquid to clean minor wounds.",
      },
      {
        title: "Leaf poultice",
        instructions:
          "Crush fresh leaves into a poultice for direct application to a wound, changing it every few hours.",
      },
    ],
    precautions:
      "The seeds contain mimosine, which can be toxic in concentrated or repeated doses — avoid unsupervised seed preparations, and do not use in children or during pregnancy.",
    funFact:
      "Ipil-ipil is so effective at fixing nitrogen into soil that farmers often plant it purely as a natural fertilizer crop between growing seasons, regardless of its medicinal uses.",
    alternatives: ["Bayabas", "Akapulko"],
  },
  {
    id: "kamantigi",
    name: "Kamantigi",
    scientific_name: "Impatiens balsamina",
    family: "Balsaminaceae (Touch-me-not family)",
    imageUrl: cloudinaryUrl("plants/kamantigi.jpg"),
    images: [cloudinaryUrl("plants/kamantigi.jpg"), cloudinaryUrl("plants/kamantigi-2.jpg"), cloudinaryUrl("plants/kamantigi-3.jpg")],
    tags: ["Skin Care", "Joint & Pain Relief"],
    activeCompounds: ["Naphthoquinones", "Flavonoids"],
    about:
      "Kamantigi, also known as garden balsam, is a colorful flowering annual traditionally grown in Filipino home gardens, admired for its pink, red, or white blooms. Beyond its ornamental appeal, its leaves have long been used in folk skin remedies, typically crushed fresh and applied to soothe irritation, mild infections, and localized inflammation, and in some traditions the crushed petals are used as a natural, temporary nail stain.",
    benefits: [
      "Helps manage minor skin infections",
      "Reduces localized inflammation and swelling",
      "Soothes irritated or itchy skin",
      "Traditionally used for insect bite discomfort",
      "Petals have folk use as a natural, temporary skin and nail dye",
    ],
    preparations: [
      {
        title: "Leaf poultice",
        instructions:
          "Crush a handful of fresh leaves into a paste and apply directly to the affected skin area, covering lightly with clean gauze if needed. Leave on for 20–30 minutes before rinsing off, repeating up to twice daily for 3–5 days.",
      },
    ],
    precautions:
      "For external use only. Discontinue if any irritation, rash, or worsening redness develops, and avoid applying near the eyes or on broken skin.",
    funFact:
      "Kamantigi's ripe seed pods explosively burst open at the slightest touch to fling their seeds away — the source of its family name \"touch-me-not\" and \"impatiens.\"",
    alternatives: ["Akapulko", "Madre de Cacao"],
  },
  {
    id: "kamias",
    name: "Kamias",
    scientific_name: "Averrhoa bilimbi",
    family: "Oxalidaceae (Wood-sorrel family)",
    imageUrl: cloudinaryUrl("plants/kamias.jpg"),
    images: [cloudinaryUrl("plants/kamias.jpg"), cloudinaryUrl("plants/kamias-2.jpg"), cloudinaryUrl("plants/kamias-3.jpg")],
    tags: ["Cough", "Skin Care"],
    activeCompounds: ["Oxalic acid", "Vitamin C", "Flavonoids"],
    about:
      "Kamias, or bilimbi, is a sour, cucumber-shaped fruit that grows directly on the tree's trunk and branches in dense clusters, giving it a distinctive appearance. It's a common souring agent in Filipino cooking — used in sinigang in place of tamarind in some regions — and also has a traditional role in home remedies for cough and certain skin conditions, along with folk use for supporting healthy blood pressure.",
    benefits: [
      "Helps relieve cough",
      "Traditionally used to support healthy blood pressure",
      "Helps with minor skin conditions like rashes, acne, and boils",
      "Adds vitamin C, potassium, and antioxidants to the diet",
      "Used traditionally as a natural metal and stain cleaner (non-medicinal folk use)",
    ],
    preparations: [
      {
        title: "Fruit decoction",
        instructions:
          "Boil 5–6 fresh fruits in 2 cups of water for 10 minutes, strain, and drink 1/2 cup for cough relief, up to twice a day for 2–3 days.",
      },
      {
        title: "Fruit poultice for skin",
        instructions:
          "Mash the ripe fruit and apply directly to the affected skin area, leaving on for 15 minutes before rinsing.",
      },
    ],
    precautions:
      "Very high in oxalic acid — those with a history of kidney stones or kidney disease should limit intake and consult a doctor, and it should be consumed in moderation by everyone due to its acidity.",
    funFact:
      "Kamias fruits so directly out of the trunk and older branches (a growth habit called cauliflory) that from a distance the tree can look almost studded with tiny green ornaments.",
    alternatives: ["Calamansi", "Sampaloc"],
  },
  {
    id: "lagundi",
    name: "Lagundi",
    scientific_name: "Vitex negundo",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/lagundi.jpg"),
    images: [cloudinaryUrl("plants/lagundi.jpg"), cloudinaryUrl("plants/lagundi-2.jpg"), cloudinaryUrl("plants/lagundi-3.jpg")],
    tags: ["Cough", "Fever"],
    activeCompounds: ["Vitexin", "Casticin", "Iridoid glycosides"],
    about:
      "Lagundi is one of the most widely recognized and clinically studied medicinal plants in the Philippines, officially endorsed by the Department of Health for respiratory relief and used as the active ingredient in several commercial cough syrups and tablets sold in Philippine pharmacies. Its palm-shaped leaves contain compounds with documented anti-inflammatory and bronchodilating effects, giving it a strong evidence base compared to many other traditional remedies, and it's commonly grown as a hedge plant specifically for household medicinal use.",
    benefits: [
      "Helps relieve cough and colds",
      "Soothes sore throat",
      "Helps reduce fever",
      "Recognized by DOH as effective for easing asthma and bronchitis symptoms",
      "Available commercially as standardized tablets and syrups for consistent dosing",
    ],
    preparations: [
      {
        title: "Leaf decoction",
        instructions:
          "Boil 6 tablespoons of fresh, chopped leaves in 2 cups of water for 10–15 minutes until it reduces to about 1 cup. Strain, cool, and drink 1/4 cup up to 3 times a day for up to a week.",
      },
      {
        title: "Commercial preparation",
        instructions:
          "Lagundi syrup or tablets, available at most Philippine pharmacies, can be used per the product's printed dosing instructions for a more standardized alternative to the homemade decoction.",
      },
    ],
    precautions:
      "Children and pregnant or breastfeeding women should use lower doses or consult a doctor first, as traditional use in these groups is less well studied than in adults.",
    funFact:
      "Lagundi is one of only a handful of Philippine herbal plants that has gone through formal clinical trials and is registered with the Philippine FDA as an actual over-the-counter medicine, not just a folk remedy.",
    alternatives: ["Oregano", "Alagao"],
  },
  {
    id: "madre-de-cacao",
    name: "Madre de Cacao",
    scientific_name: "Gliricidia sepium",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/madre-de-cacao.jpg"),
    images: [cloudinaryUrl("plants/madre-de-cacao.jpg"), cloudinaryUrl("plants/madre-de-cacao-2.jpg"), cloudinaryUrl("plants/madre-de-cacao-3.jpg")],
    tags: ["Skin Care", "Wound"],
    activeCompounds: ["Coumarin", "Tannins", "Flavonoids"],
    about:
      "Madre de Cacao, locally called \"kakawate,\" is a fast-growing tree commonly used as living fence posts and shade for cacao plantations throughout the Philippine countryside, which is how it earned its Spanish name meaning \"mother of cacao.\" Its leaves carry a distinct, slightly bitter smell and are traditionally valued for their antifungal and antiseptic effects, making decoctions and poultices from the leaves a go-to remedy for skin infections, scabies, and minor wounds.",
    benefits: [
      "Helps treat fungal skin infections",
      "Supports faster wound healing",
      "Has natural antifungal and antiseptic properties",
      "Traditionally used as an external wash for scabies and lice",
      "Sometimes used in folk veterinary medicine for livestock skin conditions",
    ],
    preparations: [
      {
        title: "Leaf decoction wash",
        instructions:
          "Boil a handful of leaves in 2 cups of water for 15 minutes, let cool, and use the strained decoction as a wound or skin wash twice daily for up to a week.",
      },
      {
        title: "Leaf poultice",
        instructions:
          "Crush fresh leaves and apply directly as a poultice to fungal patches, leaving on for 20–30 minutes before rinsing.",
      },
    ],
    precautions:
      "For external use only — the plant's seeds and bark contain compounds considered toxic if ingested in quantity, and it has traditional use as a rodenticide, so it should be kept away from ingestion by children or pets.",
    funFact:
      "\"Kakawate\" fence posts often sprout roots and grow into full living trees on their own — the plant is so hardy that farmers plant cut branches directly into the ground to form an instant, self-repairing fence line.",
    alternatives: ["Akapulko", "Bayabas"],
  },
  {
    id: "malunggay",
    name: "Malunggay",
    scientific_name: "Moringa oleifera",
    family: "Moringaceae",
    imageUrl: cloudinaryUrl("plants/malungay.jpg"),
    images: [cloudinaryUrl("plants/malungay.jpg"), cloudinaryUrl("plants/malungay-2.jpg"), cloudinaryUrl("plants/malungay-3.jpg")],
    tags: ["Nutrition & Immunity"],
    activeCompounds: ["Quercetin", "Chlorogenic acid", "Vitamins A & C, calcium, iron"],
    about:
      "Malunggay, or moringa, is often called a \"miracle tree\" for its exceptionally dense nutrient profile — its small leaflets pack meaningful amounts of vitamins A and C, calcium, iron, and complete plant protein into a very small serving. It's a staple ingredient in Filipino soups like tinola and monggo, and is frequently recommended by health workers to support nutrition in breastfeeding mothers, growing children, and anyone recovering from illness or malnutrition.",
    benefits: [
      "Boosts overall nutrition and sustained energy",
      "Rich source of vitamins, minerals, and complete protein",
      "Supports immune health through its antioxidant content",
      "Traditionally used to support milk supply in breastfeeding mothers",
      "The seeds and dried leaf powder are also used in some communities for water purification and general supplementation",
    ],
    preparations: [
      {
        title: "Added to soups",
        instructions:
          "Add a generous handful of fresh leaves to soups, stews, or sautéed dishes during the last 2–3 minutes of cooking to preserve heat-sensitive vitamins.",
      },
      {
        title: "Dried leaf tea",
        instructions:
          "Steep 1 tablespoon of dried leaves in a cup of hot water for 5–10 minutes and drink once daily.",
      },
    ],
    precautions:
      "The root and root bark are not used medicinally and are considered unsafe due to toxic alkaloids — only the leaves, and to a lesser extent the pods, are used for food and remedies.",
    funFact:
      "Gram for gram, malunggay leaves contain more vitamin C than an orange and more calcium than milk, which is why nutrition programs across the Philippines actively promote it for school feeding programs.",
    alternatives: ["Saluyot", "Sweet Potato"],
  },
  {
    id: "manga",
    name: "Manga (Mango)",
    scientific_name: "Mangifera indica",
    family: "Anacardiaceae (Cashew family)",
    imageUrl: cloudinaryUrl("plants/manga.jpg"),
    images: [cloudinaryUrl("plants/manga.jpg"), cloudinaryUrl("plants/manga-2.jpg"), cloudinaryUrl("plants/manga-3.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    activeCompounds: ["Mangiferin", "Gallotannins", "Vitamins A & C"],
    about:
      "Manga, or mango, is the Philippines' national fruit and a source of both everyday nutrition and traditional home remedies. Beyond the beloved sweet fruit, the young leaves and bark have a folk history of use in decoctions meant to ease digestive complaints, and the ripe fruit itself is prized for its rich beta-carotene, vitamin C, and fiber content, making it a favorite way to support general wellness during the hot season.",
    benefits: [
      "Supports digestive health",
      "Rich in antioxidants and vitamin A/C from the ripe fruit",
      "Traditionally used for a variety of minor ailments in leaf-decoction form",
      "Fruit provides natural energy, fiber, and potassium",
      "Young leaves are sometimes used in folk remedies for mild respiratory discomfort",
    ],
    preparations: [
      {
        title: "Young leaf decoction",
        instructions:
          "Boil a handful of young leaves in 2 cups of water for 10–15 minutes, strain, and drink 1/2 cup after meals for digestive support, for a few days as needed.",
      },
      {
        title: "Fresh fruit",
        instructions:
          "Peel and eat the ripe fruit fresh as part of a balanced diet, or blend into a simple juice or shake.",
      },
    ],
    precautions:
      "The sap from the stem and unripe fruit skin can cause skin irritation in sensitive individuals (similar to other Anacardiaceae plants like cashew) — handle unripe fruit and stems with care.",
    funFact:
      "The Philippine \"Carabao\" mango variety is officially recognized in the Guinness World Records as the sweetest mango in the world, a title it has held since being tested in the 1990s.",
    alternatives: ["Bignay", "Atis"],
  },
  {
    id: "Mangosteen",
    name: "Mangosteen",
    scientific_name: "Garcinia mangostana",
    family: "Clusiaceae (Mangosteen family)",
    imageUrl: cloudinaryUrl("plants/mangosteen.jpg"),
    images: [cloudinaryUrl("plants/mangosteen.jpg"), cloudinaryUrl("plants/mangosteen-2.jpg"), cloudinaryUrl("plants/mangosteen-3.jpg")],
    tags: ["Digestive Health", "Joint & Pain Relief", "Nutrition & Immunity"],
    activeCompounds: ["Alpha-mangostin (xanthone)", "Tannins"],
    about:
      "Mangosteen is a slow-growing tropical fruit tree prized for its sweet-tart white flesh, often called the \"queen of fruits.\" While the flesh is the culinary highlight, it's the thick purple rind that holds most of the plant's traditional medicinal value — rich in xanthones, a family of powerful antioxidant compounds that have drawn significant modern research interest for their anti-inflammatory potential, and long used in decoctions for digestive complaints like diarrhea.",
    benefits: [
      "Supports digestive health and helps relieve diarrhea",
      "Rich in antioxidant xanthone compounds, particularly in the rind",
      "Helps ease mild inflammation",
      "The fresh fruit supports overall nutrition and hydration",
      "Rind extracts are used in some traditional skin-care preparations",
    ],
    preparations: [
      {
        title: "Rind decoction",
        instructions:
          "Boil the dried rind of 2–3 fruits in 2 cups of water for 15–20 minutes until the liquid turns a deep red-purple. Strain and drink 1/2 cup once or twice a day for up to 2 days if experiencing mild diarrhea.",
      },
      {
        title: "Fresh fruit",
        instructions:
          "Eat the fresh white segments as-is, as part of a healthy diet, discarding the rind unless preparing the decoction above.",
      },
    ],
    precautions:
      "The rind decoction is quite astringent and should be used in moderation; discontinue if diarrhea persists beyond 2 days and seek medical care, especially in children.",
    funFact:
      "Mangosteen trees can take 7–10 years before producing their first fruit, one of the longest waits of any common tropical fruit tree, which historically made mangosteen something of a luxury item.",
    alternatives: ["Tsaang Gubat", "Turmeric"],
  },
  {
    id: "oregano",
    name: "Oregano",
    scientific_name: "Plectranthus amboinicus",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/oregano.jpg"),
    images: [cloudinaryUrl("plants/oregano.jpg"), cloudinaryUrl("plants/oregano-2.jpg"), cloudinaryUrl("plants/oregano-3.jpg")],
    tags: ["Cough"],
    activeCompounds: ["Carvacrol", "Thymol-like essential oils"],
    about:
      "The oregano commonly used in Philippine herbal medicine (Plectranthus amboinicus, also called Spanish thyme, Mexican mint, or \"suganda\") is a thick, fuzzy-leafed succulent plant, botanically distinct from the Mediterranean culinary oregano despite the shared common name. Its leaves have a strong, pungent, almost menthol-like aroma when crushed and are one of the most trusted household remedies for cough and sore throat, often grown in a simple pot right outside the kitchen door.",
    benefits: [
      "Helps relieve cough",
      "Soothes sore throat",
      "Supports overall respiratory comfort",
      "Has natural antibacterial compounds",
      "Traditionally chewed fresh for quick, on-the-spot relief",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Boil 5–6 fresh leaves in 1 cup of water for 5–10 minutes. Strain, add honey if desired, and drink warm up to 3 times a day for 2–3 days.",
      },
      {
        title: "Fresh chew",
        instructions:
          "Chew a single fresh leaf directly for quick, mild relief, though the strong, slightly bitter taste is an acquired one for many first-time users.",
      },
    ],
    precautions:
      "The essential oils are potent — avoid giving large amounts of concentrated leaf preparations to very young children, and stick to mild teas rather than raw leaf chewing for them.",
    funFact:
      "Despite sharing a common Filipino name with Mediterranean oregano, this plant is actually in a completely different genus — it's more closely related to true Philippine mint (yerba buena) than to pizza-topping oregano.",
    alternatives: ["Lagundi", "Alagao"],
  },
  {
    id: "pandan",
    name: "Pandan",
    scientific_name: "Pandanus amaryllifolius",
    family: "Pandanaceae (Screwpine family)",
    imageUrl: cloudinaryUrl("plants/pandan.jpg"),
    images: [cloudinaryUrl("plants/pandan.jpg"), cloudinaryUrl("plants/pandan-2.jpg"), cloudinaryUrl("plants/pandan-3.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    activeCompounds: ["2-acetyl-1-pyrroline (aroma compound)", "Alkaloids"],
    about:
      "Pandan is an aromatic plant beloved across Filipino and wider Southeast Asian cooking for the sweet, grassy, vanilla-like fragrance its long blade-shaped leaves lend to rice, desserts like buko pandan, and refreshing drinks. Alongside its culinary role, pandan tea is a common home remedy used to promote relaxation and settle mild digestive discomfort, and the leaves are sometimes placed around the home simply for their pleasant natural scent.",
    benefits: [
      "Promotes relaxation and helps ease mild stress",
      "Supports digestive comfort after meals",
      "Adds natural aroma and flavor to food and drink without added sugar",
      "Traditionally used as a mild diuretic",
      "Leaves are sometimes used in folk foot-soak remedies for tired feet",
    ],
    preparations: [
      {
        title: "Knotted leaf tea",
        instructions:
          "Tie 2–3 fresh pandan leaves into a knot and boil in 2 cups of water for 10 minutes. Strain and drink warm as a calming tea after meals.",
      },
      {
        title: "Chilled infused drink",
        instructions:
          "Let the same tea cool and refrigerate as a refreshing infused drink for up to 2 days, serving over ice.",
      },
    ],
    precautions:
      "Generally very safe as a food and beverage flavoring; no significant precautions beyond standard food hygiene when handling fresh leaves.",
    funFact:
      "The signature aroma compound in pandan, 2-acetyl-1-pyrroline, is the exact same compound responsible for the fragrance of freshly cooked jasmine rice — which is why pandan-infused rice smells so naturally appealing.",
    alternatives: ["Basil", "Yerba Buena"],
  },
  {
    id: "pansit-pansitan",
    name: "Pansit-Pansitan",
    scientific_name: "Peperomia pellucida",
    family: "Piperaceae (Pepper family)",
    imageUrl: cloudinaryUrl("plants/pansit-pansitan.jpg"),
    images: [cloudinaryUrl("plants/pansit-pansitan.jpg"), cloudinaryUrl("plants/pansit-pansitan-2.jpg"), cloudinaryUrl("plants/pansit-pansitan-3.jpg")],
    tags: ["Joint & Pain Relief"],
    activeCompounds: ["Apiol", "Flavonoids"],
    about:
      "Pansit-pansitan is a small, succulent-leafed herb that grows readily in shaded, damp spots around Philippine homes, gardens, and cracks in pavement, often considered a common \"weed\" despite its valued medicinal role. It's officially recognized as a traditional remedy for gout and arthritis, believed to help the body process and eliminate excess uric acid — often the underlying cause of the sharp joint pain associated with gout flare-ups — and is also eaten as a mild, peppery leafy green.",
    benefits: [
      "Helps reduce uric acid levels",
      "Supports joint health and mobility",
      "Helps relieve gout and arthritis-related pain",
      "Can be eaten as a nutritious, mildly peppery leafy green",
      "Traditionally used topically as a poultice for insect stings",
    ],
    preparations: [
      {
        title: "Whole-plant decoction",
        instructions:
          "Boil a handful of the whole plant (leaves and stems) in 2 cups of water for 15 minutes. Strain and drink 1/2 cup twice a day for ongoing joint support, continuing over several weeks for chronic use.",
      },
      {
        title: "Fresh salad green",
        instructions:
          "Wash fresh leaves and eat raw as a salad green, or add to soups for a mild peppery flavor and added fiber.",
      },
    ],
    precautions:
      "Not a substitute for prescribed gout or arthritis medication during an acute, severe flare — seek medical care for sudden, intense joint pain and swelling.",
    funFact:
      "Pansit-pansitan gets its name from its resemblance to the noodle dish \"pancit\" once dried, and it's actually a close relative of black pepper — both belong to the Piperaceae family.",
    alternatives: ["Turmeric", "Takip-Kohol"],
  },
  {
    id: "peanut",
    name: "Peanut",
    scientific_name: "Arachis hypogaea",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/peanut.jpg"),
    images: [cloudinaryUrl("plants/peanut.jpg"), cloudinaryUrl("plants/peanut-2.jpg"), cloudinaryUrl("plants/peanut-3.jpg")],
    tags: ["Nutrition & Immunity"],
    activeCompounds: ["Resveratrol", "Unsaturated fatty acids", "Protein"],
    about:
      "Peanut is a widely cultivated legume grown underground in pods, valued in the Philippines primarily as a nutritious, affordable food source rich in protein and healthy fats. While not typically prepared as a medicinal decoction, it's commonly included in diets meant to support energy levels and general nourishment, especially during recovery from illness, and is a popular snack roasted, boiled, or turned into peanut butter and kropek.",
    benefits: [
      "Provides plant-based protein and healthy unsaturated fats",
      "Rich in antioxidants, including resveratrol",
      "Supports overall nutrition and sustained, steady energy",
      "Good source of dietary fiber, magnesium, and B vitamins",
      "An affordable, widely available protein source for everyday diets",
    ],
    preparations: [
      {
        title: "Boiled peanuts",
        instructions:
          "Boil unshelled peanuts in salted water for 30–45 minutes until tender for a traditional \"boiled peanuts\" snack.",
      },
      {
        title: "Dry-roasted peanuts",
        instructions:
          "Dry-roast shelled peanuts in a pan over medium heat, stirring often, until golden and fragrant, then cool before eating or grinding into peanut sauce.",
      },
    ],
    precautions:
      "One of the most common food allergens — avoid entirely for anyone with a known peanut allergy, and introduce cautiously and under guidance for young children without a prior history.",
    funFact:
      "Peanuts actually flower above ground but then bury their own developing pods underground to mature — an unusual growth habit called \"geocarpy\" shared by very few other food crops.",
    alternatives: ["Malunggay", "Sweet Potato"],
  },
  {
    id: "pomelo",
    name: "Pomelo",
    scientific_name: "Citrus maxima",
    family: "Rutaceae (Citrus family)",
    imageUrl: cloudinaryUrl("plants/pomelo.jpg"),
    images: [cloudinaryUrl("plants/pomelo.jpg"), cloudinaryUrl("plants/pomelo-2.jpg"), cloudinaryUrl("plants/pomelo-3.jpg")],
    tags: ["Nutrition & Immunity", "Digestive Health"],
    activeCompounds: ["Naringin", "Vitamin C", "Flavonoids"],
    about:
      "Pomelo is the largest citrus fruit in the world and a popular Philippine harvest fruit, particularly associated with certain provinces known for their sweet, low-acid varieties. Recognizable by its very thick rind and mild, juicy segments, it's a rich source of vitamin C and is traditionally eaten fresh to support immune health, especially reached for during cold and flu season or as a refreshing dessert after a heavy meal.",
    benefits: [
      "Boosts vitamin C intake",
      "Supports immune health",
      "Aids digestion, especially after rich or fatty meals",
      "Low in calories relative to its fiber and water content",
      "Rind is sometimes candied and used in folk remedies for coughs",
    ],
    preparations: [
      {
        title: "Fresh segments",
        instructions:
          "Peel and segment the fruit, removing the thin bitter membrane if preferred, and eat fresh as a snack or dessert.",
      },
      {
        title: "Diluted juice",
        instructions:
          "Extract the juice and dilute slightly with water for a refreshing vitamin C drink, best consumed the same day it's prepared.",
      },
    ],
    precautions:
      "Like grapefruit, pomelo can interact with certain medications (including some cholesterol and blood pressure drugs) by affecting how the liver processes them — check with a doctor or pharmacist if taking such medications regularly.",
    funFact:
      "Pomelo is actually the ancestor citrus fruit that, crossed with mandarin, produced the modern grapefruit — meaning pomelo is genetically the older, original fruit rather than a variation of it.",
    alternatives: ["Calamansi", "Dayap"],
  },
  {
    id: "saluyot",
    name: "Saluyot",
    scientific_name: "Corchorus olitorius",
    family: "Malvaceae (Mallow family)",
    imageUrl: cloudinaryUrl("plants/saluyot.jpg"),
    images: [cloudinaryUrl("plants/saluyot.jpg"), cloudinaryUrl("plants/saluyot-2.jpg"), cloudinaryUrl("plants/saluyot-3.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    activeCompounds: ["Mucilage (soluble fiber)", "Vitamins A & C", "Calcium"],
    about:
      "Saluyot is a mucilaginous leafy vegetable especially popular in Ilocano cuisine, recognized by the slightly slippery, okra-like texture it develops once cooked. It's densely packed with vitamins, minerals, and soluble fiber, and is traditionally valued as a gentle, food-based remedy for constipation, often paired with dried fish or bagoong in simple, everyday home-cooked dishes.",
    benefits: [
      "Supports digestive health and regularity",
      "Rich in vitamins A and C, calcium, iron, and dietary fiber",
      "Helps relieve mild constipation",
      "Contributes meaningfully to overall daily nutrition",
      "Low in calories, making it a nutrient-dense vegetable choice",
    ],
    preparations: [
      {
        title: "Sautéed or soup addition",
        instructions:
          "Wash fresh leaves thoroughly and add to soups or sautéed dishes during the last few minutes of cooking, as simmering too long can make the texture overly mucilaginous. Combine with garlic, onion, and a little dried fish or shrimp for a classic, simple preparation.",
      },
    ],
    precautions:
      "Generally very safe as a common vegetable; no significant precautions beyond typical vegetable washing hygiene.",
    funFact:
      "Saluyot belongs to the jute plant family — the same plant family used to make jute fiber and burlap sacks, though the culinary variety is grown specifically for its tender, edible leaves.",
    alternatives: ["Malunggay", "Sweet Potato"],
  },
  {
    id: "sambong",
    name: "Sambong",
    scientific_name: "Blumea balsamifera",
    family: "Asteraceae (Daisy family)",
    imageUrl: cloudinaryUrl("plants/sambong.jpg"),
    images: [cloudinaryUrl("plants/sambong.jpg"), cloudinaryUrl("plants/sambong-2.jpg"), cloudinaryUrl("plants/sambong-3.jpg")],
    tags: ["Kidney & Urinary"],
    activeCompounds: ["Borneol", "Camphor", "Flavonoids"],
    about:
      "Sambong is a shrub with large, fragrant, camphor-scented leaves, and one of the most well-established DOH-endorsed herbal medicines in the Philippines, available commercially as standardized tablets in many pharmacies. It's specifically recognized for its diuretic properties and traditional role in helping the body pass small kidney stones and manage mild urinary tract discomfort, and is often recommended alongside increased water intake for best results.",
    benefits: [
      "Supports kidney health",
      "Promotes urinary tract wellness",
      "Has natural diuretic properties that help flush the urinary system",
      "Traditionally used to help manage mild edema (fluid retention)",
      "Available as standardized commercial capsules for consistent dosing",
    ],
    preparations: [
      {
        title: "Leaf decoction",
        instructions:
          "Boil a handful of fresh leaves in 2 cups of water for 15 minutes, strain, and drink 1/2 cup 3 times a day for up to a week, alongside at least 8 glasses of plain water daily to support the diuretic effect.",
      },
      {
        title: "Commercial capsules",
        instructions:
          "Sambong capsules, available at most Philippine pharmacies, can be taken per the product's printed dosing instructions as a standardized alternative.",
      },
    ],
    precautions:
      "Consult a doctor if kidney stone symptoms are severe (intense pain, blood in urine, fever) rather than relying on herbal treatment alone, and those with existing kidney disease should seek medical guidance before regular use.",
    funFact:
      "The camphor-like scent in sambong's leaves is strong enough that crushed leaves have traditionally also been used as a simple natural insect repellent, separate from its internal medicinal use.",
    alternatives: ["Banaba", "Sampasampalukan"],
  },
  {
    id: "sampaloc",
    name: "Sampaloc",
    scientific_name: "Tamarindus indica",
    family: "Fabaceae (Legume family)",
    imageUrl: cloudinaryUrl("plants/sampaloc.jpg"),
    images: [cloudinaryUrl("plants/sampaloc.jpg"), cloudinaryUrl("plants/sampaloc-2.jpg"), cloudinaryUrl("plants/sampaloc-3.jpg")],
    tags: ["Digestive Health", "Nutrition & Immunity"],
    activeCompounds: ["Tartaric acid", "Polyphenols"],
    about:
      "Sampaloc, or tamarind, is a large, long-lived tree whose tangy fruit pulp is a defining Filipino cooking staple, most famously the souring base for sinigang. Beyond flavor, the ripe pulp has a long-standing traditional use as a gentle laxative and digestive aid, and it's rich in both antioxidants and natural fruit acids, while young leaves are sometimes used in folk fever remedies as well.",
    benefits: [
      "Supports digestive health",
      "Rich in antioxidants and natural fruit acids",
      "Helps relieve mild constipation",
      "Provides a natural, tangy source of vitamin C and potassium",
      "Young leaves are traditionally used in folk remedies for mild fever",
    ],
    preparations: [
      {
        title: "Soaked pulp drink",
        instructions:
          "Soak a small handful of ripe tamarind pulp in a cup of warm water for 10 minutes, mash, strain out the seeds and fibers, and drink the liquid — optionally sweetened — once daily to support digestion.",
      },
      {
        title: "Fresh pulp / cooking",
        instructions:
          "Eat the pulp directly as a sweet-sour snack, or use it to season soups and sauces such as sinigang for both flavor and its traditional digestive benefit.",
      },
    ],
    precautions:
      "High intake can have a laxative effect stronger than intended — start with small amounts, especially for children, and reduce if loose stools occur.",
    funFact:
      "Tamarind trees can live for well over a century and keep producing fruit for most of that time, which is why many old sampaloc trees in the provinces are treated as local landmarks.",
    alternatives: ["Bignay", "Mangosteen"],
  },
  {
    id: "sampasampalukan",
    name: "Sampasampalukan",
    scientific_name: "Phyllanthus niruri",
    family: "Phyllanthaceae",
    imageUrl: cloudinaryUrl("plants/sampasampalukan.jpg"),
    images: [cloudinaryUrl("plants/sampasampalukan.jpg"), cloudinaryUrl("plants/sampasampalukan-2.jpg"), cloudinaryUrl("plants/sampasampalukan-3.jpg")],
    tags: ["Kidney & Urinary"],
    activeCompounds: ["Phyllanthin (lignan)", "Flavonoids"],
    about:
      "Sampasampalukan, internationally known as \"stonebreaker\" or chanca piedra, is a small weedy plant with tiny leaves resembling a miniature tamarind (hence its local name), valued specifically for traditional kidney and urinary support. Its long-standing folk reputation for helping the body address kidney stones has drawn interest from modern researchers studying its potential effects on stone formation and urinary comfort.",
    benefits: [
      "Supports urinary tract health",
      "Traditionally used to help with kidney stone discomfort",
      "Has mild diuretic properties",
      "Used in folk medicine to support liver function",
      "Sometimes used traditionally as a mild remedy for minor urinary tract irritation",
    ],
    preparations: [
      {
        title: "Whole-plant decoction",
        instructions:
          "Boil the entire fresh plant (roots, stems, and leaves) — about a handful — in 3 cups of water for 15–20 minutes. Strain and drink 1 cup, 2–3 times a day for up to a week, alongside increased plain water intake.",
      },
    ],
    precautions:
      "Those with existing kidney disease, or who are pregnant or breastfeeding, should consult a doctor before regular use, as its diuretic effect may not be appropriate for all conditions.",
    funFact:
      "Its English nickname \"stonebreaker\" comes directly from traditional folk belief across multiple countries — not just the Philippines — that the plant helps the body break down small kidney stones, a name it's carried in Spanish (\"chanca piedra\") for centuries.",
    alternatives: ["Sambong", "Banaba"],
  },
  {
    id: "siling-labuyo",
    name: "Siling Labuyo",
    scientific_name: "Capsicum frutescens",
    family: "Solanaceae (Nightshade family)",
    imageUrl: cloudinaryUrl("plants/siling-labuyo.jpg"),
    images: [cloudinaryUrl("plants/siling-labuyo.jpg"), cloudinaryUrl("plants/siling-labuyo-2.jpg"), cloudinaryUrl("plants/siling-labuyo-3.jpg")],
    tags: ["Joint & Pain Relief", "Nutrition & Immunity"],
    activeCompounds: ["Capsaicin", "Vitamin C"],
    about:
      "Siling labuyo is a small but intensely hot native Philippine chili pepper, a defining ingredient in dishes like bicol express and sawsawan. It's packed with capsaicin, the compound responsible for both its fiery heat and its traditional use in topical pain-relief preparations, and while it's primarily a kitchen staple, folk medicine has long used it — carefully diluted — in liniments meant to ease muscle and joint pain through its warming, counter-irritant effect.",
    benefits: [
      "Rich in antioxidants and vitamin C",
      "Traditionally used in topical preparations for muscle and joint pain",
      "May help support metabolism",
      "Adds capsaicin, a compound with documented anti-inflammatory research interest",
      "Small amounts in the diet are traditionally believed to aid digestion",
    ],
    preparations: [
      {
        title: "Culinary use",
        instructions:
          "Add fresh or dried chilies sparingly to dishes to taste, whether whole, sliced, or as part of a vinegar-based dipping sauce.",
      },
      {
        title: "Traditional oil liniment",
        instructions:
          "Infuse a small handful of chopped chilies in warmed coconut oil for several days in a sealed jar, strain well, and apply a small amount externally to sore muscles, massaging gently.",
      },
    ],
    precautions:
      "Never apply concentrated chili preparations to broken skin, eyes, or mucous membranes, and always wash hands thoroughly with soap after handling. Discontinue topical use if burning becomes excessive rather than a mild warming sensation.",
    funFact:
      "Siling labuyo consistently ranks among the hottest chilies commonly used in Southeast Asian cooking, often measuring well above jalapeños on the Scoville heat scale despite its small size.",
    alternatives: ["Turmeric", "Yerba Buena"],
  },
  {
    id: "sweet-potato",
    name: "Sweet Potato",
    scientific_name: "Ipomoea batatas",
    family: "Convolvulaceae (Morning glory family)",
    imageUrl: cloudinaryUrl("plants/sweet-potato.jpg"),
    images: [cloudinaryUrl("plants/sweet-potato.jpg"), cloudinaryUrl("plants/sweet-potato-2.jpg"), cloudinaryUrl("plants/sweet-potato-3.jpg")],
    tags: ["Nutrition & Immunity", "Digestive Health"],
    activeCompounds: ["Beta-carotene", "Anthocyanins (in purple varieties)"],
    about:
      "Sweet potato, or kamote, is a nutrient-dense root crop grown throughout the Philippines, valued for both its sweet, orange-fleshed roots and its edible, mild-tasting young leaves. It's naturally rich in beta-carotene (vitamin A), fiber, and antioxidants, making it a common food-based recommendation for supporting digestion, eye health, and general nutrition, and it's often used as an accessible, filling staple during lean harvest seasons.",
    benefits: [
      "Rich in vitamins, especially vitamin A, and dietary fiber",
      "Provides antioxidant compounds, particularly beta-carotene",
      "Supports digestive health and regularity",
      "A filling, naturally sweet source of steady energy",
      "The young leaves offer additional folate and iron",
    ],
    preparations: [
      {
        title: "Boiled or steamed root",
        instructions:
          "Boil or steam whole, unpeeled roots for 20–25 minutes until fork-tender, then peel and eat, or roast in an oven for a caramelized flavor.",
      },
      {
        title: "Sautéed leaves",
        instructions:
          "Wash young leaves and sauté with garlic and onion, or add to soups, similar to saluyot or malunggay, for an extra nutritional boost.",
      },
    ],
    precautions:
      "Generally very safe as a staple food; those on blood-thinning medication should be mindful of the vitamin K content in the leaves if eating them in very large amounts regularly.",
    funFact:
      "Despite the shared name, sweet potato is botanically unrelated to the regular potato — it belongs to the morning glory family, while potatoes are in the nightshade family alongside tomatoes and eggplant.",
    alternatives: ["Malunggay", "Saluyot"],
  },
  {
    id: "takip-kohol",
    name: "Takip-Kohol",
    scientific_name: "Centella asiatica",
    family: "Apiaceae (Carrot family)",
    imageUrl: cloudinaryUrl("plants/takip-kohol.jpg"),
    images: [cloudinaryUrl("plants/takip-kohol.jpg"), cloudinaryUrl("plants/takip-kohol-2.jpg"), cloudinaryUrl("plants/takip-kohol-3.jpg")],
    tags: ["Wound", "Joint & Pain Relief"],
    activeCompounds: ["Asiaticoside", "Madecassoside (triterpenoids)"],
    about:
      "Takip-kohol, internationally known as Centella asiatica or \"gotu kola,\" is a small creeping herb with round, coin-shaped leaves that thrives in moist, shaded areas. It has a strong traditional and modern reputation for supporting skin and wound healing — its triterpenoid compounds have been studied for their skin-regenerating properties — and it's also associated in folk use with improved mental clarity, memory, and healthy blood circulation.",
    benefits: [
      "Supports wound healing and skin repair",
      "Traditionally associated with improved memory and focus",
      "Promotes healthy blood circulation",
      "Contains compounds studied for their collagen-supporting, skin-regenerating properties",
      "Used in some traditional preparations to support healthy-looking, resilient skin overall",
    ],
    preparations: [
      {
        title: "Fresh salad or tea",
        instructions:
          "Wash and eat a small handful of fresh leaves raw as a salad green, or steep a handful in a cup of hot water for 10 minutes to make tea, drinking once daily.",
      },
      {
        title: "Wound poultice",
        instructions:
          "Crush fresh leaves and apply directly to clean, minor wounds as a poultice, changing it once or twice a day.",
      },
    ],
    precautions:
      "Not recommended for use on deep or infected wounds without medical evaluation, and those with liver conditions should consult a doctor before regular internal use, as very high, prolonged doses have occasionally been linked to liver strain in case reports.",
    funFact:
      "Gotu kola is nicknamed the \"herb of longevity\" in several Asian traditions, tied to folklore claiming regular consumers lived unusually long, active lives — a reputation that helped drive much of the modern scientific interest in the plant.",
    alternatives: ["Aloe Vera", "Bayabas"],
  },
  {
    id: "tawa-tawa",
    name: "Tawa-Tawa",
    scientific_name: "Euphorbia hirta",
    family: "Euphorbiaceae (Spurge family)",
    imageUrl: cloudinaryUrl("plants/tawa-tawa.jpg"),
    images: [cloudinaryUrl("plants/tawa-tawa.jpg"), cloudinaryUrl("plants/tawa-tawa-2.jpg"), cloudinaryUrl("plants/tawa-tawa-3.jpg")],
    tags: ["Fever", "Cough"],
    activeCompounds: ["Flavonoids", "Tannins", "Euphorbin"],
    about:
      "Tawa-tawa is a small, hairy weed that grows commonly in vacant lots, sidewalk cracks, and open fields across the Philippines. It gained widespread public attention as a traditional supportive remedy during dengue outbreaks, with many families brewing it as a household first-response tea believed to help support platelet levels — though it's important to understand this is a supportive folk practice and should never replace prompt medical care for dengue or any serious, persistent fever.",
    benefits: [
      "Helps reduce fever",
      "Supports general respiratory comfort",
      "Traditionally used as supportive care alongside medical treatment for dengue-related symptoms",
      "Widely used as a household first-response herbal remedy for mild fevers",
      "The whole plant, including small leaves and stems, is used fresh for quick preparation",
    ],
    preparations: [
      {
        title: "Whole-plant decoction",
        instructions:
          "Boil the entire fresh plant (about a handful, roots and all) in 2 cups of water for 10–15 minutes. Strain and let cool before drinking 1/2 cup, up to 3 times a day, for 2–3 days while monitoring symptoms closely.",
      },
    ],
    precautions:
      "This is a supportive remedy only, not a proven treatment or cure for dengue — anyone with high, persistent fever, especially with warning signs like severe abdominal pain, bleeding, or persistent vomiting, should seek medical attention immediately rather than relying on herbal treatment alone.",
    funFact:
      "Tawa-tawa's popularity as a dengue-season home remedy spikes so predictably in the Philippines that the plant is sometimes reported to sell out at local herbal markets during rainy-season outbreak periods.",
    alternatives: ["Lagundi", "Gumamela"],
  },
  {
    id: "tsaang-gubat",
    name: "Tsaang Gubat",
    scientific_name: "Ehretia microphylla",
    family: "Boraginaceae (Borage family)",
    imageUrl: cloudinaryUrl("plants/tsaang-gubat.jpg"),
    images: [cloudinaryUrl("plants/tsaang-gubat.jpg"), cloudinaryUrl("plants/tsaang-gubat-2.jpg"), cloudinaryUrl("plants/tsaang-gubat-3.jpg")],
    tags: ["Indigestion", "Digestive Health"],
    activeCompounds: ["Triterpenes", "Tannins"],
    about:
      "Tsaang gubat, meaning \"forest tea,\" is a DOH-recognized medicinal shrub whose small, glossy leaves have been brewed as a household remedy for stomach complaints for generations. It's commonly kept on hand for indigestion, stomach ache, and diarrhea, and unlike many purely folk remedies, it's also sold commercially as a ready-made herbal tea bag product in Philippine drugstores and supermarkets for convenient daily use.",
    benefits: [
      "Helps relieve stomach ache and cramping",
      "Supports overall digestive health",
      "Traditionally used to help manage diarrhea",
      "Has a mild, pleasant, tea-like flavor that's easy to drink regularly",
      "Available commercially as ready-made tea bags for consistent daily use",
    ],
    preparations: [
      {
        title: "Fresh or dried leaf decoction",
        instructions:
          "Boil a handful of fresh or dried leaves in 2 cups of water for 10–15 minutes. Strain and drink warm, 1/2 cup after meals or as needed for stomach discomfort, up to 3 times a day for a few days.",
      },
      {
        title: "Commercial tea bags",
        instructions:
          "Steep a commercial tsaang gubat tea bag per the package instructions as a convenient, pre-measured alternative to the homemade decoction.",
      },
    ],
    precautions:
      "If diarrhea or stomach pain persists beyond 2 days, worsens, or is accompanied by fever, seek medical attention rather than continuing home treatment alone.",
    funFact:
      "Tsaang gubat is one of the few Philippine medicinal plants sold as an actual packaged tea product on grocery shelves, sitting alongside imported teas rather than only being found in traditional herbal stalls.",
    alternatives: ["Bayabas", "Ampalaya"],
  },
  {
    id: "tuba",
    name: "Tuba",
    scientific_name: "Jatropha curcas",
    family: "Euphorbiaceae (Spurge family)",
    imageUrl: cloudinaryUrl("plants/tuba.jpg"),
    images: [cloudinaryUrl("plants/tuba.jpg"), cloudinaryUrl("plants/tuba-2.jpg"), cloudinaryUrl("plants/tuba-3.jpg")],
    tags: ["Wound", "Skin Care"],
    activeCompounds: ["Phorbol esters (toxic)", "Curcin"],
    about:
      "Tuba, or physic nut, is a hardy shrub often planted as a living fence for its ability to thrive with minimal care. While parts of the plant contain toxic compounds and must never be ingested, the milky sap and processed leaf preparations have a traditional history of careful, brief external use for minor wounds and certain skin conditions, and the seed oil has separately been studied internationally as a potential biofuel source, unrelated to its medicinal folk use.",
    benefits: [
      "Traditionally applied externally to minor wounds to help stop light bleeding",
      "Used in folk preparations for certain skin conditions",
      "Sap is sometimes used briefly to help seal small cuts",
    ],
    preparations: [
      {
        title: "Sap first-aid (brief, external only)",
        instructions:
          "The milky sap from a freshly broken stem or leaf is applied sparingly and briefly to a minor cut to help stop bleeding, then washed off promptly with clean water. Treat this as a one-time, first-aid-style application, not a routine skincare step.",
      },
    ],
    precautions:
      "The seeds, sap, and other plant parts contain toxic compounds and must never be ingested by anyone; never use on broken or infected skin without professional guidance, and keep entirely out of reach of children, who may mistake the seeds for edible nuts.",
    funFact:
      "Tuba's seed oil gained global attention in the 2000s as an experimental biodiesel crop, since it grows on marginal land unsuitable for food crops — a use entirely separate from, and far better known internationally than, its traditional medicinal role.",
    alternatives: ["Madre de Cacao", "Akapulko"],
  },
  {
    id: "turmeric",
    name: "Turmeric",
    scientific_name: "Curcuma longa",
    family: "Zingiberaceae (Ginger family)",
    imageUrl: cloudinaryUrl("plants/turmeric.jpg"),
    images: [cloudinaryUrl("plants/turmeric.jpg"), cloudinaryUrl("plants/turmeric-2.jpg"), cloudinaryUrl("plants/turmeric-3.jpg")],
    tags: ["Joint & Pain Relief", "Nutrition & Immunity"],
    activeCompounds: ["Curcumin", "Essential oils (turmerone)"],
    about:
      "Turmeric is a golden-yellow rhizome, related to ginger, used throughout the Philippines both as a cooking spice — notably in dishes like turmeric rice — and as a traditional anti-inflammatory remedy. Its active compound, curcumin, has been extensively studied worldwide for its antioxidant and anti-inflammatory properties, making turmeric tea a popular, evidence-backed home remedy for joint discomfort and general inflammatory support.",
    benefits: [
      "Helps reduce mild inflammation",
      "Rich in antioxidants, especially curcumin",
      "Supports joint comfort and mobility",
      "May support overall immune health",
      "Widely studied internationally for general anti-inflammatory research interest",
    ],
    preparations: [
      {
        title: "Golden turmeric tea",
        instructions:
          "Simmer 1 teaspoon of grated fresh turmeric (or 1/2 teaspoon dried powder) in 1 cup of water for 10 minutes. Strain, add a pinch of black pepper to improve curcumin absorption and honey to taste, and drink once daily.",
      },
      {
        title: "Culinary use",
        instructions:
          "Add fresh or dried turmeric directly to cooking — rice, curries, or stews — for a smaller, food-based dose alongside meals.",
      },
    ],
    precautions:
      "High doses may thin the blood slightly — those on blood-thinning medication or scheduled for surgery should consult a doctor before taking concentrated turmeric preparations regularly. Fresh turmeric can also stain hands and clothing, so handle with care.",
    funFact:
      "Curcumin, turmeric's most famous compound, is very poorly absorbed by the body on its own — which is exactly why traditional and modern preparations alike almost always pair it with black pepper, whose piperine dramatically boosts absorption.",
    alternatives: ["Pansit-Pansitan", "Siling Labuyo"],
  },
  {
    id: "Uray",
    name: "Uray",
    scientific_name: "Amaranthus spinosus",
    family: "Amaranthaceae (Amaranth family)",
    imageUrl: cloudinaryUrl("plants/uray.jpg"),
    images: [cloudinaryUrl("plants/uray.jpg"), cloudinaryUrl("plants/uray-2.jpg"), cloudinaryUrl("plants/uray-3.jpg")],
    tags: ["Fever", "Digestive Health", "Kidney & Urinary"],
    activeCompounds: ["Flavonoids", "Vitamins A & C", "Iron"],
    about:
      "Uray, or spiny amaranth, is a leafy weed found growing wild across the Philippines, easily recognized by the small spines along its stem, and valued both as a free, nutrient-rich vegetable and as a traditional remedy. Its tender young leaves are eaten cooked much like spinach, and also boiled into tea for their mild diuretic and fever-reducing effects, making it a practical dual-purpose plant for many rural households.",
    benefits: [
      "Has natural diuretic properties",
      "Helps reduce fever",
      "Supports healthy digestion",
      "The cooked leaves are a good source of vitamins A and C, iron, and calcium",
      "A free, widely available nutritious vegetable in many communities",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Boil a handful of young leaves in 2 cups of water for 10 minutes for tea, straining and drinking 1/2 cup up to twice a day for fever, for 1–2 days.",
      },
      {
        title: "Sautéed leaves",
        instructions:
          "Wash tender young leaves, remove any spines, and sauté as a vegetable side dish, similar to spinach, with garlic and onion.",
      },
    ],
    precautions:
      "Harvest only young, tender leaves, as older leaves and stems develop tougher spines; wash thoroughly before cooking to remove soil and any remaining spine fragments.",
    funFact:
      "Amaranth, the broader plant family uray belongs to, was once a staple grain crop of the Aztec Empire — the leafy uray eaten in the Philippines is a distant cousin of the grain amaranth still sold as a health food today.",
    alternatives: ["Sambong", "Saluyot"],
  },
  {
    id: "yerba-buena",
    name: "Yerba Buena",
    scientific_name: "Mentha cordifolia",
    family: "Lamiaceae (Mint family)",
    imageUrl: cloudinaryUrl("plants/yerba-buena.jpg"),
    images: [cloudinaryUrl("plants/yerba-buena.jpg"), cloudinaryUrl("plants/yerba-buena-2.jpg"), cloudinaryUrl("plants/yerba-buena-3.jpg")],
    tags: ["Joint & Pain Relief", "Digestive Health"],
    activeCompounds: ["Menthol", "Menthone", "Essential oils"],
    about:
      "Yerba buena, a Philippine mint variety, is one of the most familiar backyard remedy plants, instantly recognizable by its refreshing, cooling scent and easy-to-grow nature. It's a trusted household go-to for headaches, stomach aches, and minor muscle pain, used either as a warming tea or as a crushed external application, and its name — Spanish for \"good herb\" — reflects just how central it has long been to everyday Filipino home remedies.",
    benefits: [
      "Helps relieve headaches",
      "Soothes stomach aches and mild digestive discomfort",
      "Helps with minor muscle and joint pain",
      "Has a cooling, refreshing sensation when applied to skin",
      "Traditionally chewed to help ease mild nausea and freshen breath",
    ],
    preparations: [
      {
        title: "Leaf tea",
        instructions:
          "Boil a handful of fresh leaves in 2 cups of water for 5–10 minutes, strain, and drink warm for headache or stomach ache relief, up to twice a day.",
      },
      {
        title: "Topical rub",
        instructions:
          "Crush fresh leaves and rub gently over a sore muscle or joint area, or chew a leaf directly for quick relief from mild nausea while traveling.",
      },
    ],
    precautions:
      "Generally very safe as a tea and topical rub in normal amounts; concentrated mint-oil extracts (distinct from the fresh leaf tea) should be used cautiously in infants and young children.",
    funFact:
      "The menthol in yerba buena is the same cooling compound found in most commercial mentholated ointments — which is exactly why crushed yerba buena leaves have long served as a free, homegrown alternative to store-bought muscle rubs.",
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