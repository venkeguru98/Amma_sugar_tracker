// South Indian Diabetic-friendly Food Recommendations Database & Engine
// Based on calendar day-of-week index (0: Sunday, 1: Monday, ..., 6: Saturday)

export interface Meal {
  nameEn: string;
  nameTa: string;
  itemsEn: string;
  itemsTa: string;
}

export interface DayPlan {
  breakfast: Meal;
  midMorning: Meal;
  lunch: Meal;
  snack: Meal;
  dinner: Meal;
}

export const weeklyMeals: Record<number, DayPlan> = {
  // Monday
  1: {
    breakfast: {
      nameEn: "Breakfast",
      nameTa: "காலை உணவு",
      itemsEn: "2 Ragi Dosa, Mint Chutney, 1 Boiled Egg",
      itemsTa: "2 கேழ்வரகு (ராகி) தோசை, புதினா சட்னி, 1 அவித்த முட்டை"
    },
    midMorning: {
      nameEn: "Mid-Morning",
      nameTa: "முற்பகல் உணவு",
      itemsEn: "Fresh Guava (1 slice)",
      itemsTa: "பச்சை கொய்யாப்பழம் (1 துண்டு)"
    },
    lunch: {
      nameEn: "Lunch",
      nameTa: "மதிய உணவு",
      itemsEn: "Brown Rice (1 small cup), Sambar, Beans Poriyal, Cucumber Salad, Curd",
      itemsTa: "கைக்குத்தல் அரிசி சாதம் (1 சிறிய கிண்ணம்), சாம்பார், பீன்ஸ் பொரியல், வெள்ளரி சாலட், தயிர்"
    },
    snack: {
      nameEn: "Evening Snack",
      nameTa: "மாலை சிற்றுண்டி",
      itemsEn: "Roasted Chana (1 handful), Green Tea (unsweetened)",
      itemsTa: "வறுத்த கொண்டைக்கடலை (ஒரு கைப்பிடி), சர்க்கரை இல்லாத பச்சை தேநீர் (கிரீன் டீ)"
    },
    dinner: {
      nameEn: "Dinner",
      nameTa: "இரவு உணவு",
      itemsEn: "Vegetable Oats Upma",
      itemsTa: "காய்கறி ஓட்ஸ் உப்புமா"
    }
  },
  // Tuesday
  2: {
    breakfast: {
      nameEn: "Breakfast",
      nameTa: "காலை உணவு",
      itemsEn: "Foxtail Millet Pongal (Thinai), Sambar",
      itemsTa: "தினை பொங்கல், சாம்பார்"
    },
    midMorning: {
      nameEn: "Mid-Morning",
      nameTa: "முற்பகல் உணவு",
      itemsEn: "Apple (1 small)",
      itemsTa: "ஆப்பிள் (1 சிறியது)"
    },
    lunch: {
      nameEn: "Lunch",
      nameTa: "மதிய உணவு",
      itemsEn: "Red Rice (1 small cup), Keerai (Spinach), Rasam, Cabbage Poriyal",
      itemsTa: "சிவப்பு அரிசி சாதம் (1 சிறிய கிண்ணம்), கீரை கடையல், ரசம், முட்டைக்கோஸ் பொரியல்"
    },
    snack: {
      nameEn: "Evening Snack",
      nameTa: "மாலை சிற்றுண்டி",
      itemsEn: "Boiled Groundnuts (boiled peanuts)",
      itemsTa: "அவித்த நிலக்கடலை"
    },
    dinner: {
      nameEn: "Dinner",
      nameTa: "இரவு உணவு",
      itemsEn: "1 Wheat Chapati, Vegetable Kurma",
      itemsTa: "1 கோதுமை சப்பாத்தி, காய்கறி குருமா"
    }
  },
  // Wednesday
  3: {
    breakfast: {
      nameEn: "Breakfast",
      nameTa: "காலை உணவு",
      itemsEn: "Kambu Koozh (Pearl Millet Porridge) with buttermilk",
      itemsTa: "கம்பங்கூழ் (மோர் கலந்தது)"
    },
    midMorning: {
      nameEn: "Mid-Morning",
      nameTa: "முற்பகல் உணவு",
      itemsEn: "Orange (1 small)",
      itemsTa: "ஆரஞ்சு பழம் (1 சிறியது)"
    },
    lunch: {
      nameEn: "Lunch",
      nameTa: "மதிய உணவு",
      itemsEn: "Little Millet Rice (Samai) (1 small cup), Sambar, Snake Gourd Poriyal (Pudalangai)",
      itemsTa: "சாமை அரிசி சாதம் (1 சிறிய கிண்ணம்), பருப்பு சாம்பார், புடலங்காய் பொரியல்"
    },
    snack: {
      nameEn: "Evening Snack",
      nameTa: "மாலை சிற்றுண்டி",
      itemsEn: "Boiled Green Gram Sprouts",
      itemsTa: "முளைகட்டிய பச்சைப்பயறு சாலட்"
    },
    dinner: {
      nameEn: "Dinner",
      nameTa: "இரவு உணவு",
      itemsEn: "1 Ragi Roti, Vegetable Curry",
      itemsTa: "1 கேழ்வரகு (ராகி) ரொட்டி, காய்கறி கூட்டு"
    }
  },
  // Thursday
  4: {
    breakfast: {
      nameEn: "Breakfast",
      nameTa: "காலை உணவு",
      itemsEn: "2 Oats Idli, Mint/Coriander Chutney",
      itemsTa: "2 ஓட்ஸ் இட்லி, புதினா/கொத்தமல்லி சட்னி"
    },
    midMorning: {
      nameEn: "Mid-Morning",
      nameTa: "முற்பகல் உணவு",
      itemsEn: "Fresh Papaya (1 slice)",
      itemsTa: "பப்பாளி பழம் (1 துண்டு)"
    },
    lunch: {
      nameEn: "Lunch",
      nameTa: "மதிய உணவு",
      itemsEn: "Millet Bisi Bele Bath (1 small cup), Cucumber Raita",
      itemsTa: "சிறு தானிய பிசிபெலாபாத் (1 சிறிய கிண்ணம்), வெள்ளரி தயிர் பச்சடி"
    },
    snack: {
      nameEn: "Evening Snack",
      nameTa: "மாலை சிற்றுண்டி",
      itemsEn: "Spiced Puffed Rice (Pori) with roasted gram",
      itemsTa: "மசாலா பொரி (பொட்டுக்கடலை கலந்தது)"
    },
    dinner: {
      nameEn: "Dinner",
      nameTa: "இரவு உணவு",
      itemsEn: "Godhumai (Wheat) Rava Upma, Tomato Chutney",
      itemsTa: "கோதுமை ரவை உப்புமா, தக்காளி சட்னி"
    }
  },
  // Friday
  5: {
    breakfast: {
      nameEn: "Breakfast",
      nameTa: "காலை உணவு",
      itemsEn: "1 Multi-lentil Adai (Lentil Dosa), Avial (mixed vegetables)",
      itemsTa: "1 பருப்பு அடை, அவியல் (காய்கறிகள் கலவை)"
    },
    midMorning: {
      nameEn: "Mid-Morning",
      nameTa: "முற்பகல் உணவு",
      itemsEn: "Pomegranate Seeds (1/2 cup)",
      itemsTa: "மாதுளை முத்துக்கள் (அரை கிண்ணம்)"
    },
    lunch: {
      nameEn: "Lunch",
      nameTa: "மதிய உணவு",
      itemsEn: "Brown Rice (1 small cup), Mor Kuzhambu (buttermilk curry), Beetroot Poriyal",
      itemsTa: "கைக்குத்தல் அரிசி சாதம் (1 சிறிய கிண்ணம்), மோர் குழம்பு, பீட்ரூட் பொரியல்"
    },
    snack: {
      nameEn: "Evening Snack",
      nameTa: "மாலை சிற்றுண்டி",
      itemsEn: "Boiled Chickpea Sundal (Kondakadalai)",
      itemsTa: "அவித்த மூக்கடலை (கொண்டைக்கடலை) சுண்டல்"
    },
    dinner: {
      nameEn: "Dinner",
      nameTa: "இரவு உணவு",
      itemsEn: "Pearl Millet (Kambu) Khichdi with vegetables",
      itemsTa: "கம்பு காய்கறி கிச்சடி"
    }
  },
  // Saturday
  6: {
    breakfast: {
      nameEn: "Breakfast",
      nameTa: "காலை உணவு",
      itemsEn: "Wheat Dalia Pongal (Broken wheat), Sambar",
      itemsTa: "கோதுமை ரவை பொங்கல், சாம்பார்"
    },
    midMorning: {
      nameEn: "Mid-Morning",
      nameTa: "முற்பகல் உணவு",
      itemsEn: "Fresh Guava (1 slice)",
      itemsTa: "பச்சை கொய்யாப்பழம் (1 துண்டு)"
    },
    lunch: {
      nameEn: "Lunch",
      nameTa: "மதிய உணவு",
      itemsEn: "Red Rice (1 small cup), Tomato Rasam, Ladies Finger Poriyal (Vendakkai)",
      itemsTa: "சிவப்பு அரிசி சாதம் (1 சிறிய கிண்ணம்), தக்காளி ரசம், வெண்டைக்காய் பொரியல்"
    },
    snack: {
      nameEn: "Evening Snack",
      nameTa: "மாலை சிற்றுண்டி",
      itemsEn: "Roasted Almonds (6-8 pieces)",
      itemsTa: "வறுத்த பாதாம் பருப்பு (6-8 துண்டுகள்)"
    },
    dinner: {
      nameEn: "Dinner",
      nameTa: "இரவு உணவு",
      itemsEn: "1 Multigrain Chapati, Dal Tadka",
      itemsTa: "1 மல்டிகிரைன் சப்பாத்தி, பருப்பு கடையல்"
    }
  },
  // Sunday
  0: {
    breakfast: {
      nameEn: "Breakfast",
      nameTa: "காலை உணவு",
      itemsEn: "Ragi Idiyappam (Steamed string hoppers), unsweetened coconut milk",
      itemsTa: "கேழ்வரகு (ராகி) இடியாப்பம், சர்க்கரை இல்லாத தேங்காய் பால்"
    },
    midMorning: {
      nameEn: "Mid-Morning",
      nameTa: "முற்பகல் உணவு",
      itemsEn: "Apple (1 small)",
      itemsTa: "ஆப்பிள் (1 சிறியது)"
    },
    lunch: {
      nameEn: "Lunch",
      nameTa: "மதிய உணவு",
      itemsEn: "Millet Vegetable Biryani, Onion Cucumber Raita",
      itemsTa: "தானிய காய்கறி பிரியாணி, வெங்காய வெள்ளரி தயிர் பச்சடி"
    },
    snack: {
      nameEn: "Evening Snack",
      nameTa: "மாலை சிற்றுண்டி",
      itemsEn: "Roasted Makhana (Lotus seeds) (1 cup)",
      itemsTa: "வறுத்த தாமரை விதை (மக்கானா) (1 கிண்ணம்)"
    },
    dinner: {
      nameEn: "Dinner",
      nameTa: "இரவு உணவு",
      itemsEn: "Warm Vegetable Soup, 1 Wheat Chapati",
      itemsTa: "சூடான காய்கறி சூப், 1 கோதுமை சப்பாத்தி"
    }
  }
};

