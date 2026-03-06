import { useState, useEffect } from 'react';
import { Service, Discount } from '@/lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      // Also fetch active discounts to calculate final price
      const discountSnapshot = await getDocs(query(collection(db, 'discounts'), where('active', '==', true)));
      const discounts = discountSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Discount[];

      const servicesWithDiscounts = servicesData.map(service => {
        const serviceDiscount = discounts.find(d => d.service_id === service.id);
        const globalDiscount = discounts.find(d => !d.service_id);
        const discount = serviceDiscount || globalDiscount;
        
        let finalPrice = service.price;
        if (discount) {
          if (discount.type === 'percentage') {
            finalPrice = service.price * (1 - discount.value / 100);
          } else {
            finalPrice = Math.max(0, service.price - discount.value);
          }
        }
        return { ...service, finalPrice: Number(finalPrice.toFixed(2)), discount };
      });

      setServices(servicesWithDiscounts);
    } catch (error) {
      console.error('Failed to fetch services', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return { services, loading, refetch: fetchServices };
}

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiscounts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'discounts'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Discount[];
      setDiscounts(data);
    } catch (error) {
      console.error('Failed to fetch discounts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  return { discounts, loading, refetch: fetchDiscounts };
}
