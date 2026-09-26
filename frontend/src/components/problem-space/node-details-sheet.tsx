"use client";

import React from "react";
import { Fragment } from "@/types/canva";
import { Card } from "../ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fragments: Fragment[];
  fragmentTypeLabels: string[];
  dotClassByType: Record<Fragment["type"], string>;
  fragmentTypeLabelByType?: Record<Fragment["type"], string>;
};

const NodeDetailsSheet = ({
  open,
  onOpenChange,
  title,
  fragments,
  fragmentTypeLabels,
  dotClassByType,
  fragmentTypeLabelByType,
}: Props) => {
  const getTypeLabel = (type: Fragment["type"], fallback: string) => {
    return fragmentTypeLabelByType?.[type] ?? fallback;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {fragments.length} fragment
            {fragments.length === 1 ? "" : "s"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {fragments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No fragments in this node.
            </p>
          ) : (
            fragments.map((fragment, index) => (
              <Card key={fragment.id} className="p-3 gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${dotClassByType[fragment.type] || "bg-muted"}`}
                  />
                  <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    {getTypeLabel(
                      fragment.type,
                      fragmentTypeLabels[index] || fragment.type,
                    )}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {fragment.content}
                </p>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NodeDetailsSheet;
