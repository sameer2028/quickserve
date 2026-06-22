import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRestaurants, setFilters } from '../store/restaurantSlice';
import { Search, MapPin, Star, Clock, ChevronRight } from 'lucide-react';

const Home = () => {
  const dispatch = useDispatch();
  const { restaurants, isLoading, filters } = useSelector((state) => state.restaurants);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    dispatch(fetchRestaurants(filters));
  }, [dispatch, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchInput, page: 1 }));
  };

  const handleCuisineFilter = (cuisine) => {
    const newCuisine = filters.cuisine === cuisine ? '' : cuisine;
    dispatch(setFilters({ cuisine: newCuisine, page: 1 }));
  };

  const cuisines = ['Italian', 'Chinese', 'Indian', 'Mexican', 'Fast Food', 'Healthy', 'Desserts', 'Beverages'];

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Section */}
      <div className="bg-primary-600 pt-16 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Skip the line. Order ahead.
          </h1>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Find the best restaurants nearby, order your food before you arrive, and dine in or pick up instantly.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-32 py-4 border-transparent rounded-2xl leading-5 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-500/30 sm:text-lg transition-all"
              placeholder="Search for restaurants, cuisines, or dishes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl px-6 transition-colors shadow-sm flex items-center gap-2"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Categories */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10 overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => handleCuisineFilter(cuisine)}
                className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  filters.cuisine === cuisine
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant Grid */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Popular Restaurants</h2>
            <p className="text-gray-500 mt-1">Explore top-rated places around you</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="card animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5 space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : restaurants?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map((restaurant) => (
              <Link to={`/restaurant/${restaurant.slug}`} key={restaurant._id} className="group card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={restaurant.coverImage?.url || restaurant.logo?.url || 'https://via.placeholder.com/400x300?text=Restaurant'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {restaurant.offers?.length > 0 && (
                    <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {restaurant.offers[0].title}
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 font-bold text-sm">
                    <span className="text-gray-800">{restaurant.rating?.average || 'New'}</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {restaurant.name}
                    </h3>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-4 line-clamp-1">
                    {restaurant.cuisine.join(', ')}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{restaurant.kitchenCapacity?.slotDurationMinutes || 30} mins prep</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      <span>₹{restaurant.avgCostForTwo} for two</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-medium">
                    <span className="text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Menu <ChevronRight className="w-4 h-4" />
                    </span>
                    <div className="flex gap-2">
                      {restaurant.features?.acceptsDineIn && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Dine-in</span>}
                      {restaurant.features?.acceptsPickup && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Pickup</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any restaurants matching your search criteria. Try adjusting your filters or search terms.
            </p>
            <button 
              onClick={() => {
                setSearchInput('');
                dispatch(clearFilters());
              }} 
              className="mt-6 btn-secondary"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
