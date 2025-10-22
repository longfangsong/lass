import { Link } from "react-router";
import { useState } from "react";
import {
  CalendarSync,
  CircleCheckBig,
  CloudOff,
  Menu,
  RefreshCcw,
  CloudDownload,
  X,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@app/shared/presentation/components/ui/navigation-menu";
import { Button } from "@app/shared/presentation/components/ui/button";
import { Separator } from "./ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useAuth } from "../hooks/useAuth";
import { useOnline } from "../hooks/useOnline";
import { useAtomValue } from "jotai";
import { ModeToggle } from "./modeToggle";
import { syncState } from "@/app/sync/presentation/atoms";
import { useSyncService } from "@/app/sync/presentation/hooks";
import { isDownloading, isSyncing, isIdle, isUnknown } from "@/app/sync/domain/types";

function SignInButton() {
  return (
    <Button asChild>
      <Link to="/auth/login">Sign In</Link>
    </Button>
  );
}

function SignOutButton() {
  return (
    <Button asChild>
      {/* Do not use `Link` here - won't redirect to backend */}
      <a href="/api/auth/logout">Sign Out</a>
    </Button>
  );
}

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const online = useOnline();
  const { user, loading } = useAuth();
  const currentSyncState = useAtomValue(syncState);
  const syncService = useSyncService();

  const triggerSync = async () => {
    // Trigger sync for all tables
    await Promise.all([
      syncService.syncNow("Article"),
      syncService.syncNow("Word"),
      syncService.syncNow("WordIndex"),
      syncService.syncNow("Lexeme"),
      syncService.syncNow("WordBookEntry"),
      syncService.syncNow("UserSettings"),
    ]);
  };

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
          className="flex-1 norse-bold text-2xl font-bold text-foreground hover:text-foreground/80"
        >
          Läss
        </Link>

        {/* Desktop Navigation - hidden on small screens */}
        <div className="flex-1 justify-center hidden sm:flex">
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
                          to="/wordbook/all"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          View All
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/wordbook/review"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          Do Review
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link to="/settings">Settings</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side controls */}
        <div className="flex-1 flex justify-end items-center gap-2">
          {online && user && <SignOutButton />}
          {online && user === null && !loading && <SignInButton />}
          {online && user && isUnknown(currentSyncState) && (
            <CalendarSync
              onClick={triggerSync}
            />
          )}
          {online && user && isDownloading(currentSyncState) && (
            <CloudDownload className="animate-bounce" />
          )}
          {online && user && isSyncing(currentSyncState) && (
            <RefreshCcw className="animate-spin" />
          )}
          {online && user && isIdle(currentSyncState) && (
            <CircleCheckBig
              onClick={triggerSync}
            />
          )}
          {!online && <CloudOff className="mr-1" />}
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
                className="text-foreground hover:text-foreground/80 px-3 py-2 hover:bg-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Articles
              </Link>
              <Separator />
              <Link
                to="/dictionary"
                className="text-foreground hover:text-foreground/80 px-3 py-2 hover:bg-accent transition-colors"
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
                  <AccordionContent className="ml-4 space-y-2">
                    <Link
                      to="/wordbook/all"
                      className="block text-foreground/80 hover:text-foreground py-1 px-2 hover:bg-accent transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      View All
                    </Link>
                    <Link
                      to="/wordbook/review"
                      className="block text-foreground/80 hover:text-foreground py-1 px-2 rounded-md hover:bg-accent transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Do Review
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Separator />
              <Link
                to="/settings"
                className="text-foreground hover:text-foreground/80 px-3 py-2 hover:bg-accent transition-colors flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
