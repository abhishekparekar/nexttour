import { useState, useEffect } from 'react';
import { Mountain, Tent, Calendar, Compass, Loader2 } from 'lucide-react';
import { subscribeToCategories } from '../firebase';

const categoryIcons = {
  himalayan: Mountain,
  camping: Tent,
  weekend: Calendar,
  winter: Compass,
  trekking: Compass,
  expedition: Mountain
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Categories: Setting up subscription...');
    const unsubscribe = subscribeToCategories((data) => {
      console.log('Categories: Data received:', data);
      if (data.length > 0) {
        setCategories(data);
      } else {
        // Fallback to default categories
        setCategories([
          { id: 'himalayan', name: 'Himalayan Treks', description: 'Conquer the mighty Himalayas', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600' },
          { id: 'camping', name: 'Camping Adventures', description: 'Camp under the stars', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600' },
          { id: 'weekend', name: 'Weekend Trips', description: 'Quick escapes nearby', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600' },
          { id: 'winter', name: 'Winter Adventures', description: 'Snow and ice experiences', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600' }
        ]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <section className="section-padding bg-dark-800">
        <div className="container-custom flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-dark-800">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium mb-4">
            Adventure Types
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Choose Your
            <span className="block text-gradient">Adventure Style</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Whether you seek solitude or excitement, we have the perfect adventure waiting for you.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const IconComponent = categoryIcons[category.id] || Mountain;
            return (
              <div
                key={category.id || index}
                className="group relative bg-dark-700 rounded-2xl overflow-hidden card-hover cursor-pointer"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={category.image || category.icon || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600'}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 bg-[#e5e5e5]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/70 to-dark-900/30" />
                </div>

                {/* Content */}
                <div className="relative p-6 min-h-[280px] flex flex-col justify-end">
                  {/* Icon */}
                  <div className="w-14 h-14 bg-primary-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 border border-primary-500/30">
                    <IconComponent className="w-7 h-7 text-primary-400" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">
                    {category.name || category.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {category.description}
                  </p>
                  {category.count && (
                    <div className="text-primary-400 text-sm font-medium">
                      {category.count} Treks Available
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
