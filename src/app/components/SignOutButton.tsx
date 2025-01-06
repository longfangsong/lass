import { Button } from "flowbite-react";

export default function SignOutButton() {
  return (
    <Button onClick={() => window.location.href = '/api/auth/logout'}>
      Sign Out
    </Button>
  );
}
