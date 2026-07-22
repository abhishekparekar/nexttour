import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Star, Users, Shield, CheckCircle, ArrowRight, Calendar } from 'lucide-react';

const formatItineraryText = (text) => {
  if (!text) return '';
  return text.replace(/([.,])(?!\d)\s*(?!$)/g, '$1\n');
};

const TrekDetail = () => {
  const { id } = useParams();

  const trek = {
    id,
    title: 'Himalayan Summit Expedition',
    location: 'Manali, Himachal Pradesh',
    price: 15999,
    duration: '7 Days',
    rating: 4.9,
    difficulty: 'Difficult',
    maxGroupSize: 12,
    minAge: 18,
    maxAltitude: '4500m',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200',
    highlights: [
      'Panoramic views of the Pir Panjal range',
      'Camping under star-filled skies',
      'Visit to ancient monasteries',
      'High-altitude lake trek',
      'Professional mountaineering equipment',
      'Expert local guides with 8+ years experience'
    ],
    included: ['All meals during the trek', 'Camping equipment', 'Sleeping bags and mats', 'First aid kit', 'Trekking permits', 'Transportation from Manali'],
    notIncluded: ['Personal expenses', 'Travel insurance', 'Flights/train to Manali', 'Personal trekking gear', 'Tips and gratuities'],
    itinerary: [
      { day: 1, title: 'Arrival in Manali', description: 'Meet at Manali, equipment check, and briefing.' },
      { day: 2, title: 'Manali to Base Camp', description: 'Scenic drive followed by initial acclimatization trek.' },
      { day: 3, title: 'Acclimatization Day', description: 'Short trek to nearby viewpoint. Training session.' },
      { day: 4, title: 'Base Camp to High Camp', description: 'Challenging ascent to high camp at 4000m.' },
      { day: 5, title: 'Summit Day', description: 'Early morning summit push. 360° Himalayan views.' },
      { day: 6, title: 'Descent to Base Camp', description: 'Return journey. Celebrate success with team.' },
      { day: 7, title: 'Return to Manali', description: 'Final descent and transfer back to Manali.' }
    ]
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-20">
      <div className="relative h-[60vh]">
        <img src={trek.image} alt={trek.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 container-custom">
          <div className="flex items-center gap-2 text-gray-300 text-sm mb-4">
            <Link to="/" className="hover:text-primary-400">Home</Link>
            <span>/</span>
            <Link to="/treks" className="hover:text-primary-400">Treks</Link>
            <span>/</span>
            <span className="text-white">{trek.title}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{trek.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-300">
            <div className="flex items-center gap-1"><MapPin size={18} className="text-primary-400" />{trek.location}</div>
            <div className="flex items-center gap-1"><Clock size={18} className="text-primary-400" />{trek.duration}</div>
            <div className="flex items-center gap-1"><Star size={18} className="text-yellow-400 fill-yellow-400" />{trek.rating}</div>
            <div className="flex items-center gap-1"><Users size={18} className="text-primary-400" />Max {trek.maxGroupSize}</div>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-dark-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">About This Trek</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Embark on an epic journey through the heart of the Himalayas. This expedition takes you through pristine valleys, across high-altitude passes, and to breathtaking viewpoints that will leave you speechless.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-700 rounded-xl p-4 text-center">
                  <div className="text-primary-400 font-semibold">{trek.maxAltitude}</div>
                  <div className="text-gray-500 text-sm">Max Altitude</div>
                </div>
                <div className="bg-dark-700 rounded-xl p-4 text-center">
                  <div className="text-primary-400 font-semibold">{trek.minAge}+</div>
                  <div className="text-gray-500 text-sm">Min Age</div>
                </div>
                <div className="bg-dark-700 rounded-xl p-4 text-center">
                  <div className="text-primary-400 font-semibold">{trek.difficulty}</div>
                  <div className="text-gray-500 text-sm">Difficulty</div>
                </div>
                <div className="bg-dark-700 rounded-xl p-4 text-center">
                  <div className="text-primary-400 font-semibold">Available</div>
                  <div className="text-gray-500 text-sm">Status</div>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trek.highlights.map((highlight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-dark-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Detailed Itinerary</h2>
              <div className="space-y-6">
                {trek.itinerary.map((day, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-400 font-bold">{day.day}</span>
                    </div>
                    <div className="flex-1 pb-6 border-b border-dark-700 last:border-0">
                      <h3 className="text-lg font-semibold text-white mb-2">{day.title}</h3>
                      <p className="text-gray-400 whitespace-pre-line">{formatItineraryText(day.description)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">What's Included</h3>
                <ul className="space-y-2">
                  {trek.included.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-400" />{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-dark-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Excluded</h3>
                <ul className="space-y-2">
                  {trek.notIncluded.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-400">
                      <span className="w-4 h-4 text-red-400">×</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-dark-800 rounded-2xl p-6 sticky top-28">
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">₹{trek.price.toLocaleString()}</span>
                <span className="text-gray-400">/person</span>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 bg-dark-700 rounded-lg p-3">
                  <Calendar className="w-5 h-5 text-primary-400" />
                  <input type="date" className="bg-transparent text-white flex-1 focus:outline-none" />
                </div>
                <div className="flex items-center gap-3 bg-dark-700 rounded-lg p-3">
                  <Users className="w-5 h-5 text-primary-400" />
                  <select className="bg-transparent text-white flex-1 focus:outline-none">
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Trekker' : 'Trekkers'}</option>)}
                  </select>
                </div>
              </div>
              <Link to={`/booking/${trek.id}`} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
                Book This Trek <ArrowRight size={20} />
              </Link>
              <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm justify-center">
                <Shield className="w-4 h-4 text-green-400" />
                Free cancellation up to 7 days before
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrekDetail;
