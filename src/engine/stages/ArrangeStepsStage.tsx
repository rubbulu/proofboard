import React, { useState } from 'react';
import { ArrowUp, ArrowDown, GripVertical, ListOrdered } from 'lucide-react';
import { Stage } from '../../types';

export interface ArrangeStepsStageProps {
  stage: Stage;
  orderedIndices: number[];
  onChangeOrder: (nextOrder: number[]) => void;
}

export const ArrangeStepsStage: React.FC<ArrangeStepsStageProps> = ({
  stage,
  orderedIndices,
  onChangeOrder,
}) => {
  const steps = stage.steps || [];
  const [draggedPos, setDraggedPos] = useState<number | null>(null);

  const moveStep = (fromPos: number, toPos: number) => {
    if (toPos < 0 || toPos >= orderedIndices.length) return;
    const next = [...orderedIndices];
    const [removed] = next.splice(fromPos, 1);
    next.splice(toPos, 0, removed);
    onChangeOrder(next);
  };

  const handleDragStart = (pos: number) => {
    setDraggedPos(pos);
  };

  const handleDragOver = (e: React.DragEvent, targetPos: number) => {
    e.preventDefault();
    if (draggedPos === null || draggedPos === targetPos) return;
    moveStep(draggedPos, targetPos);
    setDraggedPos(targetPos);
  };

  const handleDragEnd = () => {
    setDraggedPos(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0B1B3A]">
          <ListOrdered className="w-4 h-4 text-[#2E6FD8]" aria-hidden="true" />
          <span>Order the Algorithm Steps</span>
        </div>
        <span className="text-xs text-slate-600">
          Drag rows or use Up/Down buttons
        </span>
      </div>

      <div className="space-y-2.5" role="list" aria-label="Algorithm steps to order">
        {orderedIndices.map((canonicalIdx, position) => {
          const text = steps[canonicalIdx] || `Step ${canonicalIdx}`;
          const isDragging = draggedPos === position;

          return (
            <div
              key={canonicalIdx}
              role="listitem"
              draggable
              onDragStart={() => handleDragStart(position)}
              onDragOver={(e) => handleDragOver(e, position)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors bg-white ${
                isDragging
                  ? 'border-[#2E6FD8] bg-blue-50/40'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="text-slate-400 cursor-grab active:cursor-grabbing shrink-0"
                  aria-hidden="true"
                >
                  <GripVertical className="w-4 h-4" />
                </span>
                <span className="w-6 h-6 rounded-md bg-slate-100 text-xs font-mono font-semibold text-[#0B1B3A] flex items-center justify-center shrink-0 tabular-nums">
                  {position + 1}
                </span>
                <span className="text-sm font-medium text-[#0B1B3A]">
                  {text}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveStep(position, position - 1)}
                  disabled={position === 0}
                  aria-label={`Move step "${text}" up`}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#0B1B3A] hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(position, position + 1)}
                  disabled={position === orderedIndices.length - 1}
                  aria-label={`Move step "${text}" down`}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#0B1B3A] hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-600">
        Scoring uses precedence rules between step pairs, so partial credit is
        awarded when some logical relationships are in the right order.
      </p>
    </div>
  );
};
