import { Service } from '@/lib/utils';
import { Star, Heart } from 'lucide-react';
import { FC } from 'react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: FC<ServiceCardProps> = ({ service }) => {
  return (
    <Link to={`/service/${service.id}`} className="block">
      <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={service.image_url} 
            alt={service.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {service.discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {service.discount.type === 'percentage' ? `-${service.discount.value}%` : `-LKR ${service.discount.value}`}
            </div>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <img src={service.seller_avatar} alt={service.seller_name} className="w-6 h-6 rounded-full object-cover" />
            <span className="text-sm font-medium text-gray-900">{service.seller_name}</span>
            <span className="text-xs text-gray-500 ml-auto">Level 2 Seller</span>
          </div>
          
          <h3 className="text-gray-900 font-medium line-clamp-2 mb-2 group-hover:text-green-600 transition-colors">
            {service.title}
          </h3>
          
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-sm text-gray-900">{service.rating}</span>
            <span className="text-gray-500 text-sm">({service.review_count})</span>
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
            <Heart className="w-4 h-4 text-gray-400 hover:fill-red-500 hover:text-red-500 transition-colors" />
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold">Starting at</p>
              <div className="flex items-center gap-2 justify-end">
                {service.discount && (
                  <span className="text-sm text-gray-400 line-through">LKR {service.price}</span>
                )}
                <span className="text-lg font-bold text-gray-900">LKR {service.finalPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