// Daily Rotating Health Tips
export const healthTipsEn = [
  "Drink 2–2.5 liters of water today to stay hydrated and flush excess glucose.",
  "Take a gentle 15-minute walk after dinner to help lower bedtime sugar levels.",
  "Never skip breakfast! A healthy breakfast helps stabilize blood glucose all day.",
  "Eat slowly. Chewing your food thoroughly improves digestion and glucose release.",
  "Check and record your blood sugar before breakfast for an accurate fasting count.",
  "Ensure you sleep for at least 7 hours tonight; proper sleep reduces insulin resistance.",
  "Prefer eating whole fruits rather than drinking fruit juices to avoid sugar spikes.",
  "Include fiber-rich vegetables like cabbage, beans, or spinach in your lunch."
];

export const healthTipsTa = [
  "உடலில் நீர்ச்சத்தை தக்கவைக்கவும், அதிகப்படியான சர்க்கரையை வெளியேற்றவும் இன்று 2-2.5 லிட்டர் தண்ணீர் அருந்துங்கள்.",
  "இரவு உணவிற்கு பின் 15 நிமிடங்கள் மெதுவாக நடப்பது படுக்கை நேர சர்க்கரை அளவை குறைக்க உதவும்.",
  "காலை உணவை ஒருபோதும் தவிர்க்க வேண்டாம்! ஆரோக்கியமான காலை உணவு நாள் முழுவதும் சர்க்கரை அளவை சீராக வைக்கிறது.",
  "உணவை மெதுவாகவும், நன்றாக மென்றும் சாப்பிடுங்கள். இது செரிமானத்திற்கும் சர்க்கரை சீராக கலப்பதற்கும் உதவும்.",
  "காலை உணவிற்கு முன் சர்க்கரை அளவை பரிசோதித்து பதிவு செய்யுங்கள் (வெறும் வயிற்று அளவு).",
  "இன்று இரவு குறைந்தது 7 மணிநேரம் தூங்குவதை உறுதிசெய்யுங்கள்; நல்ல தூக்கம் இன்சுலின் எதிர்ப்பைக் குறைக்கிறது.",
  "பழச்சாறுகளை குடிப்பதைத் தவிர்த்து, சர்க்கரை திடீரென அதிகரிப்பதை தடுக்க பழங்களை அப்படியே சாப்பிடுங்கள்.",
  "மதிய உணவில் முட்டைக்கோஸ், பீன்ஸ் அல்லது கீரை போன்ற நார்சத்து மிகுந்த காயறிகளைச் சேர்த்துக் கொள்ளுங்கள்."
];

