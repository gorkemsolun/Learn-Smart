'use client';

import { SkillTreeListProps } from "@/app/types";
import React from "react";
import {SkillTreeCard} from "@/components/skill-tree/skill-tree-card";

export default function SkillTreeList({ skillTrees }: SkillTreeListProps = { skillTrees: [] }) {
  const onSkillTreeDelete = (id: string) => {
    // TO-DO
  };

  return (
    <div className="ml-0.5 space-y-4 bg-gradient-to-br from-background to-secondary/10 p-1">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skillTrees.map((tree) => (
          <SkillTreeCard
              key={tree.id}
              id={tree.id}
              title={tree.title}
              description={tree.description}
              onSkillTreeDelete={onSkillTreeDelete}
          />
        ))}
      </div>
    </div>
  );
}