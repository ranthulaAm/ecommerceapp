import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Star, Check, ArrowLeft, X } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function ServiceDetailsPage() {
  const { id } = useParams();
  const { services, loading } = useServices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    name: '',
    mobile: '',
    address: ''
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Handle both string and number IDs
  const service = services.find(s => String(s.id) === id);

  if (!service) {
    return <div className="text-center py-20">Service not found</div>;
  }

  const images = service.images && service.images.length > 0 ? service.images : [service.image_url];

  const handleOrderClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setOrderDetails({
      name: user.name || '',
      mobile: user.mobile || '',
      address: ''
    });
    setIsOrderModalOpen(true);
  };

  const submitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setOrdering(true);
    try {
      await addDoc(collection(db, 'orders'), {
        service_id: service.id,
        user_id: user!.id,
        price_at_order: service.finalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
        service_title: service.title,
        service_image: service.image_url,
        user_name: orderDetails.name,
        user_mobile: orderDetails.mobile,
        user_address: orderDetails.address
      });

      setIsOrderModalOpen(false);
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error(error);
      alert('Error placing order');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">{service.title}</h1>
          
          <div className="flex items-center gap-4">
            <img src={service.seller_avatar || "https://ui-avatars.com/api/?name=" + service.seller_name} alt={service.seller_name} className="w-12 h-12 rounded-full" />
            <div>
              <p className="font-bold text-gray-900">{service.seller_name}</p>
              <div className="flex items-center gap-1 text-yellow-500 text-sm">
                <Star className="w-4 h-4 fill-current" />
                <span>{service.rating}</span>
                <span className="text-gray-500">({service.review_count} reviews)</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
              <img src={images[activeImage]} alt={service.title} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 ${activeImage === idx ? 'border-green-500' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">About This Service</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{service.description}</p>
          </div>
        </div>

        {/* Sidebar / Pricing Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-24">
            <div className="flex justify-between items-end mb-6">
              <span className="text-gray-500 font-medium">Standard Package</span>
              <div className="text-right">
                {service.discount && (
                  <p className="text-sm text-gray-400 line-through">LKR {service.price}</p>
                )}
                <p className="text-2xl font-bold text-gray-900">LKR {service.finalPrice}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6 text-sm">
              Complete service package including all standard features and revisions.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> 3 Days Delivery
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> 2 Revisions
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> Source Files
              </div>
            </div>

            <button
              onClick={handleOrderClick}
              disabled={ordering}
              className="w-full bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              Continue to Order
            </button>
            
            {!user && (
              <p className="text-xs text-center text-gray-500 mt-4">
                You need to sign in to place an order
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Order Details</h2>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={submitOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={orderDetails.name}
                  onChange={e => setOrderDetails({...orderDetails, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input 
                  required
                  type="text" 
                  value={orderDetails.mobile}
                  onChange={e => setOrderDetails({...orderDetails, mobile: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                <textarea 
                  required
                  value={orderDetails.address}
                  onChange={e => setOrderDetails({...orderDetails, address: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter your delivery address..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={ordering}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  {ordering ? <Loader2 className="animate-spin w-4 h-4" /> : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
