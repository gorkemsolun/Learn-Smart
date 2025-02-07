import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type FlashcardComponentProps = {
  flashcards: string[];
  explanations: string[];
};

export default function FlashcardComponent({ flashcards, explanations }: FlashcardComponentProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => setFlipped(!flipped);
  const nextCard = () => {
    setIndex((prev) => (prev + 1) % flashcards.length);
    setFlipped(false);
  };
  const prevCard = () => {
    setIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setFlipped(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="flex items-center gap-4">
        <Button onClick={prevCard} variant="outline">
          <ChevronLeft size={24} />
        </Button>
        <motion.div
          className="w-80 h-48 perspective cursor-pointer"
          onClick={handleFlip}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            className="relative w-full h-full"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <Card className="absolute w-full h-full flex items-center justify-center shadow-lg text-xl font-bold p-4 rounded-2xl" style={{ backfaceVisibility: "hidden" }}>
              {flashcards[index]}
            </Card>
            <Card className="absolute w-full h-full flex items-center justify-center shadow-lg text-sm p-4 rounded-2xl" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
              <div>{explanations[index]}</div>
            </Card>
          </motion.div>
        </motion.div>
        <Button onClick={nextCard} variant="outline">
          <ChevronRight size={24} />
        </Button>
      </div>
    </div>
  );
}