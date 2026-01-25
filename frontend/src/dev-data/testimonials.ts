export interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatarUrl: string;
  rating: number;
  content: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "عمر حسن",
    role: "طالب",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar&gender=male",
    rating: 5,
    content:
      "الحمد لله، هذه المنصة عمقت فهمي للإسلام. الدورات شاملة والمعلمون رائعون وأوصي بها لكل من يبحث عن علم نافع.",
  },
  {
    id: 2,
    name: "سارة أحمد",
    role: "ولي أمر",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&gender=female",
    rating: 5,
    content:
      "تجربة ممتازة لابني في حفظ جزء عم. الشيخ يتميز بالصبر والأسلوب التربوي الذي حبب الطفل في الحلقة.",
  },
  {
    id: 3,
    name: "خالد محمود",
    role: "طالب",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Khaled&gender=male",
    rating: 4.5,
    content:
      "دورة التجويد المتقدم كانت أكثر من رائعة. الشرح مبسط وعملي، وقد تحسنت تلاوتي بشكل ملحوظ بفضل الله.",
  },
  {
    id: 4,
    name: "عمر حسن",
    role: "طالب",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar&gender=male",
    rating: 5,
    content:
      "الحمد لله، هذه المنصة عمقت فهمي للإسلام. الدورات شاملة والمعلمون رائعون وأوصي بها لكل من يبحث عن علم نافع.",
  },
  {
    id: 5,
    name: "سارة أحمد",
    role: "ولي أمر",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&gender=female",
    rating: 5,
    content:
      "تجربة ممتازة لابني في حفظ جزء عم. الشيخ يتميز بالصبر والأسلوب التربوي الذي حبب الطفل في الحلقة.",
  },
  {
    id: 6,
    name: "خالد محمود",
    role: "طالب",
    avatarUrl:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Khaled&gender=male",
    rating: 4.5,
    content:
      "دورة التجويد المتقدم كانت أكثر من رائعة. الشرح مبسط وعملي، وقد تحسنت تلاوتي بشكل ملحوظ بفضل الله.",
  },
];
