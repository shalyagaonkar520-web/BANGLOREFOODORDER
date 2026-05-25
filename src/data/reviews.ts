export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

export const DUMMY_REVIEWS: Review[] = [
  {
    id: 'r-1',
    userName: 'Rahul Sharma',
    rating: 5,
    comment: 'Nice food, Oreo is good! Best milkshake I have had in a long time.',
    date: '2 days ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
  },
  {
    id: 'r-2',
    userName: 'Anjali Gupta',
    rating: 4,
    comment: 'The Biryani was aromatic and well-cooked. Delivery was super fast!',
    date: '1 week ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
  },
  {
    id: 'r-3',
    userName: 'Vikram Singh',
    rating: 5,
    comment: 'Great quality and hygiene. Highly recommended for daily orders.',
    date: '3 days ago',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop'
  }
];
