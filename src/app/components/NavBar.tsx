import {
  DarkThemeToggle,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import { useAuth } from "../hooks/useAuth";
import SignOutButton from "./SignOutButton";
import SignInButton from "./SignInButton";

export default function NavBar() {
  const { user } = useAuth();
  return (
    <Navbar
      fluid
      className="items-center justify-between border-b border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
    >
      <NavbarBrand href="/">
        <span className="norse-bold self-center whitespace-nowrap text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Läss
        </span>
      </NavbarBrand>
      <div className="flex flex-row justify-between items-center gap-2 md:order-2">
        <DarkThemeToggle />
        {user ? <SignOutButton /> : <SignInButton />}
        <NavbarToggle />
      </div>
      <NavbarCollapse>
        <NavbarLink href="/articles">
          Articles
        </NavbarLink>
        <NavbarLink href="/dictionary">
          Dictionary
        </NavbarLink>
        {user && (
          <NavbarLink href="/word_book">
            Word Book
          </NavbarLink>
        )}
      </NavbarCollapse>
    </Navbar>
  );
}
