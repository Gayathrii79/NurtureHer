from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class KnowledgeEntry:
    id: str
    category: str
    title: str
    content: str
    source: str = "Clinical Practice Standard"
    language: str = "en"


KNOWLEDGE_BASE: list[KnowledgeEntry] = [
    # ------------------ Safety & Obstetric Red Flags ------------------
    KnowledgeEntry(
        id="safety_urgent_001",
        category="safety",
        title="Urgent Obstetric Emergency Warning Signs",
        content=(
            "Immediate emergency medical evaluation (Dial 112/108 or report to emergency triage) is mandatory for: "
            "heavy vaginal bleeding soaking a pad in under an hour, severe unilateral or generalized abdominal pain, "
            "fainting, loss of consciousness, sudden severe shortness of breath, sudden facial or hand edema with blurred vision, "
            "seizures, fever above 101°F (38.3°C), or marked reduction in perceived fetal movements after 28 weeks gestation. "
            "Never delay hospital evaluation for severe red-flag symptoms."
        ),
        source="WHO Antenatal Care Guidelines & FOGSI Emergency Protocols",
    ),
    KnowledgeEntry(
        id="safety_preeclampsia_002",
        category="safety",
        title="Preeclampsia and Gestational Hypertension Red Flags",
        content=(
            "Preeclampsia is characterized by blood pressure >= 140/90 mmHg after 20 weeks with proteinuria or end-organ signs. "
            "Critical warning signs include persistent throbbing frontal headache unresponsive to paracetamol, visual disturbances "
            "(flashing spots, scotoma, blurriness), right upper quadrant epigastric pain (hepatic capsule stretch), and rapid hand/facial swelling. "
            "Prompt administration of magnesium sulfate and antihypertensive therapy under clinician supervision prevents eclampsia."
        ),
        source="ACOG Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia",
    ),
    KnowledgeEntry(
        id="safety_fetal_movement_003",
        category="safety",
        title="Fetal Movement Monitoring (Kick Counts)",
        content=(
            "From 28 weeks onwards, mothers should be aware of regular fetal movements. A reliable kick-count method involves resting in a "
            "left lateral position after a meal and counting distinct movements. A healthy fetus typically achieves at least 10 distinct kicks, rolls, "
            "or swishes within 2 hours. A sudden cessation or acute drop in baseline movement requires non-stress testing (NST) and ultrasound Doppler within hours."
        ),
        source="RCOG Green-top Guideline No. 57: Reduced Fetal Movements",
    ),

    # ------------------ Pregnancy Trimester Protocols ------------------
    KnowledgeEntry(
        id="pregnancy_trimester1_001",
        category="pregnancy",
        title="First Trimester Care (Weeks 1 to 12)",
        content=(
            "Key milestones in the first trimester: early confirmation of intrauterine pregnancy via dating ultrasound (6-8 weeks), "
            "daily supplementation with 400-500 mcg Folic Acid to prevent neural tube defects, baseline hemoglobin and blood group Rh screening, "
            "nuchal translucency (NT) scan at 11-13+6 weeks. Manage nausea with small frequent meals, ginger infusion, and vitamin B6 (pyridoxine). "
            "Avoid NSAIDs (ibuprofen), unpasteurized dairy, raw eggs, and strenuous high-impact physical stress."
        ),
        source="ICMR Guidelines for Antenatal Care & WHO First Trimester Standards",
    ),
    KnowledgeEntry(
        id="pregnancy_trimester2_002",
        category="pregnancy",
        title="Second Trimester Care (Weeks 13 to 26)",
        content=(
            "The second trimester represents the golden period of maternal energy. Essential checkups include the comprehensive fetal anomaly scan "
            "(Target Scan / TIFFA) at 18-20 weeks to evaluate fetal organ anatomy, cervical length monitoring, and initiation of oral elemental iron (60-100 mg) "
            "and calcium carbonate (500 mg twice daily separated by 2 hours). Screen for Gestational Diabetes Mellitus (GDM) between 24-28 weeks using a 75g OGTT."
        ),
        source="Ministry of Health and Family Welfare (MoHFW) Maternal Health Division",
    ),
    KnowledgeEntry(
        id="pregnancy_trimester3_003",
        category="pregnancy",
        title="Third Trimester Care (Weeks 27 to 40+)",
        content=(
            "In the third trimester, biweekly antenatal visits assess blood pressure, fundal height, fetal presentation, and urine albumin. "
            "Tetanus Toxoid / Tdap booster should be administered. Prepare a hospital delivery bag, identify an authorized delivery hospital with NICU, "
            "and memorize the distinction between harmless Braxton Hicks contractions (irregular, painless, ease with hydration) and true labor contractions "
            "(regular, progressively closer and more painful, accompanied by show or fluid leak)."
        ),
        source="WHO Recommendations on Maternal and Newborn Care for a Positive Experience",
    ),

    # ------------------ PCOS (Polycystic Ovary Syndrome) ------------------
    KnowledgeEntry(
        id="pcos_rotterdam_001",
        category="pcos",
        title="PCOS Diagnosis: Rotterdam Criteria",
        content=(
            "According to international consensus (Rotterdam criteria), PCOS is diagnosed when at least 2 of 3 features are present after excluding other causes: "
            "1) Oligo- or anovulation (cycles > 35 days apart or < 8 periods/year), "
            "2) Clinical or biochemical hyperandrogenism (hirsutism, severe adult acne, androgenic alopecia, or elevated free testosterone/DHEA-S), "
            "3) Polycystic ovarian morphology on pelvic ultrasound (>= 20 follicles per ovary or ovarian volume >= 10 mL). "
            "Thyroid dysfunction, hyperprolactinemia, and congenital adrenal hyperplasia must be ruled out."
        ),
        source="International Evidence-based Guideline for the Assessment and Management of PCOS (Monash 2023)",
    ),
    KnowledgeEntry(
        id="pcos_insulin_resistance_002",
        category="pcos",
        title="PCOS Pathophysiology and Insulin Resistance",
        content=(
            "Up to 75% of women with PCOS exhibit peripheral insulin resistance independent of BMI. Hyperinsulinemia stimulates ovarian theca cells "
            "to hypersecrete androgens and suppresses sex hormone-binding globulin (SHBG) synthesis in the liver, increasing circulating free testosterone. "
            "Acanthosis nigricans (dark velvety skin on neck and armpits) is a physical marker. Management centers on low glycemic index (GI) foods, "
            "adequate protein at each meal, resistance exercise, and myo-inositol or metformin when clinically indicated."
        ),
        source="Endocrine Society Clinical Practice Guideline: PCOS Assessment and Management",
    ),
    KnowledgeEntry(
        id="pcos_nutrition_lifestyle_003",
        category="pcos",
        title="Evidence-Based Nutrition & Exercise for PCOS",
        content=(
            "A modest 5-10% reduction in total body weight in overweight women with PCOS can restore spontaneous ovulatory menstrual cycles by up to 50%. "
            "Dietary strategy: prioritize complex low-GI carbohydrates (millets, sprouted legumes, oats), healthy fats (flaxseed, walnuts, cold-pressed mustard/olive oil), "
            "and cruciferous vegetables. Eliminate refined flour (maida), sugary sodas, and ultra-processed seed oils. Combine 150 min/week moderate aerobic walking "
            "with 2 sessions of progressive resistance training to upregulate GLUT-4 muscle glucose transporters."
        ),
        source="American Society for Reproductive Medicine (ASRM) PCOS Lifestyle Guidelines",
    ),
    KnowledgeEntry(
        id="pcos_fertility_ovulation_004",
        category="pcos",
        title="PCOS Fertility and Ovulation Induction",
        content=(
            "PCOS is the leading cause of anovulatory subfertility, but has an excellent prognosis with tailored medical guidance. First-line medical ovulation "
            "induction is Letrozole (aromatase inhibitor), which achieves higher cumulative live-birth rates and lower multiple-pregnancy rates compared to clomiphene citrate. "
            "Metformin co-treatment enhances ovulation in insulin-resistant patients. Pre-conception optimization of blood glucose (HbA1c < 5.7%) and folic acid is mandatory."
        ),
        source="Cochrane Database of Systematic Reviews: Aromatase Inhibitors for Subfertile Women with PCOS",
    ),

    # ------------------ Postpartum Depression & Maternal Mental Health ------------------
    KnowledgeEntry(
        id="ppd_epds_001",
        category="ppd",
        title="Edinburgh Postnatal Depression Scale (EPDS) Screening",
        content=(
            "The EPDS is a validated 10-item self-administered clinical screening tool assessing depressive symptoms over the past 7 days. "
            "Scoring breakdown: 0-9 indicates mild/unlikely depression (reassurance and community support); 10-12 indicates moderate risk (clinical review, counselling); "
            "13 or higher indicates significant risk for major depressive episode warranting immediate psychiatric and psychological evaluation. "
            "CRITICAL: Any positive score on Question 10 ('The thought of harming myself has occurred to me') mandates urgent psychiatric safety triage regardless of total score."
        ),
        source="Cox et al., British Journal of Psychiatry & American Academy of Pediatrics",
    ),
    KnowledgeEntry(
        id="ppd_blues_vs_depression_002",
        category="ppd",
        title="Baby Blues vs. Postpartum Depression vs. Psychosis",
        content=(
            "Differentiating maternal postpartum mood disorders is critical for safety: "
            "1) Baby Blues: Affects 70-80% of mothers, starts day 3-5 due to acute estrogen/progesterone withdrawal, characterized by tearfulness and emotional lability, resolves spontaneously within 14 days without functional impairment. "
            "2) Postpartum Depression (PPD): Persistent pervasive sadness, guilt, anhedonia, severe anxiety, and difficulty bonding with baby lasting beyond 2 weeks; requires cognitive behavioral therapy (CBT) and/or SSRIs (sertraline is first-line in breastfeeding). "
            "3) Postpartum Psychosis: 1-2 per 1000 births, medical emergency; manifests with auditory hallucinations, delirium, bizarre delusions regarding infant. Requires immediate psychiatric hospitalization."
        ),
        source="National Institute for Health and Care Excellence (NICE) Antenatal and Postnatal Mental Health",
    ),
    KnowledgeEntry(
        id="ppd_caregiver_support_003",
        category="ppd",
        title="Sleep Protection and Caregiver Night Shifts for PPD Prevention",
        content=(
            "Severe sleep fragmentation (< 4 hours continuous sleep) is the single greatest modifiable neurobiological trigger for postpartum mood deterioration. "
            "Caregivers and partners should be assigned dedicated nightly sleep preservation shifts: one caregiver bottle-feeds expressed breast milk or soothes the infant "
            "from 10 PM to 3 AM so the mother achieves 5 hours of continuous restorative slow-wave sleep. Validation of maternal fatigue without judgment accelerates psychological healing."
        ),
        source="Harvard Perinatal Mental Health Clinical Protocols",
    ),

    # ------------------ Maternal Nutrition & Indian Food Guidance ------------------
    KnowledgeEntry(
        id="nutrition_iron_anemia_001",
        category="nutrition",
        title="Maternal Anemia Prevention and Iron Supplementation",
        content=(
            "Maternal anemia (Hemoglobin < 11.0 g/dL in 1st/3rd trimester, < 10.5 g/dL in 2nd trimester) increases risks of preterm birth, low birth weight, and postpartum hemorrhage. "
            "Under India's Anemia Mukt Bharat program, all pregnant women must take 1 tablet daily of Iron Folic Acid (100 mg elemental iron + 500 mcg folic acid) starting from week 14 for 180 days. "
            "Clinical pearl: Take iron with Vitamin C (lemon water, amla juice) on an empty stomach or between meals. NEVER ingest iron with tea, coffee, milk, or calcium supplements, as tannins and calcium inhibit iron absorption by up to 70%."
        ),
        source="Anemia Mukt Bharat Operational Guidelines, Ministry of Health and Family Welfare",
    ),
    KnowledgeEntry(
        id="nutrition_indian_foods_002",
        category="nutrition",
        title="Affordable Local Indian Nutrient-Dense Foods",
        content=(
            "Traditional Indian ingredients provide exceptional maternal micronutrients at low cost: "
            "1) Sprouted Ragi (Finger Millet): Extraordinary plant calcium (344 mg/100g) for fetal skeleton and maternal bone density. "
            "2) Moringa Leaves (Drumstick/Sahjan): Bioavailable plant iron, beta-carotene, vitamin C, and amino acids; ideal in daily dal or sambar. "
            "3) Roasted Bengal Gram (Bhuna Chana) & Jaggery (Gur): Compact iron-dense snack preventing afternoon hypoglycemia. "
            "4) Fresh Plain Curd (Dahi): Live probiotic cultures enhancing gut microbiome integrity, reducing constipation and vaginal dysbiosis. "
            "5) Soaked Fenugreek (Methi) & Sesame Seeds (Til): Natural minerals, fiber, and gentle galactagogue support."
        ),
        source="National Institute of Nutrition (ICMR-NIN) Dietary Guidelines for Indians",
    ),
    KnowledgeEntry(
        id="nutrition_hydration_003",
        category="nutrition",
        title="Maternal Hydration Guidelines in Pregnancy and Lactation",
        content=(
            "A pregnant woman requires at least 2.5 to 3.0 Liters of water daily (approximately 10 to 12 glasses). Adequate hydration supports expanding maternal plasma volume "
            "(which increases by 40-50%), maintains adequate amniotic fluid index (AFI), helps prevent urinary tract infections (UTIs are a leading trigger for preterm uterine contractions), "
            "and alleviates physiological constipation. During lactation, fluid needs increase by an extra 700-1000 mL daily; drink a glass of water every time before breastfeeding."
        ),
        source="ICMR-NIN Recommended Dietary Allowances (RDA) & WHO Maternal Fluid Balance Standards",
    ),

    # ------------------ Menstrual Cycle & Ovulation ------------------
    KnowledgeEntry(
        id="cycle_phases_001",
        category="cycle",
        title="The Normal Menstrual Cycle: Follicular vs. Luteal Phase",
        content=(
            "A normal menstrual cycle spans 21 to 35 days, with 2 to 7 days of flow and 20 to 80 mL blood loss. "
            "1) Follicular Phase (Day 1 to Ovulation): Estrogen rises, rebuilding the endometrial lining; follicle-stimulating hormone (FSH) recruits the dominant follicle. Variable in length. "
            "2) Ovulation: Luteinizing hormone (LH) surge triggers oocyte release 24-36 hours later. Cervical mucus becomes clear, stretchy, and egg-white-like. "
            "3) Luteal Phase (Post-ovulation to Day 28): The corpus luteum secretes progesterone to stabilize endometrium. Fixed duration of 12-14 days. "
            "Tracking basal body temperature (BBT) and cervical mucus identifies the 6-day fertile window (5 days prior to ovulation plus ovulation day)."
        ),
        source="Williams Gynecology 4th Edition & ASRM Reproductive Endocrinology Consensus",
    ),
    KnowledgeEntry(
        id="cycle_abnormal_bleeding_002",
        category="cycle",
        title="Abnormal Uterine Bleeding (AUB) and PALM-COEIN Classification",
        content=(
            "FIGO classifies abnormal uterine bleeding using PALM-COEIN: Structural causes (Polyp, Adenomyosis, Leiomyoma/fibroid, Malignancy) and Non-structural causes "
            "(Coagulopathy, Ovulatory dysfunction e.g. PCOS, Endometrial, Iatrogenic, Not classified). Warning signs needing clinical transvaginal ultrasound: "
            "intermenstrual bleeding, postcoital bleeding, cycles shorter than 21 days or longer than 45 days, or bleeding passing blood clots larger than a coin."
        ),
        source="FIGO Menstrual Disorders Committee (PALM-COEIN Classification System)",
    ),

    # ------------------ Newborn & Kangaroo Mother Care ------------------
    KnowledgeEntry(
        id="newborn_kangaroo_care_001",
        category="newborn",
        title="Kangaroo Mother Care (KMC) for Low Birth Weight and Preterm Infants",
        content=(
            "Kangaroo Mother Care (KMC) is continuous, prolonged skin-to-skin contact between mother (or caregiver) and infant, accompanied by exclusive breastfeeding. "
            "Proven clinical benefits: reduces neonatal mortality by 40%, stabilizes core neonatal temperature (preventing hypothermia), regulates infant heart and respiratory rates, "
            "stimulates maternal oxytocin and prolactin release, enhances weight gain by 3-5 g/day faster, and deepens maternal-infant attachment. "
            "The infant should be positioned upright between maternal breasts, tummy-to-chest, head turned to one side with airway clear."
        ),
        source="WHO Guidelines on Kangaroo Mother Care & Lancet Neonatal Health Series",
    ),
    KnowledgeEntry(
        id="newborn_golden_hour_002",
        category="newborn",
        title="The Golden Hour and Exclusive Breastfeeding",
        content=(
            "Initiating breastfeeding within the first 60 minutes after birth ('The Golden Hour') confers life-saving immunological protection. "
            "The first milk (Colostrum) is thick, golden, rich in secretory Immunoglobulin A (sIgA), lactoferrin, and white blood cells, acting as the baby's first natural vaccine. "
            "Exclusive breastfeeding for 6 months (no additional water, honey, or ghutti) fulfills all nutritional and hydration requirements. "
            "Safe sleep rules: always place the infant on their back (supine) on a firm, flat surface without loose blankets, pillows, or soft bumpers to prevent SIDS."
        ),
        source="UNICEF / WHO Baby-Friendly Hospital Initiative & Indian Academy of Pediatrics (IAP)",
    ),

    # ------------------ ASHA Worker Protocols & Rural Healthcare ------------------
    KnowledgeEntry(
        id="asha_protocols_001",
        category="asha",
        title="ASHA Worker High-Risk Maternal Identification and Referral",
        content=(
            "Accredited Social Health Activists (ASHA) serve as the frontline link in the public healthcare system. Core duties include: "
            "1) Early pregnancy registration within the first trimester (MCP Card issuance), "
            "2) Ensuring at least 4 comprehensive antenatal checkups (PMSMA on the 9th of every month by an MBBS/OBGYN doctor), "
            "3) Identifying high-risk markers (severe anemia Hb < 7 g/dL, teenage pregnancy, twin gestation, previous cesarean, hypertension, malpresentation), "
            "4) Facilitating institutional delivery under Janani Suraksha Yojana (JSY) with subsidized ambulance transport via 108/102."
        ),
        source="National Health Mission (NHM) ASHA Operational Modules 6 & 7",
    ),
    KnowledgeEntry(
        id="asha_home_visits_002",
        category="asha",
        title="Home-Based Postnatal Care (HBPNC) Schedule",
        content=(
            "Under the Home-Based Newborn Care (HBNC) program, the ASHA conducts 6 home visits for institutional deliveries (Days 3, 7, 14, 21, 28, 42) "
            "and 7 visits for home deliveries (Day 1 added). During each visit, ASHA checks: 1) Maternal perineal healing, lochia odor, breast engorgement, "
            "2) Newborn temperature, umbilical cord cleanliness (chlorhexidine application), breathing rate (normal 40-60 breaths/min), feeding vigor, "
            "and skin jaundice. Immediate referral to a Primary Health Centre (PHC) is made for fast breathing (> 60), chest indrawing, or hypothermia."
        ),
        source="Ministry of Health and Family Welfare: Home Based Care for Young Child (HBYC) Guidelines",
    ),

    # ------------------ Mental Wellness & Grounding Techniques ------------------
    KnowledgeEntry(
        id="mental_wellness_grounding_001",
        category="mental_wellness",
        title="Somatic Grounding and The 5-4-3-2-1 Sensory Reset for Perinatal Anxiety",
        content=(
            "Perinatal anxiety and panic spikes can be regulated using somatic grounding techniques: "
            "1) The 5-4-3-2-1 Sensory Exercise: Notice 5 things you can see, 4 things you can physically touch (the soft bedsheet, your feet on the floor), "
            "3 sounds you can hear, 2 things you can smell, and 1 positive affirmation ('I am safe right now, this moment will pass'). "
            "2) Physiological Sigh: Two quick sharp inhales through the nose followed by a long, slow audible exhale through pursed lips stimulates the vagus nerve, "
            "downregulating sympathetic fight-or-flight heart rate spikes within 90 seconds."
        ),
        source="Perinatal Anxiety Protocol, Postpartum Support International (PSI)",
    ),
]


def all_entries() -> list[KnowledgeEntry]:
    return list(KNOWLEDGE_BASE)