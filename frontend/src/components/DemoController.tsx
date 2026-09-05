import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Sparkles } from 'lucide-react';
import { DemoState } from '../types';
import { api } from '../api';

interface DemoControllerProps {
  demoState: DemoState | null;
  onStepChanged: (step: number, highlightScreen?: string) => void;
}

export const DemoController: React.FC<DemoControllerProps> = ({ demoState, onStepChanged }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && demoState) {
      timer = setTimeout(() => {
        if (demoState.current_step < 9) {
          handleStep(demoState.current_step + 1);
        } else {
          setIsPlaying(false);
        }
      }, 4500);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, demoState]);

  const handleStep = async (step: number) => {
    if (step < 1 || step > 9 || loading) return;
    setLoading(true);
    try {
      const res = await api.triggerDemoStep(step);
      onStepChanged(step, res.metadata?.highlight_screen);
    } catch (e) {
      console.error('Failed to run demo step:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setIsPlaying(false);
    try {
      await api.resetDemo();
      onStepChanged(1, 'edge_monitor');
    } catch (e) {
      console.error('Failed to reset demo:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!demoState) return null;

  const { current_step, total_steps, metadata } = demoState;

  return (
    <div className="demo-banner">
      {/* Step Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div className="demo-step-badge">
          <Sparkles size={13} />
          EVALUATOR DEMO &middot; STEP {current_step} OF {total_steps}
        </div>

        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
            {metadata.title}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '750px', lineHeight: 1.3 }}>
            {metadata.description}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className="btn-secondary"
          onClick={() => handleStep(current_step - 1)}
          disabled={current_step <= 1 || loading}
          title="Previous Step"
          style={{ padding: '0.4rem 0.65rem' }}
        >
          <SkipBack size={14} />
        </button>

        <button
          className="btn-primary"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Auto Presentation' : 'Auto Play 9-Step Evaluation'}
          style={{ padding: '0.4rem 0.9rem' }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Pause Demo' : 'Auto Play Demo'}</span>
        </button>

        <button
          className="btn-secondary"
          onClick={() => handleStep(current_step + 1)}
          disabled={current_step >= total_steps || loading}
          title="Next Step"
          style={{ padding: '0.4rem 0.65rem' }}
        >
          <SkipForward size={14} />
        </button>

        <button
          className="btn-secondary"
          onClick={handleReset}
          title="Reset Demo to Initial Baseline"
          style={{ padding: '0.4rem 0.65rem', marginLeft: '0.5rem' }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};
