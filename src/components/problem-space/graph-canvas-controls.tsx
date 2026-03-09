"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";

type Props = {
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
};

const GraphCanvasControls = ({
  zoom,
  onZoomOut,
  onZoomIn,
  onResetZoom,
}: Props) => {
  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" size="icon" variant="secondary" onClick={onZoomOut}>
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" size="icon" variant="secondary" onClick={onZoomIn}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        onClick={onResetZoom}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <span className="ml-1 text-[11px] text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
};

export default GraphCanvasControls;
