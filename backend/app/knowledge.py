from __future__ import annotations


DISCLAIMER = (
    "NeuroDermAI is an educational image-classification tool and not a medical "
    "diagnosis system. Please consult a qualified clinician for any symptoms, "
    "persistent skin changes, pain, or treatment decisions."
)


CLASS_GUIDANCE: dict[str, dict[str, list[str] | str]] = {
    "basal cell carcinoma": {
        "explanation": (
            "Basal cell carcinoma is the most common form of skin cancer. It arises from "
            "the basal cells in the deepest layer of the epidermis and typically appears as "
            "a waxy bump, flat flesh-colored lesion, or brown scar-like area."
        ),
        "precautions": [
            "Protect skin from UV exposure with sunscreen, hats, and protective clothing.",
            "Monitor any new or changing skin growths closely.",
            "Seek dermatological evaluation promptly — early treatment has excellent outcomes.",
        ],
    },
    "darier_s disease": {
        "explanation": (
            "Darier's disease (keratosis follicularis) is a rare genetic skin disorder "
            "causing greasy, warty papules in seborrheic areas such as the chest, back, "
            "forehead, and scalp."
        ),
        "precautions": [
            "Avoid excessive heat, humidity, and sun exposure which can trigger flares.",
            "Use gentle, fragrance-free skincare products.",
            "Consult a dermatologist for management strategies and genetic counseling.",
        ],
    },
    "epidermolysis bullosa pruriginosa": {
        "explanation": (
            "Epidermolysis bullosa pruriginosa is a rare variant of dystrophic epidermolysis "
            "bullosa characterized by intensely itchy blisters and nodular prurigo-like lesions, "
            "often on the shins and forearms."
        ),
        "precautions": [
            "Handle skin gently to minimize trauma and blister formation.",
            "Keep affected areas clean and dressed to prevent infection.",
            "Consult a specialist for wound care management and itch control.",
        ],
    },
    "hailey-hailey disease": {
        "explanation": (
            "Hailey-Hailey disease (familial benign pemphigus) is a genetic skin condition "
            "causing recurrent blisters and erosions in skin folds such as the groin, armpits, "
            "and neck. Friction and sweating often trigger flares."
        ),
        "precautions": [
            "Keep affected areas clean, cool, and dry to reduce friction.",
            "Wear loose-fitting, breathable clothing.",
            "See a dermatologist for topical or systemic treatment options.",
        ],
    },
    "herpes simplex": {
        "explanation": (
            "Herpes simplex virus (HSV) causes painful clusters of small blisters typically "
            "around the lips (cold sores) or genital area. The virus remains dormant and may "
            "reactivate periodically."
        ),
        "precautions": [
            "Avoid direct contact with active lesions to prevent spreading.",
            "Do not share personal items like lip balm, razors, or towels during outbreaks.",
            "Consult a clinician for antiviral treatment to manage and reduce recurrences.",
        ],
    },
    "impetigo": {
        "explanation": (
            "Impetigo is a highly contagious bacterial skin infection common in children. "
            "It presents as red sores that rupture, ooze, and form a honey-colored crust, "
            "usually around the nose and mouth."
        ),
        "precautions": [
            "Keep the infected area clean and covered to prevent spreading.",
            "Wash hands frequently and avoid sharing towels or clothing.",
            "See a doctor for antibiotic treatment — impetigo rarely resolves on its own.",
        ],
    },
    "larva migrans": {
        "explanation": (
            "Cutaneous larva migrans is a parasitic skin infection caused by hookworm larvae "
            "that penetrate the skin, typically from walking barefoot on contaminated sand or soil. "
            "It presents as intensely itchy, winding, raised tracks."
        ),
        "precautions": [
            "Wear shoes on beaches and sandy areas, especially in tropical regions.",
            "Avoid sitting or lying on bare sand or soil in endemic areas.",
            "See a doctor for antiparasitic treatment to resolve the infection.",
        ],
    },
    "leprosy borderline": {
        "explanation": (
            "Borderline leprosy is an intermediate form of Hansen's disease caused by "
            "Mycobacterium leprae. It presents with skin patches that are neither fully "
            "tuberculoid nor lepromatous and may shift in either direction."
        ),
        "precautions": [
            "Seek medical attention immediately if you notice numb skin patches or nerve thickening.",
            "Multidrug therapy (MDT) is highly effective and available free through health programs.",
            "Early treatment prevents disability and transmission.",
        ],
    },
    "leprosy lepromatous": {
        "explanation": (
            "Lepromatous leprosy is the most severe form of Hansen's disease, characterized by "
            "widespread skin nodules, thickened dermis, and nerve involvement. It has a high "
            "bacterial load and is more contagious than other forms."
        ),
        "precautions": [
            "Start multidrug therapy (MDT) as soon as possible under medical supervision.",
            "Regular monitoring is essential to detect and manage nerve damage early.",
            "Leprosy is curable — consult a healthcare provider without delay.",
        ],
    },
    "leprosy tuberculoid": {
        "explanation": (
            "Tuberculoid leprosy is a milder form of Hansen's disease characterized by a few "
            "well-defined, hypopigmented, and anesthetic (numb) skin patches. Nerve involvement "
            "may cause localized muscle weakness."
        ),
        "precautions": [
            "Early treatment with multidrug therapy (MDT) leads to full recovery.",
            "Protect numb areas from injury and burns, as sensation is reduced.",
            "Consult a healthcare provider for diagnosis and treatment as soon as possible.",
        ],
    },
    "lichen planus": {
        "explanation": (
            "Lichen planus is an inflammatory condition that causes purplish, flat-topped, "
            "itchy bumps on the skin. It can also affect the nails, scalp, and mucous membranes "
            "(mouth and genitals)."
        ),
        "precautions": [
            "Avoid scratching affected areas to prevent worsening.",
            "Use gentle, fragrance-free products on the skin.",
            "See a dermatologist for treatment — topical corticosteroids may help.",
        ],
    },
    "lupus erythematosus chronicus discoides": {
        "explanation": (
            "Discoid lupus erythematosus (DLE) is a chronic autoimmune skin condition that "
            "causes coin-shaped, scaly, red patches often on the face, ears, and scalp. "
            "It can lead to scarring and pigment changes."
        ),
        "precautions": [
            "Protect skin rigorously from sun and UV exposure — sunlight triggers flares.",
            "Apply broad-spectrum sunscreen daily even on cloudy days.",
            "Consult a rheumatologist or dermatologist for diagnosis and monitoring.",
        ],
    },
    "melanoma": {
        "explanation": (
            "Melanoma is a serious form of skin cancer that begins in melanocytes (pigment-producing "
            "cells). It often resembles a mole or develops from an existing mole and can spread "
            "rapidly if not detected early."
        ),
        "precautions": [
            "Monitor moles for the ABCDEs: Asymmetry, Border irregularity, Color changes, Diameter >6mm, Evolving.",
            "Protect skin with sunscreen, clothing, and shade, especially during peak UV hours.",
            "IMMEDIATELY consult a dermatologist if a mole is changing, bleeding, or looks unusual.",
        ],
    },
    "molluscum contagiosum": {
        "explanation": (
            "Molluscum contagiosum is a viral skin infection that produces small, firm, painless "
            "bumps with a central dimple. It spreads through skin-to-skin contact and shared objects. "
            "It is common in children."
        ),
        "precautions": [
            "Avoid scratching or picking at bumps, as this spreads the virus.",
            "Do not share towels, clothing, or personal items.",
            "See a clinician if bumps are widespread, inflamed, or in sensitive areas.",
        ],
    },
    "mycosis fungoides": {
        "explanation": (
            "Mycosis fungoides is the most common type of cutaneous T-cell lymphoma, a cancer "
            "of the immune system that first appears in the skin. It progresses slowly through "
            "patch, plaque, and tumor stages."
        ),
        "precautions": [
            "Monitor any persistent, unexplained rashes that do not respond to typical treatments.",
            "A biopsy is often required for definitive diagnosis.",
            "Consult an oncologist or dermatologist specializing in cutaneous lymphoma.",
        ],
    },
    "neurofibromatosis": {
        "explanation": (
            "Neurofibromatosis is a group of genetic disorders causing tumors to form on nerve tissue. "
            "NF1 presents with café-au-lait spots, freckling in skin folds, and neurofibromas "
            "(soft bumps on or under the skin)."
        ),
        "precautions": [
            "Regular medical check-ups are essential to monitor for complications.",
            "Watch for rapid growth of neurofibromas, vision changes, or new symptoms.",
            "Consult a geneticist or specialist clinic for comprehensive management.",
        ],
    },
    "papilomatosis confluentes and reticulate": {
        "explanation": (
            "Confluent and reticulated papillomatosis (Gougerot-Carteaud syndrome) is a skin "
            "disorder presenting as brownish, scaly papules that merge into patches, typically "
            "on the chest, back, and neck."
        ),
        "precautions": [
            "The condition is benign but cosmetically distressing — treatment can help.",
            "Antibiotics (like minocycline) are often effective under medical supervision.",
            "Consult a dermatologist to differentiate from tinea versicolor or other conditions.",
        ],
    },
    "pediculosis capitis": {
        "explanation": (
            "Pediculosis capitis (head lice) is an infestation of the scalp by the human head "
            "louse. It causes intense itching, especially behind the ears and at the nape of the "
            "neck. Nits (eggs) are found attached to hair shafts."
        ),
        "precautions": [
            "Use a fine-toothed nit comb and approved pediculicide treatment.",
            "Wash bedding, clothing, and personal items in hot water.",
            "Check and treat all close contacts to prevent re-infestation.",
        ],
    },
    "pityriasis rosea": {
        "explanation": (
            "Pityriasis rosea is a common, self-limiting skin rash that begins with a single "
            "'herald patch' followed by smaller oval patches in a 'Christmas tree' pattern on "
            "the trunk. It typically resolves in 6–8 weeks."
        ),
        "precautions": [
            "The condition usually resolves on its own without treatment.",
            "Use moisturizers and antihistamines to manage itching.",
            "See a doctor if the rash persists beyond 8 weeks or is severely symptomatic.",
        ],
    },
    "porokeratosis actinic": {
        "explanation": (
            "Disseminated superficial actinic porokeratosis (DSAP) presents as multiple small, "
            "ring-shaped lesions with a raised thread-like border on sun-exposed skin. It is "
            "related to chronic UV exposure."
        ),
        "precautions": [
            "Use sun protection consistently to prevent new lesions.",
            "Monitor existing lesions for changes, as rare malignant transformation can occur.",
            "Consult a dermatologist for treatment options and regular skin checks.",
        ],
    },
    "psoriasis": {
        "explanation": (
            "Psoriasis is a chronic autoimmune condition that causes sharply defined, thick, "
            "scaly plaques on the skin. It most commonly affects the elbows, knees, scalp, "
            "and lower back."
        ),
        "precautions": [
            "Keep skin moisturized and avoid picking off scales.",
            "Track possible triggers such as stress, skin injury, or illness.",
            "See a dermatologist if plaques are spreading, painful, or affecting daily life.",
        ],
    },
    "tinea corporis": {
        "explanation": (
            "Tinea corporis (ringworm) is a fungal skin infection that presents as ring-shaped, "
            "red, scaly patches with a clear center. It spreads through direct contact with "
            "infected people, animals, or contaminated objects."
        ),
        "precautions": [
            "Keep the area clean and dry; avoid sharing towels or clothing.",
            "Change out of sweaty clothing promptly.",
            "See a doctor if the rash is spreading, painful, or involving nails or scalp.",
        ],
    },
    "tinea nigra": {
        "explanation": (
            "Tinea nigra is a superficial fungal infection that causes painless, dark brown or "
            "black patches on the palms or soles. It is caused by the fungus Hortaea werneckii "
            "and is found mainly in tropical climates."
        ),
        "precautions": [
            "The condition is benign and easily treatable with topical antifungals.",
            "Important to differentiate from melanoma — consult a dermatologist for proper diagnosis.",
            "Practice good hand hygiene, especially after soil contact in tropical areas.",
        ],
    },
    "tungiasis": {
        "explanation": (
            "Tungiasis is a parasitic skin disease caused by the sand flea (Tunga penetrans) "
            "burrowing into the skin, usually affecting the feet. It presents as painful, "
            "whitish nodules with a central black dot."
        ),
        "precautions": [
            "Wear closed shoes in endemic sandy areas to prevent infection.",
            "Do not attempt to remove the flea yourself — seek medical help for sterile extraction.",
            "Treatment involves sterile removal of the flea and tetanus prophylaxis.",
        ],
    },
    "actinic keratosis": {
        "explanation": (
            "Actinic keratosis (solar keratosis) is a rough, scaly patch on the skin caused "
            "by years of sun exposure. It is considered precancerous and may progress to "
            "squamous cell carcinoma if left untreated."
        ),
        "precautions": [
            "Apply broad-spectrum sunscreen daily and wear protective clothing.",
            "Do not ignore rough, persistent patches on sun-exposed skin.",
            "See a dermatologist for evaluation and treatment — early removal is simple and effective.",
        ],
    },
    "dermatofibroma": {
        "explanation": (
            "Dermatofibroma is a common, benign skin growth that typically appears as a firm, "
            "brownish bump on the legs. It may result from minor injuries like insect bites "
            "or shaving nicks."
        ),
        "precautions": [
            "Dermatofibromas are harmless and usually require no treatment.",
            "See a doctor if the bump changes color, shape, or size rapidly.",
            "Surgical removal is an option if the growth is bothersome or cosmetically concerning.",
        ],
    },
    "nevus": {
        "explanation": (
            "A nevus (mole) is a common benign growth of melanocytes that appears as a brown "
            "or pink spot on the skin. Most people have 10–40 moles. While usually harmless, "
            "some moles may develop into melanoma."
        ),
        "precautions": [
            "Monitor moles for changes in size, shape, color, or texture.",
            "Use the ABCDE rule: Asymmetry, Border, Color, Diameter, Evolving.",
            "Have a dermatologist check any mole that looks different from the others.",
        ],
    },
    "pigmented benign keratosis": {
        "explanation": (
            "Pigmented benign keratosis (solar lentigo or seborrheic keratosis-like lesion) is "
            "a non-cancerous skin growth that appears as a brown, flat or slightly raised spot. "
            "It is caused by sun exposure and aging."
        ),
        "precautions": [
            "The lesion is benign and typically does not require treatment.",
            "Use sunscreen to prevent new lesions from developing.",
            "Consult a dermatologist if the spot changes, bleeds, or looks unusual.",
        ],
    },
    "seborrheic keratosis": {
        "explanation": (
            "Seborrheic keratoses are very common, non-cancerous skin growths that appear as "
            "waxy, stuck-on looking brown, black, or tan bumps. They increase in number with "
            "age and are harmless."
        ),
        "precautions": [
            "No treatment is necessary unless growths are irritated or cosmetically bothersome.",
            "Avoid picking or scratching at the growths.",
            "See a dermatologist if you're unsure whether a growth is a seborrheic keratosis or something else.",
        ],
    },
    "squamous cell carcinoma": {
        "explanation": (
            "Squamous cell carcinoma (SCC) is the second most common form of skin cancer. "
            "It typically appears as a firm, red nodule or a flat lesion with a scaly, crusted "
            "surface on sun-exposed areas."
        ),
        "precautions": [
            "Protect skin from UV radiation with sunscreen, hats, and protective clothing.",
            "Inspect skin regularly for new or changing lesions, especially on sun-exposed areas.",
            "Seek immediate dermatological evaluation — early treatment prevents spread.",
        ],
    },
    "vascular lesion": {
        "explanation": (
            "Vascular lesions include a range of conditions involving blood vessels in the skin, "
            "such as hemangiomas, port-wine stains, and cherry angiomas. They may appear as red, "
            "blue, or purple spots or bumps."
        ),
        "precautions": [
            "Most vascular lesions are benign and may not require treatment.",
            "Seek evaluation if a lesion bleeds frequently, grows rapidly, or changes appearance.",
            "Treatment options include laser therapy — consult a dermatologist for assessment.",
        ],
    },
}


def get_guidance(label: str) -> dict[str, list[str] | str]:
    normalized = label.lower().strip()
    if normalized in CLASS_GUIDANCE:
        return CLASS_GUIDANCE[normalized]

    return {
        "explanation": (
            "The model detected a skin pattern in this image, but no tailored educational "
            "guidance is configured for that label."
        ),
        "precautions": [
            "Retake the image with better lighting if the result seems unclear.",
            "Consult a qualified clinician for any persistent or worsening symptoms.",
        ],
    }
