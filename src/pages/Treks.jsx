import { useState } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import TrekCard from '../components/TrekCard';

const allTreks = [
  {
    id: '1',
    title: 'Himalayan Summit Expedition',
    location: 'Manali, Himachal Pradesh',
    price: 15999,
    duration: '7 Days',
    rating: 4.9,
    difficulty: 'Difficult',
    maxGroupSize: 12,
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800'
  },
  {
    id: '2',
    title: 'Valley of Flowers Trek',
    location: 'Uttarakhand',
    price: 8999,
    duration: '5 Days',
    rating: 4.8,
    difficulty: 'Moderate',
    maxGroupSize: 15,
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800'
  },
  {
    id: '3',
    title: 'Kedarkantha Winter Trek',
    location: 'Uttarakhand',
    price: 6999,
    duration: '4 Days',
    rating: 4.7,
    difficulty: 'Moderate',
    maxGroupSize: 20,
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'
  },
  {
    id: '4',
    title: 'Spiti Valley Adventure',
    location: 'Himachal Pradesh',
    price: 18999,
    duration: '8 Days',
    rating: 4.9,
    difficulty: 'Difficult',
    maxGroupSize: 10,
    image: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=800'
  },
  {
    id: '5',
    title: 'Goa Beach Camping',
    location: 'Goa',
    price: 4999,
    duration: '3 Days',
    rating: 4.5,
    difficulty: 'Easy',
    maxGroupSize: 25,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  },
  {
    id: '6',
    title: 'Rajasthan Desert Safari',
    location: 'Jaisalmer, Rajasthan',
    price: 7999,
    duration: '4 Days',
    rating: 4.6,
    difficulty: 'Easy',
    maxGroupSize: 20,
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800'
  },
  {
    id: '7',
    title: 'Chadar Trek',
    location: 'Leh Ladakh',
    price: 21999,
    duration: '9 Days',
    rating: 4.9,
    difficulty: 'Expert',
    maxGroupSize: 8,
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'
  },
  {
    id: '8',
    title: 'Tirthan Valley Trek',
    location: 'Himachal Pradesh',
    price: 7999,
    duration: '5 Days',
    rating: 4.7,
    difficulty: 'Moderate',
    maxGroupSize: 15,
    image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800'
  },
  {
    id: '9',
    title: 'Nag Tibba Weekend Trek',
    location: 'Uttarakhand',
    price: 3999,
    duration: '2 Days',
    rating: 4.5,
    difficulty: 'Easy',
    maxGroupSize: 25,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  }
];

const Treks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  const difficulties = ['All', 'Easy', 'Moderate', 'Difficult', 'Expert'];

  const filteredTreks = allTreks.filter(trek => {
    const matchesSearch = trek.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trek.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || trek.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const sortedTreks = [...filteredTreks].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="min-h-screen bg-dark-900 pt-20">
      {/* Header */}
      <div className="bg-dark-800 py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Explore Our <span className="text-gradient">Treks</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Discover handpicked trekking experiences for every skill level. From gentle walks to challenging expeditions.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-800 border-b border-dark-700 sticky top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search treks or destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container-custom py-12">
        <div className="mb-6">
          <p className="text-gray-400">
            Showing <span className="text-white font-semibold">{sortedTreks.length}</span> treks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedTreks.map(trek => (
            <TrekCard key={trek.id} trek={trek} />
          ))}
        </div>

        {sortedTreks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No treks found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Treks;
