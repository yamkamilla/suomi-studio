/* Библиотека упражнений. Поля:
   id, name (рус), en (англ/название на тренажёре), group (мышечная группа),
   eq (оборудование), kind: 'weight' | 'body' | 'time' | 'cardio', rest (сек по умолчанию) */
window.GYM_GROUPS = ['Грудь', 'Спина', 'Ноги', 'Ягодицы', 'Плечи', 'Руки', 'Кор', 'Кардио', 'Всё тело'];
window.GYM_EQUIPMENT = ['Штанга', 'Гантели', 'Тренажёр', 'Блок', 'Свой вес', 'Гиря', 'Резинка', 'Кардио'];

window.GYM_EXERCISES = [
  // Грудь
  { id: 'bench', name: 'Жим лёжа', en: 'Bench press', group: 'Грудь', eq: 'Штанга', kind: 'weight', rest: 150 },
  { id: 'bench_db', name: 'Жим гантелей лёжа', en: 'Dumbbell bench press', group: 'Грудь', eq: 'Гантели', kind: 'weight', rest: 120 },
  { id: 'incline_bench', name: 'Жим на наклонной', en: 'Incline bench press', group: 'Грудь', eq: 'Штанга', kind: 'weight', rest: 150 },
  { id: 'incline_db', name: 'Жим гантелей на наклонной', en: 'Incline dumbbell press', group: 'Грудь', eq: 'Гантели', kind: 'weight', rest: 120 },
  { id: 'chest_press', name: 'Жим в тренажёре', en: 'Chest press machine', group: 'Грудь', eq: 'Тренажёр', kind: 'weight', rest: 90 },
  { id: 'pec_deck', name: 'Бабочка', en: 'Pec deck / chest fly', group: 'Грудь', eq: 'Тренажёр', kind: 'weight', rest: 75 },
  { id: 'cable_fly', name: 'Сведение в кроссовере', en: 'Cable fly', group: 'Грудь', eq: 'Блок', kind: 'weight', rest: 75 },
  { id: 'pushup', name: 'Отжимания', en: 'Push-up', group: 'Грудь', eq: 'Свой вес', kind: 'body', rest: 60 },
  { id: 'dips', name: 'Отжимания на брусьях', en: 'Dips', group: 'Грудь', eq: 'Свой вес', kind: 'body', rest: 120 },
  // Спина
  { id: 'deadlift', name: 'Становая тяга', en: 'Deadlift', group: 'Спина', eq: 'Штанга', kind: 'weight', rest: 180 },
  { id: 'pullup', name: 'Подтягивания', en: 'Pull-up', group: 'Спина', eq: 'Свой вес', kind: 'body', rest: 120 },
  { id: 'lat_pulldown', name: 'Тяга верхнего блока', en: 'Lat pulldown', group: 'Спина', eq: 'Блок', kind: 'weight', rest: 90 },
  { id: 'seated_row', name: 'Тяга горизонтального блока', en: 'Seated cable row', group: 'Спина', eq: 'Блок', kind: 'weight', rest: 90 },
  { id: 'barbell_row', name: 'Тяга штанги в наклоне', en: 'Barbell row', group: 'Спина', eq: 'Штанга', kind: 'weight', rest: 120 },
  { id: 'db_row', name: 'Тяга гантели в наклоне', en: 'One-arm dumbbell row', group: 'Спина', eq: 'Гантели', kind: 'weight', rest: 90 },
  { id: 'tbar_row', name: 'Т-тяга', en: 'T-bar row', group: 'Спина', eq: 'Штанга', kind: 'weight', rest: 120 },
  { id: 'machine_row', name: 'Тяга в тренажёре', en: 'Machine row', group: 'Спина', eq: 'Тренажёр', kind: 'weight', rest: 90 },
  { id: 'assisted_pullup', name: 'Подтягивания в гравитроне', en: 'Assisted pull-up', group: 'Спина', eq: 'Тренажёр', kind: 'weight', rest: 90 },
  { id: 'face_pull', name: 'Тяга к лицу', en: 'Face pull', group: 'Спина', eq: 'Блок', kind: 'weight', rest: 60 },
  { id: 'straight_arm_pulldown', name: 'Пуловер на блоке', en: 'Straight-arm pulldown', group: 'Спина', eq: 'Блок', kind: 'weight', rest: 60 },
  { id: 'back_ext', name: 'Гиперэкстензия', en: 'Back extension', group: 'Спина', eq: 'Тренажёр', kind: 'weight', rest: 60 },
  // Ноги
  { id: 'squat', name: 'Приседания со штангой', en: 'Back squat', group: 'Ноги', eq: 'Штанга', kind: 'weight', rest: 180 },
  { id: 'front_squat', name: 'Фронтальные приседания', en: 'Front squat', group: 'Ноги', eq: 'Штанга', kind: 'weight', rest: 150 },
  { id: 'goblet_squat', name: 'Гоблет-присед', en: 'Goblet squat', group: 'Ноги', eq: 'Гантели', kind: 'weight', rest: 90 },
  { id: 'hack_squat', name: 'Гакк-присед', en: 'Hack squat', group: 'Ноги', eq: 'Тренажёр', kind: 'weight', rest: 150 },
  { id: 'leg_press', name: 'Жим ногами', en: 'Leg press', group: 'Ноги', eq: 'Тренажёр', kind: 'weight', rest: 120 },
  { id: 'leg_ext', name: 'Разгибание ног', en: 'Leg extension', group: 'Ноги', eq: 'Тренажёр', kind: 'weight', rest: 75 },
  { id: 'leg_curl', name: 'Сгибание ног', en: 'Leg curl', group: 'Ноги', eq: 'Тренажёр', kind: 'weight', rest: 75 },
  { id: 'rdl', name: 'Румынская тяга', en: 'Romanian deadlift', group: 'Ноги', eq: 'Штанга', kind: 'weight', rest: 150 },
  { id: 'rdl_db', name: 'Румынская тяга с гантелями', en: 'Dumbbell RDL', group: 'Ноги', eq: 'Гантели', kind: 'weight', rest: 120 },
  { id: 'lunge', name: 'Выпады', en: 'Lunges', group: 'Ноги', eq: 'Гантели', kind: 'weight', rest: 90 },
  { id: 'bulgarian', name: 'Болгарские выпады', en: 'Bulgarian split squat', group: 'Ноги', eq: 'Гантели', kind: 'weight', rest: 90 },
  { id: 'step_up', name: 'Зашагивания на тумбу', en: 'Step-up', group: 'Ноги', eq: 'Гантели', kind: 'weight', rest: 75 },
  { id: 'calf_raise', name: 'Подъём на носки', en: 'Calf raise', group: 'Ноги', eq: 'Тренажёр', kind: 'weight', rest: 60 },
  { id: 'adductor', name: 'Сведение ног', en: 'Adductor machine', group: 'Ноги', eq: 'Тренажёр', kind: 'weight', rest: 60 },
  { id: 'abductor', name: 'Разведение ног', en: 'Abductor machine', group: 'Ягодицы', eq: 'Тренажёр', kind: 'weight', rest: 60 },
  // Ягодицы
  { id: 'hip_thrust', name: 'Ягодичный мост', en: 'Hip thrust', group: 'Ягодицы', eq: 'Штанга', kind: 'weight', rest: 120 },
  { id: 'hip_thrust_machine', name: 'Ягодичный мост в тренажёре', en: 'Hip thrust machine', group: 'Ягодицы', eq: 'Тренажёр', kind: 'weight', rest: 120 },
  { id: 'glute_kickback', name: 'Отведение ноги в блоке', en: 'Cable kickback', group: 'Ягодицы', eq: 'Блок', kind: 'weight', rest: 60 },
  { id: 'glute_bridge', name: 'Ягодичный мостик', en: 'Glute bridge', group: 'Ягодицы', eq: 'Свой вес', kind: 'body', rest: 60 },
  { id: 'sumo_dl', name: 'Сумо-тяга', en: 'Sumo deadlift', group: 'Ягодицы', eq: 'Штанга', kind: 'weight', rest: 180 },
  // Плечи
  { id: 'ohp', name: 'Жим стоя', en: 'Overhead press', group: 'Плечи', eq: 'Штанга', kind: 'weight', rest: 150 },
  { id: 'db_shoulder_press', name: 'Жим гантелей сидя', en: 'Seated dumbbell press', group: 'Плечи', eq: 'Гантели', kind: 'weight', rest: 120 },
  { id: 'shoulder_press_machine', name: 'Жим в тренажёре на плечи', en: 'Shoulder press machine', group: 'Плечи', eq: 'Тренажёр', kind: 'weight', rest: 90 },
  { id: 'lateral_raise', name: 'Махи в стороны', en: 'Lateral raise', group: 'Плечи', eq: 'Гантели', kind: 'weight', rest: 60 },
  { id: 'cable_lateral', name: 'Махи в стороны на блоке', en: 'Cable lateral raise', group: 'Плечи', eq: 'Блок', kind: 'weight', rest: 60 },
  { id: 'rear_delt', name: 'Разведение на задние дельты', en: 'Rear delt fly', group: 'Плечи', eq: 'Тренажёр', kind: 'weight', rest: 60 },
  { id: 'front_raise', name: 'Подъём перед собой', en: 'Front raise', group: 'Плечи', eq: 'Гантели', kind: 'weight', rest: 60 },
  { id: 'upright_row', name: 'Тяга к подбородку', en: 'Upright row', group: 'Плечи', eq: 'Штанга', kind: 'weight', rest: 90 },
  // Руки
  { id: 'bb_curl', name: 'Сгибания со штангой', en: 'Barbell curl', group: 'Руки', eq: 'Штанга', kind: 'weight', rest: 75 },
  { id: 'db_curl', name: 'Сгибания с гантелями', en: 'Dumbbell curl', group: 'Руки', eq: 'Гантели', kind: 'weight', rest: 60 },
  { id: 'hammer_curl', name: 'Молотки', en: 'Hammer curl', group: 'Руки', eq: 'Гантели', kind: 'weight', rest: 60 },
  { id: 'cable_curl', name: 'Сгибания на блоке', en: 'Cable curl', group: 'Руки', eq: 'Блок', kind: 'weight', rest: 60 },
  { id: 'preacher_curl', name: 'Сгибания на скамье Скотта', en: 'Preacher curl', group: 'Руки', eq: 'Тренажёр', kind: 'weight', rest: 75 },
  { id: 'triceps_pushdown', name: 'Разгибания на блоке', en: 'Triceps pushdown', group: 'Руки', eq: 'Блок', kind: 'weight', rest: 60 },
  { id: 'overhead_triceps', name: 'Французский жим на блоке', en: 'Overhead cable extension', group: 'Руки', eq: 'Блок', kind: 'weight', rest: 60 },
  { id: 'skullcrusher', name: 'Французский жим лёжа', en: 'Skull crusher', group: 'Руки', eq: 'Штанга', kind: 'weight', rest: 90 },
  { id: 'close_grip_bench', name: 'Жим узким хватом', en: 'Close-grip bench', group: 'Руки', eq: 'Штанга', kind: 'weight', rest: 120 },
  { id: 'triceps_dip_machine', name: 'Трицепс в тренажёре', en: 'Triceps dip machine', group: 'Руки', eq: 'Тренажёр', kind: 'weight', rest: 75 },
  // Кор
  { id: 'plank', name: 'Планка', en: 'Plank', group: 'Кор', eq: 'Свой вес', kind: 'time', rest: 60 },
  { id: 'side_plank', name: 'Боковая планка', en: 'Side plank', group: 'Кор', eq: 'Свой вес', kind: 'time', rest: 45 },
  { id: 'crunch_machine', name: 'Скручивания в тренажёре', en: 'Ab crunch machine', group: 'Кор', eq: 'Тренажёр', kind: 'weight', rest: 60 },
  { id: 'cable_crunch', name: 'Скручивания на блоке', en: 'Cable crunch', group: 'Кор', eq: 'Блок', kind: 'weight', rest: 60 },
  { id: 'hanging_leg_raise', name: 'Подъём ног в висе', en: 'Hanging leg raise', group: 'Кор', eq: 'Свой вес', kind: 'body', rest: 60 },
  { id: 'leg_raise', name: 'Подъём ног лёжа', en: 'Lying leg raise', group: 'Кор', eq: 'Свой вес', kind: 'body', rest: 45 },
  { id: 'russian_twist', name: 'Русские скручивания', en: 'Russian twist', group: 'Кор', eq: 'Свой вес', kind: 'body', rest: 45 },
  { id: 'ab_wheel', name: 'Ролик для пресса', en: 'Ab wheel', group: 'Кор', eq: 'Свой вес', kind: 'body', rest: 60 },
  { id: 'dead_bug', name: 'Мёртвый жук', en: 'Dead bug', group: 'Кор', eq: 'Свой вес', kind: 'body', rest: 45 },
  { id: 'pallof', name: 'Паллоф-пресс', en: 'Pallof press', group: 'Кор', eq: 'Блок', kind: 'weight', rest: 45 },
  // Всё тело / гиря
  { id: 'kb_swing', name: 'Махи гирей', en: 'Kettlebell swing', group: 'Всё тело', eq: 'Гиря', kind: 'weight', rest: 75 },
  { id: 'clean_press', name: 'Взятие и жим', en: 'Clean and press', group: 'Всё тело', eq: 'Штанга', kind: 'weight', rest: 120 },
  { id: 'thruster', name: 'Трастеры', en: 'Thruster', group: 'Всё тело', eq: 'Гантели', kind: 'weight', rest: 90 },
  { id: 'farmer', name: 'Прогулка фермера', en: "Farmer's carry", group: 'Всё тело', eq: 'Гантели', kind: 'time', rest: 90 },
  { id: 'burpee', name: 'Бёрпи', en: 'Burpee', group: 'Всё тело', eq: 'Свой вес', kind: 'body', rest: 60 },
  { id: 'box_jump', name: 'Запрыгивания на тумбу', en: 'Box jump', group: 'Всё тело', eq: 'Свой вес', kind: 'body', rest: 60 },
  { id: 'band_pull_apart', name: 'Разведение резинки', en: 'Band pull-apart', group: 'Плечи', eq: 'Резинка', kind: 'body', rest: 30 },
  // Кардио
  { id: 'treadmill', name: 'Беговая дорожка', en: 'Treadmill', group: 'Кардио', eq: 'Кардио', kind: 'cardio', rest: 0 },
  { id: 'bike', name: 'Велотренажёр', en: 'Stationary bike', group: 'Кардио', eq: 'Кардио', kind: 'cardio', rest: 0 },
  { id: 'rower', name: 'Гребной тренажёр', en: 'Rowing machine', group: 'Кардио', eq: 'Кардио', kind: 'cardio', rest: 0 },
  { id: 'elliptical', name: 'Эллипс', en: 'Elliptical', group: 'Кардио', eq: 'Кардио', kind: 'cardio', rest: 0 },
  { id: 'stairmaster', name: 'Степпер / лестница', en: 'Stair climber', group: 'Кардио', eq: 'Кардио', kind: 'cardio', rest: 0 },
  { id: 'skierg', name: 'SkiErg', en: 'SkiErg', group: 'Кардио', eq: 'Кардио', kind: 'cardio', rest: 0 },
  { id: 'jump_rope', name: 'Скакалка', en: 'Jump rope', group: 'Кардио', eq: 'Свой вес', kind: 'time', rest: 45 },
  { id: 'group_class', name: 'Групповое занятие', en: 'Group class', group: 'Всё тело', eq: 'Свой вес', kind: 'cardio', rest: 0 },
];

