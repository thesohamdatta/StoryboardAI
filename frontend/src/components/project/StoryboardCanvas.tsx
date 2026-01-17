import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Scene {
  id: string;
  sceneNumber: number;
  title?: string;
}

interface Shot {
  id: string;
  shotNumber: number;
  shotType?: string;
  cameraAngle?: string;
  movement?: string;
  duration?: string;
  description?: string;
  notes?: string;
}

interface Panel {
  id: string;
  shotId: string;
  imageUrl?: string;
  isAiGenerated: boolean;
  version: number;
}

interface StoryboardCanvasProps {
  scene: Scene | undefined;
  shots: Shot[];
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
  onShotsChange: (shots: Shot[]) => void;
}

function SortableShot({
  shot,
  panel,
  isSelected,
  viewMode,
  onSelect,
  showGuides
}: {
  shot: Shot,
  panel?: Panel,
  isSelected: boolean,
  viewMode: string,
  onSelect: (id: string) => void,
  showGuides: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderGuides = () => (
    <div className="absolute inset-0 pointer-events-none opacity-20 transition-opacity">
      <div className="absolute inset-x-0 top-1/3 border-t border-white" />
      <div className="absolute inset-x-0 top-2/3 border-t border-white" />
      <div className="absolute inset-y-0 left-1/3 border-l border-white" />
      <div className="absolute inset-y-0 left-2/3 border-l border-white" />
    </div>
  );

  if (viewMode === 'strip') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => onSelect(shot.id)}
        className={`flex-shrink-0 w-72 h-full flex flex-col cursor-grab active:cursor-grabbing transition-all duration-200 ease-apple ${isSelected ? 'ring-2 ring-apple-accent ring-offset-2 scale-[1.02]' : ''
          }`}
      >
        <div className="flex-1 glass-panel-dark p-3 flex items-center justify-center rounded-2xl hover:shadow-xl transition-all duration-200 relative overflow-hidden group">
          {panel?.imageUrl ? (
            <img
              src={panel.imageUrl}
              alt={`Shot ${shot.shotNumber}`}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          ) : (
            <div className="text-center text-apple-gray-500">
              <div className="text-body-small mb-2">NO FRAME</div>
              <div className="text-caption">#{shot.shotNumber}</div>
            </div>
          )}
          {showGuides && renderGuides()}
          {/* Movement Icon Overlay */}
          {shot.movement && shot.movement !== 'Static' && (
            <div className="absolute top-4 right-4 bg-apple-accent/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-apple-accent border border-apple-accent/20">
              {shot.movement.toUpperCase()}
            </div>
          )}
        </div>
        <div className="mt-4 px-2 space-y-1">
          <div className="text-body font-bold text-white flex justify-between">
            <span>#{shot.shotNumber}</span>
            <span className="text-apple-accent">{shot.shotType}</span>
          </div>
          <div className="text-caption text-apple-gray-500 font-medium tracking-tight">
            {shot.cameraAngle} • {shot.duration}
          </div>
        </div>
      </div>
    );
  }

  // Grid version
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(shot.id)}
      className={`glass-panel-dark p-3 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-200 ease-apple hover:shadow-2xl relative overflow-hidden ${isSelected ? 'ring-2 ring-apple-accent' : ''
        }`}
    >
      <div className="aspect-video bg-black/40 rounded-xl flex items-center justify-center mb-3 overflow-hidden relative group">
        {panel?.imageUrl ? (
          <img
            src={panel.imageUrl}
            alt={`Shot ${shot.shotNumber}`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-body-small text-apple-gray-600 font-bold uppercase tracking-widest">Frame {shot.shotNumber}</div>
        )}
        {showGuides && renderGuides()}
      </div>
      <div className="flex justify-between items-center">
        <div className="text-body font-bold text-white">#{shot.shotNumber}</div>
        <div className="text-caption font-bold bg-white/5 px-2 py-0.5 rounded text-apple-gray-400">{shot.shotType}</div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CollaborationIndicator } from './CollaborationIndicator';

