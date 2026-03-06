import { useServices } from '@/hooks/useApi';
import { ServiceCard } from '@/components/ServiceCard';
import { Loader2 } from 'lucide-react';
import { Service } from '@/lib/utils';

export function HomePage() {
  const { services, loading } = useServices();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-green-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 max-w-2xl">
            Find the perfect freelance services for your business
          </h1>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-200">
            <span className="border border-white/30 rounded-full px-3 py-1 hover:bg-white/10 cursor-pointer transition-colors">Website Design</span>
            <span className="border border-white/30 rounded-full px-3 py-1 hover:bg-white/10 cursor-pointer transition-colors">WordPress</span>
            <span className="border border-white/30 rounded-full px-3 py-1 hover:bg-white/10 cursor-pointer transition-colors">Logo Design</span>
            <span className="border border-white/30 rounded-full px-3 py-1 hover:bg-white/10 cursor-pointer transition-colors">Video Editing</span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Popular Services</h2>
          <button className="text-green-600 font-medium hover:underline">See All</button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service: Service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No services found. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}