/* Готовые программы. ex: id упражнения, sets: число подходов, reps: ориентир */
window.GYM_PRESETS = [
  {
    id: 'preset_full_a', name: 'Всё тело А', note: 'База на 3 раза в неделю',
    items: [
      { ex: 'squat', sets: 3, reps: 8 }, { ex: 'bench', sets: 3, reps: 8 }, { ex: 'seated_row', sets: 3, reps: 10 },
      { ex: 'db_shoulder_press', sets: 3, reps: 10 }, { ex: 'leg_curl', sets: 3, reps: 12 }, { ex: 'plank', sets: 3, reps: 0 },
    ],
  },
  {
    id: 'preset_full_b', name: 'Всё тело Б', note: 'Чередовать с А',
    items: [
      { ex: 'deadlift', sets: 3, reps: 5 }, { ex: 'lat_pulldown', sets: 3, reps: 10 }, { ex: 'incline_db', sets: 3, reps: 10 },
      { ex: 'leg_press', sets: 3, reps: 12 }, { ex: 'lateral_raise', sets: 3, reps: 15 }, { ex: 'cable_crunch', sets: 3, reps: 15 },
    ],
  },
  {
    id: 'preset_push', name: 'Push (грудь, плечи, трицепс)', note: 'Сплит на 3 дня',
    items: [
      { ex: 'bench', sets: 4, reps: 6 }, { ex: 'incline_db', sets: 3, reps: 10 }, { ex: 'shoulder_press_machine', sets: 3, reps: 10 },
      { ex: 'lateral_raise', sets: 4, reps: 15 }, { ex: 'triceps_pushdown', sets: 3, reps: 12 }, { ex: 'overhead_triceps', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'preset_pull', name: 'Pull (спина, бицепс)', note: 'Сплит на 3 дня',
    items: [
      { ex: 'lat_pulldown', sets: 4, reps: 8 }, { ex: 'seated_row', sets: 3, reps: 10 }, { ex: 'db_row', sets: 3, reps: 10 },
      { ex: 'face_pull', sets: 3, reps: 15 }, { ex: 'bb_curl', sets: 3, reps: 10 }, { ex: 'hammer_curl', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'preset_legs', name: 'Legs (ноги, ягодицы)', note: 'Сплит на 3 дня',
    items: [
      { ex: 'squat', sets: 4, reps: 6 }, { ex: 'rdl', sets: 3, reps: 8 }, { ex: 'leg_press', sets: 3, reps: 12 },
      { ex: 'hip_thrust', sets: 3, reps: 10 }, { ex: 'leg_ext', sets: 3, reps: 15 }, { ex: 'calf_raise', sets: 4, reps: 15 },
    ],
  },
  {
    id: 'preset_upper', name: 'Верх тела', note: 'Верх/низ, 4 раза в неделю',
    items: [
      { ex: 'bench', sets: 3, reps: 8 }, { ex: 'barbell_row', sets: 3, reps: 8 }, { ex: 'ohp', sets: 3, reps: 8 },
      { ex: 'pullup', sets: 3, reps: 0 }, { ex: 'db_curl', sets: 2, reps: 12 }, { ex: 'triceps_pushdown', sets: 2, reps: 12 },
    ],
  },
  {
    id: 'preset_lower', name: 'Низ тела', note: 'Верх/низ, 4 раза в неделю',
    items: [
      { ex: 'squat', sets: 3, reps: 6 }, { ex: 'rdl', sets: 3, reps: 8 }, { ex: 'bulgarian', sets: 3, reps: 10 },
      { ex: 'leg_curl', sets: 3, reps: 12 }, { ex: 'calf_raise', sets: 3, reps: 15 }, { ex: 'hanging_leg_raise', sets: 3, reps: 0 },
    ],
  },
];

/* Групповые занятия, которые обычно есть в расписании Elixia и других клубов SATS */
window.GYM_CLASSES = ['BODYPUMP', 'BODYCOMBAT', 'BODYBALANCE', 'BODYATTACK', 'GRIT', 'RPM / Cycling', 'Sprint', 'HIIT', 'Yoga', 'Pilates', 'Core', 'Dance', 'Stretch', 'Другое'];

/* Клубы Elixia в Финляндии (список редактируется в настройках) */
window.GYM_CLUBS = [
  'Elixia Kamppi', 'Elixia Ruoholahti', 'Elixia Pasila', 'Elixia Itäkeskus', 'Elixia Herttoniemi', 'Elixia Kannelmäki',
  'Elixia Vuosaari', 'Elixia Tapiola', 'Elixia Sello', 'Elixia Iso Omena', 'Elixia Tikkurila', 'Elixia Myyrmäki', 'Elixia Jumbo',
  'Elixia Tampere', 'Elixia Turku', 'Elixia Oulu', 'Elixia Jyväskylä', 'Elixia Lahti', 'Другой зал', 'Дома',
];
