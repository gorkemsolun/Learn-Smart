"use client";

import {useCallback, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import SkillTreeList from "@/components/skill-tree-list";
import { SkillTreeCard } from "@/app/types";
import {useToast} from "@/hooks/use-toast";

// Group is the depth of the node where group 0 will be the root, the example set group root
// starts with root being 1.

const skillTrees: SkillTreeCard[] = [
  {
    id: "1",
    title: "Basic Education Path",
    description: "Very good Skill Tree"
  },
  {
    id: "2",
    title: "Second Skill Tree",
    description: "Second good Skill Tree"
  },
];

export default function SkillTrees() {
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();
    const {toast} = useToast();

    useEffect(() => {
        const authToken = Cookies.get("authToken");
        setToken(authToken || null);

        if (!authToken) {
            router.replace("/sign-in");
        }
    }, [router, token]);

    // TO-DO implement the backend logic
    const fetchSkillTrees = useCallback(async () => {
        if (!token) return;

      }, [token, toast]);

      useEffect(() => {
        fetchSkillTrees();
      }, [fetchSkillTrees]);

    return (
        <main className="static">
            <SkillTreeList skillTrees={skillTrees}/>
        </main>
    );
}