// محتوى الموقع — عدّل أو أضف هنا. كل نص: { ar, en }
// Site content — edit or add here. Every text: { ar, en }
// عناصر "placeholder: true" نصوص مؤقتة بانتظار معلوماتك الحقيقية.

export const content = {
  goals: [
    { ar: 'رفع سلامة المشاة عند المعابر بتنظيم لحظة العبور.', en: 'Improve pedestrian safety at crossings by organising the moment of crossing.' },
    { ar: 'منح المشاة زر طلب عبور واضحًا بدل انتظار غير محدد.', en: 'Give pedestrians a clear request button instead of an open-ended wait.' },
    { ar: 'تحويل الإشارة بتسلسل آمن: أخضر، أصفر، أحمر للسيارات قبل أخضر المشاة.', en: 'Change the signal in a safe sequence: cars go green, yellow, red before pedestrians get green.' },
    { ar: 'في النسخة المطورة: رصد مركبة تقترب أثناء العبور وتنبيه الجميع صوتيًا وضوئيًا.', en: 'In the advanced version: detect an approaching vehicle during crossing and alert everyone by sound and light.' },
  ],
  how: [
    { ar: 'تبدأ إشارة السيارات باللون الأخضر وإشارة المشاة بالأحمر.', en: 'The car signal starts green and the pedestrian signal starts red.' },
    { ar: 'يضغط المشاة زر طلب العبور.', en: 'A pedestrian presses the crossing request button.' },
    { ar: 'تتحول إشارة السيارات إلى الأصفر ثم الأحمر.', en: 'The car signal turns yellow, then red.' },
    { ar: 'تصبح إشارة المشاة خضراء طوال وقت العبور.', en: 'The pedestrian signal turns green for the crossing time.' },
    { ar: 'بعد انتهاء الوقت تعود الإشارات إلى وضعها الطبيعي.', en: 'When the time ends, the signals return to normal.' },
  ],

  versions: {
    v1: {
      tag: 'V1',
      name: { ar: 'النسخة الأولى · Basic Version', en: 'Version 1 · Basic Version' },
      idea: {
        ar: 'نموذج أساسي يطبّق دورة إشارة المشاة كاملة: السيارات والمشاة وزر طلب العبور، بدون أي حساسات.',
        en: 'A basic prototype that implements the full pedestrian signal cycle: cars, pedestrians and a crossing button, with no sensors.',
      },
      how: {
        ar: 'تبقى السيارات على الأخضر إلى أن يُضغط الزر. عندها تمر الإشارة بالأصفر ثم الأحمر، ويصبح للمشاة الأخضر، ثم تعود الدورة.',
        en: 'Cars stay green until the button is pressed. Then the signal goes yellow, then red, pedestrians get green, and the cycle returns.',
      },
      components: ['arduino', 'led', 'resistor', 'button', 'breadboard', 'wires'],
      diagram: { src: '/images/v1-photo.jpg', alt: { ar: 'صورة حقيقية للنسخة الأولى على لوحة التجارب', en: 'Real photo of the first version on the breadboard' }, kind: 'photo' },
    },
    v2: {
      tag: 'V2',
      name: { ar: 'النسخة الثانية · Advanced Version', en: 'Version 2 · Advanced Version' },
      idea: {
        ar: 'نسخة مطورة عن الأولى: تحتفظ بالدورة نفسها وتضيف طبقة أمان تراقب اقتراب المركبات أثناء عبور المشاة.',
        en: 'An upgrade of version 1: it keeps the same cycle and adds a safety layer that watches for approaching vehicles while pedestrians cross.',
      },
      how: {
        ar: 'تعمل دورة V1 كما هي. وأثناء أخضر المشاة يقيس HC-SR04 بُعد المركبة، فإذا اقتربت تتفعّل الإضاءة التحذيرية والجرس.',
        en: 'The V1 cycle runs as is. During pedestrian green, the HC-SR04 measures vehicle distance; if one gets close, the warning light and buzzer activate.',
      },
      components: ['arduino', 'led', 'resistor', 'button', 'breadboard', 'wires', 'sensor', 'buzzer', 'warningLed'],
      added: ['sensor', 'buzzer', 'warningLed'],
      diagram: { src: '/images/v2-diagram.png', alt: { ar: 'مخطط توصيل النسخة المطورة', en: 'Wiring diagram of the advanced version' }, kind: 'diagram' },
    },
  },

  compare: {
    rows: [
      { label: { ar: 'الفكرة', en: 'Concept' }, v1: { ar: 'إشارة مشاة بدورة كاملة وزر طلب عبور', en: 'Pedestrian signal with a full cycle and request button' }, v2: { ar: 'نفس الدورة مع منظومة تحذير', en: 'Same cycle plus a warning system' } },
      { label: { ar: 'الاستشعار', en: 'Sensing' }, v1: { ar: 'لا يوجد', en: 'None' }, v2: { ar: 'مستشعر مسافة HC-SR04', en: 'HC-SR04 distance sensor' }, newInV2: true },
      { label: { ar: 'التنبيه الصوتي', en: 'Audible alert' }, v1: { ar: 'لا يوجد', en: 'None' }, v2: { ar: 'Buzzer', en: 'Buzzer' }, newInV2: true },
      { label: { ar: 'التنبيه الضوئي', en: 'Visual alert' }, v1: { ar: 'لمبات الإشارة فقط', en: 'Signal LEDs only' }, v2: { ar: 'لمبات الإشارة + Warning LED', en: 'Signal LEDs + Warning LED' }, newInV2: true },
      { label: { ar: 'الوعي بالمركبات', en: 'Vehicle awareness' }, v1: { ar: 'لا يعرف إن كانت مركبة تقترب', en: 'Cannot tell if a vehicle is approaching' }, v2: { ar: 'يرصد المركبة المقتربة أثناء العبور', en: 'Detects an approaching vehicle during crossing' }, newInV2: true },
    ],
    summary: {
      ar: 'V2 ليست نسخة مختلفة، بل تطوير للأولى: كل ما في V1 موجود فيها، مضافًا إليه ثلاث قطع جديدة.',
      en: 'V2 is not a different design but an upgrade: everything in V1 is kept, with three new parts added.',
    },
  },

  stages: [
    { title: { ar: 'بناء النسخة الأولى', en: 'Building version 1' }, text: { ar: 'تنفيذ النموذج الأساسي فعليًا على لوحة التجارب مع Arduino وLEDs وزر الضغط.', en: 'The basic prototype was built on a breadboard with an Arduino, LEDs and a push button.' }, date: null },
    { title: { ar: 'تطوير النسخة الثانية', en: 'Developing version 2' }, text: { ar: 'إضافة مستشعر المسافة والجرس والإضاءة التحذيرية وإعداد مخطط التوصيل.', en: 'Adding the distance sensor, buzzer and warning light, and preparing the wiring diagram.' }, date: null },
    { title: { ar: 'مرحلة جديدة', en: 'New stage' }, text: { ar: 'أضف هنا مراحل التطوير الأخرى أو التواريخ.', en: 'Add other development stages or dates here.' }, date: null, placeholder: true },
  ],

  results: {
    items: [], // أضف نتائج التجارب الحقيقية هنا: { title:{ar,en}, text:{ar,en} }
    empty: {
      ar: 'لم تُضف نتائج تجارب بعد. هذا القسم مخصص للنتائج الفعلية فقط، وتُضاف من ملف content.js.',
      en: 'No experiment results yet. This section is reserved for real results and is filled from content.js.',
    },
  },

  uses: [
    { ar: 'معابر المشاة قرب المدارس.', en: 'Pedestrian crossings near schools.' },
    { ar: 'شوارع الأحياء السكنية والأسواق.', en: 'Residential streets and shopping areas.' },
    { ar: 'مواقع تحتاج معبرًا مؤقتًا أو منخفض التكلفة.', en: 'Places that need a temporary or low-cost crossing.' },
    { ar: 'التعليم: تعلّم البرمجة والإلكترونيات من خلال مشروع حقيقي.', en: 'Education: learning programming and electronics through a real project.' },
  ],
  future: [
    { ar: 'عدّاد تنازلي لوقت العبور.', en: 'A countdown display for the crossing time.' },
    { ar: 'إرشاد صوتي لضعاف البصر.', en: 'Audio guidance for visually impaired pedestrians.' },
    { ar: 'تشغيل بالطاقة الشمسية.', en: 'Solar power.' },
    { ar: 'ضبط زمن العبور تلقائيًا بحسب الازدحام.', en: 'Adjusting the crossing time automatically to traffic.' },
    { ar: 'ربط عدة إشارات ببعضها لاسلكيًا.', en: 'Linking several signals together wirelessly.' },
  ],

  gallery: [
    { type: 'image', src: '/images/v1-photo.jpg', caption: { ar: 'النسخة الأولى: النموذج الفعلي', en: 'Version 1: the physical prototype' } },
    { type: 'image', src: '/images/v2-diagram.png', caption: { ar: 'النسخة المطورة: مخطط التوصيل', en: 'Advanced version: wiring diagram' } },
    // لإضافة صورة: ضعها في public/images ثم أضف سطرًا { type:'image', src:'/images/اسم.jpg', caption:{...} }
    // لإضافة فيديو:  { type:'video', src:'/videos/demo.mp4', caption:{...} }
    { type: 'video', src: null, caption: { ar: 'مكان فيديو المشروع', en: 'Project video goes here' }, placeholder: true },
    { type: 'image', src: null, caption: { ar: 'مكان صورة إضافية', en: 'Another photo goes here' }, placeholder: true },
  ],

  contact: [
    { key: 'name', label: { ar: 'المخترع / الفريق', en: 'Inventor / team' }, value: null },
    { key: 'email', label: { ar: 'البريد الإلكتروني', en: 'Email' }, value: null, href: 'mailto:' },
    { key: 'phone', label: { ar: 'الهاتف', en: 'Phone' }, value: null, href: 'tel:' },
    { key: 'social', label: { ar: 'حسابات التواصل', en: 'Social accounts' }, value: null },
  ],
};