// Daily Rotating Motivational Messages
export const motivationsEn = [
  "Every healthy choice counts. You are doing great!",
  "Great job, Amma! You checked your sugar today.",
  "Keep going Amma! Every small step leads to better health.",
  "Small steps lead to better health. You are doing well!",
  "Your health is your greatest wealth. We are proud of you!"
];

export const motivationsTa = [
  "ஒவ்வொரு ஆரோக்கியமான தேர்வும் முக்கியமானது. நீங்கள் மிகச் சிறப்பாகச் செய்கிறீர்கள்!",
  "அருமை அம்மா! இன்று உங்கள் சர்க்கரை அளவைச் சோதித்துவிட்டீர்கள். 👍",
  "தொடர்ந்து செல்லுங்கள் அம்மா! உங்கள் ஆரோக்கியமான பயணத்தில் நாங்கள் உங்களை ஆதரிக்கிறோம். ❤️",
  "சிறிய அடிகள் சிறந்த ஆரோக்கியத்திற்கு வழிவகுக்கும். நீங்கள் சரியான பாதையில் செல்கிறீர்கள்!",
  "உங்கள் ஆரோக்கியமே உங்கள் மிகப்பெரிய செல்வம். உங்களை நினைத்து பெருமை கொள்கிறோம்!"
];

