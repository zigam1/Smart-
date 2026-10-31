// بيانات القطع الإلكترونية — عدّل النصوص هنا فقط.
// Component data — edit texts here only. Each text is { ar, en }.
export const components = {
  arduino: {
    name: { ar: 'Arduino Uno', en: 'Arduino Uno' },
    function: {
      ar: 'العقل المتحكم في الإشارة: ينفّذ البرنامج، يقرأ زر العبور، ويشغّل اللمبات بالتسلسل الصحيح.',
      en: 'The brain of the signal: runs the program, reads the crossing button and switches the lights in the right order.',
    },
    details: {
      ar: 'لوحة تحكم مبنية على المعالج ATmega328P، تعمل بجهد 5 فولت وتوفّر 14 مدخل/مخرج رقمي.',
      en: 'A microcontroller board built around the ATmega328P, running at 5 V with 14 digital input/output pins.',
    },
  },
  breadboard: {
    name: { ar: 'Breadboard (لوحة التجارب)', en: 'Breadboard' },
    function: {
      ar: 'تربط القطع ببعضها بدون لحام، فيسهل تعديل الدائرة وتجربتها.',
      en: 'Connects parts together without soldering, so the circuit is easy to change and test.',
    },
    details: {
      ar: 'صفوف الثقوب في كل عمود متصلة كهربائيًا، وخطا الطاقة على الجانبين يوزّعان الجهد والأرضي.',
      en: 'Each column strip of holes is connected internally; the power rails along the sides distribute voltage and ground.',
    },
  },
  led: {
    name: { ar: 'LED (ثنائي مضيء)', en: 'LED' },
    function: {
      ar: 'تعرض حالة الإشارة بالألوان: أحمر وأصفر وأخضر للسيارات، وأحمر وأخضر للمشاة.',
      en: 'Shows the signal state with colour: red, yellow and green for cars; red and green for pedestrians.',
    },
    details: {
      ar: 'يضيء عند مرور تيار في اتجاه واحد، ويحتاج مقاومة على التوالي لحمايته.',
      en: 'Lights up when current flows in one direction and needs a series resistor to protect it.',
    },
    roles: {
      carRed: { ar: 'أحمر · السيارات', en: 'Red · Cars', short: { ar: 'أحمر (سيارات)', en: 'Red (cars)' } },
      carYellow: { ar: 'أصفر · السيارات', en: 'Yellow · Cars', short: { ar: 'أصفر (سيارات)', en: 'Yellow (cars)' } },
      carGreen: { ar: 'أخضر · السيارات', en: 'Green · Cars', short: { ar: 'أخضر (سيارات)', en: 'Green (cars)' } },
      pedRed: { ar: 'أحمر · المشاة', en: 'Red · Pedestrians', short: { ar: 'أحمر (مشاة)', en: 'Red (peds)' } },
      pedGreen: { ar: 'أخضر · المشاة', en: 'Green · Pedestrians', short: { ar: 'أخضر (مشاة)', en: 'Green (peds)' } },
    },
  },
  resistor: {
    name: { ar: 'Resistor (مقاومة)', en: 'Resistor' },
    function: {
      ar: 'تحدّ من التيار المار في اللمبات حتى لا تتلف.',
      en: 'Limits the current through the LEDs so they are not damaged.',
    },
    details: {
      ar: 'قيمة المقاومة تُحدَّد بحسب تصميم الدائرة. ألوان الحلقات في المجسم للتوضيح فقط.',
      en: 'The resistance value is chosen by the circuit design. The colour bands in the model are illustrative only.',
    },
  },
  button: {
    name: { ar: 'Push Button (زر الضغط)', en: 'Push Button' },
    function: {
      ar: 'زر طلب العبور: يضغطه المشاة فتبدأ دورة تحويل الإشارة.',
      en: 'The crossing request button: a pedestrian presses it to start the signal change cycle.',
    },
    details: {
      ar: 'يغلق الدائرة لحظة الضغط فقط، وتقرأ Arduino هذه اللحظة كطلب عبور.',
      en: 'It closes the circuit only while pressed; the Arduino reads that moment as a crossing request.',
    },
  },
  wires: {
    name: { ar: 'Connecting Wires (أسلاك التوصيل)', en: 'Connecting Wires' },
    function: {
      ar: 'تنقل الإشارات والطاقة بين Arduino ولوحة التجارب وباقي القطع.',
      en: 'Carry signals and power between the Arduino, the breadboard and the other parts.',
    },
    details: {
      ar: 'توصيل المجسم توضيحي. أرقام الدبابيس الفعلية تُضاف في ملف البيانات عند توفرها.',
      en: 'Wiring in the model is illustrative. Real pin numbers are added in the data file when available.',
    },
  },
  // ===== مضافة في V2 فقط | V2 only =====
  sensor: {
    name: { ar: 'HC-SR04 (مستشعر المسافة)', en: 'HC-SR04 distance sensor' },
    function: {
      ar: 'يقيس بُعد المركبة القادمة بالموجات فوق الصوتية، لتعرف الإشارة أن سيارة تقترب من المشاة.',
      en: 'Measures how far an approaching vehicle is using ultrasound, so the signal knows a car is nearing the pedestrians.',
    },
    details: {
      ar: 'يرسل نبضة صوتية عبر أحد "العينين" ويستقبل صداها بالآخر، ويحسب المسافة من زمن العودة. مداه النظري 2 إلى 400 سم.',
      en: 'Sends an ultrasonic pulse from one "eye" and listens for the echo on the other, computing distance from the return time. Nominal range is 2 to 400 cm.',
    },
  },
  buzzer: {
    name: { ar: 'Buzzer (جرس التنبيه)', en: 'Buzzer' },
    function: {
      ar: 'يطلق تنبيهًا صوتيًا عندما يرصد المستشعر خطرًا أثناء عبور المشاة.',
      en: 'Sounds an audible alert when the sensor detects danger while pedestrians are crossing.',
    },
    details: {
      ar: 'يحوّل الإشارة الكهربائية إلى صوت يسمعه المشاة والسائق معًا.',
      en: 'Turns the electrical signal into a sound that both pedestrians and drivers can hear.',
    },
  },
  warningLed: {
    name: { ar: 'Warning LED (إضاءة تحذيرية)', en: 'Warning LED' },
    function: {
      ar: 'تومض لتنبيه الجميع بصريًا عند تفعيل التحذير، وتعمل مع الجرس.',
      en: 'Flashes to warn everyone visually when the alert is triggered, working together with the buzzer.',
    },
    details: {
      ar: 'لمبة مستقلة عن لمبات الإشارة الخمس حتى لا يختلط التحذير بحالة الإشارة.',
      en: 'A separate light from the five signal LEDs, so the warning is never confused with the signal state.',
    },
  },
};
