import { Link } from "react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/app/presentation/components/ui/navigation-menu";
import { cn } from "@/app/presentation/lib/utils";
import { ModeToggle } from "./ModeToggle";
import { Button } from "@/app/presentation/components/ui/button";
import { Separator } from "./ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-background sticky top-0 z-50 w-full border-b">
      {/* Desktop and mobile header */}
      <div className="h-14 pr-4 sm:pr-6 pl-4 flex items-center justify-between">
        {/* Logo - always visible */}
        <Link
          to="/"
          className={cn(
            "norse-bold text-2xl font-bold text-foreground hover:text-foreground/80",
          )}
        >
          Läss
        </Link>

        {/* Desktop Navigation - hidden on small screens */}
        <div className="hidden sm:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link to="/articles">Articles</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link to="/dictionary">Dictionary</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Words</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-4 p-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/words/all"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          View All
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/words/review"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          Do Review
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Theme toggle - always visible */}
          <ModeToggle />

          {/* Mobile menu button - only visible on small screens */}
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu - only visible when menu is open and on small screens */}
      {isMenuOpen && (
        <div className="sm:hidden bg-background border-t">
          <nav className="container mx-auto">
            <div className="flex flex-col">
              <Link
                to="/articles"
                className="text-foreground hover:text-foreground/80 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Articles
              </Link>
              <Separator />
              <Link
                to="/dictionary"
                className="text-foreground hover:text-foreground/80 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dictionary
              </Link>
              <Separator />
              <Accordion type="single" collapsible>
                <AccordionItem value="words">
                  <AccordionTrigger className="px-3 py-2 text-md font-normal">
                    Words
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="ml-4 space-y-2">
                      <Link
                        to="/words/all"
                        className="block text-foreground/80 hover:text-foreground py-1 px-2 rounded-md hover:bg-accent transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        View All
                      </Link>
                      <Link
                        to="/words/review"
                        className="block text-foreground/80 hover:text-foreground py-1 px-2 rounded-md hover:bg-accent transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Do Review
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
