import {NavbarHeader} from "@/components/navbar-header";
import {SearchDialogModal} from "@/components/search-dialog";
import {useState} from "react";

export function Navbar() {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const handleSearchButtonClick = () => {
      setDialogOpen(!isDialogOpen);
    };

    return (
        <header>
            <NavbarHeader onSearchButtonClick={handleSearchButtonClick} />
            <SearchDialogModal isOpen={isDialogOpen} onClose={setDialogOpen} />
        </header>
    );
}