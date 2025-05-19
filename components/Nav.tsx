"use client";

import { useLayoutEffect, useState } from "react";
import { Button } from "./ui/button";
import { Moon, Sun, Wand2, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Nav = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const el = document.documentElement;

    if (el.classList.contains("dark")) {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, []);

  const toggleDark = () => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div
      className={
        "px-4 py-2 flex items-center h-14 z-50 bg-card border-b border-border"
      }
    >
      <div className="flex items-center gap-1">
        
        <Button
          variant={pathname === "/sarcasm-detector" ? "default" : "ghost"}
          size="sm"
          asChild
          className="flex items-center gap-1.5"
        >
          <Link href="/sarcasm-detector">
            <Wand2 className="size-4" /> 
            Sarcasm Detector
          </Link>
        </Button>
        <Button
          variant={pathname === "/sarcasm-creator" ? "default" : "ghost"}
          size="sm"
          asChild
          className="flex items-center gap-1.5"
        >
          <Link href="/sarcasm-creator">
            <MessageSquarePlus className="size-4" /> 
            Sarcasm Creator
          </Link>
        </Button>

        <Button
          variant={pathname === "/sarcasm-voice" ? "default" : "ghost"}
          size="sm"
          asChild
          className="flex items-center gap-1.5"
        >
          <Link href="/sarcasm-voice">
            <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 9v2"></path>
              <path d="M5 9v8"></path>
              <path d="M15 9v6"></path>
              <path d="M8 9v4"></path>
              <path d="M12 9v7"></path>
            </svg>
            Sarcasm Voice
          </Link>
        </Button>
      </div>

      <div className={"ml-auto flex items-center gap-1"}>
        <Button
          onClick={toggleDark}
          variant={"ghost"}
          className={"ml-auto flex items-center gap-1.5"}
        >
          <span>
            {isDarkMode ? (
              <Sun className={"size-4"} />
            ) : (
              <Moon className={"size-4"} />
            )}
          </span>
          <span>{isDarkMode ? "Light" : "Dark"} Mode</span>
        </Button>
      </div>
    </div>
  );
};