export function StoryboardCanvas({
  scene,
  shots,
  selectedShotId,
  onSelectShot,
  onShotsChange
}: StoryboardCanvasProps) {
  const [panels, setPanels] = useState<Record<string, Panel>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'strip' | 'list'>('strip');
  const [loading, setLoading] = useState(false);
  const [showGuides, setShowGuides] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = shots.findIndex((s) => s.id === active.id);
      const newIndex = shots.findIndex((s) => s.id === over.id);

      const newShots = arrayMove(shots, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        shotNumber: idx + 1
      }));
      onShotsChange(newShots);
    }
  };

  // Load panels for shots
  useEffect(() => {
    const loadPanels = async () => {
      for (const shot of shots) {
        try {
          const response = await api.get(`/panels?shotId=${shot.id}`);
          const shotPanels = response.data.data;
          if (shotPanels.length > 0) {
            const latestPanel = shotPanels[shotPanels.length - 1];
            setPanels(prev => ({ ...prev, [shot.id]: latestPanel }));
          }
        } catch (error) {
          console.error(`Failed to load panels for shot ${shot.id}:`, error);
        }
      }
    };

    if (shots.length > 0) {
      loadPanels();
    }
  }, [shots]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewShot();
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const currentIndex = shots.findIndex(s => s.id === selectedShotId);
        if (currentIndex !== -1) {
          const nextIndex = e.key === 'ArrowRight'
            ? Math.min(currentIndex + 1, shots.length - 1)
            : Math.max(currentIndex - 1, 0);
          if (nextIndex !== currentIndex) {
            onSelectShot(shots[nextIndex].id);
          }
        }
      }
      // View mode shortcuts
      if (e.key === '1') setViewMode('strip');
      if (e.key === '2') setViewMode('grid');
      if (e.key === '3') setViewMode('list');
      if (e.key === 'g' && !e.ctrlKey) setShowGuides(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shots, selectedShotId, onSelectShot]);

  const createNewShot = async () => {
    if (!scene) return;

    setLoading(true);
    try {
      const shotNumber = shots.length + 1;
      const response = await api.post('/shots', {
        sceneId: scene.id,
        shotNumber,
        shotType: 'MS',
        cameraAngle: 'Eye Level',
        movement: 'Static',
        duration: '2s'
      });
      onShotsChange([...shots, response.data.data]);
      onSelectShot(response.data.data.id);
    } catch (error) {
      console.error('Failed to create shot:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStripView = () => (
    <div className="flex-1 overflow-x-auto overflow-y-hidden bg-apple-gray-50">
      <div className="flex h-full items-center px-6 space-x-6">
        {shots.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <p className="text-body text-apple-gray-600 mb-6">No shots yet</p>
              <button
                onClick={createNewShot}
                disabled={loading}
                className="btn-apple btn-apple-primary"
              >
                {loading ? 'Creating...' : 'Create First Shot'}
              </button>
            </div>
          </div>
        ) : (
          shots.map((shot) => {
            const panel = panels[shot.id];
            const isSelected = shot.id === selectedShotId;

            return (
              <div
                key={shot.id}
                onClick={() => onSelectShot(shot.id)}
                className={`flex-shrink-0 w-72 h-full flex flex-col cursor-pointer transition-all duration-200 ease-apple ${isSelected ? 'ring-2 ring-apple-accent ring-offset-2' : ''
                  }`}
              >
                {/* Panel Frame - Glass Effect */}
                <div className="flex-1 glass-panel p-3 flex items-center justify-center rounded-2xl hover:shadow-xl transition-all duration-200">
                  {panel?.imageUrl ? (
                    <img
                      src={panel.imageUrl}
                      alt={`Shot ${shot.shotNumber}`}
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-center text-apple-gray-400">
                      <div className="text-body-small mb-2">No panel</div>
                      <div className="text-caption">Shot {shot.shotNumber}</div>
                    </div>
                  )}
                </div>

                {/* Shot Label - Clean Typography */}
                <div className="mt-4 px-2 space-y-1">
                  <div className="text-body font-semibold text-apple-near-black">
                    Shot {shot.shotNumber}
                  </div>
                  {shot.shotType && (
                    <div className="text-body-small text-apple-gray-600">
                      {shot.shotType} • {shot.cameraAngle || 'N/A'}
                    </div>
                  )}
                  {panel?.isAiGenerated && (
                    <div className="text-caption text-apple-gray-500">AI-generated</div>
                  )}
                  {/* Collaboration Indicators */}
                  <div className="mt-2">
                    <CollaborationIndicator
                      panelId={panel?.id}
                      shotId={shot.id}
                    />
                  </div>

                  {/* Version indicator */}
                  {panel && panel.version > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Show version panel
                      }}
                      className="text-caption text-apple-gray-500 hover:text-apple-accent mt-1"
                    >
                      v{panel.version}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Add Shot Button - Minimal, Floating */}
        {shots.length > 0 && (
          <button
            onClick={createNewShot}
            disabled={loading}
            className="flex-shrink-0 w-20 h-20 glass-panel border-2 border-dashed border-apple-gray-300 rounded-2xl hover:border-apple-accent hover:bg-apple-accent/5 transition-all duration-200 ease-apple focus:outline-none focus:ring-2 focus:ring-apple-accent/20 flex items-center justify-center text-apple-gray-400 hover:text-apple-accent"
            title="Add Shot (Ctrl+N)"
          >
            <span className="text-2xl font-light">+</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-3 gap-6">
        {shots.map((shot) => {
          const panel = panels[shot.id];
          const isSelected = shot.id === selectedShotId;

          return (
            <div
              key={shot.id}
              onClick={() => onSelectShot(shot.id)}
              className={`glass-panel p-3 rounded-2xl cursor-pointer transition-all duration-200 ease-apple hover:shadow-xl ${isSelected ? 'ring-2 ring-apple-accent' : ''
                }`}
            >
              <div className="aspect-video bg-apple-gray-50 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                {panel?.imageUrl ? (
                  <img
                    src={panel.imageUrl}
                    alt={`Shot ${shot.shotNumber}`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-body-small text-apple-gray-400">Shot {shot.shotNumber}</div>
                )}
              </div>
              <div className="text-body font-semibold text-apple-near-black">
                Shot {shot.shotNumber}
              </div>
              {shot.shotType && (
                <div className="text-body-small text-apple-gray-600">{shot.shotType}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="flex-1 overflow-auto bg-apple-gray-50/50">
      <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
        <thead className="bg-apple-gray-100 text-apple-gray-600 font-medium sticky top-0 z-10 backdrop-blur-md">
          <tr>
            <th className="px-6 py-3 border-b border-apple-gray-200 w-16 text-center">#</th>
            <th className="px-6 py-3 border-b border-apple-gray-200 w-32">Visual</th>
            <th className="px-6 py-3 border-b border-apple-gray-200 w-32">Type</th>
            <th className="px-6 py-3 border-b border-apple-gray-200 w-32">Movement</th>
            <th className="px-6 py-3 border-b border-apple-gray-200 w-24 text-center">Dur</th>
            <th className="px-6 py-3 border-b border-apple-gray-200">Description / Directorial Notes</th>
            <th className="px-6 py-3 border-b border-apple-gray-200 w-24">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-apple-gray-200/50">
          {shots.map((shot) => {
            const panel = panels[shot.id];
            const isSelected = shot.id === selectedShotId;
            return (
              <tr
                key={shot.id}
                onClick={() => onSelectShot(shot.id)}
                className={`cursor-pointer transition-colors hover:bg-white/5 ${isSelected ? 'bg-apple-accent/10 border-l-4 border-apple-accent' : 'border-l-4 border-transparent'}`}
              >
                <td className="px-6 py-4 text-center text-apple-gray-500 font-mono">{shot.shotNumber}</td>
                <td className="px-6 py-2">
                  <div className="w-20 aspect-video bg-apple-gray-50 rounded border border-apple-gray-200 overflow-hidden flex items-center justify-center">
                    {panel?.imageUrl ? (
                      <img src={panel.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-apple-gray-400 font-medium">NO FRAME</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-apple-near-black font-semibold">{shot.shotType || 'MS'}</div>
                  <div className="text-[10px] text-apple-gray-500 uppercase tracking-tighter">{shot.cameraAngle || 'Eye Level'}</div>
                </td>
                <td className="px-6 py-4 text-apple-gray-600 italic">{shot.movement || 'Static'}</td>
                <td className="px-6 py-4 text-center text-apple-gray-500 font-mono">{shot.duration || '2s'}</td>
                <td className="px-6 py-4">
                  <div className="text-apple-near-black line-clamp-1">{shot.description || 'No description provided.'}</div>
                  {shot.notes && (
                    <div className="text-body-small text-apple-gray-500 mt-1 line-clamp-1 italic underline decoration-apple-accent/20">
                      Note: {shot.notes}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {panel ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      Draft
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const renderSlideshow = () => {
    const shot = shots[currentSlideIndex];
    if (!shot) return null;
    const panel = panels[shot.id];

    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-fade-in">
        <div className="p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent fixed top-0 w-full z-10">
          <div className="text-white space-y-1">
            <div className="text-xs font-bold text-apple-gray-400 uppercase tracking-widest">
              Scene {scene?.sceneNumber} • Shot {shot.shotNumber}
            </div>
            <div className="text-xl font-display font-semibold">
              {shot.shotType} • {shot.cameraAngle}
            </div>
          </div>
          <button
            onClick={() => setIsSlideshowActive(false)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-12">
          <div className="relative w-full h-full flex items-center justify-center">
            {panel?.imageUrl ? (
              <img src={panel.imageUrl} className="max-w-full max-h-full object-contain shadow-2xl" />
            ) : (
              <div className="text-apple-gray-600 text-headline">NO FRAME ASSET</div>
            )}
          </div>
        </div>

        <div className="p-8 fixed bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
              className="btn-apple bg-white/5 text-white hover:bg-white/10 px-6"
              disabled={currentSlideIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.min(shots.length - 1, prev + 1))}
              className="btn-apple btn-apple-primary px-8"
              disabled={currentSlideIndex === shots.length - 1}
            >
              Next
            </button>
          </div>
          <div className="text-apple-gray-500 font-mono text-xs">
            {currentSlideIndex + 1} / {shots.length}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in relative">
        {isSlideshowActive && renderSlideshow()}

        {/* Toolbar - Solid Professional */}
        <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center space-x-4">
            <div className="text-body font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-apple-gray-500 font-mono">SCENE {scene?.sceneNumber || '--'}</span>
              {scene?.title && (
                <span className="text-apple-gray-400 font-medium border-l border-white/10 pl-2 ml-2 truncate max-w-[200px]">
                  {scene.title}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setCurrentSlideIndex(0);
                setIsSlideshowActive(true);
              }}
              disabled={shots.length === 0}
              className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2563EB] hover:bg-[#2563EB]/10 rounded transition-all disabled:opacity-30 border border-[#2563EB]/20"
            >
              Presentation Mode
            </button>
            <div className="flex items-center bg-black/50 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setViewMode('strip')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${viewMode === 'strip' ? 'bg-[#333] text-white shadow-sm border border-white/10' : 'text-apple-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                Strip
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${viewMode === 'grid' ? 'bg-[#333] text-white shadow-sm border border-white/10' : 'text-apple-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${viewMode === 'list' ? 'bg-[#333] text-white shadow-sm border border-white/10' : 'text-apple-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        {viewMode === 'strip' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#1A1A1A]">
            <SortableContext
              items={shots.map(s => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex h-full items-center px-6 space-x-6">
                {shots.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center animate-fade-in py-12 px-8 border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                      <p className="text-body text-apple-gray-500 mb-6 font-medium">No shots in this scene yet.</p>
                      <button
                        onClick={createNewShot}
                        disabled={loading}
                        className="btn-apple btn-apple-primary"
                      >
                        {loading ? 'Initializing...' : 'Add First Shot'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {shots.map((shot) => (
                      <SortableShot
                        key={shot.id}
                        shot={shot}
                        panel={panels[shot.id]}
                        isSelected={shot.id === selectedShotId}
                        viewMode="strip"
                        onSelect={onSelectShot}
                        showGuides={showGuides}
                      />
                    ))}
                    {/* Add Shot Button End of List */}
                    <button
                      onClick={createNewShot}
                      disabled={loading}
                      className="flex-shrink-0 w-24 h-full max-h-[400px] border-2 border-dashed border-white/10 rounded-2xl hover:border-apple-accent/50 hover:bg-apple-accent/5 transition-all duration-200 focus:outline-none flex flex-col items-center justify-center text-apple-gray-600 hover:text-apple-accent group"
                    >
                      <span className="text-3xl font-light mb-2 group-hover:scale-110 transition-transform">+</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Add Shot</span>
                    </button>
                  </>
                )}
              </div>
            </SortableContext>
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="flex-1 overflow-auto p-8 bg-[#1A1A1A]">
            <SortableContext
              items={shots.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
                {shots.map((shot) => (
                  <SortableShot
                    key={shot.id}
                    shot={shot}
                    panel={panels[shot.id]}
                    isSelected={shot.id === selectedShotId}
                    viewMode="grid"
                    onSelect={onSelectShot}
                    showGuides={showGuides}
                  />
                ))}
                {/* Grid Add Button */}
                <button
                  onClick={createNewShot}
                  disabled={loading}
                  className="aspect-video border-2 border-dashed border-white/10 rounded-2xl hover:border-apple-accent/50 hover:bg-apple-accent/5 transition-all flex flex-col items-center justify-center text-apple-gray-600 hover:text-apple-accent group min-h-[200px]"
                >
                  <span className="text-3xl font-light mb-2 group-hover:scale-110 transition-transform">+</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">New Shot</span>
                </button>
              </div>
            </SortableContext>
          </div>
        )}

        {viewMode === 'list' && renderListView()}
      </div>
    </DndContext>
  );
}

