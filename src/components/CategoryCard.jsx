import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CategoryCard = ({ category }) => {
  const { id, title, description, image, tripCount = 0, icon } = category;

  return (
    <Link
      to={`/trips?category=${id}`}
      className="group relative h-80 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/70 to-dark-900/30" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        {/* Icon */}
        <div className="w-16 h-16 bg-primary-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-primary-500/30 transform transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary-500/30">
          {icon ? (
            <span className="text-3xl">{icon}</span>
          ) : (
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-300 text-sm mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-primary-400 text-sm font-medium">
            {tripCount} Trips
          </span>
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 group-hover:bg-primary-500">
            <ArrowRight size={18} className="text-white" />
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-500/50 rounded-3xl transition-colors duration-300" />
    </Link>
  );
};

export default CategoryCard;