// Dynamic Portion Adjuster Engine
export interface AdjustedPlan {
  breakfast: string;
  midMorning: string;
  lunch: string;
  snack: string;
  dinner: string;
  tip: string;
  motivate: string;
  statusText: string;
  statusColor: string;
}

export const getAdjustedFoodPlan = (
  sugarLevel: number,
  targetMin: number,
  targetMax: number,
  lang: string
): AdjustedPlan => {
  const isTa = lang.startsWith('ta');
  const dayOfWeek = new Date().getDay();
  const basePlan = weeklyMeals[dayOfWeek] || weeklyMeals[1]; // default to Monday if err

  // Get date-based indices for tips and motivation
  const dateNum = new Date().getDate();
  const tipIndex = dateNum % healthTipsEn.length;
  const tip = isTa ? healthTipsTa[tipIndex] : healthTipsEn[tipIndex];

  const motIndex = dateNum % motivationsEn.length;
  const motivate = isTa ? motivationsTa[motIndex] : motivationsEn[motIndex];

  const plan: AdjustedPlan = {
    breakfast: isTa ? basePlan.breakfast.itemsTa : basePlan.breakfast.itemsEn,
    midMorning: isTa ? basePlan.midMorning.itemsTa : basePlan.midMorning.itemsEn,
    lunch: isTa ? basePlan.lunch.itemsTa : basePlan.lunch.itemsEn,
    snack: isTa ? basePlan.snack.itemsTa : basePlan.snack.itemsEn,
    dinner: isTa ? basePlan.dinner.itemsTa : basePlan.dinner.itemsEn,
    tip,
    motivate,
    statusText: "",
    statusColor: ""
  };

  // 🟢 Normal
  if (sugarLevel < targetMin) {
    // Low sugar warning and adjustments
    plan.statusText = isTa ? "குறைவு (Low)" : "Low";
    plan.statusColor = "text-rose-500 bg-rose-50 dark:bg-rose-950/20";
    
    if (isTa) {
      plan.breakfast += " (+ உடனே 1/2 கிளாஸ் பழச்சாறு அல்லது 1 ஸ்பூன் தேன் அருந்தவும்)";
      plan.tip = "சர்க்கரை குறைவாக உள்ளதால் உடனே சர்க்கரை அல்லது குளுக்கோஸ் சாப்பிட்டு ஓய்வெடுங்கள். 🥤";
    } else {
      plan.breakfast += " (+ Take 1/2 cup fruit juice or 1 spoonful of honey immediately)";
      plan.tip = "Your sugar is low. Take glucose or sweet immediately and rest. 🥤";
    }
  } else if (sugarLevel <= targetMax) {
    plan.statusText = isTa ? "இயல்பு (Normal)" : "Normal";
    plan.statusColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
    
    if (isTa) {
      plan.tip = "உங்களது சர்க்கரை அளவு சாதாரணமாக உள்ளது. இந்த சமச்சீர் உணவுப் பட்டியலை அப்படியே தொடரலாம்! 👍";
    } else {
      plan.tip = "Your glucose is within target. You can follow this balanced maintenance meal plan directly! 👍";
    }
  } 
  // 🟡 Slightly High
  else if (sugarLevel <= targetMax + 40) {
    plan.statusText = isTa ? "சற்று அதிகம் (Slightly High)" : "Slightly High";
    plan.statusColor = "text-amber-500 bg-amber-50 dark:bg-amber-950/20";
    
    if (isTa) {
      plan.breakfast = plan.breakfast.replace("2 ", "1 ").replace("2", "1") + " (மாவுகளின் அளவை பாதியாக குறைத்து, வேகவைத்த காய்கறி கூட்டுடன் சாப்பிடவும்)";
      plan.lunch = plan.lunch.replace("சாதம்", "சாதம் பாதியளவு") + " (சாதத்தைக் குறைத்து, காய்கறி பொறியலின் அளவை இரட்டிப்பாக்கவும்)";
      plan.dinner += " (மாவுச்சத்தை குறைக்க முட்டைக்கோஸ் அல்லது கீரை அதிகம் சேர்க்கவும்)";
      plan.tip = "சர்க்கரை சற்று அதிகமாக உள்ளது. மதிய உணவில் சாதத்தை குறைத்து காயறிகளை அதிகம் சேர்த்துக்கொள்ளவும். 🚶‍♀️";
    } else {
      plan.breakfast = plan.breakfast.replace("2 ", "1 ").replace("2", "1") + " (Reduce carb portions by half, prefer extra vegetable side dish)";
      plan.lunch = plan.lunch.replace("Rice", "Half-portion Rice") + " (Reduce rice and double the vegetable sides)";
      plan.dinner += " (Add extra leafy greens/veggies to lower carbohydrate density)";
      plan.tip = "Glucose is slightly high. Reduce rice portion size and add extra vegetables. 🚶‍♀️";
    }
  } 
  // 🟠 High & 🔴 Very High
  else {
    const isCritical = sugarLevel > 240;
    plan.statusText = isCritical 
      ? (isTa ? "அபாயம் (Critical High)" : "Critical High")
      : (isTa ? "அதிகம் (High)" : "High");
    plan.statusColor = "text-rose-600 bg-rose-50 dark:bg-rose-955/20 border-rose-200";

    if (isCritical) {
      if (isTa) {
        plan.breakfast = "வெதுவெதுப்பான பார்லி கஞ்சி அல்லது காய்கறி சூப் (Thin Barley Gruel / Vegetable Soup)";
        plan.lunch = "வேகவைத்த தக்காளி, வெள்ளரி மற்றும் கீரை சூப் (Dal Broth with Steamed Greens)";
        plan.dinner = "சூடான முட்டைக்கோஸ் சூப் அல்லது பார்லி கஞ்சி";
        plan.tip = "⚠️ சர்க்கரை அளவு மிகவும் அதிகமாக உள்ளது. தயவுசெய்து உங்கள் மருந்து மாத்திரைகளைச் சரிபார்த்து, தாராளமாகத் தண்ணீர் அருந்தி, மருத்துவரிடம் ஆலோசிக்கவும். 📞";
      } else {
        plan.breakfast = "Thin Barley Gruel or Mixed Vegetable Soup";
        plan.lunch = "Warm Steamed Vegetables & Lentil Clear Broth";
        plan.dinner = "Cabbage Soup or Barley Gruel";
        plan.tip = "⚠️ Glucose is critically high. Please check your medicines, drink plenty of water, rest, and contact your doctor immediately. 📞";
      }
    } else {
      // High
      if (isTa) {
        plan.breakfast = "1 கேழ்வரகு அடை அல்லது சிறுதானிய உப்புமா (சிறிய அளவு)";
        plan.lunch = "சிறுதானிய பொங்கல் அல்லது முளைகட்டிய பச்சைப்பயறு சாலட் (அரிசி சாதத்தை முற்றிலும் தவிர்க்கவும்)";
        plan.dinner = "காய்கறி சூப் மற்றும் 1 சப்பாத்தி";
        plan.tip = "சர்க்கரை அதிகமாக உள்ளது. அரிசி சாதத்தைத் தவிர்த்து, சிறுதானியம் மற்றும் வேகவைத்த காய்கறிகளைச் சேர்த்துக் கொள்ளவும். 🥤";
      } else {
        plan.breakfast = "1 Ragi Roti or Oats porridge (no rice/dosa)";
        plan.lunch = "Millet-based meal or Sprouts salad (Avoid white/red rice completely today)";
        plan.dinner = "Warm Vegetable Soup and 1 Chapati";
        plan.tip = "Glucose is high. Avoid white rice completely today, prefer millets and green leafy vegetables. 🥤";
      }
    }
  }

  return plan;
};
