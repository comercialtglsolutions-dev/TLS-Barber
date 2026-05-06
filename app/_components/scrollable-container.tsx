"use client"

import { useRef, useState, useEffect, ReactNode } from "react"
import { ChevronRightIcon, ChevronLeftIcon } from "lucide-react"
import { Button } from "./ui/button"

interface ScrollableContainerProps {
  children: ReactNode
  maxW?: string
}

const ScrollableContainer = ({ children, maxW }: ScrollableContainerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 5)
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(checkScroll, 100)
    window.addEventListener("resize", checkScroll)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", checkScroll)
    }
  }, [children])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current
      const scrollAmount = direction === "left" ? -clientWidth : clientWidth
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="group relative w-full max-w-full">
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={`flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden ${maxW}`}
      >
        {children}
      </div>

      {showLeftArrow && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-[-20px] top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-white/10 bg-[#1A1A1A]/90 shadow-2xl backdrop-blur-md transition-all hover:bg-[#3EABFD] hover:text-white"
          onClick={() => scroll("left")}
        >
          <ChevronLeftIcon size={20} />
        </Button>
      )}

      {showRightArrow && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-[-20px] top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-white/10 bg-[#1A1A1A]/90 shadow-2xl backdrop-blur-md transition-all hover:bg-[#3EABFD] hover:text-white"
          onClick={() => scroll("right")}
        >
          <ChevronRightIcon size={20} />
        </Button>
      )}
    </div>
  )
}

export default ScrollableContainer
