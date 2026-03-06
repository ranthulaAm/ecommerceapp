import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/lib/utils';
import { Loader2, Package, CheckCircle, AlertCircle, Download, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Watermark } from '@/components/Watermark';

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'orders'), where('user_id', '==', user.id));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      // Sort manually since we can't easily order by created_at with a where clause without an index
      ordersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleApprove = async () => {
    if (!selectedOrder) return;
    setReviewing(true);
    try {
      await updateDoc(doc(db, 'orders', String(selectedOrder.id)), {
        status: 'completed',
        tracking_status: 'Completed'
      });
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Failed to approve order', error);
    } finally {
      setReviewing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedOrder) return;
    setReviewing(true);
    try {
      await updateDoc(doc(db, 'orders', String(selectedOrder.id)), {
        status: 'in_progress',
        tracking_status: `Revision Requested: ${revisionComment || 'Changes requested'}`
      });
      setSelectedOrder(null);
      setRevisionComment('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to request revision', error);
    } finally {
      setReviewing(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setCancellingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        tracking_status: 'Cancelled by user'
      });
      await fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
        <Link to="/" className="text-green-600 font-medium hover:underline">Browse Services</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 items-start">
            <img src={order.service_image} alt="" className="w-24 h-16 object-cover rounded bg-gray-100" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900">{order.service_title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                  ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                    order.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              {order.tracking_status && (
                <div className="mt-2 text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded inline-block">
                  Status: {order.tracking_status}
                </div>
              )}
              {(order.courier_service || order.tracking_id || (order.delivery?.type === 'link')) && (
                <div className="mt-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  <p className="font-semibold text-xs uppercase text-gray-500 mb-1">Shipping Details</p>
                  {order.courier_service && <p>Courier: <span className="font-medium">{order.courier_service}</span></p>}
                  {order.tracking_id && <p>Tracking ID: <span className="font-medium">{order.tracking_id}</span></p>}
                  {order.delivery?.type === 'link' && (
                    <p className="mt-1">
                      Link: <a href={order.delivery.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium break-all">{order.delivery.file_url}</a>
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">Ordered on {new Date(order.created_at).toLocaleDateString()}</p>
              <p className="font-medium text-gray-900 mt-2">LKR {order.price_at_order}</p>
              
              {order.status === 'pending' && (
                <div className="mt-3">
                  <button 
                    onClick={() => handleCancelOrder(String(order.id))}
                    disabled={cancellingId === String(order.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {cancellingId === String(order.id) ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-3 w-3" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Order'
                    )}
                  </button>
                </div>
              )}

              {order.status === 'delivered' && (
                <div className="mt-3">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Review Delivery
                  </button>
                </div>
              )}
              
              {order.status === 'completed' && order.delivery && (
                <div className="mt-3">
                  <a 
                    href={order.delivery.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {order.delivery.type === 'link' ? (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {order.delivery.type === 'link' ? 'Open Link' : 'Download Delivery'}
                  </a>
                  {order.delivery.type === 'link' && (
                    <p className="mt-1 text-xs text-gray-500 break-all select-all">
                      {order.delivery.file_url}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedOrder && selectedOrder.delivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Review Delivery</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Message from seller:</p>
              <div className="bg-gray-50 p-3 rounded-md text-gray-700 mb-4">
                {selectedOrder.delivery.message}
              </div>
              
              <div className="relative border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[300px]">
                <Watermark>
                  {selectedOrder.delivery.type === 'video' ? (
                    <video src={selectedOrder.delivery.file_url} controls className="max-w-full max-h-[500px]" />
                  ) : selectedOrder.delivery.type === 'link' ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                       <p className="mb-4 text-lg font-medium text-gray-900">External Delivery Link</p>
                       <a 
                         href={selectedOrder.delivery.file_url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-blue-600 hover:underline break-all"
                       >
                         {selectedOrder.delivery.file_url}
                       </a>
                       <p className="mt-2 text-sm text-gray-500">Click to view delivered files</p>
                    </div>
                  ) : (
                    <img src={selectedOrder.delivery.file_url} alt="Delivery" className="max-w-full max-h-[500px] object-contain" />
                  )}
                </Watermark>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Revision (Optional)</label>
                <textarea 
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  placeholder="Describe changes needed..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={handleRequestRevision}
                  disabled={reviewing}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {reviewing ? <Loader2 className="animate-spin h-4 w-4" /> : 'Request Revision'}
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={reviewing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {reviewing ? <Loader2 className="animate-spin h-4 w-4" /> : 'Approve & Download'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
