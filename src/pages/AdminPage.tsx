import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { useServices, useDiscounts } from '@/hooks/useApi';
import { Loader2, Plus, Trash2, Tag, Percent, ToggleLeft, ToggleRight, Edit2, ShoppingBag, Upload, X } from 'lucide-react';
import { cn, Order } from '@/lib/utils';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export function AdminPage() {
  const { services, loading: servicesLoading, refetch: refetchServices } = useServices();
  const { discounts, loading: discountsLoading, refetch: refetchDiscounts } = useDiscounts();
  const [activeTab, setActiveTab] = useState<'services' | 'discounts' | 'orders'>('services');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Service Form State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    price: '',
    category: 'General',
    images: [] as File[],
    existing_images: [] as string[]
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Discount Form State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    type: 'percentage',
    value: '',
    service_id: ''
  });

  // Delivery Form State
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [deliveryLink, setDeliveryLink] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');

  // Order Details Modal State
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [courierService, setCourierService] = useState('');

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'service' | 'discount', id: string } | null>(null);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewService(prev => ({
        ...prev,
        images: [...prev.images, ...Array.from(e.target.files!)]
      }));
    }
  };

  const removeNewImage = (index: number) => {
    setNewService(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeExistingImage = (index: number) => {
    setNewService(prev => ({
      ...prev,
      existing_images: prev.existing_images.filter((_, i) => i !== index)
    }));
  };

  const handleCreateOrUpdateService = async (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);
    try {
      let imageUrls: string[] = [...newService.existing_images];

      // Upload new images
      if (newService.images.length > 0) {
        const totalFiles = newService.images.length;
        for (let i = 0; i < totalFiles; i++) {
          const file = newService.images[i];
          const storageRef = ref(storage, `services/${Date.now()}_${file.name}`);
          const uploadTask = uploadBytesResumable(storageRef, file);

          await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed', 
              (snapshot) => {
                const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                // Calculate overall progress: (completed files + current file progress) / total files
                const totalProgress = ((i + (fileProgress / 100)) / totalFiles) * 100;
                setUploadProgress(Math.round(totalProgress));
              }, 
              (error) => reject(error), 
              () => resolve()
            );
          });

          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      const serviceData = {
        title: newService.title,
        description: newService.description,
        price: parseFloat(newService.price),
        category: newService.category,
        images: imageUrls,
        image_url: imageUrls[0] || '',
        seller_name: 'Admin', // Default
        seller_avatar: '',
        rating: 5, // Default
        review_count: 0
      };

      if (editingServiceId) {
        await updateDoc(doc(db, 'services', editingServiceId), serviceData);
      } else {
        await addDoc(collection(db, 'services'), serviceData);
      }

      setIsServiceModalOpen(false);
      setEditingServiceId(null);
      setNewService({ title: '', description: '', price: '', category: 'General', images: [], existing_images: [] });
      refetchServices();
    } catch (error) {
      console.error('Failed to save service', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditService = (service: any) => {
    setEditingServiceId(service.id);
    setNewService({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      category: service.category,
      images: [],
      existing_images: service.images || (service.image_url ? [service.image_url] : [])
    });
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      refetchServices();
    } catch (error) {
      console.error('Failed to delete service', error);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    if (status === 'cancelled') {
      if (!window.confirm('Are you sure you want to cancel this order?')) {
        return;
      }
    }
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order', error);
    }
  };

  const handleUpdateTrackingStatus = async (id: string, trackingStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { tracking_status: trackingStatus });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update tracking', error);
    }
  };

  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrderDetails(order);
    setTrackingId(order.tracking_id || '');
    setCourierService(order.courier_service || '');
    setIsOrderDetailsModalOpen(true);
  };

  const handleSaveTrackingInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrderDetails) return;
    try {
      await updateDoc(doc(db, 'orders', String(selectedOrderDetails.id)), {
        tracking_id: trackingId,
        courier_service: courierService
      });
      setIsOrderDetailsModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update tracking info', error);
    }
  };

  const handleCreateDiscount = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'discounts'), {
        ...newDiscount,
        value: parseFloat(newDiscount.value),
        service_id: newDiscount.service_id ? newDiscount.service_id : null,
        active: true
      });
      setIsDiscountModalOpen(false);
      setNewDiscount({ name: '', type: 'percentage', value: '', service_id: '' });
      refetchDiscounts();
      refetchServices();
    } catch (error) {
      console.error('Failed to create discount', error);
    }
  };

  const handleToggleDiscount = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'discounts', id), { active: !currentStatus });
      refetchDiscounts();
      refetchServices();
    } catch (error) {
      console.error('Failed to toggle discount', error);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'discounts', id));
      refetchDiscounts();
      refetchServices();
    } catch (error) {
      console.error('Failed to delete discount', error);
    }
  };

  if (servicesLoading || discountsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  const handleDeliverOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    
    // Require either a file OR a link
    if (!deliveryFile && !deliveryLink) {
      alert("Please provide either a file or an external link.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let url = '';
      let type: 'image' | 'video' | 'link' = 'link';

      if (deliveryFile) {
        const storageRef = ref(storage, `deliveries/${selectedOrderId}/${Date.now()}_${deliveryFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, deliveryFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            }, 
            (error) => {
              console.error('Upload failed', error);
              reject(error);
            }, 
            async () => {
              url = await getDownloadURL(uploadTask.snapshot.ref);
              type = deliveryFile.type.startsWith('video') ? 'video' : 'image';
              resolve();
            }
          );
        });
      } else {
        url = deliveryLink;
        // Auto-prepend https:// if missing to ensure it works as an absolute link
        if (url && !/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
      }

      await updateDoc(doc(db, 'orders', selectedOrderId), {
        status: 'delivered',
        delivery: {
          file_url: url,
          message: deliveryMessage,
          type: type,
          created_at: new Date().toISOString()
        }
      });

      setIsDeliveryModalOpen(false);
      // Close details modal if open
      if (isOrderDetailsModalOpen && selectedOrderDetails?.id === selectedOrderId) {
        setIsOrderDetailsModalOpen(false);
      }
      
      setSelectedOrderId(null);
      setDeliveryFile(null);
      setDeliveryLink('');
      setDeliveryMessage('');
      setIsUploading(false);
      setUploadProgress(0);
      
      fetchOrders();
    } catch (error) {
      console.error('Failed to deliver order', error);
      setIsUploading(false);
    }
  };

  const promptDelete = (type: 'service' | 'discount', id: string) => {
    setItemToDelete({ type, id });
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'service') {
      await handleDeleteService(itemToDelete.id);
    } else {
      await handleDeleteDiscount(itemToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('services')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'services' ? "bg-green-100 text-green-800" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'orders' ? "bg-green-100 text-green-800" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'discounts' ? "bg-green-100 text-green-800" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Discounts
            </button>
          </div>
        </div>

        {activeTab === 'services' && (
          <div>
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => {
                  setEditingServiceId(null);
                  setNewService({ title: '', description: '', price: '', category: 'General', images: [], existing_images: [] });
                  setIsServiceModalOpen(true);
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus size={18} /> Add New Service
              </button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded object-cover" src={service.image_url} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{service.title}</div>
                            <div className="text-sm text-gray-500">{service.seller_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        LKR {service.price}
                        {service.discount && (
                          <span className="ml-2 text-xs text-red-500">
                            (-{service.discount.type === 'percentage' ? `${service.discount.value}%` : `LKR ${service.discount.value}`})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEditService(service)} className="text-blue-600 hover:text-blue-900 mr-4">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => promptDelete('service', String(service.id))} className="text-red-600 hover:text-red-900">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-end mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {ordersLoading ? (
               <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" /></div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr 
                        key={order.id} 
                        onClick={() => handleOpenOrderDetails(order)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${order.tracking_status?.includes('Revision Requested') ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{String(order.id).slice(0, 8)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{order.service_title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.user_name}</div>
                          <div className="text-xs text-gray-500">{order.user_mobile}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                            ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            placeholder="e.g. Designing..."
                            value={order.tracking_status || ''}
                            onChange={(e) => handleUpdateTrackingStatus(String(order.id), e.target.value)}
                            className={`text-xs border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 w-32 ${order.tracking_status?.includes('Revision Requested') ? 'border-red-300 text-red-600 font-bold' : ''}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">LKR {order.price_at_order}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <select 
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(String(order.id), e.target.value)}
                              className={cn(
                                "text-sm border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 font-medium px-3 py-1",
                                order.status === 'pending' && "bg-orange-100 text-orange-800 border-orange-200 focus:ring-orange-500",
                                order.status === 'in_progress' && "bg-yellow-100 text-yellow-800 border-yellow-200 focus:ring-yellow-500",
                                order.status === 'delivered' && "bg-blue-100 text-blue-800 border-blue-200 focus:ring-blue-500",
                                order.status === 'completed' && "bg-green-100 text-green-800 border-green-200 focus:ring-green-500",
                                order.status === 'cancelled' && "bg-gray-100 text-gray-800 border-gray-200 focus:ring-gray-500",
                                order.tracking_status?.includes('Revision Requested') && "bg-red-100 text-red-800 border-red-200 focus:ring-red-500"
                              )}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="delivered">Delivered</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'discounts' && (
          <div>
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => setIsDiscountModalOpen(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Tag size={18} /> Add New Discount
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discounts.map((discount) => (
                <div key={discount.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{discount.name}</h3>
                      <p className="text-sm text-gray-500">
                        {discount.service_id 
                          ? `Applied to Service` 
                          : 'Global Discount (All Services)'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleToggleDiscount(String(discount.id), discount.active)} className={discount.active ? "text-green-600" : "text-gray-400"}>
                        {discount.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                      <button onClick={() => promptDelete('discount', String(discount.id))} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1 text-3xl font-bold text-green-600">
                    {discount.type === 'fixed' ? 'LKR ' : ''}{discount.value}{discount.type === 'percentage' ? '%' : ''}
                    <span className="text-sm font-normal text-gray-500 ml-1">OFF</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isOrderDetailsModalOpen && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Order Details #{String(selectedOrderDetails.id).slice(0, 8)}</h2>
              <button onClick={() => setIsOrderDetailsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Service Info</h3>
                <div className="flex gap-4 mb-4">
                  <img src={selectedOrderDetails.service_image} alt="" className="w-20 h-20 object-cover rounded-lg bg-gray-100" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedOrderDetails.service_title}</p>
                    <p className="text-green-600 font-bold mt-1">LKR {selectedOrderDetails.price_at_order}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium capitalize
                      ${selectedOrderDetails.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        selectedOrderDetails.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {selectedOrderDetails.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {selectedOrderDetails.tracking_status && (
                  <div className={`p-3 rounded-md text-sm ${selectedOrderDetails.tracking_status.includes('Revision Requested') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-700'}`}>
                    <span className="font-semibold block mb-1">Status Note:</span>
                    {selectedOrderDetails.tracking_status}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Customer Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wide">Name</span>
                    <p className="font-medium text-gray-900">{selectedOrderDetails.user_name}</p>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wide">Mobile</span>
                    <p className="font-medium text-gray-900">{selectedOrderDetails.user_mobile}</p>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wide">Delivery Address</span>
                    <p className="font-medium text-gray-900 whitespace-pre-wrap">{selectedOrderDetails.user_address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Update Shipping / Tracking</h3>
                {['pending', 'in_progress'].includes(selectedOrderDetails.status) && (
                  <button
                    onClick={() => {
                      setSelectedOrderId(String(selectedOrderDetails.id));
                      setIsDeliveryModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
                  >
                    <Upload size={16} /> Deliver Work
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveTrackingInfo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Courier Service</label>
                  <input 
                    type="text" 
                    value={courierService}
                    onChange={e => setCourierService(e.target.value)}
                    placeholder="e.g. DHL, FedEx, Local Post"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tracking ID</label>
                  <input 
                    type="text" 
                    value={trackingId}
                    onChange={e => setTrackingId(e.target.value)}
                    placeholder="e.g. TRK123456789"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Save Tracking Info
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h2>
            <form onSubmit={handleCreateOrUpdateService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input 
                  required
                  type="text" 
                  value={newService.title}
                  onChange={e => setNewService({...newService, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select 
                  value={newService.category}
                  onChange={e => setNewService({...newService, category: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option>Graphics & Design</option>
                  <option>Programming & Tech</option>
                  <option>Writing & Translation</option>
                  <option>Video & Animation</option>
                  <option>Digital Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (LKR)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={newService.price}
                  onChange={e => setNewService({...newService, price: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                
                {/* Existing Images */}
                {newService.existing_images && newService.existing_images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {newService.existing_images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img src={img} alt="" className="w-full h-full object-cover rounded" />
                        <button 
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Images Preview */}
                {newService.images && newService.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {newService.images.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative group aspect-square">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded" />
                        <button 
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                    </div>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  required
                  value={newService.description}
                  onChange={e => setNewService({...newService, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    editingServiceId ? 'Save Changes' : 'Create Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Discount</h2>
            <form onSubmit={handleCreateDiscount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Discount Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Summer Sale"
                  value={newDiscount.name}
                  onChange={e => setNewDiscount({...newDiscount, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select 
                    value={newDiscount.type}
                    onChange={e => setNewDiscount({...newDiscount, type: e.target.value as any})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (LKR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={newDiscount.value}
                    onChange={e => setNewDiscount({...newDiscount, value: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Service (Optional)</label>
                <select 
                  value={newDiscount.service_id}
                  onChange={e => setNewDiscount({...newDiscount, service_id: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">All Services (Global)</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.title} (LKR {s.price})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all services.</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  Create Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delivery Modal */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Deliver Work</h2>
            <form onSubmit={handleDeliverOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Upload File (Image/Video)</label>
                <input 
                  type="file" 
                  accept="image/*,video/*"
                  onChange={e => setDeliveryFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <p className="text-xs text-gray-500 mt-1">Optional if external link is provided.</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">External Delivery Link</label>
                <input 
                  type="text" 
                  value={deliveryLink}
                  onChange={e => setDeliveryLink(e.target.value)}
                  placeholder="drive.google.com/..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Use for large files or external hosting (Google Drive, Dropbox, etc).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message to Buyer</label>
                <textarea 
                  value={deliveryMessage}
                  onChange={e => setDeliveryMessage(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows={3}
                  placeholder="Here is your delivery..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    'Send Delivery'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
