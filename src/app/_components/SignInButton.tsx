'use client'

import { Button } from "flowbite-react";

export default function SignIn() {
  return (
    <Button onClick={() => window.location.href = '/api/auth/github/login'}>
      Sign In
    </Button>
  );
}
