import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Shot {
  id: string;
  shotNumber: number;
  shotType?: string;
  cameraAngle?: string;
  cameraMovement?: string;
  lens?: string;
  durationSeconds?: number;
  description?: string;
}

interface MetadataPanelProps {
  shot: Shot | undefined;
  onShotUpdate: (updates: Partial<Shot>) => void;
}

const SHOT_TYPES = ['CU', 'MS', 'WS', 'ELS', 'ECU', 'MCU', 'MWS'];
const CAMERA_ANGLES = ['Eye Level', 'High Angle', 'Low Angle', 'Dutch Angle', 'Bird\'s Eye', 'Worm\'s Eye'];
const CAMERA_MOVEMENTS = ['Static', 'Pan', 'Tilt', 'Dolly', 'Track', 'Crane', 'Zoom'];
const LENS_OPTIONS = ['Wide', 'Normal', 'Telephoto', 'Macro', 'Fisheye'];

export function MetadataPanel({ shot, onShotUpdate }: MetadataPanelProps) {
  const [localShot, setLocalShot] = useState<Partial<Shot>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (shot) {
      setLocalShot(shot);
    } else {
      setLocalShot({});
    }
  }, [shot]);

  // Autosave on field change
  useEffect(() => {
    if (!shot?.id || !localShot || Object.keys(localShot).length === 0) return;

    const timeoutId = setTimeout(async () => {
      setSaving(true);
      try {
        await api.put(`/shots/${shot.id}`, localShot);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save shot:', error);
      } finally {
        setSaving(false);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [localShot, shot?.id]);

  const updateField = (field: keyof Shot, value: any) => {
    const updated = { ...localShot, [field]: value };
    setLocalShot(updated);
    onShotUpdate(updated);
  };

  if (!shot) {
    return (
      <div className="flex flex-col h-full glass-panel animate-fade-in">
        <div className="px-6 py-4 border-b border-apple-gray-200/50">
          <h2 className="text-headline text-apple-near-black font-display">
            Shot Metadata
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body text-apple-gray-600">Select a shot to edit metadata</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass-panel animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-apple-gray-200/50 flex items-center justify-between">
        <h2 className="text-headline text-apple-near-black font-display">
          Shot {shot.shotNumber}
        </h2>
        {saving && (
          <div className="text-caption text-apple-gray-500">Saving...</div>
        )}
        {lastSaved && !saving && (
          <div className="text-caption text-apple-gray-500">
            Saved {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Shot Type */}
        <div>
          <label className="block text-caption text-apple-gray-600 mb-2 uppercase tracking-wider font-semibold">
            Shot Type
          </label>
          <select
            value={localShot.shotType || ''}
            onChange={(e) => updateField('shotType', e.target.value || undefined)}
            className="w-full input-apple"
          >
            <option value="" className="text-black">Select...</option>
            {SHOT_TYPES.map(type => (
              <option key={type} value={type} className="text-black">{type}</option>
            ))}
          </select>
        </div>

        {/* Camera Angle */}
        <div>
          <label className="block text-caption text-apple-gray-600 mb-2 uppercase tracking-wider font-semibold">
            Camera Angle
          </label>
          <select
            value={localShot.cameraAngle || ''}
            onChange={(e) => updateField('cameraAngle', e.target.value || undefined)}
            className="w-full input-apple"
          >
            <option value="" className="text-black">Select...</option>
            {CAMERA_ANGLES.map(angle => (
              <option key={angle} value={angle} className="text-black">{angle}</option>
            ))}
          </select>
        </div>

        {/* Camera Movement */}
        <div>
          <label className="block text-caption text-apple-gray-600 mb-2 uppercase tracking-wider font-semibold">
            Camera Movement
          </label>
          <select
            value={localShot.cameraMovement || ''}
            onChange={(e) => updateField('cameraMovement', e.target.value || undefined)}
            className="w-full input-apple"
          >
            <option value="" className="text-black">Select...</option>
            {CAMERA_MOVEMENTS.map(movement => (
              <option key={movement} value={movement} className="text-black">{movement}</option>
            ))}
          </select>
        </div>

        {/* Lens */}
        <div>
          <label className="block text-caption text-apple-gray-600 mb-2 uppercase tracking-wider font-semibold">
            Lens (mm)
          </label>
          <select
            value={localShot.lens || ''}
            onChange={(e) => updateField('lens', e.target.value || undefined)}
            className="w-full input-apple"
          >
            <option value="" className="text-black">Select...</option>
            {LENS_OPTIONS.map(lens => (
              <option key={lens} value={lens} className="text-black">{lens}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-caption text-apple-gray-600 mb-2 uppercase tracking-wider font-semibold">
            Duration (sec)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={localShot.durationSeconds || ''}
            onChange={(e) => updateField('durationSeconds', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full input-apple"
            placeholder="0.0"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-caption text-apple-gray-600 mb-2 uppercase tracking-wider font-semibold">
            Action / Description
          </label>
          <textarea
            value={localShot.description || ''}
            onChange={(e) => updateField('description', e.target.value || undefined)}
            rows={6}
            className="w-full input-apple font-mono resize-none leading-relaxed"
            placeholder="Describe the action..."
          />
        </div>
      </div>

      {/* Footer - Manual Override Notice */}
      <div className="px-6 py-4 border-t border-apple-gray-200/50 bg-apple-gray-50/30">
        <p className="text-caption text-apple-gray-600">
          All fields are manually editable. AI suggestions are never auto-applied.
        </p>
      </div>
    </div>
  );
}
