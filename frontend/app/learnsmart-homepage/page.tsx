"use client"

import { Navbar } from "@/components/navbar";
import {SearchDialogModal} from "@/components/search-dialog";
import {useState} from "react";
import Dashboard from "@/components/dashboard";


export default function Home() {
    const [isDialogOpen, setDialogOpen] = useState(false);

    const handleSearchButtonClick = () => {
      setDialogOpen(!isDialogOpen);
    };

    return (
        <main>
           <Navbar onSearchButtonClick={handleSearchButtonClick} />
           <SearchDialogModal isOpen={isDialogOpen} onClose={setDialogOpen} />
           <Dashboard />
        </main>
    );
}