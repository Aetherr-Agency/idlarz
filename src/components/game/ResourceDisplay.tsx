import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { Resources } from '@/types/game';
import { formatNumber, formatModifier } from '@/utils/formatters';

const RESOURCE_INFO = {
  gold: { icon: '💰', label: 'Gold', description: 'Used to purchase new tiles' },
  wood: { icon: '🪵', label: 'Wood', description: 'Basic construction material' },
  stone: { icon: '🪨', label: 'Stone', description: 'Durable building material' },
  coal: { icon: '⚫', label: 'Coal', description: 'Advanced fuel source' },
  food: { icon: '🌾', label: 'Food', description: 'Sustains population growth' }
} as const;

const ResourceDisplay: React.FC = () => {
  const resources = useGameStore(state => state.resources);
  const resourceRates = useGameStore(state => state.resourceRates);
  const modifiers = useGameStore(state => state.resourceModifiers);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 bg-opacity-90 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="grid grid-cols-5 gap-4 md:gap-8">
          {(Object.keys(RESOURCE_INFO) as (keyof Resources)[]).map(resource => (
            <div 
              key={resource}
              className="group relative flex items-center justify-center gap-2 text-sm"
            >
              <div className="text-xl md:text-2xl" role="img" aria-label={resource}>
                {RESOURCE_INFO[resource].icon}
              </div>
              <div className="flex flex-col">
                <div className="font-medium text-sm md:text-base text-white">
                  {formatNumber(resources[resource])}
                </div>
                <div className={`text-xs ${resourceRates.total[resource] > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                  {formatNumber(resourceRates.total[resource])}/s
                </div>
              </div>
              
              {/* Enhanced Tooltip */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200">
                <div className="bg-gray-800 rounded-lg shadow-xl p-3 whitespace-nowrap border border-gray-700">
                  <div className="font-medium mb-1 text-white">{RESOURCE_INFO[resource].label}</div>
                  <div className="text-sm text-gray-400 mb-2">{RESOURCE_INFO[resource].description}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Base Rate:</span>
                      <span className="text-white">{formatNumber(resourceRates.base[resource])}/s</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Modifier:</span>
                      <span className={`${modifiers[resource] > 1 ? 'text-green-400' : modifiers[resource] < 1 ? 'text-red-400' : 'text-white'}`}>
                        {formatModifier(modifiers[resource])}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-gray-700 mt-2 pt-2">
                      <span className="text-gray-400">Total Rate:</span>
                      <span className={`${resourceRates.total[resource] > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        {formatNumber(resourceRates.total[resource])}/s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceDisplay;
