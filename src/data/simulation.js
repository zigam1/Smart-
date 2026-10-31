// إعدادات المحاكاة — القيم هنا افتراضية للعرض فقط وليست قياسات الاختراع الحقيقية.
// Simulation settings — defaults for the demo only, NOT measurements from the real prototype.
// عدّلها لتطابق الكود الفعلي (Sketch) عند توفره.
export const simulation = {
  timings: {
    yellowMs: 3000,   // مدة الأصفر للسيارات
    allRedMs: 1000,   // فاصل أمان: الكل أحمر
    crossingMs: 8000, // مدة أخضر المشاة
  },
  v2: {
    thresholdCm: 30,           // مسافة تفعيل التحذير
    minCm: 5,
    maxCm: 300,
    defaultCm: 150,
    warnDuringPhases: ['ped_green'], // التحذير يعمل في هذه المراحل فقط
    sensorRangeNote: '2–400 cm (HC-SR04)',
  },
  // أرقام الدبابيس: اتركها null إلى أن تتأكد منها (لن تُعرض إن كانت null)
  // Pin numbers: leave null until confirmed (hidden in the UI while null)
  pins: {
    v1: { carRed: null, carYellow: null, carGreen: null, pedRed: null, pedGreen: null, button: null },
    v2: { carRed: null, carYellow: null, carGreen: null, pedRed: null, pedGreen: null, button: null, warningLed: null, buzzer: null, trig: null, echo: null },
  },
};
