import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Users } from 'lucide-react';

const TrekCard = ({ trek }) => {
  const {
    id,
    title,
    location,
    price,
    duration,
    rating,
    image,
    difficulty,
    maxGroupSize
  } = trek;

  const difficultyColor = {
    Easy: 'bg-green-500/20 text-green-400',
    Moderate: 'bg-yellow-500/20 text-yellow-400',
    Difficult: 'bg-red-500/20 text-red-400',
    Expert: 'bg-purple-500/20 text-purple-400'
  };

  return (
    <Link
      to={`/trek/${id}`}
      className="group block bg-dark-800 rounded-2xl overflow-hidden card-hover"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={image || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="gradient-overlay" />
        
        {/* Difficulty Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${difficultyColor[difficulty] || difficultyColor.Moderate}`}>
          {difficulty}
        </div>

        {/* Price */}
        <div className="absolute top-4 right-4 bg-dark-900/80 backdrop-blur-sm rounded-lg px-3 py-2">
          <span className="text-lg font-bold text-white">₹{price?.toLocaleString() || '0'}</span>
          <span className="text-xs text-gray-400">/person</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
          <MapPin size={16} className="text-primary-400" />
          <span>{location}</span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-4 border-t border-dark-700">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Clock size={16} className="text-primary-400" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} className="text-primary-400" />
              <span>Max {maxGroupSize}</span>
            </div>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white font-medium">{rating || '4.8'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TrekCard;
