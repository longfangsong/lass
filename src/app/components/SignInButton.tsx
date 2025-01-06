import { Button } from "flowbite-react";

export default function SignInButton() {
  return (
    <Button onClick={() => window.location.href = '/auth/login'}>
      Sign In
    </Button>
  );
}
