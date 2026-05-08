export interface Service {
  slug: string;
  title: string;
  bannerImage: string;
  images: string[];
  content: string;
  benefits?: string[];
  sessions?: { durationNumber: string; durationUnit: string; sessionText: string }[];
}

export const services: Service[] = [
  {
    "slug": "personal-training",
    "title": "Personal Training",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/personal-training-2.jpg",
      "/images/services/personal-training-3.jpg",
      "/images/enquire-now.png"
    ],
    "content": "Personal fitness training is one on one health and fitness private training. Primarily it’s to motivate, educate and coach the client to achieving results and attaining their personal fitness goals. Each training session is designed specifically for the client and their fitness goals, which makes it so effective. With Personal Training there’s guidance and reassurance that you are performing the exercises with correct technique, without the risk of injury.\n\nFrom one training session to the next, you will be challenged at the right intensity for you with the appropriate training methods to keep you progressing in every session. Each training session lasts an hour and you will be guided from warm up, all the way through to stretching.",
    "benefits": [
      "Individual expert advice",
      "Safe, suitable & specific programming",
      "Motivation & accountability",
      "Fresh ideas & inspiration",
      "Efficiency",
      "Support",
      "Results"
    ],
    "sessions": []
  },
  {
    "slug": "general-fitness",
    "title": "General Fitness",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/general-fitness-2.jpg",
      "/images/services/general-fitness-3.jpg",
      "/images/enquire-now.png"
    ],
    "content": "<b>General fitness training</b> works towards broad goals of overall health and well-being, rather than narrow goals of sport competition, larger muscles or concerns over appearance. A regular moderate workout regimen and healthy diet can improve general appearance markers of good health such as muscle tone, healthy skin, hair and nails, while preventing age or lifestyle-related reductions in health and the series of heart and organ failures that accompany inactivity and poor diet.\n\nDiet itself helps to increase calorie burning by boosting metabolism, a process further enhanced while gaining more lean muscle. An aerobic exercise program can burn fat and increase the metabolic rate.",
    "benefits": [
      "Help you control your weight",
      "Reduce your risk of heart diseases",
      "Help your body manage blood sugar and insulin levels",
      "Improve you mental health and mood",
      "Strengthen your bones and muscles",
      "Improve you sleep",
      "Reduce risk of cancer"
    ],
    "sessions": []
  },
  {
    "slug": "reformer-pilates",
    "title": "Reformer Pilates",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/reformer-pilates-2.jpg",
      "/images/services/reformer-pilates-3.jpg",
      "/images/enquire-now.png"
    ],
    "content": "Reformer Pilates is similar yet very different to mat based Pilates. Reformer Pilates is done using the Pilates reformer machine and is generally more intense and more dynamic than mat based Pilates as it adds resistance to the Pilates exercises via the use of the springs which form part of the machine.\n\nReformer Pilates is superior to mat based Pilates as the repertoire of exercises available is greatly increased providing far more variety. The exercises usually work muscles through a large range of motion which is ideal for building and toning muscles as well increasing stability through the joints. Reformer Pilates works more areas than matwork as matwork is mostly core whereas reformer works the entire body and more the peripheral muscles of the arms and legs.",
    "benefits": [
      "It tones your muscles",
      "It gives you rock solid core",
      "It makes you more flexible",
      "It improves your posture",
      "It might ease you aches",
      "It helps you lose weight",
      "It is the version way of cardio"
    ],
    "sessions": [
      {
        "durationNumber": "1",
        "durationUnit": "month",
        "sessionText": "12 session"
      },
      {
        "durationNumber": "3",
        "durationUnit": "month",
        "sessionText": "36 session"
      }
    ]
  },
  {
    "slug": "spinning",
    "title": "Spinning",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/spinning-2.jpg",
      "/images/services/spinning-3.jpg",
      "/images/enquire-now.png"
    ],
    "content": "<b>Indoor cycling</b>, often also called <b>spinning</b>, as an organized sport , is a form of exercise with classes focusing on endurance, strength, intervals, high intensity (race days) and recovery, and involves using a special stationary exercise bicycle with a weighted flywheel in a classroom setting. When people took cycling indoors in the late 19th century, whether for reasons of weather or convenience, technology created faster, more compact and efficient machines over time. The first iterations of the stationary bike ranged from strange contraptions like the Gymnasticon to regular bicycles placed atop rollers.",
    "benefits": [
      "Burn Calories",
      "Ride Here or There",
      "Burn Calories as You Enjoy Your Ride",
      "Improve Your Cardio for a Healthy Heart",
      "Set Your Own Pace",
      "Lower Your Body's Workout Breaking Point",
      "Build Lean Muscle Definition"
    ],
    "sessions": [
      {
        "durationNumber": "1",
        "durationUnit": "month",
        "sessionText": "12 session"
      },
      {
        "durationNumber": "3",
        "durationUnit": "month",
        "sessionText": "36 session"
      }
    ]
  },
  {
    "slug": "bolly-x-fitness",
    "title": "Bolly X Fitness Dance",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/bolly-x-2.jpg",
      "/images/about-top-2.jpg",
      "/images/enquire-now.png"
    ],
    "content": "Bolly X fitness dance is a Bollywood-inspired dance-fitness program that combines dynamic choreography with the hottest music from around the world. Its 50-minute cardio workout cycles between higher and lower-intensity dance sequences to get you moving, sweating, and smiling. At the very core of a BollyX workout is the inspiration it draws from the music and dance of Bollywood, the film industry of India. We embody the infectious energy, expression and movement of Bollywood and aim to expand the reach of fitness to more people worldwide.",
    "benefits": [
      "Great music",
      "Boost coordination and rhythm",
      "Aerobic exercise",
      "Tones the body",
      "Relieves stress",
      "Fun",
      "For everyone"
    ],
    "sessions": [
      {
        "durationNumber": "1",
        "durationUnit": "month",
        "sessionText": "12 session"
      },
      {
        "durationNumber": "3",
        "durationUnit": "month",
        "sessionText": "36 session"
      }
    ]
  },
  {
    "slug": "zumba-fitness",
    "title": "Zumba Fitness Dance",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/zumba-2.jpg",
      "/images/about-top-2.jpg",
      "/images/enquire-now.png"
    ],
    "content": "Zumba is a fitness program that combines Latin and international music with dance moves. Zumba routines incorporate interval training — alternating fast and slow rhythms — to help improve cardiovascular fitness.\n\nZumba is an aerobic activity that can count toward the amount of aerobic activity recommended for most healthy adults by the Department of Health and Human Services.\n\nAerobic exercise can reduce health risks, help maintain a healthy weight, strengthen your heart and boost your mood. If you enjoy Zumba, you're also more likely to do it regularly and experience its benefits as an aerobic exercise.",
    "benefits": [
      "Its fun",
      "Great for weight loss",
      "Tones your entire body",
      "Boost your heart health",
      "Helps you de stress",
      "Improves coordination",
      "Make you feel fresh & happy"
    ],
    "sessions": [
      {
        "durationNumber": "1",
        "durationUnit": "month",
        "sessionText": "12 session"
      },
      {
        "durationNumber": "3",
        "durationUnit": "month",
        "sessionText": "36 session"
      }
    ]
  },
  {
    "slug": "yoga",
    "title": "Yoga",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/yoga-2.jpg",
      "/images/services/yoga-3.jpg",
      "/images/enquire-now.png"
    ],
    "content": "Yoga is a group of physical, mental, and spiritual practices or disciplines which originated in ancient India. Yoga is one of the six  Āstika  (orthodox) schools of Hindu philosophical traditions.\n\nThere is a broad variety of yoga schools, practices, and goals in Hinduism, Buddhism, and Jainism. The term &quot;Yoga&quot; in the Western world often denotes a modern form of hatha yoga and yoga as exercise, consisting largely of the postures or asanas.\n\nThe practice of yoga has been thought to date back to pre- vedic  Indian traditions; possibly in the Indus valley civilization around 3000 BCE. Yoga is mentioned in the Rigveda and also referenced in the Upanishads,. Although, yoga most likely developed as a systematic study around the 5th and 6th centuries BCE, in ancient India&#39;s ascetic and  Śramaṇa  movements. The chronology of earliest texts describing yoga-practices is unclear, varyingly credited to the Upanishads. The Yoga Sutras of Patanjali date from the 2nd century BCE, and gained prominence in the west in the 20th century after being first introduced by Swami Vivekananda. Hatha yoga texts began to emerge sometime between the 9th and 11th century with origins in tantra.",
    "benefits": [
      "Yoga alleviates stress",
      "Yoga reduces anxiety",
      "Yoga may decrease inflammation",
      "Yoga lowers your risk of heart disease",
      "Yoga enhances your sleep quality",
      "Yoga upgrades your flexibility, balance, and strength",
      "Yoga helps with chronic pain"
    ],
    "sessions": [
      {
        "durationNumber": "1",
        "durationUnit": "month",
        "sessionText": "12 session"
      },
      {
        "durationNumber": "3",
        "durationUnit": "month",
        "sessionText": "36 session"
      }
    ]
  },
  {
    "slug": "mat-pilates",
    "title": "Mat Pilates",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/mat-pilates-2.jpg",
      "/images/services/mat-pilates-3.jpg",
      "/images/enquire-now.png"
    ],
    "content": "Mat Pilates is a strengthening and lengthening form of exercise that focuses on your core (trunk) muscles while also training your arms and legs. Mat Pilates is based on the original exercises Joseph Pilates developed to strengthen his own body as a very young man and then began teaching others. The Mat work came before any of the Pilates Apparatus (equipment) he developed. It includes over 500 exercises and can be practiced anywhere. Mat Pilates can be modified for any age, body, or fitness level. It is even possible to practice the modifications of the Mat work in a chair.",
    "benefits": [
      "It tones your muscles",
      "It gives you rock solid core",
      "It makes you more flexible",
      "It improves your posture",
      "It might ease you aches",
      "It helps you lose weight",
      "It is the version way of cardio"
    ],
    "sessions": [
      {
        "durationNumber": "1",
        "durationUnit": "month",
        "sessionText": "12 session"
      },
      {
        "durationNumber": "3",
        "durationUnit": "month",
        "sessionText": "36 session"
      }
    ]
  },
  {
    "slug": "mixed-martial-arts",
    "title": "Mixed Martial Arts",
    "bannerImage": "/images/service-header-image.jpg",
    "images": [
      "/images/group-circle-2.svg",
      "/images/services/mixed-martial-2.jpg",
      "/images/services/mixed-martial-3.jpg",
      "/images/enquire-now.png"
    ],
    "content": "Mixed martial arts (MMA) sometimes referred to as cage fighting, is a full-contact combat sport based on striking, grappling and ground fighting, made up from various combat sports and martial arts from around the world.\n\nOriginally promoted as a competition to find the most effective martial arts for real unarmed combat, competitors from different fighting styles were pitted against one another in contests with relatively few rules. Later, individual fighters incorporated multiple martial arts into their style. MMA promoters were pressured to adopt additional rules to increase competitors' safety, to comply with sport regulations and to broaden mainstream acceptance of the sport.",
    "benefits": [
      "Improve Overall Body Coordination and Proprioception",
      "Improve aerobic and anaerboic conditioning",
      "Improve strength",
      "Develops and Improves Mental Toughness and Resilience",
      "Improves Physical Toughness",
      "Stress Reliever and Effective Treatment for Certain Mental Disorders",
      "Lose weight"
    ],
    "sessions": [
      {
        "durationNumber": "1",
        "durationUnit": "month",
        "sessionText": "12 session"
      },
      {
        "durationNumber": "3",
        "durationUnit": "month",
        "sessionText": "36 session"
      }
    ]
  }
];

export const getServiceBySlug = (slug: string) => services.find((s) => s.slug === slug);
