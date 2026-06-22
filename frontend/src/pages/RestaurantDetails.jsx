import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Star, Clock, MapPin, Info, Plus } from 'lucide-react';

const RestaurantDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setIsLoading(true);
        const { data: restData } = await api.get(`/restaurants/slug/${slug}`);
        setRestaurant(restData.data.restaurant);

        const { data: catData } = await api.get(`/menu/${restData.data.restaurant._id}/categories`);
        setCategories(catData.data.categories);
      } catch (error) {
        toast.error('Failed to load restaurant details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantData();
  }, [slug]);

  const handleAddToCart = (item) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      return;
    }
    dispatch(addToCart({ menuItemId: item._id, quantity: 1 }))
      .unwrap()
      .then(() => toast.success('Added to cart'))
      .catch((err) => toast.error(err));
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  if (!restaurant) return <div className="text-center py-20">Restaurant not found</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Restaurant Header */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full">
        <img
          src={restaurant.coverImage?.url || restaurant.logo?.url || 'https://via.placeholder.com/1200x400'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 lg:p-10 text-white max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2">{restaurant.name}</h1>
          <p className="text-lg md:text-xl text-gray-200 mb-4">{restaurant.cuisine.join(', ')}</p>
          <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-medium">
            <div className="flex items-center gap-1.5 bg-green-600/90 px-3 py-1 rounded-lg backdrop-blur-sm">
              <Star className="w-5 h-5 fill-white" />
              <span>{restaurant.rating?.average || 'New'}</span>
              <span className="text-green-100 font-normal">({restaurant.rating?.count || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-gray-300" />
              <span>{restaurant.kitchenCapacity?.slotDurationMinutes || 30} mins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-gray-300" />
              <span>{restaurant.address?.street}, {restaurant.address?.city}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Section */}
        <div className="lg:col-span-2 space-y-8">
          {categories.map((category) => (
            category.items && category.items.length > 0 && (
              <div key={category._id} id={`category-${category._id}`} className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-100">
                  {category.name}
                </h2>
                <div className="space-y-6">
                  {category.items.map((item) => (
                    <div key={item._id} className="card p-4 flex flex-col sm:flex-row gap-4 group">
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-4 h-4 rounded-sm flex items-center justify-center border ${item.foodType === 'veg' ? 'border-green-600' : 'border-red-600'}`}>
                                <span className={`w-2 h-2 rounded-full ${item.foodType === 'veg' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                              </span>
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{item.name}</h3>
                            </div>
                            <div className="text-lg font-semibold text-gray-700 mb-2">₹{item.price}</div>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      
                      <div className="relative w-full sm:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
                        <img
                          src={item.images?.[0]?.url || 'https://via.placeholder.com/150'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white text-primary-600 font-bold px-4 py-1.5 rounded-lg shadow-md border border-gray-100 hover:bg-gray-50 transition-all flex items-center gap-1 active:scale-95 text-sm"
                        >
                          <Plus size={16} /> Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" />
              Restaurant Info
            </h3>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Operating Hours</p>
                <div className="space-y-1">
                  {restaurant.operatingHours?.map((hours, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="capitalize">{hours.day}</span>
                      <span>{hours.isClosed ? 'Closed' : `${hours.open} - ${hours.close}`}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-900 mb-1">Contact Details</p>
                <p>{restaurant.phone}</p>
                <p>{restaurant.email}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-900 mb-1">Features</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {restaurant.features?.acceptsDelivery && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">Delivery</span>}
                  {restaurant.features?.acceptsPickup && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">Pickup</span>}
                  {restaurant.features?.acceptsDineIn && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">Dine-in</span>}
                  {restaurant.foodType === 'veg' && <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md">Pure Veg</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
