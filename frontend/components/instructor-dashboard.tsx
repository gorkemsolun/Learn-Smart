"use client"
import * as React from "react";
import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent } from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {PlusCircledIcon, TrashIcon} from "@radix-ui/react-icons";

export default function InstructorDashboard() {
  const cardData = [
    {
      title: "Card 1",
      description: "This is card 1 description.",
      content: "Content for card 1.",
      footer: "Footer for card 1"
    },
    {
      title: "Card 2",
      description: "This is card 2 description.",
      content: "Content for card 2.",
      footer: "Footer for card 2"
    },
    {
      title: "Card 3",
      description: "This is card 3 description.",
      content: "Content for card 3.",
      footer: "Footer for card 3"
    },
    {
      title: "Card 4",
      description: "This is card 4 description.",
      content: "Content for card 4.",
      footer: "Footer for card 4"
    }
  ];

  const studyData = [
    { label: "CS342", onClick: () => alert("Button 1 clicked") },
    { label: "Deep Learning", onClick: () => alert("Button 2 clicked") },
  ];

  return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {cardData.map((card, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{card.content}</p>
                </CardContent>
                <CardFooter>
                  <p>{card.footer}</p>
                </CardFooter>
              </Card>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4 min-h-[55lvh]">
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Big Card</CardTitle>
              <CardDescription>This is the big card on the left.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content for the big card.</p>
            </CardContent>
            <CardFooter>
              <p>Footer for the big card</p>
            </CardFooter>
          </Card>

          <Card className="col-span-2 overflow-auto">
            <div className="flex items-center justify-between p-6">
              <CardTitle>Your Studies</CardTitle>
              <Button
                  className="bg-none bg-transparent shadow-none hover:text-foreground/40 hover:bg-transparent text-foreground flex items-center">
                <PlusCircledIcon/>
              </Button>
            </div>

            <CardContent>
              <div className="mt-4 space-y-4">
                {studyData.map((button, index) => (
                    <div
                        key={index}
                        className="flex justify-between items-center"
                    >
                      <Button
                          onClick={button.onClick}
                          className="w-full"
                      >
                        {button.label}
                      </Button>
                      <Button
                          className="bg-transparent shadow-none hover:text-foreground/40 hover:bg-transparent text-foreground"
                      >
                        <TrashIcon/>
                      </Button>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
