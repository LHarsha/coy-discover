import { CURRENT_USER, CURRENT_USER_ID } from "./me";

export { CURRENT_USER, CURRENT_USER_ID };

export interface SeedProfile {
  id: string;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  location: string;
  interests: string[];
  /** Seeded users who have already liked the current user, so matches can happen in a demo. */
  likesCurrentUser?: boolean;
}

const women = (n: number) => `https://randomuser.me/api/portraits/women/${n}.jpg`;
const men = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;

export const SEED_PROFILES: SeedProfile[] = [
  { id: "u01", name: "Ananya", age: 21, photoUrl: women(44), bio: "Filter coffee loyalist. Will judge your playlist.", location: "Christ University, Bengaluru", interests: ["Indie music", "Coffee", "Photography"], likesCurrentUser: true },
  { id: "u02", name: "Rohan", age: 23, photoUrl: men(12), bio: "Weekend trekker, weekday debugger.", location: "IIT Bombay", interests: ["Trekking", "Coding", "Chess"] },
  { id: "u03", name: "Meera", age: 22, photoUrl: women(68), bio: "Bharatanatyam since I was six. Ask me about sitcoms instead.", location: "Chennai", interests: ["Dance", "Sitcoms", "Baking"] },
  { id: "u04", name: "Kabir", age: 24, photoUrl: men(45), bio: "Building a startup nobody understands yet.", location: "HSR Layout, Bengaluru", interests: ["Startups", "Running", "Podcasts"], likesCurrentUser: true },
  { id: "u05", name: "Ishita", age: 20, photoUrl: women(21), bio: "Design student. My sketchbook has more pages than my notes.", location: "NID Ahmedabad", interests: ["Design", "Art", "Thrifting"] },
  { id: "u06", name: "Aarav", age: 22, photoUrl: men(76), bio: "Gym in the morning, Valorant at night.", location: "Delhi University", interests: ["Fitness", "Gaming", "Anime"] },
  { id: "u07", name: "Diya", age: 23, photoUrl: women(17), bio: "Looking for someone to split momos with.", location: "Hauz Khas, Delhi", interests: ["Food", "Travel", "Books"] },
  { id: "u08", name: "Vihaan", age: 21, photoUrl: men(23), bio: "Guitar, bad puns, good chai.", location: "Manipal Institute of Technology", interests: ["Guitar", "Comedy", "Chai"], likesCurrentUser: true },
  { id: "u09", name: "Saanvi", age: 22, photoUrl: women(90), bio: "Marathon trainee. Currently at 10k.", location: "Pune", interests: ["Running", "Yoga", "Cooking"] },
  { id: "u10", name: "Arjun", age: 25, photoUrl: men(54), bio: "Product manager by day, amateur astronomer by night.", location: "Gurugram", interests: ["Astronomy", "Product", "Cycling"] },
  { id: "u11", name: "Tara", age: 21, photoUrl: women(33), bio: "Poetry open mics and long metro rides.", location: "Jadavpur University, Kolkata", interests: ["Poetry", "Theatre", "Music"] },
  { id: "u12", name: "Reyansh", age: 22, photoUrl: men(67), bio: "Cricket on Sundays, non-negotiable.", location: "BITS Pilani", interests: ["Cricket", "Movies", "Finance"] },
  { id: "u13", name: "Kavya", age: 24, photoUrl: women(57), bio: "Doctor in training. Sleep is a myth.", location: "AIIMS Delhi", interests: ["Medicine", "Netflix", "Dogs"], likesCurrentUser: true },
  { id: "u14", name: "Aditya", age: 23, photoUrl: men(8), bio: "Ex-quizzer. I know too many useless facts.", location: "Hyderabad", interests: ["Quizzing", "History", "Football"] },
  { id: "u15", name: "Nisha", age: 22, photoUrl: women(8), bio: "Plant mom of 14. They all have names.", location: "Indiranagar, Bengaluru", interests: ["Plants", "Pottery", "Jazz"] },
  { id: "u16", name: "Dhruv", age: 21, photoUrl: men(36), bio: "Film club president. Yes, I have opinions on Nolan.", location: "St. Xavier's College, Mumbai", interests: ["Films", "Writing", "Photography"] },
  { id: "u17", name: "Pooja", age: 23, photoUrl: women(79), bio: "Data scientist who still counts on her fingers.", location: "Noida", interests: ["Data", "Badminton", "K-dramas"] },
  { id: "u18", name: "Ishaan", age: 24, photoUrl: men(91), bio: "Scuba certified. Mountains are fine too.", location: "Goa", interests: ["Scuba", "Surfing", "Travel"], likesCurrentUser: true },
  { id: "u19", name: "Riya", age: 20, photoUrl: women(26), bio: "Stand-up comedy fan, sit-down comedy performer.", location: "Symbiosis, Pune", interests: ["Comedy", "Debate", "Food"] },
  { id: "u20", name: "Kunal", age: 22, photoUrl: men(19), bio: "Home chef. My biryani has a fan club.", location: "Lucknow", interests: ["Cooking", "Music", "Cricket"] },
  { id: "u21", name: "Aisha", age: 23, photoUrl: women(62), bio: "Architect. I notice your ceiling before I notice you.", location: "CEPT University, Ahmedabad", interests: ["Architecture", "Sketching", "Museums"] },
  { id: "u22", name: "Siddharth", age: 25, photoUrl: men(83), bio: "Consultant learning to say no to slides on weekends.", location: "Mumbai", interests: ["Tennis", "Wine", "Books"] },
  { id: "u23", name: "Zoya", age: 21, photoUrl: women(39), bio: "Taylor Swift lyricist in another life.", location: "Ashoka University", interests: ["Music", "Writing", "Psychology"], likesCurrentUser: true },
  { id: "u24", name: "Yash", age: 22, photoUrl: men(28), bio: "Robotics club. My robot has better social skills than me.", location: "VIT Vellore", interests: ["Robotics", "Gaming", "Sci-fi"] },
  { id: "u25", name: "Sneha", age: 24, photoUrl: women(50), bio: "Weekend baker, weekday lawyer.", location: "NLSIU, Bengaluru", interests: ["Law", "Baking", "Hiking"] },
  { id: "u26", name: "Neel", age: 23, photoUrl: men(61), bio: "Sneaker collector. 27 pairs and counting.", location: "Koramangala, Bengaluru", interests: ["Sneakers", "Basketball", "Hip-hop"] },
  { id: "u27", name: "Anika", age: 22, photoUrl: women(12), bio: "Learning Japanese, mostly for the anime.", location: "Hyderabad", interests: ["Anime", "Languages", "Ramen"] },
  { id: "u28", name: "Rahul", age: 24, photoUrl: men(40), bio: "Photographer. I'll make you look good, promise.", location: "Jaipur", interests: ["Photography", "Heritage walks", "Travel"], likesCurrentUser: true },
  { id: "u29", name: "Myra", age: 21, photoUrl: women(85), bio: "Economics major with a soft spot for street food.", location: "SRCC, Delhi", interests: ["Economics", "Food", "Dance"] },
  { id: "u30", name: "Varun", age: 23, photoUrl: men(70), bio: "Swimmer. Early mornings are my thing, sorry.", location: "Chandigarh", interests: ["Swimming", "Fitness", "Podcasts"] },
  { id: "u31", name: "Prisha", age: 22, photoUrl: women(3), bio: "Volunteering at animal shelters on Saturdays.", location: "Kochi", interests: ["Animals", "Volunteering", "Reading"] },
  { id: "u32", name: "Advait", age: 22, photoUrl: men(5), bio: "Carnatic violin and Formula 1. Weird combo, I know.", location: "IIT Madras", interests: ["Violin", "F1", "Coding"] },
];

/**
 * Deterministic shuffle so the feed order looks random but is stable across reloads.
 * Without it, an observer could infer something from where profiles sit in the deck.
 */
export function feedRanks(ids: string[], seed = 20260417): Map<string, number> {
  const order = [...ids];
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return new Map(order.map((id, rank) => [id, rank]));
}
