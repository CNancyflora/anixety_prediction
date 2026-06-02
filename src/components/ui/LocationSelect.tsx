"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Location Data
const locationData = {
  "United States": {
    "California": ["San Francisco", "Los Angeles", "San Diego", "San Jose"],
    "New York": ["New York City", "Buffalo", "Rochester"],
    "Texas": ["Austin", "Houston", "Dallas", "San Antonio"]
  },
  "India": {
    "Andhra Pradesh": ["Chittoor", "Visakhapatnam", "Vijayawada", "Tirupati"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi"]
  },
  "United Kingdom": {
    "England": ["London", "Manchester", "Birmingham"],
    "Scotland": ["Edinburgh", "Glasgow", "Aberdeen"],
    "Wales": ["Cardiff", "Swansea", "Newport"]
  }
};

type Step = "country" | "state" | "city";

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LocationSelect({ value, onChange }: LocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("country");
  const [search, setSearch] = useState("");
  
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset flow if closed without selecting city
        if (step !== "country" && !value.includes(selectedCountry || "")) {
          setStep("country");
          setSelectedCountry(null);
          setSelectedState(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [step, value, selectedCountry]);

  // Determine what list to show
  let currentList: string[] = [];
  if (step === "country") {
    currentList = Object.keys(locationData);
  } else if (step === "state" && selectedCountry) {
    currentList = Object.keys(locationData[selectedCountry as keyof typeof locationData]);
  } else if (step === "city" && selectedCountry && selectedState) {
    currentList = locationData[selectedCountry as keyof typeof locationData][selectedState as keyof typeof locationData[string]] || [];
  }

  const filteredList = currentList.filter(item => item.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (item: string) => {
    setSearch("");
    if (step === "country") {
      setSelectedCountry(item);
      setStep("state");
    } else if (step === "state") {
      setSelectedState(item);
      setStep("city");
    } else if (step === "city") {
      const fullLocation = `${item}, ${selectedState}, ${selectedCountry}`;
      onChange(fullLocation);
      setIsOpen(false);
      
      // Reset for next time they open
      setTimeout(() => {
        setStep("country");
        setSelectedCountry(null);
        setSelectedState(null);
      }, 300);
    }
  };

  const getStepTitle = () => {
    if (step === "country") return "Select Country";
    if (step === "state") return `Select State/Region in ${selectedCountry}`;
    return `Select City in ${selectedState}`;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && value) {
            setStep("country");
            setSelectedCountry(null);
            setSelectedState(null);
            setSearch("");
          }
        }}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-all",
          isOpen ? "bg-blue-500/10 border-blue-500/50" : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
        )}
      >
        <div className="flex items-center gap-3 truncate">
          <Globe size={18} className={cn("shrink-0 transition-colors", isOpen ? "text-blue-400" : "text-slate-500")} />
          <span className={cn("truncate text-sm font-medium", !value && "text-slate-500")}>
            {value || "Search for a location..."}
          </span>
        </div>
        <ChevronDown size={18} className={cn("shrink-0 text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl shadow-black/50"
          >
            <div className="border-b border-white/5 p-3">
              <div className="flex items-center gap-2 mb-3 px-1">
                {step !== "country" && (
                  <button 
                    onClick={() => {
                      setSearch("");
                      if (step === "city") setStep("state");
                      if (step === "state") setStep("country");
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex-1 text-center">
                  {getStepTitle()}
                </span>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {item}
                    <ChevronDown size={14} className="-rotate-90 text-slate-500 opacity-50" />
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  No results found.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
