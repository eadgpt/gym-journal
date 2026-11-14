// Built-in exercise list per body area.
// img = picture folder in the public-domain free-exercise-db (github.com/yuhonas/free-exercise-db)
// type: "reps" = weight × reps, "body" = reps (weight optional), "time" = seconds, "cardio" = minutes
window.AREAS = [
  { id: "chest", name: "Chest", emoji: "🫁", ex: [
    { n: "Barbell Bench Press", img: "Barbell_Bench_Press_-_Medium_Grip", eq: "Barbell", t: "reps", h: "Lie flat, lower bar to mid-chest, press up. Feet planted, shoulder blades squeezed." },
    { n: "Dumbbell Bench Press", img: "Dumbbell_Bench_Press", eq: "Dumbbells · flat bench", t: "reps", h: "Lie flat on the bench, dumbbells at chest height, palms facing your feet. Press up until your arms are straight, then lower slowly." },
    { n: "Incline Dumbbell Press", img: "Incline_Dumbbell_Press", eq: "Dumbbells", t: "reps", h: "Bench at 30°. Press dumbbells up and slightly in. Targets upper chest." },
    { n: "Machine Chest Press", img: "Machine_Bench_Press", eq: "Machine", t: "reps", h: "Handles at chest height. Push out smooth, slow on the way back." },
    { n: "Cable Fly", img: "Cable_Crossover", eq: "Cable", t: "reps", h: "Slight bend in elbows, hug a big tree. Squeeze chest at the middle." },
    { n: "Push-up", img: "Pushups", eq: "Bodyweight", t: "body", h: "Hands under shoulders, body straight. Chest to floor, push up." },
    { n: "Chest Dip", img: "Dips_-_Chest_Version", eq: "Dip bars", t: "body", h: "Lean forward a little, lower until shoulders below elbows, press up." }
  ]},
  { id: "back", name: "Back", emoji: "🔙", ex: [
    { n: "Lat Pulldown", img: "Wide-Grip_Lat_Pulldown", eq: "Cable", t: "reps", h: "Wide grip, pull bar to upper chest, elbows down and back." },
    { n: "Pull-up", img: "Pullups", eq: "Bar", t: "body", h: "Hang, pull chin over bar. Use assist machine or band if needed." },
    { n: "Seated Cable Row", img: "Seated_Cable_Rows", eq: "Cable", t: "reps", h: "Sit tall, pull handle to belly, squeeze shoulder blades together." },
    { n: "One-arm Dumbbell Row", img: "One-Arm_Dumbbell_Row", eq: "Dumbbell", t: "reps", h: "Knee and hand on bench, row dumbbell to hip. Back flat." },
    { n: "Barbell Row", img: "Bent_Over_Barbell_Row", eq: "Barbell", t: "reps", h: "Hinge forward, back flat, row bar to lower ribs." },
    { n: "Face Pull", img: "Face_Pull", eq: "Cable", t: "reps", h: "Rope at face height, pull to forehead, elbows high. Great for posture." }
  ]},
  { id: "shoulders", name: "Shoulders", emoji: "🤷", ex: [
    { n: "Overhead Press", img: "Standing_Military_Press", eq: "Barbell", t: "reps", h: "Stand tall, press bar from collarbone to overhead. Squeeze glutes." },
    { n: "Seated Dumbbell Press", img: "Seated_Dumbbell_Press", eq: "Dumbbells", t: "reps", h: "Back supported, press dumbbells up from ear height." },
    { n: "Lateral Raise", img: "Side_Lateral_Raise", eq: "Dumbbells", t: "reps", h: "Raise arms out to sides to shoulder height. Light weight, slow." },
    { n: "Cable Lateral Raise", img: "Cable_Seated_Lateral_Raise", eq: "Cable", t: "reps", h: "One arm, cable from low. Raise out to side, steady tension." },
    { n: "Rear Delt Fly", img: "Seated_Bent-Over_Rear_Delt_Raise", eq: "Machine / Dumbbells", t: "reps", h: "Arms out wide, pull back. Hits back of shoulders." },
    { n: "Arnold Press", img: "Arnold_Dumbbell_Press", eq: "Dumbbells", t: "reps", h: "Start palms facing you, rotate out as you press up." }
  ]},
  { id: "arms", name: "Arms", emoji: "💪", ex: [
    { n: "Barbell Curl", img: "Barbell_Curl", eq: "Barbell / EZ bar", t: "reps", h: "Elbows pinned to sides, curl up, lower slow." },
    { n: "Hammer Curl", img: "Hammer_Curls", eq: "Dumbbells", t: "reps", h: "Palms facing in, curl up. Builds forearms and arm thickness." },
    { n: "Preacher Curl", img: "Preacher_Curl", eq: "Machine / EZ bar", t: "reps", h: "Arms on pad, full stretch at bottom, squeeze at top." },
    { n: "Triceps Pushdown", img: "Triceps_Pushdown", eq: "Cable", t: "reps", h: "Elbows at sides, push rope or bar down until arms straight." },
    { n: "Overhead Triceps Extension", img: "Cable_Rope_Overhead_Triceps_Extension", eq: "Cable / Dumbbell", t: "reps", h: "Weight behind head, extend arms up. Deep stretch." },
    { n: "Close-grip Bench Press", img: "Close-Grip_Barbell_Bench_Press", eq: "Barbell", t: "reps", h: "Hands shoulder-width, elbows tucked. Heavy triceps work." }
  ]},
  { id: "legs", name: "Legs", emoji: "🦵", ex: [
    { n: "Back Squat", img: "Barbell_Full_Squat", eq: "Barbell", t: "reps", h: "Bar on upper back, sit down between heels, knees track toes, stand up." },
    { n: "Leg Press", img: "Leg_Press", eq: "Machine", t: "reps", h: "Feet shoulder-width, lower until knees ~90°, press. Don't lock knees." },
    { n: "Romanian Deadlift", img: "Romanian_Deadlift", eq: "Barbell / Dumbbells", t: "reps", h: "Soft knees, push hips back, bar slides down legs. Feel hamstrings." },
    { n: "Walking Lunge", img: "Dumbbell_Lunges", eq: "Dumbbells", t: "reps", h: "Big step, back knee near floor, push through front heel." },
    { n: "Leg Extension", img: "Leg_Extensions", eq: "Machine", t: "reps", h: "Straighten legs, squeeze thighs at top, lower slow." },
    { n: "Leg Curl", img: "Lying_Leg_Curls", eq: "Machine", t: "reps", h: "Curl heels toward glutes, control on the way back." },
    { n: "Calf Raise", img: "Standing_Calf_Raises", eq: "Machine / Smith", t: "reps", h: "Full stretch at bottom, rise onto toes, pause at top." }
  ]},
  { id: "glutes", name: "Glutes", emoji: "🍑", ex: [
    { n: "Hip Thrust", img: "Barbell_Hip_Thrust", eq: "Barbell / Machine", t: "reps", h: "Upper back on bench, drive hips up, squeeze glutes, chin tucked." },
    { n: "Bulgarian Split Squat", img: "Split_Squat_with_Dumbbells", eq: "Dumbbells", t: "reps", h: "Back foot on bench, lower front leg, lean slightly forward." },
    { n: "Sumo Deadlift", img: "Sumo_Deadlift", eq: "Barbell / Kettlebell", t: "reps", h: "Wide stance, toes out, grip inside knees, stand tall." },
    { n: "Cable Kickback", img: "Glute_Kickback", eq: "Cable", t: "reps", h: "Ankle strap, kick leg straight back, squeeze glute." },
    { n: "Glute Bridge", img: "Butt_Lift_Bridge", eq: "Bodyweight", t: "body", h: "Lie on back, feet flat, lift hips, hold 1 second at top." }
  ]},
  { id: "core", name: "Core", emoji: "🎯", ex: [
    { n: "Plank", img: "Plank", eq: "Bodyweight", t: "time", h: "Forearms down, body straight head to heels, brace like being punched." },
    { n: "Hanging Knee Raise", img: "Hanging_Leg_Raise", eq: "Bar", t: "body", h: "Hang, lift knees to chest, no swinging." },
    { n: "Cable Crunch", img: "Cable_Crunch", eq: "Cable", t: "reps", h: "Kneel, rope by head, crunch down rounding spine." },
    { n: "Dead Bug", img: "Dead_Bug", eq: "Bodyweight", t: "body", h: "On back, opposite arm and leg out slow, lower back pressed down." },
    { n: "Pallof Press", img: "Pallof_Press", eq: "Cable", t: "reps", h: "Stand side-on to cable, press handle straight out, resist twisting." }
  ]},
  { id: "cardio", name: "Cardio", emoji: "❤️", ex: [
    { n: "Incline Treadmill Walk", img: "Walking_Treadmill", eq: "Treadmill", t: "cardio", h: "Incline 8–12, brisk walk. Easy on joints, good fat burn." },
    { n: "Stationary Bike", img: "Bicycling_Stationary", eq: "Bike", t: "cardio", h: "Steady pace or intervals: 30s hard / 90s easy." },
    { n: "Rowing Machine", img: "Rowing_Stationary", eq: "Rower", t: "cardio", h: "Legs, then lean back, then arms. Reverse on return." },
    { n: "Stair Climber", img: "Stairmaster", eq: "Machine", t: "cardio", h: "Steady steps, light grip on rails, stand tall." },
    { n: "Jump Rope", img: "Rope_Jumping", eq: "Rope", t: "cardio", h: "Small hops on balls of feet, wrists turn the rope." }
  ]}
];
