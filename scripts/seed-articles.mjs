import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// .env.local se Firebase configuration load karne ke liye
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PORTALS = [
  { slug: 'the-local-leader', name: 'द लोकल लीडर' },
  { slug: 'bazar-karobar', name: 'बाज़ार कारोबार' },
  { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स' },
  { slug: 'state-express', name: 'द प्रोव्यू टाइम्स' },
  { slug: 'desh-ki-aawaz', name: 'देश की आवाज़' },
  { slug: 'jan-chetna-news', name: 'जन भारत न्यूज़' },
  { slug: 'city-bulletin', name: 'NEWS INFO 24' },
  { slug: 'national-spotlight', name: 'डिफेंस न्यूज़' }
];

const TEMPLATES = [
  {
    category: 'राजनीति',
    title: 'आगामी चुनावों को लेकर सियासी हलचल तेज, नई रणनीतियों पर मंथन शुरू',
    summary: 'विधानसभा और स्थानीय निकाय चुनावों की तैयारियों को लेकर सभी प्रमुख राजनीतिक दलों ने मैराथन बैठकें शुरू कर दी हैं।',
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'व्यापार',
    title: 'शेयर बाजार में लगातार तीसरे दिन तेजी, सेंसेक्स और निफ्टी नए रिकॉर्ड स्तर पर',
    summary: 'वैश्विक संकेतों और बैंकिंग शेयरों में जोरदार खरीदारी के चलते घरेलू बाजारों में निवेशकों की संपत्ति में भारी इजाफा दर्ज हुआ।',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'राज्य',
    title: 'हाईवे और एक्सप्रेसवे कनेक्टिविटी को मिला बड़ा बजट, सफर होगा और आसान',
    summary: 'राज्य सरकार ने प्रमुख औद्योगिक केंद्रों को जोड़ने वाले नए फोर-लेन गलियारों के निर्माण के लिए अतिरिक्त फंड जारी किया।',
    image: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'स्वास्थ्य',
    title: 'बदलते मौसम में मौसमी बीमारियों से बचाव के लिए स्वास्थ्य विभाग की एडवाइजरी',
    summary: 'अस्पतालों में ओपीडी की संख्या बढ़ने के बाद डॉक्टरों ने खान-पान और स्वच्छता को लेकर विशेष सावधानी बरतने के निर्देश दिए।',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'जीवनशैली',
    title: 'डिजिटल डिटॉक्स और योग से मानसिक तनाव घटाने का नया ट्रेंड',
    summary: 'व्यस्त दिनचर्या के बीच आधुनिक युवाओं में वीकेंड पर स्क्रीन से दूर रहकर प्राकृतिक वातावरण में समय बिताने की लोकप्रियता बढ़ी।',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'खेल',
    title: 'टी-20 मुकाबले में युवा खिलाड़ियों का शानदार प्रदर्शन, रोमांचक मुकाबले में जीत',
    summary: 'अंतिम ओवर तक खिंचे मैच में गेंदबाजों की कसी हुई गेंदबाजी और मध्यक्रम की साझेदारी ने टीम को ऐतिहासिक बढ़त दिलाई।',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'अपराध',
    title: 'साइबर ठगी के बड़े नेटवर्क का भंडाफोड़, फर्जी कॉल सेंटर से लाखों का फर्जीवाड़ा पकड़ा',
    summary: 'स्पेशल टास्क फोर्स ने गुप्त सूचना के आधार पर छापा मारकर तकनीकी उपकरणों और दर्जनों फर्जी सिम कार्डों को जब्त किया।',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'व्यापार',
    title: 'सोने और चांदी की कीमतों में हल्का सुधार, त्योहारी मांग बढ़ने के संकेत',
    summary: 'सर्राफा बाजार में खुदरा खरीदारों की वापसी से धातुओं के भाव में स्थिरता आई, ज्वैलर्स ने आकर्षक ऑफर पेश किए।',
    image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'राजनीति',
    title: 'ग्रामीण विकास योजनाओं की समीक्षा बैठक, बुनियादी सुविधाओं पर रहेगा विशेष जोर',
    summary: 'अधिकारियों को नल-जल, सड़क मरम्मत और पंचायत भवनों के निर्माण कार्यों को समय सीमा के भीतर पूरा करने के कड़े निर्देश।',
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'राज्य',
    title: 'कृषि उपज मंडी में नई फसलों की बंपर आवक, किसानों को मिले उचित दाम',
    summary: 'मंडी प्रशासन ने पारदर्शी तौल और त्वरित भुगतान की व्यवस्था सुनिश्चित करने के लिए विशेष टोकन काउंटर स्थापित किए।',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80'
  },
  {
    category: 'शिक्षा',
    title: 'बोर्ड परीक्षाओं और प्रतियोगी सत्रों के लिए मॉडल टेस्ट पेपर जारी, छात्र तैयारी में जुटे',
    summary: 'विशेषज्ञ शिक्षकों द्वारा तैयार किए गए प्रश्न बैंक से छात्रों को परीक्षा पैटर्न और समय प्रबंधन समझने में बड़ी मदद मिलेगी।',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80'
  }
];

async function seedNews() {
  console.log('🚀 Sabhi 8 Portals ke liye news Firestore me dali jaa rahi hain...\n');

  let totalAdded = 0;

  for (const portal of PORTALS) {
    console.log(`📌 Portal: ${portal.name} (${portal.slug}) - 11 news upload ho rahi hain...`);

    for (let i = 0; i < TEMPLATES.length; i++) {
      const item = TEMPLATES[i];
      const randomViews = Math.floor(Math.random() * 80) + 15;
      
      const dateOffset = Math.floor(Math.random() * 5);
      const articleDate = new Date(Date.now() - dateOffset * 86400000).toISOString();

      const articleDoc = {
        siteId: portal.slug,
        title: item.title,
        titleHi: item.title,
        summary: item.summary,
        category: item.category,
        image: item.image,
        views: randomViews,
        status: 'published',
        createdAt: articleDate,
        author: 'संपादकीय टीम',
        content: `<p>${item.summary}</p><p>यह खबर ${portal.name} के विशेष संवाददाता द्वारा संकलित की गई है। क्षेत्र की हर महत्वपूर्ण हलचल और ताज़ा अपडेट के लिए जुड़े रहें।</p>`
      };

      await addDoc(collection(db, 'articles'), articleDoc);
      totalAdded++;
    }
  }

  console.log(`\n🎉 Success! Kul ${totalAdded} articles Firestore me live upload ho chuke hain!`);
  process.exit(0);
}

seedNews().catch((err) => {
  console.error('❌ Error aayi seed karne me:', err);
  process.exit(1);
});